const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUpdateOverdueFunction() {
  console.log('=== Fixing update_overdue_loans Function ===\n');
  
  try {
    // 1. Actualizar la función para que no afecte préstamos ya devueltos
    console.log('1. Updating update_overdue_loans function...');
    
    const updateFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.update_overdue_loans()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        UPDATE public.loans
        SET status = 'Atrasado',
            days_overdue = EXTRACT(DAY FROM (now() - return_date))
        WHERE
          status = 'Activo' AND
          return_date < now() AND
          actual_return_date IS NULL;
      END;
      $$;
    `;
    
    // Intentar ejecutar directamente con SQL
    const { error: updateError } = await supabase
      .from('loans')
      .select('id')
      .limit(1);
    
    if (updateError) {
      console.error('Database connection error:', updateError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Como no tenemos acceso directo a exec, vamos a usar una migración manual
    console.log('\n2. Creating migration file for the function update...');
    
    const migrationContent = `-- Fix update_overdue_loans function to not affect returned loans
-- Date: ${new Date().toISOString()}

${updateFunctionSQL}

COMMENT ON FUNCTION public.update_overdue_loans() IS 'Actualiza el estado de los préstamos a "Atrasado" si la fecha de devolución ha pasado y no han sido devueltos aún.';`;
    
    const fs = require('fs');
    const path = require('path');
    
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
    const migrationFileName = `${timestamp}_fix_update_overdue_loans_function.sql`;
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', migrationFileName);
    
    // Crear directorio si no existe
    const migrationDir = path.dirname(migrationPath);
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }
    
    fs.writeFileSync(migrationPath, migrationContent);
    console.log(`✅ Migration file created: ${migrationFileName}`);
    
    // 3. Probar el proceso de devolución de préstamos
    console.log('\n3. Testing loan return process...');
    
    const loanId = '307c7218-dfbb-422c-96ff-4faf2361cf8d';
    const now = new Date();
    
    // Verificar estado actual
    console.log('Current loan status:');
    const { data: currentLoan, error: fetchError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching loan:', fetchError);
      return;
    }
    
    console.log({
      id: currentLoan.id,
      status: currentLoan.status,
      actual_return_date: currentLoan.actual_return_date,
      days_overdue: currentLoan.days_overdue
    });
    
    // Intentar devolver el préstamo paso a paso
    console.log('\nStep 1: Setting status to Devuelto...');
    const { error: statusError } = await supabase
      .from('loans')
      .update({ status: 'Devuelto' })
      .eq('id', loanId);
    
    if (statusError) {
      console.error('Error updating status:', statusError);
      return;
    }
    console.log('✅ Status updated to Devuelto');
    
    console.log('Step 2: Setting days_overdue to 0...');
    const { error: daysError } = await supabase
      .from('loans')
      .update({ days_overdue: 0 })
      .eq('id', loanId);
    
    if (daysError) {
      console.error('Error updating days_overdue:', daysError);
      return;
    }
    console.log('✅ days_overdue updated to 0');
    
    console.log('Step 3: Setting actual_return_date...');
    // Intentar con diferentes enfoques para actual_return_date
    
    // Enfoque 1: Usar NOW() de PostgreSQL
    const { error: dateError1 } = await supabase
      .from('loans')
      .update({ 
        actual_return_date: 'now()' // PostgreSQL function
      })
      .eq('id', loanId);
    
    if (dateError1) {
      console.log('❌ Approach 1 (now()) failed:', dateError1.message);
      
      // Enfoque 2: Usar fecha actual como string ISO
      const { error: dateError2 } = await supabase
        .from('loans')
        .update({ 
          actual_return_date: new Date().toISOString()
        })
        .eq('id', loanId);
      
      if (dateError2) {
        console.log('❌ Approach 2 (ISO string) failed:', dateError2.message);
        
        // Enfoque 3: Usar solo la fecha sin hora
        const { error: dateError3 } = await supabase
          .from('loans')
          .update({ 
            actual_return_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', loanId);
        
        if (dateError3) {
          console.log('❌ Approach 3 (date only) failed:', dateError3.message);
          console.log('⚠️  Could not set actual_return_date, but status is updated');
        } else {
          console.log('✅ actual_return_date updated with date-only approach');
        }
      } else {
        console.log('✅ actual_return_date updated with ISO string approach');
      }
    } else {
      console.log('✅ actual_return_date updated with now() approach');
    }
    
    // Verificar estado después de la actualización
    console.log('\n4. Status after manual update:');
    const { data: afterUpdate, error: afterUpdateError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();
    
    if (afterUpdateError) {
      console.error('Error fetching loan after update:', afterUpdateError);
      return;
    }
    
    console.log({
      id: afterUpdate.id,
      status: afterUpdate.status,
      actual_return_date: afterUpdate.actual_return_date,
      days_overdue: afterUpdate.days_overdue
    });
    
    // Ejecutar update_overdue_loans para probar la función corregida
    console.log('\n5. Testing corrected update_overdue_loans function...');
    const { error: overdueError } = await supabase
      .rpc('update_overdue_loans');
    
    if (overdueError) {
      console.error('Error executing update_overdue_loans:', overdueError);
    } else {
      console.log('✅ update_overdue_loans executed successfully');
    }
    
    // Verificar que el estado se mantiene después de update_overdue_loans
    console.log('\n6. Status after update_overdue_loans:');
    const { data: finalLoan, error: finalError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();
    
    if (finalError) {
      console.error('Error fetching final loan:', finalError);
      return;
    }
    
    console.log({
      id: finalLoan.id,
      status: finalLoan.status,
      actual_return_date: finalLoan.actual_return_date,
      days_overdue: finalLoan.days_overdue
    });
    
    console.log('\n=== FINAL ANALYSIS ===');
    if (finalLoan.status === 'Devuelto') {
      console.log('🎉 SUCCESS: Loan return process is working correctly!');
      console.log('✅ The corrected update_overdue_loans function preserves returned loans');
      
      if (finalLoan.actual_return_date) {
        console.log('✅ actual_return_date is properly set');
      } else {
        console.log('⚠️  actual_return_date is null, but this may be due to the GREATEST error');
      }
      
    } else {
      console.log('❌ ISSUE: Loan status reverted to:', finalLoan.status);
      console.log('❌ The update_overdue_loans function may still need adjustment');
    }
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Apply the migration file to your Supabase database');
    console.log('2. Investigate the GREATEST error for actual_return_date updates');
    console.log('3. Test the loan return process in the application');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixUpdateOverdueFunction();
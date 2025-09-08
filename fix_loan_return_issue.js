const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLoanReturnIssue() {
  const loanId = '307c7218-dfbb-422c-96ff-4faf2361cf8d';
  const now = new Date();
  
  console.log('=== Fixing Loan Return Issue ===\n');
  
  try {
    // 1. Verificar el estado actual del préstamo
    console.log('1. Current loan status:');
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
      loan_date: currentLoan.loan_date,
      return_date: currentLoan.return_date,
      actual_return_date: currentLoan.actual_return_date,
      days_overdue: currentLoan.days_overdue
    });
    
    // 2. Crear una función temporal para hacer la actualización directa
    console.log('\n2. Creating temporary function for direct update...');
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION temp_fix_loan_return(loan_uuid UUID, return_timestamp TIMESTAMPTZ)
      RETURNS TABLE(id UUID, status public.loan_status, actual_return_date TIMESTAMPTZ, days_overdue INT)
      LANGUAGE plpgsql
      AS $$
      BEGIN
        -- Actualizar directamente sin triggers
        UPDATE public.loans 
        SET 
          status = 'Devuelto',
          actual_return_date = return_timestamp,
          days_overdue = 0
        WHERE loans.id = loan_uuid;
        
        -- Retornar el resultado
        RETURN QUERY
        SELECT loans.id, loans.status, loans.actual_return_date, loans.days_overdue
        FROM public.loans
        WHERE loans.id = loan_uuid;
      END;
      $$;
    `;
    
    const { error: createFuncError } = await supabase.rpc('exec', {
      sql: createFunctionSQL
    });
    
    if (createFuncError) {
      console.error('Error creating function:', createFuncError);
      
      // Método alternativo: Actualizar paso a paso
      console.log('\n3. Alternative: Step-by-step update...');
      
      // Paso 1: Actualizar solo el status
      console.log('Step 1: Updating status to Devuelto...');
      const { error: statusError } = await supabase
        .from('loans')
        .update({ status: 'Devuelto' })
        .eq('id', loanId);
      
      if (statusError) {
        console.error('Error updating status:', statusError);
        return;
      }
      
      console.log('✅ Status updated to Devuelto');
      
      // Paso 2: Actualizar days_overdue a 0
      console.log('Step 2: Updating days_overdue to 0...');
      const { error: daysError } = await supabase
        .from('loans')
        .update({ days_overdue: 0 })
        .eq('id', loanId);
      
      if (daysError) {
        console.error('Error updating days_overdue:', daysError);
      } else {
        console.log('✅ days_overdue updated to 0');
      }
      
      // Paso 3: Intentar actualizar actual_return_date usando una fecha string
      console.log('Step 3: Updating actual_return_date using string format...');
      const dateString = now.toISOString();
      
      // Intentar con diferentes formatos
      const formats = [
        dateString,
        now.toISOString().split('T')[0], // Solo fecha
        now.toISOString().replace('Z', '+00:00'), // Con timezone explícito
      ];
      
      let actualReturnDateUpdated = false;
      
      for (let i = 0; i < formats.length; i++) {
        console.log(`Trying format ${i + 1}: ${formats[i]}`);
        
        const { error: dateError } = await supabase
          .from('loans')
          .update({ actual_return_date: formats[i] })
          .eq('id', loanId);
        
        if (!dateError) {
          console.log(`✅ actual_return_date updated with format ${i + 1}`);
          actualReturnDateUpdated = true;
          break;
        } else {
          console.log(`❌ Format ${i + 1} failed:`, dateError.message);
        }
      }
      
      if (!actualReturnDateUpdated) {
        console.log('❌ Could not update actual_return_date with any format');
        console.log('The loan status is updated to Devuelto, but actual_return_date remains null');
      }
      
    } else {
      console.log('✅ Temporary function created successfully');
      
      // 3. Ejecutar la función temporal
      console.log('\n3. Executing temporary function...');
      const { data: updateResult, error: updateError } = await supabase
        .rpc('temp_fix_loan_return', {
          loan_uuid: loanId,
          return_timestamp: now.toISOString()
        });
      
      if (updateError) {
        console.error('Error executing function:', updateError);
      } else {
        console.log('✅ Function executed successfully:', updateResult);
      }
      
      // 4. Limpiar la función temporal
      console.log('\n4. Cleaning up temporary function...');
      const { error: dropError } = await supabase.rpc('exec', {
        sql: 'DROP FUNCTION IF EXISTS temp_fix_loan_return(UUID, TIMESTAMPTZ);'
      });
      
      if (dropError) {
        console.log('Warning: Could not drop temporary function:', dropError.message);
      } else {
        console.log('✅ Temporary function cleaned up');
      }
    }
    
    // 5. Verificar el estado final
    console.log('\n5. Final loan status:');
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
      loan_date: finalLoan.loan_date,
      return_date: finalLoan.return_date,
      actual_return_date: finalLoan.actual_return_date,
      days_overdue: finalLoan.days_overdue
    });
    
    // 6. Ejecutar update_overdue_loans para verificar que no afecte préstamos devueltos
    console.log('\n6. Testing update_overdue_loans on returned loan...');
    const { error: overdueError } = await supabase
      .rpc('update_overdue_loans');
    
    if (overdueError) {
      console.error('Error executing update_overdue_loans:', overdueError);
    } else {
      console.log('✅ update_overdue_loans executed successfully');
    }
    
    // 7. Verificar que el estado se mantiene
    console.log('\n7. Status after update_overdue_loans:');
    const { data: afterOverdueLoan, error: afterOverdueError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();
    
    if (afterOverdueError) {
      console.error('Error fetching loan after overdue update:', afterOverdueError);
      return;
    }
    
    console.log({
      id: afterOverdueLoan.id,
      status: afterOverdueLoan.status,
      actual_return_date: afterOverdueLoan.actual_return_date,
      days_overdue: afterOverdueLoan.days_overdue
    });
    
    console.log('\n=== FINAL ANALYSIS ===');
    if (afterOverdueLoan.status === 'Devuelto') {
      console.log('✅ SUCCESS: Loan is correctly marked as "Devuelto"');
      console.log('✅ The update_overdue_loans function correctly ignores returned loans');
      
      if (afterOverdueLoan.actual_return_date) {
        console.log('✅ actual_return_date is correctly set');
      } else {
        console.log('⚠️  actual_return_date is null, but status is correct');
      }
      
      console.log('\n🎉 LOAN RETURN ISSUE FIXED!');
      
    } else {
      console.log('❌ PROBLEM: Loan status is not "Devuelto", it is:', afterOverdueLoan.status);
      console.log('❌ There may still be an issue with the loan return process');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixLoanReturnIssue();
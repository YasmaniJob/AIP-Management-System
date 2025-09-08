const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateLoansTableStructure() {
  console.log('=== Investigando Estructura de la Tabla Loans ===\n');
  
  try {
    // 1. Obtener información de la tabla loans
    console.log('1. Estructura de la tabla loans:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('loans')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing loans table:', tableError);
      return;
    }
    
    if (tableInfo && tableInfo.length > 0) {
      console.log('Columnas disponibles:', Object.keys(tableInfo[0]));
      console.log('Ejemplo de registro:', tableInfo[0]);
    } else {
      console.log('La tabla loans está vacía');
    }
    
    // 2. Intentar obtener información del esquema usando información_schema
    console.log('\n2. Información del esquema de la tabla loans:');
    
    // Intentar consultar información de columnas
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = 'loans' 
            AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (columnError) {
      console.log('No se puede acceder a information_schema:', columnError.message);
    } else {
      console.log('Información de columnas:', columnInfo);
    }
    
    // 3. Buscar triggers en la tabla loans
    console.log('\n3. Buscando triggers en la tabla loans:');
    
    const { data: triggerInfo, error: triggerError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_timing,
            action_statement
          FROM information_schema.triggers 
          WHERE event_object_table = 'loans'
            AND event_object_schema = 'public';
        `
      });
    
    if (triggerError) {
      console.log('No se puede acceder a información de triggers:', triggerError.message);
    } else {
      if (triggerInfo && triggerInfo.length > 0) {
        console.log('Triggers encontrados:', triggerInfo);
      } else {
        console.log('No se encontraron triggers en la tabla loans');
      }
    }
    
    // 4. Buscar constraints en la tabla loans
    console.log('\n4. Buscando constraints en la tabla loans:');
    
    const { data: constraintInfo, error: constraintError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            constraint_name,
            constraint_type,
            check_clause
          FROM information_schema.table_constraints tc
          LEFT JOIN information_schema.check_constraints cc
            ON tc.constraint_name = cc.constraint_name
          WHERE tc.table_name = 'loans'
            AND tc.table_schema = 'public';
        `
      });
    
    if (constraintError) {
      console.log('No se puede acceder a información de constraints:', constraintError.message);
    } else {
      if (constraintInfo && constraintInfo.length > 0) {
        console.log('Constraints encontrados:', constraintInfo);
      } else {
        console.log('No se encontraron constraints especiales en la tabla loans');
      }
    }
    
    // 5. Buscar funciones que mencionen 'loans' y 'GREATEST'
    console.log('\n5. Buscando funciones que usen GREATEST con loans:');
    
    const { data: functionInfo, error: functionError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            routine_name,
            routine_definition
          FROM information_schema.routines 
          WHERE routine_schema = 'public'
            AND (routine_definition ILIKE '%loans%' 
                 AND routine_definition ILIKE '%GREATEST%');
        `
      });
    
    if (functionError) {
      console.log('No se puede acceder a información de funciones:', functionError.message);
    } else {
      if (functionInfo && functionInfo.length > 0) {
        console.log('Funciones que usan GREATEST con loans:', functionInfo);
      } else {
        console.log('No se encontraron funciones que usen GREATEST con loans');
      }
    }
    
    // 6. Probar una actualización simple para reproducir el error
    console.log('\n6. Probando actualización simple para reproducir el error:');
    
    const loanId = '307c7218-dfbb-422c-96ff-4faf2361cf8d';
    
    // Intentar actualizar solo notes (debería funcionar)
    console.log('Probando actualización de notes...');
    const { error: notesError } = await supabase
      .from('loans')
      .update({ notes: 'Test update - ' + new Date().toISOString() })
      .eq('id', loanId);
    
    if (notesError) {
      console.log('❌ Error al actualizar notes:', notesError.message);
    } else {
      console.log('✅ Actualización de notes exitosa');
    }
    
    // Intentar actualizar actual_return_date (debería fallar)
    console.log('Probando actualización de actual_return_date...');
    const { error: dateError } = await supabase
      .from('loans')
      .update({ actual_return_date: new Date().toISOString() })
      .eq('id', loanId);
    
    if (dateError) {
      console.log('❌ Error al actualizar actual_return_date:', dateError.message);
      console.log('Detalles del error:', dateError);
    } else {
      console.log('✅ Actualización de actual_return_date exitosa');
    }
    
    // 7. Verificar el estado actual del préstamo
    console.log('\n7. Estado actual del préstamo:');
    const { data: currentLoan, error: fetchError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching loan:', fetchError);
    } else {
      console.log({
        id: currentLoan.id,
        status: currentLoan.status,
        loan_date: currentLoan.loan_date,
        return_date: currentLoan.return_date,
        actual_return_date: currentLoan.actual_return_date,
        days_overdue: currentLoan.days_overdue,
        notes: currentLoan.notes
      });
    }
    
    console.log('\n=== ANÁLISIS COMPLETADO ===');
    console.log('\n📋 RESUMEN:');
    console.log('- La tabla loans existe y es accesible');
    console.log('- El error GREATEST ocurre específicamente al actualizar actual_return_date');
    console.log('- Necesitamos investigar si hay triggers automáticos o funciones ocultas');
    
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

investigateLoansTableStructure();
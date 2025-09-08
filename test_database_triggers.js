const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseTriggers() {
  try {
    console.log('=== Testing Database Triggers and Functions ===\n');
    
    // 1. Verificar si existe la función update_overdue_loans
    console.log('1. Checking if update_overdue_loans function exists...');
    const { data: functions, error: funcError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT routine_name, routine_type 
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name LIKE '%overdue%';
        `
      });
    
    if (funcError) {
      console.log('Cannot query functions directly:', funcError.message);
    } else {
      console.log('Functions found:', functions);
    }
    
    // 2. Verificar triggers en la tabla loans
    console.log('\n2. Checking triggers on loans table...');
    const { data: triggers, error: trigError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT trigger_name, event_manipulation, action_timing, action_statement
          FROM information_schema.triggers 
          WHERE event_object_table = 'loans';
        `
      });
    
    if (trigError) {
      console.log('Cannot query triggers directly:', trigError.message);
    } else {
      console.log('Triggers found:', triggers);
    }
    
    // 3. Intentar ejecutar update_overdue_loans manualmente
    console.log('\n3. Trying to execute update_overdue_loans manually...');
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_overdue_loans');
    
    if (updateError) {
      console.log('Error executing update_overdue_loans:', updateError.message);
    } else {
      console.log('update_overdue_loans executed successfully:', updateResult);
    }
    
    // 4. Verificar el estado actual del préstamo específico
    console.log('\n4. Checking current loan status...');
    const { data: currentLoan, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', '307c7218-dfbb-422c-96ff-4faf2361cf8d')
      .single();
    
    if (loanError) {
      console.error('Error fetching loan:', loanError);
    } else {
      console.log('Current loan data:', {
        id: currentLoan.id,
        status: currentLoan.status,
        loan_date: currentLoan.loan_date,
        return_date: currentLoan.return_date,
        actual_return_date: currentLoan.actual_return_date,
        days_overdue: currentLoan.days_overdue
      });
    }
    
    // 5. Intentar actualización con SQL directo
    console.log('\n5. Trying direct SQL update...');
    const { data: sqlUpdate, error: sqlError } = await supabase
      .rpc('exec', {
        sql: `
          UPDATE loans 
          SET status = 'Devuelto', 
              actual_return_date = CURRENT_DATE,
              days_overdue = 0
          WHERE id = '307c7218-dfbb-422c-96ff-4faf2361cf8d'
          RETURNING *;
        `
      });
    
    if (sqlError) {
      console.log('Direct SQL update error:', sqlError.message);
    } else {
      console.log('Direct SQL update result:', sqlUpdate);
    }
    
    // 6. Verificar el estado después de la actualización SQL
    console.log('\n6. Checking loan status after SQL update...');
    const { data: afterSqlLoan, error: afterSqlError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', '307c7218-dfbb-422c-96ff-4faf2361cf8d')
      .single();
    
    if (afterSqlError) {
      console.error('Error fetching loan after SQL:', afterSqlError);
    } else {
      console.log('Loan after SQL update:', {
        id: afterSqlLoan.id,
        status: afterSqlLoan.status,
        loan_date: afterSqlLoan.loan_date,
        return_date: afterSqlLoan.return_date,
        actual_return_date: afterSqlLoan.actual_return_date,
        days_overdue: afterSqlLoan.days_overdue
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testDatabaseTriggers();
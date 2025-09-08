const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReturnWithoutDaysOverdue() {
  const loanId = '307c7218-dfbb-422c-96ff-4faf2361cf8d';
  const now = new Date();
  
  console.log('=== Testing Loan Return WITHOUT days_overdue ===\n');
  
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
    
    // 2. Intentar devolver el préstamo SIN actualizar days_overdue
    console.log('\n2. Attempting to return loan WITHOUT updating days_overdue...');
    const { data: returnData, error: returnError } = await supabase
      .from('loans')
      .update({ 
        status: 'Devuelto',
        actual_return_date: now.toISOString()
        // NO incluimos days_overdue para evitar el error de tipos
      })
      .eq('id', loanId)
      .select();
    
    if (returnError) {
      console.error('Error returning loan:', returnError);
      return;
    }
    
    console.log('Loan return update executed successfully:', returnData);
    
    // 3. Verificar el estado inmediatamente después
    console.log('\n3. Status immediately after return:');
    const { data: afterReturnLoan, error: afterReturnError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();
    
    if (afterReturnError) {
      console.error('Error fetching loan after return:', afterReturnError);
      return;
    }
    
    console.log({
      id: afterReturnLoan.id,
      status: afterReturnLoan.status,
      loan_date: afterReturnLoan.loan_date,
      return_date: afterReturnLoan.return_date,
      actual_return_date: afterReturnLoan.actual_return_date,
      days_overdue: afterReturnLoan.days_overdue
    });
    
    // 4. Ejecutar update_overdue_loans para ver si afecta el préstamo devuelto
    console.log('\n4. Executing update_overdue_loans after return...');
    const { error: overdueError } = await supabase
      .rpc('update_overdue_loans');
    
    if (overdueError) {
      console.error('Error executing update_overdue_loans:', overdueError);
    } else {
      console.log('update_overdue_loans executed successfully');
    }
    
    // 5. Verificar el estado final
    console.log('\n5. Final loan status after update_overdue_loans:');
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
    
    // 6. Análisis del resultado
    console.log('\n=== ANALYSIS ===');
    if (finalLoan.status === 'Devuelto') {
      console.log('✅ SUCCESS: Loan status remains "Devuelto"');
      console.log('✅ The update_overdue_loans function correctly ignores returned loans');
      
      if (finalLoan.actual_return_date) {
        console.log('✅ actual_return_date is correctly set');
      } else {
        console.log('❌ actual_return_date is missing');
      }
      
    } else {
      console.log('❌ PROBLEM: Loan status changed from "Devuelto" to:', finalLoan.status);
      console.log('❌ There may be a trigger or function interfering with returned loans');
    }
    
    // 7. Intentar actualizar days_overdue por separado
    console.log('\n6. Attempting to update days_overdue separately...');
    const { error: daysOverdueError } = await supabase
      .from('loans')
      .update({ days_overdue: 0 })
      .eq('id', loanId);
    
    if (daysOverdueError) {
      console.error('Error updating days_overdue:', daysOverdueError);
      console.log('❌ There is a trigger or constraint causing the GREATEST type error');
    } else {
      console.log('✅ days_overdue updated successfully to 0');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testReturnWithoutDaysOverdue();
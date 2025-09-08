const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFutureReturnDate() {
  const loanId = '307c7218-dfbb-422c-96ff-4faf2361cf8d';
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // 7 días en el futuro
  const now = new Date();
  
  console.log('=== Testing Loan Return with Future Return Date ===\n');
  
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
    
    // 2. Actualizar la fecha de devolución esperada a una fecha futura
    console.log('\n2. Updating return_date to future date:', futureDate.toISOString());
    const { error: updateReturnDateError } = await supabase
      .from('loans')
      .update({ 
        return_date: futureDate.toISOString(),
        status: 'Activo' // Asegurar que esté activo
      })
      .eq('id', loanId);
    
    if (updateReturnDateError) {
      console.error('Error updating return_date:', updateReturnDateError);
      return;
    }
    
    console.log('Return date updated successfully');
    
    // 3. Ejecutar update_overdue_loans para ver si afecta el préstamo
    console.log('\n3. Executing update_overdue_loans...');
    const { error: updateOverdueError } = await supabase
      .rpc('update_overdue_loans');
    
    if (updateOverdueError) {
      console.error('Error executing update_overdue_loans:', updateOverdueError);
    } else {
      console.log('update_overdue_loans executed successfully');
    }
    
    // 4. Verificar el estado después de update_overdue_loans
    console.log('\n4. Status after update_overdue_loans:');
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
      loan_date: afterOverdueLoan.loan_date,
      return_date: afterOverdueLoan.return_date,
      actual_return_date: afterOverdueLoan.actual_return_date,
      days_overdue: afterOverdueLoan.days_overdue
    });
    
    // 5. Ahora intentar devolver el préstamo
    console.log('\n5. Attempting to return the loan...');
    const { error: returnError } = await supabase
      .from('loans')
      .update({ 
        status: 'Devuelto',
        actual_return_date: now.toISOString(),
        days_overdue: 0
      })
      .eq('id', loanId);
    
    if (returnError) {
      console.error('Error returning loan:', returnError);
      return;
    }
    
    console.log('Loan return update executed');
    
    // 6. Ejecutar update_overdue_loans nuevamente para ver si afecta el préstamo devuelto
    console.log('\n6. Executing update_overdue_loans after return...');
    const { error: finalOverdueError } = await supabase
      .rpc('update_overdue_loans');
    
    if (finalOverdueError) {
      console.error('Error executing final update_overdue_loans:', finalOverdueError);
    } else {
      console.log('Final update_overdue_loans executed successfully');
    }
    
    // 7. Verificar el estado final
    console.log('\n7. Final loan status:');
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
    
    // Análisis del resultado
    console.log('\n=== ANALYSIS ===');
    if (finalLoan.status === 'Devuelto') {
      console.log('✅ SUCCESS: Loan status is correctly set to "Devuelto"');
      console.log('✅ The update_overdue_loans function does not affect returned loans');
    } else {
      console.log('❌ PROBLEM: Loan status is not "Devuelto", it is:', finalLoan.status);
      console.log('❌ The update_overdue_loans function may be interfering with returned loans');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testFutureReturnDate();
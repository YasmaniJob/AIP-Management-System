const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMinimalUpdate() {
  const loanId = '307c7218-dfbb-422c-96ff-4faf2361cf8d';
  
  console.log('=== Testing Minimal Updates to Identify Problem ===\n');
  
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
      notes: currentLoan.notes,
      actual_return_date: currentLoan.actual_return_date,
      days_overdue: currentLoan.days_overdue
    });
    
    // 2. Test 1: Actualizar solo las notas (campo que no debería tener triggers)
    console.log('\n2. Test 1: Updating only notes...');
    const { error: notesError } = await supabase
      .from('loans')
      .update({ notes: 'Test update - ' + new Date().toISOString() })
      .eq('id', loanId);
    
    if (notesError) {
      console.error('❌ Error updating notes:', notesError);
    } else {
      console.log('✅ Notes updated successfully');
    }
    
    // 3. Test 2: Actualizar solo actual_return_date
    console.log('\n3. Test 2: Updating only actual_return_date...');
    const { error: dateError } = await supabase
      .from('loans')
      .update({ actual_return_date: new Date().toISOString() })
      .eq('id', loanId);
    
    if (dateError) {
      console.error('❌ Error updating actual_return_date:', dateError);
    } else {
      console.log('✅ actual_return_date updated successfully');
    }
    
    // 4. Test 3: Actualizar solo el status (sin otros campos)
    console.log('\n4. Test 3: Updating only status...');
    const { error: statusError } = await supabase
      .from('loans')
      .update({ status: 'Devuelto' })
      .eq('id', loanId);
    
    if (statusError) {
      console.error('❌ Error updating status:', statusError);
    } else {
      console.log('✅ Status updated successfully');
    }
    
    // 5. Verificar el estado después de todas las actualizaciones
    console.log('\n5. Final status after all updates:');
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
      notes: finalLoan.notes,
      actual_return_date: finalLoan.actual_return_date,
      days_overdue: finalLoan.days_overdue
    });
    
    // 6. Test 4: Intentar actualizar days_overdue directamente
    console.log('\n6. Test 4: Updating days_overdue directly...');
    const { error: daysError } = await supabase
      .from('loans')
      .update({ days_overdue: 0 })
      .eq('id', loanId);
    
    if (daysError) {
      console.error('❌ Error updating days_overdue:', daysError);
      console.log('This confirms the GREATEST type error is in days_overdue calculation');
    } else {
      console.log('✅ days_overdue updated successfully');
    }
    
    // 7. Verificar si update_overdue_loans afecta el préstamo devuelto
    console.log('\n7. Testing update_overdue_loans on returned loan...');
    const { error: overdueError } = await supabase
      .rpc('update_overdue_loans');
    
    if (overdueError) {
      console.error('Error executing update_overdue_loans:', overdueError);
    } else {
      console.log('update_overdue_loans executed successfully');
    }
    
    // 8. Estado final después de update_overdue_loans
    console.log('\n8. Status after update_overdue_loans:');
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
      notes: afterOverdueLoan.notes,
      actual_return_date: afterOverdueLoan.actual_return_date,
      days_overdue: afterOverdueLoan.days_overdue
    });
    
    console.log('\n=== ANALYSIS ===');
    if (afterOverdueLoan.status === 'Devuelto') {
      console.log('✅ SUCCESS: Loan remains in "Devuelto" status');
    } else {
      console.log('❌ PROBLEM: Loan status changed to:', afterOverdueLoan.status);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testMinimalUpdate();
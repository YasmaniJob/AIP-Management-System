require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Simular la función returnLoanAction
async function testReturnLoan() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const loanId = '307c7218-dfbb-422c-96ff-4faf2361cf8d';
  
  // Primero obtener el préstamo para ver el DNI del usuario
  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .select(`
      *,
      user:users(dni, name)
    `)
    .eq('id', loanId)
    .single();
    
  if (loanError || !loan) {
    console.log('Error fetching loan:', loanError);
    return;
  }
  
  console.log('Loan data:', {
    id: loan.id,
    status: loan.status,
    userDni: loan.user?.dni,
    userName: loan.user?.name
  });
  
  // Ahora intentar actualizar el préstamo directamente
  const { error: updateError } = await supabase
    .from('loans')
    .update({
      status: 'Devuelto',
      actual_return_date: new Date().toISOString()
    })
    .eq('id', loanId);
    
  if (updateError) {
    console.error('Error updating loan:', updateError);
  } else {
    console.log('Loan updated successfully');
  }
  
  // Verificar el estado después de la actualización
  const { data: updatedLoan } = await supabase
    .from('loans')
    .select('id, status, actual_return_date')
    .eq('id', loanId)
    .single();
    
  console.log('Updated loan status:', updatedLoan);
}

testReturnLoan().catch(console.error);
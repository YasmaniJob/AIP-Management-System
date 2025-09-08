require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Simular la función returnLoanAction directamente
async function testReturnLoan() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const loanId = '307c7218-dfbb-422c-96ff-4faf2361cf8d';
  const dni = '42767971';
  
  console.log('Testing loan return process...');
  
  // 1. Verificar que el préstamo existe y obtener datos del usuario
  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .select(`
      *,
      user:users(dni, name),
      loan_resources(resources(id, status))
    `)
    .eq('id', loanId)
    .single();
    
  if (loanError || !loan) {
    console.error('Error fetching loan:', loanError);
    return;
  }
  
  console.log('Loan found:', {
    id: loan.id,
    status: loan.status,
    userDni: loan.user?.dni,
    userName: loan.user?.name
  });
  
  // 2. Verificar DNI
  if (dni !== loan.user?.dni) {
    console.error('DNI mismatch. Expected:', loan.user?.dni, 'Provided:', dni);
    return;
  }
  
  console.log('DNI validation passed');
  
  // 3. Intentar actualizar el préstamo
  console.log('Attempting to update loan status...');
  const { error: updateError } = await supabase
    .from('loans')
    .update({
      status: 'Devuelto',
      actual_return_date: new Date().toISOString()
    })
    .eq('id', loanId);
    
  if (updateError) {
    console.error('Error updating loan:', updateError);
    return;
  }
  
  console.log('Loan updated successfully');
  
  // 4. Actualizar recursos a 'Disponible'
  const resourceIds = loan.loan_resources.map(lr => lr.resources.id);
  console.log('Updating resources:', resourceIds);
  
  const { error: resourceError } = await supabase
    .from('resources')
    .update({ status: 'Disponible' })
    .in('id', resourceIds);
    
  if (resourceError) {
    console.error('Error updating resources:', resourceError);
    return;
  }
  
  console.log('Resources updated successfully');
  
  // 5. Verificar el resultado final
  const { data: updatedLoan } = await supabase
    .from('loans')
    .select('id, status, actual_return_date')
    .eq('id', loanId)
    .single();
    
  console.log('Final loan status:', updatedLoan);
  
  return { success: true, message: 'Devolución registrada correctamente.' };
}

testReturnLoan().catch(console.error);
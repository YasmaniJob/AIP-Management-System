const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleUpdate() {
  const loanId = '307c7218-dfbb-422c-96ff-4faf2361cf8d';
  
  console.log('Testing simple status update...');
  
  try {
    // Intentar actualizar solo el status
    const { data, error } = await supabase
      .from('loans')
      .update({ 
        status: 'Devuelto'
      })
      .eq('id', loanId)
      .select();
    
    if (error) {
      console.error('Error updating loan status:', error);
    } else {
      console.log('Loan updated successfully:', data);
    }
    
    // Verificar el estado actual
    const { data: currentLoan, error: fetchError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching loan:', fetchError);
    } else {
      console.log('Current loan status:', currentLoan.status);
      console.log('Current loan data:', currentLoan);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testSimpleUpdate();
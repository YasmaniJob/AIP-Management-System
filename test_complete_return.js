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

async function testCompleteReturn() {
  const loanId = '307c7218-dfbb-422c-96ff-4faf2361cf8d';
  const now = new Date().toISOString();
  
  console.log('Testing complete loan return...');
  console.log('Current time:', now);
  
  try {
    // Intentar actualizar status y actual_return_date
    const { data, error } = await supabase
      .from('loans')
      .update({ 
        status: 'Devuelto',
        actual_return_date: now
      })
      .eq('id', loanId)
      .select();
    
    if (error) {
      console.error('Error updating loan:', error);
    } else {
      console.log('Loan updated successfully:', data);
    }
    
    // Verificar el estado actual después de un pequeño delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: currentLoan, error: fetchError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching loan:', fetchError);
    } else {
      console.log('\nCurrent loan status after update:', currentLoan.status);
      console.log('Actual return date:', currentLoan.actual_return_date);
      console.log('Return date (expected):', currentLoan.return_date);
      console.log('Days overdue:', currentLoan.days_overdue);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testCompleteReturn();
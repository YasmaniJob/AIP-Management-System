require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkLoanStatus() {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('id, status, actual_return_date, created_at')
      .eq('id', '307c7218-dfbb-422c-96ff-4faf2361cf8d')
      .single();
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Loan status:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkLoanStatus();
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkActiveLoans() {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        id, 
        status, 
        users(name, dni), 
        loan_resources(resources(id, brand, model))
      `)
      .eq('status', 'Activo')
      .limit(3);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Préstamos activos disponibles:');
    data.forEach((loan, i) => {
      console.log(`${i+1}. ID: ${loan.id}`);
      console.log(`   Usuario: ${loan.users.name} (${loan.users.dni})`);
      console.log(`   Recursos: ${loan.loan_resources.length}`);
      loan.loan_resources.forEach(lr => {
        console.log(`     - ${lr.resources.brand} ${lr.resources.model}`);
      });
      console.log('---');
    });
  } catch (err) {
    console.error('Error ejecutando consulta:', err);
  }
}

checkActiveLoans();
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name, dni, email')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Total usuarios en BD: ${data?.length || 0}`);
    console.log('\nPrimeros 15 usuarios:');
    data?.slice(0, 15).forEach((u, i) => {
      console.log(`${i+1}. ${u.name} - DNI: ${u.dni} - Email: ${u.email || 'N/A'}`);
    });
    
    // Buscar específicamente los DNIs del archivo Excel
    const testDnis = ['10023456', '10023457', '10023458', '10023459', '10023460'];
    console.log('\nVerificando DNIs específicos del archivo Excel:');
    
    for (const dni of testDnis) {
      const existing = data?.find(u => u.dni === dni);
      if (existing) {
        console.log(`✓ DNI ${dni} YA EXISTE: ${existing.name} - ${existing.email}`);
      } else {
        console.log(`✗ DNI ${dni} NO EXISTE en BD`);
      }
    }
    
  } catch (error) {
    console.error('Error ejecutando consulta:', error);
  }
}

checkUsers();
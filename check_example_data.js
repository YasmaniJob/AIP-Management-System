require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExampleData() {
  console.log('🔍 BUSCANDO DATOS DE EJEMPLO O HARDCODEADOS');
  
  // 1. Buscar usuarios con nombres como 'Yasmani'
  console.log('\n👤 VERIFICANDO USUARIOS:');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .or('name.ilike.%yasmani%,email.ilike.%yasmani%');
    
  if (usersError) {
    console.error('Error buscando usuarios:', usersError);
  } else {
    console.log(`Usuarios encontrados con 'Yasmani': ${users?.length || 0}`);
    users?.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`  Nombre: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Rol: ${user.role}`);
      console.log('  ---');
    });
  }
  
  // 2. Buscar incidencias con 'Pantalla Táctil'
  console.log('\n📱 VERIFICANDO INCIDENCIAS CON "PANTALLA TÁCTIL":');
  const { data: incidents, error: incidentsError } = await supabase
    .from('maintenance_incidents_individual')
    .select('*')
    .eq('damage_type', 'Pantalla Táctil');
    
  if (incidentsError) {
    console.error('Error buscando incidencias:', incidentsError);
  } else {
    console.log(`Incidencias con 'Pantalla Táctil': ${incidents?.length || 0}`);
    incidents?.forEach(inc => {
      console.log(`- ID: ${inc.id}`);
      console.log(`  Resource ID: ${inc.resource_id}`);
      console.log(`  Reportador: ${inc.reporter_name}`);
      console.log(`  Grado: ${inc.reporter_grade}`);
      console.log(`  Sección: ${inc.reporter_section}`);
      console.log(`  Estado: ${inc.current_status}`);
      console.log(`  Fecha: ${inc.created_at}`);
      console.log('  ---');
    });
  }
  
  // 3. Buscar en maintenance_tracking
  console.log('\n🔧 VERIFICANDO MAINTENANCE_TRACKING:');
  const { data: tracking, error: trackingError } = await supabase
    .from('maintenance_tracking')
    .select(`
      *,
      resource:resources(
        id,
        number,
        brand,
        model,
        category:categories(name)
      )
    `);
    
  if (trackingError) {
    console.error('Error en maintenance_tracking:', trackingError);
  } else {
    console.log(`Total registros de mantenimiento: ${tracking?.length || 0}`);
    
    // Filtrar por Tablet 1 (Apple)
    const tablet1Records = tracking?.filter(t => 
      t.resource?.number === '1' || 
      t.resource?.category?.name?.toLowerCase().includes('tablet')
    );
    
    console.log(`\nRegistros para Tablet 1: ${tablet1Records?.length || 0}`);
    tablet1Records?.forEach(record => {
      console.log(`- ID: ${record.id}`);
      console.log(`  Resource: ${record.resource?.number} (${record.resource?.category?.name})`);
      console.log(`  Estado: ${record.current_status}`);
      console.log(`  Total incidencias: ${record.total_incidents}`);
      console.log(`  Completadas: ${record.completed_incidents}`);
      console.log(`  Porcentaje: ${record.completion_percentage}%`);
      console.log('  ---');
    });
  }
  
  // 4. Verificar si hay datos hardcodeados en el código
  console.log('\n🔍 POSIBLES FUENTES DE DATOS DE EJEMPLO:');
  console.log('1. Componentes React con datos hardcodeados');
  console.log('2. Archivos de seed/ejemplo en la base de datos');
  console.log('3. Datos de prueba en desarrollo');
  console.log('4. Caché del navegador con datos antiguos');
  
  // 5. Verificar préstamos relacionados
  console.log('\n💼 VERIFICANDO PRÉSTAMOS:');
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select(`
      *,
      user:users(name, email)
    `)
    .or('notes.ilike.%pantalla%,notes.ilike.%táctil%');
    
  if (loansError) {
    console.error('Error buscando préstamos:', loansError);
  } else {
    console.log(`Préstamos relacionados: ${loans?.length || 0}`);
    loans?.forEach(loan => {
      console.log(`- ID: ${loan.id}`);
      console.log(`  Usuario: ${loan.user_name}`);
      console.log(`  Recurso: ${loan.resource_name}`);
      console.log(`  Estado: ${loan.status}`);
      console.log(`  Notas: ${loan.notes || 'N/A'}`);
      console.log('  ---');
    });
  }
}

checkExampleData().catch(console.error);
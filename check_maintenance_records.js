require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  console.log('SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMaintenanceRecords() {
  console.log('Checking recent maintenance records...');
  
  // Obtener registros de mantenimiento recientes
  const { data: maintenance, error: maintenanceError } = await supabase
    .from('maintenance_tracking')
    .select(`
      *,
      resource:resources(
        id,
        number,
        brand,
        model,
        status,
        category:categories(name, type)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (maintenanceError) {
    console.error('Error fetching maintenance records:', maintenanceError);
  } else {
    console.log('\nRecent maintenance records:');
    console.log('Total records found:', maintenance.length);
    maintenance.forEach((record, index) => {
      console.log(`\n${index + 1}. ID: ${record.id}`);
      console.log(`   Resource: ${record.resource?.category?.name} - ${record.resource?.brand} ${record.resource?.model}`);
      console.log(`   Type: ${record.incident_type}`);
      console.log(`   Status: ${record.current_status}`);
      console.log(`   Priority: ${record.priority}`);
      console.log(`   Created: ${record.created_at}`);
      console.log(`   Description: ${record.incident_description?.substring(0, 100)}...`);
    });
  }

  // Verificar también incidencias recientes
  const { data: incidents, error: incidentsError } = await supabase
    .from('incidents')
    .select(`
      *,
      resource:resources(
        id,
        number,
        brand,
        model,
        category:categories(name, type)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (incidentsError) {
    console.error('Error fetching incidents:', incidentsError);
  } else {
    console.log('\n\nRecent incidents:');
    console.log('Total incidents found:', incidents.length);
    incidents.forEach((incident, index) => {
      console.log(`\n${index + 1}. ID: ${incident.id}`);
      console.log(`   Resource: ${incident.resource?.category?.name} - ${incident.resource?.brand} ${incident.resource?.model}`);
      console.log(`   Title: ${incident.title}`);
      console.log(`   Type: ${incident.type}`);
      console.log(`   Status: ${incident.status}`);
      console.log(`   Priority: ${incident.priority}`);
      console.log(`   Created: ${incident.created_at}`);
      console.log(`   Description: ${incident.description?.substring(0, 100)}...`);
    });
  }

  // Verificar préstamos devueltos recientes con notas
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select(`
      id,
      status,
      actual_return_date,
      notes,
      user:users(name, dni)
    `)
    .eq('status', 'Devuelto')
    .not('notes', 'is', null)
    .order('actual_return_date', { ascending: false })
    .limit(5);

  if (loansError) {
    console.error('Error fetching returned loans:', loansError);
  } else {
    console.log('\n\nRecent returned loans with notes:');
    console.log('Total returned loans with notes:', loans.length);
    loans.forEach((loan, index) => {
      console.log(`\n${index + 1}. Loan ID: ${loan.id}`);
      console.log(`   User: ${loan.user?.name} (${loan.user?.dni})`);
      console.log(`   Return Date: ${loan.actual_return_date}`);
      console.log(`   Notes: ${loan.notes?.substring(0, 200)}...`);
    });
  }
}

checkMaintenanceRecords().catch(console.error);
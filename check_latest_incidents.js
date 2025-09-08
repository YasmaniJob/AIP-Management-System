require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestIncidents() {
  console.log('🔍 Verificando las últimas incidencias creadas...');
  
  const { data, error } = await supabase
    .from('maintenance_incidents_individual')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📋 Últimas 3 incidencias creadas:');
  console.log('');
  
  data.forEach((incident, i) => {
    console.log(`${i+1}. ID: ${incident.id}`);
    console.log(`   Recurso: ${incident.resource_id}`);
    console.log(`   Número: ${incident.incident_number}`);
    console.log(`   Tipo de daño: ${incident.damage_type}`);
    console.log(`   Reportero: ${incident.reporter_name || 'No especificado'}`);
    console.log(`   Grado: ${incident.reporter_grade || 'No especificado'}`);
    console.log(`   Sección: ${incident.reporter_section || 'No especificado'}`);
    console.log(`   Estado: ${incident.current_status}`);
    console.log(`   Fecha: ${incident.created_at}`);
    console.log('');
  });
}

checkLatestIncidents();
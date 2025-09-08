require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkIndividualIncidents() {
  try {
    const { data, error } = await supabase
      .from('maintenance_incidents_individual')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Últimas 5 incidencias individuales:');
    data.forEach((incident, i) => {
      console.log(`${i+1}. ID: ${incident.id}`);
      console.log(`   Recurso: ${incident.resource_id}`);
      console.log(`   Reportero: ${incident.reporter_name || 'NULL'}`);
      console.log(`   Grado: ${incident.reporter_grade || 'NULL'}`);
      console.log(`   Sección: ${incident.reporter_section || 'NULL'}`);
      console.log(`   Descripción: ${incident.damage_description}`);
      console.log(`   Fecha: ${incident.created_at}`);
      console.log('---');
    });
  } catch (err) {
    console.error('Error ejecutando consulta:', err);
  }
}

checkIndividualIncidents();
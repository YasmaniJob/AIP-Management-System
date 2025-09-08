require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTabletIncidents() {
  try {
    console.log('🔍 BUSCANDO TABLET 1:');
    
    // Primero buscar el recurso Tablet 1
    const { data: resources, error: resourceError } = await supabase
      .from('resources')
      .select('id, number, brand, model')
      .eq('number', '1')
      .limit(1);
    
    if (resourceError) {
      console.error('Error buscando recurso:', resourceError);
      return;
    }
    
    if (!resources || resources.length === 0) {
      console.log('No se encontró el recurso con número 1');
      return;
    }
    
    const resource = resources[0];
    console.log(`Recurso encontrado: ${resource.brand} ${resource.model} (ID: ${resource.id})`);
    
    // Obtener incidencias del recurso
    const { data: incidents, error } = await supabase
      .from('maintenance_incidents_individual')
      .select('*')
      .eq('resource_id', resource.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Incidencias encontradas:', incidents?.length || 0);
    
    if (incidents && incidents.length > 0) {
      incidents.forEach((inc, i) => {
        console.log(`${i+1}. Tipo: ${inc.damage_type}`);
        console.log(`   Descripción: ${inc.damage_description}`);
        console.log(`   Estado: ${inc.current_status}`);
        console.log(`   Prioridad: ${inc.priority}`);
        console.log(`   Fecha: ${inc.created_at}`);
        console.log('   ---');
      });
    } else {
      console.log('No se encontraron incidencias para este recurso.');
    }
    
    // También verificar el registro de mantenimiento
    console.log('\n📋 VERIFICANDO REGISTRO DE MANTENIMIENTO:');
    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance_tracking')
      .select('*')
      .eq('resource_id', resource.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (maintenanceError) {
      console.error('Error en mantenimiento:', maintenanceError);
    } else if (maintenance && maintenance.length > 0) {
      const record = maintenance[0];
      console.log(`Estado general: ${record.current_status}`);
      console.log(`Total incidencias: ${record.total_incidents}`);
      console.log(`Completadas: ${record.completed_incidents}`);
      console.log(`Porcentaje: ${record.completion_percentage}%`);
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

checkTabletIncidents().catch(console.error);
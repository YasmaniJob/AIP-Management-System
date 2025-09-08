const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMaintenanceData() {
  console.log('=== VERIFICANDO DATOS DE MANTENIMIENTO ===');
  
  // 1. Verificar incidencias recientes
  const { data: incidents, error } = await supabase
    .from('maintenance_incidents_individual')
    .select(`
      *,
      resource:resources(
        number,
        brand,
        model,
        category:categories(name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nIncidencias recientes:');
  console.log('Total encontradas:', incidents.length);
  
  incidents.forEach((inc, i) => {
    console.log(`\n${i+1}. ID: ${inc.id}`);
    console.log(`   Recurso: ${inc.resource?.category?.name || 'N/A'} ${inc.resource?.brand || ''} ${inc.resource?.model || ''}`);
    console.log(`   Número: ${inc.resource?.number || 'N/A'}`);
    console.log(`   Reportado por: ${inc.reporter_name || 'No especificado'}`);
    console.log(`   Grado/Sección: ${inc.reporter_grade || 'N/A'} - ${inc.reporter_section || 'N/A'}`);
    console.log(`   Tipo daño: ${inc.damage_type}`);
    console.log(`   Estado: ${inc.current_status}`);
    console.log(`   Fecha: ${inc.created_at}`);
    console.log(`   Incidente #: ${inc.incident_number}`);
  });

  // 2. Verificar si hay duplicados por resource_id
  console.log('\n=== VERIFICANDO DUPLICADOS ===');
  const resourceCounts = {};
  incidents.forEach(inc => {
    const resourceId = inc.resource_id;
    if (!resourceCounts[resourceId]) {
      resourceCounts[resourceId] = [];
    }
    resourceCounts[resourceId].push(inc);
  });

  Object.entries(resourceCounts).forEach(([resourceId, incidentsList]) => {
    if (incidentsList.length > 1) {
      console.log(`\n🔴 DUPLICADO ENCONTRADO - Recurso ID: ${resourceId}`);
      console.log(`   Número de incidencias: ${incidentsList.length}`);
      incidentsList.forEach((inc, i) => {
        console.log(`   ${i+1}. ${inc.damage_type} - ${inc.current_status} (${inc.created_at})`);
      });
    }
  });

  // 3. Buscar específicamente por nombres mencionados
  console.log('\n=== BUSCANDO NOMBRES ESPECÍFICOS ===');
  const { data: specificIncidents } = await supabase
    .from('maintenance_incidents_individual')
    .select('*')
    .or('reporter_name.ilike.%ALFREDO%,reporter_name.ilike.%Carlos%,reporter_name.ilike.%Mendoza%');

  if (specificIncidents && specificIncidents.length > 0) {
    console.log('Incidencias con nombres específicos:');
    specificIncidents.forEach(inc => {
      console.log(`- ${inc.reporter_name} | ${inc.reporter_grade} | ${inc.reporter_section}`);
    });
  } else {
    console.log('No se encontraron incidencias con esos nombres específicos');
  }
}

debugMaintenanceData().catch(console.error);
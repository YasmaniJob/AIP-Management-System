const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixReporterInconsistency() {
  console.log('🔧 CORRIGIENDO INCONSISTENCIA DE REPORTADORES');
  
  // 1. Identificar el resource_id problemático
  const problematicResourceId = 'eda85f9b-e75b-4145-8177-0ce419932b5f';
  
  console.log(`\n📋 ANALIZANDO RESOURCE ID: ${problematicResourceId}`);
  
  // 2. Obtener todas las incidencias de este recurso
  const { data: incidents, error: incidentsError } = await supabase
    .from('maintenance_incidents_individual')
    .select('*')
    .eq('resource_id', problematicResourceId)
    .order('created_at', { ascending: true });
    
  if (incidentsError) {
    console.error('Error obteniendo incidencias:', incidentsError);
    return;
  }
  
  console.log(`\nIncidencias encontradas: ${incidents.length}`);
  incidents.forEach((inc, index) => {
    console.log(`${index + 1}. ${inc.reporter_name} - ${inc.damage_type}`);
    console.log(`   Estado: ${inc.current_status}`);
    console.log(`   Fecha: ${inc.created_at}`);
    console.log(`   ID: ${inc.id}`);
  });
  
  // 3. Identificar el patrón del problema
  const firstIncident = incidents[0];
  const latestIncidents = incidents.filter(inc => 
    inc.reporter_name === 'WILLIAM AMÉRICO GUTIERREZ ANDIA'
  );
  
  console.log(`\n🔍 ANÁLISIS:`);
  console.log(`- Primer incidente (usado por maintenance.ts): ${firstIncident?.reporter_name}`);
  console.log(`- Incidencias de WILLIAM AMÉRICO: ${latestIncidents.length}`);
  
  // 4. Estrategias de corrección
  console.log(`\n💡 ESTRATEGIAS DE CORRECCIÓN:`);
  
  // Opción 1: Actualizar el primer incidente para que coincida con el reportador actual
  console.log(`\n1️⃣ OPCIÓN 1: Actualizar primer incidente`);
  console.log(`   - Cambiar reportador de "${firstIncident?.reporter_name}" a "WILLIAM AMÉRICO GUTIERREZ ANDIA"`);
  
  // Opción 2: Modificar la lógica para usar el último incidente activo
  console.log(`\n2️⃣ OPCIÓN 2: Usar último incidente activo en lugar del primero`);
  
  // Opción 3: Consolidar incidencias duplicadas
  console.log(`\n3️⃣ OPCIÓN 3: Consolidar incidencias del mismo recurso`);
  
  // 5. Verificar el estado actual del resumen
  const { data: summary, error: summaryError } = await supabase
    .from('maintenance_resource_summary')
    .select('*')
    .eq('resource_id', problematicResourceId)
    .single();
    
  if (!summaryError && summary) {
    console.log(`\n📊 ESTADO ACTUAL DEL RESUMEN:`);
    console.log(`- Total incidencias: ${summary.total_incidents}`);
    console.log(`- Completadas: ${summary.completed_incidents}`);
    console.log(`- Estado actual: ${summary.current_status}`);
    console.log(`- Reportador principal: ${summary.primary_reporter || 'No definido'}`);
  }
  
  // 6. Implementar corrección (Opción 1: Actualizar primer incidente)
  console.log(`\n🔧 IMPLEMENTANDO CORRECCIÓN...`);
  
  if (firstIncident && latestIncidents.length > 0) {
    // Actualizar el primer incidente para que tenga la información correcta del reportador actual
    const { error: updateError } = await supabase
      .from('maintenance_incidents_individual')
      .update({
        reporter_name: 'WILLIAM AMÉRICO GUTIERREZ ANDIA',
        reporter_grade: 'Primero',
        reporter_section: 'A',
        updated_at: new Date().toISOString()
      })
      .eq('id', firstIncident.id);
      
    if (updateError) {
      console.error('❌ Error actualizando primer incidente:', updateError);
    } else {
      console.log('✅ Primer incidente actualizado correctamente');
    }
  }
  
  // 7. Actualizar el resumen del recurso si es necesario
  if (summary) {
    const { error: updateSummaryError } = await supabase
      .from('maintenance_resource_summary')
      .update({
        primary_reporter: 'WILLIAM AMÉRICO GUTIERREZ ANDIA',
        updated_at: new Date().toISOString()
      })
      .eq('resource_id', problematicResourceId);
      
    if (updateSummaryError) {
      console.error('❌ Error actualizando resumen:', updateSummaryError);
    } else {
      console.log('✅ Resumen del recurso actualizado correctamente');
    }
  }
  
  // 8. Verificar otros recursos con el mismo problema
  console.log(`\n🔍 VERIFICANDO OTROS RECURSOS CON PROBLEMAS SIMILARES...`);
  
  const { data: allIncidents, error: allIncidentsError } = await supabase
    .from('maintenance_incidents_individual')
    .select('resource_id, reporter_name, created_at')
    .order('created_at', { ascending: true });
    
  if (!allIncidentsError && allIncidents) {
    // Agrupar por resource_id
    const resourceGroups = {};
    allIncidents.forEach(inc => {
      if (!resourceGroups[inc.resource_id]) {
        resourceGroups[inc.resource_id] = [];
      }
      resourceGroups[inc.resource_id].push(inc);
    });
    
    // Buscar recursos con reportadores inconsistentes
    const inconsistentResources = [];
    Object.keys(resourceGroups).forEach(resourceId => {
      const incidents = resourceGroups[resourceId];
      if (incidents.length > 1) {
        const firstReporter = incidents[0].reporter_name;
        const hasInconsistency = incidents.some(inc => inc.reporter_name !== firstReporter);
        if (hasInconsistency) {
          inconsistentResources.push({
            resourceId,
            firstReporter,
            allReporters: [...new Set(incidents.map(inc => inc.reporter_name))],
            incidentCount: incidents.length
          });
        }
      }
    });
    
    console.log(`\n⚠️  RECURSOS CON INCONSISTENCIAS ENCONTRADOS: ${inconsistentResources.length}`);
    inconsistentResources.slice(0, 5).forEach(resource => {
      console.log(`- ${resource.resourceId}:`);
      console.log(`  Primer reportador: ${resource.firstReporter}`);
      console.log(`  Todos los reportadores: ${resource.allReporters.join(', ')}`);
      console.log(`  Total incidencias: ${resource.incidentCount}`);
    });
    
    if (inconsistentResources.length > 5) {
      console.log(`  ... y ${inconsistentResources.length - 5} más`);
    }
  }
  
  console.log(`\n✅ CORRECCIÓN COMPLETADA`);
}

fixReporterInconsistency().catch(console.error);
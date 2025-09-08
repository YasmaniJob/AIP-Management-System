require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMaintenanceSummarySync() {
  console.log('🔍 Verificando sincronización de maintenance_resource_summary...');
  
  // 1. Verificar registros en maintenance_incidents_individual
  const { data: incidents, error: incidentsError } = await supabase
    .from('maintenance_incidents_individual')
    .select('resource_id, current_status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (incidentsError) {
    console.error('❌ Error obteniendo incidencias:', incidentsError);
    return;
  }
  
  console.log(`✅ Incidencias individuales encontradas: ${incidents.length}`);
  incidents.forEach((incident, index) => {
    console.log(`   ${index + 1}. Recurso: ${incident.resource_id} - Estado: ${incident.current_status}`);
  });
  
  // 2. Verificar registros en maintenance_resource_summary
  const { data: summaries, error: summariesError } = await supabase
    .from('maintenance_resource_summary')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(10);
    
  if (summariesError) {
    console.error('❌ Error obteniendo resúmenes:', summariesError);
    return;
  }
  
  console.log(`\n📊 Resúmenes de recursos encontrados: ${summaries.length}`);
  summaries.forEach((summary, index) => {
    console.log(`   ${index + 1}. Recurso: ${summary.resource_id}`);
    console.log(`      Estado general: ${summary.overall_status}`);
    console.log(`      Total incidencias: ${summary.total_incidents}`);
    console.log(`      Incidencias completadas: ${summary.completed_incidents}`);
    console.log(`      Porcentaje completado: ${summary.completion_percentage}%`);
    console.log(`      Actualizado: ${summary.updated_at}`);
  });
  
  // 3. Verificar si hay recursos con incidencias pero sin resumen
  const resourcesWithIncidents = [...new Set(incidents.map(i => i.resource_id))];
  const resourcesWithSummary = summaries.map(s => s.resource_id);
  
  const missingInSummary = resourcesWithIncidents.filter(resourceId => 
    !resourcesWithSummary.includes(resourceId)
  );
  
  if (missingInSummary.length > 0) {
    console.log('\n⚠️  Recursos con incidencias pero sin resumen:');
    missingInSummary.forEach(resourceId => {
      console.log(`   - ${resourceId}`);
    });
  } else {
    console.log('\n✅ Todos los recursos con incidencias tienen resumen');
  }
  
  // 4. Verificar triggers de la base de datos
  console.log('\n🔧 Verificando triggers de la base de datos...');
  
  const { data: triggers, error: triggersError } = await supabase
    .rpc('get_table_triggers', { table_name: 'maintenance_incidents_individual' })
    .single();
    
  if (triggersError) {
    console.log('❌ No se pudieron obtener los triggers (función no disponible)');
  } else {
    console.log('✅ Triggers encontrados:', triggers);
  }
  
  // 5. Probar sincronización manual
  console.log('\n🔄 Probando sincronización manual...');
  
  if (resourcesWithIncidents.length > 0) {
    const testResourceId = resourcesWithIncidents[0];
    console.log(`Actualizando resumen para recurso: ${testResourceId}`);
    
    // Contar incidencias para este recurso
    const { data: resourceIncidents, error: countError } = await supabase
      .from('maintenance_incidents_individual')
      .select('current_status')
      .eq('resource_id', testResourceId);
      
    if (!countError && resourceIncidents) {
      const totalIncidents = resourceIncidents.length;
      const completedIncidents = resourceIncidents.filter(i => i.current_status === 'Completado').length;
      const completionPercentage = totalIncidents > 0 ? Math.round((completedIncidents / totalIncidents) * 100) : 0;
      const overallStatus = completionPercentage === 100 ? 'Completado' : 
                           completionPercentage > 0 ? 'En Proceso' : 'Pendiente';
      
      console.log(`   Total incidencias: ${totalIncidents}`);
      console.log(`   Incidencias completadas: ${completedIncidents}`);
      console.log(`   Porcentaje: ${completionPercentage}%`);
      console.log(`   Estado calculado: ${overallStatus}`);
      
      // Intentar actualizar o insertar el resumen
      const { data: existingSummary } = await supabase
        .from('maintenance_resource_summary')
        .select('id')
        .eq('resource_id', testResourceId)
        .single();
        
      if (existingSummary) {
        const { error: updateError } = await supabase
          .from('maintenance_resource_summary')
          .update({
            total_incidents: totalIncidents,
            completed_incidents: completedIncidents,
            completion_percentage: completionPercentage,
            overall_status: overallStatus,
            updated_at: new Date().toISOString()
          })
          .eq('resource_id', testResourceId);
          
        if (updateError) {
          console.log('❌ Error actualizando resumen:', updateError.message);
        } else {
          console.log('✅ Resumen actualizado manualmente');
        }
      } else {
        const { error: insertError } = await supabase
          .from('maintenance_resource_summary')
          .insert({
            resource_id: testResourceId,
            total_incidents: totalIncidents,
            completed_incidents: completedIncidents,
            completion_percentage: completionPercentage,
            overall_status: overallStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.log('❌ Error insertando resumen:', insertError.message);
        } else {
          console.log('✅ Resumen creado manualmente');
        }
      }
    }
  }
  
  console.log('\n🏁 Verificación completada');
}

checkMaintenanceSummarySync().catch(console.error);
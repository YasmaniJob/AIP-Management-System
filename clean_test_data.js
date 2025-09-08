const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanTestData() {
  console.log('🧹 LIMPIANDO DATOS DE PRUEBA Y EJEMPLO');
  console.log('=' .repeat(50));
  
  try {
    // 1. Identificar registros de prueba con patrones más específicos
    console.log('\n1. 🔍 IDENTIFICANDO REGISTROS DE PRUEBA:');
    
    let testRecords = [];
    
    // Buscar por patrones específicos en las notas
    const { data: testByNotes } = await supabase
      .from('maintenance_incidents_individual')
      .select('*')
      .or('notes.ilike.%Test automático%,notes.ilike.%Prueba automática%');
    
    if (testByNotes && testByNotes.length > 0) {
      console.log(`⚠️  Registros con 'Test/Prueba automático' en notas: ${testByNotes.length}`);
      testRecords = [...testRecords, ...testByNotes];
    }
    
    // Buscar por patrones en damage_description
    const { data: testByDescription } = await supabase
      .from('maintenance_incidents_individual')
      .select('*')
      .or('damage_description.ilike.%Test automático%,damage_description.ilike.%Prueba automática%');
    
    if (testByDescription && testByDescription.length > 0) {
      console.log(`⚠️  Registros con 'Test/Prueba automático' en descripción: ${testByDescription.length}`);
      testRecords = [...testRecords, ...testByDescription];
    }
    
    // Buscar por patrones en incident_context
    const { data: testByContext } = await supabase
      .from('maintenance_incidents_individual')
      .select('*')
      .or('incident_context.ilike.%Test automático%,incident_context.ilike.%Prueba automática%');
    
    if (testByContext && testByContext.length > 0) {
      console.log(`⚠️  Registros con 'Test/Prueba automático' en contexto: ${testByContext.length}`);
      testRecords = [...testRecords, ...testByContext];
    }
    
    // Buscar registros con reportador "WILLIAM AMÉRICO GUTIERREZ ANDIA" que parecen ser de prueba
    const { data: williamRecords } = await supabase
      .from('maintenance_incidents_individual')
      .select('*')
      .eq('reporter_name', 'WILLIAM AMÉRICO GUTIERREZ ANDIA');
    
    if (williamRecords && williamRecords.length > 0) {
      console.log(`⚠️  Registros del usuario 'WILLIAM AMÉRICO GUTIERREZ ANDIA': ${williamRecords.length}`);
      // Verificar si estos registros contienen patrones de prueba
      const williamTestRecords = williamRecords.filter(record => 
        (record.notes && (record.notes.includes('Test automático') || record.notes.includes('Prueba automática'))) ||
        (record.damage_description && (record.damage_description.includes('Test automático') || record.damage_description.includes('Prueba automática'))) ||
        (record.incident_context && (record.incident_context.includes('Test automático') || record.incident_context.includes('Prueba automática')))
      );
      
      if (williamTestRecords.length > 0) {
        console.log(`⚠️  Registros de William que son de prueba: ${williamTestRecords.length}`);
        testRecords = [...testRecords, ...williamTestRecords];
      }
    }
    
    // Eliminar duplicados
    const uniqueTestRecords = testRecords.filter((record, index, self) => 
      index === self.findIndex(r => r.id === record.id)
    );
    
    console.log(`\n📊 Total registros de prueba únicos: ${uniqueTestRecords.length}`);
    
    if (uniqueTestRecords.length === 0) {
      console.log('✅ No se encontraron registros de prueba para eliminar');
      
      // Mostrar todas las incidencias actuales
      console.log('\n📋 INCIDENCIAS ACTUALES:');
      const { data: allIncidents } = await supabase
        .from('maintenance_incidents_individual')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log(`Total: ${allIncidents.length} incidencias`);
      allIncidents.forEach((inc, i) => {
        console.log(`${i+1}. ${inc.damage_type} | ${inc.reporter_name} | ${inc.current_status}`);
        if (inc.notes) console.log(`   Notas: ${inc.notes.substring(0, 100)}...`);
      });
      
      return;
    }
    
    // 2. Mostrar registros que se van a eliminar
    console.log('\n2. 📋 REGISTROS QUE SE ELIMINARÁN:');
    uniqueTestRecords.forEach((record, i) => {
      console.log(`${i+1}. ID: ${record.id}`);
      console.log(`   Daño: ${record.damage_type}`);
      console.log(`   Reportador: ${record.reporter_name}`);
      console.log(`   Descripción: ${record.damage_description?.substring(0, 100)}...`);
      console.log(`   Contexto: ${record.incident_context?.substring(0, 100)}...`);
      console.log(`   Notas: ${record.notes?.substring(0, 100)}...`);
      console.log('   ---');
    });
    
    // 3. Confirmar eliminación
    console.log('\n3. 🗑️  ELIMINANDO REGISTROS DE PRUEBA...');
    
    const recordIds = uniqueTestRecords.map(r => r.id);
    
    const { error: deleteError } = await supabase
      .from('maintenance_incidents_individual')
      .delete()
      .in('id', recordIds);
    
    if (deleteError) {
      console.error('❌ Error eliminando registros:', deleteError);
      return;
    }
    
    console.log(`✅ Eliminados ${recordIds.length} registros de prueba`);
    
    // 4. Verificar estado final
    console.log('\n4. 📊 ESTADO FINAL DESPUÉS DE LA LIMPIEZA:');
    
    const { data: finalIncidents } = await supabase
      .from('maintenance_incidents_individual')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log(`📋 Total incidencias restantes: ${finalIncidents.length}`);
    
    if (finalIncidents.length > 0) {
      console.log('\n📝 INCIDENCIAS REALES RESTANTES:');
      finalIncidents.forEach((inc, i) => {
        console.log(`${i+1}. ${inc.damage_type} | ${inc.reporter_name || 'Sin reportador'} | Estado: ${inc.current_status} | Recurso: ${inc.resource_id}`);
      });
    } else {
      console.log('ℹ️  No quedan incidencias después de la limpieza');
    }
    
    // 5. Limpiar resúmenes y recalcular
    console.log('\n5. 🔄 LIMPIANDO Y RECALCULANDO RESÚMENES...');
    
    // Eliminar todos los resúmenes existentes
    const { error: clearError } = await supabase
      .from('maintenance_summary')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos
    
    if (clearError) {
      console.error('❌ Error limpiando resúmenes:', clearError);
    } else {
      console.log('✅ Resúmenes anteriores eliminados');
    }
    
    // Recalcular resúmenes solo para recursos con incidencias
    if (finalIncidents.length > 0) {
      const uniqueResources = [...new Set(finalIncidents.map(inc => inc.resource_id))];
      
      for (const resourceId of uniqueResources) {
        const resourceIncidents = finalIncidents.filter(inc => inc.resource_id === resourceId);
        const completedIncidents = resourceIncidents.filter(inc => inc.current_status === 'Completado');
        const completionPercentage = resourceIncidents.length > 0 
          ? Math.round((completedIncidents.length / resourceIncidents.length) * 100) 
          : 0;
        
        const { error: insertError } = await supabase
          .from('maintenance_summary')
          .insert({
            resource_id: resourceId,
            total_incidents: resourceIncidents.length,
            completed_incidents: completedIncidents.length,
            completion_percentage: completionPercentage,
            last_updated: new Date().toISOString()
          });
        
        if (insertError) {
          console.error(`❌ Error creando resumen para recurso ${resourceId}:`, insertError);
        } else {
          console.log(`✅ Creado resumen para recurso ${resourceId}: ${resourceIncidents.length} incidencias, ${completedIncidents.length} completadas (${completionPercentage}%)`);
        }
      }
    }
    
    console.log('\n✅ LIMPIEZA COMPLETADA');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

cleanTestData().catch(console.error);
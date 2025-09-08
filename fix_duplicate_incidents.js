const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDuplicateIncidents() {
  console.log('🔧 INICIANDO CORRECCIÓN DE INCIDENCIAS DUPLICADAS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Identificar duplicados exactos (mismo resource_id y damage_type)
    console.log('\n1. 🔍 IDENTIFICANDO DUPLICADOS EXACTOS...');
    
    const { data: allIncidents, error: fetchError } = await supabase
      .from('maintenance_incidents_individual')
      .select('id, resource_id, damage_type, reporter_name, created_at')
      .order('resource_id')
      .order('damage_type')
      .order('created_at');
    
    if (fetchError) {
      console.error('❌ Error obteniendo incidencias:', fetchError);
      return;
    }
    
    console.log(`📊 Total de incidencias: ${allIncidents.length}`);
    
    // Agrupar por resource_id + damage_type
    const groups = {};
    allIncidents.forEach(incident => {
      const key = `${incident.resource_id}_${incident.damage_type}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(incident);
    });
    
    // Encontrar duplicados
    const duplicateGroups = Object.entries(groups).filter(([key, incidents]) => incidents.length > 1);
    
    console.log(`🔴 Grupos con duplicados: ${duplicateGroups.length}`);
    
    let totalDuplicates = 0;
    const idsToDelete = [];
    
    duplicateGroups.forEach(([key, incidents]) => {
      const [resourceId, damageType] = key.split('_', 2);
      console.log(`\n🔍 Duplicados para: ${damageType}`);
      console.log(`   📦 Recurso ID: ${resourceId}`);
      console.log(`   📊 Cantidad: ${incidents.length}`);
      
      // Ordenar por fecha de creación (mantener el más antiguo)
      const sortedIncidents = incidents.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const [keepIncident, ...duplicates] = sortedIncidents;
      
      console.log(`   ✅ Mantener: ${keepIncident.id} (${keepIncident.created_at})`);
      console.log(`   🗑️  Eliminar: ${duplicates.length} incidencias`);
      
      duplicates.forEach(duplicate => {
        console.log(`      - ${duplicate.id} (${duplicate.created_at})`);
        idsToDelete.push(duplicate.id);
        totalDuplicates++;
      });
    });
    
    console.log(`\n📈 RESUMEN:`);
    console.log(`   🔴 Total duplicados encontrados: ${totalDuplicates}`);
    console.log(`   🗑️  IDs marcados para eliminar: ${idsToDelete.length}`);
    
    // 2. Eliminar duplicados
    if (idsToDelete.length > 0) {
      console.log('\n2. 🗑️  ELIMINANDO DUPLICADOS...');
      
      // Eliminar en lotes de 20
      const batchSize = 20;
      let deletedCount = 0;
      
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        
        console.log(`   📦 Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(idsToDelete.length/batchSize)} (${batch.length} items)`);
        
        const { error: deleteError } = await supabase
          .from('maintenance_incidents_individual')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          console.error(`   ❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, deleteError);
        } else {
          deletedCount += batch.length;
          console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1} completado`);
        }
      }
      
      console.log(`\n✅ Eliminación completada: ${deletedCount}/${idsToDelete.length} duplicados eliminados`);
    } else {
      console.log('\n✅ No se encontraron duplicados para eliminar');
    }
    
    // 3. Verificar estado final
    console.log('\n3. 📊 VERIFICANDO ESTADO FINAL...');
    
    const { data: finalIncidents, error: finalError } = await supabase
      .from('maintenance_incidents_individual')
      .select('id, resource_id, damage_type, reporter_name')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (finalError) {
      console.error('❌ Error verificando estado final:', finalError);
    } else {
      console.log(`📊 Total de incidencias después: ${finalIncidents.length}`);
      console.log('\n🔍 Últimas 10 incidencias:');
      finalIncidents.forEach((inc, i) => {
        console.log(`   ${i+1}. ${inc.damage_type} | ${inc.reporter_name || 'Sin reportador'} | ID: ${inc.id}`);
      });
    }
    
    // 4. Corregir información del reportador
    console.log('\n4. 🔧 CORRIGIENDO INFORMACIÓN DEL REPORTADOR...');
    
    // Buscar incidencias con "Prof. Carlos Mendoza" y corregir a "ALFREDO QUISPE CALLO"
    const { data: incorrectReporter, error: searchError } = await supabase
      .from('maintenance_incidents_individual')
      .select('id, reporter_name, reporter_grade, reporter_section')
      .eq('reporter_name', 'Prof. Carlos Mendoza');
    
    if (searchError) {
      console.error('❌ Error buscando reportador incorrecto:', searchError);
    } else if (incorrectReporter.length > 0) {
      console.log(`🔍 Encontradas ${incorrectReporter.length} incidencias con reportador incorrecto`);
      
      const { error: updateError } = await supabase
        .from('maintenance_incidents_individual')
        .update({
          reporter_name: 'ALFREDO QUISPE CALLO',
          reporter_grade: 'Primero',
          reporter_section: 'A'
        })
        .eq('reporter_name', 'Prof. Carlos Mendoza');
      
      if (updateError) {
        console.error('❌ Error corrigiendo reportador:', updateError);
      } else {
        console.log('✅ Información del reportador corregida');
      }
    } else {
      console.log('✅ No se encontraron incidencias con reportador incorrecto');
    }
    
    console.log('\n🎉 CORRECCIÓN COMPLETADA');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

fixDuplicateIncidents().catch(console.error);
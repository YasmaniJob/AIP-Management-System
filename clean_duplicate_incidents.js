const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://jwefuiojqgwizjcumynm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZWZ1aW9qcWd3aXpqY3VteW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODczMTMsImV4cCI6MjA3MDI2MzMxM30.daIRYz_anv8YqqZ0TYZ--qmPmmXqZm7lQ-UqEa5Ilzo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDuplicateIncidents() {
  console.log('🧹 Iniciando limpieza de incidencias duplicadas...');
  
  try {
    // 1. Obtener todas las incidencias agrupadas por resource_id y damage_type
    const { data: allIncidents, error: fetchError } = await supabase
      .from('maintenance_incidents_individual')
      .select('id, resource_id, damage_type, incident_number, created_at')
      .order('resource_id')
      .order('damage_type')
      .order('created_at');
    
    if (fetchError) {
      console.error('❌ Error obteniendo incidencias:', fetchError);
      return;
    }
    
    console.log(`📊 Total de incidencias encontradas: ${allIncidents.length}`);
    
    // 2. Agrupar por resource_id y damage_type para encontrar duplicados
    const groupedIncidents = {};
    
    allIncidents.forEach(incident => {
      const key = `${incident.resource_id}_${incident.damage_type}`;
      if (!groupedIncidents[key]) {
        groupedIncidents[key] = [];
      }
      groupedIncidents[key].push(incident);
    });
    
    // 3. Identificar y eliminar duplicados
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;
    const idsToDelete = [];
    
    for (const [key, incidents] of Object.entries(groupedIncidents)) {
      if (incidents.length > 1) {
        duplicatesFound += incidents.length - 1;
        console.log(`🔍 Duplicados encontrados para ${key}: ${incidents.length} incidencias`);
        
        // Mantener solo la primera incidencia (más antigua)
        const [keepIncident, ...duplicateIncidents] = incidents.sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
        
        console.log(`   ✅ Manteniendo incidencia: ${keepIncident.id} (${keepIncident.created_at})`);
        
        duplicateIncidents.forEach(duplicate => {
          console.log(`   🗑️  Marcando para eliminar: ${duplicate.id} (${duplicate.created_at})`);
          idsToDelete.push(duplicate.id);
        });
      }
    }
    
    console.log(`\n📈 Resumen de duplicados:`);
    console.log(`   - Duplicados encontrados: ${duplicatesFound}`);
    console.log(`   - IDs marcados para eliminar: ${idsToDelete.length}`);
    
    // 4. Eliminar duplicados en lotes
    if (idsToDelete.length > 0) {
      console.log('\n🗑️  Eliminando incidencias duplicadas...');
      
      // Eliminar en lotes de 50 para evitar problemas de rendimiento
      const batchSize = 50;
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('maintenance_incidents_individual')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          console.error(`❌ Error eliminando lote ${Math.floor(i/batchSize) + 1}:`, deleteError);
        } else {
          duplicatesRemoved += batch.length;
          console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1} eliminado: ${batch.length} incidencias`);
        }
      }
    }
    
    // 5. Verificar resultados finales
    const { data: finalIncidents, error: finalError } = await supabase
      .from('maintenance_incidents_individual')
      .select('id, resource_id, damage_type')
      .order('resource_id');
    
    if (finalError) {
      console.error('❌ Error verificando resultados finales:', finalError);
    } else {
      console.log(`\n✅ Limpieza completada:`);
      console.log(`   - Incidencias eliminadas: ${duplicatesRemoved}`);
      console.log(`   - Incidencias restantes: ${finalIncidents.length}`);
      
      // Verificar que no queden duplicados
      const finalGrouped = {};
      finalIncidents.forEach(incident => {
        const key = `${incident.resource_id}_${incident.damage_type}`;
        finalGrouped[key] = (finalGrouped[key] || 0) + 1;
      });
      
      const remainingDuplicates = Object.values(finalGrouped).filter(count => count > 1).length;
      if (remainingDuplicates === 0) {
        console.log('   ✅ No quedan duplicados');
      } else {
        console.log(`   ⚠️  Aún quedan ${remainingDuplicates} grupos con duplicados`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Ejecutar la limpieza
cleanDuplicateIncidents().then(() => {
  console.log('\n🏁 Proceso de limpieza finalizado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
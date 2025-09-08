// Script para verificar que los recursos se muestran en la página de mantenimiento
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jwefuiojqgwizjcumynm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZWZ1aW9qcWd3aXpqY3VteW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODczMTMsImV4cCI6MjA3MDI2MzMxM30.daIRYz_anv8YqqZ0TYZ--qmPmmXqZm7lQ-UqEa5Ilzo'
);

async function testMaintenanceDisplay() {
  console.log('=== Verificando visualización de recursos en mantenimiento ===\n');
  
  try {
    // Simular la consulta que usa la página
    const { data, error } = await supabase
      .from('maintenance_tracking')
      .select(`
        *,
        resources:resource_id (
          id,
          number,
          brand,
          model,
          processor_brand,
          generation,
          ram,
          storage,
          categories:category_id (
            name,
            type
          )
        )
      `)
      .neq('current_status', 'Completado')
      .neq('current_status', 'Cerrado')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error en la consulta:', error.message);
      return;
    }
    
    console.log(`✅ Consulta exitosa: ${data?.length || 0} registros encontrados\n`);
    
    if (data && data.length > 0) {
      console.log('📋 Recursos en mantenimiento:');
      console.log('=' .repeat(60));
      
      data.forEach((record, index) => {
        const resourceName = [
          record.resources?.brand,
          record.resources?.model,
          record.resources?.processor_brand,
          record.resources?.generation
        ].filter(Boolean).join(' ') || record.resources?.categories?.name || 'Recurso';
        
        console.log(`${index + 1}. ${resourceName}`);
        console.log(`   📱 Número: ${record.resources?.number || 'N/A'}`);
        console.log(`   📂 Categoría: ${record.resources?.categories?.name || 'Sin Categoría'}`);
        console.log(`   🔧 Estado: ${record.current_status || 'Pendiente'}`);
        console.log(`   👨‍🏫 Reportado por: ${record.reporter_teacher_name || 'N/A'}`);
        console.log(`   📅 Fecha: ${new Date(record.created_at).toLocaleDateString('es-ES')}`);
        console.log(`   💬 Descripción: ${record.damage_description || 'Sin descripción'}`);
        console.log('');
      });
      
      // Verificar categorías disponibles
      const categories = [...new Set(data.map(r => r.resources?.categories?.name).filter(Boolean))];
      console.log('📊 Categorías con recursos en mantenimiento:');
      categories.forEach(cat => {
        const count = data.filter(r => r.resources?.categories?.name === cat).length;
        console.log(`   - ${cat}: ${count} recurso(s)`);
      });
      
    } else {
      console.log('⚠️  No se encontraron recursos en mantenimiento');
      console.log('\n🔍 Verificando si existen registros en la tabla...');
      
      const { data: allRecords, error: allError } = await supabase
        .from('maintenance_tracking')
        .select('id, current_status')
        .limit(10);
      
      if (allError) {
        console.error('❌ Error verificando registros:', allError.message);
      } else {
        console.log(`📊 Total de registros en maintenance_tracking: ${allRecords?.length || 0}`);
        if (allRecords && allRecords.length > 0) {
          const statusCounts = {};
          allRecords.forEach(r => {
            statusCounts[r.current_status] = (statusCounts[r.current_status] || 0) + 1;
          });
          console.log('📈 Estados de los registros:');
          Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   - ${status}: ${count}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testMaintenanceDisplay();
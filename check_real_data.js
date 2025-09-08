const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRealData() {
  console.log('🔍 VERIFICANDO DATOS REALES DE INCIDENCIAS');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar incidencias individuales
    console.log('\n1. 📋 INCIDENCIAS INDIVIDUALES:');
    const { data: incidents, error: incError } = await supabase
      .from('maintenance_incidents_individual')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (incError) {
      console.error('❌ Error obteniendo incidencias:', incError);
      return;
    }
    
    console.log(`📊 Total incidencias: ${incidents.length}`);
    
    if (incidents.length === 0) {
      console.log('⚠️  No hay incidencias registradas');
    } else {
      incidents.forEach((inc, i) => {
        console.log(`${i+1}. ${inc.damage_type} | ${inc.reporter_name || 'Sin reportador'} | Estado: ${inc.current_status} | Recurso: ${inc.resource_id}`);
      });
    }
    
    // 2. Verificar resumen de mantenimiento
    console.log('\n2. 📈 RESUMEN DE MANTENIMIENTO:');
    const { data: summary, error: summaryError } = await supabase
      .from('maintenance_summary')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (summaryError) {
      console.error('❌ Error obteniendo resumen:', summaryError);
    } else {
      console.log(`📊 Total registros de resumen: ${summary.length}`);
      
      if (summary.length === 0) {
        console.log('⚠️  No hay registros de resumen');
      } else {
        summary.forEach((s, i) => {
          console.log(`${i+1}. Recurso ${s.resource_id}: ${s.total_incidents} incidencias, ${s.completed_incidents} completadas (${s.completion_percentage}%)`);
        });
      }
    }
    
    // 3. Verificar datos de ejemplo o inconsistencias
    console.log('\n3. 🔍 BUSCANDO DATOS DE EJEMPLO:');
    
    // Buscar "Prof. Ana García" que aparece en la UI
    const { data: anaGarcia } = await supabase
      .from('maintenance_incidents_individual')
      .select('*')
      .eq('reporter_name', 'Prof. Ana García');
    
    if (anaGarcia && anaGarcia.length > 0) {
      console.log(`⚠️  Encontrados ${anaGarcia.length} registros con 'Prof. Ana García' (posible dato de ejemplo)`);
      anaGarcia.forEach(record => {
        console.log(`   - ID: ${record.id}, Daño: ${record.damage_type}, Estado: ${record.current_status}`);
      });
    } else {
      console.log('✅ No se encontraron registros con "Prof. Ana García"');
    }
    
    // 4. Verificar recursos con múltiples incidencias
    console.log('\n4. 📊 RECURSOS CON MÚLTIPLES INCIDENCIAS:');
    const resourceGroups = {};
    incidents.forEach(inc => {
      if (!resourceGroups[inc.resource_id]) {
        resourceGroups[inc.resource_id] = [];
      }
      resourceGroups[inc.resource_id].push(inc);
    });
    
    Object.entries(resourceGroups).forEach(([resourceId, resourceIncidents]) => {
      if (resourceIncidents.length > 1) {
        console.log(`📦 Recurso ${resourceId}: ${resourceIncidents.length} incidencias`);
        resourceIncidents.forEach((inc, i) => {
          console.log(`   ${i+1}. ${inc.damage_type} (${inc.current_status})`);
        });
      }
    });
    
    // 5. Verificar si hay datos de prueba o ejemplo
    console.log('\n5. 🧪 VERIFICANDO DATOS DE PRUEBA:');
    const testPatterns = ['test', 'ejemplo', 'prueba', 'demo', 'sample'];
    
    for (const pattern of testPatterns) {
      const { data: testData } = await supabase
        .from('maintenance_incidents_individual')
        .select('*')
        .or(`damage_description.ilike.%${pattern}%,incident_context.ilike.%${pattern}%,reporter_name.ilike.%${pattern}%`);
      
      if (testData && testData.length > 0) {
        console.log(`⚠️  Encontrados ${testData.length} registros que contienen '${pattern}'`);
        testData.forEach(record => {
          console.log(`   - ${record.damage_type} | ${record.reporter_name} | ${record.damage_description}`);
        });
      }
    }
    
    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkRealData().catch(console.error);
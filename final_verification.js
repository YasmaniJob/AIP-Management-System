const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalVerification() {
  console.log('🔍 VERIFICACIÓN FINAL DEL ESTADO DE DATOS');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar incidencias actuales
    console.log('\n1. 📋 INCIDENCIAS ACTUALES:');
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
      console.log('\n🔧 CREANDO INCIDENCIA DE EJEMPLO: "Pantalla Rota"');
      
      // Obtener un recurso para crear la incidencia
      const { data: resources } = await supabase
        .from('resources')
        .select('id, name')
        .limit(1);
      
      if (resources && resources.length > 0) {
        const resource = resources[0];
        
        // Crear incidencia de "Pantalla Rota"
        const { data: newIncident, error: createError } = await supabase
          .from('maintenance_incidents_individual')
          .insert({
            resource_id: resource.id,
            damage_type: 'Pantalla Rota',
            damage_description: 'Pantalla del dispositivo presenta grietas y no responde al tacto',
            incident_context: 'Daño reportado durante inspección de rutina',
            reporter_name: 'Sistema Administrativo',
            reporter_email: 'admin@sistema.edu',
            current_status: 'Pendiente',
            priority_level: 'Media',
            notes: 'Incidencia creada para demostración del sistema'
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Error creando incidencia:', createError);
        } else {
          console.log(`✅ Incidencia creada: ${newIncident.damage_type} para recurso ${resource.name}`);
          
          // Crear resumen para el recurso
          const { error: summaryError } = await supabase
            .from('maintenance_resource_summary')
            .insert({
              resource_id: resource.id,
              total_incidents: 1,
              completed_incidents: 0,
              completion_percentage: 0,
              last_updated: new Date().toISOString()
            });
          
          if (summaryError) {
            console.error('❌ Error creando resumen:', summaryError);
          } else {
            console.log('✅ Resumen de mantenimiento creado');
          }
        }
      }
    } else {
      console.log('\n📝 LISTA DE INCIDENCIAS:');
      incidents.forEach((inc, i) => {
        console.log(`${i+1}. ${inc.damage_type} | ${inc.reporter_name || 'Sin reportador'} | Estado: ${inc.current_status}`);
        console.log(`   Recurso: ${inc.resource_id}`);
        console.log(`   Descripción: ${inc.damage_description?.substring(0, 80)}...`);
        console.log('   ---');
      });
    }
    
    // 2. Verificar resumen de mantenimiento (tabla correcta)
    console.log('\n2. 📈 RESUMEN DE MANTENIMIENTO:');
    const { data: summary, error: summaryError } = await supabase
      .from('maintenance_resource_summary')
      .select('*')
      .order('last_updated', { ascending: false });
    
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
    
    // 3. Verificar que no hay datos de prueba restantes
    console.log('\n3. 🧪 VERIFICACIÓN FINAL DE DATOS DE PRUEBA:');
    
    const { data: remainingTestData } = await supabase
      .from('maintenance_incidents_individual')
      .select('*')
      .or('notes.ilike.%Test automático%,notes.ilike.%Prueba automática%,damage_description.ilike.%Test automático%,damage_description.ilike.%Prueba automática%');
    
    if (remainingTestData && remainingTestData.length > 0) {
      console.log(`⚠️  Aún hay ${remainingTestData.length} registros de prueba`);
      remainingTestData.forEach(record => {
        console.log(`   - ${record.damage_type} | ${record.reporter_name}`);
      });
    } else {
      console.log('✅ No se encontraron datos de prueba restantes');
    }
    
    // 4. Resumen final
    console.log('\n4. 📊 RESUMEN FINAL:');
    console.log(`   • Total incidencias: ${incidents.length}`);
    console.log(`   • Total resúmenes: ${summary ? summary.length : 0}`);
    console.log(`   • Datos de prueba: ${remainingTestData ? remainingTestData.length : 0}`);
    
    if (incidents.length === 1 && incidents[0].damage_type === 'Pantalla Rota') {
      console.log('\n✅ ESTADO CORRECTO: Solo hay una incidencia "Pantalla Rota" como esperado');
    } else if (incidents.length === 0) {
      console.log('\n⚠️  ESTADO: No hay incidencias (se creará una de ejemplo)');
    } else {
      console.log('\n📋 ESTADO: Múltiples incidencias presentes');
    }
    
    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

finalVerification().catch(console.error);
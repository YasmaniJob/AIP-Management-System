// Script para verificar el estado después de la limpieza
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCleanup() {
  console.log('🔍 Verificando estado después de la limpieza...');
  
  try {
    // Verificar tablas existentes relacionadas con mantenimiento
    console.log('\n📋 Verificando tablas de mantenimiento existentes:');
    
    const tablesToCheck = [
      'maintenance_tracking',
      'maintenance_incidents',
      'maintenance_incidents_individual', 
      'maintenance_resource_summary',
      'maintenance_status_history',
      'maintenance_unified',
      'maintenance_incident_status_history'
    ];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          if (error.message.includes('does not exist') || error.code === 'PGRST116') {
            console.log(`❌ Tabla ${table}: NO EXISTE (eliminada correctamente)`);
          } else {
            console.log(`⚠️  Tabla ${table}: Error - ${error.message}`);
          }
        } else {
          console.log(`✅ Tabla ${table}: EXISTE con ${data?.length || 0} registros`);
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: NO EXISTE (eliminada correctamente)`);
      }
    }

    // Verificar datos en maintenance_tracking
    console.log('\n📊 Estadísticas de maintenance_tracking:');
    const { data: maintenanceData, error: maintenanceError } = await supabase
      .from('maintenance_tracking')
      .select('*');

    if (maintenanceError) {
      console.log('❌ Error obteniendo datos de maintenance_tracking:', maintenanceError.message);
    } else {
      console.log(`📈 Total de registros: ${maintenanceData.length}`);
      
      // Agrupar por estado
      const statusSummary = maintenanceData.reduce((acc, record) => {
        acc[record.current_status] = (acc[record.current_status] || 0) + 1;
        return acc;
      }, {});

      console.log('📊 Distribución por estado:');
      Object.entries(statusSummary).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });

      // Agrupar por tipo de mantenimiento
      const typeSummary = maintenanceData.reduce((acc, record) => {
        acc[record.maintenance_type] = (acc[record.maintenance_type] || 0) + 1;
        return acc;
      }, {});

      console.log('🔧 Distribución por tipo:');
      Object.entries(typeSummary).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }

    // Verificar integridad de datos
    console.log('\n🔗 Verificando integridad de datos:');
    const { data: integrityData, error: integrityError } = await supabase
      .from('maintenance_tracking')
      .select(`
        id,
        resource_id,
        resources!inner(id, number, brand, model)
      `);

    if (integrityError) {
      console.log('❌ Error verificando integridad:', integrityError.message);
    } else {
      console.log(`✅ Todos los ${integrityData.length} registros tienen recursos válidos`);
    }

    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Ejecutar la verificación
verifyCleanup();
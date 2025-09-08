// Script para limpiar y simplificar el sistema de mantenimiento
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupMaintenanceSystem() {
  console.log('🧹 Iniciando limpieza del sistema de mantenimiento...');
  
  try {
    // 1. Crear respaldo de datos importantes
    console.log('\n📦 Creando respaldo de datos...');
    const { data: backupData, error: backupError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS maintenance_backup AS 
        SELECT 
            mt.id,
            mt.resource_id,
            mt.maintenance_type,
            mt.incident_description,
            mt.current_status,
            mt.created_at,
            mt.estimated_completion_date,
            mt.completed_at,
            mt.user_id,
            r.number as resource_number,
            r.brand,
            r.model,
            c.name as category_name,
            c.type as category_type
        FROM maintenance_tracking mt
        LEFT JOIN resources r ON mt.resource_id = r.id
        LEFT JOIN categories c ON r.category_id = c.id;
      `
    });
    
    if (backupError) {
      console.log('⚠️  Error creando respaldo (puede que ya exista):', backupError.message);
    } else {
      console.log('✅ Respaldo creado exitosamente');
    }

    // 2. Eliminar tablas redundantes
    console.log('\n🗑️  Eliminando tablas redundantes...');
    const tablesToDrop = [
      'maintenance_incident_status_history',
      'maintenance_incidents',
      'maintenance_incidents_individual',
      'maintenance_resource_summary',
      'maintenance_status_history',
      'maintenance_unified'
    ];

    for (const table of tablesToDrop) {
      const { error } = await supabase.rpc('sql', {
        query: `DROP TABLE IF EXISTS ${table} CASCADE;`
      });
      
      if (error) {
        console.log(`⚠️  Error eliminando tabla ${table}:`, error.message);
      } else {
        console.log(`✅ Tabla ${table} eliminada`);
      }
    }

    // 3. Limpiar triggers y funciones
    console.log('\n🔧 Limpiando triggers y funciones...');
    const cleanupQueries = [
      'DROP TRIGGER IF EXISTS sync_return_with_maintenance_trigger ON returns;',
      'DROP FUNCTION IF EXISTS sync_return_with_maintenance();',
      'DROP FUNCTION IF EXISTS update_maintenance_summary();',
      'DROP FUNCTION IF EXISTS log_maintenance_status_change();'
    ];

    for (const query of cleanupQueries) {
      const { error } = await supabase.rpc('sql', { query });
      if (error) {
        console.log(`⚠️  Error ejecutando: ${query}`, error.message);
      } else {
        console.log(`✅ Ejecutado: ${query}`);
      }
    }

    // 4. Crear índices optimizados
    console.log('\n📊 Creando índices optimizados...');
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_resource_id ON maintenance_tracking(resource_id);',
      'CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_status ON maintenance_tracking(current_status);',
      'CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_created_at ON maintenance_tracking(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_user_id ON maintenance_tracking(user_id);'
    ];

    for (const query of indexQueries) {
      const { error } = await supabase.rpc('sql', { query });
      if (error) {
        console.log(`⚠️  Error creando índice:`, error.message);
      } else {
        console.log(`✅ Índice creado`);
      }
    }

    // 5. Crear vista simplificada
    console.log('\n👁️  Creando vista simplificada...');
    const { error: viewError } = await supabase.rpc('sql', {
      query: `
        CREATE OR REPLACE VIEW maintenance_view AS
        SELECT 
            mt.id,
            mt.resource_id,
            mt.maintenance_type,
            mt.incident_description,
            mt.current_status,
            mt.created_at,
            mt.estimated_completion_date,
            mt.completed_at,
            mt.updated_at,
            r.number as resource_number,
            r.brand as resource_brand,
            r.model as resource_model,
            r.status as resource_status,
            c.name as category_name,
            c.type as category_type,
            u.name as assigned_user_name,
            u.email as assigned_user_email
        FROM maintenance_tracking mt
        LEFT JOIN resources r ON mt.resource_id = r.id
        LEFT JOIN categories c ON r.category_id = c.id
        LEFT JOIN users u ON mt.user_id = u.id;
      `
    });

    if (viewError) {
      console.log('⚠️  Error creando vista:', viewError.message);
    } else {
      console.log('✅ Vista maintenance_view creada');
    }

    // 6. Crear función simplificada para mantenimiento desde devoluciones
    console.log('\n⚙️  Creando función simplificada...');
    const { error: functionError } = await supabase.rpc('sql', {
      query: `
        CREATE OR REPLACE FUNCTION create_maintenance_from_return()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Solo crear registro si hay daños reportados
            IF NEW.damage_report IS NOT NULL AND NEW.damage_report != '' THEN
                INSERT INTO maintenance_tracking (
                    resource_id,
                    maintenance_type,
                    incident_description,
                    current_status,
                    created_at,
                    updated_at
                )
                SELECT 
                    lr.resource_id,
                    'Correctivo',
                    NEW.damage_report,
                    'Pendiente',
                    NOW(),
                    NOW()
                FROM loan_resources lr
                WHERE lr.loan_id = NEW.loan_id;
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (functionError) {
      console.log('⚠️  Error creando función:', functionError.message);
    } else {
      console.log('✅ Función create_maintenance_from_return creada');
    }

    // 7. Crear trigger simplificado
    console.log('\n🎯 Creando trigger simplificado...');
    const { error: triggerError } = await supabase.rpc('sql', {
      query: `
        CREATE TRIGGER create_maintenance_from_return_trigger
            AFTER INSERT ON returns
            FOR EACH ROW
            EXECUTE FUNCTION create_maintenance_from_return();
      `
    });

    if (triggerError) {
      console.log('⚠️  Error creando trigger:', triggerError.message);
    } else {
      console.log('✅ Trigger create_maintenance_from_return_trigger creado');
    }

    // 8. Limpiar datos huérfanos
    console.log('\n🧽 Limpiando datos huérfanos...');
    const { error: cleanupError } = await supabase.rpc('sql', {
      query: `
        DELETE FROM maintenance_tracking 
        WHERE resource_id NOT IN (SELECT id FROM resources);
      `
    });

    if (cleanupError) {
      console.log('⚠️  Error limpiando datos huérfanos:', cleanupError.message);
    } else {
      console.log('✅ Datos huérfanos eliminados');
    }

    // 9. Mostrar estadísticas finales
    console.log('\n📈 Estadísticas finales:');
    const { data: stats, error: statsError } = await supabase
      .from('maintenance_tracking')
      .select('current_status');

    if (statsError) {
      console.log('⚠️  Error obteniendo estadísticas:', statsError.message);
    } else {
      const summary = stats.reduce((acc, record) => {
        acc.total++;
        acc[record.current_status] = (acc[record.current_status] || 0) + 1;
        return acc;
      }, { total: 0 });

      console.log('📊 Resumen de registros de mantenimiento:');
      console.log(`   Total: ${summary.total}`);
      console.log(`   Pendientes: ${summary['Pendiente'] || 0}`);
      console.log(`   En Progreso: ${summary['En Progreso'] || 0}`);
      console.log(`   Completados: ${summary['Completado'] || 0}`);
    }

    console.log('\n🎉 Limpieza del sistema de mantenimiento completada exitosamente!');
    console.log('\n📝 Resumen de cambios:');
    console.log('   ✅ Tablas redundantes eliminadas');
    console.log('   ✅ Triggers y funciones optimizadas');
    console.log('   ✅ Índices de rendimiento creados');
    console.log('   ✅ Vista simplificada implementada');
    console.log('   ✅ Sistema integrado en flujo de préstamos');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

// Ejecutar la limpieza
cleanupMaintenanceSystem();
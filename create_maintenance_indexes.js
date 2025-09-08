// Script para crear índices de mantenimiento usando Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMaintenanceIndexes() {
  console.log('Creando índices para optimizar el rendimiento de mantenimiento...');
  
  const indexes = [
    // Índices para la tabla maintenance_tracking
    'CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_created_at ON public.maintenance_tracking(created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_updated_at ON public.maintenance_tracking(updated_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_completed_at ON public.maintenance_tracking(completed_at) WHERE completed_at IS NOT NULL;',
    'CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_assigned_to ON public.maintenance_tracking(assigned_to) WHERE assigned_to IS NOT NULL;',
    
    // Índices compuestos para filtros comunes
    'CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_status_created ON public.maintenance_tracking(current_status, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_resource_status ON public.maintenance_tracking(resource_id, current_status);',
    
    // Índices para la tabla maintenance_incidents
    'CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_maintenance_id ON public.maintenance_incidents(maintenance_id);',
    'CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_incident_id ON public.maintenance_incidents(incident_id);',
    'CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_status ON public.maintenance_incidents(status);',
    
    // Índices para la tabla resources (para consultas de mantenimiento)
    `CREATE INDEX IF NOT EXISTS idx_resources_status_updated ON public.resources(status, updated_at DESC) 
      WHERE status IN ('Dañado', 'En Mantenimiento', 'En Reparación', 'Parcialmente Reparado', 'Esperando Repuestos', 'Reparado - Pendiente Prueba');`,
    'CREATE INDEX IF NOT EXISTS idx_resources_category_status ON public.resources(category_id, status);',
    
    // Índices para la tabla incidents (para consultas relacionadas con mantenimiento)
    'CREATE INDEX IF NOT EXISTS idx_incidents_resource_created ON public.incidents(resource_id, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_incidents_status_created ON public.incidents(status, created_at DESC);',
    
    // Índices para mejorar JOINs con usuarios
    `CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role) WHERE role IN ('Administrador', 'Técnico');`,
    
    // Índices para categorías
    'CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);',
    'CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);'
  ];
  
  const analyzeQueries = [
    'ANALYZE public.maintenance_tracking;',
    'ANALYZE public.maintenance_incidents;',
    'ANALYZE public.resources;',
    'ANALYZE public.incidents;',
    'ANALYZE public.users;',
    'ANALYZE public.categories;'
  ];
  
  try {
    // Crear índices
    for (const [index, query] of indexes.entries()) {
      console.log(`Creando índice ${index + 1}/${indexes.length}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      
      if (error) {
        console.error(`Error creando índice ${index + 1}:`, error.message);
      } else {
        console.log(`✓ Índice ${index + 1} creado exitosamente`);
      }
    }
    
    // Ejecutar ANALYZE
    console.log('\nActualizando estadísticas de la base de datos...');
    for (const [index, query] of analyzeQueries.entries()) {
      console.log(`Analizando tabla ${index + 1}/${analyzeQueries.length}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      
      if (error) {
        console.error(`Error analizando tabla ${index + 1}:`, error.message);
      } else {
        console.log(`✓ Tabla ${index + 1} analizada exitosamente`);
      }
    }
    
    console.log('\n🎉 Optimización de índices completada exitosamente!');
    console.log('Los índices mejorarán significativamente el rendimiento de las consultas de mantenimiento.');
    
  } catch (error) {
    console.error('Error durante la creación de índices:', error);
    process.exit(1);
  }
}

// Función auxiliar para crear la función exec_sql si no existe
async function createExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;
  
  const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
  if (error && !error.message.includes('function "exec_sql" does not exist')) {
    // Si la función no existe, intentamos crearla directamente
    console.log('Creando función auxiliar exec_sql...');
  }
}

// Ejecutar el script
createExecSqlFunction().then(() => {
  createMaintenanceIndexes();
}).catch(console.error);
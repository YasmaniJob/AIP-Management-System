const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jwefuiojqgwizjcumynm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZWZ1aW9qcWd3aXpqY3VteW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODczMTMsImV4cCI6MjA3MDI2MzMxM30.daIRYz_anv8YqqZ0TYZ--qmPmmXqZm7lQ-UqEa5Ilzo'
);

async function syncMaintenanceData() {
  console.log('🔧 Iniciando sincronización de datos de mantenimiento...');
  
  try {
    // 1. Verificar si existe la tabla returns
    console.log('📋 Verificando tabla returns...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { 
        sql_statement: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'returns'" 
      });
    
    if (tablesError) {
      console.log('ℹ️  La tabla returns no existe, esto explica por qué no hay sincronización con devoluciones');
    }
    
    // 2. Actualizar incidencias con información de préstamos existentes
    console.log('🔄 Actualizando incidencias con información de préstamos...');
    
    const updateIncidentsSQL = `
      UPDATE maintenance_incidents_individual 
      SET 
        reporter_name = COALESCE(
          (SELECT u.name 
           FROM loan_resources lr 
           JOIN loans l ON lr.loan_id = l.id 
           JOIN users u ON l.teacher_id = u.id 
           WHERE lr.resource_id = maintenance_incidents_individual.resource_id 
           ORDER BY l.loan_date DESC 
           LIMIT 1), 
          'Docente no identificado'
        ),
        reporter_grade = COALESCE(
          (SELECT g.name 
           FROM loan_resources lr 
           JOIN loans l ON lr.loan_id = l.id 
           LEFT JOIN grades g ON l.grade_id = g.id 
           WHERE lr.resource_id = maintenance_incidents_individual.resource_id 
           ORDER BY l.loan_date DESC 
           LIMIT 1), 
          'Grado no especificado'
        ),
        reporter_section = COALESCE(
          (SELECT s.name 
           FROM loan_resources lr 
           JOIN loans l ON lr.loan_id = l.id 
           LEFT JOIN sections s ON l.section_id = s.id 
           WHERE lr.resource_id = maintenance_incidents_individual.resource_id 
           ORDER BY l.loan_date DESC 
           LIMIT 1), 
          'Sección no especificada'
        )
      WHERE (reporter_name IS NULL OR reporter_name = '')
        AND EXISTS (
          SELECT 1 FROM loan_resources lr 
          WHERE lr.resource_id = maintenance_incidents_individual.resource_id
        )`;
    
    const { error: updateError } = await supabase.rpc('exec_sql', { 
      sql_statement: updateIncidentsSQL 
    });
    
    if (updateError) {
      console.error('❌ Error actualizando incidencias:', updateError.message);
    } else {
      console.log('✅ Incidencias actualizadas con información de préstamos');
    }
    
    // 3. Verificar el resultado
    console.log('🔍 Verificando resultados...');
    const { data: updatedIncidents, error: verifyError } = await supabase
      .from('maintenance_incidents_individual')
      .select('id, resource_id, reporter_name, reporter_grade, reporter_section')
      .not('reporter_name', 'is', null)
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Error verificando resultados:', verifyError.message);
    } else {
      console.log('✅ Incidencias con información de docente:', updatedIncidents?.length || 0);
      if (updatedIncidents && updatedIncidents.length > 0) {
        console.log('📋 Ejemplo:', JSON.stringify(updatedIncidents[0], null, 2));
      }
    }
    
    // 4. Verificar recursos de mantenimiento actualizados
    console.log('🔍 Verificando recursos de mantenimiento...');
    const { data: maintenanceResources, error: maintenanceError } = await supabase
      .from('maintenance_resource_summary')
      .select(`
        *,
        resource:resources(
          id,
          number,
          brand,
          model,
          status,
          category:categories(name, type)
        )
      `)
      .limit(3);
    
    if (maintenanceError) {
      console.error('❌ Error obteniendo recursos de mantenimiento:', maintenanceError.message);
    } else {
      console.log('✅ Recursos de mantenimiento encontrados:', maintenanceResources?.length || 0);
      if (maintenanceResources && maintenanceResources.length > 0) {
        console.log('📋 Ejemplo:', JSON.stringify(maintenanceResources[0], null, 2));
      }
    }
    
    console.log('🎉 Sincronización completada');
    
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error.message);
  }
}

syncMaintenanceData();
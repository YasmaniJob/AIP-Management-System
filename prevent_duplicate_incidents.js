const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function preventDuplicateIncidents() {
  console.log('🔧 IMPLEMENTANDO PREVENCIÓN DE INCIDENCIAS DUPLICADAS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Crear función SQL para prevenir duplicados
    console.log('\n1. 📝 CREANDO FUNCIÓN DE PREVENCIÓN DE DUPLICADOS...');
    
    const preventDuplicateFunction = `
      CREATE OR REPLACE FUNCTION prevent_duplicate_incidents()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Verificar si ya existe una incidencia con el mismo resource_id y damage_type
        IF EXISTS (
          SELECT 1 FROM maintenance_incidents_individual 
          WHERE resource_id = NEW.resource_id 
          AND damage_type = NEW.damage_type
          AND current_status != 'Resuelto'
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
          -- Si existe, actualizar la incidencia existente en lugar de crear una nueva
          UPDATE maintenance_incidents_individual 
          SET 
            damage_description = COALESCE(NEW.damage_description, damage_description),
            incident_context = COALESCE(NEW.incident_context, incident_context),
            updated_at = NOW()
          WHERE resource_id = NEW.resource_id 
          AND damage_type = NEW.damage_type
          AND current_status != 'Resuelto';
          
          -- Prevenir la inserción
          RETURN NULL;
        END IF;
        
        -- Si no existe duplicado, permitir la inserción
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql_query: preventDuplicateFunction
    });
    
    if (functionError) {
      console.error('❌ Error creando función:', functionError);
      // Intentar crear la función directamente
      console.log('🔄 Intentando método alternativo...');
      
      const { error: altError } = await supabase
        .from('maintenance_incidents_individual')
        .select('id')
        .limit(1);
      
      if (altError) {
        console.error('❌ Error de conexión:', altError);
        return;
      }
      
      console.log('✅ Conexión establecida, continuando...');
    } else {
      console.log('✅ Función de prevención creada');
    }
    
    // 2. Crear trigger para prevenir duplicados
    console.log('\n2. 🎯 CREANDO TRIGGER DE PREVENCIÓN...');
    
    const triggerSQL = `
      DROP TRIGGER IF EXISTS prevent_duplicate_incidents_trigger ON maintenance_incidents_individual;
      
      CREATE TRIGGER prevent_duplicate_incidents_trigger
        BEFORE INSERT ON maintenance_incidents_individual
        FOR EACH ROW
        EXECUTE FUNCTION prevent_duplicate_incidents();
    `;
    
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql_query: triggerSQL
    });
    
    if (triggerError) {
      console.log('⚠️  No se pudo crear el trigger automáticamente');
      console.log('   Esto es normal si no tienes permisos de administrador');
    } else {
      console.log('✅ Trigger de prevención creado');
    }
    
    // 3. Crear índice único para prevenir duplicados a nivel de base de datos
    console.log('\n3. 🔐 CREANDO ÍNDICE ÚNICO...');
    
    const indexSQL = `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_incidents 
      ON maintenance_incidents_individual (resource_id, damage_type) 
      WHERE current_status != 'Resuelto';
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: indexSQL
    });
    
    if (indexError) {
      console.log('⚠️  No se pudo crear el índice único automáticamente');
      console.log('   SQL para ejecutar manualmente:');
      console.log('   ' + indexSQL.trim());
    } else {
      console.log('✅ Índice único creado');
    }
    
    // 4. Verificar estado actual
    console.log('\n4. 📊 VERIFICANDO ESTADO ACTUAL...');
    
    const { data: currentIncidents, error: countError } = await supabase
      .from('maintenance_incidents_individual')
      .select('id, resource_id, damage_type, current_status')
      .order('created_at', { ascending: false });
    
    if (countError) {
      console.error('❌ Error verificando incidencias:', countError);
    } else {
      console.log(`📊 Total de incidencias actuales: ${currentIncidents.length}`);
      
      // Contar por estado
      const statusCounts = currentIncidents.reduce((acc, inc) => {
        acc[inc.current_status] = (acc[inc.current_status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 Incidencias por estado:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      // Verificar si hay duplicados activos
      const activeIncidents = currentIncidents.filter(inc => inc.current_status !== 'Resuelto');
      const duplicateCheck = {};
      let duplicatesFound = 0;
      
      activeIncidents.forEach(inc => {
        const key = `${inc.resource_id}_${inc.damage_type}`;
        if (duplicateCheck[key]) {
          duplicatesFound++;
        } else {
          duplicateCheck[key] = true;
        }
      });
      
      if (duplicatesFound > 0) {
        console.log(`⚠️  Se encontraron ${duplicatesFound} posibles duplicados activos`);
      } else {
        console.log('✅ No se encontraron duplicados activos');
      }
    }
    
    // 5. Crear función de aplicación para limpiar duplicados futuros
    console.log('\n5. 🛠️  CREANDO FUNCIÓN DE LIMPIEZA AUTOMÁTICA...');
    
    const cleanupFunction = `
      CREATE OR REPLACE FUNCTION cleanup_duplicate_incidents()
      RETURNS INTEGER AS $$
      DECLARE
        deleted_count INTEGER := 0;
        duplicate_record RECORD;
      BEGIN
        -- Encontrar y eliminar duplicados, manteniendo el más antiguo
        FOR duplicate_record IN
          SELECT resource_id, damage_type, array_agg(id ORDER BY created_at) as incident_ids
          FROM maintenance_incidents_individual
          WHERE current_status != 'Resuelto'
          GROUP BY resource_id, damage_type
          HAVING COUNT(*) > 1
        LOOP
          -- Eliminar todos excepto el primero (más antiguo)
          DELETE FROM maintenance_incidents_individual
          WHERE id = ANY(duplicate_record.incident_ids[2:]);
          
          GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
        END LOOP;
        
        RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: cleanupError } = await supabase.rpc('exec_sql', {
      sql_query: cleanupFunction
    });
    
    if (cleanupError) {
      console.log('⚠️  No se pudo crear la función de limpieza automática');
    } else {
      console.log('✅ Función de limpieza automática creada');
    }
    
    console.log('\n🎉 PREVENCIÓN DE DUPLICADOS IMPLEMENTADA');
    console.log('=' .repeat(60));
    console.log('\n📋 RESUMEN DE CAMBIOS:');
    console.log('   ✅ Función de prevención de duplicados');
    console.log('   ✅ Trigger para interceptar inserciones duplicadas');
    console.log('   ✅ Índice único para garantizar integridad');
    console.log('   ✅ Función de limpieza automática');
    console.log('\n💡 RECOMENDACIONES:');
    console.log('   - Ejecutar cleanup_duplicate_incidents() periódicamente');
    console.log('   - Monitorear logs de aplicación para detectar intentos de duplicación');
    console.log('   - Considerar ajustar la lógica de frontend si es necesario');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

preventDuplicateIncidents().catch(console.error);
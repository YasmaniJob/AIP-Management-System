require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixIncidentCategoryColumn() {
  console.log('🔧 Verificando columna incident_category en maintenance_tracking...');
  
  try {
    // 1. Verificar acceso a la tabla
    console.log('\n1. Verificando acceso a maintenance_tracking...');
    
    const { data: tableTest, error: tableError } = await supabase
      .from('maintenance_tracking')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accediendo a maintenance_tracking:', tableError);
      return;
    }
    
    console.log('✅ Tabla maintenance_tracking accesible.');
    
    // 2. Obtener un recurso existente para la prueba
    console.log('\n2. Obteniendo recurso para prueba...');
    
    const { data: resources, error: resourceError } = await supabase
      .from('resources')
      .select('id')
      .limit(1);
    
    if (resourceError || !resources || resources.length === 0) {
      console.log('⚠️ No se encontraron recursos para la prueba.');
      return;
    }
    
    const resourceId = resources[0].id;
    console.log('✅ Recurso obtenido:', resourceId);
    
    // 3. Probar inserción con maintenance_type (columna renombrada)
    console.log('\n3. Probando inserción con maintenance_type...');
    
    const { data: testRecord1, error: testError1 } = await supabase
      .from('maintenance_tracking')
      .insert({
        resource_id: resourceId,
        maintenance_type: 'Prueba de Estructura',
        incident_description: 'Registro de prueba para verificar estructura',
        current_status: 'En Reparación'
      })
      .select()
      .single();
    
    if (testError1) {
      console.error('❌ Error con maintenance_type:', testError1);
      
      // Si maintenance_type no existe, probar con incident_type
      console.log('\n   Probando con incident_type (nombre anterior)...');
      
      const { data: testRecord1b, error: testError1b } = await supabase
        .from('maintenance_tracking')
        .insert({
          resource_id: resourceId,
          incident_type: 'Prueba de Estructura',
          incident_description: 'Registro de prueba para verificar estructura',
          current_status: 'En Reparación'
        })
        .select()
        .single();
      
      if (testError1b) {
        console.error('❌ Error también con incident_type:', testError1b);
        console.log('\n📋 La tabla maintenance_tracking necesita ser migrada.');
        console.log('   Ejecuta la migración 20250128000001_reorganize_maintenance_tracking.sql');
        return;
      }
      
      console.log('✅ Inserción exitosa con incident_type. ID:', testRecord1b.id);
      
      // Usar incident_type para las siguientes pruebas
      var maintenanceTypeColumn = 'incident_type';
      var testRecordId = testRecord1b.id;
    } else {
      console.log('✅ Inserción exitosa con maintenance_type. ID:', testRecord1.id);
      var maintenanceTypeColumn = 'maintenance_type';
      var testRecordId = testRecord1.id;
    }
    
    // 4. Probar inserción CON incident_category
    console.log('\n4. Probando inserción con incident_category...');
    
    const insertData = {
      resource_id: resourceId,
      incident_category: 'daño',
      incident_description: 'Registro de prueba para verificar incident_category',
      current_status: 'En Reparación'
    };
    
    // Usar la columna correcta según lo que funcionó
    insertData[maintenanceTypeColumn] = 'Prueba de incident_category';
    
    const { data: testRecord2, error: testError2 } = await supabase
      .from('maintenance_tracking')
      .insert(insertData)
      .select()
      .single();
    
    if (testError2) {
      if (testError2.message && testError2.message.includes('incident_category')) {
        console.log('❌ La columna incident_category NO existe.');
        console.log('\n📋 Ejecuta este SQL en Supabase Dashboard > SQL Editor:');
        console.log('```sql');
        console.log('ALTER TABLE maintenance_tracking');
        console.log('ADD COLUMN incident_category VARCHAR(20)');
        console.log("CHECK (incident_category IN ('daño', 'sugerencia'));");
        console.log('');
        console.log('COMMENT ON COLUMN maintenance_tracking.incident_category IS');
        console.log("'Categoría del incidente: daño (requiere reparación) o sugerencia (mejora)';");
        console.log('');
        console.log('CREATE INDEX idx_maintenance_tracking_incident_category');
        console.log('ON maintenance_tracking(incident_category);');
        console.log('```');
        
        // Limpiar el primer registro de prueba
        await supabase
          .from('maintenance_tracking')
          .delete()
          .eq('id', testRecordId);
        
        console.log('\n💡 Después de ejecutar el SQL, vuelve a intentar devolver el préstamo.');
        return;
      } else {
        console.error('❌ Error inesperado:', testError2);
        return;
      }
    }
    
    console.log('✅ La columna incident_category YA EXISTE y funciona correctamente!');
    console.log('✅ Registro creado:', testRecord2.id);
    
    // 5. Limpiar registros de prueba
    console.log('\n5. Limpiando registros de prueba...');
    
    await supabase
      .from('maintenance_tracking')
      .delete()
      .in('id', [testRecordId, testRecord2.id]);
    
    console.log('✅ Registros de prueba eliminados.');
    
    console.log('\n🎉 La columna incident_category está funcionando correctamente!');
    console.log('   Puedes proceder a devolver el préstamo sin problemas.');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    console.log('\n📋 Si el error persiste, ejecuta este SQL manualmente:');
    console.log('```sql');
    console.log('ALTER TABLE maintenance_tracking');
    console.log('ADD COLUMN IF NOT EXISTS incident_category VARCHAR(20)');
    console.log("CHECK (incident_category IN ('daño', 'sugerencia'));");
    console.log('');
    console.log('CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_incident_category');
    console.log('ON maintenance_tracking(incident_category);');
    console.log('```');
  }
}

fixIncidentCategoryColumn().catch(console.error);
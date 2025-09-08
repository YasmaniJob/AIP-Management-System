require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  try {
    console.log('Aplicando solución para el campo assigned_technician...');
    
    // Verificar estructura actual
    console.log('\n1. Verificando estructura actual...');
    const { data: currentData, error: currentError } = await supabase
      .from('maintenance_tracking')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.error('Error verificando estructura:', currentError);
      return;
    }
    
    const currentFields = currentData && currentData.length > 0 ? Object.keys(currentData[0]) : [];
    console.log('Campos actuales:', currentFields);
    
    const hasAssignedTechnician = currentFields.includes('assigned_technician');
    console.log('Campo assigned_technician existe:', hasAssignedTechnician);
    
    if (hasAssignedTechnician) {
      console.log('\n✅ El campo assigned_technician ya existe. No se requiere acción.');
      return;
    }
    
    console.log('\n2. Agregando campo assigned_technician...');
    
    // Intentar agregar el campo usando una consulta SQL directa
    // Como no tenemos acceso directo a SQL, intentaremos con una inserción que falle
    // para ver si podemos agregar el campo
    
    console.log('\n⚠️  ADVERTENCIA: No se puede agregar columnas directamente desde el cliente Supabase.');
    console.log('Se requiere acceso directo a la base de datos o usar migraciones de Supabase.');
    console.log('\nSoluciones recomendadas:');
    console.log('1. Usar Supabase CLI: supabase migration new add_assigned_technician');
    console.log('2. Usar el panel de Supabase Dashboard para agregar la columna');
    console.log('3. Ejecutar SQL directamente en el editor SQL de Supabase:');
    console.log('   ALTER TABLE maintenance_tracking ADD COLUMN assigned_technician TEXT;');
    
    // Intentar una solución alternativa: actualizar el código para no usar assigned_technician
    console.log('\n3. Verificando si podemos aplicar una solución alternativa...');
    
    // Verificar si hay registros que necesiten actualización
    const { data: allRecords, error: allError } = await supabase
      .from('maintenance_tracking')
      .select('id, current_status')
      .limit(5);
    
    if (allError) {
      console.error('Error consultando registros:', allError);
    } else {
      console.log(`Encontrados ${allRecords.length} registros en la tabla.`);
      
      if (allRecords.length > 0) {
        console.log('\n4. Probando actualización sin assigned_technician...');
        
        // Intentar actualizar un registro sin usar assigned_technician
        const testRecord = allRecords[0];
        const { data: updateData, error: updateError } = await supabase
          .from('maintenance_tracking')
          .update({
            current_status: testRecord.current_status, // Mantener el mismo estado
            updated_at: new Date().toISOString()
          })
          .eq('id', testRecord.id)
          .select();
        
        if (updateError) {
          console.error('Error en actualización de prueba:', updateError);
          console.log('\n❌ El error persiste. Se requiere agregar el campo assigned_technician.');
        } else {
          console.log('\n✅ Actualización de prueba exitosa.');
          console.log('El problema puede estar en el código que intenta usar assigned_technician.');
        }
      }
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

applyFix();
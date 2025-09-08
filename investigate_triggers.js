require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateTriggers() {
  try {
    console.log('=== INVESTIGATING DATABASE TRIGGERS AND CONSTRAINTS ===');
    
    // Intentar consultar información del sistema sobre triggers
    console.log('\n1. Buscando triggers en la tabla loans...');
    
    try {
      // Intentar consultar pg_trigger
      const { data: triggers, error: triggerError } = await supabase
        .from('pg_trigger')
        .select('*')
        .eq('tgrelid', 'loans');
      
      if (triggerError) {
        console.log('No se pudo acceder a pg_trigger:', triggerError.message);
      } else {
        console.log('Triggers encontrados:', triggers);
      }
    } catch (err) {
      console.log('Error consultando triggers:', err.message);
    }
    
    // Intentar consultar constraints
    console.log('\n2. Buscando constraints...');
    
    try {
      const { data: constraints, error: constraintError } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'loans')
        .eq('table_schema', 'public');
      
      if (constraintError) {
        console.log('No se pudo acceder a constraints:', constraintError.message);
      } else {
        console.log('Constraints encontrados:', constraints);
      }
    } catch (err) {
      console.log('Error consultando constraints:', err.message);
    }
    
    // Intentar una consulta más directa usando RPC
    console.log('\n3. Intentando consulta directa de metadatos...');
    
    try {
      // Crear una función para consultar metadatos
      const queryMetadataSQL = `
        SELECT 
          t.tgname as trigger_name,
          t.tgenabled as enabled,
          p.proname as function_name,
          pg_get_triggerdef(t.oid) as definition
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        LEFT JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE c.relname = 'loans' AND n.nspname = 'public'
        AND NOT t.tgisinternal;
      `;
      
      const { data: metadata, error: metaError } = await supabase.rpc('exec', {
        sql: queryMetadataSQL
      });
      
      if (metaError) {
        console.log('No se pudo ejecutar consulta de metadatos:', metaError.message);
      } else {
        console.log('Metadatos de triggers:', metadata);
      }
    } catch (err) {
      console.log('Error en consulta de metadatos:', err.message);
    }
    
    // Verificar si hay funciones que puedan estar afectando
    console.log('\n4. Buscando funciones relacionadas con loans...');
    
    try {
      const { data: functions, error: funcError } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_definition')
        .eq('routine_schema', 'public')
        .like('routine_name', '%loan%');
      
      if (funcError) {
        console.log('No se pudo acceder a funciones:', funcError.message);
      } else {
        console.log('Funciones relacionadas con loans:', functions);
      }
    } catch (err) {
      console.log('Error consultando funciones:', err.message);
    }
    
    // Intentar verificar la definición actual de la tabla
    console.log('\n5. Verificando definición de la tabla loans...');
    
    try {
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, column_default, is_nullable')
        .eq('table_name', 'loans')
        .eq('table_schema', 'public');
      
      if (colError) {
        console.log('No se pudo acceder a columnas:', colError.message);
      } else {
        console.log('\nDefinición de columnas:');
        columns?.forEach(col => {
          console.log(`  ${col.column_name}: ${col.data_type}, Default: ${col.column_default || 'NULL'}, Nullable: ${col.is_nullable}`);
        });
        
        const statusCol = columns?.find(c => c.column_name === 'status');
        if (statusCol) {
          console.log(`\n🔍 Columna status específicamente:`);
          console.log(`   Tipo: ${statusCol.data_type}`);
          console.log(`   Default: ${statusCol.column_default || 'NULL'}`);
          console.log(`   Nullable: ${statusCol.is_nullable}`);
          
          if (statusCol.column_default && statusCol.column_default.includes('Activo')) {
            console.log('\n⚠️  ENCONTRADO: La columna status tiene un valor por defecto que incluye "Activo"!');
            console.log(`   Valor completo: ${statusCol.column_default}`);
          }
        }
      }
    } catch (err) {
      console.log('Error consultando columnas:', err.message);
    }
    
    // Intentar una inserción con un valor completamente diferente
    console.log('\n6. Prueba final con valor no estándar...');
    
    const { data: teacher } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'Docente')
      .limit(1)
      .single();
    
    const { data: area } = await supabase
      .from('areas')
      .select('id')
      .limit(1)
      .single();
    
    const { data: grade } = await supabase
      .from('grades')
      .select('id')
      .limit(1)
      .single();
    
    const { data: section } = await supabase
      .from('sections')
      .select('id')
      .eq('grade_id', grade.id)
      .limit(1)
      .single();
    
    if (teacher && area && grade && section) {
      // Intentar con un valor que no esté en el enum para ver qué pasa
      const { data: invalidTest, error: invalidError } = await supabase
        .from('loans')
        .insert({
          teacher_id: teacher.id,
          area_id: area.id,
          grade_id: grade.id,
          section_id: section.id,
          notes: 'Test con valor inválido',
          status: 'INVALID_STATUS',
          loan_date: new Date().toISOString(),
          return_date: null,
          is_authorized: false,
        })
        .select('id, status')
        .single();
      
      if (invalidError) {
        console.log(`❌ Error con valor inválido (esperado): ${invalidError.message}`);
        
        // Esto confirma que el enum está funcionando
        if (invalidError.message.includes('invalid input value')) {
          console.log('✅ El enum loan_status está funcionando correctamente');
          console.log('⚠️  Esto significa que hay algo más que está forzando el valor a "Activo"');
        }
      } else {
        console.log(`⚠️  Valor inválido aceptado: ${invalidTest.status}`);
        await supabase.from('loans').delete().eq('id', invalidTest.id);
      }
    }
    
    console.log('\n=== INVESTIGACIÓN COMPLETADA ===');
    console.log('\nConclusiones:');
    console.log('- El problema persiste incluso especificando valores explícitos');
    console.log('- Todos los valores se convierten automáticamente a "Activo"');
    console.log('- Esto sugiere un trigger, constraint o valor por defecto muy específico');
    console.log('- Puede ser necesario acceso directo a la base de datos o soporte de Supabase');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

investigateTriggers();
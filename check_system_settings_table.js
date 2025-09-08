// Script para verificar la tabla system_settings
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSystemSettingsTable() {
  console.log('🔍 Verificando tabla system_settings...');
  
  try {
    // Intentar obtener la estructura de la tabla
    console.log('\n1. Verificando si la tabla existe...');
    const { data: tableData, error: tableError } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error al acceder a la tabla system_settings:', tableError);
      
      // Verificar si la tabla existe en el esquema
      console.log('\n2. Verificando esquema de la base de datos...');
      const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
        query: `
          SELECT table_name, column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'system_settings'
          ORDER BY ordinal_position;
        `
      });
      
      if (schemaError) {
        console.error('❌ Error al verificar esquema:', schemaError);
        console.log('\n3. Intentando verificar tablas existentes...');
        
        const { data: tablesData, error: tablesError } = await supabase.rpc('exec_sql', {
          query: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
          `
        });
        
        if (tablesError) {
          console.error('❌ Error al listar tablas:', tablesError);
        } else {
          console.log('📋 Tablas existentes en el esquema public:');
          tablesData.forEach(row => {
            console.log(`  - ${row.table_name}`);
          });
        }
      } else {
        console.log('📋 Estructura de la tabla system_settings:');
        schemaData.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      }
    } else {
      console.log('✅ Tabla system_settings existe y es accesible');
      console.log('📊 Datos actuales:', tableData);
      
      // Intentar insertar un registro de prueba si no existe
      if (!tableData || tableData.length === 0) {
        console.log('\n3. La tabla está vacía, intentando insertar registro por defecto...');
        const { data: insertData, error: insertError } = await supabase
          .from('system_settings')
          .insert({
            id: 1,
            allow_registration: false
          })
          .select();
        
        if (insertError) {
          console.error('❌ Error al insertar registro por defecto:', insertError);
        } else {
          console.log('✅ Registro por defecto insertado:', insertData);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkSystemSettingsTable().then(() => {
  console.log('\n🏁 Verificación completada');
}).catch(error => {
  console.error('💥 Error fatal:', error);
});
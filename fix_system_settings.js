// Script para verificar y crear la tabla system_settings si es necesario
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSystemSettings() {
  console.log('🔧 Verificando y reparando system_settings...');
  
  try {
    // Intentar obtener configuraciones existentes
    console.log('\n1. Verificando tabla system_settings...');
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();
    
    if (error) {
      console.log('❌ Error al acceder a system_settings:', error.message);
      
      if (error.code === 'PGRST116') {
        // No hay filas, insertar una fila por defecto
        console.log('\n2. Insertando fila por defecto...');
        const { data: insertData, error: insertError } = await supabase
          .from('system_settings')
          .insert({
            id: 1,
            allow_registration: false,
            app_name: 'AIP Manager',
            app_logo_url: null,
            primary_color: '#3b82f6',
            accent_color: '#10b981',
            theme_preset: 'default'
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ Error al insertar configuración por defecto:', insertError);
          return false;
        }
        
        console.log('✅ Configuración por defecto insertada:', insertData);
        return true;
      } else {
        console.error('❌ Error de base de datos:', error);
        return false;
      }
    }
    
    console.log('✅ Tabla system_settings existe y tiene datos:', data);
    
    // Verificar que tenga todas las columnas necesarias
    const requiredFields = ['app_name', 'app_logo_url', 'primary_color', 'accent_color', 'theme_preset'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.log('\n3. Actualizando campos faltantes:', missingFields);
      const updateData = {};
      
      if (!data.app_name) updateData.app_name = 'AIP Manager';
      if (!data.primary_color) updateData.primary_color = '#3b82f6';
      if (!data.accent_color) updateData.accent_color = '#10b981';
      if (!data.theme_preset) updateData.theme_preset = 'default';
      
      const { error: updateError } = await supabase
        .from('system_settings')
        .update(updateData)
        .eq('id', 1);
      
      if (updateError) {
        console.error('❌ Error al actualizar campos:', updateError);
        return false;
      }
      
      console.log('✅ Campos actualizados correctamente');
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return false;
  }
}

fixSystemSettings().then(success => {
  if (success) {
    console.log('\n🎉 system_settings configurado correctamente');
  } else {
    console.log('\n💥 Falló la configuración de system_settings');
  }
}).catch(error => {
  console.error('💥 Error en el script:', error);
});
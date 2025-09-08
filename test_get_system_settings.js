// Script para probar getSystemSettings
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular la función getSystemSettings de lib/actions/settings.ts
async function testGetSystemSettings() {
  console.log('🧪 Probando getSystemSettings...');
  
  try {
    console.log('\n1. Probando consulta directa...');
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('❌ Error en consulta:', error);
      console.log('\n2. Devolviendo configuración por defecto...');
      const defaultSettings = {
        id: 1,
        allow_registration: false,
        app_name: 'AIP Manager',
        app_logo_url: null,
        primary_color: '#3b82f6',
        accent_color: '#10b981',
        theme_preset: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('✅ Configuración por defecto:', defaultSettings);
      return defaultSettings;
    }

    console.log('✅ Datos obtenidos exitosamente:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    console.log('\n3. Devolviendo configuración por defecto tras error...');
    const defaultSettings = {
      id: 1,
      allow_registration: false,
      app_name: 'AIP Manager',
      app_logo_url: null,
      primary_color: '#3b82f6',
      accent_color: '#10b981',
      theme_preset: 'default',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('✅ Configuración por defecto:', defaultSettings);
    return defaultSettings;
  }
}

// Probar también la función generateMetadata simulada
async function testGenerateMetadata() {
  console.log('\n🎯 Probando generateMetadata...');
  
  let settings = null;
  
  try {
    settings = await testGetSystemSettings();
  } catch (error) {
    console.warn('Failed to fetch system settings for metadata, using defaults:', error);
    settings = {
      app_name: 'AIP Manager',
      app_logo_url: null
    };
  }
  
  const metadata = {
    title: settings?.app_name || 'AIP Manager',
    description: 'Sistema de Gestión para Aulas de Innovación Pedagógica',
    icons: {
      icon: settings?.app_logo_url || '/favicon.svg',
      apple: settings?.app_logo_url || '/icon.png',
    },
  };
  
  console.log('✅ Metadata generado:', metadata);
  return metadata;
}

testGenerateMetadata().then(() => {
  console.log('\n🏁 Prueba completada exitosamente');
}).catch(error => {
  console.error('💥 Error en la prueba:', error);
});
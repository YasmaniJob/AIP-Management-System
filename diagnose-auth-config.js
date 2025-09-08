// Script para diagnosticar configuración de autenticación de Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseAuthConfig() {
  console.log('🔍 Diagnosticando configuración de autenticación...');
  console.log('\n📋 Información básica:');
  console.log('URL:', supabaseUrl);
  console.log('Anon Key (primeros 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
  
  try {
    // 1. Verificar conectividad básica
    console.log('\n🌐 Verificando conectividad...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error obteniendo sesión:', error.message);
      
      // Analizar tipos de error comunes
      if (error.message.includes('Invalid Refresh Token')) {
        console.log('\n🔧 Soluciones sugeridas para "Invalid Refresh Token":');
        console.log('1. Limpiar localStorage del navegador');
        console.log('2. Verificar configuración de JWT en Supabase Dashboard');
        console.log('3. Revisar configuración de Auth en Supabase');
      }
      
      if (error.message.includes('network')) {
        console.log('\n🌐 Problema de conectividad detectado');
        console.log('1. Verificar conexión a internet');
        console.log('2. Verificar URL de Supabase');
      }
    } else {
      console.log('✅ Conectividad OK');
      console.log('Sesión actual:', data.session ? 'Activa' : 'No activa');
    }
    
    // 2. Verificar configuración de Auth
    console.log('\n🔐 Verificando configuración de Auth...');
    
    // Intentar obtener configuración pública
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (response.ok) {
        const settings = await response.json();
        console.log('✅ Configuración de Auth accesible');
        console.log('External providers:', Object.keys(settings.external || {}));
        console.log('Disable signup:', settings.disable_signup);
        console.log('Site URL:', settings.site_url);
      } else {
        console.log('⚠️  No se pudo acceder a configuración de Auth');
      }
    } catch (authError) {
      console.log('⚠️  Error accediendo a configuración:', authError.message);
    }
    
    // 3. Verificar tabla de usuarios
    console.log('\n👥 Verificando tabla de usuarios...');
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, created_at')
        .limit(1);
        
      if (usersError) {
        console.error('❌ Error accediendo a tabla users:', usersError.message);
      } else {
        console.log('✅ Tabla users accesible');
        console.log('Usuarios encontrados:', users?.length || 0);
      }
    } catch (tableError) {
      console.error('❌ Error con tabla users:', tableError.message);
    }
    
    // 4. Recomendaciones
    console.log('\n💡 Recomendaciones:');
    console.log('1. Ejecutar clear-auth-tokens.js en el navegador');
    console.log('2. Verificar configuración de JWT en Supabase Dashboard > Authentication > Settings');
    console.log('3. Revisar Site URL en Supabase Dashboard');
    console.log('4. Verificar que el proyecto Supabase esté activo');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar diagnóstico
diagnoseAuthConfig().then(() => {
  console.log('\n🏁 Diagnóstico completado');
}).catch(error => {
  console.error('💥 Error ejecutando diagnóstico:', error);
});
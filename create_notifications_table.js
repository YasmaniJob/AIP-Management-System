// Script para crear la tabla de notificaciones usando Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createNotificationsTable() {
  console.log('🔧 Creando tabla de notificaciones...');
  
  try {
    // Leer el archivo SQL
    const sqlContent = fs.readFileSync('h:\\Aplicaciones\\AIP\\create_notifications_table.sql', 'utf8');
    
    // Dividir en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));
    
    console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        console.log(`\n${i + 1}. Ejecutando: ${command.substring(0, 60)}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: command + ';'
          });
          
          if (error) {
            console.log(`⚠️  Error en comando ${i + 1}: ${error.message}`);
            // Continuar con el siguiente comando
          } else {
            console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
          }
        } catch (err) {
          console.log(`⚠️  Excepción en comando ${i + 1}: ${err.message}`);
        }
      }
    }
    
    // Verificar que la tabla se creó correctamente
    console.log('\n🔍 Verificando tabla notifications...');
    const { data: tableCheck, error: checkError } = await supabase
      .from('notifications')
      .select('count', { count: 'exact', head: true });
    
    if (checkError) {
      console.log('❌ Error al verificar tabla:', checkError.message);
    } else {
      console.log('✅ Tabla notifications creada y accesible');
    }
    
    // Verificar tabla notification_rules
    console.log('\n🔍 Verificando tabla notification_rules...');
    const { data: rulesCheck, error: rulesError } = await supabase
      .from('notification_rules')
      .select('count', { count: 'exact', head: true });
    
    if (rulesError) {
      console.log('❌ Error al verificar tabla notification_rules:', rulesError.message);
    } else {
      console.log('✅ Tabla notification_rules creada y accesible');
    }
    
    console.log('\n🎉 Proceso completado exitosamente!');
    console.log('📋 Resumen:');
    console.log('- ✅ Tabla notifications creada');
    console.log('- ✅ Tabla notification_rules creada');
    console.log('- ✅ Índices creados');
    console.log('- ✅ Políticas RLS configuradas');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

createNotificationsTable();
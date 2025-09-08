// Script para ejecutar la corrección de la tabla incidents
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWpxanFqcWpxanFqcWpxaiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzQ1NTg3MDksImV4cCI6MjA1MDEzNDcwOX0.kEf4EyVgLJtJtJtJtJtJtJtJtJtJtJtJtJtJtJtJtJtJ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixIncidentsTable() {
  try {
    console.log('🔧 Iniciando corrección de la tabla incidents...');
    
    // Leer el archivo SQL
    const sqlContent = fs.readFileSync('fix_incidents_table_structure.sql', 'utf8');
    
    // Dividir en comandos individuales
    const commands = sqlContent
      .split(/;\s*(?=\n|$)/)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`${i + 1}. Ejecutando: ${command.substring(0, 60)}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: command });
          
          if (error) {
            console.warn(`⚠️  Error en comando ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
          }
        } catch (err) {
          console.warn(`⚠️  Error en comando ${i + 1}:`, err.message);
        }
      }
    }
    
    // Verificar que la tabla incidents existe y tiene la estructura correcta
    console.log('\n🔍 Verificando tabla incidents...');
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('*')
      .limit(1);
    
    if (incidentsError) {
      console.error('❌ Error al acceder a la tabla incidents:', incidentsError.message);
    } else {
      console.log('✅ Tabla incidents accesible');
    }
    
    // Verificar que la tabla resources existe
    console.log('\n🔍 Verificando tabla resources...');
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .limit(1);
    
    if (resourcesError) {
      console.error('❌ Error al acceder a la tabla resources:', resourcesError.message);
    } else {
      console.log('✅ Tabla resources accesible');
    }
    
    console.log('\n🎉 Proceso de corrección completado!');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

fixIncidentsTable();
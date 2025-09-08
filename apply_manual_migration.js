require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function applyManualMigration() {
  try {
    console.log('=== APLICANDO MIGRACIÓN MANUAL ===');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'manual_migration.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('✅ Archivo SQL leído correctamente');
    
    // Dividir en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`\n📝 Ejecutando ${commands.length} comandos SQL...`);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      console.log('❌ Variables de entorno de Supabase no encontradas');
      return;
    }
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`\n${i + 1}. Ejecutando: ${command.substring(0, 60)}...`);
      
      try {
        // Usar la API REST de Supabase para ejecutar SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: command + ';'
          })
        });
        
        if (response.ok) {
          console.log('✅ Comando ejecutado correctamente');
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${errorText}`);
          
          // Si es un error de "ya existe", no es crítico
          if (errorText.includes('already exists') || errorText.includes('IF NOT EXISTS')) {
            console.log('   ℹ️  Elemento ya existe, continuando...');
          }
        }
      } catch (err) {
        console.log(`❌ Excepción: ${err.message}`);
      }
    }
    
    // Verificar que las columnas se crearon
    console.log('\n🔍 Verificando resultado...');
    
    try {
      const testResponse = await fetch(`${supabaseUrl}/rest/v1/incidents?select=id,reporter_grade_id,reporter_section_id,reporter_area_id,booking_context&limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        }
      });
      
      if (testResponse.ok) {
        console.log('✅ Columnas de contexto estructurado verificadas');
        console.log('   Las nuevas columnas están disponibles en la tabla incidents');
      } else {
        const errorText = await testResponse.text();
        console.log('❌ Error verificando columnas:', errorText);
      }
    } catch (err) {
      console.log('❌ Error en verificación:', err.message);
    }
    
    console.log('\n🎉 ¡MIGRACIÓN MANUAL COMPLETADA!');
    console.log('   Si no hubo errores críticos, las columnas de contexto estructurado deberían estar disponibles.');
    console.log('   Reinicia el servidor de desarrollo para que los cambios tomen efecto.');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

applyManualMigration();
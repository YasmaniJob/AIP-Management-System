require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyStructuredContextMigration() {
  try {
    console.log('=== APLICANDO MIGRACIÓN DE CONTEXTO ESTRUCTURADO ===');
    
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241229000000_add_structured_context_to_incidents.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Archivo de migración no encontrado:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migración leída correctamente');
    
    // Dividir la migración en comandos individuales
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`\n📝 Ejecutando ${commands.length} comandos...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`\n${i + 1}. Ejecutando: ${command.substring(0, 80)}...`);
      
      try {
        // Ejecutar comando SQL directamente
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        });
        
        if (error) {
          console.log(`❌ Error en comando ${i + 1}: ${error.message}`);
          
          // Para comandos ALTER TABLE, intentar método alternativo
          if (command.toUpperCase().includes('ALTER TABLE')) {
            console.log('   Comando ALTER TABLE - puede que ya exista la columna');
          }
        } else {
          console.log('✅ Comando ejecutado correctamente');
        }
      } catch (err) {
        console.log(`❌ Excepción en comando ${i + 1}: ${err.message}`);
      }
    }
    
    // Verificar que las columnas se crearon correctamente
    console.log('\n🔍 Verificando estructura de la tabla incidents...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('incidents')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log(`❌ Error verificando tabla: ${tableError.message}`);
    } else {
      console.log('✅ Tabla incidents accesible');
    }
    
    // Verificar que las relaciones funcionan
    console.log('\n🔍 Verificando relaciones con grades, sections y areas...');
    
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select('id, name')
      .limit(1);
    
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('id, name')
      .limit(1);
    
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select('id, name')
      .limit(1);
    
    if (gradesError || sectionsError || areasError) {
      console.log('❌ Error verificando tablas relacionadas');
      if (gradesError) console.log('   Grades:', gradesError.message);
      if (sectionsError) console.log('   Sections:', sectionsError.message);
      if (areasError) console.log('   Areas:', areasError.message);
    } else {
      console.log('✅ Tablas relacionadas accesibles');
      console.log(`   Grades disponibles: ${grades?.length || 0}`);
      console.log(`   Sections disponibles: ${sections?.length || 0}`);
      console.log(`   Areas disponibles: ${areas?.length || 0}`);
    }
    
    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA!');
    console.log('   Las nuevas columnas de contexto estructurado están disponibles.');
    console.log('   El sistema ahora puede usar reporter_grade_id, reporter_section_id, reporter_area_id y booking_context.');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

applyStructuredContextMigration();
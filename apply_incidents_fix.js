require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyIncidentsFix() {
  try {
    console.log('=== APLICANDO CORRECCIÓN DE TABLA INCIDENTS ===');
    
    // Leer el archivo SQL
    const sqlScript = fs.readFileSync('fix_incidents_table_structure.sql', 'utf8');
    
    console.log('📄 Script SQL cargado, ejecutando...');
    
    // Ejecutar el script SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: sqlScript
    });
    
    if (error) {
      console.error('❌ Error al ejecutar el script:', error);
      
      // Intentar ejecutar por partes si falla
      console.log('\n🔄 Intentando ejecutar por partes...');
      
      // Dividir el script en comandos individuales
      const commands = sqlScript
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i] + ';';
        
        if (command.includes('DO $$') || command.includes('CREATE') || command.includes('ALTER')) {
          console.log(`Ejecutando comando ${i + 1}/${commands.length}...`);
          
          const { error: cmdError } = await supabase.rpc('exec_sql', {
            query: command
          });
          
          if (cmdError) {
            console.error(`❌ Error en comando ${i + 1}:`, cmdError.message);
          } else {
            console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
          }
        }
      }
    } else {
      console.log('✅ Script ejecutado exitosamente');
      if (data) {
        console.log('Resultado:', data);
      }
    }
    
    // Verificar la estructura final
    console.log('\n=== VERIFICANDO ESTRUCTURA FINAL ===');
    
    const { data: testData, error: testError } = await supabase
      .from('incidents')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error al verificar la tabla:', testError);
    } else {
      console.log('✅ Tabla incidents verificada y accesible');
    }
    
    // Probar inserción de una incidencia de prueba
    console.log('\n=== PROBANDO INSERCIÓN ===');
    
    // Obtener un recurso y usuario para la prueba
    const { data: resource } = await supabase
      .from('resources')
      .select('id')
      .limit(1)
      .single();
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    
    if (resource && user) {
      const testIncident = {
        resource_id: resource.id,
        reported_by: user.id,
        title: 'Prueba de estructura - ' + new Date().toISOString(),
        description: 'Incidencia de prueba para verificar que la estructura funciona',
        type: 'Daño',
        status: 'Reportado'
      };
      
      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .insert(testIncident)
        .select()
        .single();
      
      if (incidentError) {
        console.error('❌ Error al crear incidencia de prueba:', incidentError);
      } else {
        console.log('✅ Incidencia de prueba creada exitosamente:');
        console.log('ID:', incident.id);
        console.log('Título:', incident.title);
        
        // Limpiar la incidencia de prueba
        await supabase
          .from('incidents')
          .delete()
          .eq('id', incident.id);
        
        console.log('🧹 Incidencia de prueba eliminada');
      }
    } else {
      console.log('⚠️ No se encontraron recursos o usuarios para la prueba');
    }
    
    console.log('\n🎉 Proceso completado');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

applyIncidentsFix();
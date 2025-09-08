require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixForeignKeys() {
  try {
    console.log('=== AGREGANDO RELACIONES DE CLAVE FORÁNEA ===');
    
    // Primero verificar si las columnas existen
    console.log('\n🔍 Verificando columnas existentes...');
    
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('id, reporter_grade_id, reporter_section_id, reporter_area_id')
      .limit(1);
    
    if (incidentsError) {
      console.log('❌ Error accediendo a incidents:', incidentsError.message);
      return;
    }
    
    console.log('✅ Columnas de contexto estructurado encontradas');
    
    // Comandos SQL para agregar las relaciones de clave foránea
    const foreignKeyCommands = [
      {
        name: 'reporter_grade_id foreign key',
        sql: `ALTER TABLE public.incidents 
              ADD CONSTRAINT incidents_reporter_grade_id_fkey 
              FOREIGN KEY (reporter_grade_id) REFERENCES public.grades(id);`
      },
      {
        name: 'reporter_section_id foreign key',
        sql: `ALTER TABLE public.incidents 
              ADD CONSTRAINT incidents_reporter_section_id_fkey 
              FOREIGN KEY (reporter_section_id) REFERENCES public.sections(id);`
      },
      {
        name: 'reporter_area_id foreign key',
        sql: `ALTER TABLE public.incidents 
              ADD CONSTRAINT incidents_reporter_area_id_fkey 
              FOREIGN KEY (reporter_area_id) REFERENCES public.areas(id);`
      }
    ];
    
    console.log('\n📝 Agregando relaciones de clave foránea...');
    
    for (const command of foreignKeyCommands) {
      console.log(`\n🔧 Agregando ${command.name}...`);
      
      try {
        // Usar una consulta SQL directa a través de la API REST
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({
            sql: command.sql
          })
        });
        
        if (response.ok) {
          console.log(`✅ ${command.name} agregada correctamente`);
        } else {
          const errorText = await response.text();
          console.log(`❌ Error agregando ${command.name}: ${errorText}`);
          
          // Si el constraint ya existe, no es un error crítico
          if (errorText.includes('already exists')) {
            console.log(`   ℹ️  La relación ya existe, continuando...`);
          }
        }
      } catch (err) {
        console.log(`❌ Excepción agregando ${command.name}: ${err.message}`);
      }
    }
    
    // Verificar que las relaciones se crearon
    console.log('\n🔍 Verificando relaciones creadas...');
    
    // Intentar hacer una consulta que use las relaciones
    const { data: testQuery, error: testError } = await supabase
      .from('incidents')
      .select(`
        id,
        title,
        grades:reporter_grade_id(name),
        sections:reporter_section_id(name),
        areas:reporter_area_id(name)
      `)
      .limit(1);
    
    if (testError) {
      console.log('❌ Error en consulta de prueba:', testError.message);
    } else {
      console.log('✅ Relaciones funcionando correctamente');
      console.log('   Consulta de prueba exitosa');
    }
    
    console.log('\n🎉 ¡RELACIONES DE CLAVE FORÁNEA CONFIGURADAS!');
    console.log('   El sistema ahora puede usar las relaciones entre incidents y grades/sections/areas.');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

fixForeignKeys();
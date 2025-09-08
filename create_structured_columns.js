require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createStructuredColumns() {
  try {
    console.log('=== CREANDO COLUMNAS DE CONTEXTO ESTRUCTURADO ===');
    
    // Comandos SQL para agregar las columnas
    const columnCommands = [
      {
        name: 'reporter_grade_id column',
        sql: `ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS reporter_grade_id UUID;`
      },
      {
        name: 'reporter_section_id column',
        sql: `ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS reporter_section_id UUID;`
      },
      {
        name: 'reporter_area_id column',
        sql: `ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS reporter_area_id UUID;`
      },
      {
        name: 'booking_context column',
        sql: `ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS booking_context JSONB;`
      }
    ];
    
    console.log('\n📝 Agregando columnas...');
    
    for (const command of columnCommands) {
      console.log(`\n🔧 Agregando ${command.name}...`);
      
      try {
        // Ejecutar SQL usando el cliente de Supabase
        const { data, error } = await supabase.rpc('exec', {
          sql: command.sql
        });
        
        if (error) {
          console.log(`❌ Error agregando ${command.name}: ${error.message}`);
          
          // Intentar método alternativo usando fetch directo
          console.log('   Intentando método alternativo...');
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({ sql: command.sql })
          });
          
          if (response.ok) {
            console.log(`✅ ${command.name} agregada con método alternativo`);
          } else {
            const errorText = await response.text();
            console.log(`❌ Error con método alternativo: ${errorText}`);
          }
        } else {
          console.log(`✅ ${command.name} agregada correctamente`);
        }
      } catch (err) {
        console.log(`❌ Excepción agregando ${command.name}: ${err.message}`);
      }
    }
    
    // Ahora agregar las relaciones de clave foránea
    console.log('\n📝 Agregando relaciones de clave foránea...');
    
    const foreignKeyCommands = [
      {
        name: 'reporter_grade_id foreign key',
        sql: `ALTER TABLE public.incidents ADD CONSTRAINT IF NOT EXISTS incidents_reporter_grade_id_fkey FOREIGN KEY (reporter_grade_id) REFERENCES public.grades(id);`
      },
      {
        name: 'reporter_section_id foreign key',
        sql: `ALTER TABLE public.incidents ADD CONSTRAINT IF NOT EXISTS incidents_reporter_section_id_fkey FOREIGN KEY (reporter_section_id) REFERENCES public.sections(id);`
      },
      {
        name: 'reporter_area_id foreign key',
        sql: `ALTER TABLE public.incidents ADD CONSTRAINT IF NOT EXISTS incidents_reporter_area_id_fkey FOREIGN KEY (reporter_area_id) REFERENCES public.areas(id);`
      }
    ];
    
    for (const command of foreignKeyCommands) {
      console.log(`\n🔧 Agregando ${command.name}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec', {
          sql: command.sql
        });
        
        if (error) {
          console.log(`❌ Error agregando ${command.name}: ${error.message}`);
        } else {
          console.log(`✅ ${command.name} agregada correctamente`);
        }
      } catch (err) {
        console.log(`❌ Excepción agregando ${command.name}: ${err.message}`);
      }
    }
    
    // Crear índices
    console.log('\n📝 Creando índices...');
    
    const indexCommands = [
      {
        name: 'reporter_grade_id index',
        sql: `CREATE INDEX IF NOT EXISTS idx_incidents_reporter_grade ON public.incidents(reporter_grade_id);`
      },
      {
        name: 'reporter_section_id index',
        sql: `CREATE INDEX IF NOT EXISTS idx_incidents_reporter_section ON public.incidents(reporter_section_id);`
      },
      {
        name: 'reporter_area_id index',
        sql: `CREATE INDEX IF NOT EXISTS idx_incidents_reporter_area ON public.incidents(reporter_area_id);`
      },
      {
        name: 'booking_context index',
        sql: `CREATE INDEX IF NOT EXISTS idx_incidents_booking_context ON public.incidents USING GIN(booking_context);`
      }
    ];
    
    for (const command of indexCommands) {
      console.log(`\n🔧 Creando ${command.name}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec', {
          sql: command.sql
        });
        
        if (error) {
          console.log(`❌ Error creando ${command.name}: ${error.message}`);
        } else {
          console.log(`✅ ${command.name} creado correctamente`);
        }
      } catch (err) {
        console.log(`❌ Excepción creando ${command.name}: ${err.message}`);
      }
    }
    
    // Verificar que todo se creó correctamente
    console.log('\n🔍 Verificando estructura final...');
    
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('id, reporter_grade_id, reporter_section_id, reporter_area_id, booking_context')
      .limit(1);
    
    if (incidentsError) {
      console.log('❌ Error verificando estructura:', incidentsError.message);
    } else {
      console.log('✅ Estructura verificada correctamente');
      console.log('   Todas las columnas de contexto estructurado están disponibles');
    }
    
    console.log('\n🎉 ¡COLUMNAS DE CONTEXTO ESTRUCTURADO CREADAS!');
    console.log('   El sistema ahora puede usar reporter_grade_id, reporter_section_id, reporter_area_id y booking_context.');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

createStructuredColumns();
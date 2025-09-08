require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigrations() {
  try {
    console.log('Verificando migraciones aplicadas...');
    
    // Verificar si existe la tabla de migraciones
    const { data: migrationData, error: migrationError } = await supabase
      .from('supabase_migrations')
      .select('*')
      .order('version', { ascending: false })
      .limit(10);
    
    if (migrationError) {
      console.error('Error consultando migraciones:', migrationError);
      console.log('\nIntentando verificar con una consulta SQL directa...');
      
      // Intentar con RPC si existe
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT version, name FROM supabase_migrations ORDER BY version DESC LIMIT 10" 
        });
      
      if (rpcError) {
        console.error('Error con RPC:', rpcError);
        return;
      }
      
      console.log('Migraciones encontradas (via RPC):', rpcData);
    } else {
      console.log('Migraciones aplicadas:');
      migrationData.forEach(migration => {
        console.log(`- ${migration.version}: ${migration.name || 'Sin nombre'}`);
      });
      
      // Verificar específicamente la migración que nos interesa
      const revertMigration = migrationData.find(m => 
        m.version.includes('20250129000000') || 
        (m.name && m.name.includes('revert_maintenance_tracking'))
      );
      
      console.log('\nMigración de reversión encontrada:', revertMigration ? 'SÍ' : 'NO');
      
      if (revertMigration) {
        console.log('Detalles:', revertMigration);
      }
    }
    
    // Verificar también si hay triggers activos que puedan estar causando el problema
    console.log('\nVerificando triggers en maintenance_tracking...');
    const { data: triggerData, error: triggerError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            trigger_name, 
            event_manipulation, 
            action_statement
          FROM information_schema.triggers 
          WHERE event_object_table = 'maintenance_tracking'
        ` 
      });
    
    if (triggerError) {
      console.error('Error consultando triggers:', triggerError);
    } else {
      console.log('Triggers activos:', triggerData);
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

checkMigrations();
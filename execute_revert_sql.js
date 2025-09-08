const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function executeRevertSQL() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables de entorno no encontradas');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔄 Ejecutando reversión de estados de reparación...');
    
    // Declaraciones SQL para revertir
    const sqlStatements = [
      'ALTER TABLE maintenance_tracking ADD COLUMN parts_needed TEXT',
      'ALTER TABLE maintenance_tracking ADD COLUMN parts_ordered BOOLEAN DEFAULT FALSE',
      'ALTER TABLE maintenance_tracking ADD COLUMN cost_estimate DECIMAL(10,2)',
      'ALTER TABLE maintenance_tracking ADD COLUMN actual_cost DECIMAL(10,2)',
      'ALTER TABLE maintenance_tracking ADD COLUMN repair_notes TEXT',
      'ALTER TABLE maintenance_tracking ADD COLUMN assigned_to UUID',
      'ALTER TABLE maintenance_tracking ADD COLUMN actual_completion_date TIMESTAMPTZ'
    ];
    
    console.log('\n📋 Declaraciones SQL a ejecutar:');
    sqlStatements.forEach((sql, index) => {
      console.log(`${index + 1}. ${sql}`);
    });
    
    console.log('\n⚠️  Nota: Estas declaraciones deben ejecutarse manualmente en tu cliente de base de datos.');
    console.log('\n💡 Puedes copiar y pegar las siguientes declaraciones en tu interfaz de Supabase:');
    console.log('\n-- COPIAR DESDE AQUÍ --');
    sqlStatements.forEach(sql => {
      console.log(`${sql};`);
    });
    console.log('-- HASTA AQUÍ --\n');
    
    // Verificar estructura actual
    console.log('🔍 Verificando estructura actual...');
    const { data: currentData, error: checkError } = await supabase
      .from('maintenance_tracking')
      .select('*')
      .limit(1);
      
    if (currentData && currentData.length > 0) {
      const columns = Object.keys(currentData[0]);
      console.log('\n📊 Columnas actuales en maintenance_tracking:');
      columns.forEach(col => {
        console.log(`  - ${col}`);
      });
      
      const expectedColumns = [
        'parts_needed', 'parts_ordered', 'cost_estimate', 
        'actual_cost', 'repair_notes', 'assigned_to', 'actual_completion_date'
      ];
      
      const missingColumns = expectedColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length === 0) {
        console.log('\n✅ Todas las columnas ya están presentes.');
      } else {
        console.log('\n⚠️  Columnas faltantes:', missingColumns);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

executeRevertSQL();
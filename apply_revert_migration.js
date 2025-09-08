const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function applyMigration() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables de entorno no encontradas');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('📄 Revirtiendo simplificación de maintenance_tracking...');
    
    // Verificar estructura actual
    console.log('\n📋 Verificando estructura actual...');
    const { data: existingData, error: queryError } = await supabase
      .from('maintenance_tracking')
      .select('*')
      .limit(1);
      
    if (queryError) {
      console.error('❌ Error consultando tabla:', queryError);
      return;
    }
    
    if (existingData && existingData.length > 0) {
      const columns = Object.keys(existingData[0]);
      console.log('\n📊 Columnas actuales en maintenance_tracking:');
      columns.forEach(col => {
        console.log(`  - ${col}`);
      });
      
      // Verificar qué columnas faltan
      const expectedColumns = [
        'parts_needed',
        'parts_ordered', 
        'cost_estimate',
        'actual_cost',
        'repair_notes',
        'assigned_to',
        'actual_completion_date'
      ];
      
      const missingColumns = expectedColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length === 0) {
        console.log('\n✅ Todas las columnas ya están presentes. No se requiere reversión.');
      } else {
        console.log('\n⚠️  Columnas faltantes detectadas:', missingColumns);
        console.log('\n📝 Para revertir completamente, necesitas ejecutar manualmente:');
        
        missingColumns.forEach(col => {
          let sqlType = 'TEXT';
          switch(col) {
            case 'parts_ordered':
              sqlType = 'BOOLEAN DEFAULT FALSE';
              break;
            case 'cost_estimate':
            case 'actual_cost':
              sqlType = 'DECIMAL(10,2)';
              break;
            case 'assigned_to':
              sqlType = 'UUID';
              break;
            case 'actual_completion_date':
              sqlType = 'TIMESTAMPTZ';
              break;
          }
          console.log(`  ALTER TABLE maintenance_tracking ADD COLUMN ${col} ${sqlType};`);
        });
      }
    }
    
    console.log('\n✅ Verificación completada');
    console.log('\n💡 Nota: Si necesitas aplicar los cambios, ejecuta las declaraciones SQL manualmente en tu cliente de base de datos.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyMigration();
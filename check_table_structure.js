require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('Verificando estructura de maintenance_tracking...');
    
    // Intentar hacer una consulta SELECT * LIMIT 1 para ver todos los campos
    const { data, error } = await supabase
      .from('maintenance_tracking')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error consultando tabla:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Campos disponibles en maintenance_tracking:');
      console.log(Object.keys(data[0]));
      
      // Verificar específicamente assigned_technician y assigned_to
      const hasAssignedTechnician = 'assigned_technician' in data[0];
      const hasAssignedTo = 'assigned_to' in data[0];
      
      console.log('\nCampos de asignación:');
      console.log('- assigned_technician:', hasAssignedTechnician);
      console.log('- assigned_to:', hasAssignedTo);
      
    } else {
      console.log('La tabla está vacía. Intentando insertar un registro de prueba...');
      
      // Insertar un registro mínimo para probar la estructura
      const { data: insertData, error: insertError } = await supabase
        .from('maintenance_tracking')
        .insert({
          resource_id: '00000000-0000-0000-0000-000000000000',
          maintenance_type: 'Test',
          damage_description: 'Test record',
          current_status: 'Pendiente',
          reporter_teacher_name: 'Test Teacher',
          report_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error insertando registro de prueba:', insertError);
        console.log('\nEsto nos ayuda a identificar qué campos faltan o están mal configurados.');
      } else {
        console.log('Registro de prueba insertado exitosamente.');
        console.log('Campos disponibles:', Object.keys(insertData));
        
        // Limpiar el registro de prueba
        await supabase
          .from('maintenance_tracking')
          .delete()
          .eq('id', insertData.id);
        console.log('Registro de prueba eliminado.');
      }
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

checkTableStructure();
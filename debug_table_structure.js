require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugTableStructure() {
  try {
    console.log('=== DEBUGGING TABLE STRUCTURE ===');
    
    console.log('\n1. Verificando estructura de la tabla loans...');
    
    // Intentar insertar un préstamo con status 'Pendiente' y ver qué pasa
    console.log('\n2. Probando inserción directa...');
    
    // Obtener datos necesarios
    const { data: teacher } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'Docente')
      .limit(1)
      .single();
    
    const { data: area } = await supabase
      .from('areas')
      .select('id')
      .limit(1)
      .single();
    
    const { data: grade } = await supabase
      .from('grades')
      .select('id')
      .limit(1)
      .single();
    
    const { data: section } = await supabase
      .from('sections')
      .select('id')
      .eq('grade_id', grade.id)
      .limit(1)
      .single();
    
    if (!teacher || !area || !grade || !section) {
      console.log('No se encontraron datos necesarios');
      return;
    }
    
    // Intentar insertar con diferentes valores de status
    const testCases = [
      { status: 'Pendiente', description: 'Con status Pendiente' },
      { status: 'Activo', description: 'Con status Activo' },
      { status: null, description: 'Sin status (null)' },
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   Probando: ${testCase.description}`);
      
      const insertData = {
        teacher_id: teacher.id,
        area_id: area.id,
        grade_id: grade.id,
        section_id: section.id,
        notes: `Test: ${testCase.description}`,
        loan_date: new Date().toISOString(),
        return_date: null,
        is_authorized: false,
      };
      
      if (testCase.status !== null) {
        insertData.status = testCase.status;
      }
      
      const { data: result, error } = await supabase
        .from('loans')
        .insert(insertData)
        .select('id, status')
        .single();
      
      if (error) {
        console.log(`     Error: ${error.message}`);
      } else {
        console.log(`     Resultado: ID ${result.id}, Status: '${result.status}'`);
        
        // Limpiar el registro de prueba
        await supabase.from('loans').delete().eq('id', result.id);
      }
    }
    
    // Verificar si hay triggers
    console.log('\n3. Verificando triggers en la tabla loans...');
    
    // Esta consulta puede no funcionar dependiendo de los permisos
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'loans')
      .catch(() => ({ data: null, error: 'No se pudieron obtener triggers' }));
    
    if (triggerError) {
      console.log(`     No se pudieron verificar triggers: ${triggerError}`);
    } else if (triggers && triggers.length > 0) {
      console.log(`     Se encontraron ${triggers.length} triggers:`);
      triggers.forEach(trigger => {
        console.log(`       - ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
      });
    } else {
      console.log('     No se encontraron triggers en la tabla loans');
    }
    
  } catch (err) {
    console.error('Error en debug:', err);
  }
}

debugTableStructure();
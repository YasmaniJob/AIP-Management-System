require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLoanCreation() {
  try {
    console.log('=== TESTING LOAN CREATION AFTER FIX ===');
    
    // Obtener datos necesarios para crear un préstamo
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
      console.log('❌ No se pudieron obtener los datos necesarios');
      return;
    }
    
    console.log('✅ Datos obtenidos correctamente');
    
    // Crear un préstamo de prueba
    console.log('\n1. Creando préstamo de prueba...');
    const { data: testLoan, error: testError } = await supabase
      .from('loans')
      .insert({
        teacher_id: teacher.id,
        area_id: area.id,
        grade_id: grade.id,
        section_id: section.id,
        notes: 'Préstamo de prueba después de la corrección',
        status: 'Pendiente',
        loan_date: new Date().toISOString(),
        return_date: null,
        is_authorized: false,
      })
      .select('id, status, is_authorized')
      .single();
    
    if (testError) {
      console.log(`❌ Error creando préstamo: ${testError.message}`);
      return;
    }
    
    console.log(`✅ Préstamo creado:`);
    console.log(`   ID: ${testLoan.id}`);
    console.log(`   Status: ${testLoan.status}`);
    console.log(`   Autorizado: ${testLoan.is_authorized}`);
    
    // Verificar que el estado es correcto
    if (testLoan.status === 'Pendiente' && testLoan.is_authorized === false) {
      console.log('\n🎉 ¡CORRECCIÓN EXITOSA! El préstamo se creó correctamente como Pendiente.');
    } else {
      console.log('\n⚠️  Algo no está bien:');
      console.log(`   Esperado: status='Pendiente', is_authorized=false`);
      console.log(`   Obtenido: status='${testLoan.status}', is_authorized=${testLoan.is_authorized}`);
    }
    
    // Probar también sin especificar status
    console.log('\n2. Probando sin especificar status...');
    const { data: testLoan2, error: testError2 } = await supabase
      .from('loans')
      .insert({
        teacher_id: teacher.id,
        area_id: area.id,
        grade_id: grade.id,
        section_id: section.id,
        notes: 'Préstamo sin status especificado',
        loan_date: new Date().toISOString(),
        return_date: null,
        is_authorized: false,
      })
      .select('id, status, is_authorized')
      .single();
    
    if (testError2) {
      console.log(`❌ Error: ${testError2.message}`);
    } else {
      console.log(`✅ Préstamo sin status:`);
      console.log(`   ID: ${testLoan2.id}`);
      console.log(`   Status: ${testLoan2.status}`);
      console.log(`   Autorizado: ${testLoan2.is_authorized}`);
      
      // Limpiar
      await supabase.from('loans').delete().eq('id', testLoan2.id);
    }
    
    // Limpiar el préstamo de prueba
    console.log('\n3. Limpiando préstamo de prueba...');
    await supabase.from('loans').delete().eq('id', testLoan.id);
    console.log('✅ Limpieza completada');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testLoanCreation();
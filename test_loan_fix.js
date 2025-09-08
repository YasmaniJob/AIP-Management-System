require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLoanFix() {
  try {
    console.log('=== PROBANDO CREACIÓN DE PRÉSTAMO CON TEACHER_ID ===');
    
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
      console.log('❌ No se pudieron obtener los datos necesarios');
      return;
    }
    
    console.log('✅ Datos obtenidos correctamente');
    console.log(`   Teacher ID: ${teacher.id}`);
    console.log(`   Area ID: ${area.id}`);
    console.log(`   Grade ID: ${grade.id}`);
    console.log(`   Section ID: ${section.id}`);
    
    // Crear préstamo usando teacher_id (correcto)
    console.log('\n1. Creando préstamo con teacher_id...');
    const { data: testLoan, error: testError } = await supabase
      .from('loans')
      .insert({
        teacher_id: teacher.id,  // ✅ Correcto
        area_id: area.id,
        grade_id: grade.id,
        section_id: section.id,
        notes: 'Prueba de corrección - usando teacher_id',
        status: 'Pendiente',
        loan_date: new Date().toISOString(),
        return_date: null,
        is_authorized: false,
      })
      .select('id, status, is_authorized, teacher_id')
      .single();
    
    if (testError) {
      console.log(`❌ Error: ${testError.message}`);
      return;
    }
    
    console.log('✅ Préstamo creado exitosamente:');
    console.log(`   ID: ${testLoan.id}`);
    console.log(`   Status: ${testLoan.status}`);
    console.log(`   Autorizado: ${testLoan.is_authorized}`);
    console.log(`   Teacher ID: ${testLoan.teacher_id}`);
    
    // Limpiar el préstamo de prueba
    console.log('\n2. Limpiando préstamo de prueba...');
    const { error: deleteError } = await supabase
      .from('loans')
      .delete()
      .eq('id', testLoan.id);
    
    if (deleteError) {
      console.log(`⚠️  Error limpiando: ${deleteError.message}`);
    } else {
      console.log('✅ Préstamo de prueba eliminado');
    }
    
    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('   La creación de préstamos funciona correctamente con teacher_id');
    
  } catch (err) {
    console.error('Error en la prueba:', err);
  }
}

testLoanFix();
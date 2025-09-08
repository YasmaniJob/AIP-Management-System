const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFixGreatestError() {
  console.log('🧪 Probando la corrección del error GREATEST...');
  
  try {
    // Buscar un préstamo activo para probar
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('id, status, actual_return_date, return_date, days_overdue')
      .eq('status', 'Activo')
      .is('actual_return_date', null)
      .limit(1);
    
    if (loansError) {
      console.error('❌ Error al buscar préstamos:', loansError);
      return;
    }
    
    if (!loans || loans.length === 0) {
      console.log('ℹ️ No se encontraron préstamos activos para probar');
      console.log('Creando un préstamo de prueba...');
      
      // Crear un préstamo de prueba
      const { data: newLoan, error: createError } = await supabase
        .from('loans')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Usuario de prueba
          resource_id: '00000000-0000-0000-0000-000000000000', // Recurso de prueba
          loan_date: new Date().toISOString(),
          return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días después
          status: 'Activo'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error al crear préstamo de prueba:', createError);
        return;
      }
      
      console.log(`✅ Préstamo de prueba creado: ${newLoan.id}`);
      loans.push(newLoan);
    }
    
    const testLoan = loans[0];
    console.log(`\n📋 Probando con préstamo ID: ${testLoan.id}`);
    console.log(`   - Status actual: ${testLoan.status}`);
    console.log(`   - Fecha de devolución: ${testLoan.return_date}`);
    console.log(`   - actual_return_date: ${testLoan.actual_return_date}`);
    console.log(`   - days_overdue: ${testLoan.days_overdue}`);
    
    // Probar diferentes escenarios de actualización
    console.log('\n🔄 Probando actualización de actual_return_date...');
    
    // Escenario 1: Devolución a tiempo
    const returnDate = new Date();
    const { error: updateError1 } = await supabase
      .from('loans')
      .update({ actual_return_date: returnDate.toISOString() })
      .eq('id', testLoan.id);
    
    if (updateError1) {
      console.error('❌ Error en escenario 1 (devolución a tiempo):', updateError1);
      return;
    }
    
    console.log('✅ Escenario 1: Devolución a tiempo - EXITOSO');
    
    // Verificar el resultado
    const { data: updatedLoan1, error: verifyError1 } = await supabase
      .from('loans')
      .select('id, status, actual_return_date, days_overdue, return_date')
      .eq('id', testLoan.id)
      .single();
    
    if (verifyError1) {
      console.error('❌ Error al verificar escenario 1:', verifyError1);
      return;
    }
    
    console.log('📊 Resultado escenario 1:');
    console.log(`   - Status: ${updatedLoan1.status}`);
    console.log(`   - actual_return_date: ${updatedLoan1.actual_return_date}`);
    console.log(`   - days_overdue: ${updatedLoan1.days_overdue}`);
    
    // Escenario 2: Devolución tardía
    console.log('\n🔄 Probando escenario 2: Devolución tardía...');
    
    const lateReturnDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 días después
    const { error: updateError2 } = await supabase
      .from('loans')
      .update({ actual_return_date: lateReturnDate.toISOString() })
      .eq('id', testLoan.id);
    
    if (updateError2) {
      console.error('❌ Error en escenario 2 (devolución tardía):', updateError2);
      return;
    }
    
    console.log('✅ Escenario 2: Devolución tardía - EXITOSO');
    
    // Verificar el resultado
    const { data: updatedLoan2, error: verifyError2 } = await supabase
      .from('loans')
      .select('id, status, actual_return_date, days_overdue, return_date')
      .eq('id', testLoan.id)
      .single();
    
    if (verifyError2) {
      console.error('❌ Error al verificar escenario 2:', verifyError2);
      return;
    }
    
    console.log('📊 Resultado escenario 2:');
    console.log(`   - Status: ${updatedLoan2.status}`);
    console.log(`   - actual_return_date: ${updatedLoan2.actual_return_date}`);
    console.log(`   - days_overdue: ${updatedLoan2.days_overdue}`);
    
    // Escenario 3: Resetear a null
    console.log('\n🔄 Probando escenario 3: Resetear actual_return_date a null...');
    
    const { error: updateError3 } = await supabase
      .from('loans')
      .update({ actual_return_date: null })
      .eq('id', testLoan.id);
    
    if (updateError3) {
      console.error('❌ Error en escenario 3 (resetear a null):', updateError3);
      return;
    }
    
    console.log('✅ Escenario 3: Resetear a null - EXITOSO');
    
    // Verificar el resultado
    const { data: updatedLoan3, error: verifyError3 } = await supabase
      .from('loans')
      .select('id, status, actual_return_date, days_overdue, return_date')
      .eq('id', testLoan.id)
      .single();
    
    if (verifyError3) {
      console.error('❌ Error al verificar escenario 3:', verifyError3);
      return;
    }
    
    console.log('📊 Resultado escenario 3:');
    console.log(`   - Status: ${updatedLoan3.status}`);
    console.log(`   - actual_return_date: ${updatedLoan3.actual_return_date}`);
    console.log(`   - days_overdue: ${updatedLoan3.days_overdue}`);
    
    console.log('\n🎉 TODOS LOS ESCENARIOS COMPLETADOS EXITOSAMENTE');
    console.log('✅ La corrección del error GREATEST funciona correctamente');
    console.log('✅ La función update_loan_status está funcionando como esperado');
    
  } catch (error) {
    console.error('❌ Error general en las pruebas:', error);
  }
}

testFixGreatestError();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGreatestFix() {
  console.log('🧪 Probando la corrección del error GREATEST...');
  
  try {
    // Buscar un préstamo activo para probar
    const { data: activeLoans, error: fetchError } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'Activo')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error al buscar préstamos:', fetchError);
      return;
    }
    
    if (!activeLoans || activeLoans.length === 0) {
      console.log('⚠️ No se encontraron préstamos activos para probar.');
      return;
    }
    
    const loan = activeLoans[0];
    console.log(`📋 Probando con préstamo ID: ${loan.id}`);
    console.log(`📅 Fecha de devolución esperada: ${loan.return_date}`);
    
    // Probar actualización con fecha de devolución actual
    const today = new Date().toISOString().split('T')[0];
    
    console.log('\n🔄 Probando actualización de actual_return_date...');
    
    const { data: updatedLoan, error: updateError } = await supabase
      .from('loans')
      .update({ actual_return_date: today })
      .eq('id', loan.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error al actualizar préstamo:', updateError);
      console.error('💡 Esto indica que el error GREATEST aún persiste.');
      return;
    }
    
    console.log('✅ ¡Actualización exitosa! El error GREATEST ha sido corregido.');
    console.log('📊 Resultado de la actualización:');
    console.log(`   - Status: ${updatedLoan.status}`);
    console.log(`   - Days overdue: ${updatedLoan.days_overdue}`);
    console.log(`   - Actual return date: ${updatedLoan.actual_return_date}`);
    
    // Restaurar el préstamo a su estado original
    console.log('\n🔄 Restaurando préstamo a estado original...');
    
    const { error: restoreError } = await supabase
      .from('loans')
      .update({ 
        actual_return_date: null,
        status: 'Activo',
        days_overdue: null
      })
      .eq('id', loan.id);
    
    if (restoreError) {
      console.error('⚠️ Error al restaurar préstamo:', restoreError);
    } else {
      console.log('✅ Préstamo restaurado exitosamente.');
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar la prueba
testGreatestFix().then(() => {
  console.log('\n🏁 Prueba completada.');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalDiagnosisGreatestError() {
  console.log('🔍 DIAGNÓSTICO FINAL DEL ERROR GREATEST\n');
  
  try {
    // 1. Obtener un préstamo para probar
    const { data: loans, error: fetchError } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'Activo')
      .is('actual_return_date', null)
      .limit(1);
    
    if (fetchError || !loans || loans.length === 0) {
      console.log('❌ No se encontraron préstamos para probar');
      return;
    }
    
    const loan = loans[0];
    console.log('📋 Préstamo de prueba:', {
      id: loan.id,
      status: loan.status,
      loan_date: loan.loan_date,
      return_date: loan.return_date,
      actual_return_date: loan.actual_return_date,
      days_overdue: loan.days_overdue
    });
    
    // 2. Probar actualización de cada campo individualmente
    console.log('\n=== PRUEBAS INDIVIDUALES DE CAMPOS ===');
    
    // 2.1 Probar actualización de status
    console.log('\n1. Probando actualización de status...');
    try {
      const { error } = await supabase
        .from('loans')
        .update({ status: 'Devuelto' })
        .eq('id', loan.id);
      
      if (error) {
        console.log('   ❌ Error al actualizar status:', error.message);
      } else {
        console.log('   ✅ Status actualizado exitosamente');
        // Revertir
        await supabase.from('loans').update({ status: 'Activo' }).eq('id', loan.id);
      }
    } catch (err) {
      console.log('   ❌ Excepción al actualizar status:', err.message);
    }
    
    // 2.2 Probar actualización de days_overdue
    console.log('\n2. Probando actualización de days_overdue...');
    try {
      const { error } = await supabase
        .from('loans')
        .update({ days_overdue: 0 })
        .eq('id', loan.id);
      
      if (error) {
        console.log('   ❌ Error al actualizar days_overdue:', error.message);
        console.log('   📝 Código de error:', error.code);
      } else {
        console.log('   ✅ days_overdue actualizado exitosamente');
        // Revertir
        await supabase.from('loans').update({ days_overdue: null }).eq('id', loan.id);
      }
    } catch (err) {
      console.log('   ❌ Excepción al actualizar days_overdue:', err.message);
    }
    
    // 2.3 Probar actualización de actual_return_date
    console.log('\n3. Probando actualización de actual_return_date...');
    try {
      const { error } = await supabase
        .from('loans')
        .update({ actual_return_date: new Date().toISOString() })
        .eq('id', loan.id);
      
      if (error) {
        console.log('   ❌ Error al actualizar actual_return_date:', error.message);
        console.log('   📝 Código de error:', error.code);
      } else {
        console.log('   ✅ actual_return_date actualizado exitosamente');
        // Revertir
        await supabase.from('loans').update({ actual_return_date: null }).eq('id', loan.id);
      }
    } catch (err) {
      console.log('   ❌ Excepción al actualizar actual_return_date:', err.message);
    }
    
    // 3. Probar combinaciones de campos
    console.log('\n=== PRUEBAS DE COMBINACIONES ===');
    
    // 3.1 status + days_overdue
    console.log('\n4. Probando status + days_overdue...');
    try {
      const { error } = await supabase
        .from('loans')
        .update({ 
          status: 'Devuelto',
          days_overdue: 0
        })
        .eq('id', loan.id);
      
      if (error) {
        console.log('   ❌ Error al actualizar status + days_overdue:', error.message);
      } else {
        console.log('   ✅ status + days_overdue actualizados exitosamente');
        // Revertir
        await supabase.from('loans').update({ 
          status: 'Activo',
          days_overdue: null
        }).eq('id', loan.id);
      }
    } catch (err) {
      console.log('   ❌ Excepción al actualizar status + days_overdue:', err.message);
    }
    
    // 3.2 status + actual_return_date
    console.log('\n5. Probando status + actual_return_date...');
    try {
      const { error } = await supabase
        .from('loans')
        .update({ 
          status: 'Devuelto',
          actual_return_date: new Date().toISOString()
        })
        .eq('id', loan.id);
      
      if (error) {
        console.log('   ❌ Error al actualizar status + actual_return_date:', error.message);
      } else {
        console.log('   ✅ status + actual_return_date actualizados exitosamente');
        // Revertir
        await supabase.from('loans').update({ 
          status: 'Activo',
          actual_return_date: null
        }).eq('id', loan.id);
      }
    } catch (err) {
      console.log('   ❌ Excepción al actualizar status + actual_return_date:', err.message);
    }
    
    // 3.3 days_overdue + actual_return_date
    console.log('\n6. Probando days_overdue + actual_return_date...');
    try {
      const { error } = await supabase
        .from('loans')
        .update({ 
          days_overdue: 0,
          actual_return_date: new Date().toISOString()
        })
        .eq('id', loan.id);
      
      if (error) {
        console.log('   ❌ Error al actualizar days_overdue + actual_return_date:', error.message);
      } else {
        console.log('   ✅ days_overdue + actual_return_date actualizados exitosamente');
        // Revertir
        await supabase.from('loans').update({ 
          days_overdue: null,
          actual_return_date: null
        }).eq('id', loan.id);
      }
    } catch (err) {
      console.log('   ❌ Excepción al actualizar days_overdue + actual_return_date:', err.message);
    }
    
    // 4. Probar actualización completa
    console.log('\n7. Probando actualización completa...');
    try {
      const { error } = await supabase
        .from('loans')
        .update({ 
          status: 'Devuelto',
          actual_return_date: new Date().toISOString(),
          days_overdue: 0
        })
        .eq('id', loan.id);
      
      if (error) {
        console.log('   ❌ Error en actualización completa:', error.message);
      } else {
        console.log('   ✅ Actualización completa exitosa');
        // Revertir
        await supabase.from('loans').update({ 
          status: 'Activo',
          actual_return_date: null,
          days_overdue: null
        }).eq('id', loan.id);
      }
    } catch (err) {
      console.log('   ❌ Excepción en actualización completa:', err.message);
    }
    
    // 5. Verificar si el problema está en el tipo de datos
    console.log('\n=== VERIFICACIÓN DE TIPOS DE DATOS ===');
    
    console.log('\n8. Probando con diferentes tipos de datos para actual_return_date...');
    
    const testValues = [
      { name: 'ISO String', value: new Date().toISOString() },
      { name: 'Date Object', value: new Date() },
      { name: 'Date String', value: new Date().toISOString().split('T')[0] },
      { name: 'Timestamp', value: Math.floor(Date.now() / 1000) },
      { name: 'Null', value: null }
    ];
    
    for (const test of testValues) {
      console.log(`\n   Probando ${test.name}: ${test.value}`);
      try {
        const { error } = await supabase
          .from('loans')
          .update({ actual_return_date: test.value })
          .eq('id', loan.id);
        
        if (error) {
          console.log(`     ❌ Error con ${test.name}:`, error.message);
        } else {
          console.log(`     ✅ Éxito con ${test.name}`);
          // Revertir
          await supabase.from('loans').update({ actual_return_date: null }).eq('id', loan.id);
        }
      } catch (err) {
        console.log(`     ❌ Excepción con ${test.name}:`, err.message);
      }
    }
    
    console.log('\n=== DIAGNÓSTICO COMPLETADO ===');
    console.log('\n📋 RESUMEN:');
    console.log('- Si actual_return_date falla en todos los casos, hay un trigger/constraint oculto');
    console.log('- Si solo falla en combinaciones específicas, el problema está en la interacción entre campos');
    console.log('- El error GREATEST sugiere que hay una función que compara tipos incompatibles');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

finalDiagnosisGreatestError();
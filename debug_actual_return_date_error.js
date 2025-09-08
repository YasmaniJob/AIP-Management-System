const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugActualReturnDateError() {
  console.log('🔍 DEPURANDO ERROR DE actual_return_date\n');
  
  try {
    // 1. Obtener un préstamo activo para probar
    const { data: loans, error: fetchError } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'Activo')
      .is('actual_return_date', null)
      .limit(1);
    
    if (fetchError) {
      console.log('❌ Error al obtener préstamos:', fetchError);
      return;
    }
    
    if (!loans || loans.length === 0) {
      console.log('❌ No se encontraron préstamos activos para probar');
      return;
    }
    
    const loan = loans[0];
    console.log('📋 Préstamo a probar:', {
      id: loan.id,
      status: loan.status,
      loan_date: loan.loan_date,
      return_date: loan.return_date,
      actual_return_date: loan.actual_return_date,
      days_overdue: loan.days_overdue
    });
    
    // 2. Probar diferentes formatos de fecha
    const testDates = [
      new Date().toISOString(),
      new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
      new Date().toISOString().split('T')[0],
      'now()'
    ];
    
    for (let i = 0; i < testDates.length; i++) {
      const testDate = testDates[i];
      console.log(`\n${i + 1}. Probando con fecha: ${testDate}`);
      
      try {
        let updateQuery;
        
        if (testDate === 'now()') {
          // Usar RPC para ejecutar SQL directo
          const { data, error } = await supabase.rpc('exec', {
            sql: `UPDATE loans SET actual_return_date = now() WHERE id = '${loan.id}' RETURNING *`
          });
          
          if (error) {
            console.log(`   ❌ Error con ${testDate}:`, error.message);
          } else {
            console.log(`   ✅ Éxito con ${testDate}`);
            // Revertir el cambio
            await supabase
              .from('loans')
              .update({ actual_return_date: null })
              .eq('id', loan.id);
          }
        } else {
          const { data, error } = await supabase
            .from('loans')
            .update({ actual_return_date: testDate })
            .eq('id', loan.id)
            .select();
          
          if (error) {
            console.log(`   ❌ Error con ${testDate}:`, error.message);
            console.log(`   📝 Código de error:`, error.code);
            console.log(`   📝 Detalles:`, error.details);
          } else {
            console.log(`   ✅ Éxito con ${testDate}`);
            // Revertir el cambio
            await supabase
              .from('loans')
              .update({ actual_return_date: null })
              .eq('id', loan.id);
          }
        }
      } catch (err) {
        console.log(`   ❌ Excepción con ${testDate}:`, err.message);
      }
    }
    
    // 3. Probar actualización solo del campo actual_return_date sin otros campos
    console.log('\n3. Probando actualización aislada de actual_return_date...');
    try {
      const { data, error } = await supabase
        .from('loans')
        .update({ 
          actual_return_date: new Date().toISOString()
        })
        .eq('id', loan.id)
        .select();
      
      if (error) {
        console.log('   ❌ Error en actualización aislada:', error.message);
      } else {
        console.log('   ✅ Actualización aislada exitosa');
        // Revertir
        await supabase
          .from('loans')
          .update({ actual_return_date: null })
          .eq('id', loan.id);
      }
    } catch (err) {
      console.log('   ❌ Excepción en actualización aislada:', err.message);
    }
    
    // 4. Probar actualización con múltiples campos
    console.log('\n4. Probando actualización con múltiples campos...');
    try {
      const { data, error } = await supabase
        .from('loans')
        .update({ 
          actual_return_date: new Date().toISOString(),
          status: 'Devuelto',
          days_overdue: 0
        })
        .eq('id', loan.id)
        .select();
      
      if (error) {
        console.log('   ❌ Error en actualización múltiple:', error.message);
      } else {
        console.log('   ✅ Actualización múltiple exitosa');
        // Revertir
        await supabase
          .from('loans')
          .update({ 
            actual_return_date: null,
            status: 'Activo',
            days_overdue: null
          })
          .eq('id', loan.id);
      }
    } catch (err) {
      console.log('   ❌ Excepción en actualización múltiple:', err.message);
    }
    
    // 5. Verificar si hay políticas RLS que puedan estar interfiriendo
    console.log('\n5. Verificando políticas RLS...');
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'loans');
      
      if (policiesError) {
        console.log('   ❌ Error al obtener políticas:', policiesError.message);
      } else {
        console.log('   📋 Políticas encontradas:', policies?.length || 0);
        if (policies && policies.length > 0) {
          policies.forEach(policy => {
            console.log(`     - ${policy.policyname}: ${policy.cmd}`);
          });
        }
      }
    } catch (err) {
      console.log('   ❌ Excepción al verificar políticas:', err.message);
    }
    
    console.log('\n=== DEPURACIÓN COMPLETADA ===');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugActualReturnDateError();
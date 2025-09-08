require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalFixLoans() {
  try {
    console.log('=== APLICANDO CORRECCIÓN FINAL A PRÉSTAMOS ===');
    
    // 1. Verificar estado actual
    console.log('\n1. Estado actual de préstamos...');
    const { data: allLoans, error: fetchError } = await supabase
      .from('loans')
      .select('id, status, is_authorized, created_at')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.log(`❌ Error obteniendo préstamos: ${fetchError.message}`);
      return;
    }
    
    console.log(`Total de préstamos: ${allLoans.length}`);
    
    const statusCounts = allLoans.reduce((acc, loan) => {
      const key = `${loan.status}_${loan.is_authorized ? 'autorizado' : 'no_autorizado'}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nDistribución actual:');
    Object.entries(statusCounts).forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });
    
    // 2. Identificar préstamos que necesitan corrección
    const loansToFix = allLoans.filter(loan => 
      !loan.is_authorized && 
      loan.status !== 'Pendiente' && 
      loan.status !== 'Devuelto'
    );
    
    console.log(`\n2. Préstamos que necesitan corrección: ${loansToFix.length}`);
    
    if (loansToFix.length === 0) {
      console.log('✅ No hay préstamos que necesiten corrección.');
    } else {
      // 3. Aplicar corrección
      console.log('\n3. Aplicando corrección...');
      
      const loanIds = loansToFix.map(loan => loan.id);
      
      const { data: updatedLoans, error: updateError } = await supabase
        .from('loans')
        .update({ status: 'Pendiente' })
        .in('id', loanIds)
        .select('id, status, is_authorized');
      
      if (updateError) {
        console.log(`❌ Error actualizando préstamos: ${updateError.message}`);
        return;
      }
      
      console.log(`✅ ${updatedLoans.length} préstamos actualizados a 'Pendiente'`);
      
      // Verificar que la actualización fue exitosa
      const successfulUpdates = updatedLoans.filter(loan => loan.status === 'Pendiente');
      console.log(`   - ${successfulUpdates.length} actualizaciones exitosas`);
      
      if (successfulUpdates.length !== updatedLoans.length) {
        console.log(`   ⚠️  ${updatedLoans.length - successfulUpdates.length} actualizaciones fallaron`);
        
        // Mostrar los que fallaron
        const failed = updatedLoans.filter(loan => loan.status !== 'Pendiente');
        failed.forEach(loan => {
          console.log(`     ID: ${loan.id}, Status actual: ${loan.status}`);
        });
      }
    }
    
    // 4. Verificar estado final
    console.log('\n4. Estado final después de corrección...');
    const { data: finalLoans } = await supabase
      .from('loans')
      .select('id, status, is_authorized')
      .order('created_at', { ascending: false });
    
    const finalStatusCounts = finalLoans.reduce((acc, loan) => {
      const key = `${loan.status}_${loan.is_authorized ? 'autorizado' : 'no_autorizado'}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nDistribución final:');
    Object.entries(finalStatusCounts).forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });
    
    // 5. Verificar que hay préstamos pendientes para probar
    const pendingLoans = finalLoans.filter(loan => 
      loan.status === 'Pendiente' && !loan.is_authorized
    );
    
    console.log(`\n5. Préstamos pendientes disponibles para pruebas: ${pendingLoans.length}`);
    
    if (pendingLoans.length > 0) {
      console.log('\n✅ CORRECCIÓN COMPLETADA EXITOSAMENTE');
      console.log('\n📋 Próximos pasos:');
      console.log('1. Ir a la sección "Solicitudes" en la aplicación');
      console.log('2. Verificar que se muestran los préstamos pendientes');
      console.log('3. Probar los botones "Autorizar" y "Rechazar"');
      console.log('4. Confirmar que los préstamos cambian de estado correctamente');
      
      // Mostrar algunos IDs para referencia
      console.log('\n🔍 IDs de préstamos pendientes para pruebas:');
      pendingLoans.slice(0, 3).forEach((loan, index) => {
        console.log(`   ${index + 1}. ${loan.id}`);
      });
    } else {
      console.log('\n⚠️  No hay préstamos pendientes para probar.');
      console.log('   Puedes crear un nuevo préstamo para generar una solicitud pendiente.');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

finalFixLoans();
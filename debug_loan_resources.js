require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugLoanResources() {
  console.log('🔍 Investigando el problema con loan_resources...');
  
  // 1. Verificar si hay registros en loan_resources en general
  const { data: allLoanResources, error: allError } = await supabase
    .from('loan_resources')
    .select('*')
    .limit(10);
  
  if (allError) {
    console.log('❌ Error obteniendo loan_resources:', allError.message);
    return;
  }
  
  console.log(`\n📊 Total de registros en loan_resources (muestra): ${allLoanResources.length}`);
  if (allLoanResources.length > 0) {
    console.log('Ejemplo de registros:');
    allLoanResources.forEach((lr, index) => {
      console.log(`${index + 1}. Loan ID: ${lr.loan_id}, Resource ID: ${lr.resource_id}`);
    });
  }
  
  // 2. Verificar préstamos activos con recursos
  console.log('\n🔍 Verificando préstamos activos con recursos...');
  const { data: activeLoans, error: activeError } = await supabase
    .from('loans')
    .select(`
      id,
      status,
      loan_date,
      teacher_id
    `)
    .eq('status', 'Activo')
    .limit(5);
  
  if (activeError) {
    console.log('❌ Error obteniendo préstamos activos:', activeError.message);
  } else {
    console.log(`Préstamos activos encontrados: ${activeLoans.length}`);
    
    for (const loan of activeLoans) {
      const { data: resources } = await supabase
        .from('loan_resources')
        .select(`
          resource_id,
          resource:resources(name, status)
        `)
        .eq('loan_id', loan.id);
      
      console.log(`\n   Préstamo ${loan.id} (${loan.status}):`);
      console.log(`   Recursos: ${resources?.length || 0}`);
      if (resources && resources.length > 0) {
        resources.forEach((r, i) => {
          console.log(`      ${i + 1}. ${r.resource?.name} - ${r.resource?.status}`);
        });
      }
    }
  }
  
  // 3. Verificar un préstamo específico con daños
  console.log('\n🔍 Verificando préstamo específico con daños...');
  const { data: damagedLoan, error: damagedError } = await supabase
    .from('loans')
    .select('*')
    .eq('status', 'Devuelto')
    .not('notes', 'is', null)
    .ilike('notes', '%Daños:%')
    .limit(1)
    .single();
  
  if (damagedError) {
    console.log('❌ Error obteniendo préstamo con daños:', damagedError.message);
  } else {
    console.log(`\nPréstamo con daños: ${damagedLoan.id}`);
    console.log(`Estado: ${damagedLoan.status}`);
    console.log(`Notas: ${damagedLoan.notes?.substring(0, 100)}...`);
    
    // Verificar si tiene recursos asociados
    const { data: loanRes } = await supabase
      .from('loan_resources')
      .select('*')
      .eq('loan_id', damagedLoan.id);
    
    console.log(`Recursos en loan_resources: ${loanRes?.length || 0}`);
    
    // Verificar si hay registros de mantenimiento para este préstamo
    if (damagedLoan.actual_return_date) {
      const { data: maintenanceRecords } = await supabase
        .from('maintenance_tracking')
        .select('*')
        .gte('created_at', damagedLoan.actual_return_date)
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log(`Registros de mantenimiento desde la devolución: ${maintenanceRecords?.length || 0}`);
      if (maintenanceRecords && maintenanceRecords.length > 0) {
        maintenanceRecords.forEach((record, i) => {
          console.log(`   ${i + 1}. Recurso: ${record.resource_id} - Estado: ${record.status}`);
        });
      }
    }
  }
  
  // 4. Verificar la función returnLoanAction
  console.log('\n🔍 Verificando si la función returnLoanAction está funcionando correctamente...');
  console.log('Esto requiere revisar el código fuente de la función.');
}

debugLoanResources().catch(console.error);
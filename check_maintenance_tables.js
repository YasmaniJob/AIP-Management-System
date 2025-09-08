require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMaintenanceTables() {
  console.log('🔍 Verificando tablas de mantenimiento...');
  
  // Verificar maintenance_tracking
  try {
    const { data: trackingData, error: trackingError } = await supabase
      .from('maintenance_tracking')
      .select('id')
      .limit(1);
    
    if (trackingError) {
      console.log('❌ maintenance_tracking:', trackingError.message);
    } else {
      console.log('✅ maintenance_tracking: Existe');
    }
  } catch (e) {
    console.log('❌ maintenance_tracking: Error -', e.message);
  }
  
  // Verificar maintenance_incidents_individual
  try {
    const { data: incidentsData, error: incidentsError } = await supabase
      .from('maintenance_incidents_individual')
      .select('id')
      .limit(1);
    
    if (incidentsError) {
      console.log('❌ maintenance_incidents_individual:', incidentsError.message);
    } else {
      console.log('✅ maintenance_incidents_individual: Existe');
    }
  } catch (e) {
    console.log('❌ maintenance_incidents_individual: Error -', e.message);
  }
  
  // Verificar maintenance_resource_summary
  try {
    const { data: summaryData, error: summaryError } = await supabase
      .from('maintenance_resource_summary')
      .select('id')
      .limit(1);
    
    if (summaryError) {
      console.log('❌ maintenance_resource_summary:', summaryError.message);
    } else {
      console.log('✅ maintenance_resource_summary: Existe');
    }
  } catch (e) {
    console.log('❌ maintenance_resource_summary: Error -', e.message);
  }
  
  // Verificar si hay devoluciones recientes con daños
  console.log('\n📋 Verificando devoluciones recientes con daños...');
  try {
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select(`
        id,
        status,
        actual_return_date,
        notes,
        user:users(name, dni)
      `)
      .eq('status', 'Devuelto')
      .not('notes', 'is', null)
      .order('actual_return_date', { ascending: false })
      .limit(5);
    
    if (loansError) {
      console.log('❌ Error obteniendo préstamos:', loansError.message);
    } else {
      console.log(`✅ Préstamos devueltos con notas: ${loans.length}`);
      loans.forEach((loan, index) => {
        console.log(`${index + 1}. ${loan.user?.name} - ${new Date(loan.actual_return_date).toLocaleDateString()}`);
        if (loan.notes && loan.notes.includes('Daños:')) {
          console.log('   🔧 Contiene reportes de daños');
        }
      });
    }
  } catch (e) {
    console.log('❌ Error verificando préstamos:', e.message);
  }
}

checkMaintenanceTables().catch(console.error);
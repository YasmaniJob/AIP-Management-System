require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMaintenanceSync() {
  console.log('🔍 Verificando sincronización de mantenimiento...');
  
  // Obtener préstamos devueltos con daños
  const { data: loansWithDamage, error: loansError } = await supabase
    .from('loans')
    .select(`
      id,
      status,
      actual_return_date,
      notes,
      teacher_id
    `)
    .eq('status', 'Devuelto')
    .not('notes', 'is', null)
    .ilike('notes', '%Daños:%')
    .order('actual_return_date', { ascending: false })
    .limit(10);
  
  if (loansError) {
    console.log('❌ Error obteniendo préstamos:', loansError.message);
    return;
  }
  
  console.log(`\n📋 Préstamos con daños encontrados: ${loansWithDamage.length}`);
  
  for (const loan of loansWithDamage) {
    console.log(`\n🔧 Préstamo ID: ${loan.id}`);
    
    // Obtener datos del usuario (teacher)
    const { data: user } = await supabase
      .from('users')
      .select('name, dni')
      .eq('id', loan.teacher_id)
      .single();
    
    // Obtener recursos del préstamo a través de loan_resources
    const { data: loanResources } = await supabase
      .from('loan_resources')
      .select(`
        resource_id,
        resource:resources(name, type, status)
      `)
      .eq('loan_id', loan.id);
    
    console.log(`   Usuario: ${user?.name} (${user?.dni})`);
    console.log(`   Recursos (${loanResources?.length || 0}):`);
    
    if (loanResources && loanResources.length > 0) {
      loanResources.forEach((lr, index) => {
        console.log(`      ${index + 1}. ${lr.resource?.name} (ID: ${lr.resource_id}) - Estado: ${lr.resource?.status}`);
      });
    }
    
    console.log(`   Fecha devolución: ${new Date(loan.actual_return_date).toLocaleDateString()}`);
    
    // Verificar registros de mantenimiento para cada recurso
    if (loanResources && loanResources.length > 0) {
      for (const loanResource of loanResources) {
        const resourceId = loanResource.resource_id;
        console.log(`\n   🔍 Verificando mantenimiento para recurso ID: ${resourceId}`);
        
        // Verificar si existe registro en maintenance_tracking
        const { data: trackingRecords, error: trackingError } = await supabase
          .from('maintenance_tracking')
          .select('*')
          .eq('resource_id', resourceId)
          .gte('created_at', loan.actual_return_date)
          .order('created_at', { ascending: false });
        
        if (trackingError) {
          console.log(`      ❌ Error verificando maintenance_tracking: ${trackingError.message}`);
        } else {
          console.log(`      📊 Registros en maintenance_tracking: ${trackingRecords.length}`);
          if (trackingRecords.length > 0) {
            trackingRecords.forEach((record, index) => {
              console.log(`         ${index + 1}. Estado: ${record.status} - ${new Date(record.created_at).toLocaleString()}`);
            });
          }
        }
        
        // Verificar si existe registro en maintenance_incidents_individual
        const { data: incidentRecords, error: incidentError } = await supabase
          .from('maintenance_incidents_individual')
          .select('*')
          .eq('resource_id', resourceId)
          .gte('created_at', loan.actual_return_date)
          .order('created_at', { ascending: false });
        
        if (incidentError) {
          console.log(`      ❌ Error verificando maintenance_incidents_individual: ${incidentError.message}`);
        } else {
          console.log(`      🚨 Registros en maintenance_incidents_individual: ${incidentRecords.length}`);
          if (incidentRecords.length > 0) {
            incidentRecords.forEach((record, index) => {
              console.log(`         ${index + 1}. Categoría: ${record.incident_category} - Descripción: ${record.description?.substring(0, 50)}...`);
            });
          }
        }
      }
    }
  }
  
  // Verificar registros totales en maintenance_tracking
  console.log('\n📊 Estadísticas generales de mantenimiento:');
  
  const { data: totalTracking, error: totalTrackingError } = await supabase
    .from('maintenance_tracking')
    .select('id', { count: 'exact' });
  
  if (!totalTrackingError) {
    console.log(`   Total registros en maintenance_tracking: ${totalTracking.length}`);
  }
  
  const { data: totalIncidents, error: totalIncidentsError } = await supabase
    .from('maintenance_incidents_individual')
    .select('id', { count: 'exact' });
  
  if (!totalIncidentsError) {
    console.log(`   Total registros en maintenance_incidents_individual: ${totalIncidents.length}`);
  }
}

checkMaintenanceSync().catch(console.error);
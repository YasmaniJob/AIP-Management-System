require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testMaintenanceCreation() {
  console.log('🧪 Probando creación de incidencias de mantenimiento...');
  
  // Buscar préstamos recientes devueltos con daños
  const { data: recentLoans, error: loansError } = await supabase
    .from('loans')
    .select(`
      id,
      notes,
      created_at,
      loan_resources!inner (
        resource_id
      )
    `)
    .eq('status', 'Devuelto')
    .not('notes', 'is', null)
    .ilike('notes', '%Daños:%')
    .order('created_at', { ascending: false })
    .limit(3);

  if (loansError) {
    console.error('❌ Error obteniendo préstamos:', loansError);
    return;
  }

  console.log(`\n✅ Encontrados ${recentLoans.length} préstamos recientes con daños`);
  
  for (const loan of recentLoans) {
    console.log(`\n--- PRÉSTAMO ${loan.id} ---`);
    console.log('📝 Notas:', loan.notes);
    console.log('📅 Fecha:', new Date(loan.created_at).toLocaleString());
    
    // Buscar incidencias de mantenimiento relacionadas
    const resourceIds = loan.loan_resources.map(lr => lr.resource_id);
    
    const { data: maintenanceIncidents, error: maintenanceError } = await supabase
      .from('maintenance_incidents_individual')
      .select(`
        id,
        resource_id,
        damage_type,
        damage_description,
        current_status,
        created_at,
        resources (
          id,
          brand,
          model
        )
      `)
      .in('resource_id', resourceIds)
      .gte('created_at', loan.created_at)
      .order('created_at', { ascending: false });

    if (maintenanceError) {
      console.error('❌ Error obteniendo incidencias:', maintenanceError);
      continue;
    }

    console.log(`\n🔧 Incidencias de mantenimiento creadas: ${maintenanceIncidents.length}`);
    
    maintenanceIncidents.forEach((incident, index) => {
      console.log(`\n  📋 Incidencia ${index + 1}:`);
      console.log(`     🆔 ID: ${incident.id}`);
      console.log(`     🎯 Recurso: ${incident.resources.brand} ${incident.resources.model}`);
      console.log(`     💥 Tipo de daño: ${incident.damage_type}`);
      console.log(`     📝 Descripción: ${incident.damage_description}`);
      console.log(`     📊 Estado: ${incident.current_status}`);
      console.log(`     📅 Creada: ${new Date(incident.created_at).toLocaleString()}`);
    });
    
    // Contar daños en las notas
    const damageMatches = loan.notes.match(/Daños: \[(.*?)\]/g);
    let totalDamages = 0;
    if (damageMatches) {
      damageMatches.forEach(match => {
        const damagesStr = match.match(/\[(.*?)\]/)[1];
        if (damagesStr.trim()) {
          totalDamages += damagesStr.split(',').length;
        }
      });
    }
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`   💥 Daños reportados: ${totalDamages}`);
    console.log(`   🔧 Incidencias creadas: ${maintenanceIncidents.length}`);
    console.log(`   ✅ Sincronización: ${totalDamages === maintenanceIncidents.length ? 'CORRECTA' : 'INCORRECTA ❌'}`);
    
    console.log('\n' + '='.repeat(70));
  }
}

testMaintenanceCreation().catch(console.error);
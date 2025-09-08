require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugReturnMaintenanceSync() {
  try {
    console.log('🔍 Verificando sincronización entre devoluciones con daños e incidencias de mantenimiento...');
    
    // 1. Obtener préstamos devueltos con notas de daños
    const { data: loansWithDamages, error: loansError } = await supabase
      .from('loans')
      .select(`
        id,
        status,
        actual_return_date,
        notes,
        user:users(name, dni),
        loan_resources(resource_id, resources(id, brand, model, status))
      `)
      .eq('status', 'Devuelto')
      .not('notes', 'is', null)
      .ilike('notes', '%Daños:%')
      .order('actual_return_date', { ascending: false })
      .limit(10);

    if (loansError) {
      console.error('❌ Error obteniendo préstamos:', loansError);
      return;
    }

    console.log(`\n📋 Préstamos devueltos con daños encontrados: ${loansWithDamages.length}`);
    
    for (const loan of loansWithDamages) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📦 Préstamo ID: ${loan.id}`);
      console.log(`👤 Usuario: ${loan.user.name} (${loan.user.dni})`);
      console.log(`📅 Fecha devolución: ${new Date(loan.actual_return_date).toLocaleString()}`);
      console.log(`📝 Notas: ${loan.notes.substring(0, 200)}...`);
      
      // Extraer resource IDs de las notas
      const resourceIdMatches = loan.notes.match(/\[Recurso ID ([a-f0-9-]+)\]/g);
      const resourceIds = resourceIdMatches ? 
        resourceIdMatches.map(match => match.match(/\[Recurso ID ([a-f0-9-]+)\]/)[1]) : [];
      
      console.log(`🎯 Recursos con daños reportados: ${resourceIds.length}`);
      
      for (const resourceId of resourceIds) {
        console.log(`\n  🔧 Verificando recurso: ${resourceId}`);
        
        // Buscar el recurso en loan_resources
        const loanResource = loan.loan_resources.find(lr => lr.resource_id === resourceId);
        if (loanResource) {
          console.log(`     📱 Recurso: ${loanResource.resources.brand} ${loanResource.resources.model}`);
          console.log(`     📊 Estado actual: ${loanResource.resources.status}`);
        }
        
        // Verificar incidencias de mantenimiento para este recurso
        const { data: incidents, error: incidentsError } = await supabase
          .from('maintenance_incidents_individual')
          .select('*')
          .eq('resource_id', resourceId)
          .gte('created_at', loan.actual_return_date)
          .order('created_at', { ascending: false });
        
        if (incidentsError) {
          console.error(`     ❌ Error obteniendo incidencias:`, incidentsError);
          continue;
        }
        
        console.log(`     🔧 Incidencias de mantenimiento creadas: ${incidents.length}`);
        
        if (incidents.length === 0) {
          console.log(`     ⚠️  NO SE CREARON INCIDENCIAS PARA ESTE RECURSO`);
          
          // Verificar si el recurso está marcado como dañado
          const { data: resource, error: resourceError } = await supabase
            .from('resources')
            .select('status')
            .eq('id', resourceId)
            .single();
          
          if (!resourceError && resource) {
            console.log(`     📊 Estado del recurso: ${resource.status}`);
            if (resource.status !== 'Dañado') {
              console.log(`     ⚠️  EL RECURSO NO ESTÁ MARCADO COMO DAÑADO`);
            }
          }
        } else {
          incidents.forEach((incident, index) => {
            console.log(`     📋 Incidencia ${index + 1}:`);
            console.log(`        🆔 ID: ${incident.id}`);
            console.log(`        🔢 Número: ${incident.incident_number}`);
            console.log(`        💥 Tipo: ${incident.damage_type}`);
            console.log(`        📝 Descripción: ${incident.damage_description?.substring(0, 100)}...`);
            console.log(`        📊 Estado: ${incident.current_status}`);
            console.log(`        👤 Reportado por: ${incident.reporter_name}`);
            console.log(`        📅 Creada: ${new Date(incident.created_at).toLocaleString()}`);
          });
        }
      }
    }
    
    // 2. Estadísticas generales
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 ESTADÍSTICAS GENERALES:');
    
    const { data: totalIncidents } = await supabase
      .from('maintenance_incidents_individual')
      .select('id', { count: 'exact' });
    
    const { data: recentIncidents } = await supabase
      .from('maintenance_incidents_individual')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    console.log(`🔧 Total incidencias de mantenimiento: ${totalIncidents?.length || 0}`);
    console.log(`🕐 Incidencias creadas en las últimas 24h: ${recentIncidents?.length || 0}`);
    
    const { data: damagedResources } = await supabase
      .from('resources')
      .select('id', { count: 'exact' })
      .eq('status', 'Dañado');
    
    console.log(`💥 Recursos marcados como dañados: ${damagedResources?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

debugReturnMaintenanceSync().catch(console.error);
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMaintenanceFunction() {
  console.log('🔧 Probando función createMaintenanceFromDamageReport...');
  
  try {
    // 1. Buscar un préstamo devuelto con daños
    console.log('\n1. Buscando préstamos devueltos con daños...');
    
    const { data: loansWithDamage, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'Devuelto')
      .like('notes', '%Daños:%')
      .limit(1);
    
    if (loansError) {
      console.error('❌ Error obteniendo préstamos:', loansError);
      return;
    }
    
    if (!loansWithDamage || loansWithDamage.length === 0) {
      console.log('❌ No se encontraron préstamos con daños');
      return;
    }
    
    const loan = loansWithDamage[0];
    console.log('✅ Préstamo encontrado:', {
      id: loan.id,
      teacher_id: loan.teacher_id,
      status: loan.status,
      notes: loan.notes
    });
    
    // 2. Obtener recursos del préstamo
    console.log('\n2. Obteniendo recursos del préstamo...');
    
    const { data: loanResources, error: resourcesError } = await supabase
      .from('loan_resources')
      .select(`
        resource_id,
        resources:resource_id (
          id, number, brand, model
        )
      `)
      .eq('loan_id', loan.id);
    
    if (resourcesError) {
      console.error('❌ Error obteniendo recursos:', resourcesError);
      return;
    }
    
    console.log('✅ Recursos encontrados:', loanResources.length);
    
    // 3. Parsear daños de las notas
    console.log('\n3. Parseando daños de las notas...');
    
    const damageMatches = loan.notes.match(/Daños: \[(.*?)\]/g);
    if (!damageMatches) {
      console.log('❌ No se encontraron daños en las notas');
      return;
    }
    
    console.log('✅ Daños encontrados:', damageMatches);
    
    // 4. Simular la creación de mantenimiento para cada recurso con daños
    console.log('\n4. Simulando creación de mantenimiento...');
    
    for (const resource of loanResources) {
      console.log(`\n   📦 Procesando recurso: ${resource.resources.brand} ${resource.resources.model}`);
      
      // Extraer daños para este recurso (simplificado)
      const damages = [];
      damageMatches.forEach(match => {
        const damagesStr = match.match(/\[(.*?)\]/)[1];
        if (damagesStr.trim()) {
          damages.push(...damagesStr.split(',').map(d => d.trim()));
        }
      });
      
      if (damages.length === 0) {
        console.log('   ⚠️ No hay daños para este recurso');
        continue;
      }
      
      console.log('   💥 Daños a procesar:', damages);
      
      // Verificar incidencias existentes ANTES
      const { data: incidentsBefore, error: beforeError } = await supabase
        .from('maintenance_incidents_individual')
        .select('id, damage_type, created_at')
        .eq('resource_id', resource.resource_id)
        .order('created_at', { ascending: false });
      
      if (beforeError) {
        console.error('   ❌ Error obteniendo incidencias antes:', beforeError);
        continue;
      }
      
      console.log(`   📊 Incidencias ANTES: ${incidentsBefore.length}`);
      
      // Simular llamada a createMaintenanceFromDamageReport
      console.log('   🔧 Simulando creación de incidencias...');
      
      // En lugar de llamar a la función real, vamos a crear las incidencias manualmente
      // para ver si el problema está en la función o en otro lado
      
      for (let i = 0; i < damages.length; i++) {
        const damageType = damages[i];
        
        // Obtener el siguiente número de incidencia
        const { data: existingIncidents, error: countError } = await supabase
          .from('maintenance_incidents_individual')
          .select('incident_number')
          .eq('resource_id', resource.resource_id)
          .order('incident_number', { ascending: false })
          .limit(1);
        
        if (countError) {
          console.error('   ❌ Error contando incidencias:', countError);
          continue;
        }
        
        const nextIncidentNumber = existingIncidents && existingIncidents.length > 0 
          ? existingIncidents[0].incident_number + 1 
          : 1;
        
        // Crear la incidencia
        const incidentData = {
          resource_id: resource.resource_id,
          incident_number: nextIncidentNumber,
          damage_type: damageType,
          damage_description: `Daño reportado durante devolución: ${damageType}`,
          incident_context: `Reportado por préstamo ID: ${loan.id}`,
          priority: 'Media',
          reported_by: loan.teacher_id,
          current_status: 'Pendiente',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('   📝 Creando incidencia:', JSON.stringify(incidentData, null, 2));
        
        const { data: newIncident, error: createError } = await supabase
          .from('maintenance_incidents_individual')
          .insert(incidentData)
          .select()
          .single();
        
        if (createError) {
          console.error('   ❌ Error creando incidencia:', createError);
          console.error('   📋 Datos que causaron el error:', incidentData);
        } else {
          console.log('   ✅ Incidencia creada:', newIncident.id);
        }
      }
      
      // Verificar incidencias DESPUÉS
      const { data: incidentsAfter, error: afterError } = await supabase
        .from('maintenance_incidents_individual')
        .select('id, damage_type, created_at')
        .eq('resource_id', resource.resource_id)
        .order('created_at', { ascending: false });
      
      if (afterError) {
        console.error('   ❌ Error obteniendo incidencias después:', afterError);
        continue;
      }
      
      console.log(`   📊 Incidencias DESPUÉS: ${incidentsAfter.length}`);
      console.log(`   📈 Incidencias creadas: ${incidentsAfter.length - incidentsBefore.length}`);
      
      // Mostrar las nuevas incidencias
      const newIncidents = incidentsAfter.slice(0, incidentsAfter.length - incidentsBefore.length);
      newIncidents.forEach((incident, index) => {
        console.log(`   🆕 Nueva incidencia ${index + 1}: ${incident.damage_type} (ID: ${incident.id})`);
      });
    }
    
    console.log('\n✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testMaintenanceFunction();
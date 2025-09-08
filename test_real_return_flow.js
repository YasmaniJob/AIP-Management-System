const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRealReturnFlow() {
  console.log('🔄 Probando flujo real de devolución con daños...');
  
  try {
    // 1. Crear un préstamo de prueba
    console.log('\n1. Creando préstamo de prueba...');
    
    // Obtener un profesor y un recurso disponible
    const { data: teachers, error: teachersError } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'Docente')
      .limit(1);
    
    if (teachersError || !teachers.length) {
      console.error('❌ Error obteniendo profesores:', teachersError);
      return;
    }
    
    const teacher = teachers[0];
    console.log('✅ Profesor seleccionado:', teacher.name);
    
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('id, number, brand, model')
      .eq('status', 'Disponible')
      .limit(1);
    
    if (resourcesError || !resources.length) {
      console.error('❌ Error obteniendo recursos:', resourcesError);
      return;
    }
    
    const resource = resources[0];
    console.log('✅ Recurso seleccionado:', `${resource.brand} ${resource.model}`);
    
    // Obtener área, grado y sección por defecto
    const { data: areas } = await supabase.from('areas').select('id').limit(1);
    const { data: grades } = await supabase.from('grades').select('id').limit(1);
    const { data: sections } = await supabase.from('sections').select('id').limit(1);
    
    if (!areas?.length || !grades?.length || !sections?.length) {
      console.error('❌ No se encontraron áreas, grados o secciones');
      return;
    }
    
    // Crear el préstamo
    const { data: newLoan, error: loanError } = await supabase
      .from('loans')
      .insert({
        teacher_id: teacher.id,
        area_id: areas[0].id,
        grade_id: grades[0].id,
        section_id: sections[0].id,
        status: 'Activo',
        loan_date: new Date().toISOString().split('T')[0],
        return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Préstamo de prueba para testing'
      })
      .select()
      .single();
    
    if (loanError) {
      console.error('❌ Error creando préstamo:', loanError);
      return;
    }
    
    console.log('✅ Préstamo creado:', newLoan.id);
    
    // Agregar recurso al préstamo
    const { error: loanResourceError } = await supabase
      .from('loan_resources')
      .insert({
        loan_id: newLoan.id,
        resource_id: resource.id
      });
    
    if (loanResourceError) {
      console.error('❌ Error agregando recurso al préstamo:', loanResourceError);
      return;
    }
    
    console.log('✅ Recurso agregado al préstamo');
    
    // Actualizar estado del recurso
    await supabase
      .from('resources')
      .update({ status: 'Prestado' })
      .eq('id', resource.id);
    
    // 2. Contar incidencias antes de la devolución
    console.log('\n2. Contando incidencias antes de la devolución...');
    
    const { data: incidentsBefore, error: beforeError } = await supabase
      .from('maintenance_incidents_individual')
      .select('id')
      .eq('resource_id', resource.id);
    
    if (beforeError) {
      console.error('❌ Error contando incidencias antes:', beforeError);
      return;
    }
    
    console.log(`📊 Incidencias antes: ${incidentsBefore.length}`);
    
    // 3. Simular devolución con daños
    console.log('\n3. Simulando devolución con daños...');
    
    const damageNotes = `[${new Date().toLocaleString()}]\n[Recurso ID ${resource.id}]\nDaños: [Pantalla Rayada, Botón Pegajoso]\nNotas: Daños menores detectados durante la devolución`;
    
    // Actualizar el préstamo como devuelto con daños
    const { error: updateLoanError } = await supabase
      .from('loans')
      .update({
        status: 'Devuelto',
        return_date: new Date().toISOString().split('T')[0],
        notes: damageNotes
      })
      .eq('id', newLoan.id);
    
    if (updateLoanError) {
      console.error('❌ Error actualizando préstamo:', updateLoanError);
      return;
    }
    
    console.log('✅ Préstamo marcado como devuelto con daños');
    
    // Actualizar estado del recurso
    await supabase
      .from('resources')
      .update({ status: 'En Mantenimiento' })
      .eq('id', resource.id);
    
    console.log('✅ Recurso marcado como "En Mantenimiento"');
    
    // 4. Simular la creación de incidencias como lo haría returnLoanAction
    console.log('\n4. Creando incidencias de mantenimiento...');
    
    // Parsear daños
    const damages = ['Pantalla Rayada', 'Botón Pegajoso'];
    
    for (const damage of damages) {
      // Obtener el siguiente número de incidencia
      const { data: existingIncidents, error: countError } = await supabase
        .from('maintenance_incidents_individual')
        .select('incident_number')
        .eq('resource_id', resource.id)
        .order('incident_number', { ascending: false })
        .limit(1);
      
      if (countError) {
        console.error('❌ Error contando incidencias:', countError);
        continue;
      }
      
      const nextIncidentNumber = existingIncidents && existingIncidents.length > 0 
        ? existingIncidents[0].incident_number + 1 
        : 1;
      
      // Crear la incidencia
      const incidentData = {
        resource_id: resource.id,
        incident_number: nextIncidentNumber,
        damage_type: damage,
        damage_description: `Daño reportado durante devolución: ${damage}. Daños menores detectados durante la devolución`,
        incident_context: `Reportado por: ${teacher.name} (Préstamo ID: ${newLoan.id})`,
        priority: 'Media',
        reported_by: teacher.id,
        reporter_name: teacher.name,
        current_status: 'Pendiente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log(`📝 Creando incidencia: ${damage}`);
      
      const { data: newIncident, error: createError } = await supabase
        .from('maintenance_incidents_individual')
        .insert(incidentData)
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creando incidencia:', createError);
      } else {
        console.log(`✅ Incidencia creada: ${newIncident.id}`);
      }
    }
    
    // 5. Verificar incidencias después
    console.log('\n5. Verificando incidencias después...');
    
    const { data: incidentsAfter, error: afterError } = await supabase
      .from('maintenance_incidents_individual')
      .select('id, damage_type, damage_description, created_at')
      .eq('resource_id', resource.id)
      .order('created_at', { ascending: false });
    
    if (afterError) {
      console.error('❌ Error obteniendo incidencias después:', afterError);
      return;
    }
    
    console.log(`📊 Incidencias después: ${incidentsAfter.length}`);
    console.log(`📈 Nuevas incidencias creadas: ${incidentsAfter.length - incidentsBefore.length}`);
    
    // Mostrar las nuevas incidencias
    const newIncidents = incidentsAfter.slice(0, incidentsAfter.length - incidentsBefore.length);
    newIncidents.forEach((incident, index) => {
      console.log(`🆕 Incidencia ${index + 1}: ${incident.damage_type} (${incident.id})`);
    });
    
    // 6. Verificar que aparezcan en la página de mantenimiento
    console.log('\n6. Verificando registros en maintenance_tracking...');
    
    const { data: trackingRecords, error: trackingError } = await supabase
      .from('maintenance_tracking')
      .select('*')
      .eq('resource_id', resource.id)
      .order('created_at', { ascending: false });
    
    if (trackingError) {
      console.error('❌ Error obteniendo registros de tracking:', trackingError);
    } else {
      console.log(`📋 Registros en maintenance_tracking: ${trackingRecords.length}`);
      trackingRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.maintenance_type} - ${record.current_status}`);
      });
    }
    
    // 7. Verificar resumen de mantenimiento
    console.log('\n7. Verificando resumen en maintenance_resource_summary...');
    
    const { data: summaryRecords, error: summaryError } = await supabase
      .from('maintenance_resource_summary')
      .select('*')
      .eq('resource_id', resource.id);
    
    if (summaryError) {
      console.error('❌ Error obteniendo resumen:', summaryError);
    } else {
      console.log(`📊 Registros en resumen: ${summaryRecords.length}`);
      summaryRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. Total incidencias: ${record.total_incidents}, Estado: ${record.current_status}`);
      });
    }
    
    console.log('\n✅ Prueba de flujo completo terminada');
    console.log(`\n🔗 Préstamo de prueba ID: ${newLoan.id}`);
    console.log(`🔗 Recurso ID: ${resource.id}`);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testRealReturnFlow();
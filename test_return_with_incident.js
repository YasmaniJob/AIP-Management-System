require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReturnWithIncident() {
  try {
    console.log('=== PROBANDO DEVOLUCIÓN CON CREACIÓN DE INCIDENCIA ===');
    
    console.log('\n1. Buscando un préstamo activo...');
    
    const { data: activeLoan, error: loanError } = await supabase
      .from('loans')
      .select(`
        *,
        loan_resources(
          resource_id,
          resources(id, name, status)
        ),
        users(name)
      `)
      .eq('status', 'Activo')
      .limit(1)
      .single();
    
    if (loanError || !activeLoan) {
      console.log('❌ No se encontró un préstamo activo para la prueba');
      console.log('Creando un préstamo de prueba...');
      
      // Crear un préstamo de prueba
      const { data: teacher } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'Docente')
        .limit(1)
        .single();
      
      const { data: resource } = await supabase
        .from('resources')
        .select('id, name')
        .eq('status', 'Disponible')
        .limit(1)
        .single();
      
      if (!teacher || !resource) {
        console.error('❌ No hay datos suficientes para crear un préstamo de prueba');
        return;
      }
      
      // Crear préstamo
      const { data: newLoan } = await supabase
        .from('loans')
        .insert({
          teacher_id: teacher.id,
          area_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // ID de área por defecto
          grade_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480', // ID de grado por defecto
          section_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481', // ID de sección por defecto
          status: 'Activo',
          loan_date: new Date().toISOString(),
          notes: 'Préstamo de prueba para test de incidencias'
        })
        .select()
        .single();
      
      // Crear relación con recurso
      await supabase
        .from('loan_resources')
        .insert({
          loan_id: newLoan.id,
          resource_id: resource.id
        });
      
      // Actualizar estado del recurso
      await supabase
        .from('resources')
        .update({ status: 'Prestado' })
        .eq('id', resource.id);
      
      console.log(`✅ Préstamo de prueba creado: ${newLoan.id}`);
      
      // Usar el préstamo recién creado
      activeLoan = {
        ...newLoan,
        loan_resources: [{ resource_id: resource.id, resources: resource }],
        users: teacher
      };
    }
    
    console.log(`✅ Préstamo encontrado: ${activeLoan.id}`);
    console.log(`   Docente: ${activeLoan.users.name}`);
    console.log(`   Recursos: ${activeLoan.loan_resources.length}`);
    
    console.log('\n2. Contando incidencias antes de la devolución...');
    const { data: incidentsBefore } = await supabase
      .from('incidents')
      .select('id');
    
    console.log(`📊 Incidencias antes: ${incidentsBefore.length}`);
    
    console.log('\n3. Simulando devolución con daños...');
    
    const resourceId = activeLoan.loan_resources[0].resource_id;
    
    // Simular el proceso de devolución con daños
    const damageReport = {
      resourceId: resourceId,
      damages: ['Pantalla rota', 'Teclado dañado'],
      notes: 'Daños detectados durante la devolución - Prueba automática'
    };
    
    // Actualizar el préstamo a devuelto
    await supabase
      .from('loans')
      .update({
        status: 'Devuelto',
        return_date: new Date().toISOString(),
        notes: activeLoan.notes + ' - Devuelto con daños reportados'
      })
      .eq('id', activeLoan.id);
    
    // Actualizar estado del recurso a dañado
    await supabase
      .from('resources')
      .update({ status: 'Dañado' })
      .eq('id', resourceId);
    
    // Crear incidencia manualmente (simulando createIncidentAction)
    const incidentData = {
      resource_id: resourceId,
      title: damageReport.damages.join(', '),
      description: `Daños reportados: ${damageReport.damages.join(', ')}. Notas: ${damageReport.notes}`,
      priority: 'Alta', // Pantalla rota es crítico
      type: 'Daño',
      reported_by: activeLoan.teacher_id,
      status: 'Reportado',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newIncident, error: incidentError } = await supabase
      .from('incidents')
      .insert(incidentData)
      .select()
      .single();
    
    if (incidentError) {
      console.error('❌ Error al crear incidencia:', incidentError);
    } else {
      console.log(`✅ Incidencia creada: ${newIncident.id}`);
      console.log(`   Título: ${newIncident.title}`);
      console.log(`   Prioridad: ${newIncident.priority}`);
    }
    
    // Crear registro en equipment_history
    await supabase
      .from('equipment_history')
      .insert({
        resource_id: resourceId,
        event_type: 'incident_created',
        event_description: `Incidencia reportada: ${incidentData.title}`,
        performed_by: activeLoan.teacher_id,
        metadata: {
          incident_id: newIncident?.id,
          priority: incidentData.priority,
          resource_status_updated: true
        }
      });
    
    console.log('\n4. Verificando resultado...');
    const { data: incidentsAfter } = await supabase
      .from('incidents')
      .select('id');
    
    console.log(`📊 Incidencias después: ${incidentsAfter.length}`);
    console.log(`📈 Incidencias creadas: ${incidentsAfter.length - incidentsBefore.length}`);
    
    // Verificar el estado del recurso
    const { data: updatedResource } = await supabase
      .from('resources')
      .select('status')
      .eq('id', resourceId)
      .single();
    
    console.log(`🔧 Estado del recurso: ${updatedResource.status}`);
    
    console.log('\n✅ Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testReturnWithIncident();
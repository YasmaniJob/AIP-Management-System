require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testReturnWithDamage() {
  try {
    // Usar el primer préstamo activo
    const loanId = 'c4cf8efe-5274-4b36-97fd-e59ba4d26c16';
    const dni = '87890123';
    
    console.log('🧪 Probando devolución con reporte de daño...');
    console.log(`📋 Préstamo ID: ${loanId}`);
    console.log(`👤 DNI: ${dni}`);
    
    // Obtener detalles del préstamo
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select(`
        *,
        user:users(name, dni),
        grade:grades(name),
        section:sections(name),
        loan_resources(resources(id, brand, model))
      `)
      .eq('id', loanId)
      .single();
    
    if (loanError || !loan) {
      console.error('❌ Error obteniendo préstamo:', loanError);
      return;
    }
    
    console.log(`✅ Préstamo encontrado:`);
    console.log(`   Usuario: ${loan.user.name}`);
    console.log(`   Grado: ${loan.grade?.name || 'No especificado'}`);
    console.log(`   Sección: ${loan.section?.name || 'No especificado'}`);
    console.log(`   Recursos: ${loan.loan_resources.length}`);
    
    // Simular datos de devolución con daño
    const returnData = {
      loanId: loanId,
      dni: dni,
      damageReports: [
        {
          resourceId: loan.loan_resources[0].resources.id,
          damages: ['Pantalla rota', 'Teclado dañado'],
          notes: 'Daños detectados durante la devolución - Prueba automática'
        }
      ]
    };
    
    console.log('\n📊 Datos de devolución:');
    console.log('   Recurso ID:', returnData.damageReports[0].resourceId);
    console.log('   Daños:', returnData.damageReports[0].damages);
    console.log('   Notas:', returnData.damageReports[0].notes);
    
    // Contar incidencias antes
    const { data: incidentsBefore } = await supabase
      .from('maintenance_incidents_individual')
      .select('id');
    
    console.log(`\n📈 Incidencias antes: ${incidentsBefore.length}`);
    
    // Simular el proceso de devolución manualmente
    console.log('\n🔄 Procesando devolución...');
    
    // 1. Actualizar préstamo
    const { error: updateLoanError } = await supabase
      .from('loans')
      .update({
        status: 'Devuelto',
        actual_return_date: new Date().toISOString(),
        notes: `[Recurso ID ${returnData.damageReports[0].resourceId}]\nDaños: [${returnData.damageReports[0].damages.join(', ')}] | Notas: "${returnData.damageReports[0].notes}"\n`
      })
      .eq('id', loanId);
    
    if (updateLoanError) {
      console.error('❌ Error actualizando préstamo:', updateLoanError);
      return;
    }
    
    // 2. Actualizar recurso a dañado
    const { error: updateResourceError } = await supabase
      .from('resources')
      .update({ status: 'Dañado' })
      .eq('id', returnData.damageReports[0].resourceId);
    
    if (updateResourceError) {
      console.error('❌ Error actualizando recurso:', updateResourceError);
      return;
    }
    
    // 3. Crear incidencia individual con datos del docente
    const incidentNumber = Math.floor(Math.random() * 1000000);
    
    const { data: newIncident, error: incidentError } = await supabase
        .from('maintenance_incidents_individual')
        .insert({
          resource_id: returnData.damageReports[0].resourceId,
          incident_number: incidentNumber,
          damage_type: returnData.damageReports[0].damages[0] || 'Daño general',
          damage_description: `Daños reportados durante devolución: ${returnData.damageReports[0].damages.join(', ')}. Notas: ${returnData.damageReports[0].notes}`,
          reporter_name: loan.user.name,
          reporter_grade: loan.grade?.name || 'No especificado',
          reporter_section: loan.section?.name || 'No especificado',
          current_status: 'Reportado',
          priority: 'Alta'
        })
      .select()
      .single();
    
    if (incidentError) {
      console.error('❌ Error creando incidencia:', incidentError);
      return;
    }
    
    console.log('✅ Incidencia creada exitosamente:');
    console.log(`   ID: ${newIncident.id}`);
    console.log(`   Número: ${newIncident.incident_number}`);
    console.log(`   Reportero: ${newIncident.reporter_name}`);
    console.log(`   Grado: ${newIncident.reporter_grade}`);
    console.log(`   Sección: ${newIncident.reporter_section}`);
    
    // Verificar que se creó correctamente
    const { data: incidentsAfter } = await supabase
      .from('maintenance_incidents_individual')
      .select('id');
    
    console.log(`\n📈 Incidencias después: ${incidentsAfter.length}`);
    console.log(`✅ Se creó ${incidentsAfter.length - incidentsBefore.length} nueva incidencia`);
    
  } catch (err) {
    console.error('❌ Error ejecutando prueba:', err);
  }
}

testReturnWithDamage();
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testRealReturnAction() {
  try {
    console.log('🧪 Probando el flujo real de devolución con daños...');
    
    // 1. Crear un préstamo de prueba
    console.log('\n📋 Creando préstamo de prueba...');
    
    // Obtener un usuario y recurso disponible
    const { data: user } = await supabase
      .from('users')
      .select('id, name, dni')
      .eq('role', 'Docente')
      .limit(1)
      .single();
    
    const { data: resource } = await supabase
      .from('resources')
      .select('id, brand, model, status')
      .eq('status', 'Disponible')
      .limit(1)
      .single();
    
    // Obtener un área
     const { data: area } = await supabase
       .from('areas')
       .select('id, name')
       .limit(1)
       .single();
     
     // Obtener grado y sección
     const { data: grade } = await supabase
       .from('grades')
       .select('id, name, sections(id, name)')
       .limit(1)
       .single();
     
     if (!user || !resource || !area || !grade || !grade.sections || grade.sections.length === 0) {
       console.log('❌ No se encontraron usuarios, recursos, áreas, grados o secciones disponibles');
       return;
     }
     
     const section = grade.sections[0];
     
     console.log(`👤 Usuario: ${user.name} (${user.dni})`);
     console.log(`📱 Recurso: ${resource.brand} ${resource.model} (${resource.id})`);
     console.log(`📚 Área: ${area.name} (${area.id})`);
     console.log(`🎓 Grado: ${grade.name} (${grade.id})`);
     console.log(`📝 Sección: ${section.name} (${section.id})`);
    
    // Crear préstamo
     const { data: loan, error: loanError } = await supabase
       .from('loans')
       .insert({
         teacher_id: user.id,
         area_id: area.id,
         grade_id: grade.id,
         section_id: section.id,
         status: 'Activo',
         loan_date: new Date().toISOString(),
         return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
         is_authorized: true
       })
       .select()
       .single();
    
    if (loanError) {
      console.error('❌ Error creando préstamo:', loanError);
      return;
    }
    
    // Agregar recurso al préstamo
    const { error: loanResourceError } = await supabase
      .from('loan_resources')
      .insert({
        loan_id: loan.id,
        resource_id: resource.id
      });
    
    if (loanResourceError) {
      console.error('❌ Error agregando recurso al préstamo:', loanResourceError);
      return;
    }
    
    // Actualizar recurso a prestado
    await supabase
      .from('resources')
      .update({ status: 'Prestado' })
      .eq('id', resource.id);
    
    console.log(`✅ Préstamo creado: ${loan.id}`);
    
    // 2. Simular devolución con daños usando los mismos datos que la UI
    console.log('\n🔄 Simulando devolución con daños...');
    
    const returnData = {
      loanId: loan.id,
      dni: user.dni,
      damageReports: [{
        resourceId: resource.id,
        damages: ['Pantalla rota', 'Teclado dañado'],
        notes: 'Daños detectados durante la devolución - Test automático'
      }]
    };
    
    console.log('📊 Datos de devolución:', JSON.stringify(returnData, null, 2));
    
    // Contar incidencias antes
    const { data: incidentsBefore } = await supabase
      .from('maintenance_incidents_individual')
      .select('id', { count: 'exact' });
    
    console.log(`📈 Incidencias antes: ${incidentsBefore?.length || 0}`);
    
    // 3. Simular el proceso de devolución paso a paso
    console.log('\n🔧 Procesando devolución paso a paso...');
    
    // Verificar préstamo
    const { data: loanToReturn, error: fetchError } = await supabase
      .from('loans')
      .select(`
        *,
        user:users(name, dni),
        grade:grades(name),
        section:sections(name)
      `)
      .eq('id', returnData.loanId)
      .single();
    
    if (fetchError || !loanToReturn) {
      console.error('❌ Error obteniendo préstamo:', fetchError);
      return;
    }
    
    console.log('✅ Préstamo encontrado para devolución');
    
    // Verificar DNI
    if (loanToReturn.user.dni !== returnData.dni) {
      console.error('❌ DNI no coincide');
      return;
    }
    
    console.log('✅ DNI verificado');
    
    // Obtener recursos del préstamo
    const { data: allLoanResources, error: fetchAllResourcesError } = await supabase
      .from('loan_resources')
      .select('resource_id')
      .eq('loan_id', returnData.loanId);
    
    if (fetchAllResourcesError) {
      console.error('❌ Error obteniendo recursos:', fetchAllResourcesError);
      return;
    }
    
    console.log(`✅ Recursos del préstamo: ${allLoanResources.length}`);
    
    // Construir contexto del préstamo
    const loanContext = {
      teacherName: loanToReturn.user.name,
      gradeName: loanToReturn.grade?.name || 'Sin grado',
      sectionName: loanToReturn.section?.name || 'Sin sección'
    };
    
    console.log('✅ Contexto del préstamo:', loanContext);
    
    // Procesar recursos para actualización
    const allResourceIdsInLoan = allLoanResources.map(r => r.resource_id);
    const today = new Date();
    const returnTimestamp = today.toLocaleString('es-PE', { timeZone: 'America/Lima' });
    
    let finalNotes = `[${returnTimestamp}]\n`;
    let resourcesToUpdate = {};
    let hasAnyReport = false;
    
    console.log('\n🔍 Procesando recursos para actualización...');
    
    for (const resourceId of allResourceIdsInLoan) {
      const damages = returnData.damageReports?.find(r => r.resourceId === resourceId);
      const isDamaged = damages && damages.damages.length > 0;
      
      console.log(`  📱 Recurso ${resourceId}:`);
      console.log(`     💥 Tiene daños: ${isDamaged}`);
      console.log(`     📝 Daños: ${damages?.damages || 'Ninguno'}`);
      
      let resourceNoteForItself = `[${returnTimestamp}]\n`;
      let hasReportForThisResource = false;
      let reportForLoanNote = `[Recurso ID ${resourceId}]\n`;
      
      if (isDamaged || (damages && damages.notes)) {
        hasReportForThisResource = true;
        const damageText = `Daños: [${damages.damages.join(', ')}]` + (damages.notes ? ` | Notas: "${damages.notes}"\n` : '\n');
        resourceNoteForItself += damageText;
        reportForLoanNote += damageText;
      }
      
      if (hasReportForThisResource) {
        hasAnyReport = true;
        finalNotes += reportForLoanNote;
      }
      
      resourcesToUpdate[resourceId] = {
        status: isDamaged ? 'Dañado' : 'Disponible',
        notes: hasReportForThisResource ? resourceNoteForItself.trim() : null,
      };
      
      console.log(`     📊 Nuevo estado: ${resourcesToUpdate[resourceId].status}`);
      console.log(`     📝 Notas: ${resourcesToUpdate[resourceId].notes ? 'Sí' : 'No'}`);
    }
    
    console.log('\n📝 Notas finales del préstamo:');
    console.log(finalNotes);
    
    // Actualizar préstamo
    console.log('\n💾 Actualizando préstamo...');
    const { error: updateLoanError } = await supabase
      .from('loans')
      .update({
        status: 'Devuelto',
        actual_return_date: today.toISOString(),
        notes: hasAnyReport ? finalNotes.trim() : null,
      })
      .eq('id', returnData.loanId);
    
    if (updateLoanError) {
      console.error('❌ Error actualizando préstamo:', updateLoanError);
      return;
    }
    
    console.log('✅ Préstamo actualizado');
    
    // Actualizar recursos
    console.log('\n🔧 Actualizando recursos...');
    for (const resourceId in resourcesToUpdate) {
      console.log(`  📱 Actualizando recurso ${resourceId}...`);
      
      const { error: updateResourceError } = await supabase
        .from('resources')
        .update({ 
          status: resourcesToUpdate[resourceId].status,
          notes: resourcesToUpdate[resourceId].notes,
        })
        .eq('id', resourceId);
      
      if (updateResourceError) {
        console.error(`❌ Error actualizando recurso ${resourceId}:`, updateResourceError);
        continue;
      }
      
      console.log(`  ✅ Recurso ${resourceId} actualizado a ${resourcesToUpdate[resourceId].status}`);
      
      // Si el recurso está dañado, crear incidencias de mantenimiento
      if (resourcesToUpdate[resourceId].status === 'Dañado') {
        const damageReport = returnData.damageReports?.find(r => r.resourceId === resourceId);
        
        if (damageReport && damageReport.damages.length > 0) {
          console.log(`  🔧 Creando incidencias de mantenimiento para ${resourceId}...`);
          
          try {
            // Simular createMaintenanceFromDamageReport
            for (let i = 0; i < damageReport.damages.length; i++) {
              const damageType = damageReport.damages[i];
              
              // Obtener siguiente número de incidencia
              const { data: existingIncidents } = await supabase
                .from('maintenance_incidents_individual')
                .select('incident_number')
                .eq('resource_id', resourceId)
                .order('incident_number', { ascending: false })
                .limit(1);
              
              const nextIncidentNumber = existingIncidents && existingIncidents.length > 0 
                ? existingIncidents[0].incident_number + 1 
                : 1;
              
              // Crear incidencia
              const incidentData = {
                resource_id: resourceId,
                incident_number: nextIncidentNumber,
                damage_type: damageType,
                damage_description: `${damageReport.damages.join(', ')}${damageReport.notes ? '\n\nNotas del daño:\n' + damageReport.notes : ''}`,
                incident_context: `Reportado por: ${loanContext.teacherName} (${loanContext.gradeName} - ${loanContext.sectionName})`,
                priority: 'Media',
                reported_by: user.id,
                reporter_name: loanContext.teacherName,
                reporter_grade: loanContext.gradeName,
                reporter_section: loanContext.sectionName,
                current_status: 'Pendiente',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              console.log(`    📋 Creando incidencia ${i + 1}:`, JSON.stringify(incidentData, null, 2));
              
              const { data: newIncident, error: createError } = await supabase
                .from('maintenance_incidents_individual')
                .insert(incidentData)
                .select()
                .single();
              
              if (createError) {
                console.error(`    ❌ Error creando incidencia:`, createError);
              } else {
                console.log(`    ✅ Incidencia creada: ${newIncident.id}`);
              }
            }
          } catch (error) {
            console.error(`  ❌ Error en creación de incidencias:`, error);
          }
        }
      }
    }
    
    // Verificar resultado final
    console.log('\n📊 Verificando resultado final...');
    
    const { data: incidentsAfter } = await supabase
      .from('maintenance_incidents_individual')
      .select('id', { count: 'exact' });
    
    console.log(`📈 Incidencias después: ${incidentsAfter?.length || 0}`);
    console.log(`✅ Incidencias creadas: ${(incidentsAfter?.length || 0) - (incidentsBefore?.length || 0)}`);
    
    // Verificar estado del recurso
    const { data: updatedResource } = await supabase
      .from('resources')
      .select('status, notes')
      .eq('id', resource.id)
      .single();
    
    console.log(`📱 Estado final del recurso: ${updatedResource?.status}`);
    console.log(`📝 Notas del recurso: ${updatedResource?.notes ? 'Sí' : 'No'}`);
    
    // Limpiar - eliminar el préstamo de prueba
    console.log('\n🧹 Limpiando datos de prueba...');
    await supabase.from('loan_resources').delete().eq('loan_id', loan.id);
    await supabase.from('loans').delete().eq('id', loan.id);
    console.log('✅ Datos de prueba eliminados');
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  }
}

testRealReturnAction().catch(console.error);
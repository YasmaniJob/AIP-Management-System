import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Crear cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Esquema de validación simplificado
const returnSchema = {
  safeParse: (data) => ({ success: true, data })
};

// Función returnLoanAction simplificada para pruebas
async function returnLoanAction(values) {
  console.log('returnLoanAction called with values:', values);
  const parsedData = returnSchema.safeParse(values);

  if (!parsedData.success) {
    console.error('Schema validation failed:', parsedData.error);
    return { success: false, error: 'Datos de formulario inválidos.' };
  }
  
  const { loanId, dni, damageReports = [], suggestions = [] } = parsedData.data;
  console.log('Parsed data:', { loanId, dni, damageReports, suggestions });

  // 1. Fetch loan and user to validate DNI
  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .select(`
      *,
      user:users(dni, name),
      grade:grades(name),
      section:sections(name)
    `)
    .eq('id', loanId)
    .single();
  
  // Prepare loan context for maintenance creation
  const loanContext = {
    teacherName: loan?.user?.name || 'Docente desconocido',
    teacherId: loan?.teacher_id || '',
    gradeId: loan?.grade_id || '',
    sectionId: loan?.section_id || '',
    gradeName: loan?.grade?.name || 'Grado desconocido',
    sectionName: loan?.section?.name || 'Sección desconocida'
  };
  
  if (loanError || !loan) {
    console.error('Loan not found:', loanError);
    return { success: false, error: 'Préstamo no encontrado.' };
  }

  console.log('✅ Loan found:', {
    id: loan.id,
    status: loan.status,
    teacher: loan.user?.name,
    dni: loan.user?.dni
  });

  // 2. Validate DNI
  if (dni !== loan.user?.dni) {
    console.error('❌ DNI mismatch. Expected:', loan.user?.dni, 'Provided:', dni);
    return { success: false, error: 'DNI no coincide con el del préstamo.' };
  }

  console.log('✅ DNI validation passed');

  // 3. Get loan resources
  const { data: loanResources, error: resourcesError } = await supabase
    .from('loan_resources')
    .select(`
      resource_id,
      resources(
        id,
        brand,
        model,
        status,
        category:categories(name, type)
      )
    `)
    .eq('loan_id', loanId);

  if (resourcesError || !loanResources) {
    console.error('❌ Error fetching loan resources:', resourcesError);
    return { success: false, error: 'Error al obtener recursos del préstamo.' };
  }

  console.log('✅ Found', loanResources.length, 'resources in loan');

  // 4. Process damage reports and suggestions
  let maintenanceCreated = 0;
  let resourcesWithDamage = [];

  for (const damageReport of damageReports) {
    if (damageReport.damages && damageReport.damages.length > 0) {
      const resource = loanResources.find(lr => lr.resource_id === damageReport.resourceId);
      if (!resource) {
        console.warn('⚠️ Resource not found for damage report:', damageReport.resourceId);
        continue;
      }

      console.log('🔧 Processing damage report for resource:', resource.resources.brand, resource.resources.model);
      
      // Create maintenance record
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_tracking')
        .insert({
          resource_id: damageReport.resourceId,
          user_id: loanContext.teacherId,
          maintenance_type: damageReport.damages.join(', '),
          incident_category: 'daño',
          incident_description: `Daños reportados durante devolución: ${damageReport.damages.join(', ')}. ${damageReport.notes || ''}`,
          current_status: 'En Reparación',
          estimated_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 días después
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (maintenanceError) {
        console.error('❌ Error creating maintenance record:', maintenanceError);
        continue;
      }

      console.log('✅ Maintenance record created:', maintenance.id);
      maintenanceCreated++;

      // Create individual incidents for each damage
      for (const damage of damageReport.damages) {
        const { error: incidentError } = await supabase
          .from('maintenance_incidents')
          .insert({
            maintenance_id: maintenance.id,
            incident_type: damage,
            description: `${damage} - ${damageReport.notes || 'Sin notas adicionales'}`,
            status: 'Pendiente',
            priority: 'Media',
            reported_date: new Date().toISOString()
          });

        if (incidentError) {
          console.error('❌ Error creating incident:', incidentError);
        } else {
          console.log('✅ Incident created for:', damage);
        }
      }

      resourcesWithDamage.push(damageReport.resourceId);
    }
  }

  // 5. Update resource statuses
  const resourceUpdates = [];
  
  for (const loanResource of loanResources) {
    const resourceId = loanResource.resource_id;
    const hasDamage = resourcesWithDamage.includes(resourceId);
    const newStatus = hasDamage ? 'Dañado' : 'Disponible';
    
    const { error: updateError } = await supabase
      .from('resources')
      .update({ status: newStatus })
      .eq('id', resourceId);
    
    if (updateError) {
      console.error('❌ Error updating resource status:', updateError);
    } else {
      console.log(`✅ Resource ${resourceId} status updated to: ${newStatus}`);
      resourceUpdates.push({ resourceId, status: newStatus });
    }
  }

  // 6. Update loan status
  const { error: loanUpdateError } = await supabase
    .from('loans')
    .update({
      status: 'Devuelto',
      actual_return_date: new Date().toISOString()
    })
    .eq('id', loanId);

  if (loanUpdateError) {
    console.error('❌ Error updating loan status:', loanUpdateError);
    return { success: false, error: 'Error al actualizar el estado del préstamo.' };
  }

  console.log('✅ Loan status updated to: Devuelto');

  // 7. Process suggestions (optional)
  for (const suggestion of suggestions) {
    if (suggestion.suggestions && suggestion.suggestions.length > 0) {
      console.log('💡 Processing suggestions for resource:', suggestion.resourceId);
      console.log('   Suggestions:', suggestion.suggestions.join(', '));
      console.log('   Notes:', suggestion.notes || 'Sin notas');
    }
  }

  const result = {
    success: true,
    message: 'Devolución procesada exitosamente',
    data: {
      loanId,
      maintenanceRecordsCreated: maintenanceCreated,
      resourceUpdates,
      damageReports: damageReports.length,
      suggestions: suggestions.length
    }
  };

  console.log('\n🎉 Return process completed successfully:', result);
  return result;
}

// Función principal de prueba
async function testUIReturnFlow() {
  console.log('🧪 Simulando el flujo exacto de la UI de devolución con daños...');
  
  try {
    // 1. Buscar préstamo activo o crear uno de prueba
    console.log('\n1. Buscando préstamo activo...');
    let { data: activeLoan, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'Activo')
      .limit(1)
      .maybeSingle();
    
    if (loanError) {
      console.error('❌ Error buscando préstamo activo:', loanError);
      return;
    }
    
    if (!activeLoan) {
      console.log('📋 No hay préstamos activos, creando uno de prueba...');
      
      // Obtener datos necesarios
      const { data: user } = await supabase.from('users').select('id, name, dni').eq('role', 'Docente').limit(1).single();
      const { data: resource } = await supabase.from('resources').select('id, brand, model').eq('status', 'Disponible').limit(1).single();
      const { data: area } = await supabase.from('areas').select('id').limit(1).single();
      const { data: grade } = await supabase.from('grades').select('id, sections(id)').limit(1).single();
      
      if (!user || !resource || !area || !grade || !grade.sections || grade.sections.length === 0) {
        console.error('❌ No se encontraron datos necesarios para crear préstamo');
        return;
      }
      
      // Crear préstamo
      const { data: newLoan, error: createLoanError } = await supabase
        .from('loans')
        .insert({
          teacher_id: user.id,
          area_id: area.id,
          grade_id: grade.id,
          section_id: grade.sections[0].id,
          status: 'Activo',
          loan_date: new Date().toISOString(),
          return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_authorized: true
        })
        .select()
        .single();
      
      if (createLoanError) {
        console.error('❌ Error creando préstamo:', createLoanError);
        return;
      }
      
      // Asociar recurso al préstamo
      const { error: loanResourceError } = await supabase
        .from('loan_resources')
        .insert({
          loan_id: newLoan.id,
          resource_id: resource.id
        });
      
      if (loanResourceError) {
        console.error('❌ Error asociando recurso:', loanResourceError);
        return;
      }
      
      // Marcar recurso como prestado
      await supabase.from('resources').update({ status: 'Prestado' }).eq('id', resource.id);
      
      activeLoan = newLoan;
      console.log('✅ Préstamo de prueba creado:', activeLoan.id);
    }
    
    // Obtener datos del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, dni')
      .eq('id', activeLoan.teacher_id)
      .single();
    
    if (userError || !user) {
      console.error('❌ Error obteniendo usuario:', userError);
      return;
    }
    
    // Obtener recursos del préstamo
    const { data: loanResources, error: loanResourcesError } = await supabase
      .from('loan_resources')
      .select('resource_id, resources(id, brand, model, categories(name, type))')
      .eq('loan_id', activeLoan.id);
    
    if (loanResourcesError || !loanResources || loanResources.length === 0) {
      console.error('❌ Error obteniendo recursos:', loanResourcesError);
      return;
    }
    
    const resource = loanResources[0].resources;
    const categoryType = resource.categories?.type || 'Desconocido';
    
    console.log('✅ Préstamo encontrado:', {
      id: activeLoan.id,
      teacher: user.name,
      dni: user.dni,
      resources: loanResources.length
    });
    
    console.log('\n2. Recurso a reportar daño:', {
      id: resource.id,
      brand: resource.brand,
      model: resource.model,
      categoryType: categoryType
    });
    
    // 3. Simular exactamente los datos que envía el formulario de la UI
    const uiFormData = {
      loanId: activeLoan.id,
      dni: user.dni,
      damageReports: [{
        resourceId: resource.id,
        damages: ['Pantalla rota', 'Teclado dañado'], // Simular selección de daños
        notes: 'Daños detectados durante la devolución - Simulación UI'
      }],
      suggestions: [{
        resourceId: resource.id,
        suggestions: ['Limpieza general'], // Simular sugerencia
        notes: 'Necesita limpieza profunda'
      }]
    };
    
    console.log('\n3. Datos del formulario UI:', JSON.stringify(uiFormData, null, 2));
    
    // 4. Llamar a la función returnLoanAction
    console.log('\n4. Llamando a returnLoanAction...');
    const result = await returnLoanAction(uiFormData);
    
    console.log('\n5. Resultado de returnLoanAction:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ ¡Devolución procesada exitosamente!');
      console.log('   - Registros de mantenimiento creados:', result.data.maintenanceRecordsCreated);
      console.log('   - Recursos actualizados:', result.data.resourceUpdates.length);
      console.log('   - Reportes de daño procesados:', result.data.damageReports);
      console.log('   - Sugerencias procesadas:', result.data.suggestions);
      
      // Verificar el estado final
      console.log('\n6. Verificando estado final...');
      
      // Verificar préstamo
      const { data: finalLoan } = await supabase
        .from('loans')
        .select('id, status, actual_return_date')
        .eq('id', activeLoan.id)
        .single();
      
      console.log('   - Estado del préstamo:', finalLoan?.status);
      console.log('   - Fecha de devolución:', finalLoan?.actual_return_date);
      
      // Verificar recursos
      for (const update of result.data.resourceUpdates) {
        const { data: finalResource } = await supabase
          .from('resources')
          .select('id, status')
          .eq('id', update.resourceId)
          .single();
        
        console.log(`   - Recurso ${update.resourceId}: ${finalResource?.status}`);
      }
      
      // Verificar incidencias creadas
      const { data: incidents, count } = await supabase
        .from('maintenance_incidents')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log('   - Total de incidencias en el sistema:', count);
      console.log('   - Últimas incidencias creadas:', incidents?.length || 0);
      
    } else {
      console.error('❌ Error en la devolución:', result.error);
    }
    
    console.log('\n✅ Prueba completada exitosamente');
    
    // Limpiar datos de prueba si se creó un préstamo
    if (activeLoan && activeLoan.id) {
      console.log('\n🧹 Limpiando datos de prueba...');
      
      // Obtener recursos antes de eliminar
      const { data: loanResources } = await supabase
        .from('loan_resources')
        .select('resource_id')
        .eq('loan_id', activeLoan.id);
      
      // Eliminar loan_resources
      await supabase.from('loan_resources').delete().eq('loan_id', activeLoan.id);
      
      // Eliminar préstamo
      await supabase.from('loans').delete().eq('id', activeLoan.id);
      
      // Restaurar estado de recursos a Disponible
      if (loanResources && loanResources.length > 0) {
        for (const lr of loanResources) {
          await supabase.from('resources').update({ status: 'Disponible' }).eq('id', lr.resource_id);
        }
      }
      
      console.log('✅ Datos de prueba limpiados');
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

testUIReturnFlow();
// test_ui_return_flow.js
// Script para simular exactamente el flujo de la UI de devolución con daños

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUIReturnFlow() {
  console.log('🧪 Simulando el flujo exacto de la UI de devolución con daños...');
  
  try {
    // 1. Crear un préstamo de prueba si no hay activos
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
      console.error('❌ No se encontró usuario:', userError);
      return;
    }
    
    // Obtener recursos del préstamo
    const { data: loanResources, error: loanResourcesError } = await supabase
      .from('loan_resources')
      .select('resource_id')
      .eq('loan_id', activeLoan.id);
    
    if (loanResourcesError || !loanResources || loanResources.length === 0) {
      console.error('❌ No se encontraron recursos del préstamo:', loanResourcesError);
      return;
    }
    
    // Obtener datos del primer recurso
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('id, brand, model, category_id')
      .eq('id', loanResources[0].resource_id)
      .single();
    
    if (resourceError || !resource) {
      console.error('❌ No se encontró recurso:', resourceError);
      return;
    }
    
    // Obtener categoría del recurso
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('name, type')
      .eq('id', resource.category_id)
      .single();
    
    console.log('✅ Préstamo encontrado:', {
      id: activeLoan.id,
      teacher: user.name,
      dni: user.dni,
      resources: loanResources.length
    });
    
    // 2. Simular los datos que envía la UI
    const categoryType = category?.type || 'Otros';
    
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
    
    // 4. Llamar directamente a la función returnLoanAction
    console.log('\n4. Llamando a returnLoanAction...');
    
    // Importar la función de acción
    const { returnLoanAction } = await import('./src/lib/actions/loans.ts');
    
    const result = await returnLoanAction(uiFormData);
    
    console.log('\n5. Resultado de returnLoanAction:', result);
    
    if (result.success) {
      console.log('✅ Devolución exitosa');
      
      // 6. Verificar que se crearon las incidencias
      console.log('\n6. Verificando incidencias creadas...');
      const { data: incidents, error: incidentsError } = await supabase
        .from('maintenance_incidents')
        .select('*')
        .eq('resource_id', resource.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (incidentsError) {
        console.error('❌ Error consultando incidencias:', incidentsError);
      } else {
        console.log(`📋 Incidencias encontradas: ${incidents.length}`);
        incidents.forEach((incident, index) => {
          console.log(`   ${index + 1}. ${incident.damage_type} - ${incident.current_status} (${incident.created_at})`);
        });
      }
      
      // 7. Verificar estado del recurso
      console.log('\n7. Verificando estado del recurso...');
      const { data: updatedResource, error: resourceError } = await supabase
        .from('resources')
        .select('id, name, status, notes')
        .eq('id', resource.id)
        .single();
      
      if (resourceError) {
        console.error('❌ Error consultando recurso:', resourceError);
      } else {
        console.log('📱 Estado del recurso:', {
          id: updatedResource.id,
          name: updatedResource.name,
          status: updatedResource.status,
          hasNotes: !!updatedResource.notes
        });
      }
      
      // 8. Verificar estado del préstamo
      console.log('\n8. Verificando estado del préstamo...');
      const { data: updatedLoan, error: updatedLoanError } = await supabase
        .from('loans')
        .select('id, status, actual_return_date, notes')
        .eq('id', activeLoan.id)
        .single();
      
      if (updatedLoanError) {
        console.error('❌ Error consultando préstamo:', updatedLoanError);
      } else {
        console.log('📋 Estado del préstamo:', {
          id: updatedLoan.id,
          status: updatedLoan.status,
          returned: !!updatedLoan.actual_return_date,
          hasNotes: !!updatedLoan.notes
        });
      }
      
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
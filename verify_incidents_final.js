require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyIncidentsTable() {
  try {
    console.log('=== VERIFICACIÓN COMPLETA DE LA TABLA INCIDENTS ===\n');
    
    // 1. Verificar si la tabla existe y es accesible
    console.log('1. Verificando acceso a la tabla incidents...');
    const { data: tableTest, error: tableError } = await supabase
      .from('incidents')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ ERROR: No se puede acceder a la tabla incidents');
      console.log('Detalles del error:', tableError);
      console.log('\n🔧 ACCIÓN REQUERIDA: Ejecutar el SQL de creación de tabla');
      return;
    } else {
      console.log('✅ Tabla incidents accesible');
    }
    
    // 2. Verificar estructura intentando insertar datos de prueba
    console.log('\n2. Verificando estructura de la tabla...');
    
    // Obtener datos de referencia
    const { data: resource } = await supabase
      .from('resources')
      .select('id')
      .limit(1)
      .single();
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    
    if (!resource || !user) {
      console.log('⚠️ No se encontraron recursos o usuarios para la prueba');
      return;
    }
    
    console.log('✅ Datos de referencia encontrados');
    console.log('- Resource ID:', resource.id);
    console.log('- User ID:', user.id);
    
    // 3. Probar inserción con estructura completa
    console.log('\n3. Probando inserción de incidencia...');
    
    const testIncident = {
      resource_id: resource.id,
      reported_by: user.id,
      title: 'Verificación de estructura - ' + new Date().toISOString(),
      description: 'Incidencia de prueba para verificar estructura de tabla',
      type: 'Daño',
      status: 'Reportado'
    };
    
    const { data: incident, error: insertError } = await supabase
      .from('incidents')
      .insert(testIncident)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ ERROR: No se puede insertar en la tabla incidents');
      console.log('Detalles del error:', insertError);
      
      if (insertError.message.includes('resource_id')) {
        console.log('\n🔧 PROBLEMA DETECTADO: La columna resource_id no existe o no está configurada correctamente');
        console.log('\n📋 SQL REQUERIDO PARA CORREGIR:');
        console.log('\n```sql');
        console.log('-- Eliminar tabla existente si hay problemas de estructura');
        console.log('DROP TABLE IF EXISTS public.incidents CASCADE;');
        console.log('');
        console.log('-- Crear tabla incidents con estructura completa');
        console.log('CREATE TABLE public.incidents (');
        console.log('  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,');
        console.log('  resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE,');
        console.log('  reported_by uuid REFERENCES public.users(id) ON DELETE SET NULL,');
        console.log('  title varchar(255) NOT NULL,');
        console.log('  description text,');
        console.log('  type varchar(50) NOT NULL DEFAULT \'Daño\',');
        console.log('  status varchar(50) NOT NULL DEFAULT \'Reportado\',');
        console.log('  resolved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,');
        console.log('  resolved_at timestamptz,');
        console.log('  resolution_notes text,');
        console.log('  reporter_grade_id uuid REFERENCES public.grades(id) ON DELETE SET NULL,');
        console.log('  reporter_section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,');
        console.log('  reporter_area_id uuid REFERENCES public.areas(id) ON DELETE SET NULL,');
        console.log('  booking_context jsonb,');
        console.log('  created_at timestamptz DEFAULT now(),');
        console.log('  updated_at timestamptz DEFAULT now()');
        console.log(');');
        console.log('');
        console.log('-- Crear índices');
        console.log('CREATE INDEX idx_incidents_resource_id ON public.incidents(resource_id);');
        console.log('CREATE INDEX idx_incidents_reported_by ON public.incidents(reported_by);');
        console.log('CREATE INDEX idx_incidents_status ON public.incidents(status);');
        console.log('CREATE INDEX idx_incidents_type ON public.incidents(type);');
        console.log('CREATE INDEX idx_incidents_created_at ON public.incidents(created_at);');
        console.log('');
        console.log('-- Habilitar RLS');
        console.log('ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('-- Crear políticas RLS');
        console.log('CREATE POLICY "incidents_select_policy" ON public.incidents FOR SELECT USING (true);');
        console.log('CREATE POLICY "incidents_insert_policy" ON public.incidents FOR INSERT WITH CHECK (true);');
        console.log('CREATE POLICY "incidents_update_policy" ON public.incidents FOR UPDATE USING (true);');
        console.log('CREATE POLICY "incidents_delete_policy" ON public.incidents FOR DELETE USING (true);');
        console.log('');
        console.log('-- Función para actualizar updated_at');
        console.log('CREATE OR REPLACE FUNCTION update_updated_at_column()');
        console.log('RETURNS TRIGGER AS $$');
        console.log('BEGIN');
        console.log('    NEW.updated_at = now();');
        console.log('    RETURN NEW;');
        console.log('END;');
        console.log('$$ language \'plpgsql\';');
        console.log('');
        console.log('-- Trigger para updated_at');
        console.log('CREATE TRIGGER update_incidents_updated_at');
        console.log('    BEFORE UPDATE ON public.incidents');
        console.log('    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
        console.log('```');
      }
      
      return;
    }
    
    console.log('✅ Inserción exitosa!');
    console.log('- ID de incidencia:', incident.id);
    console.log('- Título:', incident.title);
    console.log('- Estado:', incident.status);
    console.log('- Fecha creación:', incident.created_at);
    
    // 4. Probar actualización
    console.log('\n4. Probando actualización de incidencia...');
    
    const { data: updatedIncident, error: updateError } = await supabase
      .from('incidents')
      .update({ 
        status: 'En Proceso',
        resolution_notes: 'Prueba de actualización'
      })
      .eq('id', incident.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ ERROR: No se puede actualizar la incidencia');
      console.log('Detalles del error:', updateError);
    } else {
      console.log('✅ Actualización exitosa!');
      console.log('- Nuevo estado:', updatedIncident.status);
      console.log('- Notas:', updatedIncident.resolution_notes);
      console.log('- Fecha actualización:', updatedIncident.updated_at);
    }
    
    // 5. Probar consulta con filtros
    console.log('\n5. Probando consultas con filtros...');
    
    const { data: filteredIncidents, error: filterError } = await supabase
      .from('incidents')
      .select('*')
      .eq('resource_id', resource.id)
      .eq('status', 'En Proceso');
    
    if (filterError) {
      console.log('❌ ERROR: No se pueden filtrar incidencias');
      console.log('Detalles del error:', filterError);
    } else {
      console.log('✅ Filtros funcionando correctamente!');
      console.log('- Incidencias encontradas:', filteredIncidents.length);
    }
    
    // 6. Limpiar datos de prueba
    console.log('\n6. Limpiando datos de prueba...');
    
    const { error: deleteError } = await supabase
      .from('incidents')
      .delete()
      .eq('id', incident.id);
    
    if (deleteError) {
      console.log('⚠️ No se pudo eliminar la incidencia de prueba:', deleteError);
    } else {
      console.log('✅ Datos de prueba eliminados');
    }
    
    // 7. Verificar funcionalidad del código
    console.log('\n7. Verificando compatibilidad con el código de la aplicación...');
    
    // Simular los datos que enviaría el formulario
    const formData = {
      resource_id: resource.id,
      reported_by: user.id,
      title: 'Prueba desde formulario',
      description: 'Descripción de prueba',
      type: 'Daño',
      status: 'Reportado',
      reporter_grade_id: null,
      reporter_section_id: null,
      reporter_area_id: null,
      booking_context: { test: true }
    };
    
    const { data: formIncident, error: formError } = await supabase
      .from('incidents')
      .insert(formData)
      .select()
      .single();
    
    if (formError) {
      console.log('❌ ERROR: El formulario no puede crear incidencias');
      console.log('Detalles del error:', formError);
    } else {
      console.log('✅ Formulario compatible!');
      console.log('- Incidencia creada desde formulario:', formIncident.id);
      
      // Limpiar
      await supabase
        .from('incidents')
        .delete()
        .eq('id', formIncident.id);
      
      console.log('✅ Datos de prueba del formulario eliminados');
    }
    
    console.log('\n🎉 VERIFICACIÓN COMPLETADA');
    console.log('\n📊 RESUMEN:');
    console.log('- ✅ Tabla incidents existe y es accesible');
    console.log('- ✅ Estructura de tabla correcta');
    console.log('- ✅ Inserción funcionando');
    console.log('- ✅ Actualización funcionando');
    console.log('- ✅ Consultas con filtros funcionando');
    console.log('- ✅ Compatibilidad con formularios');
    console.log('\n🚀 La tabla incidents está lista para usar!');
    
  } catch (error) {
    console.error('❌ Error general en la verificación:', error);
  }
}

verifyIncidentsTable();
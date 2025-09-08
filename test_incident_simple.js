require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testIncidentCreation() {
  try {
    console.log('=== PROBANDO CREACIÓN DE INCIDENCIA ===');
    
    // Obtener un recurso existente
    const { data: resource } = await supabase
      .from('resources')
      .select('id')
      .limit(1)
      .single();
    
    if (!resource) {
      console.error('❌ No se encontró ningún recurso para la prueba');
      return;
    }
    
    console.log('✅ Recurso encontrado:', resource.id);
    
    // Obtener un usuario existente
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    
    if (!user) {
      console.error('❌ No se encontró ningún usuario para la prueba');
      return;
    }
    
    console.log('✅ Usuario encontrado:', user.id);
    
    // Crear incidencia de prueba
    const incidentData = {
      resource_id: resource.id,
      title: 'Prueba de incidencia - ' + new Date().toISOString(),
      description: 'Esta es una prueba para verificar que las incidencias se crean correctamente',
      type: 'Daño',
      reported_by: user.id,
      status: 'Reportado',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Datos de la incidencia:', incidentData);
    
    const { data: incident, error } = await supabase
      .from('incidents')
      .insert(incidentData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error al crear incidencia:', error);
    } else {
      console.log('✅ Incidencia creada exitosamente:');
      console.log('ID:', incident.id);
      console.log('Título:', incident.title);
      console.log('Estado:', incident.status);
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testIncidentCreation();
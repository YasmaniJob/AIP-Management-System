require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugIncidentsTable() {
  try {
    console.log('=== DEBUGGING INCIDENTS TABLE ===');
    
    console.log('\n1. Verificando si la tabla incidents existe...');
    
    // Intentar obtener la estructura de la tabla
    const { data: tableInfo, error: tableError } = await supabase
      .from('incidents')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error al acceder a la tabla incidents:', tableError);
      return;
    }
    
    console.log('✅ La tabla incidents existe');
    
    console.log('\n2. Verificando registros existentes...');
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('*')
      .limit(5);
    
    if (incidentsError) {
      console.error('❌ Error al obtener incidencias:', incidentsError);
    } else {
      console.log(`📊 Total de incidencias encontradas: ${incidents.length}`);
      if (incidents.length > 0) {
        console.log('Ejemplo de incidencia:', incidents[0]);
      }
    }
    
    console.log('\n3. Probando inserción de incidencia...');
    
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
    
    const testIncident = {
      resource_id: resource.id,
      title: 'Prueba de incidencia - ' + new Date().toISOString(),
      description: 'Esta es una prueba para verificar que las incidencias se crean correctamente',
      priority: 'medium',
      type: 'Daño',
      reported_by: user.id,
      status: 'Reportado',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newIncident, error: insertError } = await supabase
      .from('incidents')
      .insert(testIncident)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error al insertar incidencia:', insertError);
    } else {
      console.log('✅ Incidencia creada exitosamente:', newIncident.id);
      
      // Limpiar la incidencia de prueba
      await supabase
        .from('incidents')
        .delete()
        .eq('id', newIncident.id);
      
      console.log('🧹 Incidencia de prueba eliminada');
    }
    
    console.log('\n4. Verificando tabla equipment_history...');
    const { data: historyData, error: historyError } = await supabase
      .from('equipment_history')
      .select('*')
      .limit(3);
    
    if (historyError) {
      console.error('❌ Error al acceder a equipment_history:', historyError);
    } else {
      console.log(`📊 Registros en equipment_history: ${historyData.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugIncidentsTable();
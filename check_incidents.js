// Script para verificar datos en la tabla incidents
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rnqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWpxanFqcWpxanFqcWpxaiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0NTU4NzA5LCJleHAiOjIwNTAxMzQ3MDl9.kEf4EyVgLJtJtJtJtJtJtJtJtJtJtJtJtJtJtJtJtJtJ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncidents() {
  try {
    console.log('Verificando datos en la tabla incidents...');
    
    // Contar total de incidencias
    const { count: totalCount, error: countError } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error contando incidencias:', countError);
      return;
    }
    
    console.log(`Total de incidencias en la tabla: ${totalCount}`);
    
    // Obtener algunas incidencias de ejemplo
    const { data: incidents, error: fetchError } = await supabase
      .from('incidents')
      .select('*')
      .limit(5);
    
    if (fetchError) {
      console.error('Error obteniendo incidencias:', fetchError);
      return;
    }
    
    console.log('Incidencias encontradas:');
    incidents.forEach((incident, index) => {
      console.log(`${index + 1}. ID: ${incident.id}, Título: ${incident.title}, Estado: ${incident.status}, Fecha: ${incident.created_at}`);
    });
    
    // Verificar también la tabla maintenance_tracking
    const { count: maintenanceCount, error: maintenanceCountError } = await supabase
      .from('maintenance_tracking')
      .select('*', { count: 'exact', head: true });
    
    if (maintenanceCountError) {
      console.error('Error contando registros de mantenimiento:', maintenanceCountError);
      return;
    }
    
    console.log(`\nTotal de registros de mantenimiento: ${maintenanceCount}`);
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

checkIncidents();
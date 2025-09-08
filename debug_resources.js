// Script para verificar los datos de la tabla resources
const { createClient } = require('@supabase/supabase-js');

// Usar las credenciales reales del archivo .env
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugResources() {
  console.log('=== VERIFICANDO DATOS DE LA TABLA RESOURCES ===');
  
  try {
    // Obtener todos los recursos
    const { data: resources, error } = await supabase
      .from('resources')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('Error al obtener recursos:', error);
      return;
    }
    
    console.log('\nRecursos encontrados:', resources.length);
    
    if (resources.length > 0) {
      console.log('\nPrimeros recursos:');
      resources.forEach((resource, index) => {
        console.log(`${index + 1}. ID: ${resource.id} (tipo: ${typeof resource.id})`);
        console.log(`   Number: ${resource.number}`);
        console.log(`   Status: ${resource.status}`);
        console.log(`   Category ID: ${resource.category_id}`);
        console.log('---');
      });
    }
    
    // Verificar recursos que requieren mantenimiento
    console.log('\n=== RECURSOS QUE REQUIEREN MANTENIMIENTO ===');
    const { data: maintenanceResources, error: maintenanceError } = await supabase
      .from('resources')
      .select(`
        *,
        category:categories(id, name, type)
      `)
      .in('status', ['Dañado', 'En Mantenimiento', 'En Reparación']);
    
    if (maintenanceError) {
      console.error('Error al obtener recursos de mantenimiento:', maintenanceError);
      return;
    }
    
    console.log('\nRecursos que requieren mantenimiento:', maintenanceResources.length);
    
    if (maintenanceResources.length > 0) {
      maintenanceResources.forEach((resource, index) => {
        console.log(`${index + 1}. ID: ${resource.id} (tipo: ${typeof resource.id})`);
        console.log(`   Number: ${resource.number}`);
        console.log(`   Status: ${resource.status}`);
        console.log(`   Category: ${resource.category?.name}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

debugResources();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDamagedResources() {
  try {
    console.log('Verificando recursos con estado "Dañado"...');
    
    const { data: damagedResources, error } = await supabase
      .from('resources')
      .select('id, number, brand, model, status, category_id')
      .eq('status', 'Dañado');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`\nRecursos con estado 'Dañado': ${damagedResources?.length || 0}`);
    
    if (damagedResources && damagedResources.length > 0) {
      damagedResources.forEach(resource => {
        const resourceName = `${resource.brand || ''} ${resource.model || ''}`.trim() || 'Sin nombre';
        console.log(`- ${resource.number}: ${resourceName} (${resource.status})`);
      });
    } else {
      console.log('No se encontraron recursos con estado "Dañado"');
    }
    
    // También verificar todos los estados únicos
    console.log('\nVerificando todos los estados únicos de recursos...');
    const { data: allResources } = await supabase
      .from('resources')
      .select('status');
    
    if (allResources) {
      const uniqueStatuses = [...new Set(allResources.map(r => r.status))];
      console.log('Estados únicos encontrados:', uniqueStatuses);
      
      // Contar por estado
      const statusCounts = {};
      allResources.forEach(r => {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      });
      
      console.log('\nConteo por estado:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`- ${status}: ${count}`);
      });
    }
    
  } catch (error) {
    console.error('Error en la verificación:', error);
  }
}

checkDamagedResources();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDamagedResourceCategory() {
  try {
    console.log('Verificando el recurso dañado y su categoría...');
    
    // Obtener el recurso dañado con su categoría
    const { data: damagedResource, error } = await supabase
      .from('resources')
      .select(`
        id, 
        number, 
        brand, 
        model, 
        status, 
        category_id,
        category:categories(id, name, type)
      `)
      .eq('status', 'Dañado')
      .single();
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (damagedResource) {
      console.log('\n=== RECURSO DAÑADO ENCONTRADO ===');
      console.log(`ID: ${damagedResource.id}`);
      console.log(`Número: ${damagedResource.number}`);
      console.log(`Marca: ${damagedResource.brand}`);
      console.log(`Modelo: ${damagedResource.model || 'N/A'}`);
      console.log(`Estado: ${damagedResource.status}`);
      console.log(`Categoría ID: ${damagedResource.category_id}`);
      console.log(`Categoría: ${damagedResource.category?.name || 'N/A'}`);
      console.log(`Tipo de categoría: ${damagedResource.category?.type || 'N/A'}`);
      
      // Verificar si hay otros recursos en la misma categoría
      const { data: categoryResources } = await supabase
        .from('resources')
        .select('id, number, brand, model, status')
        .eq('category_id', damagedResource.category_id);
      
      console.log('\n=== OTROS RECURSOS EN LA MISMA CATEGORÍA ===');
      console.log(`Total de recursos en la categoría: ${categoryResources?.length || 0}`);
      
      if (categoryResources && categoryResources.length > 0) {
        const statusCounts = {};
        categoryResources.forEach(r => {
          statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
        });
        
        console.log('\nConteo por estado en esta categoría:');
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`- ${status}: ${count}`);
        });
        
        console.log('\nPrimeros 5 recursos de la categoría:');
        categoryResources.slice(0, 5).forEach(r => {
          const resourceName = `${r.brand || ''} ${r.model || ''}`.trim() || 'Sin nombre';
          console.log(`- ${r.number}: ${resourceName} (${r.status})`);
        });
      }
      
    } else {
      console.log('No se encontró el recurso dañado');
    }
    
  } catch (error) {
    console.error('Error en la verificación:', error);
  }
}

checkDamagedResourceCategory();
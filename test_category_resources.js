const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCategoryResources() {
  try {
    const categoryId = 'f1cc89c9-f7c6-4dcd-b49c-7820b71f75fb'; // Tablets
    
    console.log('Probando getResourcesByCategoryId para Tablets...');
    console.log(`Categoría ID: ${categoryId}`);
    
    // Simular la misma consulta que hace getResourcesByCategoryId
    const { data: resources, error } = await supabase
      .from('resources')
      .select(`
        *,
        category:categories ( name )
      `)
      .eq('category_id', categoryId)
      .order('number', { ascending: true });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`\n=== RECURSOS ENCONTRADOS: ${resources?.length || 0} ===`);
    
    if (resources && resources.length > 0) {
      // Contar por estado
      const statusCounts = {
        'Disponible': 0,
        'En Préstamo': 0,
        'Dañado': 0,
        'En mantenimiento': 0,
        'En Mantenimiento': 0,
        'En Reparación': 0,
        'Parcialmente Reparado': 0,
        'Esperando Repuestos': 0,
        'Reparado - Pendiente Prueba': 0
      };
      
      resources.forEach(resource => {
        if (statusCounts.hasOwnProperty(resource.status)) {
          statusCounts[resource.status]++;
        } else {
          statusCounts[resource.status] = (statusCounts[resource.status] || 0) + 1;
        }
      });
      
      console.log('\nConteo por estado:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        if (count > 0) {
          console.log(`- ${status}: ${count}`);
        }
      });
      
      console.log('\nTodos los recursos:');
      resources.forEach(resource => {
        const resourceName = `${resource.brand || ''} ${resource.model || ''}`.trim() || 'Sin nombre';
        console.log(`- ${resource.number}: ${resourceName} (${resource.status}) - ID: ${resource.id}`);
      });
      
      // Verificar específicamente el recurso dañado
      const damagedResource = resources.find(r => r.status === 'Dañado');
      if (damagedResource) {
        console.log('\n✅ RECURSO DAÑADO ENCONTRADO EN LA CONSULTA:');
        console.log(`- Número: ${damagedResource.number}`);
        console.log(`- Marca: ${damagedResource.brand}`);
        console.log(`- Estado: ${damagedResource.status}`);
        console.log(`- ID: ${damagedResource.id}`);
      } else {
        console.log('\n❌ RECURSO DAÑADO NO ENCONTRADO EN LA CONSULTA');
      }
      
      // Simular el filtrado que hace el componente
      console.log('\n=== SIMULANDO FILTROS DEL COMPONENTE ===');
      
      // Filtro "Disponible"
      const disponibles = resources.filter(r => r.status === 'Disponible');
      console.log(`Filtro 'Disponible': ${disponibles.length} recursos`);
      
      // Filtro "Dañado"
      const dañados = resources.filter(r => r.status === 'Dañado');
      console.log(`Filtro 'Dañado': ${dañados.length} recursos`);
      
      // Filtro "En mantenimiento" (incluye múltiples estados)
      const maintenanceStates = [
        'En mantenimiento',
        'En Reparación', 
        'Parcialmente Reparado',
        'Esperando Repuestos',
        'Reparado - Pendiente Prueba'
      ];
      const enMantenimiento = resources.filter(r => maintenanceStates.includes(r.status));
      console.log(`Filtro 'En mantenimiento': ${enMantenimiento.length} recursos`);
      
      // Verificar si hay recursos con estado "En Mantenimiento" (con mayúscula)
      const enMantenimientoMayuscula = resources.filter(r => r.status === 'En Mantenimiento');
      console.log(`Recursos con estado 'En Mantenimiento' (mayúscula): ${enMantenimientoMayuscula.length}`);
      
    } else {
      console.log('No se encontraron recursos en esta categoría');
    }
    
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

testCategoryResources();
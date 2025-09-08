const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqjqfqhqhqhqhqhqhqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZnFocWhxaHFocWhxaHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzE2NzQsImV4cCI6MjA1MTI0NzY3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllFilters() {
  try {
    console.log('🔍 Probando todos los filtros de inventario...');
    
    // Obtener todos los recursos de la categoría Tablets
    const categoryId = 'f1cc89c9-f7c6-4dcd-b49c-7820b71f75fb';
    const { data: resources, error } = await supabase
      .from('resources')
      .select('*')
      .eq('category_id', categoryId);
    
    if (error) {
      console.error('❌ Error al obtener recursos:', error);
      return;
    }
    
    console.log(`\n📊 Total de recursos en la categoría: ${resources.length}`);
    
    // Contar por estado
    const statusCounts = {};
    resources.forEach(resource => {
      statusCounts[resource.status] = (statusCounts[resource.status] || 0) + 1;
    });
    
    console.log('\n📈 Conteo por estado:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Probar filtro "Todos"
    const allResources = resources;
    console.log(`\n🔵 Filtro "Todos": ${allResources.length} recursos`);
    
    // Probar filtro "Disponible"
    const availableResources = resources.filter(r => r.status === 'Disponible');
    console.log(`🟢 Filtro "Disponible": ${availableResources.length} recursos`);
    
    // Probar filtro "Dañado"
    const damagedResources = resources.filter(r => r.status === 'Dañado');
    console.log(`🔴 Filtro "Dañado": ${damagedResources.length} recursos`);
    if (damagedResources.length > 0) {
      console.log('  Recursos dañados encontrados:');
      damagedResources.forEach(r => {
        console.log(`    - ${r.brand} ${r.model} (ID: ${r.id})`);
      });
    }
    
    // Probar filtro "En mantenimiento" (con ambas variantes)
    const maintenanceStates = [
      'En mantenimiento',
      'En Mantenimiento', // Con mayúscula
      'En Reparación', 
      'Parcialmente Reparado',
      'Esperando Repuestos',
      'Reparado - Pendiente Prueba'
    ];
    const maintenanceResources = resources.filter(r => maintenanceStates.includes(r.status));
    console.log(`🟡 Filtro "En mantenimiento": ${maintenanceResources.length} recursos`);
    if (maintenanceResources.length > 0) {
      console.log('  Estados de mantenimiento encontrados:');
      const maintenanceStatusCounts = {};
      maintenanceResources.forEach(r => {
        maintenanceStatusCounts[r.status] = (maintenanceStatusCounts[r.status] || 0) + 1;
      });
      Object.entries(maintenanceStatusCounts).forEach(([status, count]) => {
        console.log(`    - ${status}: ${count}`);
      });
    }
    
    // Probar filtro "Prestado"
    const loanedResources = resources.filter(r => r.status === 'Prestado');
    console.log(`🟠 Filtro "Prestado": ${loanedResources.length} recursos`);
    
    console.log('\n✅ Prueba de filtros completada');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

testAllFilters();
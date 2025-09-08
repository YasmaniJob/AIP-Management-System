require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkResourcesStructure() {
  try {
    console.log('=== VERIFICANDO ESTRUCTURA DE TABLA RESOURCES ===\n');
    
    // Obtener algunos recursos para ver su estructura
    const { data: resources, error } = await supabase
      .from('resources')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log('❌ Error al obtener recursos:', error);
      return;
    }
    
    console.log('✅ Recursos encontrados:', resources.length);
    
    if (resources.length > 0) {
      console.log('\n📋 Estructura del primer recurso:');
      const firstResource = resources[0];
      Object.keys(firstResource).forEach(key => {
        console.log(`- ${key}: ${firstResource[key]} (${typeof firstResource[key]})`);
      });
      
      console.log('\n📋 Todos los recursos:');
      resources.forEach((resource, index) => {
        console.log(`${index + 1}. ID: ${resource.id}`);
        // Mostrar campos que podrían ser el nombre
        if (resource.model) console.log(`   Modelo: ${resource.model}`);
        if (resource.brand) console.log(`   Marca: ${resource.brand}`);
        if (resource.serial_number) console.log(`   Serie: ${resource.serial_number}`);
        if (resource.description) console.log(`   Descripción: ${resource.description}`);
        if (resource.category_id) console.log(`   Categoría ID: ${resource.category_id}`);
        console.log('');
      });
    }
    
    // Verificar categorías para obtener nombres
    console.log('\n=== VERIFICANDO CATEGORÍAS ===');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');
    
    if (catError) {
      console.log('❌ Error al obtener categorías:', catError);
    } else {
      console.log('✅ Categorías encontradas:', categories.length);
      categories.forEach(cat => {
        console.log(`- ${cat.id}: ${cat.name}`);
      });
    }
    
    // Hacer un join para obtener recursos con categorías
    console.log('\n=== RECURSOS CON CATEGORÍAS ===');
    const { data: resourcesWithCategories, error: joinError } = await supabase
      .from('resources')
      .select(`
        *,
        category:categories(id, name)
      `)
      .limit(3);
    
    if (joinError) {
      console.log('❌ Error al hacer join:', joinError);
    } else {
      console.log('✅ Join exitoso:');
      resourcesWithCategories.forEach((resource, index) => {
        console.log(`${index + 1}. ID: ${resource.id}`);
        console.log(`   Categoría: ${resource.category?.name || 'Sin categoría'}`);
        console.log(`   Modelo: ${resource.model || 'N/A'}`);
        console.log(`   Marca: ${resource.brand || 'N/A'}`);
        console.log(`   Estado: ${resource.status || 'N/A'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkResourcesStructure();
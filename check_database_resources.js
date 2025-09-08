const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseResources() {
  console.log('🔍 Checking database resources...');
  
  try {
    // Check categories first
    console.log('\n=== CATEGORIES ===');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return;
    }
    
    console.log(`Found ${categories.length} categories:`);
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id}, Type: ${cat.type})`);
    });
    
    // Check resources
    console.log('\n=== RESOURCES ===');
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select(`
        *,
        category:categories(name, type)
      `)
      .order('number', { ascending: true });
    
    if (resourcesError) {
      console.error('Error fetching resources:', resourcesError);
      return;
    }
    
    console.log(`Found ${resources.length} total resources:`);
    
    if (resources.length === 0) {
      console.log('❌ NO RESOURCES FOUND IN DATABASE!');
      console.log('This explains why the inventory shows 0/6 available.');
      return;
    }
    
    // Group resources by category
    const resourcesByCategory = {};
    resources.forEach(resource => {
      const categoryName = resource.category?.name || 'Unknown';
      if (!resourcesByCategory[categoryName]) {
        resourcesByCategory[categoryName] = [];
      }
      resourcesByCategory[categoryName].push(resource);
    });
    
    console.log('\n=== RESOURCES BY CATEGORY ===');
    Object.entries(resourcesByCategory).forEach(([categoryName, categoryResources]) => {
      console.log(`\n📁 ${categoryName}:`);
      console.log(`   Total: ${categoryResources.length}`);
      
      const statusCounts = {};
      categoryResources.forEach(resource => {
        const status = resource.status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log('   Status breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}`);
      });
      
      // Show first few resources as examples
      console.log('   Examples:');
      categoryResources.slice(0, 3).forEach((resource, index) => {
        console.log(`     ${index + 1}. #${resource.number} - ${resource.brand} ${resource.model} (${resource.status})`);
      });
    });
    
    // Check if there are any available resources
    const availableResources = resources.filter(r => r.status === 'Disponible');
    console.log(`\n=== AVAILABILITY SUMMARY ===`);
    console.log(`Total resources: ${resources.length}`);
    console.log(`Available resources: ${availableResources.length}`);
    console.log(`Percentage available: ${((availableResources.length / resources.length) * 100).toFixed(1)}%`);
    
    if (availableResources.length === 0) {
      console.log('\n⚠️  NO AVAILABLE RESOURCES!');
      console.log('All resources have non-available status.');
      
      // Show status distribution
      const allStatuses = {};
      resources.forEach(resource => {
        const status = resource.status || 'Unknown';
        allStatuses[status] = (allStatuses[status] || 0) + 1;
      });
      
      console.log('\nStatus distribution:');
      Object.entries(allStatuses).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    }
    
    // Test the same query that the app uses
    console.log('\n=== TESTING APP QUERY ===');
    for (const category of categories) {
      const { data: categoryResources, error: categoryError } = await supabase
        .from('resources')
        .select('id, status')
        .eq('category_id', category.id);
      
      if (categoryError) {
        console.error(`Error fetching resources for ${category.name}:`, categoryError);
        continue;
      }
      
      const availableCount = categoryResources.filter(r => r.status === 'Disponible').length;
      console.log(`${category.name}: ${availableCount}/${categoryResources.length} available`);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkDatabaseResources();
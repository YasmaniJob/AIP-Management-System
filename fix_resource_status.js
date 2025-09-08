const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixResourceStatus() {
  console.log('🔧 Fixing resource status to make some available...');
  
  try {
    // Get some resources from each category to make available
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select(`
        id,
        number,
        brand,
        model,
        status,
        category:categories(name, type)
      `)
      .eq('status', 'En Mantenimiento')
      .order('number', { ascending: true });
    
    if (resourcesError) {
      console.error('Error fetching resources:', resourcesError);
      return;
    }
    
    console.log(`Found ${resources.length} resources in maintenance`);
    
    // Group by category and select some to make available
    const resourcesByCategory = {};
    resources.forEach(resource => {
      const categoryName = resource.category?.name || 'Unknown';
      if (!resourcesByCategory[categoryName]) {
        resourcesByCategory[categoryName] = [];
      }
      resourcesByCategory[categoryName].push(resource);
    });
    
    const resourcesToUpdate = [];
    
    // For each category, make half of the resources available (at least 2)
    Object.entries(resourcesByCategory).forEach(([categoryName, categoryResources]) => {
      const countToMakeAvailable = Math.max(2, Math.floor(categoryResources.length / 2));
      const selectedResources = categoryResources.slice(0, countToMakeAvailable);
      
      console.log(`\n📁 ${categoryName}: Making ${selectedResources.length}/${categoryResources.length} available`);
      selectedResources.forEach(resource => {
        console.log(`   - #${resource.number} ${resource.brand} ${resource.model}`);
        resourcesToUpdate.push(resource.id);
      });
    });
    
    if (resourcesToUpdate.length === 0) {
      console.log('No resources to update');
      return;
    }
    
    console.log(`\n🔄 Updating ${resourcesToUpdate.length} resources to 'Disponible' status...`);
    
    // Update resources to available status
    const { data: updatedResources, error: updateError } = await supabase
      .from('resources')
      .update({ 
        status: 'Disponible',
        notes: null // Clear any maintenance notes
      })
      .in('id', resourcesToUpdate)
      .select(`
        id,
        number,
        brand,
        model,
        status,
        category:categories(name)
      `);
    
    if (updateError) {
      console.error('Error updating resources:', updateError);
      return;
    }
    
    console.log('\n✅ Successfully updated resources:');
    updatedResources.forEach(resource => {
      console.log(`   ✓ #${resource.number} ${resource.brand} ${resource.model} (${resource.category?.name}) - ${resource.status}`);
    });
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const { data: verification, error: verifyError } = await supabase
      .from('resources')
      .select(`
        status,
        category:categories(name)
      `);
    
    if (verifyError) {
      console.error('Error verifying changes:', verifyError);
      return;
    }
    
    const statusByCategory = {};
    verification.forEach(resource => {
      const categoryName = resource.category?.name || 'Unknown';
      if (!statusByCategory[categoryName]) {
        statusByCategory[categoryName] = { total: 0, available: 0 };
      }
      statusByCategory[categoryName].total++;
      if (resource.status === 'Disponible') {
        statusByCategory[categoryName].available++;
      }
    });
    
    console.log('\n=== FINAL STATUS BY CATEGORY ===');
    Object.entries(statusByCategory).forEach(([categoryName, stats]) => {
      console.log(`${categoryName}: ${stats.available}/${stats.total} available`);
    });
    
    console.log('\n🎉 Resources are now available for inventory display!');
    console.log('The inventory page should now show available resources.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fix
fixResourceStatus();
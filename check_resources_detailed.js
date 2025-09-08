require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkResourcesDetailed() {
  try {
    console.log('=== VERIFICANDO RECURSOS EN DETALLE ===');
    
    console.log('\n1. Todos los recursos (sin límite)...');
    const { data: allResources, error: allError } = await supabase
      .from('resources')
      .select('*');
    
    if (allError) {
      console.error('❌ Error al obtener recursos:', allError);
      return;
    }
    
    console.log(`📊 Total recursos en la base de datos: ${allResources?.length || 0}`);
    
    if (allResources && allResources.length > 0) {
      console.log('\n2. Recursos por estado:');
      const statusCount = {};
      allResources.forEach(resource => {
        statusCount[resource.status] = (statusCount[resource.status] || 0) + 1;
      });
      
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
      
      console.log('\n3. Primeros 10 recursos:');
      allResources.slice(0, 10).forEach(resource => {
        console.log(`   - ${resource.name} (${resource.status}) - ID: ${resource.id}`);
      });
    }
    
    console.log('\n4. Verificando estructura de la tabla resources...');
    const { data: sampleResource, error: sampleError } = await supabase
      .from('resources')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleError) {
      console.log('❌ No se pudo obtener un recurso de muestra:', sampleError.message);
    } else if (sampleResource) {
      console.log('✅ Estructura de recurso:');
      console.log(JSON.stringify(sampleResource, null, 2));
    }
    
    console.log('\n5. Verificando relaciones loan_resources...');
    const { data: loanResources } = await supabase
      .from('loan_resources')
      .select('*')
      .limit(5);
    
    console.log(`📊 Relaciones loan_resources: ${loanResources?.length || 0}`);
    if (loanResources && loanResources.length > 0) {
      loanResources.forEach(lr => {
        console.log(`   - Préstamo: ${lr.loan_id}, Recurso: ${lr.resource_id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkResourcesDetailed();
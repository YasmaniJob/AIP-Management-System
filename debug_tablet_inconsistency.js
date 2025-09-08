const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugTabletInconsistency() {
  console.log('🔍 DEPURANDO INCONSISTENCIA DE TABLET');
  
  // 1. Buscar todos los recursos que podrían ser tablets
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
    .ilike('category.name', '%tablet%');
    
  if (resourcesError) {
    console.error('Error obteniendo recursos:', resourcesError);
    return;
  }
  
  console.log('\n📱 RECURSOS TIPO TABLET:');
  resources?.forEach(resource => {
    console.log(`- ID: ${resource.id}`);
    console.log(`  Número: ${resource.number}`);
    console.log(`  Marca: ${resource.brand}`);
    console.log(`  Modelo: ${resource.model}`);
    console.log(`  Estado: ${resource.status}`);
    console.log(`  Categoría: ${resource.category?.name}`);
    console.log('  ---');
  });
  
  // 2. Buscar en maintenance_resource_summary
  const { data: summaries, error: summariesError } = await supabase
    .from('maintenance_resource_summary')
    .select(`
      *,
      resource:resources(
        id,
        number,
        brand,
        model,
        status,
        category:categories(name, type)
      )
    `);
    
  if (summariesError) {
    console.error('Error obteniendo resúmenes:', summariesError);
    return;
  }
  
  console.log('\n📊 RESÚMENES DE MANTENIMIENTO:');
  summaries?.forEach(summary => {
    if (summary.resource?.category?.name?.toLowerCase().includes('tablet') || 
        (summary.resource?.number && summary.resource.number.toString().includes('4'))) {
      console.log(`- Resource ID: ${summary.resource_id}`);
      console.log(`  Número: ${summary.resource?.number}`);
      console.log(`  Categoría: ${summary.resource?.category?.name}`);
      console.log(`  Total incidencias: ${summary.total_incidents}`);
      console.log(`  Completadas: ${summary.completed_incidents}`);
      console.log(`  Estado: ${summary.current_status}`);
      console.log(`  Creado: ${summary.created_at}`);
      console.log('  ---');
    }
  });
  
  // 3. Buscar incidencias específicas
  const { data: incidents, error: incidentsError } = await supabase
    .from('maintenance_incidents_individual')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (incidentsError) {
    console.error('Error obteniendo incidencias:', incidentsError);
    return;
  }
  
  // Filtrar incidencias de tablets
  const tabletIncidents = incidents?.filter(inc => 
    inc.damage_type === 'Pantalla Táctil' || 
    inc.damage_type === 'Pantalla Rota' ||
    inc.reporter_name === 'Prof. María López' ||
    inc.reporter_name === 'WILLIAM AMÉRICO GUTIERREZ ANDIA'
  );
  
  console.log('\n🔧 INCIDENCIAS RELEVANTES:');
  tabletIncidents?.forEach(inc => {
    console.log(`- ID: ${inc.id}`);
    console.log(`  Resource ID: ${inc.resource_id}`);
    console.log(`  Daño: ${inc.damage_type}`);
    console.log(`  Reportador: ${inc.reporter_name}`);
    console.log(`  Grado: ${inc.reporter_grade}`);
    console.log(`  Sección: ${inc.reporter_section}`);
    console.log(`  Estado: ${inc.current_status}`);
    console.log(`  Fecha: ${inc.created_at}`);
    console.log('  ---');
  });
  
  // 4. Simular la lógica de maintenance.ts
  console.log('\n🔄 SIMULANDO LÓGICA DE MAPEO:');
  
  // Obtener un resource_id específico para probar
  const testResourceId = summaries?.find(s => 
    s.resource?.category?.name?.toLowerCase().includes('tablet')
  )?.resource_id;
  
  if (testResourceId) {
    console.log(`Probando con Resource ID: ${testResourceId}`);
    
    // Obtener el primer incidente (más antiguo) como hace maintenance.ts
    const firstIncident = incidents?.find(incident => incident.resource_id === testResourceId);
    
    console.log('Primer incidente encontrado:');
    if (firstIncident) {
      console.log(`- Reportador: ${firstIncident.reporter_name}`);
      console.log(`- Grado: ${firstIncident.reporter_grade}`);
      console.log(`- Sección: ${firstIncident.reporter_section}`);
      console.log(`- Fecha: ${firstIncident.created_at}`);
    } else {
      console.log('- No se encontró primer incidente');
    }
    
    // Obtener todos los incidentes de este recurso
    const allResourceIncidents = incidents?.filter(inc => inc.resource_id === testResourceId);
    console.log(`\nTodos los incidentes de este recurso (${allResourceIncidents?.length}):`);
    allResourceIncidents?.forEach((inc, index) => {
      console.log(`${index + 1}. ${inc.reporter_name} - ${inc.damage_type} (${inc.created_at})`);
    });
  }
  
  // 5. Verificar préstamos relacionados
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (!loansError && loans) {
    const relevantLoans = loans.filter(loan => 
      loan.user_name === 'WILLIAM AMÉRICO GUTIERREZ ANDIA' ||
      loan.user_name?.includes('María López') ||
      loan.resource_name?.toLowerCase().includes('tablet')
    );
    
    console.log('\n💼 PRÉSTAMOS RELEVANTES:');
    relevantLoans.forEach(loan => {
      console.log(`- ID: ${loan.id}`);
      console.log(`  Recurso: ${loan.resource_name}`);
      console.log(`  Resource ID: ${loan.resource_id}`);
      console.log(`  Usuario: ${loan.user_name}`);
      console.log(`  Estado: ${loan.status}`);
      console.log(`  Fecha préstamo: ${loan.loan_date}`);
      console.log(`  Fecha devolución: ${loan.return_date}`);
      console.log('  ---');
    });
  }
}

debugTabletInconsistency().catch(console.error);
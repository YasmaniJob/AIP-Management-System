const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTabletData() {
  console.log('🔍 VERIFICANDO DATOS ESPECÍFICOS DE TABLET #4');
  
  // Obtener todas las incidencias
  const { data: incidents, error: incidentsError } = await supabase
    .from('maintenance_incidents_individual')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (incidentsError) {
    console.error('Error obteniendo incidencias:', incidentsError);
    return;
  }
  
  console.log('Total incidencias:', incidents.length);
  
  // Filtrar incidencias de tablet/pantalla
  const tabletIncidents = incidents.filter(inc => 
    inc.damage_type === 'Pantalla Táctil' || 
    inc.damage_type === 'Pantalla Rota' ||
    inc.resource_id?.includes('Tablet') ||
    inc.resource_id?.includes('#4')
  );
  
  console.log('\n📱 INCIDENCIAS DE TABLET/PANTALLA:');
  tabletIncidents.forEach(inc => {
    console.log(`- ID: ${inc.id}`);
    console.log(`  Recurso: ${inc.resource_id}`);
    console.log(`  Daño: ${inc.damage_type}`);
    console.log(`  Reportador: ${inc.reporter_name}`);
    console.log(`  Estado: ${inc.current_status}`);
    console.log(`  Fecha: ${inc.created_at}`);
    console.log(`  Notas: ${inc.notes || 'N/A'}`);
    console.log('  ---');
  });
  
  // Verificar resúmenes de recursos
  const { data: summary, error: summaryError } = await supabase
    .from('maintenance_resource_summary')
    .select('*');
    
  if (summaryError) {
    console.error('Error obteniendo resúmenes:', summaryError);
  } else {
    console.log('\n📊 RESÚMENES DE RECURSOS:');
    summary?.forEach(s => {
      console.log(`- Recurso: ${s.resource_id}`);
      console.log(`  Total incidencias: ${s.total_incidents}`);
      console.log(`  Completadas: ${s.completed_incidents}`);
      console.log(`  Reportador principal: ${s.primary_reporter}`);
      console.log('  ---');
    });
  }
  
  // Buscar específicamente por "Prof. María López"
  const mariaIncidents = incidents.filter(inc => 
    inc.reporter_name?.includes('María López') ||
    inc.reporter_name?.includes('Prof. María')
  );
  
  console.log('\n👩‍🏫 INCIDENCIAS DE PROF. MARÍA LÓPEZ:');
  mariaIncidents.forEach(inc => {
    console.log(`- ID: ${inc.id}`);
    console.log(`  Recurso: ${inc.resource_id}`);
    console.log(`  Daño: ${inc.damage_type}`);
    console.log(`  Reportador: ${inc.reporter_name}`);
    console.log(`  Estado: ${inc.current_status}`);
    console.log(`  Fecha: ${inc.created_at}`);
    console.log('  ---');
  });
  
  // Verificar datos de préstamos relacionados
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*')
    .ilike('resource_name', '%tablet%');
    
  if (!loansError && loans) {
    console.log('\n💼 PRÉSTAMOS DE TABLETS:');
    loans.forEach(loan => {
      console.log(`- ID: ${loan.id}`);
      console.log(`  Recurso: ${loan.resource_name}`);
      console.log(`  Usuario: ${loan.user_name}`);
      console.log(`  Estado: ${loan.status}`);
      console.log(`  Fecha préstamo: ${loan.loan_date}`);
      console.log(`  Fecha devolución: ${loan.return_date || 'Pendiente'}`);
      console.log('  ---');
    });
  }
}

checkTabletData().catch(console.error);
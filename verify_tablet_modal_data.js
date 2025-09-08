require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTabletModalData() {
  console.log('🔍 VERIFICANDO DATOS EXACTOS PARA EL MODAL DE TABLET 1');
  
  // 1. Obtener información de la Tablet 1 (Apple)
  const { data: tablets, error: tabletError } = await supabase
    .from('resources')
    .select(`
      *,
      category:categories(name, type)
    `)
    .eq('number', '1');
    
  if (tabletError) {
    console.error('Error obteniendo tablets:', tabletError);
    return;
  }
  
  // Buscar la tablet Apple específicamente
  const tablet = tablets?.find(t => t.brand === 'Apple') || tablets?.[0];

  
  console.log('\n📱 TABLET 1 INFORMACIÓN:');
  console.log(`ID: ${tablet.id}`);
  console.log(`Número: ${tablet.number}`);
  console.log(`Marca: ${tablet.brand}`);
  console.log(`Modelo: ${tablet.model}`);
  console.log(`Categoría: ${tablet.category?.name}`);
  console.log(`Estado: ${tablet.status}`);
  
  // 2. Obtener incidencias de mantenimiento para esta tablet
  const { data: incidents, error: incidentsError } = await supabase
    .from('maintenance_incidents_individual')
    .select('*')
    .eq('resource_id', tablet.id)
    .order('created_at', { ascending: false });
    
  console.log('\n🔧 INCIDENCIAS DE MANTENIMIENTO:');
  if (incidentsError) {
    console.error('Error obteniendo incidencias:', incidentsError);
  } else {
    console.log(`Total incidencias: ${incidents?.length || 0}`);
    incidents?.forEach((inc, index) => {
      console.log(`\n${index + 1}. Incidencia ID: ${inc.id}`);
      console.log(`   Tipo de daño: ${inc.damage_type}`);
      console.log(`   Descripción: ${inc.damage_description}`);
      console.log(`   Reportador: ${inc.reporter_name}`);
      console.log(`   Grado: ${inc.reporter_grade}`);
      console.log(`   Sección: ${inc.reporter_section}`);
      console.log(`   Estado: ${inc.current_status}`);
      console.log(`   Prioridad: ${inc.priority}`);
      console.log(`   Fecha: ${inc.created_at}`);
    });
  }
  
  // 3. Obtener información del usuario Yasmani
  const { data: yasmani, error: yasmaniError } = await supabase
    .from('users')
    .select('*')
    .eq('name', 'Yasmani')
    .single();
    
  console.log('\n👤 USUARIO YASMANI:');
  if (yasmaniError) {
    console.error('Error obteniendo usuario Yasmani:', yasmaniError);
  } else {
    console.log(`ID: ${yasmani.id}`);
    console.log(`Nombre: ${yasmani.name}`);
    console.log(`Email: ${yasmani.email}`);
    console.log(`Rol: ${yasmani.role}`);
  }
  
  // 4. Buscar préstamos de Yasmani con la Tablet 1
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select(`
      *,
      loan_resources(
        resource_id,
        resources(
          id,
          number,
          brand,
          model
        )
      )
    `)
    .eq('teacher_id', yasmani?.id);
    
  console.log('\n💼 PRÉSTAMOS DE YASMANI:');
  if (loansError) {
    console.error('Error obteniendo préstamos:', loansError);
  } else {
    console.log(`Total préstamos: ${loans?.length || 0}`);
    
    // Filtrar préstamos que incluyan la Tablet 1
    const tabletLoans = loans?.filter(loan => 
      loan.loan_resources?.some(lr => lr.resource_id === tablet.id)
    );
    
    console.log(`Préstamos con Tablet 1: ${tabletLoans?.length || 0}`);
    tabletLoans?.forEach((loan, index) => {
      console.log(`\n${index + 1}. Préstamo ID: ${loan.id}`);
      console.log(`   Estado: ${loan.status}`);
      console.log(`   Fecha préstamo: ${loan.loan_date}`);
      console.log(`   Fecha devolución: ${loan.return_date || 'Pendiente'}`);
      console.log(`   Grado: ${loan.grade_id}`);
      console.log(`   Sección: ${loan.section_id}`);
      console.log(`   Notas: ${loan.notes || 'Sin notas'}`);
      
      // Verificar si hay reportes de daños en las notas
      if (loan.notes && loan.notes.includes('Pantalla')) {
        console.log(`   ⚠️  CONTIENE REPORTE DE PANTALLA EN NOTAS`);
      }
    });
  }
  
  // 5. Verificar grados y secciones
  console.log('\n🎓 INFORMACIÓN ACADÉMICA:');
  const { data: grades } = await supabase
    .from('grades')
    .select(`
      *,
      sections(*)
    `);
    
  const primero = grades?.find(g => g.name === 'Primero');
  const seccionA = primero?.sections?.find(s => s.name === 'A');
  
  console.log(`Grado 'Primero' ID: ${primero?.id}`);
  console.log(`Sección 'A' ID: ${seccionA?.id}`);
  
  // 6. CONCLUSIÓN
  console.log('\n🎯 ANÁLISIS DEL PROBLEMA:');
  console.log('='.repeat(50));
  
  if (incidents && incidents.length > 0) {
    const pantallaIncident = incidents.find(inc => inc.damage_type === 'Pantalla Táctil');
    if (pantallaIncident) {
      console.log('✅ SÍ existe una incidencia real de "Pantalla Táctil" para la Tablet 1');
      console.log(`   Reportada por: ${pantallaIncident.reporter_name}`);
      console.log(`   Grado: ${pantallaIncident.reporter_grade}`);
      console.log(`   Sección: ${pantallaIncident.reporter_section}`);
      
      if (pantallaIncident.reporter_name !== 'Yasmani') {
        console.log('⚠️  PROBLEMA IDENTIFICADO:');
        console.log('   El modal muestra "Yasmani" pero la incidencia real fue reportada por:');
        console.log(`   "${pantallaIncident.reporter_name}"`);
        console.log('   ');
        console.log('   POSIBLES CAUSAS:');
        console.log('   1. El modal está mostrando datos del usuario actual (Yasmani) en lugar del reportador real');
        console.log('   2. Hay una confusión entre el usuario logueado y el reportador de la incidencia');
        console.log('   3. El componente está mezclando datos de diferentes fuentes');
      }
    }
  }
}

verifyTabletModalData().catch(console.error);
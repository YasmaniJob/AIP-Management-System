require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAvailableData() {
  try {
    console.log('=== VERIFICANDO DATOS DISPONIBLES ===');
    
    console.log('\n1. Usuarios disponibles...');
    const { data: users } = await supabase
      .from('users')
      .select('id, name, role')
      .limit(5);
    
    console.log(`📊 Total usuarios: ${users?.length || 0}`);
    if (users) {
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.role}) - ID: ${user.id}`);
      });
    }
    
    console.log('\n2. Recursos disponibles...');
    const { data: resources } = await supabase
      .from('resources')
      .select('id, name, status')
      .limit(5);
    
    console.log(`📊 Total recursos: ${resources?.length || 0}`);
    if (resources) {
      resources.forEach(resource => {
        console.log(`   - ${resource.name} (${resource.status}) - ID: ${resource.id}`);
      });
    }
    
    console.log('\n3. Áreas disponibles...');
    const { data: areas } = await supabase
      .from('areas')
      .select('id, name')
      .limit(5);
    
    console.log(`📊 Total áreas: ${areas?.length || 0}`);
    if (areas) {
      areas.forEach(area => {
        console.log(`   - ${area.name} - ID: ${area.id}`);
      });
    }
    
    console.log('\n4. Grados disponibles...');
    const { data: grades } = await supabase
      .from('grades')
      .select('id, name')
      .limit(5);
    
    console.log(`📊 Total grados: ${grades?.length || 0}`);
    if (grades) {
      grades.forEach(grade => {
        console.log(`   - ${grade.name} - ID: ${grade.id}`);
      });
    }
    
    console.log('\n5. Secciones disponibles...');
    const { data: sections } = await supabase
      .from('sections')
      .select('id, name')
      .limit(5);
    
    console.log(`📊 Total secciones: ${sections?.length || 0}`);
    if (sections) {
      sections.forEach(section => {
        console.log(`   - ${section.name} - ID: ${section.id}`);
      });
    }
    
    console.log('\n6. Préstamos existentes...');
    const { data: loans } = await supabase
      .from('loans')
      .select('id, status, loan_date, return_date')
      .limit(5);
    
    console.log(`📊 Total préstamos: ${loans?.length || 0}`);
    if (loans) {
      loans.forEach(loan => {
        console.log(`   - ${loan.id} (${loan.status}) - Fecha: ${loan.loan_date}`);
      });
    }
    
    console.log('\n7. Incidencias existentes...');
    const { data: incidents } = await supabase
      .from('incidents')
      .select('id, title, status, priority, type')
      .limit(5);
    
    console.log(`📊 Total incidencias: ${incidents?.length || 0}`);
    if (incidents) {
      incidents.forEach(incident => {
        console.log(`   - ${incident.title} (${incident.status}) - ${incident.priority} - ${incident.type}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAvailableData();
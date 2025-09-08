require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugRequestLoan() {
  try {
    console.log('=== DEBUGGING REQUEST LOAN PROCESS ===');
    
    // 1. Verificar el estado antes de crear
    console.log('\n1. Verificando préstamos existentes...');
    const { data: existingLoans } = await supabase
      .from('loans')
      .select('id, status, is_authorized, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    console.log('Últimos 3 préstamos:');
    existingLoans?.forEach(loan => {
      console.log(`  ID: ${loan.id}, Estado: ${loan.status}, Autorizado: ${loan.is_authorized}`);
    });
    
    // 2. Simular creación de préstamo con requestLoanAction
    console.log('\n2. Simulando creación de préstamo...');
    
    // Obtener un docente y recursos disponibles
    const { data: teacher } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'Docente')
      .limit(1)
      .single();
    
    const { data: area } = await supabase
      .from('areas')
      .select('id')
      .limit(1)
      .single();
    
    const { data: grade } = await supabase
      .from('grades')
      .select('id')
      .limit(1)
      .single();
    
    const { data: section } = await supabase
      .from('sections')
      .select('id')
      .eq('grade_id', grade.id)
      .limit(1)
      .single();
    
    const { data: resource } = await supabase
      .from('resources')
      .select('id')
      .eq('status', 'Disponible')
      .limit(1)
      .single();
    
    if (!teacher || !area || !grade || !section || !resource) {
      console.log('No se encontraron datos necesarios para la prueba');
      return;
    }
    
    console.log(`Usando: Docente ${teacher.id}, Área ${area.id}, Grado ${grade.id}, Sección ${section.id}, Recurso ${resource.id}`);
    
    // Crear préstamo directamente en la base de datos como lo hace requestLoanAction
    const { data: newLoan, error: loanError } = await supabase
      .from('loans')
      .insert({
        teacher_id: teacher.id,
        area_id: area.id,
        grade_id: grade.id,
        section_id: section.id,
        notes: 'Prueba de debug',
        status: 'Pendiente',
        loan_date: new Date().toISOString(),
        return_date: null,
        is_authorized: false,
      })
      .select()
      .single();
    
    if (loanError) {
      console.error('Error creando préstamo:', loanError);
      return;
    }
    
    console.log(`\n3. Préstamo creado con ID: ${newLoan.id}`);
    console.log(`   Estado inicial: ${newLoan.status}`);
    console.log(`   Autorizado: ${newLoan.is_authorized}`);
    
    // Crear relación con recurso
    const { error: resourceError } = await supabase
      .from('loan_resources')
      .insert({
        loan_id: newLoan.id,
        resource_id: resource.id,
      });
    
    if (resourceError) {
      console.error('Error asociando recurso:', resourceError);
    } else {
      console.log('   Recurso asociado correctamente');
    }
    
    // Verificar el estado después de un momento
    setTimeout(async () => {
      const { data: updatedLoan } = await supabase
        .from('loans')
        .select('id, status, is_authorized')
        .eq('id', newLoan.id)
        .single();
      
      console.log(`\n4. Estado después de creación:`);
      console.log(`   Estado: ${updatedLoan?.status}`);
      console.log(`   Autorizado: ${updatedLoan?.is_authorized}`);
      
      if (updatedLoan?.status !== 'Pendiente') {
        console.log('\n⚠️  EL ESTADO CAMBIÓ! Esto indica que hay algún trigger o lógica que modifica el estado.');
      } else {
        console.log('\n✅ El estado se mantiene como Pendiente, como debería ser.');
      }
    }, 2000);
    
  } catch (err) {
    console.error('Error en debug:', err);
  }
}

debugRequestLoan();
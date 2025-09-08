// Script para crear múltiples préstamos de prueba
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestLoans() {
  console.log('🚀 Iniciando creación de préstamos de prueba...');
  
  try {
    // 1. Obtener usuarios disponibles
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, dni')
      .eq('role', 'Docente')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }
    
    console.log(`📋 Encontrados ${users.length} docentes`);
    
    // 2. Obtener recursos disponibles
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('id, brand, model, processor_brand, generation, ram, storage, status')
      .eq('status', 'Disponible')
      .limit(50);
    
    if (resourcesError) {
      console.error('❌ Error obteniendo recursos:', resourcesError);
      return;
    }
    
    console.log(`💻 Encontrados ${resources.length} recursos disponibles`);
    
    // 3. Obtener áreas, grados y secciones
    const { data: areas } = await supabase.from('areas').select('id, name').limit(5);
    const { data: grades } = await supabase.from('grades').select('id, name').limit(5);
    const { data: sections } = await supabase.from('sections').select('id, name, grade_id').limit(10);
    
    const availableAreas = areas || [];
    const availableGrades = grades || [];
    const availableSections = sections || [];
    
    // 4. Crear préstamos de prueba
    const loansToCreate = [];
    const today = new Date();
    
    for (let i = 0; i < Math.min(15, users.length); i++) {
      const user = users[i % users.length];
      
      // Fechas aleatorias
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 14) + 1);
      
      const returnDate = Math.random() > 0.3 ? null : new Date(endDate);
      returnDate?.setDate(returnDate.getDate() + Math.floor(Math.random() * 5));
      
      // Estado del préstamo
      let status;
      if (returnDate) {
        status = 'Devuelto';
      } else if (endDate < new Date()) {
        status = 'Atrasado';
      } else {
        status = Math.random() > 0.5 ? 'Activo' : 'Pendiente';
      }
      
      // Seleccionar área, grado y sección aleatoriamente
      const selectedArea = availableAreas.length > 0 ? availableAreas[Math.floor(Math.random() * availableAreas.length)] : null;
      const selectedGrade = availableGrades.length > 0 ? availableGrades[Math.floor(Math.random() * availableGrades.length)] : null;
      const selectedSection = availableSections.length > 0 ? availableSections[Math.floor(Math.random() * availableSections.length)] : null;
      
      // Seleccionar un recurso aleatorio para la descripción
      const selectedResource = resources[i % resources.length];
      
      const loan = {
        teacher_id: user.id,
        area_id: selectedArea?.id || null,
        grade_id: selectedGrade?.id || null,
        section_id: selectedSection?.id || null,
        loan_date: startDate.toISOString(),
        return_date: endDate.toISOString(),
        actual_return_date: returnDate?.toISOString() || null,
        status: status,
        is_authorized: true,
        notes: `Préstamo de prueba #${i + 1} - ${selectedResource.brand} ${selectedResource.model}`,
        created_at: new Date().toISOString()
      };
      
      loansToCreate.push(loan);
    }
    
    console.log(`📝 Creando ${loansToCreate.length} préstamos...`);
    
    // Insertar préstamos
    const { data: createdLoans, error: loansError } = await supabase
      .from('loans')
      .insert(loansToCreate)
      .select('id');
    
    if (loansError) {
      console.error('❌ Error creando préstamos:', loansError);
      return;
    }
    
    console.log(`✅ Creados ${createdLoans.length} préstamos exitosamente`);
    
    // 5. Asignar recursos a los préstamos
    const loanResourcesToCreate = [];
    
    for (let i = 0; i < createdLoans.length; i++) {
      const loanId = createdLoans[i].id;
      const numResources = Math.floor(Math.random() * 3) + 1; // 1-3 recursos por préstamo
      
      // Seleccionar recursos aleatorios
      const selectedResources = [];
      for (let j = 0; j < numResources && j < resources.length; j++) {
        const resourceIndex = (i * 3 + j) % resources.length;
        selectedResources.push(resources[resourceIndex]);
      }
      
      for (const resource of selectedResources) {
        loanResourcesToCreate.push({
          loan_id: loanId,
          resource_id: resource.id
        });
      }
    }
    
    console.log(`🔗 Asignando ${loanResourcesToCreate.length} recursos a préstamos...`);
    
    const { error: loanResourcesError } = await supabase
      .from('loan_resources')
      .insert(loanResourcesToCreate);
    
    if (loanResourcesError) {
      console.error('❌ Error asignando recursos:', loanResourcesError);
      return;
    }
    
    // 6. Actualizar estado de recursos asignados
    const resourceIds = loanResourcesToCreate.map(lr => lr.resource_id);
    const { error: updateResourcesError } = await supabase
      .from('resources')
      .update({ status: 'En Préstamo' })
      .in('id', resourceIds);
    
    if (updateResourcesError) {
      console.error('❌ Error actualizando recursos:', updateResourcesError);
      return;
    }
    
    console.log('✅ Recursos actualizados a estado "En Préstamo"');
    
    // 7. Crear algunos préstamos vencidos para pruebas
    const overdueLoans = [];
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * 7) - 1); // 1-7 días vencidos
    
    for (let i = 0; i < Math.min(3, users.length); i++) {
      const user = users[i];
      
      // Seleccionar área, grado y sección aleatoriamente
      const selectedArea = availableAreas.length > 0 ? availableAreas[Math.floor(Math.random() * availableAreas.length)] : null;
      const selectedGrade = availableGrades.length > 0 ? availableGrades[Math.floor(Math.random() * availableGrades.length)] : null;
      const selectedSection = availableSections.length > 0 ? availableSections[Math.floor(Math.random() * availableSections.length)] : null;
      
      const startDate = new Date(today.getTime() - (Math.random() * 10 + 5) * 24 * 60 * 60 * 1000);
      
      const overdueLoan = {
         teacher_id: user.id,
         area_id: selectedArea?.id || null,
         grade_id: selectedGrade?.id || null,
         section_id: selectedSection?.id || null,
         loan_date: startDate.toISOString(),
         return_date: pastDate.toISOString(),
         actual_return_date: null,
         status: 'Atrasado',
         is_authorized: true,
         notes: `Préstamo vencido para pruebas - ${Math.floor(Math.random() * 7) + 1} días de retraso`,
         created_at: startDate.toISOString()
       };
      
      overdueLoans.push(overdueLoan);
    }
    
    if (overdueLoans.length > 0) {
      console.log(`⏰ Creando ${overdueLoans.length} préstamos vencidos...`);
      
      const { data: createdOverdueLoans, error: overdueError } = await supabase
        .from('loans')
        .insert(overdueLoans)
        .select('id');
      
      if (!overdueError && createdOverdueLoans) {
        console.log(`✅ Creados ${createdOverdueLoans.length} préstamos vencidos`);
      }
    }
    
    console.log('\n🎉 ¡Creación de préstamos de prueba completada!');
    console.log('📊 Resumen:');
    console.log(`   • ${createdLoans.length} préstamos normales`);
    console.log(`   • ${overdueLoans.length} préstamos vencidos`);
    console.log(`   • ${loanResourcesToCreate.length} asignaciones de recursos`);
    console.log('\n💡 Ahora puedes probar el sistema con estos préstamos.');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
createTestLoans().then(() => {
  console.log('\n🏁 Script finalizado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
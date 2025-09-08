require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumnDefault() {
  try {
    console.log('=== CHECKING COLUMN DEFAULTS ===');
    
    // Verificar la estructura de la columna status en la tabla loans
    const { data: columnInfo, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default, is_nullable')
      .eq('table_name', 'loans')
      .eq('table_schema', 'public');
    
    if (error) {
      console.log('Error obteniendo información de columnas:', error.message);
      
      // Intentar una consulta alternativa
      console.log('\nIntentando consulta alternativa...');
      
      // Crear un préstamo sin especificar status para ver qué valor toma
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
      
      if (teacher && area && grade && section) {
        console.log('\nProbando inserción sin campo status...');
        
        const { data: testLoan, error: testError } = await supabase
          .from('loans')
          .insert({
            teacher_id: teacher.id,
            area_id: area.id,
            grade_id: grade.id,
            section_id: section.id,
            notes: 'Test sin status',
            loan_date: new Date().toISOString(),
            return_date: null,
            is_authorized: false,
            // NO incluimos status para ver qué valor por defecto toma
          })
          .select('id, status')
          .single();
        
        if (testError) {
          console.log(`Error: ${testError.message}`);
          
          // Si falla, probablemente status es requerido
          console.log('\nStatus parece ser requerido. Probando con diferentes valores...');
          
          const testValues = ['Pendiente', 'Activo', 'Devuelto'];
          
          for (const statusValue of testValues) {
            const { data: testLoan2, error: testError2 } = await supabase
              .from('loans')
              .insert({
                teacher_id: teacher.id,
                area_id: area.id,
                grade_id: grade.id,
                section_id: section.id,
                notes: `Test con status: ${statusValue}`,
                status: statusValue,
                loan_date: new Date().toISOString(),
                return_date: null,
                is_authorized: false,
              })
              .select('id, status')
              .single();
            
            if (testError2) {
              console.log(`  ${statusValue}: Error - ${testError2.message}`);
            } else {
              console.log(`  ${statusValue}: Resultado - ${testLoan2.status}`);
              // Limpiar
              await supabase.from('loans').delete().eq('id', testLoan2.id);
            }
          }
          
        } else {
          console.log(`Resultado sin status: ${testLoan.status}`);
          // Limpiar
          await supabase.from('loans').delete().eq('id', testLoan.id);
        }
      }
      
    } else {
      console.log('\nInformación de columnas de la tabla loans:');
      columnInfo.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}, Default: ${col.column_default || 'NULL'}, Nullable: ${col.is_nullable}`);
      });
      
      // Buscar específicamente la columna status
      const statusColumn = columnInfo.find(col => col.column_name === 'status');
      if (statusColumn) {
        console.log(`\n🔍 Columna status:`);
        console.log(`   Tipo: ${statusColumn.data_type}`);
        console.log(`   Default: ${statusColumn.column_default || 'NULL'}`);
        console.log(`   Nullable: ${statusColumn.is_nullable}`);
        
        if (statusColumn.column_default && statusColumn.column_default.includes('Activo')) {
          console.log('\n⚠️  ENCONTRADO: La columna status tiene un valor por defecto que incluye "Activo"!');
        }
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkColumnDefault();
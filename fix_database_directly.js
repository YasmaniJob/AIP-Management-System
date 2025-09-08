require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDatabaseDirectly() {
  try {
    console.log('=== FIXING DATABASE DIRECTLY ===');
    
    // Paso 1: Verificar el estado actual
    console.log('\n1. Verificando estado actual...');
    const { data: currentLoans } = await supabase
      .from('loans')
      .select('id, status, is_authorized')
      .limit(5)
      .order('created_at', { ascending: false });
    
    console.log('Últimos 5 préstamos:');
    currentLoans?.forEach(loan => {
      console.log(`  ID: ${loan.id.substring(0, 8)}..., Status: ${loan.status}, Autorizado: ${loan.is_authorized}`);
    });
    
    // Paso 2: Intentar actualizar préstamos existentes que no están autorizados
    console.log('\n2. Actualizando préstamos no autorizados a Pendiente...');
    const { data: updatedLoans, error: updateError } = await supabase
      .from('loans')
      .update({ status: 'Pendiente' })
      .eq('is_authorized', false)
      .neq('status', 'Devuelto')
      .select('id, status');
    
    if (updateError) {
      console.log(`❌ Error actualizando: ${updateError.message}`);
    } else {
      console.log(`✅ ${updatedLoans?.length || 0} préstamos actualizados a Pendiente`);
    }
    
    // Paso 3: Verificar si hay un valor por defecto a nivel de esquema
    console.log('\n3. Intentando eliminar valor por defecto...');
    
    // Crear una función temporal para ejecutar SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION temp_execute_sql(sql_text text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_text;
        RETURN 'SUCCESS';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR: ' || SQLERRM;
      END;
      $$;
    `;
    
    try {
      const { data: funcResult, error: funcError } = await supabase.rpc('exec', {
        sql: createFunctionSQL
      });
      
      if (funcError) {
        console.log('No se pudo crear función temporal, intentando método directo...');
        
        // Método directo: intentar cambiar el valor por defecto usando una actualización
        console.log('\n4. Probando inserción directa con diferentes valores...');
        
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
          // Probar con diferentes valores de status
          const testStatuses = ['Pendiente', 'Devuelto', 'Atrasado'];
          
          for (const testStatus of testStatuses) {
            console.log(`\n   Probando con status: ${testStatus}`);
            
            const { data: testLoan, error: testError } = await supabase
              .from('loans')
              .insert({
                teacher_id: teacher.id,
                area_id: area.id,
                grade_id: grade.id,
                section_id: section.id,
                notes: `Test con status ${testStatus}`,
                status: testStatus,
                loan_date: new Date().toISOString(),
                return_date: null,
                is_authorized: false,
              })
              .select('id, status')
              .single();
            
            if (testError) {
              console.log(`     ❌ Error: ${testError.message}`);
            } else {
              console.log(`     ✅ Resultado: ${testLoan.status}`);
              
              if (testLoan.status === testStatus) {
                console.log(`     🎉 ¡Funciona! El status ${testStatus} se respeta.`);
              } else {
                console.log(`     ⚠️  Status cambiado de ${testStatus} a ${testLoan.status}`);
              }
              
              // Limpiar
              await supabase.from('loans').delete().eq('id', testLoan.id);
            }
          }
        }
        
      } else {
        console.log('✅ Función temporal creada');
        
        // Usar la función para ejecutar comandos SQL
        const sqlCommands = [
          "ALTER TABLE public.loans ALTER COLUMN status DROP DEFAULT",
          "ALTER TABLE public.loans ALTER COLUMN status TYPE public.loan_status USING status::public.loan_status"
        ];
        
        for (const sql of sqlCommands) {
          console.log(`\n   Ejecutando: ${sql}`);
          const { data: result } = await supabase.rpc('temp_execute_sql', { sql_text: sql });
          console.log(`   Resultado: ${result}`);
        }
        
        // Limpiar la función temporal
        await supabase.rpc('temp_execute_sql', { sql_text: 'DROP FUNCTION IF EXISTS temp_execute_sql(text)' });
      }
      
    } catch (err) {
      console.log(`Error con función temporal: ${err.message}`);
    }
    
    // Paso final: Verificar el resultado
    console.log('\n5. Verificación final...');
    
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
      const { data: finalTest, error: finalError } = await supabase
        .from('loans')
        .insert({
          teacher_id: teacher.id,
          area_id: area.id,
          grade_id: grade.id,
          section_id: section.id,
          notes: 'Test final después de corrección',
          status: 'Pendiente',
          loan_date: new Date().toISOString(),
          return_date: null,
          is_authorized: false,
        })
        .select('id, status, is_authorized')
        .single();
      
      if (finalError) {
        console.log(`❌ Error en test final: ${finalError.message}`);
      } else {
        console.log(`\n✅ Test final:`);
        console.log(`   ID: ${finalTest.id}`);
        console.log(`   Status: ${finalTest.status}`);
        console.log(`   Autorizado: ${finalTest.is_authorized}`);
        
        if (finalTest.status === 'Pendiente') {
          console.log('\n🎉 ¡CORRECCIÓN EXITOSA! Los préstamos ahora respetan el status enviado.');
        } else {
          console.log('\n⚠️  El problema persiste. Puede ser necesario contactar soporte de Supabase.');
        }
        
        // Limpiar
        await supabase.from('loans').delete().eq('id', finalTest.id);
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

fixDatabaseDirectly();
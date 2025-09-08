require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigrationRemotely() {
  try {
    console.log('=== APPLYING MIGRATION TO REMOTE DATABASE ===');
    
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241225000000_fix_loans_status_column.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Archivo de migración no encontrado:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migración leída correctamente');
    console.log('\nContenido de la migración:');
    console.log('---');
    console.log(migrationSQL);
    console.log('---');
    
    // Dividir la migración en comandos individuales
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`\n📝 Ejecutando ${commands.length} comandos...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`\n${i + 1}. Ejecutando: ${command.substring(0, 50)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        });
        
        if (error) {
          console.log(`❌ Error en comando ${i + 1}: ${error.message}`);
          
          // Si el RPC no funciona, intentar con una consulta directa para algunos comandos
          if (command.toUpperCase().includes('UPDATE')) {
            console.log('   Intentando con método alternativo...');
            
            // Extraer los valores del UPDATE
            const updateMatch = command.match(/UPDATE\s+public\.loans\s+SET\s+status\s*=\s*'([^']+)'\s+WHERE\s+status\s+NOT IN\s*\([^)]+\)/i);
            if (updateMatch) {
              const newStatus = updateMatch[1];
              const { error: updateError } = await supabase
                .from('loans')
                .update({ status: newStatus })
                .not('status', 'in', '("Pendiente","Activo","Devuelto","Atrasado")');
              
              if (updateError) {
                console.log(`❌ Error en método alternativo: ${updateError.message}`);
              } else {
                console.log('✅ Comando ejecutado con método alternativo');
              }
            }
          }
        } else {
          console.log('✅ Comando ejecutado correctamente');
        }
      } catch (err) {
        console.log(`❌ Excepción en comando ${i + 1}: ${err.message}`);
      }
    }
    
    // Verificar el resultado
    console.log('\n🔍 Verificando resultado...');
    
    // Intentar crear un préstamo de prueba
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
      const { data: testLoan, error: testError } = await supabase
        .from('loans')
        .insert({
          teacher_id: teacher.id,
          area_id: area.id,
          grade_id: grade.id,
          section_id: section.id,
          notes: 'Test después de migración',
          loan_date: new Date().toISOString(),
          return_date: null,
          is_authorized: false,
        })
        .select('id, status, is_authorized')
        .single();
      
      if (testError) {
        console.log(`❌ Error en prueba: ${testError.message}`);
      } else {
        console.log(`\n✅ Prueba exitosa:`);
        console.log(`   ID: ${testLoan.id}`);
        console.log(`   Status: ${testLoan.status}`);
        console.log(`   Autorizado: ${testLoan.is_authorized}`);
        
        if (testLoan.status === 'Pendiente') {
          console.log('\n🎉 ¡MIGRACIÓN EXITOSA! Los préstamos ahora se crean como Pendiente.');
        } else {
          console.log('\n⚠️  La migración no tuvo el efecto esperado.');
        }
        
        // Limpiar
        await supabase.from('loans').delete().eq('id', testLoan.id);
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

applyMigrationRemotely();
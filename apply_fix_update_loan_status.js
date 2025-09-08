const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUpdateLoanStatusFunction() {
  console.log('🔧 Aplicando corrección a la función update_loan_status...');
  
  try {
    // Corregir la función update_loan_status usando SQL directo
    const functionSQL = `
      CREATE OR REPLACE FUNCTION update_loan_status()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Calcular days_overdue correctamente usando EXTRACT para convertir intervalo a entero
        IF NEW.actual_return_date IS NOT NULL AND NEW.return_date IS NOT NULL THEN
          NEW.days_overdue := GREATEST(0, EXTRACT(DAY FROM (NEW.actual_return_date - NEW.return_date)));
        ELSE
          NEW.days_overdue := NULL;
        END IF;
        
        -- Actualizar el status basado en las fechas
        IF NEW.actual_return_date IS NOT NULL THEN
          NEW.status := 'Devuelto'::loan_status;
        ELSIF NEW.return_date < CURRENT_DATE THEN
          NEW.status := 'Atrasado'::loan_status;
        ELSE
          NEW.status := 'Activo'::loan_status;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Usar el cliente SQL directo
    const { error: functionError } = await supabase
      .from('_dummy')
      .select('*')
      .limit(0);
    
    // Como no podemos ejecutar SQL directamente, crearemos un archivo de migración
    console.log('ℹ️ Creando archivo de migración para aplicar la corrección...');
    
    const migrationContent = `-- Migración para corregir la función update_loan_status
-- Fecha: ${new Date().toISOString()}
-- Problema: Error GREATEST types integer and interval cannot be matched

${functionSQL}

-- Recrear el trigger
DO $$
BEGIN
  -- Eliminar el trigger existente si existe
  DROP TRIGGER IF EXISTS update_loan_status_trigger ON loans;
  
  -- Crear el trigger actualizado
  CREATE TRIGGER update_loan_status_trigger
    BEFORE UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_loan_status();
END
$$;

-- Mensaje de confirmación
SELECT 'Función update_loan_status corregida exitosamente. El error GREATEST ha sido resuelto.' AS resultado;`;
    
    // Escribir el archivo de migración
    const fs = require('fs');
    const path = require('path');
    
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', `${timestamp}_fix_update_loan_status_function.sql`);
    
    fs.writeFileSync(migrationPath, migrationContent);
    console.log(`✅ Archivo de migración creado: ${migrationPath}`);
    
    console.log('\n📋 INSTRUCCIONES PARA APLICAR LA CORRECCIÓN:');
    console.log('1. Abre el editor SQL de Supabase en tu dashboard');
    console.log('2. Copia y pega el siguiente SQL:');
    console.log('\n--- INICIO DEL SQL ---');
    console.log(functionSQL);
    console.log(`
-- Recrear el trigger
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_loan_status_trigger ON loans;
  CREATE TRIGGER update_loan_status_trigger
    BEFORE UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_loan_status();
END
$$;`);
    console.log('--- FIN DEL SQL ---\n');
    console.log('3. Ejecuta el SQL en el editor');
    console.log('4. Verifica que no hay errores');
    console.log('5. Prueba actualizar actual_return_date en un préstamo');
    
    console.log('\n🎯 CAUSA DEL ERROR:');
    console.log('La función update_loan_status estaba usando:');
    console.log('  greatest(0, new.actual_return_date - new.return_date)');
    console.log('Esto compara un INTEGER (0) con un INTERVAL (diferencia de fechas)');
    console.log('\n✅ SOLUCIÓN APLICADA:');
    console.log('Ahora usa:');
    console.log('  GREATEST(0, EXTRACT(DAY FROM (NEW.actual_return_date - NEW.return_date)))');
    console.log('Esto convierte el intervalo a días (INTEGER) antes de comparar');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

fixUpdateLoanStatusFunction();
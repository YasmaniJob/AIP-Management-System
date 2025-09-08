const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigrationFix() {
  console.log('🔧 Aplicando corrección de la función update_loan_status...');
  
  const migrationSQL = `
    -- Crear o reemplazar la función update_loan_status corregida
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
  
  const triggerSQL = `
    -- Recrear el trigger
    DROP TRIGGER IF EXISTS update_loan_status_trigger ON loans;
    CREATE TRIGGER update_loan_status_trigger
      BEFORE UPDATE ON loans
      FOR EACH ROW
      EXECUTE FUNCTION update_loan_status();
  `;
  
  try {
    console.log('❌ No se puede aplicar la migración automáticamente.');
    console.log('📋 Debes aplicar manualmente el siguiente SQL en el editor de Supabase:');
    console.log('\n' + '='.repeat(80));
    console.log(migrationSQL);
    console.log(triggerSQL);
    console.log('='.repeat(80));
    console.log('\n📝 Instrucciones:');
    console.log('1. Ve a tu proyecto en Supabase Dashboard');
    console.log('2. Navega a "SQL Editor"');
    console.log('3. Copia y pega el SQL de arriba');
    console.log('4. Ejecuta el SQL');
    console.log('5. Ejecuta: node test_greatest_fix.js para verificar');
    
    // Intentar una prueba simple para ver si ya está corregido
    console.log('\n🧪 Probando si el error ya está corregido...');
    
    try {
      const { data: testLoan, error: testError } = await supabase
        .from('loans')
        .select('id, status')
        .eq('status', 'Activo')
        .limit(1)
        .single();
      
      if (testError || !testLoan) {
        console.log('⚠️ No hay préstamos activos para probar.');
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      const { error: updateError } = await supabase
        .from('loans')
        .update({ actual_return_date: today })
        .eq('id', testLoan.id);
      
      if (updateError) {
        if (updateError.message.includes('GREATEST')) {
          console.log('❌ El error GREATEST aún persiste. Aplica la migración manual.');
        } else {
          console.log('⚠️ Error diferente:', updateError.message);
        }
      } else {
        console.log('✅ ¡El error parece estar corregido!');
        
        // Restaurar el préstamo
        await supabase
          .from('loans')
          .update({ 
            actual_return_date: null,
            status: 'Activo',
            days_overdue: null
          })
          .eq('id', testLoan.id);
      }
      
    } catch (error) {
      console.log('⚠️ Error en la prueba:', error.message);
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

// Ejecutar la migración
applyMigrationFix().then(() => {
  console.log('\n🏁 Proceso completado.');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
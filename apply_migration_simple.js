// apply_migration_simple.js
// Script simplificado para aplicar la migración usando SQL directo

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!serviceKey);
  process.exit(1);
}

console.log('🔧 Aplicando migración manual...');
console.log('');

// Función para verificar si las columnas existen
async function checkColumns() {
  try {
    console.log('🔍 Verificando estado actual de las columnas...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/incidents?select=id,reporter_grade_id,reporter_section_id,reporter_area_id,booking_context&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });

    if (response.ok) {
      console.log('✅ Las columnas de contexto estructurado YA EXISTEN');
      console.log('   No es necesario aplicar la migración.');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Las columnas no existen aún:', error);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error verificando columnas: ${error.message}`);
    return false;
  }
}

// Función principal
async function main() {
  try {
    const columnsExist = await checkColumns();
    
    if (columnsExist) {
      console.log('');
      console.log('🎉 ¡Las columnas ya están disponibles!');
      console.log('   Puedes proceder a actualizar el código para usar las columnas estructuradas.');
      return;
    }

    console.log('');
    console.log('📋 INSTRUCCIONES PARA APLICAR LA MIGRACIÓN MANUALMENTE:');
    console.log('');
    console.log('1. Ve al dashboard de Supabase: https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a "SQL Editor"');
    console.log('4. Ejecuta el siguiente SQL:');
    console.log('');
    console.log('-- Agregar columnas de contexto estructurado');
    console.log('ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS reporter_grade_id UUID REFERENCES public.grades(id);');
    console.log('ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS reporter_section_id UUID REFERENCES public.sections(id);');
    console.log('ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS reporter_area_id UUID REFERENCES public.areas(id);');
    console.log('ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS booking_context JSONB;');
    console.log('');
    console.log('-- Crear índices para mejor rendimiento');
    console.log('CREATE INDEX IF NOT EXISTS idx_incidents_reporter_grade ON public.incidents(reporter_grade_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_incidents_reporter_section ON public.incidents(reporter_section_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_incidents_reporter_area ON public.incidents(reporter_area_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_incidents_booking_context ON public.incidents USING gin(booking_context);');
    console.log('');
    console.log('5. Después de ejecutar el SQL, ejecuta este script nuevamente para verificar.');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();
// apply_migration_direct.js
// Script para aplicar la migración usando la API REST de Supabase directamente

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

console.log('🔧 Configuración:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Service Key: ${serviceKey.substring(0, 20)}...`);
console.log('');

// Leer el archivo de migración
const migrationPath = path.join(__dirname, 'manual_migration.sql');
if (!fs.existsSync(migrationPath)) {
  console.error('❌ No se encontró el archivo manual_migration.sql');
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
console.log('📄 Archivo de migración cargado correctamente');
console.log('');

// Función para ejecutar SQL usando la API REST
async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return await response.json();
}

// Función para ejecutar SQL directo usando query
async function executeDirectSQL(sql) {
  // Usar la API de query directa
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      query: sql
    })
  });

  return {
    ok: response.ok,
    status: response.status,
    text: await response.text()
  };
}

// Función para crear columnas usando ALTER TABLE
async function addColumns() {
  const commands = [
    'ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS reporter_grade_id UUID REFERENCES public.grades(id);',
    'ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS reporter_section_id UUID REFERENCES public.sections(id);',
    'ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS reporter_area_id UUID REFERENCES public.areas(id);',
    'ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS booking_context JSONB;'
  ];

  for (const command of commands) {
    try {
      console.log(`Ejecutando: ${command}`);
      
      // Usar fetch directo a la base de datos
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        },
        body: JSON.stringify({ sql: command })
      });

      if (response.ok) {
        console.log('✅ Comando ejecutado exitosamente');
      } else {
        const error = await response.text();
        console.log(`⚠️  Respuesta: ${response.status} - ${error}`);
      }
    } catch (error) {
      console.log(`⚠️  Error: ${error.message}`);
    }
  }
}

// Función para crear índices
async function createIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_incidents_reporter_grade ON public.incidents(reporter_grade_id);',
    'CREATE INDEX IF NOT EXISTS idx_incidents_reporter_section ON public.incidents(reporter_section_id);',
    'CREATE INDEX IF NOT EXISTS idx_incidents_reporter_area ON public.incidents(reporter_area_id);',
    'CREATE INDEX IF NOT EXISTS idx_incidents_booking_context ON public.incidents USING gin(booking_context);'
  ];

  for (const indexSQL of indexes) {
    try {
      console.log(`Creando índice: ${indexSQL}`);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        },
        body: JSON.stringify({ sql: indexSQL })
      });

      if (response.ok) {
        console.log('✅ Índice creado exitosamente');
      } else {
        const error = await response.text();
        console.log(`⚠️  Respuesta: ${response.status} - ${error}`);
      }
    } catch (error) {
      console.log(`⚠️  Error: ${error.message}`);
    }
  }
}

// Función para verificar las columnas
async function verifyColumns() {
  try {
    console.log('🔍 Verificando columnas creadas...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/incidents?select=reporter_grade_id,reporter_section_id,reporter_area_id,booking_context&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });

    if (response.ok) {
      console.log('✅ Las columnas de contexto estructurado están disponibles');
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ Error verificando columnas: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error verificando columnas: ${error.message}`);
    return false;
  }
}

// Función principal
async function applyMigration() {
  try {
    console.log('🚀 Iniciando aplicación de migración directa...');
    console.log('');

    // Paso 1: Agregar columnas
    console.log('📝 Paso 1: Agregando columnas...');
    await addColumns();
    console.log('');

    // Paso 2: Crear índices
    console.log('📝 Paso 2: Creando índices...');
    await createIndexes();
    console.log('');

    // Paso 3: Verificar resultado
    console.log('📝 Paso 3: Verificando resultado...');
    const success = await verifyColumns();
    console.log('');

    if (success) {
      console.log('🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
      console.log('   Las columnas de contexto estructurado están ahora disponibles.');
      console.log('   Reinicia el servidor de desarrollo para que los cambios tomen efecto.');
    } else {
      console.log('⚠️  La migración se completó pero hay problemas con la verificación.');
      console.log('   Verifica manualmente en el dashboard de Supabase.');
    }
    
  } catch (error) {
    console.error('❌ Error aplicando migración:');
    console.error(error.message);
    process.exit(1);
  }
}

// Ejecutar
applyMigration();
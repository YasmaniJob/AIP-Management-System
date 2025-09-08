// apply_migration_with_psql.js
// Script para aplicar la migración usando psql directamente

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env
require('dotenv').config();

// Configuración de la base de datos desde variables de entorno
const DB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DB_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!DB_URL);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!SERVICE_ROLE_KEY);
  process.exit(1);
}

// Extraer información de conexión de la URL de Supabase
const url = new URL(DB_URL);
const projectRef = url.hostname.split('.')[0];
const host = `db.${projectRef}.supabase.co`;
const port = 5432;
const database = 'postgres';
const username = 'postgres';
const password = SERVICE_ROLE_KEY;

console.log('🔧 Configuración de conexión:');
console.log(`   Host: ${host}`);
console.log(`   Puerto: ${port}`);
console.log(`   Base de datos: ${database}`);
console.log(`   Usuario: ${username}`);
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

// Función para ejecutar psql
function executePsql(sql) {
  return new Promise((resolve, reject) => {
    const psql = spawn('psql', [
      '-h', host,
      '-p', port.toString(),
      '-U', username,
      '-d', database,
      '-c', sql
    ], {
      env: {
        ...process.env,
        PGPASSWORD: password
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    psql.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    psql.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    psql.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`psql exited with code ${code}\nstderr: ${stderr}\nstdout: ${stdout}`));
      }
    });

    psql.on('error', (error) => {
      reject(error);
    });
  });
}

// Función principal
async function applyMigration() {
  try {
    console.log('🚀 Iniciando aplicación de migración...');
    console.log('');

    // Verificar conexión
    console.log('🔍 Verificando conexión a la base de datos...');
    await executePsql('SELECT version();');
    console.log('✅ Conexión exitosa');
    console.log('');

    // Aplicar migración
    console.log('📝 Aplicando migración...');
    const result = await executePsql(migrationSQL);
    
    if (result.stderr && !result.stderr.includes('NOTICE')) {
      console.log('⚠️  Advertencias/Errores:');
      console.log(result.stderr);
    }
    
    if (result.stdout) {
      console.log('📋 Resultado:');
      console.log(result.stdout);
    }
    
    console.log('');
    console.log('✅ Migración aplicada');
    console.log('');

    // Verificar que las columnas se crearon
    console.log('🔍 Verificando columnas creadas...');
    const verifyResult = await executePsql(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'incidents' 
      AND column_name IN ('reporter_grade_id', 'reporter_section_id', 'reporter_area_id', 'booking_context')
      ORDER BY column_name;
    `);
    
    console.log('📋 Columnas encontradas:');
    console.log(verifyResult.stdout);
    
    // Verificar claves foráneas
    console.log('🔍 Verificando claves foráneas...');
    const fkResult = await executePsql(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'incidents'
        AND kcu.column_name LIKE 'reporter_%_id';
    `);
    
    console.log('📋 Claves foráneas encontradas:');
    console.log(fkResult.stdout);
    
    console.log('');
    console.log('🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('   Las columnas de contexto estructurado están ahora disponibles.');
    console.log('   Reinicia el servidor de desarrollo para que los cambios tomen efecto.');
    
  } catch (error) {
    console.error('❌ Error aplicando migración:');
    console.error(error.message);
    process.exit(1);
  }
}

// Ejecutar
applyMigration();
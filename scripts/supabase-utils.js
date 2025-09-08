#!/usr/bin/env node

/**
 * Utilidades para gestionar Supabase CLI
 * Este script facilita la creación y gestión de migraciones
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SupabaseUtils {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.migrationsDir = path.join(this.projectRoot, 'supabase', 'migrations');
  }

  /**
   * Ejecuta un comando de Supabase CLI
   */
  runSupabaseCommand(command, options = {}) {
    try {
      const fullCommand = `npx supabase ${command}`;
      console.log(`🚀 Ejecutando: ${fullCommand}`);
      
      const result = execSync(fullCommand, {
        cwd: this.projectRoot,
        stdio: 'inherit',
        ...options
      });
      
      return result;
    } catch (error) {
      console.error(`❌ Error ejecutando comando: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea una nueva migración
   */
  createMigration(name) {
    if (!name) {
      throw new Error('Debe proporcionar un nombre para la migración');
    }

    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '');
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const filepath = path.join(this.migrationsDir, filename);

    const template = `-- Migración: ${name}
-- Creada: ${new Date().toISOString()}

-- Aquí va tu código SQL

`;

    fs.writeFileSync(filepath, template);
    console.log(`✅ Migración creada: ${filename}`);
    return filepath;
  }

  /**
   * Lista todas las migraciones
   */
  listMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      console.log('📁 No existe el directorio de migraciones');
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log('📋 Migraciones disponibles:');
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });

    return files;
  }

  /**
   * Genera el esquema actual desde la base de datos remota
   */
  generateSchema() {
    try {
      this.runSupabaseCommand('db dump --schema-only > supabase/schema.sql');
      console.log('✅ Esquema generado exitosamente');
    } catch (error) {
      console.log('⚠️  No se pudo generar el esquema automáticamente');
      console.log('   Esto es normal si no tienes conexión a la base de datos remota');
    }
  }

  /**
   * Valida la sintaxis de las migraciones
   */
  validateMigrations() {
    const files = this.listMigrations();
    let hasErrors = false;

    files.forEach(file => {
      const filepath = path.join(this.migrationsDir, file);
      const content = fs.readFileSync(filepath, 'utf8');
      
      // Validaciones básicas
      if (content.trim().length === 0) {
        console.log(`⚠️  ${file}: Archivo vacío`);
        hasErrors = true;
      }
      
      if (!content.includes('--')) {
        console.log(`⚠️  ${file}: Sin comentarios descriptivos`);
      }
    });

    if (!hasErrors) {
      console.log('✅ Todas las migraciones pasaron la validación básica');
    }

    return !hasErrors;
  }

  /**
   * Muestra información del proyecto
   */
  showProjectInfo() {
    console.log('📊 Información del Proyecto Supabase:');
    console.log(`   Directorio: ${this.projectRoot}`);
    console.log(`   Migraciones: ${this.migrationsDir}`);
    
    const configPath = path.join(this.projectRoot, 'supabase', 'config.toml');
    if (fs.existsSync(configPath)) {
      console.log('   ✅ Configuración encontrada');
    } else {
      console.log('   ❌ Configuración no encontrada');
    }

    this.listMigrations();
  }
}

// CLI Interface
if (require.main === module) {
  const utils = new SupabaseUtils();
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'create':
      if (!arg) {
        console.log('❌ Uso: node supabase-utils.js create <nombre_migracion>');
        process.exit(1);
      }
      utils.createMigration(arg);
      break;

    case 'list':
      utils.listMigrations();
      break;

    case 'validate':
      utils.validateMigrations();
      break;

    case 'schema':
      utils.generateSchema();
      break;

    case 'info':
      utils.showProjectInfo();
      break;

    case 'help':
    default:
      console.log(`
🔧 Utilidades de Supabase CLI

Comandos disponibles:
  create <nombre>  - Crear nueva migración
  list            - Listar migraciones
  validate        - Validar migraciones
  schema          - Generar esquema actual
  info            - Mostrar información del proyecto
  help            - Mostrar esta ayuda

Ejemplos:
  node scripts/supabase-utils.js create "add user preferences"
  node scripts/supabase-utils.js list
  node scripts/supabase-utils.js validate
`);
      break;
  }
}

module.exports = SupabaseUtils;
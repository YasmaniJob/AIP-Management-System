#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class SupabaseDiagnostic {
  constructor() {
    this.results = [];
  }

  log(status, message, details = null) {
    const result = { status, message, details, timestamp: new Date().toISOString() };
    this.results.push(result);
    
    const icon = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${message}`);
    if (details) {
      console.log(`   ${details}`);
    }
  }

  async checkEnvironmentVariables() {
    console.log('\n🔍 Verificando variables de entorno...');
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (value) {
        this.log('success', `${varName} configurada`, `Longitud: ${value.length} caracteres`);
      } else {
        this.log('error', `${varName} no encontrada`);
      }
    }
  }

  async checkSupabaseConnection() {
    console.log('\n🔗 Verificando conexión a Supabase...');
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Test básico de conexión
      const { data, error } = await supabase.from('system_settings').select('id').limit(1);
      
      if (error) {
        this.log('error', 'Error en conexión básica', error.message);
      } else {
        this.log('success', 'Conexión básica exitosa', `Registros encontrados: ${data?.length || 0}`);
      }

      // Test de autenticación
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        this.log('warning', 'Sin sesión activa', 'Normal para conexión anónima');
      } else {
        this.log('success', 'Estado de autenticación verificado');
      }

    } catch (error) {
      this.log('error', 'Error crítico de conexión', error.message);
    }
  }

  async checkProjectStructure() {
    console.log('\n📁 Verificando estructura del proyecto...');
    
    const paths = [
      { path: 'supabase/config.toml', name: 'Configuración de Supabase' },
      { path: 'supabase/migrations', name: 'Directorio de migraciones' },
      { path: '.env', name: 'Archivo de variables de entorno' },
      { path: 'package.json', name: 'Configuración del proyecto' }
    ];

    for (const { path: filePath, name } of paths) {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        const type = stats.isDirectory() ? 'directorio' : 'archivo';
        this.log('success', `${name} encontrado`, `Tipo: ${type}`);
      } else {
        this.log('error', `${name} no encontrado`, `Ruta: ${fullPath}`);
      }
    }
  }

  async checkDockerStatus() {
    console.log('\n🐳 Verificando estado de Docker...');
    
    const { exec } = require('child_process');
    
    return new Promise((resolve) => {
      exec('docker --version', (error, stdout, stderr) => {
        if (error) {
          this.log('warning', 'Docker no disponible', 'Desarrollo local limitado');
        } else {
          this.log('success', 'Docker disponible', stdout.trim());
          
          // Verificar si Docker está ejecutándose
          exec('docker ps', (psError, psStdout, psStderr) => {
            if (psError) {
              this.log('warning', 'Docker no está ejecutándose', 'Usar base de datos remota');
            } else {
              this.log('success', 'Docker ejecutándose correctamente');
            }
            resolve();
          });
          return;
        }
        resolve();
      });
    });
  }

  async checkMigrations() {
    console.log('\n📋 Verificando migraciones...');
    
    const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations');
    
    if (fs.existsSync(migrationsPath)) {
      const files = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      this.log('success', `${files.length} migraciones encontradas`);
      
      if (files.length > 0) {
        console.log('   Últimas 3 migraciones:');
        files.slice(-3).forEach(file => {
          console.log(`   - ${file}`);
        });
      }
    } else {
      this.log('error', 'Directorio de migraciones no encontrado');
    }
  }

  generateReport() {
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO');
    console.log('=' .repeat(50));
    
    const summary = this.results.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`✅ Exitosos: ${summary.success || 0}`);
    console.log(`⚠️  Advertencias: ${summary.warning || 0}`);
    console.log(`❌ Errores: ${summary.error || 0}`);

    if (summary.error > 0) {
      console.log('\n🔧 PROBLEMAS ENCONTRADOS:');
      this.results
        .filter(r => r.status === 'error')
        .forEach(r => console.log(`   - ${r.message}`));
    }

    if (summary.warning > 0) {
      console.log('\n⚠️  ADVERTENCIAS:');
      this.results
        .filter(r => r.status === 'warning')
        .forEach(r => console.log(`   - ${r.message}`));
    }

    console.log('\n💡 RECOMENDACIONES:');
    if (summary.error === 0 && summary.warning <= 2) {
      console.log('   - Tu configuración de Supabase está funcionando correctamente');
      console.log('   - Puedes usar la base de datos remota sin problemas');
    }
    
    if (this.results.some(r => r.message.includes('Docker'))) {
      console.log('   - Para desarrollo local completo, instala y ejecuta Docker');
      console.log('   - Mientras tanto, usa la base de datos remota');
    }
  }

  async run() {
    console.log('🚀 DIAGNÓSTICO DE SUPABASE');
    console.log('=' .repeat(50));
    
    await this.checkEnvironmentVariables();
    await this.checkProjectStructure();
    await this.checkSupabaseConnection();
    await this.checkDockerStatus();
    await this.checkMigrations();
    
    this.generateReport();
  }
}

// Ejecutar diagnóstico
if (require.main === module) {
  const diagnostic = new SupabaseDiagnostic();
  diagnostic.run().catch(console.error);
}

module.exports = SupabaseDiagnostic;
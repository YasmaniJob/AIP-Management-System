# Guía de Supabase CLI para AIP

## 🚀 Configuración Completada

### ✅ Pasos Realizados

1. **Instalación del CLI**: Supabase CLI instalado como dependencia de desarrollo
2. **Inicialización del Proyecto**: Proyecto inicializado con `supabase init`
3. **Autenticación**: CLI autenticado con la cuenta de Supabase
4. **Scripts Personalizados**: Scripts de utilidades creados para facilitar el desarrollo

## 📋 Comandos Disponibles

### Comandos Básicos de Supabase

```bash
# Ver estado del proyecto local
npm run supabase:status

# Iniciar servicios locales (requiere Docker)
npm run supabase:start

# Detener servicios locales
npm run supabase:stop

# Resetear base de datos local
npm run supabase:reset

# Aplicar migraciones a la base de datos
npm run supabase:migrate

# Generar tipos TypeScript desde el esquema
npm run supabase:generate-types
```

### Comandos de Utilidades Personalizadas

```bash
# Mostrar información del proyecto
npm run supabase:utils info

# Crear nueva migración
npm run migration:create "nombre_de_la_migracion"

# Listar todas las migraciones
npm run migration:list

# Validar migraciones
npm run migration:validate
```

## 🗂️ Estructura del Proyecto

```
supabase/
├── config.toml              # Configuración del proyecto
├── migrations/              # Archivos de migración SQL
│   ├── 20240806000001_create_agenda_tables.sql
│   ├── 20240807000000_initial_schema.sql
│   └── ... (25 migraciones existentes)
└── schema.sql              # Esquema actual de la base de datos

scripts/
└── supabase-utils.js       # Utilidades personalizadas
```

## 🔧 Gestión de Migraciones

### Crear Nueva Migración

```bash
# Crear migración con nombre descriptivo
npm run migration:create "add user preferences table"

# Esto creará un archivo como:
# supabase/migrations/20250906164500_add_user_preferences_table.sql
```

### Aplicar Migraciones

```bash
# Aplicar migraciones pendientes a la base de datos remota
npx supabase db push

# O usar el script personalizado
npm run supabase:migrate
```

### Validar Migraciones

```bash
# Verificar sintaxis y estructura de las migraciones
npm run migration:validate
```

## 🌐 Configuración de Entorno

### Variables de Entorno Configuradas

```env
NEXT_PUBLIC_SUPABASE_URL=https://jwefuiojqgwizjcumynm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Configuración del Proyecto (config.toml)

- **Project ID**: AIP
- **API Port**: 54321
- **DB Port**: 54322
- **Studio Port**: 54323
- **Database Version**: 17

## 🐳 Desarrollo Local (Opcional)

**Nota**: Para el desarrollo local completo se requiere Docker Desktop.

```bash
# Iniciar todos los servicios locales
npm run supabase:start

# Esto iniciará:
# - Base de datos PostgreSQL local
# - API Gateway
# - Supabase Studio
# - Servicios de autenticación
# - Servicios de almacenamiento
```

## 📊 Estado Actual del Proyecto

- ✅ **CLI Instalado**: Supabase CLI v2.39.2
- ✅ **Proyecto Inicializado**: Configuración completa
- ✅ **Autenticado**: Conectado a la cuenta de Supabase
- ✅ **Migraciones**: 25 migraciones existentes identificadas
- ✅ **Scripts Personalizados**: Utilidades para gestión eficiente
- ⚠️ **Docker**: No disponible (opcional para desarrollo local)

## 🚀 Próximos Pasos Recomendados

1. **Generar Tipos TypeScript**:
   ```bash
   npm run supabase:generate-types
   ```

2. **Crear Nueva Migración** (si es necesario):
   ```bash
   npm run migration:create "descripcion_del_cambio"
   ```

3. **Validar Migraciones Existentes**:
   ```bash
   npm run migration:validate
   ```

4. **Aplicar Cambios** (cuando esté listo):
   ```bash
   npm run supabase:migrate
   ```

## 🆘 Solución de Problemas

### Error de Docker
Si ves errores relacionados con Docker, es normal. Los comandos que requieren Docker son:
- `supabase start`
- `supabase stop`
- `supabase status`

Puedes trabajar con migraciones y el proyecto remoto sin Docker.

### Error de Conexión a Base de Datos
Para conectar con la base de datos remota, necesitarás la contraseña de la base de datos (no el service role key).

### Comandos de Depuración
```bash
# Ejecutar comandos con información de depuración
npx supabase [comando] --debug
```

## 📚 Recursos Adicionales

- [Documentación Oficial de Supabase CLI](https://supabase.com/docs/guides/cli)
- [Guía de Migraciones](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Configuración Local](https://supabase.com/docs/guides/local-development)

---

**Creado**: 6 de septiembre de 2025  
**Versión CLI**: 2.39.2  
**Estado**: Configuración completa y funcional
# Script de Migración de Datos - Sistema AIP

Este documento describe cómo usar el script de migración para actualizar las incidencias existentes al nuevo formato estructurado.

## Descripción

El script `migrate_existing_data.js` migra las incidencias existentes para incluir el contexto estructurado del usuario (grado, sección, área) y el contexto de reserva, eliminando la dependencia del parsing de texto.

## Características

### ✅ Lo que hace el script:

1. **Extrae contexto desde reservas**: Busca la reserva más reciente del usuario para obtener grado, sección y área
2. **Fallback a parsing de texto**: Si no hay reservas, extrae información de la descripción usando regex
3. **Actualiza campos estructurados**: Llena `reporter_grade_id`, `reporter_section_id`, `reporter_area_id`
4. **Crea contexto de reserva**: Genera `booking_context` con actividad y fecha
5. **Reporte detallado**: Muestra estadísticas antes y después de la migración
6. **Manejo de errores**: Continúa procesando aunque falle una incidencia individual

### 🔍 Verificaciones de seguridad:

- Verifica variables de entorno antes de ejecutar
- Muestra estado actual antes de migrar
- Procesa solo incidencias que necesitan migración
- No sobrescribe datos existentes
- Registra todos los cambios realizados

## Requisitos

### Variables de entorno requeridas:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Dependencias:

```bash
npm install @supabase/supabase-js dotenv
```

## Uso

### 1. Verificar estado actual

```bash
node migrate_existing_data.js
```

Esto mostrará:
- Total de incidencias en el sistema
- Cuántas ya tienen contexto estructurado
- Cuántas necesitan migración

### 2. Ejecutar migración

El script ejecutará automáticamente la migración después de mostrar el estado.

### 3. Verificar resultados

Al final, el script mostrará:
- Incidencias migradas exitosamente
- Errores encontrados
- Estado final del sistema

## Ejemplo de salida

```
🔧 Script de Migración de Datos - Sistema AIP
==================================================

🔍 Verificando estado de la migración...
📊 Estado actual:
   - Total incidencias: 150
   - Con contexto estructurado: 45
   - Con contexto de reserva: 30
   - Pendientes de migrar: 105

🚀 Iniciando migración de incidencias...
📊 Encontradas 105 incidencias para migrar

🔄 Procesando incidencia 1...
   📝 Extrayendo contexto de la descripción...
   ✅ Incidencia 1 migrada exitosamente
      - Grado: ✓
      - Sección: ✓
      - Área: ✗
      - Actividad: ✓

...

📈 Resumen de migración:
   ✅ Incidencias migradas: 98
   ❌ Errores: 7
   📊 Total procesadas: 105

🎉 Migración completada exitosamente!
```

## Estrategia de migración

### 1. Prioridad de fuentes de datos:

1. **Reservas del usuario** (más confiable)
2. **Parsing de descripción** (fallback)
3. **Valores por defecto** (null si no se encuentra)

### 2. Patrones de extracción de texto:

El script busca estos patrones en las descripciones:

- **Grado**: `grado: Primero`, `curso: Segundo`
- **Sección**: `sección: A`, `seccion: B`
- **Área**: `área: Matemáticas`, `area: Ciencias`
- **Actividad**: `actividad: Álgebra`, `clase: Geometría`

### 3. Mapeo de nombres a IDs:

El script busca coincidencias aproximadas (case-insensitive) en las tablas:
- `grades` → `reporter_grade_id`
- `sections` → `reporter_section_id`
- `areas` → `reporter_area_id`

## Consideraciones importantes

### ⚠️ Antes de ejecutar:

1. **Backup de la base de datos**: Siempre haz un respaldo antes de ejecutar
2. **Entorno de prueba**: Ejecuta primero en un entorno de desarrollo
3. **Verificar datos**: Revisa que las tablas `grades`, `sections`, `areas` estén pobladas
4. **Horario de mantenimiento**: Ejecuta durante horarios de bajo tráfico

### 🔧 Personalización:

Puedes modificar el script para:
- Agregar nuevos patrones de extracción
- Cambiar la lógica de mapeo de nombres
- Ajustar el formato del `booking_context`
- Agregar validaciones adicionales

## Solución de problemas

### Error: "Variables de entorno faltantes"

```bash
# Verifica que el archivo .env.local existe y contiene:
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Error: "No se encontró [tabla] con nombre"

Esto indica que el nombre extraído no coincide con los datos en la base de datos. Puedes:
1. Verificar los nombres en las tablas `grades`, `sections`, `areas`
2. Ajustar los patrones de extracción en el script
3. Agregar aliases o sinónimos

### Incidencias no migradas

Si algunas incidencias no se migran:
1. Revisa los logs para identificar errores específicos
2. Verifica que el usuario tenga reservas o información en la descripción
3. Considera migración manual para casos especiales

## Monitoreo post-migración

Después de la migración, verifica:

1. **Consulta de verificación**:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(reporter_grade_id) as with_grade,
  COUNT(reporter_section_id) as with_section,
  COUNT(reporter_area_id) as with_area,
  COUNT(booking_context) as with_booking
FROM incidents;
```

2. **Incidencias problemáticas**:
```sql
SELECT id, title, description
FROM incidents 
WHERE reporter_grade_id IS NULL 
  AND reporter_section_id IS NULL 
  AND reporter_area_id IS NULL;
```

3. **Validar contexto de reserva**:
```sql
SELECT booking_context
FROM incidents 
WHERE booking_context IS NOT NULL
LIMIT 5;
```

## Contacto

Si encuentras problemas durante la migración, revisa:
1. Los logs del script
2. La documentación en `REFACTORING_GUIDE.md`
3. Los archivos de migración SQL en `supabase/migrations/`
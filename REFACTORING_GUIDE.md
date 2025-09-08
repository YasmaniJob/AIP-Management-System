# Guía de Refactorización del Sistema de Mantenimiento

## Resumen de la Refactorización

Esta refactorización profunda del sistema de mantenimiento elimina la duplicación de datos y centraliza el manejo del contexto del usuario, haciendo el sistema más mantenible, eficiente y escalable.

## Problemas Identificados y Solucionados

### 🔴 Problemas Anteriores

1. **Duplicación de Información**: El contexto del docente (grado, sección, área) se almacenaba como texto concatenado en las descripciones
2. **Parsing con Expresiones Regulares**: Se usaban regex complejas para extraer información del texto
3. **Inconsistencia de Datos**: La información podía variar en formato y ser propensa a errores
4. **Dificultad de Mantenimiento**: Cambios en el formato requerían actualizar múltiples regex
5. **Performance**: Las consultas requerían procesamiento adicional para extraer información

### ✅ Soluciones Implementadas

1. **Modelo de Datos Estructurado**: Nuevas columnas en la tabla `incidents` para almacenar información estructurada
2. **Servicio Centralizado**: `UserContextService` maneja todo el contexto del usuario
3. **Tipos TypeScript**: Definiciones claras de interfaces para el contexto
4. **Migración Automática**: Script SQL para convertir datos existentes
5. **Pruebas Unitarias**: Cobertura completa del nuevo sistema

## Cambios Implementados

### 1. Modelo de Datos

#### Nuevas Columnas en `incidents`
```sql
-- Información estructurada del reportador
reporter_grade_id UUID REFERENCES public.grades(id),
reporter_section_id UUID REFERENCES public.sections(id), 
reporter_area_id UUID REFERENCES public.areas(id),

-- Contexto de la reserva en formato JSON
booking_context JSONB
```

#### Vista Actualizada
```sql
-- active_incidents incluye los nuevos campos con JOINs
CREATE OR REPLACE VIEW active_incidents AS
SELECT 
  i.*,
  rg.name as reporter_grade,
  rs.name as reporter_section,
  ra.name as reporter_area,
  ru.name as reported_by_name,
  rv.name as resolved_by_name
FROM public.incidents i
-- JOINs para obtener información estructurada
```

### 2. Tipos TypeScript

```typescript
// Contexto completo del usuario
interface UserContextInfo {
  userId: string;
  userName: string;
  gradeId: string | null;
  gradeName: string | null;
  sectionId: string | null;
  sectionName: string | null;
  areaId: string | null;
  areaName: string | null;
  recentBookings: any[];
}

// Contexto para incidencias
interface IncidentContext {
  gradeId: string | null;
  sectionId: string | null;
  areaId: string | null;
  bookingContext: BookingContext | null;
}

// Contexto de reserva
interface BookingContext {
  activity: string;
  activityDate: string;
}
```

### 3. Servicio de Contexto

```typescript
class UserContextService {
  // Obtener contexto completo del usuario
  async getUserContext(userId: string): Promise<UserContextInfo>
  
  // Obtener contexto específico para incidencias
  async getIncidentContext(userId: string): Promise<IncidentContext>
  
  // Información formateada para mostrar en UI
  async getContextDisplayInfo(userId: string): Promise<ContextDisplayInfo>
  
  // Validar contexto
  validateContext(context: IncidentContext): boolean
}
```

### 4. Acciones Refactorizadas

```typescript
// Creación de incidencias con contexto estructurado
export async function createIncidentAction(data: CreateIncidentData) {
  // Obtener contexto automáticamente si no se proporciona
  const context = data.context || await userContextService.getIncidentContext(userId);
  
  const incidentData = {
    // ... otros campos
    reporter_grade_id: context.gradeId,
    reporter_section_id: context.sectionId,
    reporter_area_id: context.areaId,
    booking_context: context.bookingContext
  };
}
```

### 5. Componentes UI Actualizados

```tsx
// Uso de campos estructurados en lugar de parsing
{incident.reporter_grade && (
  <div className="flex items-center gap-2 text-blue-600">
    <Users className="h-3 w-3" />
    <span>Grado: {incident.reporter_grade.name}</span>
  </div>
)}
```

## Migración de Datos

### Script de Migración

El archivo `20241229000001_migrate_existing_incidents_to_structured.sql` realiza:

1. **Extracción de Contexto**: Usa regex para extraer información de descripciones existentes
2. **Mapeo de Datos**: Relaciona nombres con IDs de grados, secciones y áreas
3. **Actualización de Registros**: Llena los nuevos campos estructurados
4. **Limpieza**: Remueve el contexto duplicado de las descripciones
5. **Índices**: Crea índices para optimizar consultas

### Proceso de Migración

```sql
-- 1. Extraer contexto usando función temporal
CREATE OR REPLACE FUNCTION extract_incident_context(description TEXT)

-- 2. Actualizar incidencias con información estructurada
UPDATE public.incidents SET 
  reporter_grade_id = mapped_grade_id,
  reporter_section_id = mapped_section_id,
  reporter_area_id = mapped_area_id,
  booking_context = generated_booking_context

-- 3. Limpiar descripciones
UPDATE public.incidents SET 
  description = regexp_replace(description, 'Contexto del reporte:[^\n]*\n?', '', 'g')
```

## Beneficios de la Refactorización

### 🚀 Performance
- **Consultas más rápidas**: No más regex en tiempo de ejecución
- **Índices optimizados**: Búsquedas eficientes por grado, sección, área
- **JOINs directos**: Relaciones normalizadas en lugar de parsing

### 🛠️ Mantenibilidad
- **Código más limpio**: Eliminación de regex complejas
- **Tipos seguros**: TypeScript previene errores de tipos
- **Servicio centralizado**: Un solo lugar para manejar contexto
- **Pruebas unitarias**: Cobertura completa del nuevo sistema

### 📊 Consistencia de Datos
- **Formato estandarizado**: Estructura JSON para contexto de reservas
- **Relaciones normalizadas**: Foreign keys garantizan integridad
- **Validación**: Funciones de validación de contexto

### 🔧 Escalabilidad
- **Fácil extensión**: Agregar nuevos campos de contexto es simple
- **Reutilización**: El servicio de contexto puede usarse en otros módulos
- **Flexibilidad**: Contexto JSON permite datos dinámicos

## Archivos Modificados

### Migraciones
- `migrations/20241229000000_add_structured_context_to_incidents.sql`
- `migrations/20241229000001_migrate_existing_incidents_to_structured.sql`

### Tipos y Servicios
- `src/lib/types/incident-context.ts` (nuevo)
- `src/lib/services/user-context-service.ts` (nuevo)

### Acciones y Datos
- `src/lib/actions/maintenance.ts` (refactorizado)
- `src/lib/actions/incidents.ts` (refactorizado)
- `src/lib/data/incidents.ts` (refactorizado)
- `src/lib/data/maintenance.ts` (refactorizado)

### Componentes UI
- `src/components/incidents/incidents-management-view.tsx` (actualizado)

### Pruebas
- `src/lib/services/__tests__/user-context-service.test.ts` (nuevo)
- `src/lib/actions/__tests__/incidents.test.ts` (nuevo)

## Próximos Pasos

### Recomendaciones Futuras

1. **Monitoreo**: Implementar métricas para comparar performance antes/después
2. **Validación**: Agregar validaciones adicionales en el frontend
3. **Extensión**: Considerar aplicar el mismo patrón a otros módulos
4. **Optimización**: Revisar y optimizar consultas según uso real

### Consideraciones de Deployment

1. **Backup**: Realizar backup completo antes de ejecutar migraciones
2. **Pruebas**: Ejecutar migraciones en ambiente de staging primero
3. **Rollback**: Tener plan de rollback en caso de problemas
4. **Monitoreo**: Vigilar performance post-deployment

## Conclusión

Esta refactorización transforma el sistema de mantenimiento de un enfoque basado en texto y regex a un modelo de datos estructurado y mantenible. Los beneficios incluyen mejor performance, mayor consistencia de datos, código más limpio y un sistema más escalable para futuras mejoras.

La inversión en esta refactorización pagará dividendos a largo plazo en términos de mantenibilidad, performance y capacidad de extensión del sistema.
-- =====================================================
-- OPTIMIZACIÓN INTEGRAL DEL SISTEMA DE MANTENIMIENTO
-- Versión Final - Implementación Recomendada
-- =====================================================

-- 1. CONSOLIDACIÓN DE TABLAS PRINCIPALES
-- =====================================================

-- Crear tabla unificada optimizada (si no existe)
CREATE TABLE IF NOT EXISTS maintenance_optimized (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Información del recurso (desnormalizada para rendimiento)
    resource_id UUID NOT NULL REFERENCES resources(id),
    resource_number VARCHAR(50) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    resource_category VARCHAR(100) NOT NULL,
    resource_brand VARCHAR(100),
    resource_model VARCHAR(100),
    
    -- Información del mantenimiento
    maintenance_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority maintenance_priority DEFAULT 'Media',
    
    -- Estado simplificado (solo 4 estados)
    status maintenance_status_simple DEFAULT 'pending',
    
    -- Información del reportero (desnormalizada)
    reporter_name VARCHAR(255),
    reporter_grade VARCHAR(50),
    reporter_section VARCHAR(50),
    
    -- Fechas críticas
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    
    -- Información técnica
    assigned_technician VARCHAR(255),
    repair_notes TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT chk_dates CHECK (actual_completion_date >= report_date),
    CONSTRAINT chk_status_completion CHECK (
        (status = 'completed' AND actual_completion_date IS NOT NULL) OR
        (status != 'completed')
    )
);

-- 2. TIPOS ENUM SIMPLIFICADOS
-- =====================================================

DO $$ 
BEGIN
    -- Crear enum para estado simplificado si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_status_simple') THEN
        CREATE TYPE maintenance_status_simple AS ENUM (
            'pending',      -- Pendiente
            'in_progress',  -- En progreso
            'completed',    -- Completado
            'cancelled'     -- Cancelado
        );
    END IF;
    
    -- Crear enum para prioridad si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_priority') THEN
        CREATE TYPE maintenance_priority AS ENUM (
            'Baja',
            'Media', 
            'Alta',
            'Crítica'
        );
    END IF;
END $$;

-- 3. ÍNDICES OPTIMIZADOS
-- =====================================================

-- Índice principal por estado y prioridad
CREATE INDEX IF NOT EXISTS idx_maintenance_opt_status_priority 
ON maintenance_optimized(status, priority) 
WHERE status != 'completed';

-- Índice por recurso para búsquedas específicas
CREATE INDEX IF NOT EXISTS idx_maintenance_opt_resource 
ON maintenance_optimized(resource_id, status);

-- Índice por categoría para filtros
CREATE INDEX IF NOT EXISTS idx_maintenance_opt_category 
ON maintenance_optimized(resource_category, status);

-- Índice por fechas para reportes
CREATE INDEX IF NOT EXISTS idx_maintenance_opt_dates 
ON maintenance_optimized(report_date DESC, estimated_completion_date);

-- Índice de texto completo para búsquedas
CREATE INDEX IF NOT EXISTS idx_maintenance_opt_search 
ON maintenance_optimized USING gin(
    to_tsvector('spanish', 
        COALESCE(resource_number, '') || ' ' ||
        COALESCE(resource_name, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(reporter_name, '')
    )
);

-- 4. VISTAS OPTIMIZADAS
-- =====================================================

-- Vista para mantenimientos activos
CREATE OR REPLACE VIEW maintenance_active_optimized AS
SELECT 
    id,
    resource_id,
    resource_number,
    resource_name,
    resource_category,
    maintenance_type,
    description,
    priority,
    status,
    reporter_name,
    report_date,
    estimated_completion_date,
    assigned_technician,
    created_at,
    -- Calcular si está vencido
    CASE 
        WHEN estimated_completion_date < CURRENT_DATE THEN true
        ELSE false
    END as is_overdue,
    -- Días desde reporte
    CURRENT_DATE - report_date as days_since_report
FROM maintenance_optimized
WHERE status IN ('pending', 'in_progress')
ORDER BY 
    CASE priority 
        WHEN 'Crítica' THEN 1
        WHEN 'Alta' THEN 2
        WHEN 'Media' THEN 3
        WHEN 'Baja' THEN 4
    END,
    report_date ASC;

-- Vista para historial completado
CREATE OR REPLACE VIEW maintenance_history_optimized AS
SELECT 
    id,
    resource_id,
    resource_number,
    resource_name,
    resource_category,
    maintenance_type,
    description,
    priority,
    reporter_name,
    report_date,
    actual_completion_date,
    assigned_technician,
    repair_notes,
    actual_cost,
    completed_at,
    -- Tiempo de resolución en días
    actual_completion_date - report_date as resolution_days
FROM maintenance_optimized
WHERE status = 'completed'
ORDER BY completed_at DESC;

-- 5. FUNCIONES OPTIMIZADAS
-- =====================================================

-- Función para estadísticas rápidas
CREATE OR REPLACE FUNCTION get_maintenance_stats_optimized()
RETURNS TABLE(
    total_active bigint,
    pending_count bigint,
    in_progress_count bigint,
    overdue_count bigint,
    completed_this_month bigint,
    avg_resolution_days numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress')) as total_active,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (
            WHERE status IN ('pending', 'in_progress') 
            AND estimated_completion_date < CURRENT_DATE
        ) as overdue_count,
        COUNT(*) FILTER (
            WHERE status = 'completed' 
            AND completed_at >= date_trunc('month', CURRENT_DATE)
        ) as completed_this_month,
        AVG(
            CASE 
                WHEN status = 'completed' AND actual_completion_date IS NOT NULL
                THEN actual_completion_date - report_date
                ELSE NULL
            END
        ) as avg_resolution_days
    FROM maintenance_optimized;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGERS OPTIMIZADOS
-- =====================================================

-- Función para trigger de actualización
CREATE OR REPLACE FUNCTION update_maintenance_optimized_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar timestamp
    NEW.updated_at = now();
    
    -- Auto-completar cuando cambia a completado
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = now();
        IF NEW.actual_completion_date IS NULL THEN
            NEW.actual_completion_date = CURRENT_DATE;
        END IF;
    END IF;
    
    -- Limpiar completed_at si ya no está completado
    IF NEW.status != 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_maintenance_optimized ON maintenance_optimized;
CREATE TRIGGER trigger_update_maintenance_optimized
    BEFORE UPDATE ON maintenance_optimized
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_optimized_trigger();

-- 7. FUNCIÓN DE MIGRACIÓN DE DATOS
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_to_optimized_table()
RETURNS void AS $$
BEGIN
    -- Migrar desde maintenance_unified si existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_unified') THEN
        INSERT INTO maintenance_optimized (
            resource_id, resource_number, resource_name, resource_category,
            resource_brand, resource_model, maintenance_type, description,
            priority, status, reporter_name, reporter_grade, reporter_section,
            report_date, estimated_completion_date, actual_completion_date,
            assigned_technician, repair_notes, estimated_cost, actual_cost,
            created_at, updated_at, completed_at
        )
        SELECT 
            resource_id, resource_number, resource_brand || ' ' || resource_model,
            resource_category, resource_brand, resource_model, maintenance_type,
            damage_description, 
            COALESCE(priority::maintenance_priority, 'Media'),
            CASE current_status
                WHEN 'Completado' THEN 'completed'::maintenance_status_simple
                WHEN 'En Progreso' THEN 'in_progress'::maintenance_status_simple
                WHEN 'Programado' THEN 'in_progress'::maintenance_status_simple
                ELSE 'pending'::maintenance_status_simple
            END,
            reporter_teacher_name, reporter_grade, reporter_section,
            report_date, estimated_completion_date, 
            CASE WHEN current_status = 'Completado' THEN report_date ELSE NULL END,
            assigned_technician, repair_notes, NULL, NULL,
            created_at, updated_at,
            CASE WHEN current_status = 'Completado' THEN updated_at ELSE NULL END
        FROM maintenance_unified
        WHERE NOT EXISTS (
            SELECT 1 FROM maintenance_optimized mo 
            WHERE mo.resource_id = maintenance_unified.resource_id 
            AND mo.report_date = maintenance_unified.report_date
        );
    END IF;
    
    RAISE NOTICE 'Migración completada exitosamente';
END;
$$ LANGUAGE plpgsql;

-- 8. POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE maintenance_optimized ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública
CREATE POLICY "maintenance_optimized_read" ON maintenance_optimized
    FOR SELECT USING (true);

-- Política para inserción por usuarios autenticados
CREATE POLICY "maintenance_optimized_insert" ON maintenance_optimized
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para actualización por usuarios autenticados
CREATE POLICY "maintenance_optimized_update" ON maintenance_optimized
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 9. VERIFICACIÓN Y ESTADÍSTICAS
-- =====================================================

-- Mostrar estadísticas de la tabla optimizada
SELECT 
    'maintenance_optimized' as tabla,
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
    COUNT(*) FILTER (WHERE status = 'in_progress') as en_progreso,
    COUNT(*) FILTER (WHERE status = 'completed') as completados
FROM maintenance_optimized;

-- Mostrar estadísticas usando la función optimizada
SELECT * FROM get_maintenance_stats_optimized();

-- =====================================================
-- COMENTARIOS Y RECOMENDACIONES
-- =====================================================

/*
BENEFICIOS DE ESTA OPTIMIZACIÓN:

1. RENDIMIENTO:
   - Tabla única elimina JOINs costosos
   - Índices especializados para consultas frecuentes
   - Campos desnormalizados reducen complejidad

2. SIMPLICIDAD:
   - Solo 4 estados de mantenimiento
   - Estructura clara y consistente
   - Menos tablas que mantener

3. ESCALABILIDAD:
   - Índices optimizados para grandes volúmenes
   - Vistas especializadas para casos de uso
   - Funciones eficientes para estadísticas

4. MANTENIBILIDAD:
   - Código SQL más simple
   - Menos dependencias entre tablas
   - Triggers automáticos para consistencia

PARA IMPLEMENTAR:
1. Ejecutar este script en orden
2. Ejecutar migrate_to_optimized_table()
3. Actualizar código de aplicación
4. Probar rendimiento
5. Deprecar tablas antiguas gradualmente
*/

-- Fin del script de optimización
-- Script para borrar todos los datos de las tablas y empezar de cero.
-- ADVERTENCIA: Esta acción es irreversible y eliminará TODOS los datos de la aplicación.

-- El uso de TRUNCATE es más rápido que DELETE y resetea las secuencias de autoincremento.
-- La opción CASCADE se encarga de las dependencias (foreign keys) automáticamente.

TRUNCATE TABLE
  public.areas,
  public.bookings,
  public.categories,
  public.grades,
  public.loan_resources,
  public.loans,
  public.meeting_participant_groups,
  public.meeting_tasks,
  public.meetings,
  public.pedagogical_hours,
  public.resources,
  public.sections,
  public.system_settings,
  public.users,
  auth.users
CASCADE;

-- Mensaje de confirmación para el usuario
SELECT '¡Todas las tablas han sido vaciadas exitosamente!';

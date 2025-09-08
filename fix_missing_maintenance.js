// Script para corregir registros de mantenimiento faltantes
// Usar con: npm run dev y luego acceder a /api/fix-maintenance

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://jwefuiojqgwizjcumynm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZWZ1aW9qcWd3aXpqY3VteW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODczMTMsImV4cCI6MjA3MDI2MzMxM30.daIRYz_anv8YqqZ0TYZ--qmPmmXqZm7lQ-UqEa5Ilzo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMissingMaintenanceRecords() {
  try {
    console.log('=== Corrigiendo registros de mantenimiento faltantes ===\n');
    
    // 1. Buscar préstamos devueltos con daños
    const { data: loansWithDamages, error: loansError } = await supabase
      .from('loans')
      .select('id, actual_return_date, notes')
      .eq('status', 'Devuelto')
      .not('notes', 'is', null)
      .ilike('notes', '%Daños:%')
      .order('actual_return_date', { ascending: false });
    
    if (loansError) {
      console.error('Error obteniendo préstamos:', loansError);
      return;
    }
    
    console.log(`Encontrados ${loansWithDamages?.length || 0} préstamos con daños reportados\n`);
    
    let recordsCreated = 0;
    
    for (const loan of loansWithDamages || []) {
      console.log(`--- Procesando préstamo: ${loan.id} ---`);
      
      // Extraer IDs de recursos de las notas
      const resourceMatches = loan.notes.match(/\[Recurso ID ([a-f0-9-]+)\]/g);
      
      if (resourceMatches) {
        for (const match of resourceMatches) {
          const resourceId = match.match(/\[Recurso ID ([a-f0-9-]+)\]/)[1];
          
          // Verificar si este recurso tiene daños reportados en las notas
          const resourceSection = loan.notes.match(
            new RegExp(`\\[Recurso ID ${resourceId}\\][\\s\\S]*?(?=\\[Recurso ID|$)`, 'i')
          );
          
          if (resourceSection && resourceSection[0].includes('Daños:')) {
            console.log(`Recurso con daños: ${resourceId}`);
            
            // Verificar si ya existe un registro de mantenimiento
            const { data: existingMaintenance } = await supabase
              .from('maintenance_tracking')
              .select('id')
              .eq('resource_id', resourceId)
              .limit(1);
            
            if (!existingMaintenance || existingMaintenance.length === 0) {
              console.log('  ✗ No tiene registro de mantenimiento');
              
              // Extraer información de daños
              const damageMatch = resourceSection[0].match(/Daños: \[([^\]]+)\]/);
              const damages = damageMatch ? damageMatch[1] : 'Daños no especificados';
              
              console.log(`  Daños: ${damages}`);
              
              // Crear registro de mantenimiento
               const incidentDescription = `Daños reportados: ${damages}\n\nRegistro creado automáticamente por corrección de datos faltantes.\nFecha original del reporte: ${loan.actual_return_date}`;
               
               const { data: newMaintenance, error: createError } = await supabase
                 .from('maintenance_tracking')
                 .insert({
                   resource_id: resourceId,
                   maintenance_type: 'Correctivo',
                   incident_category: 'daño',
                   incident_description: incidentDescription,
                   current_status: 'Pendiente',
                   created_at: loan.actual_return_date,
                   updated_at: loan.actual_return_date
                 })
                 .select('id')
                 .single();
              
              if (createError) {
                console.error(`  Error creando registro:`, createError);
              } else {
                console.log(`  ✓ Registro creado: ${newMaintenance.id}`);
                recordsCreated++;
                
                // Actualizar estado del recurso
                const { error: updateError } = await supabase
                  .from('resources')
                  .update({ status: 'En Mantenimiento' })
                  .eq('id', resourceId);
                
                if (updateError) {
                  console.error(`  Error actualizando recurso:`, updateError);
                } else {
                  console.log(`  ✓ Estado del recurso actualizado`);
                }
              }
            } else {
              console.log(`  ✓ Ya tiene registro de mantenimiento`);
            }
          }
        }
      }
      
      console.log('');
    }
    
    console.log(`\n=== Proceso completado ===`);
    console.log(`Registros de mantenimiento creados: ${recordsCreated}`);
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixMissingMaintenanceRecords();
}

module.exports = { fixMissingMaintenanceRecords };
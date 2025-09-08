// migrate_existing_data.js
// Script para migrar datos existentes al nuevo formato estructurado

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para extraer información usando regex (solo para migración)
function extractContextFromDescription(description) {
  if (!description) return {};
  
  const context = {};
  
  // Extraer grado
  const gradeMatch = description.match(/(?:grado|curso)\s*:?\s*([^\n,]+)/i);
  if (gradeMatch) {
    context.gradeName = gradeMatch[1].trim();
  }
  
  // Extraer sección
  const sectionMatch = description.match(/(?:sección|seccion)\s*:?\s*([^\n,]+)/i);
  if (sectionMatch) {
    context.sectionName = sectionMatch[1].trim();
  }
  
  // Extraer área
  const areaMatch = description.match(/(?:área|area)\s*:?\s*([^\n,]+)/i);
  if (areaMatch) {
    context.areaName = areaMatch[1].trim();
  }
  
  // Extraer actividad
  const activityMatch = description.match(/(?:actividad|clase)\s*:?\s*([^\n,]+)/i);
  if (activityMatch) {
    context.activity = activityMatch[1].trim();
  }
  
  return context;
}

// Función para buscar ID por nombre
async function findIdByName(table, name, nameColumn = 'name') {
  if (!name) return null;
  
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .ilike(nameColumn, name.trim())
    .limit(1)
    .single();
  
  if (error || !data) {
    console.log(`⚠️  No se encontró ${table} con nombre: "${name}"`);
    return null;
  }
  
  return data.id;
}

// Función para obtener el contexto del usuario desde reservas recientes
async function getUserContextFromBookings(userId) {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      activity,
      date,
      grade:grades(id, name),
      section:sections(id, name),
      area:areas(id, name)
    `)
    .eq('teacher_id', userId)
    .order('date', { ascending: false })
    .limit(1);
  
  if (error || !bookings || bookings.length === 0) {
    return {};
  }
  
  const booking = bookings[0];
  return {
    gradeId: booking.grade?.id,
    sectionId: booking.section?.id,
    areaId: booking.area?.id,
    activity: booking.activity,
    activityDate: booking.date
  };
}

// Función principal de migración
async function migrateIncidents() {
  console.log('🚀 Iniciando migración de incidencias...');
  
  try {
    // Obtener todas las incidencias que no tienen contexto estructurado
    const { data: incidents, error: fetchError } = await supabase
      .from('incidents')
      .select(`
        id,
        description,
        reported_by,
        reporter_grade_id,
        reporter_section_id,
        reporter_area_id,
        booking_context
      `)
      .or('reporter_grade_id.is.null,reporter_section_id.is.null,reporter_area_id.is.null');
    
    if (fetchError) {
      throw new Error(`Error al obtener incidencias: ${fetchError.message}`);
    }
    
    console.log(`📊 Encontradas ${incidents.length} incidencias para migrar`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const incident of incidents) {
      try {
        console.log(`\n🔄 Procesando incidencia ${incident.id}...`);
        
        // 1. Intentar obtener contexto desde reservas del usuario
        let context = await getUserContextFromBookings(incident.reported_by);
        
        // 2. Si no hay contexto desde reservas, extraer de la descripción
        if (!context.gradeId && !context.sectionId && !context.areaId) {
          console.log('   📝 Extrayendo contexto de la descripción...');
          const extractedContext = extractContextFromDescription(incident.description);
          
          // Buscar IDs por nombres extraídos
          if (extractedContext.gradeName) {
            context.gradeId = await findIdByName('grades', extractedContext.gradeName);
          }
          if (extractedContext.sectionName) {
            context.sectionId = await findIdByName('sections', extractedContext.sectionName);
          }
          if (extractedContext.areaName) {
            context.areaId = await findIdByName('areas', extractedContext.areaName);
          }
          if (extractedContext.activity) {
            context.activity = extractedContext.activity;
          }
        }
        
        // 3. Preparar datos de actualización
        const updateData = {
          reporter_grade_id: context.gradeId || incident.reporter_grade_id,
          reporter_section_id: context.sectionId || incident.reporter_section_id,
          reporter_area_id: context.areaId || incident.reporter_area_id,
          updated_at: new Date().toISOString()
        };
        
        // 4. Actualizar booking_context si hay actividad
        if (context.activity && !incident.booking_context) {
          updateData.booking_context = {
            activity: context.activity,
            activityDate: context.activityDate || new Date().toISOString().split('T')[0]
          };
        }
        
        // 5. Actualizar la incidencia
        const { error: updateError } = await supabase
          .from('incidents')
          .update(updateData)
          .eq('id', incident.id);
        
        if (updateError) {
          throw new Error(`Error al actualizar: ${updateError.message}`);
        }
        
        console.log(`   ✅ Incidencia ${incident.id} migrada exitosamente`);
        console.log(`      - Grado: ${context.gradeId ? '✓' : '✗'}`);
        console.log(`      - Sección: ${context.sectionId ? '✓' : '✗'}`);
        console.log(`      - Área: ${context.areaId ? '✓' : '✗'}`);
        console.log(`      - Actividad: ${context.activity ? '✓' : '✗'}`);
        
        migratedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error procesando incidencia ${incident.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Resumen de migración:');
    console.log(`   ✅ Incidencias migradas: ${migratedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📊 Total procesadas: ${incidents.length}`);
    
    if (migratedCount > 0) {
      console.log('\n🎉 Migración completada exitosamente!');
    }
    
  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    process.exit(1);
  }
}

// Función para verificar el estado antes de la migración
async function checkMigrationStatus() {
  console.log('🔍 Verificando estado de la migración...');
  
  try {
    const { data: incidents, error } = await supabase
      .from('incidents')
      .select('id, reporter_grade_id, reporter_section_id, reporter_area_id, booking_context')
      .limit(1000);
    
    if (error) {
      throw new Error(`Error al verificar estado: ${error.message}`);
    }
    
    const withContext = incidents.filter(i => 
      i.reporter_grade_id || i.reporter_section_id || i.reporter_area_id
    ).length;
    
    const withBookingContext = incidents.filter(i => i.booking_context).length;
    
    console.log(`📊 Estado actual:`);
    console.log(`   - Total incidencias: ${incidents.length}`);
    console.log(`   - Con contexto estructurado: ${withContext}`);
    console.log(`   - Con contexto de reserva: ${withBookingContext}`);
    console.log(`   - Pendientes de migrar: ${incidents.length - withContext}`);
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error.message);
  }
}

// Ejecutar script
async function main() {
  console.log('🔧 Script de Migración de Datos - Sistema AIP');
  console.log('=' .repeat(50));
  
  await checkMigrationStatus();
  
  console.log('\n¿Desea continuar con la migración? (y/N)');
  
  // En un entorno de producción, podrías usar readline para confirmación
  // Por ahora, ejecutamos directamente
  await migrateIncidents();
  
  console.log('\n🔍 Verificando estado final...');
  await checkMigrationStatus();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  migrateIncidents,
  checkMigrationStatus,
  extractContextFromDescription,
  findIdByName,
  getUserContextFromBookings
};
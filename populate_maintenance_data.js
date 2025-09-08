// Script para poblar datos de mantenimiento desde recursos dañados
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para extraer tipos de daño de las notas
function extractDamageTypes(notes) {
  if (!notes) return [];
  
  const damageMatch = notes.match(/Daños:\s*\[([^\]]+)\]/);
  if (!damageMatch) return [];
  
  return damageMatch[1]
    .split(',')
    .map(damage => damage.trim())
    .filter(damage => damage.length > 0);
}

async function populateMaintenanceData() {
  console.log('🔄 Poblando datos de mantenimiento...');
  
  try {
    // 1. Obtener recursos que requieren mantenimiento
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select(`
        id,
        number,
        brand,
        model,
        notes,
        status,
        created_at,
        category:categories(id, name, type)
      `)
      .in('status', ['Dañado', 'En Mantenimiento']);
      
    if (resourcesError) {
      console.error('❌ Error obteniendo recursos:', resourcesError);
      return;
    }
    
    console.log(`✅ Encontrados ${resources?.length || 0} recursos que requieren mantenimiento`);
    
    if (!resources || resources.length === 0) {
      console.log('ℹ️ No hay recursos que requieran mantenimiento');
      return;
    }
    
    // 2. Crear incidencias individuales para cada recurso
    for (const resource of resources) {
      console.log(`\n📋 Procesando recurso ${resource.number} (${resource.brand})`);
      
      const damageTypes = extractDamageTypes(resource.notes);
      console.log(`   Daños encontrados: ${damageTypes.join(', ')}`);
      
      if (damageTypes.length === 0) {
        // Si no hay daños específicos, crear una incidencia genérica
        damageTypes.push('Mantenimiento General');
      }
      
      // Crear una incidencia por cada tipo de daño
      for (let i = 0; i < damageTypes.length; i++) {
        const damageType = damageTypes[i];
        const incidentData = {
          resource_id: resource.id,
          incident_number: i + 1, // Número secuencial por recurso
          damage_type: damageType,
          damage_description: `Incidencia migrada desde recurso ${resource.number}`,
          incident_context: `Recurso: ${resource.brand} ${resource.model || ''} - Estado original: ${resource.status}`,
          current_status: resource.status === 'Dañado' ? 'Pendiente' : 'En Proceso',
          priority: 'Media',
          created_at: resource.created_at
        };
        
        const { error: incidentError } = await supabase
          .from('maintenance_incidents_individual')
          .insert(incidentData);
          
        if (incidentError) {
          console.error(`   ❌ Error creando incidencia para ${damageType}:`, incidentError);
        } else {
          console.log(`   ✅ Incidencia creada: ${damageType}`);
        }
      }
    }
    
    // 3. Verificar resultados
    const { data: incidents, error: incidentsError } = await supabase
      .from('maintenance_incidents_individual')
      .select('*');
      
    if (incidentsError) {
      console.error('❌ Error verificando incidencias:', incidentsError);
    } else {
      console.log(`\n✅ Total de incidencias creadas: ${incidents?.length || 0}`);
    }
    
    // 4. Verificar resumen de recursos
    const { data: summary, error: summaryError } = await supabase
      .from('maintenance_resource_summary')
      .select('*');
      
    if (summaryError) {
      console.error('❌ Error verificando resumen:', summaryError);
    } else {
      console.log(`✅ Recursos en resumen: ${summary?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

populateMaintenanceData().catch(console.error);
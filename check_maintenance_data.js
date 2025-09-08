// Script temporal para verificar datos de mantenimiento
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables de entorno faltantes:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMaintenanceData() {
  console.log('🔍 Verificando datos de mantenimiento...');
  
  // 1. Verificar tabla maintenance_resource_summary
  const { data: summaryData, error: summaryError } = await supabase
    .from('maintenance_resource_summary')
    .select('*')
    .limit(5);
    
  if (summaryError) {
    console.error('❌ Error en maintenance_resource_summary:', summaryError);
  } else {
    console.log('✅ Registros en maintenance_resource_summary:', summaryData?.length || 0);
    if (summaryData && summaryData.length > 0) {
      console.log('📋 Primeros registros:', JSON.stringify(summaryData.slice(0, 2), null, 2));
    }
  }
  
  // 2. Verificar tabla maintenance_incidents_individual
  const { data: incidentsData, error: incidentsError } = await supabase
    .from('maintenance_incidents_individual')
    .select('*')
    .limit(5);
    
  if (incidentsError) {
    console.error('❌ Error en maintenance_incidents_individual:', incidentsError);
  } else {
    console.log('✅ Registros en maintenance_incidents_individual:', incidentsData?.length || 0);
    if (incidentsData && incidentsData.length > 0) {
      console.log('📋 Primeros registros:', JSON.stringify(incidentsData.slice(0, 2), null, 2));
    }
  }
  
  // 3. Verificar recursos que requieren mantenimiento (no completados)
  const { data: requiresData, error: requiresError } = await supabase
    .from('maintenance_resource_summary')
    .select(`
      *,
      resource:resources(
        id,
        number,
        brand,
        model,
        category:categories(name, type)
      )
    `)
    .neq('overall_status', 'Completado')
    .limit(5);
    
  if (requiresError) {
    console.error('❌ Error obteniendo recursos que requieren mantenimiento:', requiresError);
  } else {
    console.log('✅ Recursos que requieren mantenimiento:', requiresData?.length || 0);
    if (requiresData && requiresData.length > 0) {
      console.log('📋 Recursos encontrados:', JSON.stringify(requiresData.slice(0, 2), null, 2));
    }
  }
}

checkMaintenanceData().catch(console.error);
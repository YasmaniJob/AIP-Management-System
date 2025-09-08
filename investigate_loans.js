const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pjyoqkqhqnqjvfqzgqzv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqeW9xa3FocW5xanZmcXpncXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzI4NzEsImV4cCI6MjA1MDA0ODg3MX0.Ey_Ej7Ej8vJBmBdVJGKX5r1X8vJBmBdVJGKX5r1X8vJ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateFailedLoans() {
  try {
    console.log('=== Investigando préstamos fallidos ===\n');
    
    // Buscar préstamos devueltos con notas que contengan "Daños:"
    const { data: loansWithDamages, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'Devuelto')
      .not('notes', 'is', null)
      .ilike('notes', '%Daños:%')
      .order('actual_return_date', { ascending: false })
      .limit(10);
    
    if (loansError) {
      console.error('Error obteniendo préstamos:', loansError);
      return;
    }
    
    console.log(`Encontrados ${loansWithDamages?.length || 0} préstamos con daños reportados\n`);
    
    for (const loan of loansWithDamages || []) {
      console.log(`--- Préstamo: ${loan.id} ---`);
      console.log(`Fecha devolución: ${loan.actual_return_date}`);
      console.log(`Notas:`);
      console.log(loan.notes);
      
      // Extraer IDs de recursos de las notas
      const resourceMatches = loan.notes.match(/\[Recurso ID ([a-f0-9-]+)\]/g);
      if (resourceMatches) {
        for (const match of resourceMatches) {
          const resourceId = match.match(/\[Recurso ID ([a-f0-9-]+)\]/)[1];
          console.log(`\nRecurso: ${resourceId}`);
          
          // Verificar si tiene daños reportados
          const hasDamages = loan.notes.includes(`[Recurso ID ${resourceId}]`) && 
                           loan.notes.includes('Daños:');
          
          if (hasDamages) {
            console.log('✓ Tiene daños reportados');
            
            // Verificar registro de mantenimiento
            const { data: maintenance, error: maintenanceError } = await supabase
              .from('maintenance_tracking')
              .select('*')
              .eq('resource_id', resourceId)
              .order('created_at', { ascending: false });
            
            if (maintenance && maintenance.length > 0) {
              console.log(`✓ Registro de mantenimiento encontrado: ${maintenance[0].id}`);
              console.log(`  Estado: ${maintenance[0].current_status}`);
              console.log(`  Tipo: ${maintenance[0].maintenance_type}`);
            } else {
              console.log('✗ NO hay registro de mantenimiento');
              
              // Verificar estado actual del recurso
              const { data: resource } = await supabase
                .from('resources')
                .select('status')
                .eq('id', resourceId)
                .single();
              
              if (resource) {
                console.log(`  Estado actual del recurso: ${resource.status}`);
              }
            }
          } else {
            console.log('- No tiene daños reportados');
          }
        }
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    }
    
  } catch (error) {
    console.error('Error en la investigación:', error);
  }
}

investigateFailedLoans();
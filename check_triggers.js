const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
  console.log('Checking for triggers and functions...');
  
  try {
    // Intentar consultar triggers
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            trigger_name, 
            event_manipulation, 
            event_object_table,
            action_statement
          FROM information_schema.triggers 
          WHERE event_object_table = 'loans';
        `
      });
    
    if (triggerError) {
      console.log('Cannot query triggers directly:', triggerError.message);
    } else {
      console.log('Triggers on loans table:', triggers);
    }
    
    // Intentar consultar funciones que contengan 'loan' o 'overdue'
    const { data: functions, error: funcError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            routine_name,
            routine_definition
          FROM information_schema.routines 
          WHERE routine_definition ILIKE '%loan%' 
             OR routine_definition ILIKE '%overdue%'
             OR routine_definition ILIKE '%GREATEST%';
        `
      });
    
    if (funcError) {
      console.log('Cannot query functions directly:', funcError.message);
    } else {
      console.log('Functions related to loans:', functions);
    }
    
    // Intentar una actualización simple sin days_overdue
    console.log('\nTesting simple update without days_overdue...');
    const { data: updateResult, error: updateError } = await supabase
      .from('loans')
      .update({ notes: 'Test update - ' + new Date().toISOString() })
      .eq('id', '307c7218-dfbb-422c-96ff-4faf2361cf8d')
      .select();
    
    if (updateError) {
      console.error('Error in simple update:', updateError);
    } else {
      console.log('Simple update successful:', updateResult[0]?.notes);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTriggers();
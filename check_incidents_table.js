require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncidentsStructure() {
  try {
    console.log('Checking incidents table structure...');
    
    // Intentar insertar un registro mínimo para ver qué columnas faltan
    const testData = {
      title: 'Test incident'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('incidents')
      .insert(testData)
      .select();
      
    if (insertError) {
      console.error('Insert error:', insertError);
      console.log('Error details:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('Insert successful:', insertResult);
      
      // Limpiar el registro de prueba
      if (insertResult && insertResult[0]) {
        await supabase.from('incidents').delete().eq('id', insertResult[0].id);
        console.log('Test record cleaned up');
      }
    }
    
    // Intentar con más campos
    console.log('\nTrying with more fields...');
    const testData2 = {
      title: 'Test incident 2',
      description: 'Test description',
      status: 'Reportado',
      type: 'Daño'
    };
    
    const { data: insertResult2, error: insertError2 } = await supabase
      .from('incidents')
      .insert(testData2)
      .select();
      
    if (insertError2) {
      console.error('Insert error 2:', insertError2);
    } else {
      console.log('Insert 2 successful:', insertResult2);
      
      // Limpiar el registro de prueba
      if (insertResult2 && insertResult2[0]) {
        await supabase.from('incidents').delete().eq('id', insertResult2[0].id);
        console.log('Test record 2 cleaned up');
      }
    }
    
    // Verificar si hay algún registro existente para ver la estructura
    console.log('\nChecking for any existing records...');
    const { data: existingRecords, error: selectError } = await supabase
      .from('incidents')
      .select('*')
      .limit(1);
      
    if (selectError) {
      console.error('Select error:', selectError);
    } else {
      console.log('Existing records:', existingRecords);
      if (existingRecords && existingRecords.length > 0) {
        console.log('Record structure:', Object.keys(existingRecords[0]));
      }
    }
    
    // Intentar obtener información del esquema usando una consulta SQL directa
    console.log('\nTrying to get schema info...');
    const { data: schemaInfo, error: schemaError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'incidents' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (schemaError) {
      console.log('Schema RPC failed:', schemaError.message);
    } else {
      console.log('Schema info:', schemaInfo);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkIncidentsStructure();
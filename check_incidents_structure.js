// Script para verificar la estructura actual de la tabla incidents
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rnqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWpxanFqcWpxanFqcWpxaiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0NTU4NzA5LCJleHAiOjIwNTAxMzQ3MDl9.kEf4EyVgLJtJtJtJtJtJtJtJtJtJtJtJtJtJtJtJtJtJ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncidentsStructure() {
  try {
    console.log('Verificando estructura de la tabla incidents...');
    
    // Intentar insertar un registro mínimo para ver qué columnas faltan
    const testData = {
      title: 'Test incident'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('incidents')
      .insert(testData)
      .select();
      
    if (insertError) {
      console.error('Error al insertar:', insertError);
      console.log('Detalles del error:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('Inserción exitosa:', insertResult);
      
      // Limpiar el registro de prueba
      if (insertResult && insertResult[0]) {
        await supabase.from('incidents').delete().eq('id', insertResult[0].id);
        console.log('Registro de prueba eliminado');
      }
    }
    
    // Intentar con más campos
    console.log('\nIntentando con más campos...');
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
      console.error('Error al insertar 2:', insertError2);
    } else {
      console.log('Inserción 2 exitosa:', insertResult2);
      
      // Limpiar el registro de prueba
      if (insertResult2 && insertResult2[0]) {
        await supabase.from('incidents').delete().eq('id', insertResult2[0].id);
        console.log('Registro de prueba 2 eliminado');
      }
    }
    
    // Verificar si hay algún registro existente para ver la estructura
    console.log('\nVerificando registros existentes...');
    const { data: existingRecords, error: selectError } = await supabase
      .from('incidents')
      .select('*')
      .limit(1);
      
    if (selectError) {
      console.error('Error al seleccionar:', selectError);
    } else {
      console.log('Registros existentes:', existingRecords);
      if (existingRecords && existingRecords.length > 0) {
        console.log('Estructura del registro:', Object.keys(existingRecords[0]));
      } else {
        console.log('No hay registros existentes en la tabla');
      }
    }

  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

checkIncidentsStructure();
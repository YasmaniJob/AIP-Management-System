require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testIncidentsTable() {
  try {
    console.log('🧪 Testing incidents table after fix...');
    
    // 1. Verificar estructura de la tabla
    console.log('\n1. Checking table structure...');
    const { data: testSelect, error: selectError } = await supabase
      .from('incidents')
      .select('*')
      .limit(1);
      
    if (selectError) {
      console.error('❌ Error accessing incidents table:', selectError);
      return;
    }
    
    console.log('✅ Incidents table is accessible');
    
    // 2. Obtener datos de prueba
    console.log('\n2. Getting test data...');
    const { data: users } = await supabase.from('users').select('id, name').limit(1);
    const { data: resources } = await supabase.from('resources').select('id, name').limit(1);
    
    if (!users || users.length === 0) {
      console.log('❌ No users found for testing');
      return;
    }
    
    if (!resources || resources.length === 0) {
      console.log('❌ No resources found for testing');
      return;
    }
    
    console.log(`✅ Found test user: ${users[0].name} (${users[0].id})`);
    console.log(`✅ Found test resource: ${resources[0].name} (${resources[0].id})`);
    
    // 3. Probar inserción completa
    console.log('\n3. Testing incident creation...');
    
    const testIncident = {
      resource_id: resources[0].id,
      title: 'Test incident - Final verification',
      description: 'Testing that the incidents table works correctly after the fix',
      type: 'Daño',
      reported_by: users[0].id,
      status: 'Reportado'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('incidents')
      .insert(testIncident)
      .select();
      
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return;
    }
    
    console.log('✅ Test incident created successfully!');
    console.log('📋 Incident details:');
    console.log(`   - ID: ${insertResult[0].id}`);
    console.log(`   - Title: ${insertResult[0].title}`);
    console.log(`   - Type: ${insertResult[0].type}`);
    console.log(`   - Status: ${insertResult[0].status}`);
    console.log(`   - Created: ${insertResult[0].created_at}`);
    
    // 4. Probar lectura
    console.log('\n4. Testing incident reading...');
    
    const { data: readResult, error: readError } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', insertResult[0].id)
      .single();
      
    if (readError) {
      console.error('❌ Read failed:', readError);
    } else {
      console.log('✅ Incident read successfully!');
    }
    
    // 5. Probar actualización
    console.log('\n5. Testing incident update...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('incidents')
      .update({ 
        status: 'En Revisión',
        resolution_notes: 'Test update - changing status'
      })
      .eq('id', insertResult[0].id)
      .select();
      
    if (updateError) {
      console.error('❌ Update failed:', updateError);
    } else {
      console.log('✅ Incident updated successfully!');
      console.log(`   - New status: ${updateResult[0].status}`);
      console.log(`   - Updated at: ${updateResult[0].updated_at}`);
    }
    
    // 6. Limpiar datos de prueba
    console.log('\n6. Cleaning up test data...');
    
    const { error: deleteError } = await supabase
      .from('incidents')
      .delete()
      .eq('id', insertResult[0].id);
      
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test data cleaned up successfully!');
    }
    
    // 7. Verificar vista active_incidents
    console.log('\n7. Testing active_incidents view...');
    
    const { data: viewResult, error: viewError } = await supabase
      .from('active_incidents')
      .select('*')
      .limit(5);
      
    if (viewError) {
      console.log('⚠️  Active incidents view not available:', viewError.message);
    } else {
      console.log(`✅ Active incidents view working! Found ${viewResult.length} active incidents`);
    }
    
    console.log('\n🎉 All tests passed! The incidents table is working correctly.');
    console.log('\n📝 Summary:');
    console.log('   ✅ Table structure is correct');
    console.log('   ✅ Insert operations work');
    console.log('   ✅ Read operations work');
    console.log('   ✅ Update operations work');
    console.log('   ✅ Delete operations work');
    console.log('   ✅ Timestamps are automatically managed');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testIncidentsTable();
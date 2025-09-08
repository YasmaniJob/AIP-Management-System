const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUserAuthentication() {
  console.log('🔍 Testing user authentication and cookie validation...');
  
  try {
    // First, let's see all users in the database
    console.log('\n=== CHECKING ALL USERS IN DATABASE ===');
    
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });
    
    if (allUsersError) {
      console.log('❌ Error fetching all users:', allUsersError.message);
      return;
    }
    
    console.log(`Found ${allUsers.length} users in database:`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Created: ${user.created_at}`);
      console.log('');
    });
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in database!');
      return;
    }
    
    // Test the user ID we've been using
    const testUserId = 'f1cc89c9-f7c6-4dcd-b49c-7820b71f75fb';
    console.log(`\n=== TESTING SPECIFIC USER ID: ${testUserId} ===`);
    
    // Check if this specific user exists (without .single() to avoid the error)
    const { data: specificUsers, error: specificError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId);
    
    if (specificError) {
      console.log('❌ Error fetching specific user:', specificError.message);
    } else {
      console.log(`Found ${specificUsers.length} users with ID ${testUserId}:`);
      specificUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    // Test with the first available user
    if (allUsers.length > 0) {
      const firstUser = allUsers[0];
      console.log(`\n=== TESTING WITH FIRST AVAILABLE USER ===`);
      console.log(`Using user: ${firstUser.name} (${firstUser.email})`);
      console.log(`User ID: ${firstUser.id}`);
      
      // Simulate middleware logic with this user
      console.log('\n=== SIMULATING MIDDLEWARE LOGIC ===');
      
      const cookieUserId = firstUser.id;
      console.log('Cookie user_id:', cookieUserId);
      
      if (!cookieUserId) {
        console.log('❌ No user_id in cookie - would redirect to /');
        return;
      }
      
      // Check if user exists (like the middleware does)
      const { data: middlewareUsers, error: middlewareError } = await supabase
        .from('users')
        .select('role')
        .eq('id', cookieUserId);
      
      if (middlewareError) {
        console.log('❌ Middleware error:', middlewareError.message);
        return;
      }
      
      if (!middlewareUsers || middlewareUsers.length === 0) {
        console.log('❌ User not found in middleware check - would redirect to /');
        return;
      }
      
      const middlewareUser = middlewareUsers[0];
      console.log('✅ Middleware check passed');
      console.log('User role:', middlewareUser.role);
      console.log('✅ Should allow access to /inventario');
      
      // Test HTTP request with this user ID
      console.log('\n=== TESTING HTTP REQUEST WITH VALID USER ID ===');
      console.log(`Recommended cookie: user_id=${firstUser.id}`);
      console.log('Try this in your browser or test script!');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUserAuthentication();
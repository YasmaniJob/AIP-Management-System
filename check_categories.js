const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jwefuiojqgwizjcumynm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZWZ1aW9qcWd3aXpqY3VteW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODczMTMsImV4cCI6MjA3MDI2MzMxM30.daIRYz_anv8YqqZ0TYZ--qmPmmXqZm7lQ-UqEa5Ilzo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Categories found:', data.length);
      console.log('Categories:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

checkCategories();
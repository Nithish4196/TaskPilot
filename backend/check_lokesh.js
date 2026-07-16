require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLokesh() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, email, status, password_hash')
    .ilike('name', '%lokesh%');
    
  if (error) {
    console.error('Error fetching lokesh:', error);
  } else {
    console.log('Lokesh Employee Records:', data);
  }
}

checkLokesh();

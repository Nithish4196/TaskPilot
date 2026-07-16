require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
  const newPassword = 'password123';
  const saltRounds = 10;
  const hash = await bcrypt.hash(newPassword, saltRounds);

  const { data, error } = await supabase
    .from('employees')
    .update({ password_hash: hash, status: 'Active' })
    .not('email', 'is', null);
    
  if (error) {
    console.error('Error resetting passwords:', error);
  } else {
    console.log(`Successfully reset ALL employee passwords to: ${newPassword}`);
  }
}

resetPassword();

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data: emps, error: eErr } = await supabase.from('employees').select('*');
  console.log('Employees:', emps, eErr);

  const { data: invite, error: inviteError } = await supabase
    .from('invitations')
    .select('*, employees(*)')
    .eq('token', '0a273e16-99b7-4bf0-a6b0-6186e1a9913a')
    .single();

  console.log('Result:', invite);
  console.log('Error:', inviteError);
}

check();

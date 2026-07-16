require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  const { data: mData } = await supabase.from('project_modules').select('*').limit(1);
  console.log('project_modules:', mData);
  
  const { data: tData } = await supabase.from('tasks').select('*').limit(1);
  console.log('tasks:', tData);

  const { data: ptData } = await supabase.from('project_teams').select('*').limit(1);
  console.log('project_teams:', ptData);
}
run();

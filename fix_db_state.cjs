const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: './backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fixData() {
  const projectId = '85e94e9a-7eb6-44f4-bb46-2614d8c25ffb';
  
  // 1. Fetch Nithish and Lokesh's modules
  const { data: modules } = await supabase.from('project_modules')
    .select('*')
    .in('id', ['180e42a9-06c1-4350-86ad-ac0ecacc16ca', '7352b681-cfc5-4852-a4a5-9b9cd349149e']);
    
  if (!modules || modules.length === 0) {
    console.error('Modules not found');
    return;
  }

  // 2. Insert module_submissions for them as "Approved"
  for (const mod of modules) {
    const payload = {
      module_id: mod.id,
      project_id: mod.project_id,
      tl_id: mod.started_by,
      status: 'Approved',
      tl_comments: 'Final submission for ' + mod.name,
      deliverables: JSON.stringify({
        source_code_url: 'https://github.com/example/' + mod.id,
        files_url: '',
        live_url: ''
      }),
      module_report: JSON.stringify({
        testing_details: 'All tests passed.',
        deployment_details: ''
      }),
      completion_pct: 100,
      manager_comments: 'Great job, approved.'
    };
    
    const { error: insertError } = await supabase.from('module_submissions').insert(payload);
    if (insertError) {
      console.error('Error inserting submission for', mod.name, insertError);
    } else {
      console.log('Inserted submission for', mod.name);
    }
    
    // 3. Mark project_modules as completed/manager_approved
    await supabase.from('project_modules').update({
      manager_approved: true,
      status: 'Completed'
    }).eq('id', mod.id);
  }
  
  // 4. Unlock the reward
  const { error: rewardError } = await supabase.from('enterprise_rewards')
    .update({ status: 'Unlocked' })
    .eq('project_id', projectId);
    
  if (rewardError) {
    console.error('Error unlocking reward', rewardError);
  } else {
    console.log('Reward unlocked!');
  }
}

fixData();

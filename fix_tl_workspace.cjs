const fs = require('fs');
let code = fs.readFileSync('src/pages/TeamLeaderWorkspace.jsx', 'utf8');

const oldInsert = ` await supabase.from('module_submissions').insert({
 module_id: mod.id,
 project_id: mod.project_id,
 team_id: mod.team_id,
 submitted_by: currentUser.id,
 status: 'Pending Manager Review',
 notes: moduleSubmitNotes,
 source_code_url: moduleSubmitSourceUrl,
 files_url: moduleSubmitFilesUrl,
 live_url: moduleSubmitLiveUrl,
 testing_details: moduleSubmitTesting,
 deployment_details: moduleSubmitDeployment
 });`;

const newInsert = ` const payload = {
   module_id: mod.id,
   project_id: mod.project_id,
   tl_id: currentUser.id,
   status: 'Under Manager Review',
   tl_comments: moduleSubmitNotes,
   deliverables: JSON.stringify({
     source_code_url: moduleSubmitSourceUrl,
     files_url: moduleSubmitFilesUrl,
     live_url: moduleSubmitLiveUrl
   }),
   module_report: JSON.stringify({
     testing_details: moduleSubmitTesting,
     deployment_details: moduleSubmitDeployment
   }),
   completion_pct: 100
 };
 const { error } = await supabase.from('module_submissions').insert(payload);
 if (error) {
   console.error('Submission failed:', error);
   alert('Failed to submit module: ' + error.message);
   return;
 }`;

code = code.replace(oldInsert, newInsert);
fs.writeFileSync('src/pages/TeamLeaderWorkspace.jsx', code);
console.log('Fixed TeamLeaderWorkspace.jsx module submission schema');

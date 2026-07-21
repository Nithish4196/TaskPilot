const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.jsx', 'utf8');

// 1. Update imports
if (!code.includes('FileText')) {
  code = code.replace('Clock, Award, ShieldCheck', 'Clock, Award, ShieldCheck, FileText');
}

// 2. Update useAppContext
code = code.replace(
  'const { projects, employees, projectTeams, projectModules, tasks, dailyUpdates, teamRewards, getEmployeeWorkload } = useAppContext();',
  'const { projects, employees, projectTeams, projectModules, tasks, dailyUpdates, teamRewards, enterpriseRewards, dailyTeamReports, moduleSubmissions, getEmployeeWorkload, currentUser, triggerNotification } = useAppContext();'
);

// 3. Update pRewards
code = code.replace(
  'const pRewards = teamRewards.filter(r => r.project_id === projectId);',
  'const pRewards = (enterpriseRewards || []).filter(r => r.project_id === projectId);'
);

// 4. Update Tabs Array
code = code.replace(
  "{ id: 'activity', label: 'Activity Feed', icon: Activity },",
  "{ id: 'submissions', label: 'Submission Log', icon: FileText },"
);

// 5. Replace TAB CONTENT: ACTIVITY FEED with TAB CONTENT: SUBMISSIONS
const startToken = '{/* TAB CONTENT: ACTIVITY FEED */}';
const endToken = '{/* TAB CONTENT: REWARDS */}';
const startIndex = code.indexOf(startToken);
const endIndex = code.indexOf(endToken);

if (startIndex !== -1 && endIndex !== -1) {
  const submissionsContent = `{/* TAB CONTENT: SUBMISSIONS */}
 {activeTab === 'submissions' && (
 <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-150">
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Submission Log</h2>
 
 {/* Overall Module Submissions */}
 <div className="mb-8">
 <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
 <FileText className="w-4 h-4 text-[var(--btn-primary-bg)]" /> Overall Module Submissions
 </h3>
 <div className="space-y-4">
 {(!moduleSubmissions || moduleSubmissions.filter(s => s.project_id === projectId).length === 0) ? (
 <div className="linear-card p-6 text-center text-[var(--text-secondary)] text-sm italic">No overall module submissions yet.</div>
 ) : (
 moduleSubmissions.filter(s => s.project_id === projectId).map(sub => {
 const tl = employees.find(e => e.id === sub.submitted_by);
 const mod = projectModules.find(m => m.id === sub.module_id);
 const isApproved = sub.status === 'Approved' || sub.status === 'Completed';
 return (
 <div key={sub.id} className="linear-card p-6 relative overflow-hidden">
 {isApproved && <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full blur-xl -mr-8 -mt-8"></div>}
 <div className="flex justify-between items-start mb-4 relative z-10">
 <div>
 <h4 className="font-bold text-[var(--text-primary)]">{mod?.name || 'Unknown Module'}</h4>
 <p className="text-xs text-[var(--text-secondary)] mt-1">Submitted by: <span className="font-medium text-[var(--text-primary)]">{tl?.name || 'Unknown'}</span></p>
 </div>
 <div className="text-right">
 <span className={\`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider \${isApproved ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'}\`}>
 {sub.status || 'Pending Review'}
 </span>
 <p className="text-[10px] text-[var(--text-secondary)] mt-2">{new Date(sub.submitted_at).toLocaleDateString()}</p>
 </div>
 </div>
 <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] mb-4">
 <span className="font-semibold text-[var(--text-primary)] block mb-1">TL Notes:</span>
 {sub.tl_notes || 'No notes provided.'}
 </div>
 {sub.files_url && (
 <a href={sub.files_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] px-3 py-1.5 rounded hover:bg-[var(--btn-primary-hover)] transition-colors inline-flex items-center gap-2">
 View Attached Files
 </a>
 )}
 </div>
 );
 })
 )}
 </div>
 </div>

 {/* Daily Updates */}
 <div>
 <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
 <Activity className="w-4 h-4 text-amber-500" /> Daily Updates Submissions
 </h3>
 <div className="space-y-4">
 {(!dailyTeamReports || dailyTeamReports.filter(s => s.project_id === projectId).length === 0) ? (
 <div className="linear-card p-6 text-center text-[var(--text-secondary)] text-sm italic">No daily update submissions yet.</div>
 ) : (
 dailyTeamReports.filter(s => s.project_id === projectId).map(sub => {
 const tl = employees.find(e => e.id === sub.submitted_by);
 const team = projectTeams.find(t => t.id === sub.team_id);
 const isReviewed = !!sub.manager_feedback;
 return (
 <div key={sub.id} className="linear-card p-6">
 <div className="flex justify-between items-start mb-4">
 <div>
 <h4 className="font-bold text-[var(--text-primary)]">{team?.team_name || 'Unknown Team'}</h4>
 <p className="text-xs text-[var(--text-secondary)] mt-1">Submitted by: <span className="font-medium text-[var(--text-primary)]">{tl?.name || 'Unknown'}</span></p>
 </div>
 <div className="text-right">
 <span className={\`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider \${isReviewed ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}\`}>
 {isReviewed ? 'Reviewed' : 'Pending Review'}
 </span>
 <p className="text-[10px] text-[var(--text-secondary)] mt-2">{new Date(sub.created_at).toLocaleDateString()}</p>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border)]">
 <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">Today's Summary</span>
 <p className="text-xs text-[var(--text-primary)]">{sub.today_summary || 'N/A'}</p>
 </div>
 <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border)]">
 <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">Tomorrow's Plan</span>
 <p className="text-xs text-[var(--text-primary)]">{sub.tomorrow_plan || 'N/A'}</p>
 </div>
 </div>
 {sub.blockers && (
 <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-xs text-red-500 mb-4">
 <span className="font-bold uppercase tracking-wider block mb-1">Blockers</span>
 {sub.blockers}
 </div>
 )}
 </div>
 );
 })
 )}
 </div>
 </div>

 </div>
 )}

 `;

  code = code.substring(0, startIndex) + submissionsContent + code.substring(endIndex);
}

fs.writeFileSync('src/pages/ProjectDetail.jsx', code);
console.log('Updated ProjectDetail.jsx');

const fs = require('fs');
let code = fs.readFileSync('src/pages/TeamLeaderWorkspace.jsx', 'utf8');

// Add new state variables
const stateInjection = ` const [showReviewModal, setShowReviewModal] = useState(false);
 const [selectedSubmission, setSelectedSubmission] = useState(null);
 const [showModuleSubmitModal, setShowModuleSubmitModal] = useState(false);
 const [moduleToSubmit, setModuleToSubmit] = useState(null);
 const [moduleSubmitData, setModuleSubmitData] = useState({ progress: 100, teamRemarks: '', links: [{title: '', url: ''}], files: [] });
`;
code = code.replace(' const [showReviewModal, setShowReviewModal] = useState(false);\r\n const [selectedSubmission, setSelectedSubmission] = useState(null);', stateInjection.trim());

// Update Review Modal UI to show Links and Files
const reviewModalLinksFilesUI = `
            {/* Links and Files */}
            {((selectedSubmission.links && selectedSubmission.links.length > 0) || (selectedSubmission.files && selectedSubmission.files.length > 0)) && (
              <div className="grid grid-cols-2 gap-4">
                {selectedSubmission.links && selectedSubmission.links.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Links</h4>
                    <div className="space-y-1">
                      {selectedSubmission.links.map((l, idx) => (
                        <a key={idx} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                          <ExternalLink className="w-3 h-3"/> {l.title || l.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Files</h4>
                    <div className="space-y-1">
                      {selectedSubmission.files.map((f, idx) => (
                        <a key={idx} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--text-primary)] hover:underline">
                          <FileText className="w-3 h-3 text-[var(--text-secondary)]"/> {f.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
`;
code = code.replace(
  '{selectedSubmission.changes_made && (',
  reviewModalLinksFilesUI + '\n            {selectedSubmission.changes_made && ('
);

// Replace submitModuleToManager function
const submitModuleReplacement = `
 const openModuleSubmitModal = (mod) => {
   setModuleToSubmit(mod);
   const mTasks = tasks.filter(t => t.module_id === mod.id);
   const completedTasks = mTasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
   const progress = mTasks.length > 0 ? Math.round((completedTasks / mTasks.length) * 100) : 0;
   
   setModuleSubmitData({
     progress: progress,
     teamRemarks: '',
     links: [{title: '', url: ''}],
     files: []
   });
   setShowModuleSubmitModal(true);
 };

 const submitModuleToManagerReal = async () => {
   if (!moduleToSubmit) return;
   try {
     const mTasks = tasks.filter(t => t.module_id === moduleToSubmit.id);
     const completedTasksCount = mTasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
     const pendingCount = mTasks.length - completedTasksCount;

     const teamStats = {
       total_employees: new Set(mTasks.map(t => t.employee_id)).size,
       completed_tasks: completedTasksCount,
       pending_tasks: pendingCount,
       total_progress: moduleSubmitData.progress
     };

     // Create module submission
     await supabase.from('module_submissions').insert({
       module_id: moduleToSubmit.id,
       project_id: moduleToSubmit.project_id,
       tl_id: currentUser.id,
       completion_pct: moduleSubmitData.progress,
       module_report: moduleSubmitData.teamRemarks,
       team_statistics: teamStats,
       links: moduleSubmitData.links.filter(l => l.url),
       files: moduleSubmitData.files,
       status: 'Pending Manager Review'
     });

     // Lock module
     await supabase.from('project_modules').update({
       locked_at: new Date().toISOString()
     }).eq('id', moduleToSubmit.id);

     // Find manager and notify
     const { data: proj } = await supabase.from('projects').select('manager_id').eq('id', moduleToSubmit.project_id).single();
     if (proj) {
       triggerNotification(proj.manager_id, 'Module Ready for Review', \`Module "\${moduleToSubmit.name}" has been submitted for final review.\`, 'module_submitted', moduleToSubmit.id);
     }
     
     setShowModuleSubmitModal(false);
     fetchGlobalData();
   } catch (error) {
     console.error("Submit Module Error:", error);
     alert("Failed to submit module.");
   }
 };
`;

code = code.replace(
  /const submitModuleToManager = async \([\s\S]*? \}\n \};\r\n/m,
  submitModuleReplacement
);

// Replace button onClick
code = code.replace(
  /onClick=\{\(\) => submitModuleToManager\(mod\)\}/g,
  'onClick={() => openModuleSubmitModal(mod)}'
);

// Inject Module Submit Modal UI at the end
const moduleSubmitModalUI = `
      {/* Submit Module Update Modal */}
      {showModuleSubmitModal && moduleToSubmit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Submit Module Update to Manager</h3>
                <p className="text-sm text-[var(--text-secondary)]">Module: {moduleToSubmit.name}</p>
              </div>
              <button onClick={() => setShowModuleSubmitModal(false)} className="text-[var(--text-secondary)] hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border)] text-center">
                  <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">Module Progress</p>
                  <p className="text-3xl font-bold text-brand-600">{moduleSubmitData.progress}%</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Overall Team Remarks</label>
                <textarea 
                  className="w-full px-3 py-2 linear-card min-h-[100px] text-sm"
                  placeholder="Summarize the team's work on this module..."
                  value={moduleSubmitData.teamRemarks}
                  onChange={e => setModuleSubmitData({...moduleSubmitData, teamRemarks: e.target.value})}
                  required
                />
              </div>

              {/* Links */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Artifact Links (e.g., Testing Reports, Docs, Figma)</label>
                <div className="space-y-2">
                  {moduleSubmitData.links.map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input type="text" placeholder="Title" className="w-1/3 px-3 py-2 linear-card text-sm" value={link.title} onChange={e => {
                        const newLinks = [...moduleSubmitData.links];
                        newLinks[idx].title = e.target.value;
                        setModuleSubmitData({...moduleSubmitData, links: newLinks});
                      }} />
                      <input type="url" placeholder="URL" className="w-2/3 px-3 py-2 linear-card text-sm" value={link.url} onChange={e => {
                        const newLinks = [...moduleSubmitData.links];
                        newLinks[idx].url = e.target.value;
                        setModuleSubmitData({...moduleSubmitData, links: newLinks});
                      }} />
                      {moduleSubmitData.links.length > 1 && (
                        <button type="button" onClick={() => setModuleSubmitData({...moduleSubmitData, links: moduleSubmitData.links.filter((_, i) => i !== idx)})} className="p-2 text-[var(--text-secondary)] hover:text-red-500">×</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setModuleSubmitData({...moduleSubmitData, links: [...moduleSubmitData.links, { title: '', url: '' }]})} className="text-xs text-blue-500 font-semibold hover:underline">+ Add Another Link</button>
                </div>
              </div>

              {/* Files */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">File Attachments</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {moduleSubmitData.files.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[var(--bg-secondary)] px-2 py-1 rounded text-xs border border-[var(--border)]">
                      <FileText className="w-3 h-3 text-[var(--text-secondary)]" />
                      <span>{f.name}</span>
                      <button type="button" onClick={() => setModuleSubmitData({...moduleSubmitData, files: moduleSubmitData.files.filter((_, i) => i !== idx)})} className="text-[var(--text-secondary)] hover:text-red-500">×</button>
                    </div>
                  ))}
                </div>
                <input type="file" multiple className="text-xs text-[var(--text-secondary)]" onChange={e => {
                  const files = Array.from(e.target.files).map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
                  setModuleSubmitData({...moduleSubmitData, files: [...moduleSubmitData.files, ...files]});
                }} />
              </div>

            </div>
            <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--surface)]">
              <button onClick={() => setShowModuleSubmitModal(false)} className="px-4 py-2 font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors">Cancel</button>
              <button onClick={submitModuleToManagerReal} className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors shadow-sm">Submit to Manager</button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace('    </div>\r\n  );\r\n}', moduleSubmitModalUI + '    </div>\r\n  );\r\n}');

if (!code.includes('ExternalLink')) {
  code = code.replace('import { CheckSquare, ', 'import { CheckSquare, ExternalLink, FileText, ');
}

fs.writeFileSync('src/pages/TeamLeaderWorkspace.jsx', code);
console.log('Updated TeamLeaderWorkspace.jsx');

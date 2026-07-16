const fs = require('fs');
let code = fs.readFileSync('src/pages/ManagerDashboard.jsx', 'utf8');

// Update Review Modules Modal UI to show Links, Files, and Team Stats
const modalInjection = `
              {/* Submission Payload */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-2"><Target className="w-4 h-4"/> TL Remarks</h4>
                  <p className="text-[var(--text-primary)] text-sm">{selectedReport.module_report}</p>
                </div>
                
                {selectedReport.team_statistics && (
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> Team Statistics</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-[var(--surface)] p-3 rounded border border-[var(--border)]">
                        <p className="text-xs text-[var(--text-secondary)]">Total Employees</p>
                        <p className="text-lg font-bold">{selectedReport.team_statistics.total_employees}</p>
                      </div>
                      <div className="bg-[var(--surface)] p-3 rounded border border-[var(--border)]">
                        <p className="text-xs text-[var(--text-secondary)]">Completed Tasks</p>
                        <p className="text-lg font-bold text-emerald-600">{selectedReport.team_statistics.completed_tasks}</p>
                      </div>
                      <div className="bg-[var(--surface)] p-3 rounded border border-[var(--border)]">
                        <p className="text-xs text-[var(--text-secondary)]">Pending Tasks</p>
                        <p className="text-lg font-bold text-amber-600">{selectedReport.team_statistics.pending_tasks}</p>
                      </div>
                      <div className="bg-[var(--surface)] p-3 rounded border border-[var(--border)]">
                        <p className="text-xs text-[var(--text-secondary)]">Overall Progress</p>
                        <p className="text-lg font-bold text-brand-600">{selectedReport.team_statistics.total_progress}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Links and Files */}
                {((selectedReport.links && selectedReport.links.length > 0) || (selectedReport.files && selectedReport.files.length > 0)) && (
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[var(--border)]">
                    {selectedReport.links && selectedReport.links.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5"><ExternalLink className="w-4 h-4"/> Links</h4>
                        <div className="space-y-2">
                          {selectedReport.links.map((l, idx) => (
                            <a key={idx} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                              {l.title || l.url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedReport.files && selectedReport.files.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5"><FileText className="w-4 h-4"/> Files</h4>
                        <div className="space-y-2">
                          {selectedReport.files.map((f, idx) => (
                            <a key={idx} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--text-primary)] hover:underline">
                              <FileText className="w-3 h-3 text-[var(--text-secondary)]"/> {f.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
`;

code = code.replace(
  '{selectedReport.module_report && (',
  modalInjection + '\n              {false && (' // Hiding the old module_report since it is included in the new payload
);

if (!code.includes('ExternalLink')) {
  code = code.replace('import { Plus, ', 'import { Plus, ExternalLink, ');
}

fs.writeFileSync('src/pages/ManagerDashboard.jsx', code);
console.log('Updated ManagerDashboard.jsx');

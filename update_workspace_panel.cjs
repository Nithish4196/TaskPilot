const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeWorkspacePanel.jsx', 'utf8');

// Find the block where Task Completed Successfully is shown
const successBlockOld = `<div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <span>Task Completed Successfully</span>
                </div>
                <p className="text-xs">No more submissions allowed.</p>
              </div>`;

const successBlockNew = `<div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <span>Task Completed Successfully</span>
                  </div>
                  <p className="text-xs">No more submissions allowed.</p>
                </div>
                
                {/* Final Submission Details & TL Feedback */}
                <div className="linear-card p-6 border border-green-200 bg-green-50/10">
                  <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                    <CheckSquare className="w-5 h-5 text-green-600" /> Final Submission & Review Details
                  </h3>
                  
                  {taskDeliverables && taskDeliverables.find(d => d.task_id === selectedTask.id) && (
                    <div className="mb-6 pb-6 border-b border-[var(--border)]">
                      <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Your Submitted Deliverables</p>
                      <div className="bg-[var(--bg-secondary)] p-4 rounded text-[var(--text-primary)] whitespace-pre-wrap font-mono text-xs border border-[var(--border)]">
                        {taskDeliverables.find(d => d.task_id === selectedTask.id).description}
                      </div>
                      <div className="mt-3">
                        <a href={taskDeliverables.find(d => d.task_id === selectedTask.id).link_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                          <Play className="w-3 h-3"/> Open Attachment / URL
                        </a>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Team Leader Feedback</p>
                    {selectedTask.tl_feedback ? (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded border border-slate-200 text-sm">
                          {selectedTask.tl_feedback}
                        </div>
                        {selectedTask.improvement_suggestions && (
                          <div className="bg-blue-50 p-4 rounded border border-blue-200 text-sm">
                            <span className="font-bold text-blue-700 block mb-1">Suggestions for Next Time:</span>
                            {selectedTask.improvement_suggestions}
                          </div>
                        )}
                        <div className="flex gap-4">
                          <div className="bg-[var(--bg-secondary)] px-4 py-2 rounded border border-[var(--border)] text-sm flex items-center gap-2">
                            <span className="font-semibold text-[var(--text-secondary)]">Rating:</span>
                            <span className="font-bold text-[var(--text-primary)] flex items-center">{selectedTask.final_rating}/5 <Star className="w-4 h-4 ml-1 fill-yellow-400 text-yellow-400"/></span>
                          </div>
                          {selectedTask.quality_score && (
                            <div className="bg-[var(--bg-secondary)] px-4 py-2 rounded border border-[var(--border)] text-sm flex items-center gap-2">
                              <span className="font-semibold text-[var(--text-secondary)]">Quality Score:</span>
                              <span className="font-bold text-green-600">{selectedTask.quality_score}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)] italic">Pending TL Feedback...</p>
                    )}
                  </div>
                </div>
              </div>`;

if (code.includes('export default function EmployeeWorkspacePanel({')) {
  if (!code.includes('taskDeliverables')) {
    code = code.replace(
      'export default function EmployeeWorkspacePanel({ \n  selectedTask, taskSubs, taskModule, taskProject, \n  currentUser, employees, fetchGlobalData, triggerNotification \n})',
      'export default function EmployeeWorkspacePanel({ \n  selectedTask, taskSubs, taskModule, taskProject, \n  currentUser, employees, fetchGlobalData, triggerNotification, taskDeliverables, taskHistory \n})'
    );
  }
  
  if (code.includes(successBlockOld)) {
     code = code.replace(successBlockOld, successBlockNew);
     fs.writeFileSync('src/components/EmployeeWorkspacePanel.jsx', code);
     console.log('Successfully updated EmployeeWorkspacePanel.jsx');
  } else {
     console.error('Could not find successBlockOld');
  }
} else {
  console.error('Could not find export default function EmployeeWorkspacePanel({');
}

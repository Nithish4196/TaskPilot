import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Clock, FileText, CheckCircle, Users } from 'lucide-react';

export default function EmployeeSubmissionLog() {
  const { currentUser, isTeamLeader, employees, tasks, dailyWorkSubmissions, taskDeliverables, userRole, projectTeams } = useAppContext();
  
  if (!currentUser) {
    return <Navigate to="/" />;
  }

  const tlMode = isTeamLeader(currentUser.id) || userRole === 'manager';
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(tlMode ? '' : currentUser.id);
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'final'

  // If in TL mode, get the list of employees under their teams
  const tlTeams = projectTeams.filter(t => t.team_leader_id === currentUser.id);
  const tlEmployeeIds = new Set();
  tlTeams.forEach(t => {
    (t.team_members || []).forEach(m => tlEmployeeIds.add(m));
  });

  const displayEmployees = userRole === 'manager' 
    ? employees.filter(e => e.id !== currentUser.id)
    : employees.filter(e => e.id !== currentUser.id && tlEmployeeIds.has(e.id));

  const targetEmployeeId = tlMode && selectedEmployeeId ? selectedEmployeeId : currentUser.id;
  const targetEmployee = employees.find(e => e.id === targetEmployeeId);

  const empDailyUpdates = dailyWorkSubmissions
    .filter(s => s.employee_id === targetEmployeeId)
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

  const empDeliverables = taskDeliverables
    .filter(d => d.employee_id === targetEmployeeId)
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-end border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Submission History Log</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {tlMode ? "Audit and review employee submissions." : "A complete historical record of your work submissions."}
          </p>
        </div>
        
        {tlMode && (
          <div className="w-64">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2"><Users className="w-3 h-3 inline mr-1"/> Select Employee</label>
            <select 
              className="linear-input w-full py-2"
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">-- Choose Employee --</option>
              {displayEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!selectedEmployeeId && tlMode ? (
        <div className="linear-card p-12 text-center">
          <FileText className="w-12 h-12 text-[var(--text-secondary)] opacity-30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No Employee Selected</h3>
          <p className="text-[var(--text-secondary)] max-w-sm mx-auto">Please select an employee from the dropdown above to view their submission history.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-4 border-b border-[var(--border)] pb-4">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 text-sm font-semibold transition-colors duration-150 rounded ${activeTab === 'daily' ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}
            >
              Daily Updates ({empDailyUpdates.length})
            </button>
            <button
              onClick={() => setActiveTab('final')}
              className={`px-4 py-2 text-sm font-semibold transition-colors duration-150 rounded ${activeTab === 'final' ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}
            >
              Final Task Deliverables ({empDeliverables.length})
            </button>
          </div>

          <div className="space-y-4">
            {activeTab === 'daily' && (
              empDailyUpdates.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] italic">No daily updates recorded.</p>
              ) : (
                empDailyUpdates.map(update => {
                  const task = tasks.find(t => t.id === update.task_id);
                  return (
                    <div key={update.id} className="linear-card p-5 border-l-4 border-l-blue-500">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{task?.name || 'Unknown Task'}</p>
                          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" /> {new Date(update.submitted_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          {update.progress_pct}% Progress
                        </span>
                      </div>
                      
                      <div className="bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border)]">
                        <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Work Notes</p>
                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{update.work_notes}</p>
                      </div>

                      {update.tl_comments && (
                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                          <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">TL Feedback (Rating: {update.rating}/5)</p>
                          <p className="text-sm text-[var(--text-primary)]">{update.tl_comments}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )
            )}

            {activeTab === 'final' && (
              empDeliverables.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] italic">No final deliverables recorded.</p>
              ) : (
                empDeliverables.map(deliverable => {
                  const task = tasks.find(t => t.id === deliverable.task_id);
                  return (
                    <div key={deliverable.id} className="linear-card p-5 border-l-4 border-l-green-500">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{task?.name || 'Unknown Task'}</p>
                          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                            <CheckCircle className="w-3 h-3 text-green-500" /> Submitted: {new Date(deliverable.submitted_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20">
                          Final Submission
                        </span>
                      </div>
                      
                      <div className="bg-[var(--bg-secondary)] p-4 rounded border border-green-500/30">
                        <p className="text-[10px] font-semibold text-green-500 uppercase tracking-wider mb-2">Deliverable Details</p>
                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{deliverable.description}</p>
                        
                        {deliverable.link_url && deliverable.link_url !== 'N/A' && !deliverable.link_url.includes('Final Deliverables:') && (
                          <a href={deliverable.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs mt-3 block break-all font-medium">
                            🔗 Attached Link: {deliverable.link_url}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

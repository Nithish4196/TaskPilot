import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext, supabase } from '../context/AppContext';
import { FileText, CheckCircle, Users, Activity, Flag, ChevronDown, ChevronUp, Search, Calendar, Filter, Star, Clock, AlertCircle } from 'lucide-react';

export default function ManagerSubmissionLog() {
  const { 
    currentUser, isTeamLeader, employees, projects, projectTeams, projectModules, 
    dailyTeamReports, finalTeamReports, moduleSubmissions, taskDeliverables, tasks,
    fetchGlobalData, triggerNotification
  } = useAppContext();
  
  if (!currentUser) return <Navigate to="/" />;

  const tlMode = isTeamLeader(currentUser.id);

  // Filters State
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'final'
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedTL, setSelectedTL] = useState(tlMode ? currentUser.id : '');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [expandedSubId, setExpandedSubId] = useState(null);
  
  // Review Panel State
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewRating, setReviewRating] = useState(0);

  // 1. Normalize all submissions into a single array
  const allSubmissions = useMemo(() => {
    return [
      ...(moduleSubmissions || []).map(s => {
         const mod = projectModules?.find(m => m.id === s.module_id);
         return {
           id: s.id,
           type: 'Final Module Submission',
           project_id: s.project_id,
           team_id: mod ? mod.team_id : null,
           tl_id: s.tl_id || s.submitted_by,
           submitted_at: s.submitted_at || s.created_at,
           status: s.status || 'Pending Manager Review',
           module_id: s.module_id,
           data: s
         };
      }),
      ...(dailyTeamReports || []).map(s => ({
         id: s.id,
         type: 'Daily Update',
         project_id: s.project_id,
         team_id: s.team_id,
         tl_id: s.tl_id || s.submitted_by,
         submitted_at: s.created_at,
         status: s.manager_feedback ? 'Reviewed' : 'Pending',
         data: s
      })),
      ...(finalTeamReports || []).map(s => ({
         id: s.id,
         type: 'Final Project Report',
         project_id: s.project_id,
         team_id: s.team_id,
         tl_id: s.tl_id || s.submitted_by,
         submitted_at: s.submitted_at || s.created_at,
         status: s.status || 'Pending Manager Review',
         data: s
      }))
    ].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  }, [moduleSubmissions, dailyTeamReports, finalTeamReports, projectModules]);

  // 2. Compute dynamic cascading dropdowns based on actual data
  const activeProjects = useMemo(() => {
    const pIds = new Set(allSubmissions.map(s => s.project_id));
    return (projects || []).filter(p => pIds.has(p.id));
  }, [allSubmissions, projects]);

  const activeTeams = useMemo(() => {
    let pTeams = projectTeams || [];
    if (selectedProject) pTeams = pTeams.filter(t => t.project_id === selectedProject);
    const tIds = new Set(allSubmissions.map(s => s.team_id));
    return pTeams.filter(t => tIds.has(t.id));
  }, [allSubmissions, projectTeams, selectedProject]);

  const activeTLs = useMemo(() => {
    let subs = allSubmissions;
    if (selectedProject) subs = subs.filter(s => s.project_id === selectedProject);
    if (selectedTeam) subs = subs.filter(s => s.team_id === selectedTeam);
    const tlIds = new Set(subs.map(s => s.tl_id));
    return (employees || []).filter(e => tlIds.has(e.id));
  }, [allSubmissions, employees, selectedProject, selectedTeam]);

  // 3. Apply Filters
  const filteredSubmissions = useMemo(() => {
    return allSubmissions.filter(sub => {
      if (activeTab === 'daily' && sub.type !== 'Daily Update') return false;
      if (activeTab === 'final' && sub.type === 'Daily Update') return false;
      
      if (selectedProject && sub.project_id !== selectedProject) return false;
      if (selectedTeam && sub.team_id !== selectedTeam) return false;
      if (selectedTL && sub.tl_id !== selectedTL) return false;
      if (statusFilter && sub.status !== statusFilter) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const pName = projects.find(p => p.id === sub.project_id)?.name || '';
        const tName = projectTeams.find(t => t.id === sub.team_id)?.team_name || '';
        const tlName = employees.find(e => e.id === sub.tl_id)?.name || '';
        if (!pName.toLowerCase().includes(query) && 
            !tName.toLowerCase().includes(query) && 
            !tlName.toLowerCase().includes(query) &&
            !sub.type.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [allSubmissions, selectedProject, selectedTeam, selectedTL, activeTab, statusFilter, searchQuery, projects, projectTeams, employees]);

  // Analytics Metrics
  const pendingCount = allSubmissions.filter(s => s.status.includes('Pending')).length;
  const approvedToday = allSubmissions.filter(s => s.status === 'Approved' && new Date(s.data.reviewed_at || s.data.updated_at).toDateString() === new Date().toDateString()).length;
  const rejectedToday = allSubmissions.filter(s => s.status === 'Rejected' && new Date(s.data.reviewed_at || s.data.updated_at).toDateString() === new Date().toDateString()).length;

  const getEmployeeContributions = (moduleId) => {
    const modTasks = (tasks || []).filter(t => t.module_id === moduleId);
    const modTaskIds = modTasks.map(t => t.id);
    const modDeliverables = (taskDeliverables || []).filter(d => modTaskIds.includes(d.task_id));
    
    if (modDeliverables.length === 0) return [];

    const employeeCounts = {};
    modDeliverables.forEach(d => {
      employeeCounts[d.employee_id] = (employeeCounts[d.employee_id] || 0) + 1;
    });

    const total = modDeliverables.length;
    return Object.keys(employeeCounts).map(empId => ({
      employee: employees.find(e => e.id === empId)?.name || 'Unknown',
      percentage: Math.round((employeeCounts[empId] / total) * 100)
    })).sort((a,b) => b.percentage - a.percentage);
  };

  const handleReviewAction = async (sub, action) => {
    if (!reviewFeedback && action !== 'Approve') {
      alert('Please provide feedback for this action.');
      return;
    }

    try {
      let table = '';
      if (sub.type === 'Final Module Submission') table = 'module_submissions';
      else if (sub.type === 'Daily Update') table = 'daily_team_reports';
      else if (sub.type === 'Final Project Report') table = 'final_team_reports';

      const payload = {
        manager_feedback: reviewFeedback,
        rating: reviewRating || null,
        reviewed_at: new Date().toISOString()
      };

      if (action === 'Approve') payload.status = 'Approved';
      else if (action === 'Reject') payload.status = 'Rejected';
      else if (action === 'Need Changes') payload.status = 'Needs Revision';
      else if (action === 'Reviewed') payload.status = 'Reviewed'; // For Daily Updates

      const { error } = await supabase.from(table).update(payload).eq('id', sub.id);
      if (error) throw error;

      // If approving a module, we might need to unlock tasks or modules, but that's handled in ManagerDashboard usually.
      // Here we just update the status.
      if (table === 'module_submissions' && action === 'Approve') {
        await supabase.from('project_modules').update({ manager_approved: true, status: 'Completed' }).eq('id', sub.module_id);
        
        // Mark all tasks in this module as fully completed and approved
        await supabase.from('tasks').update({
          approval_status: 'Approved',
          status: 'Completed',
          approved_at: new Date().toISOString(),
          approved_by: currentUser.id
        }).eq('module_id', sub.module_id);

        // Auto-progress enterprise_rewards directly to Unlocked!
        const { data: rewards } = await supabase.from('enterprise_rewards')
          .select('*')
          .contains('module_ids', [sub.module_id])
          .neq('status', 'Unlocked');
          
        if (rewards && rewards.length > 0) {
          for (const reward of rewards) {
            // Check if ALL modules associated with this reward are completed/approved
            const { data: rewardModules } = await supabase.from('project_modules').select('manager_approved').in('id', reward.module_ids || []);
            const allApproved = rewardModules && rewardModules.length > 0 && rewardModules.every(m => m.manager_approved === true);
            
            if (allApproved) {
              await supabase.from('enterprise_rewards').update({ status: 'Unlocked' }).eq('id', reward.id);
              
              let memberIds = new Set();
              if (reward.team_ids && reward.team_ids.length > 0) {
                const { data: teamsData } = await supabase.from('project_teams').select('team_members, team_leader_id').in('id', reward.team_ids);
                if (teamsData) {
                  teamsData.forEach(t => {
                    if (t.team_leader_id) memberIds.add(t.team_leader_id);
                    if (t.team_members) t.team_members.forEach(id => memberIds.add(id));
                  });
                }
              } else if (reward.team_name) {
                const { data } = await supabase.from('employees').select('id').eq('team', reward.team_name);
                if (data) data.forEach(emp => memberIds.add(emp.id));
              }
              
              if (memberIds.size > 0) {
                const claimsToInsert = Array.from(memberIds).map(empId => ({
                  reward_id: reward.id,
                  employee_id: empId,
                  status: 'Unlocked'
                }));
                await supabase.from('reward_claims').upsert(claimsToInsert, { onConflict: 'reward_id, employee_id', ignoreDuplicates: true });
                
                // Notify TL
                triggerNotification(sub.tl_id, 'Reward Unlocked!', `Congratulations! The reward "${reward.title}" has been unlocked by the Manager. Claim it now!`, 'reward');
              }
            }
          }
        }
      }

      triggerNotification(sub.tl_id, `Submission ${action}`, `Your ${sub.type} has been ${action.toLowerCase()}.`, 'review', sub.id);
      
      setReviewingId(null);
      setReviewFeedback('');
      setReviewRating(0);
      fetchGlobalData();
    } catch (err) {
      console.error('Review error:', err);
      alert('Failed to submit review.');
    }
  };

  const getStatusColor = (status) => {
    if (status.includes('Pending')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (status.includes('Approved') || status === 'Reviewed') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (status.includes('Reject')) return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* Header & Analytics */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Manager Submission Log</h1>
        <p className="text-[var(--text-secondary)] mt-1">Enterprise audit trail and hierarchical submission review.</p>
      </div>

      <div className="flex border-b border-[var(--border)] overflow-x-auto no-scrollbar">
        <button onClick={() => { setActiveTab('daily'); setExpandedSubId(null); }} className={`px-6 py-4 text-sm font-bold tracking-wider transition-colors whitespace-nowrap ${activeTab === 'daily' ? 'text-[var(--brand-500)] border-b-2 border-[var(--brand-500)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
          Daily Reports
        </button>
        <button onClick={() => { setActiveTab('final'); setExpandedSubId(null); }} className={`px-6 py-4 text-sm font-bold tracking-wider transition-colors whitespace-nowrap ${activeTab === 'final' ? 'text-[var(--brand-500)] border-b-2 border-[var(--brand-500)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
          Overall Submissions
        </button>
      </div>

      {!tlMode && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="linear-card p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-amber-500">{pendingCount}</span>
            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-1">Pending Reviews</span>
          </div>
          <div className="linear-card p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-green-500">{approvedToday}</span>
            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-1">Approved Today</span>
          </div>
          <div className="linear-card p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-red-500">{rejectedToday}</span>
            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-1">Rejected Today</span>
          </div>
          <div className="linear-card p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-blue-500">{finalTeamReports.length}</span>
            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-1">Final Reports</span>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="linear-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-bold text-[var(--text-primary)]">Filter Submissions</span>
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-${tlMode ? '2' : '3'} gap-4`}>
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">Project</label>
              <select className="linear-input w-full py-2 text-sm text-black bg-white" value={selectedProject} onChange={e => { setSelectedProject(e.target.value); setSelectedTeam(''); setSelectedTL(''); }}>
                <option value="" className="text-black bg-white">All Projects</option>
                {activeProjects.map(p => <option key={p.id} value={p.id} className="text-black bg-white">{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">Team</label>
              <select className="linear-input w-full py-2 text-sm text-black bg-white" value={selectedTeam} onChange={e => { setSelectedTeam(e.target.value); setSelectedTL(''); }} disabled={!selectedProject}>
                <option value="" className="text-black bg-white">All Teams</option>
                {activeTeams.map(t => <option key={t.id} value={t.id} className="text-black bg-white">{t.team_name}</option>)}
              </select>
            </div>
            {!tlMode && (
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">Team Leader</label>
                <select className="linear-input w-full py-2 text-sm text-black bg-white" value={selectedTL} onChange={e => setSelectedTL(e.target.value)}>
                  <option value="" className="text-black bg-white">All Team Leaders</option>
                  {activeTLs.map(tl => <option key={tl.id} value={tl.id} className="text-black bg-white">{tl.name}</option>)}
                </select>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-secondary)]" />
              <input 
                type="text" 
                placeholder="Search by project, team, TL, or type..." 
                className="linear-input w-full py-2 pl-9 text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <select className="linear-input w-full py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="Pending Manager Review">Pending Manager Review</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Reviewed">Reviewed</option>
              </select>
            </div>
          </div>
        </div>

      {/* Submission List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="linear-card p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-[var(--border)]">
            <AlertCircle className="w-12 h-12 text-[var(--text-secondary)] opacity-30 mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Submissions Found</h3>
            <p className="text-[var(--text-secondary)] text-sm max-w-sm mt-2">
              There are no submissions matching your current hierarchy filters. Try broadening your search or selecting a different project.
            </p>
          </div>
        ) : (
          filteredSubmissions.map(sub => {
            const p = projects.find(x => x.id === sub.project_id);
            const t = projectTeams.find(x => x.id === sub.team_id);
            const tl = employees.find(x => x.id === sub.tl_id);
            const mod = sub.module_id ? projectModules.find(x => x.id === sub.module_id) : null;
            
            const isExpanded = expandedSubId === sub.id;
            const daysPending = Math.floor((new Date() - new Date(sub.submitted_at)) / (1000 * 60 * 60 * 24));
            
            const contributions = sub.type === 'Final Module Submission' ? getEmployeeContributions(sub.module_id) : [];
            
            let parsedDeliverables = {};
            let parsedReport = {};
            if (sub.type === 'Final Module Submission' && sub.data) {
              try { parsedDeliverables = JSON.parse(sub.data.deliverables || '{}'); } catch(e){}
              try { parsedReport = JSON.parse(sub.data.module_report || '{}'); } catch(e){}
            }

            return (
              <div key={sub.id} className="linear-card overflow-hidden transition-all duration-300">
                {/* Header Summary (Always Visible) */}
                <div 
                  className="p-5 cursor-pointer hover:bg-[var(--surface)] transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                  onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                >
                  <div className="flex gap-4 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      sub.type === 'Final Module Submission' ? 'bg-purple-500/10 text-purple-500' :
                      sub.type === 'Daily Update' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-green-500/10 text-green-500'
                    }`}>
                      {sub.type === 'Final Module Submission' ? <CheckCircle className="w-5 h-5"/> :
                       sub.type === 'Daily Update' ? <Activity className="w-5 h-5"/> : <Flag className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{sub.type}</span>
                        <span className="text-xs text-[var(--text-secondary)]">•</span>
                        <span className="text-xs text-[var(--text-secondary)]">{new Date(sub.submitted_at).toLocaleString()}</span>
                      </div>
                      <h3 className="text-base font-bold text-[var(--text-primary)] mt-1">
                        {p?.name || 'Unknown Project'} <span className="opacity-50">/</span> {t?.team_name || 'Unknown Team'}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2 mt-1">
                        <Users className="w-3 h-3" /> TL: <span className="font-medium text-[var(--text-primary)]">{tl?.name || 'Unknown'}</span>
                        {mod && <><span className="mx-1 opacity-30">|</span> Module: {mod.name}</>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                      {sub.status.includes('Pending') && (
                        <span className="text-xs text-amber-500 font-medium mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending {daysPending} days
                        </span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] p-6 space-y-6">
                    
                    {/* Submission Content */}
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Submission Details</h4>
                      {sub.type === 'Final Module Submission' && (
                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-5 space-y-4">
                          {parsedReport.notes && (
                            <div>
                              <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-1">Final Submission Notes</p>
                              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{parsedReport.notes}</p>
                            </div>
                          )}
                          
                          {(parsedDeliverables.source_code_url || parsedDeliverables.files_url || parsedDeliverables.live_url) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                              {parsedDeliverables.source_code_url && (
                                <a href={parsedDeliverables.source_code_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors">
                                  <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">{"</>"}</div>
                                  <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-[var(--text-primary)]">Source Code</p>
                                    <p className="text-xs text-[var(--text-secondary)] truncate w-full">{parsedDeliverables.source_code_url}</p>
                                  </div>
                                </a>
                              )}
                              {parsedDeliverables.files_url && (
                                <a href={parsedDeliverables.files_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors">
                                  <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-[var(--text-primary)]">Drive / Files</p>
                                    <p className="text-xs text-[var(--text-secondary)] truncate w-full">{parsedDeliverables.files_url}</p>
                                  </div>
                                </a>
                              )}
                              {parsedDeliverables.live_url && (
                                <a href={parsedDeliverables.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors">
                                  <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center text-green-500">
                                    <Activity className="w-4 h-4" />
                                  </div>
                                  <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-[var(--text-primary)]">Live Demo</p>
                                    <p className="text-xs text-[var(--text-secondary)] truncate w-full">{parsedDeliverables.live_url}</p>
                                  </div>
                                </a>
                              )}
                            </div>
                          )}

                          {(parsedReport.testing_details || parsedReport.deployment_details) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border)]">
                              {parsedReport.testing_details && (
                                <div>
                                  <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Testing Details</p>
                                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{parsedReport.testing_details}</p>
                                </div>
                              )}
                              {parsedReport.deployment_details && (
                                <div>
                                  <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-1 flex items-center gap-1"><Flag className="w-3 h-3"/> Deployment Details</p>
                                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{parsedReport.deployment_details}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {sub.type === 'Daily Update' && (
                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-4">
                          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{sub.data.report_text || sub.data.summary}</p>
                        </div>
                      )}
                      {sub.type === 'Final Project Report' && (
                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div><p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-1">Project Summary</p><p className="text-sm">{sub.data.project_summary}</p></div>
                          <div><p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-1">Team Performance</p><p className="text-sm">{sub.data.team_performance}</p></div>
                          <div><p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-1">Challenges</p><p className="text-sm">{sub.data.challenges}</p></div>
                          <div><p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-1">Lessons Learned</p><p className="text-sm">{sub.data.lessons_learned}</p></div>
                        </div>
                      )}
                    </div>

                    {/* Employee Contributions (For Modules) */}
                    {sub.type === 'Final Module Submission' && contributions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Employee Contribution Breakdown</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {contributions.map((c, i) => (
                            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded p-3 flex flex-col items-center">
                              <span className="text-2xl font-black text-brand-500">{c.percentage}%</span>
                              <span className="text-xs font-medium text-[var(--text-primary)] mt-1 text-center truncate w-full">{c.employee}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review History / Timeline */}
                    {(sub.data.manager_feedback || sub.data.reviewed_at) && (
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Review History</h4>
                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-4 border-l-4 border-l-brand-500">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-[var(--text-secondary)]">{new Date(sub.data.reviewed_at || sub.data.updated_at).toLocaleString()}</span>
                            {sub.data.rating && (
                              <div className="flex gap-1">
                                {[...Array(sub.data.rating)].map((_, i) => <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />)}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-[var(--text-primary)] italic">"{sub.data.manager_feedback}"</p>
                        </div>
                      </div>
                    )}

                    {/* Manager Action Panel */}
                    {!tlMode && (sub.status.includes('Pending') || sub.status.includes('Under Manager Review') || sub.status.includes('Review')) && (
                      <div className="border-t border-[var(--border)] pt-6 mt-6">
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Manager Review Panel</h4>
                        
                        {reviewingId === sub.id ? (
                          <div className="space-y-4 bg-[var(--surface)] border border-[var(--border)] p-4 rounded-xl">
                            <div>
                              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Feedback / Notes</label>
                              <textarea 
                                className="linear-input w-full" 
                                rows="3" 
                                placeholder="Enter specific feedback..."
                                value={reviewFeedback}
                                onChange={e => setReviewFeedback(e.target.value)}
                              ></textarea>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Rating (Optional)</label>
                              <div className="flex gap-2">
                                {[1,2,3,4,5].map(star => (
                                  <button 
                                    key={star} 
                                    onClick={() => setReviewRating(star)}
                                    className={`p-2 rounded transition-colors ${reviewRating >= star ? 'text-yellow-500 bg-yellow-500/10' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                                  >
                                    <Star className={`w-5 h-5 ${reviewRating >= star ? 'fill-yellow-500' : ''}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                              {sub.type === 'Daily Update' ? (
                                <button className="linear-button px-6" onClick={() => handleReviewAction(sub, 'Reviewed')}>Mark as Reviewed</button>
                              ) : (
                                <>
                                  <button className="linear-button px-6" onClick={() => handleReviewAction(sub, 'Approve')}>Approve</button>
                                  <button className="px-6 py-2 rounded text-red-500 font-semibold border border-red-500/20 hover:bg-red-500/10 transition-colors" onClick={() => handleReviewAction(sub, 'Reject')}>Reject</button>
                                  <button className="px-6 py-2 rounded text-amber-500 font-semibold border border-amber-500/20 hover:bg-amber-500/10 transition-colors" onClick={() => handleReviewAction(sub, 'Need Changes')}>Need Changes</button>
                                </>
                              )}
                              <button className="px-6 py-2 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors ml-auto" onClick={() => setReviewingId(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4">
                            <button className="linear-button px-8" onClick={() => setReviewingId(sub.id)}>Review Submission</button>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

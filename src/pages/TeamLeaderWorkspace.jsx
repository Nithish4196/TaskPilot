import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Briefcase, LayoutGrid, Users, CheckCircle, Clock, AlertTriangle, Plus, ChevronRight, MessageSquare, Target, Send, Star, FileText, Play } from 'lucide-react';
import { useAppContext, supabase } from '../context/AppContext';
import TodaysScheduleWidget from '../components/TodaysScheduleWidget';

export default function TeamLeaderWorkspace() {
 const { 
   currentUser, isTeamLeader, projectTeams, projectModules, tasks, employees, 
   getEmployeeWorkload, dailyWorkSubmissions, taskDeliverables, fetchGlobalData, 
   triggerNotification, moduleSubmissions, dailyTeamReports, finalTeamReports, projects 
 } = useAppContext();
 
 if (!currentUser || !isTeamLeader(currentUser.id)) {
 return <Navigate to="/employee/dashboard" />;
 }

 const myTeams = projectTeams.filter(t => t.team_leader_id === currentUser.id);
 const [selectedTeamId, setSelectedTeamId] = useState(myTeams[0]?.id);
 const selectedTeam = myTeams.find(t => t.id === selectedTeamId);

 const teamModules = projectModules.filter(m => m.team_id === selectedTeamId);
 const teamTasks = tasks.filter(t => teamModules.some(m => m.id === t.module_id));
 
 const allMyTeamModules = projectModules.filter(m => myTeams.some(t => t.id === m.team_id));
 const allMyTeamTasks = tasks.filter(t => allMyTeamModules.some(m => m.id === t.module_id));

 const pendingSubmissions = dailyWorkSubmissions.filter(s => s.status === 'Pending TL Review' && allMyTeamTasks.some(t => t.id === s.task_id));
 const pendingFinalReviews = allMyTeamTasks.filter(t => t.status === 'Under Final Review');
 const completedTasks = teamTasks.filter(t => t.status === 'Completed' || t.status === 'Approved');

 const [activeTab, setActiveTab] = useState('modules'); // modules, reviews, report, feedback, submissions
 const [submissionLogTab, setSubmissionLogTab] = useState('employee_to_tl'); // 'employee_to_tl', 'tl_to_manager'
 const [submissionLogFilter, setSubmissionLogFilter] = useState('daily'); // 'daily', 'final' (for employee_to_tl)
 const [expandedSubId, setExpandedSubId] = useState(null);

 // --- Submissions Data Derivation ---
 const tlEmployeeIds = new Set();
 myTeams.forEach(t => { (t.team_members || []).forEach(m => tlEmployeeIds.add(m)); });
 
 const teamDailyUpdates = dailyWorkSubmissions
   .filter(s => tlEmployeeIds.has(s.employee_id))
   .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
   
 const teamDeliverables = taskDeliverables
   .filter(d => tlEmployeeIds.has(d.employee_id))
   .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

 const myManagerSubmissions = [
   ...(moduleSubmissions || []).filter(s => s.tl_id === currentUser.id || s.submitted_by === currentUser.id).map(s => ({ ...s, submission_type: 'Final Module Submission', display_date: s.submitted_at || s.created_at })),
   ...(dailyTeamReports || []).filter(s => s.tl_id === currentUser.id || s.submitted_by === currentUser.id).map(s => ({ ...s, submission_type: 'Daily Update', display_date: s.created_at })),
   ...(finalTeamReports || []).filter(s => s.tl_id === currentUser.id).map(s => ({ ...s, submission_type: 'Final Project Report', display_date: s.submitted_at || s.created_at }))
 ].sort((a, b) => new Date(b.display_date) - new Date(a.display_date));
 // ------------------------------------

 const allModulesApproved = teamModules.length > 0 && teamModules.every(m => m.manager_approved === true);
 const [showFinalReportModal, setShowFinalReportModal] = useState(false);

 const formatStartedAt = (dateStr) => {
   if (!dateStr) return '';
   const d = new Date(dateStr);
   return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
 };
 const [finalReportData, setFinalReportData] = useState({ project_summary: '', team_performance: '', technologies_used: '', challenges: '', improvements: '', lessons_learned: '' });

 // Modals & Forms
 const [showTaskModal, setShowTaskModal] = useState(false);
 const [selectedModuleForTask, setSelectedModuleForTask] = useState(null);
 const [newTask, setNewTask] = useState({ name: '', description: '', task_type: '', notes: '', employee_id: '', due_date: '', start_date: '', estimated_hours: 0, priority: 'Medium' });

 const [showReviewModal, setShowReviewModal] = useState(false);
 const [selectedSubmission, setSelectedSubmission] = useState(null);
 const [reviewComment, setReviewComment] = useState('');
 const [reviewRating, setReviewRating] = useState(5);

 const [showFinalTaskReviewModal, setShowFinalTaskReviewModal] = useState(false);
 const [selectedTaskForReview, setSelectedTaskForReview] = useState(null);
 const [finalReviewFeedback, setFinalReviewFeedback] = useState('');
 const [finalReviewRating, setFinalReviewRating] = useState(5);
 const [finalReviewQuality, setFinalReviewQuality] = useState(100);
 const [finalReviewSuggestions, setFinalReviewSuggestions] = useState('');

 // Module Submit State
 const [showModuleSubmitModal, setShowModuleSubmitModal] = useState(false);
 const [selectedModuleForSubmit, setSelectedModuleForSubmit] = useState(null);
 const [moduleSubmitNotes, setModuleSubmitNotes] = useState('');
 const [moduleSubmitSourceUrl, setModuleSubmitSourceUrl] = useState('');
 const [moduleSubmitFilesUrl, setModuleSubmitFilesUrl] = useState('');
 const [moduleSubmitLiveUrl, setModuleSubmitLiveUrl] = useState('');
 const [moduleSubmitTesting, setModuleSubmitTesting] = useState('');
 const [moduleSubmitDeployment, setModuleSubmitDeployment] = useState('');

 // Daily Report State
 const [reportText, setReportText] = useState('');
 const [isSubmittingReport, setIsSubmittingReport] = useState(false);

 // Feedback State
 const [feedbackData, setFeedbackData] = useState({});

 const handleCreateTask = async (e) => {
 e.preventDefault();
 try {
 const { data, error } = await supabase.from('tasks').insert({
 module_id: selectedModuleForTask.id,
 project_id: selectedModuleForTask.project_id,
 employee_id: newTask.employee_id,
 name: newTask.name,
 description: newTask.description,
 task_type: newTask.task_type,
 notes: newTask.notes,
 start_date: newTask.start_date,
 due_date: newTask.due_date,
 estimated_hours: newTask.estimated_hours,
 status: 'Not Started',
 priority: newTask.priority,
 approval_status: 'Pending'
 }).select().single();
 
 if (error) throw error;
 
 await supabase.from('task_history').insert({
 task_id: data.id,
 performed_by: currentUser.id,
 action: 'Created & Assigned',
 new_status: 'Not Started',
 comments: 'Task created and assigned by Team Leader.'
 });

 triggerNotification(newTask.employee_id, 'New Task Assigned', `You have been assigned a new task: ${newTask.name}`, 'task_assigned', data.id);

 // Enterprise Reward Sync: Lock the reward when a module starts getting tasks
 await supabase.from('enterprise_rewards')
   .update({ status: 'Locked' })
   .contains('module_ids', [selectedModuleForTask.id])
   .eq('status', 'Assigned');

 setShowTaskModal(false);
 setNewTask({ name: '', description: '', task_type: '', notes: '', employee_id: '', due_date: '', start_date: '', estimated_hours: 0, priority: 'Medium' });
 fetchGlobalData();
 } catch (err) {
 console.error('Error assigning task:', err);
 }
 };

 const handleReview = async (decision) => {
 try {
 const sub = selectedSubmission;
 const isApprove = decision === 'Approve';
 const newSubStatus = isApprove ? 'Approved' : 'Rejected';

 // Update daily_work_submissions
 await supabase.from('daily_work_submissions').update({
 status: newSubStatus,
 tl_comments: reviewComment,
 rejection_reason: isApprove ? null : reviewComment,
 rating: reviewRating,
 reviewed_at: new Date().toISOString()
 }).eq('id', sub.id);

 if (isApprove) {
   await supabase.from('tasks').update({ progress: sub.progress_pct }).eq('id', sub.task_id);
 }

 // History
 await supabase.from('task_history').insert({
 task_id: sub.task_id,
 performed_by: currentUser.id,
 action: `TL ${decision}d Daily Submission`,
 new_status: 'In Progress',
 comments: reviewComment || (isApprove ? 'Daily submission approved!' : 'Daily submission rejected.')
 });

 // Notify Employee
 const taskObj = allMyTeamTasks.find(t => t.id === sub.task_id);
 triggerNotification(
 sub.employee_id, 
 `Daily Submission ${decision}d`, 
 `Your daily update for task "${taskObj?.name || 'Task'}" was ${newSubStatus}.`, 
 isApprove ? 'task_approved' : 'task_rejected', 
 sub.task_id
 );

 setShowReviewModal(false);
 setReviewComment('');
 setReviewRating(5);
 fetchGlobalData();
 } catch (err) {
 console.error('Error reviewing task:', err);
 }
 };

 const handleFinalTaskReview = async (decision) => {
 try {
 const task = selectedTaskForReview;
 const isApprove = decision === 'Approve';
 const nextTaskStatus = isApprove ? 'Completed' : 'In Progress';
 const nextTaskProgress = isApprove ? 100 : 99;

 const { error: updateError } = await supabase.from('tasks').update({
 status: nextTaskStatus,
 progress: nextTaskProgress,
 final_rating: isApprove ? finalReviewRating : null,
 quality_score: isApprove ? finalReviewQuality : null,
 tl_feedback: finalReviewFeedback,
 improvement_suggestions: isApprove ? finalReviewSuggestions : null,
 approved_at: isApprove ? new Date().toISOString() : null,
 approved_by: isApprove ? currentUser.id : null,
 approval_status: isApprove ? 'Approved' : 'Rejected'
 }).eq('id', task.id);

 if (updateError) throw updateError;

 // History log
 const { error: historyError } = await supabase.from('task_history').insert({
 task_id: task.id,
 performed_by: currentUser.id,
 action: `TL ${decision}d Final Task`,
 new_status: nextTaskStatus,
 comments: finalReviewFeedback || (isApprove ? 'Completed task approved!' : 'Task returned to In Progress.')
 });

 if (historyError) throw historyError;

 // Notify employee
 triggerNotification(
 task.employee_id,
 isApprove ? 'Task Final Approval' : 'Task Revision Needed',
 `Your task "${task.name}" was ${isApprove ? 'Approved' : 'Rejected'} by your Team Leader.`,
 isApprove ? 'task_approved' : 'task_rejected',
 task.id
 );

 setShowFinalTaskReviewModal(false);
 setFinalReviewFeedback('');
 setFinalReviewRating(5);
 setFinalReviewQuality(100);
 setFinalReviewSuggestions('');
 fetchGlobalData();
 alert(`Task review submitted as ${decision}.`);
 } catch (err) {
 console.error('Error in final task review:', err);
 alert('Failed to process task review: ' + (err.message || 'Unknown error'));
 }
 };

 const submitDailyReport = async (e) => {
 e.preventDefault();
 if (!reportText) return;
 setIsSubmittingReport(true);
 try {
 await supabase.from('daily_team_reports').insert({
 project_id: teamModules[0]?.project_id, // Assume team belongs to a single project
 team_id: selectedTeamId,
 tl_id: currentUser.id,
 team_productivity: reportText,
 status: 'Pending Manager Review'
 });

 // Find manager and notify
 const { data: proj } = await supabase.from('projects').select('manager_id').eq('id', teamModules[0]?.project_id).single();
 if (proj) {
 triggerNotification(proj.manager_id, 'Daily Team Report', `Team ${selectedTeam?.team_name} submitted their daily report.`, 'team_report', selectedTeamId);
 }

 setReportText('');
 alert('Daily report submitted successfully!');
 fetchGlobalData();
 } catch (err) {
 console.error('Error submitting report:', err);
 } finally {
 setIsSubmittingReport(false);
 }
 };

 const openModuleSubmitModal = (mod) => {
   setSelectedModuleForSubmit(mod);
   setShowModuleSubmitModal(true);
 };

 const submitModuleToManager = async (e) => {
 e.preventDefault();
 const mod = selectedModuleForSubmit;
 if (!mod) return;
 
 try {
 // Create module submission
 const payload = {
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
 }

 // Lock module
 await supabase.from('project_modules').update({
 locked_at: new Date().toISOString()
 }).eq('id', mod.id);

 // Find manager and notify
 const { data: proj } = await supabase.from('projects').select('manager_id').eq('id', mod.project_id).single();
 if (proj) {
 triggerNotification(proj.manager_id, 'Module Ready for Review', `Module "${mod.name}" has been submitted for final review.`, 'module_submitted', mod.id);
 }

 // Enterprise Reward Sync: Progress reward status
 await supabase.from('enterprise_rewards')
   .update({ status: 'Waiting for Manager Approval' })
   .contains('module_ids', [mod.id])
   .eq('status', 'Locked');

 setShowModuleSubmitModal(false);
 setModuleSubmitNotes('');
 setModuleSubmitSourceUrl('');
 setModuleSubmitFilesUrl('');
 setModuleSubmitLiveUrl('');
 setModuleSubmitTesting('');
 setModuleSubmitDeployment('');
 alert('Module submitted to Manager successfully!');
 fetchGlobalData();
 } catch (err) {
 console.error('Error submitting module:', err);
 alert('Failed to submit module: ' + (err.message || 'Unknown error'));
 }
 };

 const startModule = async (mod) => {
 try {
 await supabase.from('project_modules').update({ 
   status: 'Started',
   module_started: true,
   started_by: currentUser.id,
   started_at: new Date().toISOString()
 }).eq('id', mod.id);
 
 const { data: proj } = await supabase.from('projects').select('manager_id').eq('id', mod.project_id).single();
 if (proj) {
 triggerNotification(proj.manager_id, 'Module Started', `Module"${mod.name}" has been started by the team.`, 'module_started', mod.id);
 }
 
 fetchGlobalData();
 } catch (err) {
 console.error('Error starting module:', err);
 }
 };

 const submitEmployeeFeedback = async (empId) => {
 const data = feedbackData[empId];
 if (!data || !data.productivity || !data.quality) return alert('Please provide ratings.');
 
 try {
 await supabase.from('daily_feedback').insert({
 project_id: teamModules[0]?.project_id,
 team_id: selectedTeamId,
 from_id: currentUser.id,
 to_employee_id: empId,
 feedback_type: 'TL_to_Emp',
 productivity_rating: data.productivity,
 quality_rating: data.quality,
 communication_rating: data.communication,
 collaboration_rating: data.teamwork,
 deadline_compliance_rating: data.deadline,
 problem_solving_rating: data.problem_solving,
 comments: data.comments,
 improvement_suggestions: data.improvements
 });

 triggerNotification(empId, 'New Feedback Received', `Your Team Leader has left feedback for you.`, 'feedback_received', currentUser.id);

 setFeedbackData(prev => ({ ...prev, [empId]: null })); // clear
 alert('Feedback submitted successfully!');
 fetchGlobalData();
 } catch (err) {
 console.error('Error submitting feedback:', err);
 }
 };

 const submitFinalReport = async (e) => {
 e.preventDefault();
 try {
 await supabase.from('final_team_reports').insert({
 project_id: teamModules[0]?.project_id,
 team_id: selectedTeamId,
 tl_id: currentUser.id,
 ...finalReportData
 });

 const { data: proj } = await supabase.from('projects').select('manager_id').eq('id', teamModules[0]?.project_id).single();
 if (proj) {
 triggerNotification(proj.manager_id, 'Final Team Report', `Team ${selectedTeam?.team_name} submitted their Final Team Report!`, 'final_report', selectedTeamId);
 }

 setShowFinalReportModal(false);
 alert('Final Team Report submitted successfully!');
 fetchGlobalData();
 } catch (err) {
 console.error('Error submitting final report', err);
 }
 };

 return (
 <div className="max-w-7xl mx-auto pb-24">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
 <div>
 <h1 className="page-title flex items-center gap-2">
 <Briefcase className="w-6 h-6 text-[var(--text-primary)]" /> Team Leader Workspace
 </h1>
 <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your team workflow, review submissions, and report to the Manager.</p>
 </div>
 
 <div className="flex items-center gap-3">
 {myTeams.length > 1 && (
 <select className="px-3 py-2 linear-card outline-none text-sm font-medium text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--ring-focus)] focus:border-[#111111] transition-colors duration-150"
 value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)}>
 {myTeams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
 </select>
 )}
 
 {allModulesApproved && (
 <button 
 onClick={() => setShowFinalReportModal(true)}
 className="flex items-center gap-2 px-4 py-2 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] text-sm font-semibold transition-colors duration-150 border border-[var(--border)]"
 >
 <CheckCircle className="w-4 h-4" /> Submit Final Team Report
 </button>
 )}
 </div>
 </div>

 <div className="flex gap-1 p-1 linear-card mb-10 overflow-x-auto w-full md:w-fit">
 {['modules', 'reviews', 'reports', 'feedback', 'submissions'].map(tab => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={`flex-1 md:flex-none py-2 px-4 text-sm font-medium transition-colors duration-150 capitalize whitespace-nowrap ${
 activeTab === tab ? 'bg-[var(--surface)] text-[var(--text-primary)] ' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] '
 }`}
 >
 {tab === 'reviews' && (pendingSubmissions.length + pendingFinalReviews.length) > 0 ? `Review Queue (${pendingSubmissions.length + pendingFinalReviews.length})` : tab}
 </button>
 ))}
 </div>

 {activeTab === 'modules' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
 <div className="linear-card p-5 flex items-center gap-6 hover:border-[var(--border)] transition-colors">
 <div className="w-10 h-10 bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)]"><LayoutGrid className="w-5 h-5" /></div>
 <div><p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Modules</p><p className="section-title">{teamModules.length}</p></div>
 </div>
 <div className="linear-card p-5 flex items-center gap-6 hover:border-[var(--border)] transition-colors">
 <div className="w-10 h-10 bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)]"><Users className="w-5 h-5" /></div>
 <div><p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Members</p><p className="section-title">{selectedTeam?.team_members?.length || 0}</p></div>
 </div>
 </div>

 {teamModules.length === 0 ? (
 <div className="p-8 text-center text-[var(--text-secondary)] linear-card text-sm">No modules assigned to your team yet.</div>
 ) : (
 teamModules.map(mod => {
 const modTasks = teamTasks.filter(t => t.module_id === mod.id);
 const isLocked = mod.locked_at !== null;
 
 return (
 <div key={mod.id} className={`bg-[var(--surface)] border overflow-hidden border-[#111111]`}>
 <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[var(--surface)] border-[#111111]`}>
 <div>
 <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 text-base">
 {mod.name} 
 {isLocked && <span className="bg-[var(--bg-secondary)] border border-[#2A2A2A] text-[var(--text-primary)] text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold">Locked (Under Review)</span>}
 {mod.manager_approved && <span className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--border)] text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold">Manager Approved</span>}
 </h3>
 <p className="text-sm text-[var(--text-secondary)] mt-1">{mod.description}</p>
 {mod.module_started && (
   <div className="mt-4 p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded flex gap-6 text-xs text-[var(--text-secondary)]">
     <div>
       <span className="font-semibold text-[var(--text-primary)] block mb-0.5">Module Started</span>
       <span className="opacity-75 mr-1">Started by:</span>
       <span className="font-medium text-[var(--text-primary)]">{employees.find(e => e.id === mod.started_by)?.name || 'Unknown'}</span>
     </div>
     <div className="flex flex-col justify-end">
       <div>
         <span className="opacity-75 mr-1">Started On:</span>
         <span className="font-medium text-[var(--text-primary)]">{formatStartedAt(mod.started_at)}</span>
       </div>
     </div>
   </div>
 )}
 </div>
  {!isLocked && (() => {
  const isModuleComplete = modTasks.length > 0 && modTasks.every(t => t.status === 'Completed');
  return (
  <div className="flex flex-wrap gap-2">
  {!mod.module_started && mod.status !== 'Completed' && (
  <button onClick={() => startModule(mod)} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] px-3 py-1.5 transition-colors duration-150 border border-[var(--border)]">
  <Play className="w-3.5 h-3.5" /> Start Module
  </button>
  )}
  <button onClick={() => { setSelectedModuleForTask(mod); setShowTaskModal(true); }} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:linear-card px-3 py-1.5 transition-colors duration-150">
  <Plus className="w-3.5 h-3.5" /> Add Task
  </button>
  <button 
  disabled={!isModuleComplete}
  onClick={() => openModuleSubmitModal(mod)} 
  className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 transition-colors duration-150 border border-[var(--border)] ${isModuleComplete ? 'text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)]' : 'opacity-40 cursor-not-allowed text-[var(--text-secondary)] bg-[var(--bg-secondary)]'}`}
  >
  <CheckCircle className="w-3.5 h-3.5" /> Submit to Manager
  </button>
   
  </div>
  );
  })()}
 </div>
 <div className="p-6">
 {modTasks.length === 0 ? (
 <p className="text-sm text-[var(--text-secondary)] italic">No tasks created for this module.</p>
 ) : (
 <div className="space-y-2">
 {modTasks.map(t => {
 const emp = employees.find(e => e.id === t.employee_id);
 return (
 <div key={t.id} className="flex items-center justify-between p-3 linear-card hover:bg-[var(--bg-secondary)] transition-colors duration-150">
 <div className="flex items-center gap-3">
 <div className={`w-2 h-2 rounded-full ${t.status === 'Completed' ? 'bg-white' : 'bg-[#2A2A2A]'}`}></div>
 <div>
 <p className="text-sm font-semibold text-[var(--text-primary)]">{t.name}</p>
 <p className="text-xs text-[var(--text-secondary)] mt-0.5">Assigned to: {emp ? emp.name : 'Unassigned'}</p>
 </div>
 </div>
 <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${t.status === 'Completed' ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]' : 'linear-card text-[var(--text-secondary)] '}`}>
 {t.status}
 </span>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 );
 })
 )}
 </div>
 )}

 {activeTab === 'reviews' && (
 <div className="space-y-10">
   {/* Daily Updates Section */}
   <div className="space-y-6">
 <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
 <Clock className="w-4 h-4 text-[var(--text-secondary)]" /> Daily Updates Awaiting Review
 </h2>
 {pendingSubmissions.length === 0 ? (
 <div className="linear-card p-8 text-center">
 <CheckCircle className="w-8 h-8 text-[var(--text-secondary)] opacity-50 mx-auto mb-4" />
 <p className="text-sm text-[var(--text-secondary)]">No daily updates pending your review.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {pendingSubmissions.map(sub => {
 const task = allMyTeamTasks.find(t => t.id === sub.task_id);
 const emp = employees.find(e => e.id === sub.employee_id);
 return (
 <div key={sub.id} className="p-5 border-l-4 border-l-white linear-card flex flex-col justify-between">
 <div>
 <div className="flex justify-between items-start mb-2">
 <p className="font-semibold text-[var(--text-primary)]">{task?.name || 'Unknown Task'}</p>
 <span className="bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[10px] font-medium px-2 py-0.5 rounded">{sub.progress_pct}%</span>
 </div>
 <p className="text-xs text-[var(--text-secondary)] mb-6 flex items-center gap-1"><Users className="w-3.5 h-3.5"/> By {emp?.name || 'Unknown'}</p>
 
 <div className="linear-card p-3 mb-6">
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase mb-1">Work Notes</p>
 <p className="text-sm text-[var(--text-primary)] italic">"{sub.work_notes}"</p>
 </div>
 </div>
 <button 
 onClick={() => { setSelectedSubmission(sub); setShowReviewModal(true); }}
 className="w-full font-semibold text-sm bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] py-2 transition-colors duration-150 border border-[var(--border)]"
 >
 Review Submission
 </button>
 </div>
 );
 })}
 </div>
 )}
   </div>

   {/* Final Task Approvals Section */}
   <div className="space-y-6">
 <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
 <CheckCircle className="w-4 h-4 text-[var(--text-secondary)]" /> Tasks Awaiting Final Approval
 </h2>
 {pendingFinalReviews.length === 0 ? (
 <div className="linear-card p-8 text-center">
 <CheckCircle className="w-8 h-8 text-[var(--text-secondary)] opacity-50 mx-auto mb-4" />
 <p className="text-sm text-[var(--text-secondary)]">No tasks pending final approval.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {pendingFinalReviews.map(task => {
 const emp = employees.find(e => e.id === task.employee_id);
 return (
 <div key={task.id} className="p-5 border-l-4 border-l-amber-500 linear-card flex flex-col justify-between">
 <div>
 <div className="flex justify-between items-start mb-2">
 <p className="font-semibold text-[var(--text-primary)]">{task.name}</p>
 <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded">100% Progress</span>
 </div>
 <p className="text-xs text-[var(--text-secondary)] mb-4 flex items-center gap-1"><Users className="w-3.5 h-3.5"/> Assigned to: {emp?.name || 'Unknown'}</p>
 
 {(() => {
   const deliverable = (taskDeliverables || [])
     .filter(d => d.task_id === task.id)
     .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0];

   return (
     <div className="linear-card p-3 mb-6 bg-[var(--bg-secondary)] border border-amber-500/30">
       <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-2">Submitted Deliverables</p>
       {deliverable ? (
         <div className="text-xs text-[var(--text-primary)] whitespace-pre-wrap break-words">
           {deliverable.description}
         </div>
       ) : (
         <p className="text-xs text-[var(--text-secondary)]">No final submission details found.</p>
       )}
       {deliverable?.link_url && deliverable.link_url !== 'N/A' && !deliverable.link_url.includes('Final Deliverables:') && (
         <a href={deliverable.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs mt-3 block break-all font-medium">
           🔗 Main Link: {deliverable.link_url}
         </a>
       )}
     </div>
   );
 })()}
 </div>
 <button 
 onClick={() => { setSelectedTaskForReview(task); setShowFinalTaskReviewModal(true); }}
 className="w-full font-semibold text-sm bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] py-2 transition-colors duration-150 border border-[var(--border)]"
 >
 Approve / Reject Task
 </button>
 </div>
 );
 })}
 </div>
 )}
   </div>
 </div>
 )}

 {activeTab === 'reports' && (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div className="linear-card p-6">
 <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-1">
 <FileText className="w-4 h-4 text-[var(--text-primary)]" /> Daily Team Report
 </h2>
 <p className="text-[var(--text-secondary)] text-sm mb-6">Submit a summary of your team's progress to the Project Manager.</p>
 
 <form onSubmit={submitDailyReport}>
 <textarea 
 required
 className="linear-input min-h-[100px] py-3"
 placeholder="Summarize today's achievements, blockers, and overall team performance..."
 value={reportText}
 onChange={e => setReportText(e.target.value)}
 />
 <button 
 type="submit" 
 disabled={isSubmittingReport || !reportText}
 className="btn-primary"
 >
 <Send className="w-4 h-4" /> Submit Report to Manager
 </button>
 </form>
 </div>
 </div>
 )}

 {activeTab === 'feedback' && (
 <div className="space-y-6">
 <div className="linear-card p-6 mb-6">
 <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-1">
 <Star className="w-4 h-4 text-[var(--text-secondary)]" /> Daily Team Feedback
 </h2>
 <p className="text-[var(--text-secondary)] text-sm">Provide constructive daily feedback for your team members.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {(selectedTeam?.team_members || []).map(empId => {
 const emp = employees.find(e => e.id === empId);
 if (!emp) return null;
 
 const data = feedbackData[empId] || { productivity: 0, quality: 0, communication: 0, teamwork: 0, problem_solving: 0, deadline: 0, comments: '', improvements: '' };
 
 return (
 <div key={empId} className="linear-card p-6">
 <div className="flex items-center gap-3 mb-6 border-b border-[var(--border)] pb-4">
 <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center font-semibold text-[var(--text-primary)]">
 {emp.name.charAt(0)}
 </div>
 <div>
 <p className="font-semibold text-[var(--text-primary)]">{emp.name}</p>
 <p className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-secondary)]">{emp.role}</p>
 </div>
 </div>

 <div className="space-y-6">
 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Prod (1-5)</label>
 <input type="number" min="1" max="5" className="linear-input" 
 value={data.productivity || ''} onChange={e => setFeedbackData({...feedbackData, [empId]: {...data, productivity: e.target.value}})} />
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Qual (1-5)</label>
 <input type="number" min="1" max="5" className="linear-input" 
 value={data.quality || ''} onChange={e => setFeedbackData({...feedbackData, [empId]: {...data, quality: e.target.value}})} />
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Comm (1-5)</label>
 <input type="number" min="1" max="5" className="linear-input" 
 value={data.communication || ''} onChange={e => setFeedbackData({...feedbackData, [empId]: {...data, communication: e.target.value}})} />
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Team (1-5)</label>
 <input type="number" min="1" max="5" className="linear-input" 
 value={data.teamwork || ''} onChange={e => setFeedbackData({...feedbackData, [empId]: {...data, teamwork: e.target.value}})} />
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Prob (1-5)</label>
 <input type="number" min="1" max="5" className="linear-input" 
 value={data.problem_solving || ''} onChange={e => setFeedbackData({...feedbackData, [empId]: {...data, problem_solving: e.target.value}})} />
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Dead (1-5)</label>
 <input type="number" min="1" max="5" className="linear-input" 
 value={data.deadline || ''} onChange={e => setFeedbackData({...feedbackData, [empId]: {...data, deadline: e.target.value}})} />
 </div>
 </div>
 
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Comments</label>
 <textarea rows="2" className="linear-input min-h-[100px] py-3" 
 value={data.comments} onChange={e => setFeedbackData({...feedbackData, [empId]: {...data, comments: e.target.value}})} placeholder="Good work today..." />
 </div>
 
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-primary)] mb-1 uppercase tracking-wider">Improvement Suggestions</label>
 <textarea rows="2" className="linear-input min-h-[100px] py-3" 
 value={data.improvements} onChange={e => setFeedbackData({...feedbackData, [empId]: {...data, improvements: e.target.value}})} placeholder="Try to focus on..." />
 </div>
 
 <button onClick={() => submitEmployeeFeedback(empId)} className="w-full bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-semibold py-2 transition-colors text-sm border border-[var(--border)] mt-4">
 Submit Feedback
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Modals remain structurally similar but connected to new data */}
 {showReviewModal && selectedSubmission && (() => {
 const task = teamTasks.find(t => t.id === selectedSubmission.task_id);
 const emp = employees.find(e => e.id === selectedSubmission.employee_id);
 
 return (
 <div className="fixed inset-0 bg-[var(--surface)]/50 flex items-center justify-center p-6 z-50 transition-opacity">
 <div className="linear-card max-w-lg w-full p-6">
 <h2 className="section-title mb-1">Review Submission</h2>
 <p className="text-[var(--text-secondary)] text-sm mb-6 font-medium">Task: <span className="font-semibold text-[var(--text-primary)]">{task?.name}</span> by {emp?.name}</p>
 
 <div className="space-y-6 mb-6">
 <div className="linear-card p-6">
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Work Notes</p>
 <p className="text-sm text-[var(--text-primary)]">{selectedSubmission.work_notes}</p>
 </div>
 
 <div className="grid grid-cols-2 gap-6">
 <div className="linear-card p-3">
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Time Spent</p>
 <p className="font-semibold text-[var(--text-primary)]">{Math.floor(selectedSubmission.time_spent_minutes / 60)}h {selectedSubmission.time_spent_minutes % 60}m</p>
 </div>
 <div className="linear-card p-3">
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Progress</p>
 <p className="font-semibold text-[var(--text-primary)]">{selectedSubmission.progress_pct}%</p>
 </div>
 </div>

 {(selectedSubmission.github_link || selectedSubmission.demo_link || selectedSubmission.attachments) && (
 <div className="bg-blue-50 border border-blue-100 p-6 space-y-2">
 <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2">Deliverables</p>
 {selectedSubmission.github_link && <a href={selectedSubmission.github_link} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-[var(--text-primary)] hover:text-[var(--text-primary)]">🐙 GitHub Link</a>}
 {selectedSubmission.demo_link && <a href={selectedSubmission.demo_link} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-[var(--text-primary)] hover:text-[var(--text-primary)]">🌐 Live Demo</a>}
 {selectedSubmission.attachments && <p className="text-sm text-[var(--text-secondary)] break-all">📎 {selectedSubmission.attachments}</p>}
 </div>
 )}
 </div>

 <div className="mb-6">
 <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Rating (1-5 Stars)</label>
 <div className="flex gap-2 mb-4">
 {[1, 2, 3, 4, 5].map((num) => (
 <button
 type="button"
 key={num}
 onClick={() => setReviewRating(num)}
 className={`p-1 transition-colors duration-150 ${reviewRating >= num ? 'text-amber-500' : 'text-[var(--text-secondary)] opacity-30'}`}
 >
 <Star className="w-6 h-6 fill-current" />
 </button>
 ))}
 </div>
 </div>

 <div className="mb-6">
 <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Review Comments (Required for Rejection)</label>
 <textarea 
 className="linear-input min-h-[100px] py-3" 
 rows="3" 
 value={reviewComment} 
 onChange={e => setReviewComment(e.target.value)} 
 placeholder="Leave feedback for the employee..." 
 />
 </div>

 <div className="flex gap-2 justify-end pt-4 border-t border-[var(--border)]">
 <button type="button" onClick={() => { setShowReviewModal(false); setReviewComment(''); setReviewRating(5); }} className="px-4 py-2 text-sm text-[var(--text-secondary)] font-medium hover:bg-[var(--surface)] transition-colors duration-150">Cancel</button>
 <button type="button" onClick={() => handleReview('Reject')} className="px-4 py-2 text-sm border border-[var(--border)] hover:border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold transition-colors duration-150">Reject</button>
 <button type="button" onClick={() => handleReview('Approve')} className="px-4 py-2 text-sm bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-semibold transition-colors duration-150 border border-[var(--border)]">Approve</button>
 </div>
 </div>
 </div>
 );
 })()}
 
 {/* Task Creation Modal omitted for brevity, it's mostly identical but preserved in earlier code block if needed, let me just add it so it works! */}
  {showFinalTaskReviewModal && selectedTaskForReview && (
 <div className="fixed inset-0 bg-[var(--surface)]/50 flex items-center justify-center p-6 z-50 transition-opacity">
 <div className="linear-card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
 <h2 className="section-title mb-6">Final Task Review: {selectedTaskForReview.name}</h2>
 <div className="space-y-4 mb-6">
  <div>
    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Feedback/Comments</label>
    <textarea className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm" rows="3" value={finalReviewFeedback} onChange={(e) => setFinalReviewFeedback(e.target.value)}></textarea>
  </div>
  <div>
    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Improvement Suggestions</label>
    <textarea className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm" rows="3" value={finalReviewSuggestions} onChange={(e) => setFinalReviewSuggestions(e.target.value)}></textarea>
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Rating (1-5)</label>
      <input type="number" min="1" max="5" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm" value={finalReviewRating} onChange={(e) => setFinalReviewRating(e.target.value)} />
    </div>
    <div>
      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Quality Score (0-100)</label>
      <input type="number" min="0" max="100" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm" value={finalReviewQuality} onChange={(e) => setFinalReviewQuality(e.target.value)} />
    </div>
  </div>
 </div>
 <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
 <button type="button" onClick={() => { setShowFinalTaskReviewModal(false); setSelectedTaskForReview(null); setFinalReviewFeedback(''); setFinalReviewSuggestions(''); setFinalReviewRating(5); setFinalReviewQuality(100); }} className="px-4 py-2 text-sm text-[var(--text-secondary)] font-medium hover:bg-[var(--surface)] transition-colors duration-150">Cancel</button>
 <button type="button" onClick={() => handleFinalTaskReview('Reject')} className="px-4 py-2 text-sm border border-[var(--border)] hover:border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold transition-colors duration-150">Reject</button>
 <button type="button" onClick={() => handleFinalTaskReview('Approve')} className="px-4 py-2 text-sm bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-semibold transition-colors duration-150 border border-[var(--border)]">Approve</button>
 </div>
 </div>
 </div>
 )}

{showTaskModal && (
 <div className="fixed inset-0 bg-[var(--bg-primary)]/50 flex items-center justify-center p-6 z-50 transition-opacity">
 <div className="linear-card max-w-2xl w-full p-6">
 <h2 className="section-title mb-6">Create Task</h2>
 <form onSubmit={handleCreateTask} className="space-y-6">
 <input required type="text" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-black" placeholder="Task Name" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} />
 <textarea required className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-black" placeholder="Description" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
 <select required className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-black" value={newTask.employee_id} onChange={e => setNewTask({...newTask, employee_id: e.target.value})}>
 <option value="">Assign to...</option>
 {(selectedTeam?.team_members || []).map(id => {
 const e = employees.find(emp => emp.id === id);
 return e ? <option key={e.id} value={e.id}>{e.name}</option> : null;
 })}
 </select>
 <div className="grid grid-cols-2 gap-6">
 <input required type="date" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--ring-focus)]" value={newTask.start_date} onChange={e => setNewTask({...newTask, start_date: e.target.value})} />
 <input required type="date" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--ring-focus)]" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} />
 </div>
 <div className="pt-4 flex justify-end gap-2 border-t border-[var(--border)] mt-6">
 <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">Cancel</button>
 <button type="submit" className="btn-primary">Create Task</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {activeTab === 'submissions' && (
   <div className="space-y-6">
     <div className="linear-card p-6 mb-6">
       <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-1">
         <FileText className="w-5 h-5 text-[var(--text-secondary)]" /> Submission Logs
       </h2>
       <p className="text-[var(--text-secondary)] text-sm mb-6">Track work submitted by your team and modules sent to management.</p>
       
       <div className="flex gap-2 p-1 bg-[var(--bg-secondary)] rounded-md w-fit border border-[var(--border)]">
         <button 
           onClick={() => setSubmissionLogTab('employee_to_tl')}
           className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors ${submissionLogTab === 'employee_to_tl' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
         >
           Employee Submissions
         </button>
         <button 
           onClick={() => setSubmissionLogTab('tl_to_manager')}
           className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors ${submissionLogTab === 'tl_to_manager' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
         >
           My Submissions to Manager
         </button>
       </div>
     </div>

     {submissionLogTab === 'employee_to_tl' && (
       <div className="space-y-4">
         <div className="flex gap-4 border-b border-[var(--border)] pb-2">
           <button onClick={() => setSubmissionLogFilter('daily')} className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${submissionLogFilter === 'daily' ? 'border-[var(--text-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Daily Updates ({teamDailyUpdates.length})</button>
           <button onClick={() => setSubmissionLogFilter('final')} className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${submissionLogFilter === 'final' ? 'border-[var(--text-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Task Deliverables ({teamDeliverables.length})</button>
         </div>

         {submissionLogFilter === 'daily' && (
           <div className="space-y-4">
             {teamDailyUpdates.length === 0 ? <p className="text-sm text-[var(--text-secondary)] p-6 linear-card text-center">No daily updates found from your team.</p> : (
               teamDailyUpdates.map(sub => {
                 const task = tasks.find(t => t.id === sub.task_id);
                 return (
                   <div key={sub.id} className="linear-card p-4 border-l-4 border-l-blue-500">
                     <div className="flex justify-between items-start mb-3">
                       <div>
                         <p className="font-semibold text-[var(--text-primary)]">{task?.name || 'Unknown Task'}</p>
                         <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                           <Clock className="w-3 h-3 text-blue-500" /> By {employees.find(e => e.id === sub.employee_id)?.name} at {formatStartedAt(sub.submitted_at)}
                         </p>
                       </div>
                       <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                         {sub.progress_pct}% Progress
                       </span>
                     </div>
                     <div className="bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border)]">
                       <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Work Notes</p>
                       <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{sub.work_notes}</p>
                     </div>
                     {sub.tl_comments && (
                       <div className="mt-3 pt-3 border-t border-[var(--border)]">
                         <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">TL Feedback (Rating: {sub.rating}/5)</p>
                         <p className="text-sm text-[var(--text-primary)]">{sub.tl_comments}</p>
                       </div>
                     )}
                   </div>
                 );
               })
             )}
           </div>
         )}

         {submissionLogFilter === 'final' && (
           <div className="space-y-4">
             {teamDeliverables.length === 0 ? <p className="text-sm text-[var(--text-secondary)] p-6 linear-card text-center">No task deliverables found from your team.</p> : (
               teamDeliverables.map(sub => {
                 const task = tasks.find(t => t.id === sub.task_id);
                 return (
                   <div key={sub.id} className="linear-card p-4 border-l-4 border-l-green-500">
                     <div className="flex justify-between items-start mb-3">
                       <div>
                         <p className="font-semibold text-[var(--text-primary)]">{task?.name || 'Unknown Task'}</p>
                         <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                           <CheckCircle className="w-3 h-3 text-green-500" /> Submitted by {employees.find(e => e.id === sub.employee_id)?.name} at {formatStartedAt(sub.submitted_at)}
                         </p>
                       </div>
                       <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20">
                         Final Submission
                       </span>
                     </div>
                     <div className="bg-[var(--bg-secondary)] p-3 rounded border border-green-500/30">
                       <p className="text-[10px] font-semibold text-green-500 uppercase tracking-wider mb-1">Deliverable Details</p>
                       <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{sub.description}</p>
                       {sub.link_url && sub.link_url !== 'N/A' && !sub.link_url.includes('Final Deliverables:') && (
                         <a href={sub.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs mt-2 block break-all font-medium">
                           🔗 Attached Link: {sub.link_url}
                         </a>
                       )}
                     </div>
                   </div>
                 );
               })
             )}
           </div>
         )}
       </div>
     )}

     {submissionLogTab === 'tl_to_manager' && (
       <div className="space-y-4">
         {myManagerSubmissions.length === 0 ? <p className="text-sm text-[var(--text-secondary)] p-6 linear-card text-center">You have not submitted anything to the manager yet.</p> : (
           myManagerSubmissions.map(sub => (
             <div key={sub.id} className="linear-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {sub.submission_type === 'Final Module Submission' ? <CheckCircle className="w-4 h-4 text-purple-500" /> : <FileText className="w-4 h-4 text-amber-500" />}
                    <span className="font-semibold text-[var(--text-primary)] uppercase text-xs tracking-wider">{sub.submission_type}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{formatStartedAt(sub.display_date)}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${sub.status?.includes('Pending') ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : sub.status?.includes('Reject') ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>{sub.status || 'Pending'}</span>
                </div>
                
                {sub.submission_type === 'Daily Update' && <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap mt-2">{sub.summary}</p>}
                
                {sub.submission_type === 'Final Module Submission' && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-[var(--text-secondary)]">Module: {projectModules.find(m => m.id === sub.module_id)?.name}</p>
                    {sub.notes && <p className="text-sm text-[var(--text-primary)] p-3 bg-[var(--surface)] border border-[var(--border)] rounded">{sub.notes}</p>}
                    <div className="flex gap-4">
                      {sub.source_code_url && <a href={sub.source_code_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Code</a>}
                      {sub.files_url && <a href={sub.files_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Files</a>}
                      {sub.live_url && <a href={sub.live_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Live Demo</a>}
                    </div>
                  </div>
                )}
                
                {sub.submission_type === 'Final Project Report' && (
                  <div className="mt-2">
                    <p className="text-sm text-[var(--text-secondary)]">Project: {projects?.find(p => p.id === sub.project_id)?.name}</p>
                    <p className="text-sm text-[var(--text-primary)] mt-1">{sub.project_summary}</p>
                  </div>
                )}
                
                {sub.manager_feedback && (
                  <div className="mt-4 p-3 bg-[var(--surface)] border border-brand-500/30 rounded text-sm italic border-l-4 border-l-brand-500">
                    "{sub.manager_feedback}"
                  </div>
                )}
             </div>
           ))
         )}
       </div>
     )}
   </div>
 )}

 {showFinalReportModal && (
 <div className="fixed inset-0 bg-[var(--surface)]/50 flex items-center justify-center p-6 z-50 transition-opacity">
 <div className="linear-card max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
 <h2 className="section-title mb-1">Final Team Report</h2>
 <p className="text-sm text-[var(--text-secondary)] mb-6">Submit the comprehensive final report for the project.</p>
 
 <form onSubmit={submitFinalReport} className="space-y-6">
 <div>
 <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Project Summary</label>
 <textarea required className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--ring-focus)]" rows="3" value={finalReportData.project_summary} onChange={e => setFinalReportData({...finalReportData, project_summary: e.target.value})} />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Team Performance</label>
 <textarea required className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--ring-focus)]" rows="2" value={finalReportData.team_performance} onChange={e => setFinalReportData({...finalReportData, team_performance: e.target.value})} />
 </div>
 <div className="grid grid-cols-2 gap-6">
 <div>
 <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Technologies Used</label>
 <input required type="text" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--ring-focus)]" value={finalReportData.technologies_used} onChange={e => setFinalReportData({...finalReportData, technologies_used: e.target.value})} />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Challenges</label>
 <input required type="text" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--ring-focus)]" value={finalReportData.challenges} onChange={e => setFinalReportData({...finalReportData, challenges: e.target.value})} />
 </div>
 </div>
 <div>
 <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Improvements & Lessons Learned</label>
 <textarea required className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--ring-focus)]" rows="2" value={finalReportData.lessons_learned} onChange={e => setFinalReportData({...finalReportData, lessons_learned: e.target.value})} />
 </div>

 <div className="pt-4 flex justify-end gap-2 border-t border-[var(--border)] mt-6">
 <button type="button" onClick={() => setShowFinalReportModal(false)} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">Cancel</button>
 <button type="submit" className="btn-primary">Submit Final Report</button>
 </div>
 </form>
 </div>
 </div>
 )}
  {showModuleSubmitModal && selectedModuleForSubmit && (
    <div className="fixed inset-0 bg-[var(--surface)]/50 flex items-center justify-center p-6 z-50 transition-opacity">
      <div className="linear-card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="section-title mb-1 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Submit Module to Manager</h2>
        <p className="text-[var(--text-secondary)] text-sm mb-6 font-medium">You are about to submit the completed module <span className="font-semibold text-[var(--text-primary)]">{selectedModuleForSubmit.name}</span>. This will lock all tasks and send a notification to the project manager for final review.</p>
        
        <form onSubmit={submitModuleToManager} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Final Submission Notes (Optional)</label>
            <textarea 
              className="linear-input min-h-[100px] py-2" 
              rows="4" 
              value={moduleSubmitNotes} 
              onChange={e => setModuleSubmitNotes(e.target.value)} 
              placeholder="Provide a quick summary of the team's work, what the manager should look out for..." 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Source Code URL (Optional)</label>
              <input 
                type="url" 
                className="linear-input" 
                value={moduleSubmitSourceUrl} 
                onChange={e => setModuleSubmitSourceUrl(e.target.value)} 
                placeholder="https://github.com/..." 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Files / Drive Link (Optional)</label>
              <input 
                type="url" 
                className="linear-input" 
                value={moduleSubmitFilesUrl} 
                onChange={e => setModuleSubmitFilesUrl(e.target.value)} 
                placeholder="https://drive.google.com/..." 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Live Demo / Preview URL (Optional)</label>
            <input 
              type="url" 
              className="linear-input" 
              value={moduleSubmitLiveUrl} 
              onChange={e => setModuleSubmitLiveUrl(e.target.value)} 
              placeholder="https://demo.example.com" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Testing Details (Optional)</label>
              <textarea 
                className="linear-input min-h-[80px] py-2" 
                value={moduleSubmitTesting} 
                onChange={e => setModuleSubmitTesting(e.target.value)} 
                placeholder="How was this module tested?" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Deployment Details (Optional)</label>
              <textarea 
                className="linear-input min-h-[80px] py-2" 
                value={moduleSubmitDeployment} 
                onChange={e => setModuleSubmitDeployment(e.target.value)} 
                placeholder="Any deployment instructions?" 
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-[var(--border)] mt-6">
            <button type="button" onClick={() => { 
              setShowModuleSubmitModal(false); 
              setModuleSubmitNotes(''); 
              setModuleSubmitSourceUrl('');
              setModuleSubmitFilesUrl('');
              setModuleSubmitLiveUrl('');
              setModuleSubmitTesting('');
              setModuleSubmitDeployment('');
            }} className="px-4 py-2 text-sm text-[var(--text-secondary)] font-medium hover:bg-[var(--surface)] transition-colors duration-150">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-semibold transition-colors duration-150 border border-[var(--border)]">Confirm & Submit</button>
          </div>
        </form>
      </div>
    </div>
  )}

 </div>
 );
}











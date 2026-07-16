import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, FolderKanban, Users, Activity, CheckCircle2, Calendar, LayoutGrid, AlertTriangle, FileText, Send, Star, Target } from 'lucide-react';
import { useAppContext, supabase } from '../context/AppContext';

const ManagerDashboard = () => {
 const navigate = useNavigate();
 const { currentUser, projects, employees, tasks, projectModules, dailyTeamReports, moduleSubmissions, projectTeams, fetchGlobalData, triggerNotification } = useAppContext();
 
 const [activeTab, setActiveTab] = useState('overview'); // overview, reports, modules

 const activeProjects = projects.filter(p => p.status === 'Active');
 const avgCompletion = projects.length > 0 
 ? Math.round(projects.reduce((acc, p) => {
 const projModules = projectModules.filter(m => m.project_id === p.id);
 const approvedModules = projModules.filter(m => m.manager_approved === true);
 const progressPercent = projModules.length === 0 ? 0 : Math.round((approvedModules.length / projModules.length) * 100);
 return acc + progressPercent;
 }, 0) / projects.length)
 : 0;

 // Module Reviews
 const pendingModules = moduleSubmissions.filter(s => s.status === 'Pending Manager Review');
 
 // Modals for Feedback
 const [showFeedbackModal, setShowFeedbackModal] = useState(false);
 const [selectedReport, setSelectedReport] = useState(null);
 const [feedbackText, setFeedbackText] = useState('');
 const [reportRating, setReportRating] = useState(5);

 const handleApproveModule = async (sub) => {
 try {
 // Approve module
 await supabase.from('module_submissions').update({ status: 'Approved' }).eq('id', sub.id);
 await supabase.from('project_modules').update({ manager_approved: true, status: 'Completed' }).eq('id', sub.module_id);
 
 // Auto-Sync: Complete all tasks inside this module
 await supabase.from('tasks').update({ status: 'Completed', progress: 100 }).eq('module_id', sub.module_id);
 
 // Notify TL
 triggerNotification(sub.submitted_by, 'Module Approved', `The Manager has approved your module!`, 'module_approved', sub.module_id);
 
 alert('Module approved successfully.');
 fetchGlobalData();
 } catch (err) {
 console.error('Error approving module', err);
 }
 };

 const handleRejectModule = async (sub) => {
 const reason = prompt("Enter rejection reason for the Team Leader:");
 if (!reason) return;

 try {
 // Reject module
 await supabase.from('module_submissions').update({ status: 'Rejected' }).eq('id', sub.id);
 // Unlock module
 await supabase.from('project_modules').update({ locked_at: null, status: 'In Progress' }).eq('id', sub.module_id);

 // Notify TL
 triggerNotification(sub.submitted_by, 'Module Rejected', `Manager requested changes: ${reason}`, 'module_rejected', sub.module_id);
 
 alert('Module rejected and sent back to Team Leader.');
 fetchGlobalData();
 } catch (err) {
 console.error('Error rejecting module', err);
 }
 };

 const reviewReport = async (status) => {
 if (!feedbackText && status === 'Rejected') {
 return alert('Please provide feedback for the rejection.');
 }
 
 try {
 await supabase.from('daily_team_reports').update({
 status: status,
 rating: reportRating,
 manager_feedback: feedbackText,
 reviewed_at: new Date().toISOString()
 }).eq('id', selectedReport.id);

 await supabase.from('daily_feedback').insert({
 project_id: selectedReport.project_id,
 team_id: selectedReport.team_id,
 from_id: currentUser.id,
 to_employee_id: selectedReport.submitted_by, // send to TL
 feedback_type: 'Mgr_to_Team',
 comments: feedbackText
 });

 triggerNotification(selectedReport.submitted_by, `Report ${status}`, `The Manager ${status.toLowerCase()} your daily report.`, 'mgr_feedback', selectedReport.id);
 
 setFeedbackText('');
 setReportRating(5);
 setShowFeedbackModal(false);
 alert(`Report ${status} successfully.`);
 fetchGlobalData();
 } catch (err) {
 console.error('Error sending feedback', err);
 }
 };

 return (
 <div className="max-w-7xl mx-auto space-y-8 pb-24">
 {/* Header & Actions */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
 <div>
 <h1 className="page-title tracking-tight">Manager Dashboard</h1>
 <p className="text-sm text-[var(--text-secondary)] mt-1">Oversee projects, review daily reports, and approve team modules.</p>
 </div>
 <button 
 onClick={() => navigate('/create-project')}
 className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-medium text-sm hover:bg-[var(--btn-primary-hover)] transition-colors duration-150"
 >
 <Plus className="w-4 h-4" />
 Create Project
 </button>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 p-1 linear-card overflow-x-auto w-full md:w-fit">
 {['overview', 'reports', 'modules'].map(tab => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={`flex-1 md:flex-none py-2 px-4 text-sm font-medium transition-colors duration-150 capitalize whitespace-nowrap ${
 activeTab === tab ? 'bg-[var(--surface)] text-[var(--text-primary)] ' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] '
 }`}
 >
 {tab === 'modules' && pendingModules.length > 0 ? `Module Reviews (${pendingModules.length})` : tab}
 </button>
 ))}
 </div>

 {activeTab === 'overview' && (
 <div className="space-y-8">
 {/* Stats Row */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 <StatCard title="Total Projects" value={projects.length} icon={FolderKanban} color="blue" />
 <StatCard title="Active Projects" value={activeProjects.length} icon={Activity} color="amber" />
 <StatCard title="Team Members" value={employees.length} icon={Users} color="brand" />
 <StatCard title="Avg Completion" value={`${avgCompletion}%`} icon={CheckCircle2} color="emerald" />
 </div>

 {/* Projects List */}
 <div>
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-lg font-semibold text-[var(--text-primary)]">Active Projects</h2>
 </div>
 
 {activeProjects.length === 0 ? (
 <div className="linear-card p-12 text-center">
 <FolderKanban className="w-12 h-12 text-[var(--text-secondary)] opacity-50 mx-auto mb-6" />
 <h3 className="text-base font-medium text-[var(--text-primary)] mb-1">No active projects</h3>
 <p className="text-sm text-[var(--text-secondary)] mb-6">Create your first project to start tracking progress.</p>
 <button 
 onClick={() => navigate('/create-project')}
 className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] text-sm font-medium hover:opacity-90 transition-opacity"
 >
 Create Project
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
 {activeProjects.map(project => (
 <ProjectCard key={project.id} project={project} employees={employees} tasks={tasks} />
 ))}
 </div>
 )}
 </div>
 </div>
 )}

 {activeTab === 'reports' && (
 <div className="space-y-6">
 <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
 <FileText className="w-4 h-4 text-[var(--text-primary)]" /> Daily Team Reports
 </h2>
 {dailyTeamReports.length === 0 ? (
 <div className="linear-card p-12 text-center">
 <p className="text-sm text-[var(--text-secondary)]">No daily reports submitted by Team Leaders yet.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {dailyTeamReports.map(report => {
 const proj = projects.find(p => p.id === report.project_id);
 const team = projectTeams.find(t => t.id === report.team_id);
 const tl = employees.find(e => e.id === report.submitted_by);
 
 return (
 <div key={report.id} className="linear-card p-6">
 <div className="flex justify-between items-start mb-6">
 <div>
 <p className="font-semibold text-[var(--text-primary)] text-base">{proj?.name}</p>
 <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">{team?.team_name}</p>
 </div>
 <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
 <Calendar className="w-3.5 h-3.5"/> {new Date(report.created_at).toLocaleDateString()}
 </span>
 </div>
 
 <div className="linear-card p-6 mb-6">
 <p className="text-sm text-[var(--text-secondary)] italic">"{report.summary}"</p>
 </div>

 <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
 <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
 <Users className="w-4 h-4 opacity-70"/> TL: <span className="font-medium text-[var(--text-primary)]">{tl?.name}</span>
 </div>
 <button onClick={() => { setSelectedReport(report); setShowFeedbackModal(true); }} className="text-[var(--text-primary)] font-medium hover:text-[var(--text-primary)] text-sm flex items-center gap-1 transition-colors duration-150">
 <Star className="w-3.5 h-3.5"/> Reply / Feedback
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {activeTab === 'modules' && (
 <div className="space-y-6">
 <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Module Review Queue
 </h2>
 {pendingModules.length === 0 ? (
 <div className="linear-card p-12 text-center">
 <CheckCircle2 className="w-10 h-10 text-[var(--text-secondary)] opacity-50 mx-auto mb-6" />
 <h3 className="text-base font-medium text-[var(--text-primary)]">All caught up!</h3>
 <p className="text-sm text-[var(--text-secondary)] mt-1">No modules are currently pending your final approval.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {pendingModules.map(sub => {
 const mod = projectModules.find(m => m.id === sub.module_id);
 const proj = projects.find(p => p.id === sub.project_id);
 const tl = employees.find(e => e.id === sub.submitted_by);
 
 return (
 <div key={sub.id} className="p-6 border-l-4 border-l-amber-500 linear-card flex flex-col justify-between">
 <div>
 <div className="mb-6 border-b border-[var(--border)] pb-4">
 <p className="text-[10px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-1">{proj?.name}</p>
 <p className="font-semibold text-[var(--text-primary)] text-lg">{mod?.name}</p>
 </div>
 
 <div className="linear-card p-6 mb-6">
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase mb-2">Module Details</p>
 <p className="text-sm text-[var(--text-primary)] leading-relaxed">{mod?.description}</p>
 </div>

 <div className="flex items-center justify-between mb-6">
 <div className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-2">
 <Users className="w-4 h-4"/> TL: {tl?.name}
 </div>
 </div>
 </div>
 
 <div className="flex gap-2">
 <button onClick={() => handleRejectModule(sub)} className="flex-1 bg-danger hover:bg-red-900 text-white text-sm font-medium py-2 transition-colors duration-150">
 Reject
 </button>
 <button onClick={() => handleApproveModule(sub)} className="flex-1 bg-success hover:bg-green-900 text-white text-sm font-medium py-2 transition-colors duration-150">
 Approve Module
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {/* Feedback Modal */}
 {showFeedbackModal && selectedReport && (
 <div className="fixed inset-0 bg-[var(--surface)]/50 flex items-center justify-center p-6 z-50 transition-opacity">
 <div className="linear-card max-w-lg w-full p-6">
 <h2 className="section-title mb-1">Provide Feedback</h2>
 <p className="text-sm text-[var(--text-secondary)] mb-6">Send feedback to the Team Leader regarding their daily report.</p>
 
 <div className="linear-card p-6 mb-6">
 <p className="text-sm text-[var(--text-primary)] italic">"{selectedReport.summary}"</p>
 </div>

 <form onSubmit={(e) => e.preventDefault()}>
 <div className="mb-6">
 <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Rate Team Performance (1-5)</label>
 <div className="flex gap-1">
 {[1,2,3,4,5].map(star => (
 <button key={star} type="button" onClick={() => setReportRating(star)} className="focus:outline-none p-1 hover:scale-110 transition-transform">
 <Star className={`w-6 h-6 ${reportRating >= star ? 'fill-amber-400 text-amber-400' : 'text-[var(--text-muted)] '}`} />
 </button>
 ))}
 </div>
 </div>

 <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Manager Notes / Feedback</label>
 <textarea 
 required
 className="linear-input min-h-[100px] py-3"
 rows="4"
 placeholder="Great job today, keep it up! / Please focus more on..."
 value={feedbackText}
 onChange={e => setFeedbackText(e.target.value)}
 />
 <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
 <button type="button" onClick={() => setShowFeedbackModal(false)} className="px-4 py-2 text-sm text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-secondary)] transition-colors duration-150">Cancel</button>
 <button type="button" onClick={() => reviewReport('Rejected')} className="px-4 py-2 text-sm bg-danger hover:bg-red-900 text-white font-medium transition-colors duration-150">
 Reject Report
 </button>
 <button type="button" onClick={() => reviewReport('Approved')} className="px-4 py-2 text-sm bg-success hover:bg-green-900 text-white font-medium flex items-center gap-2 transition-colors duration-150">
 <CheckCircle2 className="w-4 h-4"/> Approve Report
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
 return (
 <div className="linear-card p-5 transition-colors duration-150 hover:border-[var(--border)]">
 <div className="flex items-center gap-6">
 <div className="p-3 bg-[var(--bg-secondary)] text-[var(--text-primary)]">
 <Icon className="w-5 h-5" />
 </div>
 <div>
 <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{title}</p>
 <h3 className="page-title mt-1">{value}</h3>
 </div>
 </div>
 </div>
 );
};

const ProjectCard = ({ project, employees, tasks }) => {
 const { projectModules } = useAppContext();
 const projectTasks = tasks.filter(t => t.project_id === project.id);
 const projModules = projectModules.filter(m => m.project_id === project.id);
 const approvedModules = projModules.filter(m => m.manager_approved === true);
 const progressPercent = projModules.length === 0 ? 0 : Math.round((approvedModules.length / projModules.length) * 100);
 
 const memberIds = [...new Set(projectTasks.map(t => t.employee_id).filter(Boolean))];
 const projectMembers = employees.filter(emp => memberIds.includes(emp.id));

 return (
 <Link to={`/project/${project.id}`} className="group block h-full">
 <div className="linear-card h-full p-6 hover:border-[var(--border)] transition-colors duration-150 flex flex-col relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-1 bg-[var(--bg-secondary)]0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
 
 <div className="flex justify-between items-start mb-6">
 <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors line-clamp-1">{project.name}</h3>
 <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
 {project.status}
 </span>
 </div>
 
 <p className="text-sm text-[var(--text-secondary)] mb-6 line-clamp-2 flex-grow">
 {project.description || 'No description provided.'}
 </p>
 
 <div className="space-y-6 mt-auto">
 <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)] font-medium">
 {project.end_date && (
 <div className="flex items-center gap-1.5">
 <Calendar className="w-4 h-4 opacity-70" />
 {new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
 </div>
 )}
 </div>
 
 <div className="space-y-1.5">
 <div className="flex justify-between text-xs font-semibold">
 <span className="text-[var(--text-secondary)] uppercase tracking-wider">Progress</span>
 <span className="text-[var(--text-primary)]">{progressPercent}%</span>
 </div>
 <div className="w-full linear-card rounded-full h-1.5 overflow-hidden">
 <div 
 className="h-1.5 rounded-full transition-all duration-150 ease-out bg-white"
 style={{ width: `${progressPercent}%` }}
 ></div>
 </div>
 </div>

 <div className="flex items-center justify-between pt-2">
 <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Team</span>
 <div className="flex -space-x-2 overflow-hidden">
 {projectMembers.length > 0 ? projectMembers.map((member, i) => (
 <div
 key={member.id}
 className="inline-flex items-center justify-center h-7 w-7 rounded-full ring-2 ring-[var(--surface)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-[10px]"
 title={member.name}
 style={{ zIndex: projectMembers.length - i }}
 >
 {member.name.charAt(0)}
 </div>
 )) : (
 <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Unassigned</span>
 )}
 </div>
 </div>
 </div>
 </div>
 </Link>
 );
};

export default ManagerDashboard;











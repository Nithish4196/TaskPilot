import { useState, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { 
 ArrowLeft, LayoutGrid, Users, Plus, CheckCircle2, AlertCircle, 
 BarChart3, Activity, Clock, Award, ShieldCheck, Mail, Building2, 
 Settings, Target, ChevronDown, ChevronRight, MessageSquare, Briefcase, Calendar, ListTodo, Flag, FileText, Star, Trash2
} from 'lucide-react';
import { useAppContext, supabase } from '../context/AppContext';

export default function ProjectDetail() {
 const { projectId } = useParams();
 const { projects, employees, projectTeams, projectModules, tasks, dailyUpdates, teamRewards, getEmployeeWorkload, userRole, removeEmployeeFromTeam } = useAppContext();
 
 const project = projects.find(p => p.id === projectId);
 
 const [activeTab, setActiveTab] = useState('overview'); // overview, teams, modules, resources, activity, rewards
 const [showTeamModal, setShowTeamModal] = useState(false);
 const [newTeam, setNewTeam] = useState({ name: '', team_leader_id: '', team_members: [] });
 const [showModuleModal, setShowModuleModal] = useState(false);
 const [newModule, setNewModule] = useState({ name: '', description: '', team_id: '' });

 // Phase 5: Project Completion Flow
 const [showCompletionModal, setShowCompletionModal] = useState(false);
 const [tlRatings, setTlRatings] = useState({}); // { [tl_id]: { score: 5, criteria: { Communication: 5, Leadership: 5, Execution: 5 }, comments: '' } }

 if (!project) return <Navigate to="/" />;

 // Filter project-specific data
 const teams = projectTeams.filter(t => t.project_id === projectId);
 const modules = projectModules.filter(m => m.project_id === projectId);
 const projectTasks = tasks.filter(t => t.project_id === projectId);
 const pUpdates = dailyUpdates.filter(u => u.project_id === projectId);
 const pRewards = teamRewards.filter(r => r.project_id === projectId);

 // Calculate global stats
 const totalTasks = projectTasks.length;
 const completedTasks = projectTasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length; // including approved if any
 const pendingTasks = projectTasks.filter(t => t.status !== 'Completed' && t.status !== 'Approved' && t.status !== 'Rejected').length;
 const overdueTasks = projectTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completed').length;
 const approvedModulesCount = modules.filter(m => m.manager_approved === true).length;
 const projectProgress = modules.length === 0 ? 0 : Math.round((approvedModulesCount / modules.length) * 100);

 // Calculate assigned employees
 const assignedEmployeeIds = new Set();
 teams.forEach(t => {
 if (t.team_leader_id) assignedEmployeeIds.add(t.team_leader_id);
 if (t.team_members) t.team_members.forEach(id => assignedEmployeeIds.add(id));
 });
 const totalEmployees = assignedEmployeeIds.size;
 const activeModules = modules.filter(m => projectTasks.some(t => t.module_id === m.id && t.status !== 'Completed')).length;
 const completedModules = modules.filter(m => {
 const mTasks = projectTasks.filter(t => t.module_id === m.id);
 return mTasks.length > 0 && mTasks.every(t => t.status === 'Completed' || t.status === 'Approved');
 }).length;

 // Days remaining calculation
 let daysRemaining = 'N/A';
 if (project.end_date) {
 const end = new Date(project.end_date);
 const now = new Date();
 const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
 daysRemaining = diff > 0 ? diff : 'Overdue';
 }

 const manager = employees.find(e => e.role === 'Project Manager') || { name: 'Admin' }; // Simplification

 const formatStartedAt = (dateStr) => {
   if (!dateStr) return '';
   const d = new Date(dateStr);
   return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
 };

 const handleCreateTeam = async (e) => {
 e.preventDefault();
 try {
 const { error } = await supabase.from('project_teams').insert({
 project_id: projectId,
 team_name: newTeam.name,
 team_leader_id: newTeam.team_leader_id,
 team_members: newTeam.team_members
 });
 if (error) throw error;
 setShowTeamModal(false);
 setNewTeam({ name: '', team_leader_id: '', team_members: [] });
 } catch (err) {
 console.error('Error creating team:', err);
 }
 };

 const handleCreateModule = async (e) => {
 e.preventDefault();
 try {
 const { error } = await supabase.from('project_modules').insert({
 project_id: projectId,
 team_id: newModule.team_id,
 name: newModule.name,
 description: newModule.description
 });
 if (error) throw error;
 setShowModuleModal(false);
 setNewModule({ name: '', description: '', team_id: '' });
 } catch (err) {
 console.error('Error creating module:', err);
 }
 };

 const handleCompleteProject = async () => {
 // 1. Submit Ratings for each TL
 try {
 const ratingPromises = Object.entries(tlRatings).map(([tlId, data]) => {
 return supabase.from('project_ratings').insert({
 project_id: projectId,
 team_id: teams.find(t => t.team_leader_id === tlId)?.id,
 from_id: currentUser.id,
 to_employee_id: tlId,
 rating_type: 'Mgr_to_TL',
 overall_score: data.score,
 criteria: data.criteria,
 comments: data.comments
 });
 });
 await Promise.all(ratingPromises);

 // 2. Mark project as completed
 await supabase.from('projects').update({
 status: 'Completed',
 completed_at: new Date().toISOString()
 }).eq('id', projectId);

 alert('Project marked as completed successfully!');
 setShowCompletionModal(false);
 // Wait for fetchGlobalData if needed, or navigate
 } catch (err) {
 console.error('Error completing project:', err);
 }
 };

 // Get unique TLs for rating
 const uniqueTLs = [...new Set(teams.map(t => t.team_leader_id).filter(Boolean))].map(id => employees.find(e => e.id === id));

 return (
 <div className="max-w-7xl mx-auto pb-24">
 
 {/* Header Overview */}
 <div className="mb-6">
 <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors">
 <ArrowLeft className="w-4 h-4" /> Back to Dashboard
 </Link>
 <div className="linear-card p-6 relative overflow-hidden">
 {/* Background decoration */}
 <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--bg-secondary)]0/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
 
 <div className="relative z-10">
 <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
 <div>
 <div className="flex items-center gap-2 mb-3">
 <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
 project.status === 'Completed' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[#2A2A2A]' :
 project.status === 'Active' || project.status === 'In Progress' ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]' : 'bg-[var(--surface)] text-[var(--text-secondary)]'
 }`}>
 {project.status}
 </span>
 <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider linear-card text-[var(--text-secondary)]">
 {project.priority || 'Medium'} Priority
 </span>
 </div>
 <h1 className="page-title tracking-tight">{project.name}</h1>
 <p className="text-[var(--text-secondary)] mt-2 max-w-3xl text-sm leading-relaxed">{project.description}</p>
 </div>
 <div className="flex flex-col gap-6 items-end">
 <div className="linear-card p-6 min-w-[200px]">
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Project Manager</p>
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center font-semibold text-sm">
 {manager.name.charAt(0)}
 </div>
 <div>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{manager.name}</p>
 <p className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-secondary)]">{manager.department}</p>
 </div>
 </div>
 </div>
 {project.status !== 'Completed' && (
 <button onClick={() => {
 // Initialize empty ratings
 const initialRatings = {};
 uniqueTLs.forEach(tl => {
 if (tl) initialRatings[tl.id] = { score: 5, criteria: { Leadership: 5, Communication: 5, Execution: 5 }, comments: '' };
 });
 setTlRatings(initialRatings);
 setShowCompletionModal(true);
 }} className="px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold text-sm hover:bg-[var(--btn-primary-hover)] transition-colors flex items-center gap-2 border border-[var(--border)]">
 <CheckCircle2 className="w-4 h-4"/> Complete Project
 </button>
 )}
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-5 border-y border-[var(--border)] mb-5">
 <div>
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Start Date</p>
 <p className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 opacity-70"/> {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}</p>
 </div>
 <div>
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">End Date</p>
 <p className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 opacity-70"/> {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}</p>
 </div>
 <div>
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Days Remaining</p>
 <p className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-70"/> {daysRemaining}</p>
 </div>
 <div>
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Teams</p>
 <p className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-1.5"><Users className="w-3.5 h-3.5 opacity-70"/> {teams.length}</p>
 </div>
 </div>

 <div>
 <div className="flex justify-between items-end mb-1">
 <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Overall Completion</span>
 <span className="card-title">{projectProgress}%</span>
 </div>
 <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5 overflow-hidden border border-[var(--border)]">
 <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${projectProgress}%` }}></div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex overflow-x-auto gap-1 mb-10 linear-card p-1 sticky top-6 z-40">
 {[
 { id: 'overview', label: 'Overview', icon: BarChart3 },
 { id: 'teams', label: 'Teams', icon: Users },
 { id: 'modules', label: 'Modules', icon: LayoutGrid },
 { id: 'resources', label: 'Resources', icon: Building2 },
 { id: 'activity', label: 'Activity Feed', icon: Activity },
 { id: 'rewards', label: 'Rewards', icon: Award }
 ].map(tab => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
 isActive ? 'linear-card text-[var(--text-primary)] ' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] border border-transparent'
 }`}
 >
 <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--text-primary)] ' : 'opacity-70'}`} /> {tab.label}
 </button>
 )
 })}
 </div>

 {/* TAB CONTENT: OVERVIEW */}
 {activeTab === 'overview' && (
 <div className="space-y-6">
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
 <div className="linear-card p-5">
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Assigned Employees</p>
 <p className="page-title mt-1">{totalEmployees}</p>
 </div>
 <div className="linear-card p-5">
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Modules</p>
 <p className="page-title mt-1">{modules.length}</p>
 </div>
 <div className="linear-card p-5">
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Tasks</p>
 <p className="page-title mt-1">{totalTasks}</p>
 </div>
 <div className="linear-card p-5 hover:border-[var(--border)] transition-colors">
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Completed Tasks</p>
 <p className="page-title mt-1">{completedTasks}</p>
 </div>
 <div className="linear-card p-5 hover:border-[var(--border)] transition-colors">
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Overdue Tasks</p>
 <p className="page-title mt-1">{overdueTasks}</p>
 </div>
 </div>

 {/* Empty State checks */}
 {teams.length === 0 && (
 <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-8 text-center">
 <Users className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" />
 <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No teams created yet</h3>
 <p className="text-[var(--text-secondary)] text-sm mb-6">Create your first team and assign a team leader to get started.</p>
 <button onClick={() => setShowTeamModal(true)} className="px-5 py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold text-sm hover:bg-[var(--btn-primary-hover)] transition-colors duration-150">
 Create First Team
 </button>
 </div>
 )}
 </div>
 )}

 {/* TAB CONTENT: TEAMS */}
 {activeTab === 'teams' && (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-lg font-semibold text-[var(--text-primary)]">Project Teams</h2>
 <button onClick={() => setShowTeamModal(true)} className="flex items-center gap-2 text-sm font-semibold text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] px-4 py-2 transition-colors duration-150 border border-[var(--border)]">
 <Plus className="w-4 h-4" /> Add Team
 </button>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {teams.map(team => {
 const leader = employees.find(e => e.id === team.team_leader_id);
 const members = team.team_members ? employees.filter(e => team.team_members.includes(e.id)) : [];
 const teamModules = modules.filter(m => m.team_id === team.id);
 
 // Compute Team Progress
 const teamTasks = projectTasks.filter(t => teamModules.some(m => m.id === t.module_id));
 const tCompleted = teamTasks.filter(t => t.status === 'Completed').length;
 const tProgress = teamTasks.length > 0 ? Math.round((tCompleted/teamTasks.length)*100) : 0;

 return (
 <div key={team.id} className="linear-card overflow-hidden flex flex-col hover:border-[var(--border)] transition-colors duration-150">
 <div className="p-5 border-b border-[var(--border)] flex justify-between items-start">
 <div>
 <h3 className="card-title mb-1">{team.team_name}</h3>
 <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
 {teamTasks.length} Tasks Assigned
 </span>
 </div>
 <div className="text-right">
 <span className="section-title">{tProgress}%</span>
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Progress</p>
 </div>
 </div>
 <div className="p-5 flex-1 space-y-6">
 <div>
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Team Leader</p>
 {leader ? (
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center font-semibold text-sm border border-[var(--border)]">
 {leader.name.charAt(0)}
 </div>
 <div>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{leader.name}</p>
 <p className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-secondary)]">{leader.designation || 'Team Leader'}</p>
 </div>
 </div>
 ) : (
 <span className="text-sm italic text-[var(--text-secondary)]">Unassigned</span>
 )}
 </div>

 <div>
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex justify-between items-center">
 <span>Team Members ({members.length})</span>
 </p>
 <div className="flex flex-wrap gap-2">
 {members.length > 0 ? members.map(m => (
 <div key={m.id} className="flex items-center gap-2 linear-card px-2 py-1 pr-1 group">
 <div className="w-5 h-5 rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)] flex items-center justify-center font-semibold text-[10px]">
 {m.name.charAt(0)}
 </div>
 <span className="text-xs font-medium text-[var(--text-primary)] pr-2">{m.name}</span>
 {userRole === 'manager' && (
   <button 
     onClick={async () => {
       if (window.confirm(`Remove ${m.name} from team ${team.team_name}?`)) {
         await removeEmployeeFromTeam(team.id, m.id);
       }
     }}
     className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
     title="Remove from Team"
   >
     <Trash2 className="w-3 h-3" />
   </button>
 )}
 </div>
 )) : <span className="text-sm text-[var(--text-secondary)] italic">No members assigned</span>}
 </div>
 </div>

 <div>
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Assigned Modules ({teamModules.length})</p>
 <div className="space-y-1.5">
 {teamModules.length > 0 ? teamModules.map(m => (
 <div key={m.id} className="text-sm font-medium text-[var(--btn-primary-text)] flex items-center gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:bg-[var(--btn-primary-bg)] before:rounded-full">
 {m.name}
 </div>
 )) : <span className="text-sm text-[var(--text-secondary)] italic">No modules assigned</span>}
 </div>
 </div>
 </div>
 <div className="p-3 bg-[var(--surface)] border-t border-[var(--border)] flex justify-end gap-2">
 <button className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 transition-colors">Edit Team</button>
 <button className="text-xs font-medium text-red-500 hover:text-red-600 px-3 py-1.5 transition-colors">Delete</button>
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )}

 {/* TAB CONTENT: MODULES */}
 {activeTab === 'modules' && (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-lg font-semibold text-[var(--text-primary)]">Project Modules</h2>
 <button onClick={() => setShowModuleModal(true)} className="flex items-center gap-2 text-sm font-semibold text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] px-4 py-2 transition-colors duration-150 border border-[var(--border)]">
 <Plus className="w-4 h-4" /> Add Module
 </button>
 </div>

 <div className="grid grid-cols-1 gap-6">
 {modules.map(mod => {
 const mTeam = teams.find(t => t.id === mod.team_id);
 const mTasks = projectTasks.filter(t => t.module_id === mod.id);
 const mCompleted = mTasks.filter(t => t.status === 'Completed').length;
 const mProgress = mTasks.length > 0 ? Math.round((mCompleted/mTasks.length)*100) : 0;

 return (
 <div key={mod.id} className="linear-card overflow-hidden hover:border-[var(--border)] transition-colors duration-150">
 <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
 <div className="flex-1 space-y-6">
 <div className="flex items-center gap-3">
 <h3 className="section-title">{mod.name}</h3>
 {mod.module_started ? (
   <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded">STARTED</span>
 ) : (
   <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded">ASSIGNED</span>
 )}
 <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase linear-card text-[var(--text-secondary)]">
 {mTasks.length} Tasks
 </span>
 </div>
 <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{mod.description}</p>
 
 {mod.module_started && (
   <div className="mt-2 flex gap-4 text-[10px] text-[var(--text-secondary)]">
     <div>
       <span className="opacity-70 mr-1">Started By:</span>
       <span className="font-semibold text-[var(--text-primary)]">{employees.find(e => e.id === mod.started_by)?.name || 'Unknown'}</span>
     </div>
     <div>
       <span className="opacity-70 mr-1">Started On:</span>
       <span className="font-semibold text-[var(--text-primary)]">{formatStartedAt(mod.started_at)}</span>
     </div>
   </div>
 )}

 <div className="flex flex-wrap gap-6 pt-4">
 <div>
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Assigned Team</p>
 <p className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-1.5">
 <Users className="w-3.5 h-3.5 opacity-70"/> {mTeam ? mTeam.team_name : 'Unassigned'}
 </p>
 </div>
 <div>
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Status</p>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{mProgress === 100 ? 'Completed' : mod.module_started ? 'Started' : 'Assigned'}</p>
 </div>
 </div>
 </div>
 
 <div className="w-full md:w-64 linear-card p-5 flex flex-col justify-center">
 <div className="flex justify-between items-end mb-2">
 <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Progress</span>
 <span className="section-title">{mProgress}%</span>
 </div>
 <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5 overflow-hidden mb-3 border border-[var(--border)]">
 <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${mProgress}%` }}></div>
 </div>
 <div className="flex justify-between text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
 <span>{mCompleted} Completed</span>
 <span>{mTasks.length - mCompleted} Pending</span>
 </div>
 </div>
 </div>
 
 {/* Task list preview */}
 {mTasks.length > 0 && (
 <div className="border-t border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
 <h4 className="text-[10px] font-semibold text-[var(--text-secondary)] mb-6 uppercase tracking-wider">Module Tasks</h4>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {mTasks.slice(0, 6).map(t => {
 const isDone = t.status === 'Completed';
 return (
 <div key={t.id} className="linear-card p-6 flex flex-col gap-2 transition-colors duration-150 hover:border-[var(--border)]">
 <div className="flex justify-between items-start gap-2">
 <h5 className="font-semibold text-[var(--text-primary)] text-sm truncate" title={t.name}>{t.name}</h5>
 {isDone ? <CheckCircle2 className="w-4 h-4 text-[var(--text-primary)] shrink-0"/> : <Target className="w-4 h-4 text-[var(--text-secondary)] shrink-0"/>}
 </div>
 <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider mt-auto">
 <span className={`px-2 py-0.5 rounded ${isDone ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] ' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[#2A2A2A]'}`}>{t.status}</span>
 <span className="text-[var(--text-secondary)]">{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date'}</span>
 </div>
 </div>
 )
 })}
 {mTasks.length > 6 && (
 <div className="linear-card p-6 border-dashed flex items-center justify-center">
 <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">+{mTasks.length - 6} more tasks</span>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* TAB CONTENT: RESOURCES & CONTRIBUTIONS */}
 {/* TAB CONTENT: RESOURCES & CONTRIBUTIONS */}
 {activeTab === 'resources' && (
 <div className="space-y-6">
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Employee Contributions</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {Array.from(assignedEmployeeIds).map(empId => {
 const emp = employees.find(e => e.id === empId);
 if (!emp) return null;
 
 const eTasks = projectTasks.filter(t => t.employee_id === emp.id);
 const eCompleted = eTasks.filter(t => t.status === 'Completed').length;
 const eProgress = eTasks.length > 0 ? Math.round((eCompleted/eTasks.length)*100) : 0;
 const workload = getEmployeeWorkload(emp.id);

 return (
 <div key={emp.id} className="linear-card p-6 hover:border-[var(--border)] transition-colors duration-150">
 <div className="flex items-center gap-6 mb-6">
 <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center font-bold text-lg border border-[var(--border)]">
 {emp.name.charAt(0)}
 </div>
 <div>
 <h3 className="font-semibold text-[var(--text-primary)] text-base">{emp.name}</h3>
 <p className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-secondary)]">{emp.designation}</p>
 </div>
 </div>
 
 <div className="space-y-6">
 <div>
 <div className="flex justify-between items-end mb-1">
 <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Project Contribution</span>
 <span className="text-sm font-bold text-[var(--text-primary)]">{eProgress}%</span>
 </div>
 <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5 overflow-hidden border border-[var(--border)]">
 <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${eProgress}%` }}></div>
 </div>
 </div>
 
 <div className="flex justify-between items-center linear-card p-6">
 <div>
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Tasks</p>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{eCompleted} / {eTasks.length}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Workload</p>
 <p className={`font-semibold text-sm ${workload > 80 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>{workload}%</p>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* TAB CONTENT: ACTIVITY FEED */}
 {activeTab === 'activity' && (
 <div className="max-w-3xl animate-in slide-in-from-bottom-2 duration-150">
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Real-Time Activity Feed</h2>
 
 <div className="relative border-l border-[var(--border)] ml-4 space-y-8 pb-12">
 {pUpdates.length === 0 ? (
 <div className="ml-8 text-[var(--text-secondary)] text-sm italic">No activity recorded yet.</div>
 ) : (
 pUpdates.map(update => {
 const emp = employees.find(e => e.id === update.employee_id);
 return (
 <div key={update.id} className="relative pl-8">
 <div className="absolute -left-[17px] top-0 w-8 h-8 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full flex items-center justify-center">
 <MessageSquare className="w-3.5 h-3.5 text-[var(--text-primary)]" />
 </div>
 <div className="linear-card p-5">
 <div className="flex justify-between items-start mb-2">
 <h4 className="font-semibold text-[var(--text-primary)] text-sm">{emp ? emp.name : 'Unknown Employee'}</h4>
 <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{new Date(update.date).toLocaleDateString()}</span>
 </div>
 <p className="text-[var(--text-secondary)] text-sm mb-3">{update.task_description}</p>
 {update.percentage_completed > 0 && (
 <div className="flex items-center gap-2">
 <div className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded border border-[var(--border)]">
 Task at {update.percentage_completed}%
 </div>
 <div className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 linear-card text-[var(--text-secondary)] rounded">
 {update.hours_worked} hrs logged
 </div>
 </div>
 )}
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 )}

 {/* TAB CONTENT: REWARDS */}
 {activeTab === 'rewards' && (
 <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-150">
 <div className="flex justify-between items-center">
 <h2 className="text-lg font-semibold text-[var(--text-primary)]">Project Rewards</h2>
 </div>
 
 {pRewards.length === 0 ? (
 <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-8 text-center">
 <Award className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" />
 <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No Active Rewards</h3>
 <p className="text-[var(--text-secondary)] text-sm mb-6">Motivate your team by creating a reward for this project.</p>
 <Link to="/manager/rewards" className="px-5 py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold text-sm hover:bg-[var(--btn-primary-hover)] transition-colors inline-block border border-[var(--border)]">
 Manage Rewards
 </Link>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {pRewards.map(reward => (
 <div key={reward.id} className="linear-card overflow-hidden flex flex-col hover:border-amber-300 transition-colors">
 {reward.image_url ? (
 <div className="h-40 w-full bg-[var(--surface-hover)]">
 <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" />
 </div>
 ) : (
 <div className="h-32 w-full bg-[var(--bg-secondary)] flex items-center justify-center border-b border-[var(--border)]">
 <Award className="w-10 h-10 text-[var(--text-secondary)]" />
 </div>
 )}
 <div className="p-5">
 <div className="flex justify-between items-start mb-2">
 <h3 className="card-title">{reward.title}</h3>
 <span className="px-2 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[#2A2A2A] text-[10px] font-semibold rounded uppercase tracking-wider">{reward.reward_type}</span>
 </div>
 <p className="text-sm text-[var(--text-secondary)] mb-6">{reward.description}</p>
 <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
 <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Target Team: {reward.team_name}</span>
 <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
 reward.status === 'Unlocked' ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[#2A2A2A]'
 }`}>
 {reward.status}
 </span>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* MODALS */}
 {showTeamModal && (
 <div className="fixed inset-0 bg-[var(--surface)]/60 flex items-center justify-center p-6 z-50 backdrop-blur-sm">
 <div className="linear-card max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Create New Team</h2>
 <form onSubmit={handleCreateTeam} className="space-y-6">
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Team Name</label>
 <input required type="text" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--ring-focus)] transition-colors" value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} placeholder="e.g. Frontend Devs" />
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Assign Team Leader</label>
 <select required className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--ring-focus)] transition-colors" value={newTeam.team_leader_id} onChange={e => setNewTeam({...newTeam, team_leader_id: e.target.value})}>
 <option value="">Select Employee...</option>
 {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>)}
 </select>
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Assign Team Members</label>
 <div className="max-h-48 overflow-y-auto linear-card p-2 space-y-1">
 {employees.filter(e => e.id !== newTeam.team_leader_id).map(e => (
 <label key={e.id} className="flex items-center gap-3 p-2 hover:bg-[var(--surface)] cursor-pointer transition-colors">
 <input 
 type="checkbox" 
 className="linear-input"
 checked={newTeam.team_members.includes(e.id)}
 onChange={(ev) => {
 if (ev.target.checked) setNewTeam({...newTeam, team_members: [...newTeam.team_members, e.id]});
 else setNewTeam({...newTeam, team_members: newTeam.team_members.filter(id => id !== e.id)});
 }}
 />
 <span className="text-sm font-medium text-[var(--text-primary)]">{e.name}</span>
 <span className="text-[10px] text-[var(--text-secondary)]">({e.department})</span>
 </label>
 ))}
 {employees.length === 0 && <p className="text-sm text-[var(--text-secondary)] p-2 text-center">No employees available.</p>}
 </div>
 </div>
 <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)] mt-6">
 <button type="button" onClick={() => setShowTeamModal(false)} className="px-4 py-2 text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--surface)] transition-colors">Cancel</button>
 <button type="submit" className="btn-primary">Create Team</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {showModuleModal && (
 <div className="fixed inset-0 bg-[var(--surface)]/60 flex items-center justify-center p-6 z-50 backdrop-blur-sm">
 <div className="linear-card max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Create Project Module</h2>
 <form onSubmit={handleCreateModule} className="space-y-6">
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Module Name</label>
 <input required type="text" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--ring-focus)] transition-colors" value={newModule.name} onChange={e => setNewModule({...newModule, name: e.target.value})} placeholder="e.g. Authentication UI" />
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Description</label>
 <textarea required rows="3" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--ring-focus)] transition-colors resize-none" value={newModule.description} onChange={e => setNewModule({...newModule, description: e.target.value})} placeholder="Brief description..."></textarea>
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Assign to Team</label>
 <select required className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--ring-focus)] transition-colors" value={newModule.team_id} onChange={e => setNewModule({...newModule, team_id: e.target.value})}>
 <option value="">Select Team...</option>
 {teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
 </select>
 {teams.length === 0 && <p className="text-[10px] font-semibold text-red-500 mt-2">Please create a team first.</p>}
 </div>
 <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)] mt-6">
 <button type="button" onClick={() => setShowModuleModal(false)} className="px-4 py-2 text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--surface)] transition-colors">Cancel</button>
 <button type="submit" disabled={teams.length === 0} className="btn-primary">Create Module</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {showCompletionModal && (
 <div className="fixed inset-0 bg-[var(--surface)]/60 flex items-center justify-center p-6 z-50 backdrop-blur-sm overflow-y-auto pt-24 pb-12">
 <div className="linear-card max-w-2xl w-full p-8 animate-in zoom-in-95 duration-150">
 <h2 className="section-title mb-2">Complete Project</h2>
 <p className="text-[var(--text-secondary)] text-sm mb-6">Please rate the Team Leaders before finalizing the project.</p>

 <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
 {uniqueTLs.length === 0 ? (
 <p className="text-[var(--text-secondary)] text-sm text-center italic">No Team Leaders were assigned to this project.</p>
 ) : uniqueTLs.map(tl => {
 if (!tl) return null;
 const ratings = tlRatings[tl.id] || { score: 5, criteria: { Leadership: 5, Communication: 5, Execution: 5 }, comments: '' };
 const setVal = (key, val) => setTlRatings(prev => ({ ...prev, [tl.id]: { ...prev[tl.id], [key]: val }}));
 const setCriteria = (key, val) => setTlRatings(prev => ({ ...prev, [tl.id]: { ...prev[tl.id], criteria: { ...prev[tl.id].criteria, [key]: val } }}));

 return (
 <div key={tl.id} className="linear-card p-5">
 <div className="flex items-center gap-3 mb-6 border-b border-[var(--border)] pb-3">
 <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)] font-semibold text-sm">
 {tl.name.charAt(0)}
 </div>
 <div>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{tl.name}</p>
 <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Team Leader</p>
 </div>
 </div>

 <div className="space-y-6">
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Overall Score (1-5)</label>
 <input type="number" min="1" max="5" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm"
 value={ratings.score} onChange={e => setVal('score', e.target.value)} />
 </div>
 
 <div className="grid grid-cols-3 gap-6">
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Leadership</label>
 <input type="number" min="1" max="5" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm"
 value={ratings.criteria.Leadership} onChange={e => setCriteria('Leadership', e.target.value)} />
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Communication</label>
 <input type="number" min="1" max="5" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm"
 value={ratings.criteria.Communication} onChange={e => setCriteria('Communication', e.target.value)} />
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Execution</label>
 <input type="number" min="1" max="5" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm"
 value={ratings.criteria.Execution} onChange={e => setCriteria('Execution', e.target.value)} />
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Manager Comments</label>
 <textarea className="w-full px-3 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm"
 rows="2" placeholder="Great job leading the team..."
 value={ratings.comments} onChange={e => setVal('comments', e.target.value)} />
 </div>
 </div>
 </div>
 );
 })}
 </div>

 <div className="pt-6 flex justify-end gap-3 mt-4 border-t border-[var(--border)]">
 <button onClick={() => setShowCompletionModal(false)} className="px-4 py-2 text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--surface)] transition-colors">Cancel</button>
 <button onClick={handleCompleteProject} className="btn-primary">
 <CheckCircle2 className="w-4 h-4"/> Archive & Complete
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 );
}











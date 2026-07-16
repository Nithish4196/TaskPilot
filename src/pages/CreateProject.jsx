import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 ArrowRight, ArrowLeft, Calendar, X, Users, LayoutGrid, CheckCircle2, 
 Trash2, Plus, AlertTriangle, ShieldCheck, FileText, Loader2, Save
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const DRAFT_KEY = 'taskpilot_project_draft';

export default function CreateProject() {
 const navigate = useNavigate();
 const { employees, createFullProjectTransaction, getEmployeeWorkload } = useAppContext();
 
 // Load draft from local storage
 const [isDraftLoaded, setIsDraftLoaded] = useState(false);
 const [step, setStep] = useState(1); // 1: Info, 2: Teams, 3: Modules, 4: Summary
 const [isSubmitting, setIsSubmitting] = useState(false);
 
 const [projectData, setProjectData] = useState({
 name: '', description: '', department: '', startDate: '', deadline: '', priority: 'Medium', status: 'Active'
 });
 
 const [teams, setTeams] = useState([]);
 const [currentTeam, setCurrentTeam] = useState({ id: '', name: '', team_leader_id: '', team_members: [] });
 
 const [modules, setModules] = useState([]);
 const [currentModule, setCurrentModule] = useState({ name: '', description: '', team_id: '', start_date: '', end_date: '', priority: 'Medium' });

 // Initialize from draft
 useEffect(() => {
 const draft = localStorage.getItem(DRAFT_KEY);
 if (draft) {
 try {
 const parsed = JSON.parse(draft);
 if (parsed.projectData) setProjectData(parsed.projectData);
 if (parsed.teams) setTeams(parsed.teams);
 if (parsed.modules) setModules(parsed.modules);
 if (parsed.step) setStep(parsed.step);
 } catch (err) {
 console.error("Failed to parse draft", err);
 }
 }
 setIsDraftLoaded(true);
 }, []);

 // Save to draft on change
 useEffect(() => {
 if (isDraftLoaded) {
 localStorage.setItem(DRAFT_KEY, JSON.stringify({ projectData, teams, modules, step }));
 }
 }, [projectData, teams, modules, step, isDraftLoaded]);

 // Derived state for Employee Filtering
 const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
 
 const assignedEmployeeIds = useMemo(() => {
 const ids = new Set();
 teams.forEach(t => {
 if (t.team_leader_id) ids.add(t.team_leader_id);
 t.team_members.forEach(m => ids.add(m));
 });
 return ids;
 }, [teams]);

 const availableEmployees = employees.filter(e => !assignedEmployeeIds.has(e.id));

 // --- Handlers ---
 const handleFinalizeTeam = () => {
 if (!currentTeam.name) {
 alert("Team Name is required.");
 return;
 }
 setTeams([...teams, { ...currentTeam, id: Date.now().toString() }]);
 setCurrentTeam({ id: '', name: '', team_leader_id: '', team_members: [] });
 };

 const handleDeleteTeam = (teamId) => {
 setTeams(teams.filter(t => t.id !== teamId));
 // Also remove any modules assigned to this team
 setModules(modules.filter(m => m.team_id !== teamId));
 };

 const handleFinalizeModule = () => {
 if (!currentModule.name || !currentModule.team_id || !currentModule.start_date || !currentModule.end_date) {
 alert("Module Name, Target Team, Start Date, and End Date are required.");
 return;
 }
 
 const mStart = new Date(currentModule.start_date);
 const mEnd = new Date(currentModule.end_date);
 const pStart = new Date(projectData.startDate);
 const pEnd = new Date(projectData.deadline);
 
 if (mStart < pStart) {
 alert(`Module start date cannot be before Project start date (${projectData.startDate}).`);
 return;
 }
 if (mEnd > pEnd) {
 alert(`Module end date cannot be after Project end date (${projectData.deadline}).`);
 return;
 }
 if (mEnd <= mStart) {
 alert("Module end date must be after the start date.");
 return;
 }

 setModules([...modules, { ...currentModule, id: Date.now().toString() }]);
 setCurrentModule({ name: '', description: '', team_id: '', start_date: '', end_date: '', priority: 'Medium' });
 };

 const handleDeleteModule = (modId) => {
 setModules(modules.filter(m => m.id !== modId));
 };

 const handleSubmit = async () => {
 setIsSubmitting(true);
 const newProjectId = await createFullProjectTransaction(projectData, teams, modules);
 setIsSubmitting(false);

 if (newProjectId) {
 localStorage.removeItem(DRAFT_KEY);
 navigate(`/project/${newProjectId}`);
 } else {
 alert("Failed to create project. Database transaction rolled back.");
 }
 };

 const clearDraftAndExit = () => {
 if (window.confirm("Are you sure you want to exit? Your draft will be discarded.")) {
 localStorage.removeItem(DRAFT_KEY);
 navigate('/');
 }
 };

 if (!isDraftLoaded) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

 return (
 <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-2 duration-150">
 
 {/* Header */}
 <div className="flex items-center justify-between mb-10">
 <div>
 <h1 className="page-title flex items-center gap-3">
 Create Project
 {localStorage.getItem(DRAFT_KEY) && <span className="text-xs badge-progress px-2 py-1 rounded font-bold flex items-center gap-1"><Save className="w-3 h-3"/> Draft Saved</span>}
 </h1>
 <p className="text-[var(--text-secondary)] mt-1">Multi-step project creation wizard</p>
 </div>
 <button onClick={clearDraftAndExit} className="p-2 text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Discard and Exit">
 <X className="w-6 h-6" />
 </button>
 </div>

 {/* Progress Stepper */}
 <div className="flex justify-between mb-10 max-w-3xl mx-auto">
 {['Project Info', 'Teams', 'Modules', 'Summary'].map((label, idx) => {
 const s = idx + 1;
 const isActive = step === s;
 const isPast = step > s;
 return (
 <div key={label} className="flex flex-col items-center gap-2 flex-1">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border ${
 isActive ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold border-[var(--border)]' : 
 isPast ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[#2A2A2A]' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)]'
 }`}>
 {isPast ? <CheckCircle2 className="w-5 h-5" /> : s}
 </div>
 <span className={`text-xs font-bold ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{label}</span>
 </div>
 );
 })}
 </div>

 {/* Step 1: Project Info */}
 {step === 1 && (
 <div className="bg-white border border-[var(--border)]/60 p-8 max-w-3xl mx-auto">
 <h2 className="section-title mb-6 flex items-center gap-2"><FileText className="w-5 h-5 text-[var(--text-primary)]"/> Project Information</h2>
 <div className="space-y-6">
 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Project Name <span className="text-[var(--text-secondary)]">*</span></label>
 <input required type="text" className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none" value={projectData.name} onChange={e => setProjectData({...projectData, name: e.target.value})} />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Description</label>
 <textarea rows={3} className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none resize-none" value={projectData.description} onChange={e => setProjectData({...projectData, description: e.target.value})} />
 </div>
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Department</label>
 <input type="text" className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none" value={projectData.department} onChange={e => setProjectData({...projectData, department: e.target.value})} placeholder="e.g. Engineering" />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Priority</label>
 <select className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none" value={projectData.priority} onChange={e => setProjectData({...projectData, priority: e.target.value})}>
 <option value="Low">Low</option>
 <option value="Medium">Medium</option>
 <option value="High">High</option>
 <option value="Critical">Critical</option>
 </select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Start Date</label>
 <input type="date" className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none" value={projectData.startDate} onChange={e => setProjectData({...projectData, startDate: e.target.value})} />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">End Date</label>
 <input type="date" className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none" value={projectData.deadline} onChange={e => setProjectData({...projectData, deadline: e.target.value})} />
 </div>
 </div>
 </div>
 <div className="mt-8 flex justify-end">
 <button onClick={() => { if(projectData.name) setStep(2); else alert("Name is required"); }} className="px-6 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold flex items-center gap-2 hover:bg-[var(--btn-primary-hover)]">Continue <ArrowRight className="w-4 h-4"/></button>
 </div>
 </div>
 )}

 {/* Step 2: Team Creation */}
 {step === 2 && (
 <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white border border-[var(--border)] p-6">
 <h2 className="section-title mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-[var(--text-primary)]"/> Create New Team</h2>
 
 <div className="space-y-5">
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Team Name <span className="text-[var(--text-secondary)]">*</span></label>
 <input type="text" className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none" value={currentTeam.name} onChange={e => setCurrentTeam({...currentTeam, name: e.target.value})} placeholder="e.g. Frontend Team" />
 </div>
 
 <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border)] space-y-6">
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Assign Team Leader</label>
 <select className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none" value={currentTeam.team_leader_id} onChange={e => setCurrentTeam({...currentTeam, team_leader_id: e.target.value})}>
 <option value="">Select Team Leader...</option>
 {employees.map(emp => {
 const isAssigned = assignedEmployeeIds.has(emp.id);
 if (isAssigned && currentTeam.team_leader_id !== emp.id) return null; // Hide assigned
 return <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>;
 })}
 </select>
 </div>
 
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Assign Members</label>
 <div className="max-h-64 overflow-y-auto linear-card p-2 space-y-1">
 {employees.map(emp => {
 const isAssigned = assignedEmployeeIds.has(emp.id);
 const isCurrentLeader = currentTeam.team_leader_id === emp.id;
 if ((isAssigned || isCurrentLeader) && !currentTeam.team_members.includes(emp.id)) return null;

 const workload = getEmployeeWorkload(emp.id);
 return (
 <label key={emp.id} className="flex items-center gap-3 p-2 hover:bg-[var(--bg-secondary)] cursor-pointer">
 <input 
 type="checkbox" 
 className="linear-input"
 checked={currentTeam.team_members.includes(emp.id)}
 onChange={(ev) => {
 if (ev.target.checked) setCurrentTeam({...currentTeam, team_members: [...currentTeam.team_members, emp.id]});
 else setCurrentTeam({...currentTeam, team_members: currentTeam.team_members.filter(id => id !== emp.id)});
 }}
 />
 <div className="flex-1">
 <p className="text-sm font-bold text-[var(--text-primary)]">{emp.name}</p>
 <p className="text-xs text-[var(--text-secondary)]">{emp.designation}</p>
 </div>
 <span className={`text-xs font-bold px-2 py-1 rounded ${workload > 80 ? 'bg-red-100 text-red-700' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>{workload}% Load</span>
 </label>
 );
 })}
 </div>
 </div>
 </div>

 <div className="flex justify-end pt-2">
 <button onClick={handleFinalizeTeam} className="btn-primary"><Plus className="w-4 h-4"/> Finalize Team</button>
 </div>
 </div>
 </div>
 </div>
 
 <div className="space-y-6">
 <h3 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-sm mb-2">Finalized Teams ({teams.length})</h3>
 {teams.length === 0 && <p className="text-sm text-[var(--text-secondary)] italic p-6 bg-white border border-[var(--border)] text-center">No teams finalized yet.</p>}
 
 {teams.map(t => (
 <div key={t.id} className="linear-card p-6 relative group">
 <button onClick={() => handleDeleteTeam(t.id)} className="absolute top-6 right-4 text-[var(--text-muted)] hover:text-red-500 transition-colors hidden group-hover:block"><Trash2 className="w-4 h-4"/></button>
 <h4 className="font-bold text-[var(--text-primary)] mb-2 pr-8">{t.name}</h4>
 <div className="space-y-1 text-sm">
 <p className="flex justify-between"><span className="text-[var(--text-secondary)]">Leader:</span> <span className="font-bold">{employees.find(e => e.id === t.team_leader_id)?.name || 'None'}</span></p>
 <p className="flex justify-between"><span className="text-[var(--text-secondary)]">Members:</span> <span className="font-bold">{t.team_members.length}</span></p>
 </div>
 </div>
 ))}
 
 <div className="pt-6 mt-6 border-t border-[var(--border)] flex justify-between">
 <button onClick={() => setStep(1)} className="px-4 py-2 text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-secondary)]">Back</button>
 <button onClick={() => { if(teams.length > 0) setStep(3); else alert("Create at least one team."); }} className="px-6 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold flex items-center gap-2 hover:bg-[var(--btn-primary-hover)]">Next Step <ArrowRight className="w-4 h-4"/></button>
 </div>
 </div>
 </div>
 )}

 {/* Step 3: Modules */}
 {step === 3 && (
 <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white border border-[var(--border)] p-6">
 <h2 className="section-title mb-6 flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-emerald-500"/> Create Modules</h2>
 
 <div className="space-y-6">
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Module Name <span className="text-[var(--text-secondary)]">*</span></label>
 <input type="text" className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none" value={currentModule.name} onChange={e => setCurrentModule({...currentModule, name: e.target.value})} placeholder="e.g. Authentication UI" />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Description</label>
 <textarea rows={2} className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none resize-none" value={currentModule.description} onChange={e => setCurrentModule({...currentModule, description: e.target.value})} />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Target Team <span className="text-[var(--text-secondary)]">*</span></label>
 <select className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none" value={currentModule.team_id} onChange={e => setCurrentModule({...currentModule, team_id: e.target.value})}>
 <option value="">Select Team...</option>
 {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Start Date <span className="text-[var(--text-secondary)]">*</span></label>
 <input type="date" className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none" value={currentModule.start_date} onChange={e => setCurrentModule({...currentModule, start_date: e.target.value})} />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">End Date <span className="text-[var(--text-secondary)]">*</span></label>
 <input type="date" className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none" value={currentModule.end_date} onChange={e => setCurrentModule({...currentModule, end_date: e.target.value})} />
 </div>
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Priority</label>
 <select className="w-full px-4 py-3 linear-card focus:ring-1 focus:ring-[var(--ring-focus)] outline-none" value={currentModule.priority} onChange={e => setCurrentModule({...currentModule, priority: e.target.value})}>
 <option value="Low">Low</option>
 <option value="Medium">Medium</option>
 <option value="High">High</option>
 <option value="Critical">Critical</option>
 </select>
 </div>
 
 <div className="flex justify-end pt-2">
 <button onClick={handleFinalizeModule} className="btn-primary"><Plus className="w-4 h-4"/> Finalize Module</button>
 </div>
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <h3 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-sm mb-2">Finalized Modules ({modules.length})</h3>
 {modules.length === 0 && <p className="text-sm text-[var(--text-secondary)] italic p-6 bg-white border border-[var(--border)] text-center">No modules finalized yet.</p>}
 
 {modules.map(m => (
 <div key={m.id} className="linear-card p-6 relative group">
 <button onClick={() => handleDeleteModule(m.id)} className="absolute top-6 right-4 text-[var(--text-muted)] hover:text-red-500 transition-colors hidden group-hover:block"><Trash2 className="w-4 h-4"/></button>
 <h4 className="font-bold text-[var(--text-primary)] mb-1 pr-8">{m.name}</h4>
 <div className="flex justify-between items-center text-xs">
 <span className="font-bold text-[var(--text-secondary)] uppercase tracking-wider">{teams.find(t => t.id === m.team_id)?.name}</span>
 <span className="text-[var(--text-secondary)]">{m.start_date} to {m.end_date}</span>
 </div>
 </div>
 ))}
 
 <div className="pt-6 mt-6 border-t border-[var(--border)] flex justify-between">
 <button onClick={() => setStep(2)} className="px-4 py-2 text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-secondary)]">Back</button>
 <button onClick={() => setStep(4)} className="px-6 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold flex items-center gap-2 hover:bg-[var(--btn-primary-hover)]">Review <ArrowRight className="w-4 h-4"/></button>
 </div>
 </div>
 </div>
 )}

 {/* Step 4: Summary */}
 {step === 4 && (
 <div className="max-w-4xl mx-auto">
 <div className="linear-card p-8 text-[var(--text-primary)] relative overflow-hidden">
 
 <div className="relative z-10 space-y-8">
 <div className="text-center pb-6 border-b border-[var(--border)]">
 <ShieldCheck className="w-16 h-16 text-[var(--text-primary)] mx-auto mb-6" />
 <h2 className="text-3xl font-extrabold mb-2 text-[var(--text-primary)]">Project Ready</h2>
 <p className="text-[var(--text-secondary)]">Review the finalized structure before deploying to the database.</p>
 </div>

 <div className="grid grid-cols-3 gap-6 text-center">
 <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-6">
 <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-1">Project</p>
 <p className="font-bold text-lg text-[var(--text-primary)]">{projectData.name}</p>
 </div>
 <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-6">
 <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-1">Total Teams</p>
 <p className="font-bold text-2xl text-[var(--text-primary)]">{teams.length}</p>
 </div>
 <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-6">
 <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-1">Total Modules</p>
 <p className="font-bold text-2xl text-[var(--text-primary)]">{modules.length}</p>
 </div>
 </div>

 <div className="space-y-6">
 <h3 className="font-bold uppercase tracking-wider text-sm text-[var(--text-secondary)]">Team Structure Breakdown</h3>
 {teams.map(t => (
 <div key={t.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] p-5 flex justify-between items-center">
 <div>
 <h4 className="font-bold text-lg text-[var(--text-primary)] mb-1">{t.name}</h4>
 <p className="text-xs text-[var(--text-secondary)]">Leader: <span className="text-[var(--text-primary)] font-medium">{employees.find(e => e.id === t.team_leader_id)?.name || 'None'}</span> • Members: <span className="text-[var(--text-primary)] font-medium">{t.team_members.length}</span></p>
 </div>
 <div className="text-right">
 <span className="text-xs font-bold px-2 py-1 linear-card text-[var(--text-primary)]">
 {modules.filter(m => m.team_id === t.id).length} Modules Assigned
 </span>
 </div>
 </div>
 ))}
 </div>
 
 <div className="pt-6 border-t border-[var(--border)] flex justify-between">
 <button onClick={() => setStep(3)} className="px-6 py-3 text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-secondary)] transition-colors">Go Back</button>
 <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary">
 {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
 Deploy Project Structure
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 </div>
 );
}













import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Folders, Users, Calendar, Activity, ArrowRight, ArrowLeft, Loader2, Archive, Star } from 'lucide-react';

export default function EmployeeProjects() {
 const navigate = useNavigate();
 const { employeeProjects, projects, projectTeams, currentUser, projectRatings } = useAppContext();
 const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'

 // Filter for active projects
 const activeProjects = employeeProjects.filter(p => p.status !== 'Completed');

 // Filter for completed projects
 const completedProjects = employeeProjects.filter(p => p.status === 'Completed');

 return (
 <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="flex justify-between items-end mb-10">
 <div>
 <h1 className="page-title">My Projects</h1>
 <p className="text-[var(--text-secondary)] mt-2">View the projects you are assigned to and track your history.</p>
 </div>
 </div>

 <div className="flex gap-2 p-1 bg-[var(--bg-secondary)] mb-10 overflow-x-auto w-max border border-[var(--border)]">
 <button
 onClick={() => setActiveTab('active')}
 className={`flex-1 py-2 px-6 text-sm font-semibold transition-all capitalize whitespace-nowrap ${
 activeTab === 'active' ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] ' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
 }`}
 >
 Active Projects ({activeProjects.length})
 </button>
 <button
 onClick={() => setActiveTab('completed')}
 className={`flex-1 py-2 px-6 text-sm font-semibold transition-all capitalize whitespace-nowrap ${
 activeTab === 'completed' ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] ' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
 }`}
 >
 Completed Projects ({completedProjects.length})
 </button>
 </div>

 {activeTab === 'active' && (
 activeProjects.length === 0 ? (
 <div className="linear-card p-12 text-center max-w-2xl mx-auto mt-12">
 <div className="w-20 h-20 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-6">
 <Folders className="w-10 h-10 text-[var(--text-secondary)]" />
 </div>
 <h3 className="section-title mb-2">No active projects</h3>
 <p className="text-[var(--text-secondary)]">You are currently not assigned to any active projects in the system. When a manager assigns you to a project, it will appear here.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {activeProjects.map(project => (
 <div key={project.id} onClick={() => navigate(`/employee/projects/${project.id}`)} className="linear-card cursor-pointer hover:border-[var(--border)] transition-all overflow-hidden flex flex-col">
 <div className="p-6 border-b border-[var(--border)] flex-1">
 <div className="flex justify-between items-start mb-6">
 <div className="w-12 h-12 bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] font-bold text-xl">
 {project.name.charAt(0)}
 </div>
 <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
 {project.status}
 </span>
 </div>
 <h3 className="section-title mb-2">{project.name}</h3>
 <p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-6">{project.description || 'No description provided.'}</p>
 
 <div className="space-y-3">
 <div className="flex items-center gap-3 text-sm font-medium text-[var(--text-secondary)]">
 <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
 Due: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
 </div>
 <div className="flex items-center gap-3 text-sm font-medium text-[var(--text-secondary)]">
 <Users className="w-4 h-4 text-[var(--text-secondary)]" />
 Team Project
 </div>
 </div>
 </div>
 
 <div className="p-6 bg-[var(--bg-secondary)]">
 <div className="flex justify-between items-center mb-2">
 <span className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
 <Activity className="w-4 h-4 text-[var(--text-secondary)]" /> Project Progress
 </span>
 <span className="text-sm font-bold text-[var(--text-primary)]">{project.progress || 0}%</span>
 </div>
 <div className="w-full h-1.5 linear-card rounded-full overflow-hidden">
 <div className="h-full bg-white rounded-full transition-all duration-150" style={{ width: `${project.progress || 0}%` }}></div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )
 )}

 {activeTab === 'completed' && (
 completedProjects.length === 0 ? (
 <div className="linear-card p-12 text-center max-w-2xl mx-auto mt-12">
 <div className="w-16 h-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-6">
 <Archive className="w-8 h-8 text-[var(--text-secondary)]" />
 </div>
 <h3 className="section-title mb-2">No completed projects found</h3>
 <p className="text-[var(--text-secondary)]">
 Once a project is finalized and completed, it will appear in your history.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {completedProjects.map(project => {
 const ratings = projectRatings.filter(r => r.project_id === project.id);
 const avgRating = ratings.length > 0 
 ? (ratings.reduce((acc, r) => acc + (r.overall_score || 0), 0) / ratings.length).toFixed(1)
 : null;

 return (
 <div key={project.id} onClick={() => navigate(`/employee/projects/${project.id}`)} className="linear-card cursor-pointer transition-colors hover:border-[var(--border)] overflow-hidden flex flex-col">
 <div className="p-6 flex-1">
 <div className="flex justify-between items-start mb-6">
 <span className="bg-[var(--bg-secondary)] border border-[#2A2A2A] text-[var(--text-primary)] text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
 Completed
 </span>
 {avgRating && (
 <span className="flex items-center gap-1 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[#2A2A2A] px-2 py-1">
 <Star className="w-3.5 h-3.5 fill-current" /> {avgRating}
 </span>
 )}
 </div>
 
 <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-2">{project.name}</h3>
 <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-6">{project.description}</p>
 
 <div className="space-y-3 mt-auto">
 <div className="flex justify-between items-center text-sm">
 <span className="text-[var(--text-secondary)] flex items-center gap-2"><Calendar className="w-4 h-4" /> Ended On</span>
 <span className="font-bold text-[var(--text-primary)]">
 {project.completed_at ? new Date(project.completed_at).toLocaleDateString() : 'N/A'}
 </span>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )
 )}
 </div>
 );
}









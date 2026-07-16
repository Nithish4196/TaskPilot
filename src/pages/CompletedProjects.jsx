import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Archive, Search, Filter, Calendar, Users, Star, ArrowRight, TrendingUp } from 'lucide-react';

export default function CompletedProjects() {
 const { projects, currentUser, userRole, projectTeams, projectRatings } = useAppContext();
 const [searchTerm, setSearchTerm] = useState('');

 // Filter projects by Completed status
 let completedProjects = projects.filter(p => p.status === 'Completed');

 // Filter by Role
 if (userRole === 'employee') {
 // If employee or TL, only show projects they were involved in
 completedProjects = completedProjects.filter(p => {
 const teamsInProject = projectTeams.filter(t => t.project_id === p.id);
 return teamsInProject.some(t => t.team_leader_id === currentUser?.id || t.team_members?.includes(currentUser?.id));
 });
 }

 // Search Filter
 if (searchTerm) {
 completedProjects = completedProjects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
 }

 return (
 <div className="max-w-7xl mx-auto pb-24 animate-in fade-in duration-150">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-6">
 <div>
 <h1 className="page-title flex items-center gap-3">
 <Archive className="w-8 h-8 text-[var(--text-primary)]" /> Completed Projects
 </h1>
 <p className="text-[var(--text-secondary)] mt-2">View the archive of successfully delivered projects.</p>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
 <input 
 type="text" 
 placeholder="Search projects..." 
 className="w-full pl-9 pr-4 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] transition-colors"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </div>

 {completedProjects.length === 0 ? (
 <div className="linear-card p-12 text-center">
 <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--border)]">
 <Archive className="w-8 h-8 text-[var(--text-secondary)]" />
 </div>
 <h3 className="section-title mb-2">No completed projects found</h3>
 <p className="text-[var(--text-secondary)]">
 {searchTerm ?"Try adjusting your search terms." :"Once a project is finalized, it will appear in this archive."}
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {completedProjects.map(project => {
 // Find average rating for this project if it exists
 const ratings = projectRatings.filter(r => r.project_id === project.id);
 const avgRating = ratings.length > 0 
 ? Math.round((ratings.reduce((acc, r) => acc + (r.overall_score || 0), 0) / ratings.length) * 20)
 : null;

 return (
 <div key={project.id} className="linear-card transition-colors hover:border-[var(--border)] overflow-hidden flex flex-col">
 <div className="p-6 flex-1">
 <div className="flex justify-between items-start mb-6">
 <span className="bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[#2A2A2A] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
 Completed
 </span>
 {avgRating && (
 <span className="flex items-center gap-1 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[#2A2A2A] px-2 py-1">
 <TrendingUp className="w-3.5 h-3.5" /> Score: {avgRating}
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
 
 {userRole === 'manager' && (
 <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
 <Link to={`/project/${project.id}`} className="flex items-center justify-center gap-2 w-full py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold hover:bg-[var(--btn-primary-hover)] transition-colors">
 View Project Details <ArrowRight className="w-4 h-4" />
 </Link>
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
}









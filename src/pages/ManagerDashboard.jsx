import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Users, Activity, CheckCircle2, Calendar, LayoutGrid } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { projects, employees, tasks } = useAppContext();
  
  const activeProjects = projects.filter(p => p.status === 'Active');
  const avgCompletion = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back, here's what's happening with your teams today.</p>
        </div>
        <button 
          onClick={() => navigate('/create-project')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-medium rounded-lg shadow-sm hover:bg-brand-700 hover:shadow transition-all focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          <Plus className="w-5 h-5" />
          Create New Project
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={projects.length} icon={FolderKanban} color="blue" />
        <StatCard title="Active Projects" value={activeProjects.length} icon={Activity} color="amber" />
        <StatCard title="Team Members" value={employees.length} icon={Users} color="brand" />
        <StatCard title="Avg Completion" value={`${avgCompletion}%`} icon={CheckCircle2} color="emerald" />
      </div>

      {/* Projects List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Active Projects</h2>
          {activeProjects.length > 0 && <Link to="/projects" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</Link>}
        </div>
        
        {activeProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No active projects</h3>
            <p className="text-slate-500 mb-6">Create your first project to start tracking progress and assigning modules.</p>
            <button 
              onClick={() => navigate('/create-project')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
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
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{value}</h3>
        </div>
      </div>
    </div>
  );
};

const ProjectCard = ({ project, employees, tasks }) => {
  // Compute modulesCount and assignedMembers from tasks associated with this project
  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const modulesCount = projectTasks.length;
  
  // Get unique assigned members
  const memberIds = [...new Set(projectTasks.map(t => t.employee_id).filter(Boolean))];
  const projectMembers = employees.filter(emp => memberIds.includes(emp.id));

  return (
    <Link to={`/project/${project.id}`} className="group block h-full">
      <div className="bg-white h-full p-6 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-brand-300 transition-all flex flex-col relative overflow-hidden">
        {/* Subtle decorative top border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">{project.name}</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            {project.status}
          </span>
        </div>
        
        <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-grow">
          {project.description || 'No description provided.'}
        </p>

        <div className="space-y-4 mt-auto">
          {/* Metadata Row */}
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
            {project.end_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-slate-400" />
              {modulesCount} modules
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-700">Progress</span>
              <span className={(project.progress || 0) >= 80 ? 'text-emerald-600' : 'text-brand-600'}>{project.progress || 0}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                  (project.progress || 0) >= 80 ? 'bg-emerald-500' : 'bg-brand-500'
                }`}
                style={{ width: `${project.progress || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Avatars */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-slate-500">Team</span>
            <div className="flex -space-x-2 overflow-hidden">
              {projectMembers.length > 0 ? projectMembers.map((member, i) => (
                <div
                  key={member.id}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-brand-100 text-brand-700 font-bold text-xs"
                  title={member.name}
                  style={{ zIndex: projectMembers.length - i }}
                >
                  {member.name.charAt(0)}
                </div>
              )) : (
                <span className="text-xs text-slate-400">Unassigned</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ManagerDashboard;

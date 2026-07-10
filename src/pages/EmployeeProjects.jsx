import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Folders, Users, Calendar, Activity, ArrowRight, Loader2 } from 'lucide-react';

export default function EmployeeProjects() {
  const { employeeProjects } = useAppContext();
  const [selectedProject, setSelectedProject] = useState(null);

  // If there are no projects, we can show a placeholder or empty state
  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Projects</h1>
          <p className="text-slate-500 mt-2">View the projects you are assigned to and track their overall progress.</p>
        </div>
      </div>

      {employeeProjects.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto mt-12">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Folders className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No active projects</h3>
          <p className="text-slate-500">You are currently not assigned to any active projects in the system. When a manager assigns you to a project, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employeeProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {project.name.charAt(0)}
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{project.name}</h3>
                <p className="text-sm text-slate-600 line-clamp-3 mb-6">{project.description || 'No description provided.'}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Due: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <Users className="w-4 h-4 text-slate-400" />
                    Team Project
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-600" /> Project Progress
                  </span>
                  <span className="text-sm font-bold text-brand-600">{project.progress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-600 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                </div>
                
                <button className="w-full mt-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                  View Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

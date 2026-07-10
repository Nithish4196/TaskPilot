import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, LayoutGrid, ChevronRight, XCircle, AlertCircle } from 'lucide-react';
import { useAppContext, supabase } from '../context/AppContext';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { projects, tasks, employees } = useAppContext();
  
  const project = projects.find(p => p.id === projectId);
  const projectModules = tasks.filter(t => t.project_id === projectId);

  const [selectedModule, setSelectedModule] = useState(null);

  if (!project) {
    return <Navigate to="/" />;
  }

  const handleApprove = async (taskId) => {
    try {
      const { error } = await supabase.from('tasks').update({ approval_status: 'Approved' }).eq('id', taskId);
      if (error) throw error;
      
      const updatedModule = projectModules.find(m => m.id === taskId);
      setSelectedModule({ ...updatedModule, approval_status: 'Approved' });
    } catch (err) {
      console.error('Error approving task:', err);
    }
  };

  const handleReject = async (taskId) => {
    try {
      const { error } = await supabase.from('tasks').update({ approval_status: 'Rejected', status: 'In Progress' }).eq('id', taskId);
      if (error) throw error;
      
      const updatedModule = projectModules.find(m => m.id === taskId);
      setSelectedModule({ ...updatedModule, approval_status: 'Rejected', status: 'In Progress' });
    } catch (err) {
      console.error('Error rejecting task:', err);
    }
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'red': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      case 'yellow': return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]';
      case 'green': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
      default: return 'bg-slate-300';
    }
  };

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Completed</span>;
      case 'submitted': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">Submitted</span>;
      case 'in progress': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">In Progress</span>;
      default: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800">{status || 'Not Started'}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 h-full">
      {/* Left Column: Project Overview & Modules List */}
      <div className={`flex-1 space-y-8 ${selectedModule ? 'hidden lg:block' : 'block'}`}>
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
              <p className="text-slate-500 mt-2 max-w-2xl">{project.description}</p>
            </div>
          </div>
        </div>

        {/* Project Meta & Progress */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-slate-600 font-medium">
            {project.end_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-500" />
                Due {new Date(project.end_date).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-brand-500" />
              {projectModules.length} Modules
            </div>
          </div>
          
          <div className="flex-1 max-w-sm w-full space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-700">Overall Progress</span>
              <span className="text-brand-600">{project.progress || 0}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="h-2.5 rounded-full bg-brand-500 transition-all duration-1000"
                style={{ width: `${project.progress || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Project Modules</h2>
          
          {projectModules.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No modules added yet.
            </div>
          ) : (
            <div className="space-y-3">
              {projectModules.map(mod => {
                const assignee = employees.find(m => m.id === mod.employee_id);
                const isSelected = selectedModule?.id === mod.id;
                
                return (
                  <div 
                    key={mod.id}
                    onClick={() => setSelectedModule(mod)}
                    className={`bg-white p-4 md:p-5 rounded-xl border transition-all cursor-pointer group ${
                      isSelected 
                        ? 'border-brand-400 shadow-md ring-1 ring-brand-100' 
                        : 'border-slate-200/60 shadow-sm hover:border-brand-300 hover:shadow'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <div className={`w-2.5 h-2.5 rounded-full ${getRiskColor(mod.risk)}`} title={`Risk: ${mod.risk || 'none'}`}></div>
                          <h3 className={`font-bold ${isSelected ? 'text-brand-700' : 'text-slate-900 group-hover:text-brand-600'}`}>
                            {mod.name}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {getStatusBadge(mod.status)}
                          {mod.due_date && (
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {mod.due_date}
                            </span>
                          )}
                          {assignee && (
                            <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5 ml-auto md:ml-0 bg-slate-50 px-2 py-1 rounded">
                              <div className="w-4 h-4 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[8px]">
                                {assignee.name.charAt(0)}
                              </div>
                              {assignee.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 md:w-48 shrink-0">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-slate-700">{mod.progress || 0}%</span>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${mod.progress === 100 ? 'bg-emerald-500' : 'bg-brand-400'}`} style={{ width: `${mod.progress || 0}%` }}></div>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-colors ${isSelected ? 'text-brand-500' : 'text-slate-400 group-hover:text-brand-400'}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Module Detail Sliding Panel */}
      {selectedModule && (
        <div className="w-full lg:w-[400px] shrink-0 bg-white rounded-2xl border border-slate-200/60 shadow-lg flex flex-col h-[calc(100vh-8rem)] sticky top-4 animate-in slide-in-from-right-8 duration-300">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
            <h3 className="font-bold text-slate-900 truncate pr-4">Module Updates</h3>
            <button 
              onClick={() => setSelectedModule(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-5 overflow-y-auto flex-1">
            <div className="mb-6">
              <h4 className="text-lg font-bold text-slate-900 mb-2">{selectedModule.name}</h4>
              <p className="text-sm text-slate-600 mb-4">{selectedModule.description}</p>
              
              {selectedModule.status === 'Completed' && selectedModule.approval_status !== 'Approved' && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-bold text-purple-900">Review Required</h5>
                      <p className="text-xs text-purple-700 mt-1 mb-3">This module has been marked as Completed and requires your approval.</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApprove(selectedModule.id)}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(selectedModule.id)}
                          className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 text-xs font-medium rounded hover:bg-slate-50 transition-colors"
                        >
                          Request Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedModule.approval_status === 'Approved' && (
                <div className="bg-emerald-50 text-emerald-800 text-sm font-bold p-3 rounded-lg border border-emerald-100 mb-6">
                  ✅ This task has been Approved.
                </div>
              )}
            </div>

            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Timeline</h5>
            
            {selectedModule.updates && selectedModule.updates.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200 pl-6 md:pl-0">
                {selectedModule.updates.map((update, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="absolute left-0 md:left-1/2 -translate-x-1/2 flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-brand-500 shadow shrink-0 z-10"></div>
                    <div className="w-full md:w-[calc(50%-1.5rem)] bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-brand-600">{update.date}</span>
                        <span className="text-xs font-bold text-slate-400">{update.progress}%</span>
                      </div>
                      <p className="text-sm text-slate-700">{update.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-slate-500">No updates yet for this module.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;

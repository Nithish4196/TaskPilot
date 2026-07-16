import { useState } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import EmployeeWorkspacePanel from '../components/EmployeeWorkspacePanel';
import { CheckSquare, Clock, AlertCircle, Play, CheckCircle2, MessageSquare, Paperclip, Loader2 } from 'lucide-react';

export default function EmployeeTasks() {
  const { currentUser, employeeTasks, setEmployeeTasks, projectModules, projects, dailyWorkSubmissions, employees, fetchGlobalData, triggerNotification } = useAppContext();
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('in-progress'); // 'in-progress' or 'completed'
  
  // Progress update state
  

  // Helper to get color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Waiting for Review': return 'bg-purple-100 text-purple-700';
      case 'Blocked': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  


  const inProgressTasks = employeeTasks.filter(t => t.status !== 'Completed');
  const completedTasks = employeeTasks.filter(t => t.status === 'Completed');
  const displayTasks = activeTab === 'in-progress' ? inProgressTasks : completedTasks;

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Tasks</h1>
          <p className="text-slate-500 mt-2">Manage your assigned tasks and update your progress.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Task List */}
        <div className="w-full lg:w-1/2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl mb-6">
            <button
              onClick={() => { setActiveTab('in-progress'); setSelectedTask(null); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'in-progress' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              In Progress ({inProgressTasks.length})
            </button>
            <button
              onClick={() => { setActiveTab('completed'); setSelectedTask(null); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              Completed ({completedTasks.length})
            </button>
          </div>

          {displayTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No {activeTab === 'completed' ? 'completed' : 'pending'} tasks</h3>
              <p className="text-slate-500 mt-2">
                {activeTab === 'completed' 
                  ? "You haven't completed any tasks yet." 
                  : "You currently have no tasks assigned to you. Click the demo button above to add one."}
              </p>
            </div>
          ) : (
            displayTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => setSelectedTask(task)}
                className={`bg-white p-5 rounded-2xl border ${selectedTask?.id === task.id ? 'border-brand-500 shadow-md ring-1 ring-brand-500' : 'border-slate-200 shadow-sm hover:border-brand-300'} cursor-pointer transition-all relative overflow-hidden`}
              >
                {/* Progress bar background indicator */}
                <div className="absolute bottom-0 left-0 h-1 bg-brand-500 transition-all" style={{ width: `${task.progress}%` }}></div>
                
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-900 text-lg pr-4">{task.name}</h3>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 line-clamp-2 mb-4">{task.description}</p>
                
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    <Clock className="w-3.5 h-3.5" /> Due: {new Date(task.due_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className={`w-3.5 h-3.5 ${task.priority === 'High' ? 'text-red-500' : 'text-slate-400'}`} /> 
                    {task.priority} Priority
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Task Detail & Update Panel */}
        <div className="w-full lg:w-1/2">
          {selectedTask ? (
            <EmployeeWorkspacePanel
              selectedTask={selectedTask}
              taskSubs={dailyWorkSubmissions ? dailyWorkSubmissions.filter(s => s.task_id === selectedTask.id).sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at)) : []}
              taskModule={projectModules ? projectModules.find(m => m.id === selectedTask.module_id) : null}
              taskProject={projects ? projects.find(p => p.id === selectedTask.project_id) : null}
              currentUser={currentUser}
              employees={employees}
              fetchGlobalData={fetchGlobalData}
              triggerNotification={triggerNotification}
            />
          ) : (
            <div className="bg-slate-100 rounded-2xl border border-slate-200 border-dashed h-full min-h-[400px] flex items-center justify-center text-slate-400 font-medium">
              Select a task to view details and update progress
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
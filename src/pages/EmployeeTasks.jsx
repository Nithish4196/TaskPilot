import { useState } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import EmployeeWorkspacePanel from '../components/EmployeeWorkspacePanel';
import { CheckSquare, Clock, AlertCircle, Play, CheckCircle2, MessageSquare, Paperclip, Loader2, Plus, X } from 'lucide-react';

export default function EmployeeTasks() {
  const { currentUser, employeeTasks, setEmployeeTasks, projectModules, projects, dailyWorkSubmissions, employees, fetchGlobalData, triggerNotification, taskDeliverables, taskHistory } = useAppContext();
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('in-progress'); // 'in-progress' or 'completed'
  
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isTeamLeader } = useAppContext();
  const isLeader = currentUser ? isTeamLeader(currentUser.id) : false;
  
  // Add Personal Task Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    module_id: '',
    due_date: '',
    estimated_hours: 1
  });
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddPersonalTask = async (e) => {
    e.preventDefault();
    if (!newTask.module_id) return alert('Please select a module');
    setIsAdding(true);
    try {
      const { data, error } = await supabase.from('tasks').insert({
        module_id: newTask.module_id,
        project_id: projectId,
        employee_id: currentUser.id,
        name: newTask.name,
        description: newTask.description,
        task_type: 'Technical',
        status: 'Assigned',
        priority: 'Medium',
        due_date: newTask.due_date,
        estimated_hours: newTask.estimated_hours,
        approval_status: 'Pending'
      }).select().single();
      
      if (error) throw error;
      
      await supabase.from('task_history').insert({
        task_id: data.id,
        performed_by: currentUser.id,
        action: 'Created & Assigned',
        new_status: 'Assigned',
        comments: 'Personal task created by Team Leader.'
      });
      
      fetchGlobalData();
      setShowAddModal(false);
      setNewTask({ name: '', description: '', module_id: '', due_date: '', estimated_hours: 1 });
    } catch (err) {
      console.error(err);
      alert('Error adding personal task');
    } finally {
      setIsAdding(false);
    }
  };

  const projectModulesList = projectModules && projectId ? projectModules.filter(m => m.project_id === projectId) : [];
  
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

  


  const filteredTasks = projectId ? employeeTasks.filter(t => t.project_id === projectId) : employeeTasks;
  const inProgressTasks = filteredTasks.filter(t => t.status !== 'Completed');
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed');
  const displayTasks = activeTab === 'in-progress' ? inProgressTasks : completedTasks;

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start w-full mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {projectId && (
              <button onClick={() => navigate('/employee/projects')} className="text-sm font-semibold text-slate-500 hover:text-slate-900">
                &larr; Back to Projects
              </button>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Project Tasks</h1>
          <p className="text-slate-500 mt-2">Manage your assigned tasks and update your progress for this project.</p>
        </div>
        {isLeader && projectId && (
          <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm">
            <Plus className="w-4 h-4" /> Add Personal Task
          </button>
        )}
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
              taskDeliverables={taskDeliverables}
              taskHistory={taskHistory}
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

      {/* Add Personal Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Add Personal Task</h2>
            <form onSubmit={handleAddPersonalTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Task Name</label>
                <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Module</label>
                <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newTask.module_id} onChange={e => setNewTask({...newTask, module_id: e.target.value})}>
                  <option value="">Select a Module...</option>
                  {projectModulesList.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none h-24" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Estimated Hours</label>
                  <input required type="number" min="1" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newTask.estimated_hours} onChange={e => setNewTask({...newTask, estimated_hours: e.target.value})} />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" disabled={isAdding} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 flex items-center gap-2">
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Personal Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Add Personal Task</h2>
            <form onSubmit={handleAddPersonalTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Task Name</label>
                <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Module</label>
                <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newTask.module_id} onChange={e => setNewTask({...newTask, module_id: e.target.value})}>
                  <option value="">Select a Module...</option>
                  {projectModulesList.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none h-24" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Estimated Hours</label>
                  <input required type="number" min="1" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newTask.estimated_hours} onChange={e => setNewTask({...newTask, estimated_hours: e.target.value})} />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" disabled={isAdding} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 flex items-center gap-2">
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

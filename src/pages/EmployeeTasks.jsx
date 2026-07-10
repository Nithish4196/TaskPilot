import { useState } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import { CheckSquare, Clock, AlertCircle, Play, CheckCircle2, MessageSquare, Paperclip, Loader2 } from 'lucide-react';

export default function EmployeeTasks() {
  const { currentUser, employeeTasks, setEmployeeTasks } = useAppContext();
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('in-progress'); // 'in-progress' or 'completed'
  
  // Progress update state
  const [progressVal, setProgressVal] = useState(0);
  const [updateDesc, setUpdateDesc] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!selectedTask || !updateDesc) return;
    
    setIsUpdating(true);
    try {
      // 1. Insert update record
      await supabase.from('task_updates').insert([{
        task_id: selectedTask.id,
        employee_id: currentUser.id,
        progress_percentage: progressVal,
        description: updateDesc,
        time_spent_hours: parseFloat(timeSpent) || 0
      }]);

      // 2. Update task status & progress
      const newStatus = progressVal === 100 ? 'Completed' : 'In Progress';
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update({ progress: progressVal, status: newStatus })
        .eq('id', selectedTask.id)
        .select()
        .single();
        
      if (!error && updatedTask) {
        setEmployeeTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        setSelectedTask(updatedTask);
        setUpdateDesc('');
        setTimeSpent('');
      }
    } catch (err) {
      console.error('Error updating task:', err);
    } finally {
      setIsUpdating(false);
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
                onClick={() => { setSelectedTask(task); setProgressVal(task.progress); }}
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Task Details</h2>
                {selectedTask.status === 'Completed' && (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-100 px-3 py-1 rounded-full text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-2">{selectedTask.name}</h3>
                  <p className="text-slate-600 leading-relaxed">{selectedTask.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</p>
                    <p className="font-semibold text-slate-900">{new Date(selectedTask.due_date).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Hours</p>
                    <p className="font-semibold text-slate-900">{selectedTask.estimated_hours} hrs</p>
                  </div>
                </div>

                {/* Progress Update Form */}
                {selectedTask.status !== 'Completed' && (
                  <form onSubmit={handleUpdateProgress} className="pt-6 border-t border-slate-100 space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Play className="w-4 h-4 text-brand-600" /> Update Progress
                    </h4>
                    
                    <div>
                      <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                        <label>Current Progress</label>
                        <span className="text-brand-600">{progressVal}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" step="5"
                        value={progressVal}
                        onChange={(e) => setProgressVal(parseInt(e.target.value))}
                        className="w-full accent-brand-600"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Update Description</label>
                        <input 
                          type="text" 
                          required
                          placeholder="What did you work on?" 
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm"
                          value={updateDesc}
                          onChange={(e) => setUpdateDesc(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Time Spent (hrs)</label>
                        <input 
                          type="number" 
                          step="0.5" min="0"
                          placeholder="e.g. 2.5" 
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm"
                          value={timeSpent}
                          onChange={(e) => setTimeSpent(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button type="button" className="text-slate-400 hover:text-slate-600 p-2">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button 
                        type="submit" 
                        disabled={isUpdating}
                        className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:bg-brand-400 flex items-center gap-2"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                        Submit Update
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
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

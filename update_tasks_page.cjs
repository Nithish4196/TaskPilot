const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeTasks.jsx', 'utf8');

// 1. Add useParams
if (!code.includes('useParams')) {
  code = code.replace(
    "import { useAppContext, supabase } from '../context/AppContext';",
    "import { useAppContext, supabase } from '../context/AppContext';\nimport { useParams, useNavigate } from 'react-router-dom';"
  );
}

// 2. Add Plus icon
if (!code.includes('Plus')) {
  code = code.replace(
    "import { CheckSquare, Clock, AlertCircle, Play, CheckCircle2, MessageSquare, Paperclip, Loader2 } from 'lucide-react';",
    "import { CheckSquare, Clock, AlertCircle, Play, CheckCircle2, MessageSquare, Paperclip, Loader2, Plus, X } from 'lucide-react';"
  );
}

// 3. Add projectId, navigate, isLeader, and modal state
const stateBlock = `  const [activeTab, setActiveTab] = useState('in-progress'); // 'in-progress' or 'completed'
  
  // Progress update state`;

const newStateBlock = `  const [activeTab, setActiveTab] = useState('in-progress'); // 'in-progress' or 'completed'
  
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

  const projectModulesList = projectModules ? projectModules.filter(m => m.project_id === projectId) : [];
  
  // Progress update state`;

code = code.replace(stateBlock, newStateBlock);

// 4. Filter employeeTasks by projectId
const taskFilterOld = `  const inProgressTasks = employeeTasks.filter(t => t.status !== 'Completed');
  const completedTasks = employeeTasks.filter(t => t.status === 'Completed');`;

const taskFilterNew = `  const filteredTasks = projectId ? employeeTasks.filter(t => t.project_id === projectId) : employeeTasks;
  const inProgressTasks = filteredTasks.filter(t => t.status !== 'Completed');
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed');`;

code = code.replace(taskFilterOld, taskFilterNew);

// 5. Update Header to add "Add Personal Task" button for TLs, and Back button
const headerOld = `        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Tasks</h1>
          <p className="text-slate-500 mt-2">Manage your assigned tasks and update your progress.</p>
        </div>`;

const headerNew = `        <div className="flex justify-between items-start w-full">
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
            <button onClick={() => setShowAddModal(true)} className="btn-primary bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Personal Task
            </button>
          )}
        </div>`;

code = code.replace(headerOld, headerNew);

// 6. Add Modal JSX at the end before </div>
const modalJsx = `
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
`;

code = code.replace(/    <\/div>\s*  \);\s*}\s*$/, modalJsx);

fs.writeFileSync('src/pages/EmployeeTasks.jsx', code);
console.log('Updated EmployeeTasks.jsx to handle projectId and TL personal tasks');

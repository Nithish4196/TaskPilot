const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeTasks.jsx', 'utf8');

// Replace activeTab line to inject hooks
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState\('in-progress'\);[\s\S]*?\/\/ Progress update state/,
  `const [activeTab, setActiveTab] = useState('in-progress'); // 'in-progress' or 'completed'
  
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
  
  // Progress update state`
);

// Replace header
code = code.replace(
  /<div className="flex justify-between items-end mb-8">\s*<div>\s*<h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Tasks<\/h1>\s*<p className="text-slate-500 mt-2">Manage your assigned tasks and update your progress\.<\/p>\s*<\/div>\s*<\/div>/,
  `<div className="flex justify-between items-start w-full mb-8">
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
      </div>`
);

fs.writeFileSync('src/pages/EmployeeTasks.jsx', code);
console.log('Fixed EmployeeTasks.jsx hooks and header');

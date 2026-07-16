const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeTasks.jsx', 'utf8');

// 1. Add import
code = code.replace(
  'import { CheckSquare, Clock',
  "import EmployeeWorkspacePanel from '../components/EmployeeWorkspacePanel';\nimport { CheckSquare, Clock"
);

// 2. Remove state
const stateStart = code.indexOf('const [progressVal, setProgressVal] = useState(0);');
const stateEnd = code.indexOf('const [isUpdating, setIsUpdating] = useState(false);') + 'const [isUpdating, setIsUpdating] = useState(false);\n'.length;
if (stateStart > -1 && stateEnd > stateStart) {
  code = code.substring(0, stateStart) + code.substring(stateEnd);
}

// 3. Remove handlers
const handleStart = code.indexOf('const handleUpdateProgress');
const handleEnd = code.indexOf('};', code.indexOf('setIsUpdating(false);', handleStart)) + 2;
if (handleStart > -1 && handleEnd > handleStart) {
  code = code.substring(0, handleStart) + code.substring(handleEnd);
}

// 4. Replace right panel
const rightPanelStart = code.indexOf('{/* Task Detail & Update Panel */}');
if (rightPanelStart > -1) {
  code = code.substring(0, rightPanelStart) + `{/* Task Detail & Update Panel */}
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
}`;
}

fs.writeFileSync('src/pages/EmployeeTasks.jsx', code);
console.log('Successfully updated EmployeeTasks.jsx');

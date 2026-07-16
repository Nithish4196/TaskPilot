const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeTasks.jsx', 'utf8');

const startIdx = code.indexOf('// Progress update state');
const endIdx = code.indexOf('const [isUpdating, setIsUpdating] = useState(false);') + 'const [isUpdating, setIsUpdating] = useState(false);\n'.length;

code = code.substring(0, startIdx) + code.substring(endIdx);

const startHandlers = code.indexOf('const handleStartTask');
const endHandlers = code.indexOf('const handleSubmitFinalReview = async () => {');
const endHandlersFinal = code.indexOf('};', endHandlers) + 2;

code = code.substring(0, startHandlers) + code.substring(endHandlersFinal);

const rightPanelStart = code.indexOf('{selectedTask ? (');
const rightPanelEnd = code.lastIndexOf('</div>', code.lastIndexOf('</div>') - 1);
const rightPanelEndFinal = code.indexOf('</div>', rightPanelEnd) + 6;

code = code.substring(0, rightPanelStart) + `{selectedTask ? (
        <EmployeeWorkspacePanel
          selectedTask={selectedTask}
          taskSubs={taskSubs}
          taskModule={taskModule}
          taskProject={taskProject}
          currentUser={currentUser}
          employees={employees}
          fetchGlobalData={fetchGlobalData}
          triggerNotification={triggerNotification}
        />
      ) : (
        <div className="w-full lg:w-1/2 p-8 text-center text-[var(--text-secondary)]">
          <Target className="w-12 h-12 opacity-50 mx-auto mb-4" />
          <h3 className="font-semibold text-[var(--text-primary)]">No Task Selected</h3>
          <p className="text-sm">Select a task from the list to view details.</p>
        </div>
      )}
    </div>
  );
}`

code = code.replace(
  'import { CheckSquare, Clock',
  "import EmployeeWorkspacePanel from '../components/EmployeeWorkspacePanel';\nimport { CheckSquare, Clock"
);

fs.writeFileSync('src/pages/EmployeeTasks.jsx', code);
console.log('Successfully updated EmployeeTasks.jsx');

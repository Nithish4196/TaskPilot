const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeTasks.jsx', 'utf8');

code = code.replace(
  'const { currentUser, tasks, projectModules, projects, dailyWorkSubmissions, employees, fetchGlobalData, triggerNotification } = useAppContext();',
  'const { currentUser, tasks, projectModules, projects, dailyWorkSubmissions, employees, fetchGlobalData, triggerNotification, taskDeliverables, taskHistory } = useAppContext();'
);

const panelOld = `<EmployeeWorkspacePanel
              selectedTask={employeeTasks.find(t => t.id === selectedTask.id) || selectedTask}`;

const panelNew = `<EmployeeWorkspacePanel
              taskDeliverables={taskDeliverables}
              taskHistory={taskHistory}
              selectedTask={employeeTasks.find(t => t.id === selectedTask.id) || selectedTask}`;

code = code.replace(panelOld, panelNew);

fs.writeFileSync('src/pages/EmployeeTasks.jsx', code);
console.log('Fixed EmployeeTasks.jsx');

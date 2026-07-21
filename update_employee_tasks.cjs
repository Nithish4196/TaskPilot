const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeTasks.jsx', 'utf8');

if (!code.includes('taskDeliverables')) {
  code = code.replace(
    'const { currentUser, tasks, projectModules, projects, dailyWorkSubmissions, employees, fetchGlobalData, triggerNotification } = useAppContext();',
    'const { currentUser, tasks, projectModules, projects, dailyWorkSubmissions, employees, fetchGlobalData, triggerNotification, taskDeliverables, taskHistory } = useAppContext();'
  );
  
  code = code.replace(
    '<EmployeeWorkspacePanel',
    '<EmployeeWorkspacePanel\\n              taskDeliverables={taskDeliverables}\\n              taskHistory={taskHistory}'
  );
  
  fs.writeFileSync('src/pages/EmployeeTasks.jsx', code);
  console.log('Updated EmployeeTasks.jsx');
}

const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeTasks.jsx', 'utf8');

code = code.replace(
  /const inProgressTasks = employeeTasks\.filter\([^)]*\);\r?\n\s*const completedTasks = employeeTasks\.filter\([^)]*\);/, 
  `const filteredTasks = projectId ? employeeTasks.filter(t => t.project_id === projectId) : employeeTasks;
  const inProgressTasks = filteredTasks.filter(t => t.status !== 'Completed');
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed');`
);

fs.writeFileSync('src/pages/EmployeeTasks.jsx', code);
console.log('Fixed filtering in EmployeeTasks.jsx');

const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeTasks.jsx', 'utf8');

code = code.replace(
  "const inProgressTasks = employeeTasks.filter(t => t.status !== 'Completed');",
  "const inProgressTasks = employeeTasks.filter(t => t.status !== 'Completed' && t.status !== 'Under Final Review');"
);

code = code.replace(
  "const completedTasks = employeeTasks.filter(t => t.status === 'Completed');",
  "const completedTasks = employeeTasks.filter(t => t.status === 'Completed' || t.status === 'Under Final Review');"
);

code = code.replace(
  "Completed ({completedTasks.length})",
  "Completed / Review ({completedTasks.length})"
);

code = code.replace(
  "No {activeTab === 'completed' ? 'completed' : 'pending'} tasks",
  "No {activeTab === 'completed' ? 'completed or under review' : 'in-progress'} tasks"
);

fs.writeFileSync('src/pages/EmployeeTasks.jsx', code);
console.log('Fixed');

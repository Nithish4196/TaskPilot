const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeProjects.jsx', 'utf8');

// Add useNavigate
if (!code.includes('useNavigate')) {
  code = code.replace(
    "import { useState } from 'react';",
    "import { useState } from 'react';\nimport { useNavigate } from 'react-router-dom';"
  );
  code = code.replace(
    'const { employeeProjects',
    'const navigate = useNavigate();\n const { employeeProjects'
  );
}

// Update onClick for active projects
code = code.replace(
  /<div key={project.id} className="linear-card/g,
  '<div key={project.id} onClick={() => navigate(`/employee/projects/${project.id}`)} className="linear-card cursor-pointer'
);

fs.writeFileSync('src/pages/EmployeeProjects.jsx', code);
console.log('Updated EmployeeProjects.jsx to navigate on click');

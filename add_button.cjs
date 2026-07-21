const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeTasks.jsx', 'utf8');

// 1. Add state variables
code = code.replace(
  "const [activeTab, setActiveTab] = useState('in-progress'); // 'in-progress' or 'completed'",
  `const [activeTab, setActiveTab] = useState('in-progress'); // 'in-progress' or 'completed'
  const [submittingTask, setSubmittingTask] = useState(null);
  const [finalDeliverables, setFinalDeliverables] = useState('');
  const [sourceCodeUrl, setSourceCodeUrl] = useState('');
  const [filesUrl, setFilesUrl] = useState('');
  const [testingDetails, setTestingDetails] = useState('');
  const [deploymentDetails, setDeploymentDetails] = useState('');
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);`
);

// 2. Add Submit Task Button
const buttonCode = `<div className="flex items-center gap-2 shrink-0">
                    {task.status !== 'Completed' && task.status !== 'Under Final Review' && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSubmittingTask(task); 
                          setFinalDeliverables('');
                          setSourceCodeUrl('');
                          setFilesUrl('');
                          setTestingDetails('');
                          setDeploymentDetails('');
                        }}
                        className="px-2 py-1 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded shadow-sm transition-colors"
                      >
                        Submit Task
                      </button>
                    )}
                    <span className={\`px-2.5 py-1 rounded-md text-xs font-bold \${getStatusColor(task.status)}\`}>
                      {task.status}
                    </span>
                  </div>`;

// Replace the existing span with the new button container
code = code.replace(
  /<span className={`px-2\.5 py-1 rounded-md text-xs font-bold shrink-0 \${getStatusColor\(task\.status\)}`}>\s*\{task\.status\}\s*<\/span>/,
  buttonCode
);

fs.writeFileSync('src/pages/EmployeeTasks.jsx', code);
console.log('Fixed state and button');

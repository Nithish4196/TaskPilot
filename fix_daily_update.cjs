const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.jsx', 'utf8');

// Fix Daily Updates mapping
code = code.replace(
  'const tl = employees.find(e => e.id === sub.submitted_by);',
  'const tl = employees.find(e => e.id === sub.tl_id);'
);

code = code.replace(
  'sub.today_summary ||',
  'sub.team_productivity ||'
);

code = code.replace(
  'sub.tomorrow_plan ||',
  'sub.planned_work_tomorrow ||'
);

fs.writeFileSync('src/pages/ProjectDetail.jsx', code);
console.log('Fixed daily update mapping');

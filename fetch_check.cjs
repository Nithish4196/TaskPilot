const fs = require('fs');
const code = fs.readFileSync('src/pages/TeamLeaderWorkspace.jsx', 'utf8');
const search = 'module_submissions';
const idx = code.indexOf(search);
console.log(code.substring(idx - 200, idx + 400));

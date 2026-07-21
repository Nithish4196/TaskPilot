const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.jsx', 'utf8');

const badModuleDivRegex = /<p className="text-\[10px\] text-\[var\(--text-secondary\)\] mt-2">\{new Date\(sub\.submitted_at\)\.toLocaleDateString\(\)\}<\/p>\s*<\/div>\s*<\/div>\s*\{\/\* Review Section \*\/\}/g;

code = code.replace(badModuleDivRegex, '<p className="text-[10px] text-[var(--text-secondary)] mt-2">{new Date(sub.submitted_at).toLocaleDateString()}</p>\n </div>\n \n {/* Review Section */}');

const badDailyDivRegex = /<p className="text-\[10px\] text-\[var\(--text-secondary\)\] mt-2">\{new Date\(sub\.created_at\)\.toLocaleDateString\(\)\}<\/p>\s*<\/div>\s*<\/div>\s*\{\/\* Review Section for Daily Updates \*\/\}/g;

code = code.replace(badDailyDivRegex, '<p className="text-[10px] text-[var(--text-secondary)] mt-2">{new Date(sub.created_at).toLocaleDateString()}</p>\n </div>\n \n {/* Review Section for Daily Updates */}');

fs.writeFileSync('src/pages/ProjectDetail.jsx', code);
console.log('Fixed extra div closures');

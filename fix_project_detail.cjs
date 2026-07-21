const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.jsx', 'utf8');

const oldRender = `{sub.tl_notes || 'No notes provided.'}
 </div>
 {sub.files_url && (
 <a href={sub.files_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] px-3 py-1.5 rounded hover:bg-[var(--btn-primary-hover)] transition-colors inline-flex items-center gap-2">
 View Attached Files
 </a>
 )}`;

const newRender = `{sub.tl_comments || 'No comments provided.'}
 </div>
 {sub.deliverables && (
   (() => {
     try {
       const parsed = JSON.parse(sub.deliverables);
       if (parsed.files_url) {
         return (
           <a href={parsed.files_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] px-3 py-1.5 rounded hover:bg-[var(--btn-primary-hover)] transition-colors inline-flex items-center gap-2">
             View Attached Files
           </a>
         );
       }
     } catch (e) {}
     return null;
   })()
 )}`;

code = code.replace(oldRender, newRender);
fs.writeFileSync('src/pages/ProjectDetail.jsx', code);
console.log('Fixed ProjectDetail.jsx module submission schema');

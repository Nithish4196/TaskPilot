const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeWorkspacePanel.jsx', 'utf8');

// 1. Add state
const stateInjection = `  const [checklist, setChecklist] = useState({ progress: false, summary: false, evidence: false });
  const [submissionLinks, setSubmissionLinks] = useState([{ title: '', url: '' }]);
  const [submissionFiles, setSubmissionFiles] = useState([]);`;
code = code.replace('  const [checklist, setChecklist] = useState({ progress: false, summary: false, evidence: false });', stateInjection);

// 2. Update reset in useEffect
const resetInjection = `      setChangesMade('');
      setSubmissionLinks([{ title: '', url: '' }]);
      setSubmissionFiles([]);`;
code = code.replace("      setChangesMade('');", resetInjection);

// 3. Update saveDraft
code = code.replace(
  'const draft = { updateDesc, changesMade, progressVal, hasBlocker, blockerDesc, timeSpentHours, timeSpentMinutes };',
  'const draft = { updateDesc, changesMade, progressVal, hasBlocker, blockerDesc, timeSpentHours, timeSpentMinutes, submissionLinks, submissionFiles };'
);

// 4. Update loadDraft
const loadDraftInjection = `        setChangesMade(d.changesMade || '');
        setSubmissionLinks(d.submissionLinks || [{ title: '', url: '' }]);
        setSubmissionFiles(d.submissionFiles || []);`;
code = code.replace("        setChangesMade(d.changesMade || '');", loadDraftInjection);

// 5. Update dependency array
code = code.replace(
  '}, [updateDesc, changesMade, progressVal, hasBlocker, blockerDesc, timeSpentHours, timeSpentMinutes]);',
  '}, [updateDesc, changesMade, progressVal, hasBlocker, blockerDesc, timeSpentHours, timeSpentMinutes, submissionLinks, submissionFiles]);'
);

// 6. Add UI handlers and components
const uiInjection = `
                    {/* Repository / Deployment Links */}
                    <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Repository / Deployment Links</label>
                      </div>
                      {submissionLinks.map((link, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" placeholder="Title (e.g. GitHub PR)" className="w-1/3 px-3 py-2 linear-card text-sm" value={link.title} onChange={e => {
                            const newLinks = [...submissionLinks];
                            newLinks[idx].title = e.target.value;
                            setSubmissionLinks(newLinks);
                          }} />
                          <input type="url" placeholder="https://..." className="w-2/3 px-3 py-2 linear-card text-sm" value={link.url} onChange={e => {
                            const newLinks = [...submissionLinks];
                            newLinks[idx].url = e.target.value;
                            setSubmissionLinks(newLinks);
                          }} />
                          {submissionLinks.length > 1 && (
                            <button type="button" onClick={() => setSubmissionLinks(submissionLinks.filter((_, i) => i !== idx))} className="p-2 text-[var(--text-secondary)] hover:text-red-500">×</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => setSubmissionLinks([...submissionLinks, { title: '', url: '' }])} className="text-xs text-blue-500 font-semibold hover:underline">+ Add Another Link</button>
                    </div>

                    {/* File Uploads (Simulated) */}
                    <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">File Attachments</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {submissionFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-[var(--bg-secondary)] px-2 py-1 rounded text-xs border border-[var(--border)]">
                            <FileText className="w-3 h-3 text-[var(--text-secondary)]" />
                            <span>{f.name}</span>
                            <button type="button" onClick={() => setSubmissionFiles(submissionFiles.filter((_, i) => i !== idx))} className="text-[var(--text-secondary)] hover:text-red-500">×</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="file" multiple className="text-xs text-[var(--text-secondary)]" onChange={e => {
                          const files = Array.from(e.target.files).map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
                          setSubmissionFiles([...submissionFiles, ...files]);
                        }} />
                      </div>
                    </div>
`;
code = code.replace('                    <div className="grid grid-cols-2 gap-6">', uiInjection + '\n                    <div className="grid grid-cols-2 gap-6">');

// 7. Update handleUpdateProgress
code = code.replace(
  "        changes_made: showRevisionInput ? changesMade : null,",
  "        changes_made: showRevisionInput ? changesMade : null,\n        links: submissionLinks.filter(l => l.url),\n        files: submissionFiles,"
);

// 8. Update History Tab to render links and files
const historyRenderInjection = `                {sub.tl_comments && (
                  <div className="mt-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-xs">
                    <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1"><Star className="w-3 h-3"/> TL Feedback (Rating: {sub.rating}/5)</p>
                    <p className="text-[var(--text-secondary)]">{sub.tl_comments}</p>
                  </div>
                )}
                
                {((sub.links && sub.links.length > 0) || (sub.files && sub.files.length > 0)) && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                    {sub.links && sub.links.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sub.links.map((link, idx) => (
                          <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline bg-blue-50/10 px-2 py-1 rounded">
                            {link.title || link.url}
                          </a>
                        ))}
                      </div>
                    )}
                    {sub.files && sub.files.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sub.files.map((file, idx) => (
                          <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border)] px-2 py-1 rounded hover:bg-[var(--surface)]">
                            <FileText className="w-3 h-3" /> {file.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}`;
code = code.replace(
  `                {sub.tl_comments && (
                  <div className="mt-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-xs">
                    <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1"><Star className="w-3 h-3"/> TL Feedback (Rating: {sub.rating}/5)</p>
                    <p className="text-[var(--text-secondary)]">{sub.tl_comments}</p>
                  </div>
                )}`,
  historyRenderInjection
);


fs.writeFileSync('src/components/EmployeeWorkspacePanel.jsx', code);
console.log('Finished updating EmployeeWorkspacePanel');

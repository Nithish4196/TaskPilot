const fs = require('fs');
let code = fs.readFileSync('src/pages/TeamLeaderWorkspace.jsx', 'utf8');

const modalCode = ` {showFinalTaskReviewModal && selectedTaskForReview && (
 <div className="fixed inset-0 bg-[var(--surface)]/50 flex items-center justify-center p-6 z-50 transition-opacity">
 <div className="linear-card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
 <h2 className="section-title mb-6">Final Task Review: {selectedTaskForReview.name}</h2>
 <div className="space-y-4 mb-6">
  <div>
    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Feedback/Comments</label>
    <textarea className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm" rows="3" value={finalReviewFeedback} onChange={(e) => setFinalReviewFeedback(e.target.value)}></textarea>
  </div>
  <div>
    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Improvement Suggestions</label>
    <textarea className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm" rows="3" value={finalReviewSuggestions} onChange={(e) => setFinalReviewSuggestions(e.target.value)}></textarea>
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Rating (1-5)</label>
      <input type="number" min="1" max="5" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm" value={finalReviewRating} onChange={(e) => setFinalReviewRating(e.target.value)} />
    </div>
    <div>
      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Quality Score (0-100)</label>
      <input type="number" min="0" max="100" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] text-sm" value={finalReviewQuality} onChange={(e) => setFinalReviewQuality(e.target.value)} />
    </div>
  </div>
 </div>
 <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
 <button type="button" onClick={() => { setShowFinalTaskReviewModal(false); setSelectedTaskForReview(null); setFinalReviewFeedback(''); setFinalReviewSuggestions(''); setFinalReviewRating(5); setFinalReviewQuality(100); }} className="px-4 py-2 text-sm text-[var(--text-secondary)] font-medium hover:bg-[var(--surface)] transition-colors duration-150">Cancel</button>
 <button type="button" onClick={() => handleFinalTaskReview('Reject')} className="px-4 py-2 text-sm border border-[var(--border)] hover:border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold transition-colors duration-150">Reject</button>
 <button type="button" onClick={() => handleFinalTaskReview('Approve')} className="px-4 py-2 text-sm bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-semibold transition-colors duration-150 border border-[var(--border)]">Approve</button>
 </div>
 </div>
 </div>
 )}

`;

code = code.replace(
  "{showTaskModal && (",
  modalCode + "{showTaskModal && ("
);

fs.writeFileSync('src/pages/TeamLeaderWorkspace.jsx', code);
console.log('Added final task review modal');

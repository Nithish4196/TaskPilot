const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.jsx', 'utf8');

// Add Star icon import if missing
if (!code.includes('Star,')) {
  code = code.replace(
    'import { \n ArrowLeft,',
    'import { \n ArrowLeft, Star,'
  );
}

// Add Review State Variables
if (!code.includes('const [reviewingId, setReviewingId]')) {
  code = code.replace(
    "const [newModule, setNewModule] = useState({ name: '', description: '', team_id: '' });",
    `const [newModule, setNewModule] = useState({ name: '', description: '', team_id: '' });\n\n // Manager Review State\n const [reviewingId, setReviewingId] = useState(null);\n const [reviewFeedback, setReviewFeedback] = useState('');\n const [reviewRating, setReviewRating] = useState(0);\n const [isSubmittingReview, setIsSubmittingReview] = useState(false);`
  );
}

// Add handleReviewSubmit function
const handleReviewSubmitFunc = `
 const handleReviewSubmit = async (sub, action) => {
    if (action !== 'Approve' && !reviewFeedback.trim()) {
      alert('Please provide feedback for this action.');
      return;
    }
    
    setIsSubmittingReview(true);
    try {
      let table = '';
      if (sub.tl_notes !== undefined || sub.files_url !== undefined) {
        table = 'module_submissions';
      } else if (sub.today_summary !== undefined || sub.team_productivity !== undefined) {
        table = 'daily_team_reports';
      }

      const payload = {
        manager_feedback: reviewFeedback,
        rating: reviewRating || null,
        reviewed_at: new Date().toISOString()
      };

      if (action === 'Approve') payload.status = 'Approved';
      else if (action === 'Reject') payload.status = 'Rejected';
      else if (action === 'Need Changes') payload.status = 'Needs Revision';
      else if (action === 'Reviewed') payload.status = 'Reviewed'; // For Daily Updates

      const { error } = await supabase.from(table).update(payload).eq('id', sub.id);
      if (error) throw error;

      if (table === 'module_submissions' && action === 'Approve') {
        // Complete the module
        await supabase.from('project_modules').update({ manager_approved: true, status: 'Completed' }).eq('id', sub.module_id);
        
        // Complete the tasks
        await supabase.from('tasks').update({
          approval_status: 'Approved',
          status: 'Completed',
          approved_at: new Date().toISOString(),
          approved_by: currentUser.id
        }).eq('module_id', sub.module_id);

        // Auto-progress enterprise_rewards directly to Unlocked!
        const { data: rewards } = await supabase.from('enterprise_rewards')
          .select('*')
          .contains('module_ids', [sub.module_id])
          .eq('status', 'Waiting for Manager Approval');
          
        if (rewards && rewards.length > 0) {
          for (const reward of rewards) {
            await supabase.from('enterprise_rewards').update({ status: 'Unlocked' }).eq('id', reward.id);
            
            // Get all employees in the target team
            const { data: teamMembers } = await supabase.from('employees').select('id').eq('team', reward.team_name);
            if (teamMembers && teamMembers.length > 0) {
              const claimsToInsert = teamMembers.map(emp => ({
                reward_id: reward.id,
                employee_id: emp.id,
                status: 'Unlocked'
              }));
              await supabase.from('reward_claims').upsert(claimsToInsert, { onConflict: 'reward_id, employee_id', ignoreDuplicates: true });
              
              // Notify TL
              triggerNotification(sub.tl_id, 'Reward Unlocked!', \`Congratulations! The reward "\${reward.title}" has been unlocked by the Manager. Claim it now!\`, 'reward');
            }
          }
        }
      }

      triggerNotification(sub.tl_id || sub.submitted_by, \`Submission \${action}\`, \`Your submission has been \${action.toLowerCase() }.\`, 'review', sub.id);
      
      setReviewingId(null);
      setReviewFeedback('');
      setReviewRating(0);
      
      setTimeout(() => {
        triggerNotification(currentUser.id, 'Review Submitted', 'Your review has been successfully submitted.', 'system');
        window.location.reload(); 
      }, 500);
    } catch (err) {
      console.error('Review error:', err);
      alert('Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
 };
`;

if (!code.includes('const handleReviewSubmit')) {
  code = code.replace(
    'const handleCompleteProject = async () => {',
    handleReviewSubmitFunc + '\n const handleCompleteProject = async () => {'
  );
}


// Replace Module Submissions status tag to use dynamic colors
code = code.replace(
  '<span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isApproved ? \'bg-green-500/10 text-green-500 border border-green-500/20\' : \'bg-purple-500/10 text-purple-500 border border-purple-500/20\'}`}>\n {sub.status || \'Pending Review\'}\n </span>',
  '<span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isApproved ? \'bg-green-500/10 text-green-500 border border-green-500/20\' : sub.status === \'Rejected\' ? \'bg-red-500/10 text-red-500 border border-red-500/20\' : \'bg-purple-500/10 text-purple-500 border border-purple-500/20\'}`}>\n {sub.status || \'Pending Review\'}\n </span>'
);

// Insert Module Submissions Review UI before the end of the linear-card
const moduleEndString = ` View Attached Files
 </a>
 )}
 </div>`;

const moduleReviewUI = ` View Attached Files
 </a>
 )}
 
 {/* Review Section */}
 {sub.status === 'Pending Review' && currentUser.role === 'manager' && reviewingId !== sub.id && (
   <div className="mt-4 flex justify-end border-t border-[var(--border)] pt-4">
     <button onClick={() => { setReviewingId(sub.id); setReviewFeedback(''); setReviewRating(0); }} className="px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold text-xs border border-[var(--border)] hover:bg-[var(--btn-primary-hover)] transition-colors">
       Review Submission
     </button>
   </div>
 )}
 
 {reviewingId === sub.id && (
   <div className="mt-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border)] relative animate-in fade-in zoom-in-95 duration-200">
     <h5 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Manager Review</h5>
     <div className="space-y-4">
       <div>
         <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Feedback Notes</label>
         <textarea className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--btn-primary-bg)] h-20 resize-none" value={reviewFeedback} onChange={e => setReviewFeedback(e.target.value)} placeholder="Provide detailed feedback on this module..." />
       </div>
       <div>
         <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Rating (out of 5)</label>
         <div className="flex gap-1">
           {[1,2,3,4,5].map(star => (
             <button key={star} type="button" onClick={() => setReviewRating(star)} className={\`w-8 h-8 flex items-center justify-center border transition-all \${reviewRating >= star ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--btn-primary-bg)]'}\`}>
               <Star className={\`w-4 h-4 \${reviewRating >= star ? 'fill-current' : ''}\`} />
             </button>
           ))}
         </div>
       </div>
       <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
         <button onClick={() => setReviewingId(null)} className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancel</button>
         <button onClick={() => handleReviewSubmit(sub, 'Need Changes')} disabled={isSubmittingReview} className="px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold hover:bg-amber-500 hover:text-white transition-colors">Request Changes</button>
         <button onClick={() => handleReviewSubmit(sub, 'Reject')} disabled={isSubmittingReview} className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">Reject</button>
         <button onClick={() => handleReviewSubmit(sub, 'Approve')} disabled={isSubmittingReview} className="px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 text-xs font-bold hover:bg-green-500 hover:text-white transition-colors">Approve Module</button>
       </div>
     </div>
   </div>
 )}
 
 {/* Already Reviewed Data */}
 {sub.manager_feedback && sub.status !== 'Pending Review' && reviewingId !== sub.id && (
   <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 relative">
     <h5 className="text-xs font-bold text-green-500 mb-2 uppercase tracking-wider">Manager Feedback</h5>
     <p className="text-sm text-[var(--text-primary)] mb-3">{sub.manager_feedback}</p>
     {sub.rating && (
       <div className="flex items-center gap-1">
         {[1,2,3,4,5].map(star => (
           <Star key={star} className={\`w-3 h-3 \${sub.rating >= star ? 'text-amber-500 fill-current' : 'text-[var(--border)]'}\`} />
         ))}
       </div>
     )}
   </div>
 )}
 </div>`;
code = code.replace(moduleEndString, moduleReviewUI);

// Replace Daily Updates status tag to use dynamic colors
code = code.replace(
  '<span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isReviewed ? \'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]\' : \'bg-amber-500/10 text-amber-500 border border-amber-500/20\'}`}>\n {isReviewed ? \'Reviewed\' : \'Pending Review\'}\n </span>',
  '<span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isReviewed ? \'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--btn-primary-bg)]\' : \'bg-amber-500/10 text-amber-500 border border-amber-500/20\'}`}>\n {isReviewed ? \'Reviewed\' : \'Pending Review\'}\n </span>'
);

// Insert Daily Updates Review UI before the end of the linear-card
const dailyEndString = ` </div>
 )}
 </div>`;

const dailyReviewUI = ` </div>
 )}
 
 {/* Review Section for Daily Updates */}
 {!isReviewed && currentUser.role === 'manager' && reviewingId !== sub.id && (
   <div className="mt-4 flex justify-end border-t border-[var(--border)] pt-4">
     <button onClick={() => { setReviewingId(sub.id); setReviewFeedback(''); }} className="px-3 py-1.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold text-xs border border-[var(--border)] hover:bg-[var(--btn-primary-hover)] transition-colors">
       Acknowledge & Feedback
     </button>
   </div>
 )}
 
 {reviewingId === sub.id && (
   <div className="mt-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border)] relative animate-in fade-in zoom-in-95 duration-200">
     <h5 className="text-sm font-bold text-[var(--text-primary)] mb-3">Manager Feedback</h5>
     <div className="space-y-4">
       <div>
         <textarea className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2 text-sm focus:outline-none h-20 resize-none" value={reviewFeedback} onChange={e => setReviewFeedback(e.target.value)} placeholder="Provide feedback or acknowledge..." />
       </div>
       <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
         <button onClick={() => setReviewingId(null)} className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancel</button>
         <button onClick={() => handleReviewSubmit(sub, 'Reviewed')} disabled={isSubmittingReview} className="px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-xs font-bold hover:bg-[var(--btn-primary-hover)] transition-colors border border-[var(--border)]">Submit Feedback</button>
       </div>
     </div>
   </div>
 )}
 
 {sub.manager_feedback && reviewingId !== sub.id && (
   <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 relative">
     <h5 className="text-[10px] font-bold text-blue-500 mb-1 uppercase tracking-wider">Manager Feedback</h5>
     <p className="text-sm text-[var(--text-primary)]">{sub.manager_feedback}</p>
   </div>
 )}
 </div>`;

code = code.replace(dailyEndString, dailyReviewUI);

fs.writeFileSync('src/pages/ProjectDetail.jsx', code);
console.log('Fixed Manager Approval Logic in ProjectDetail safely');

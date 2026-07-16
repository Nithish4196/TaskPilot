import { useState } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import { FileText, Calendar as CalendarIcon, CheckCircle2, Clock, Target, Loader2, Send } from 'lucide-react';

export default function DailyUpdates({ project }) {
 const { currentUser, dailyUpdates, setDailyUpdates } = useAppContext();
 
 const [taskDesc, setTaskDesc] = useState('');
 const [percentDone, setPercentDone] = useState(100);
 const [hours, setHours] = useState('');
 const [challenges, setChallenges] = useState('');
 const [nextPlan, setNextPlan] = useState('');
 
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [showSuccess, setShowSuccess] = useState(false);

 const handleSubmit = async (e) => {
 e.preventDefault();
 setIsSubmitting(true);
 
 try {
 const today = new Date().toISOString().split('T')[0];
 
 const newUpdate = {
 employee_id: currentUser.id,
 project_id: project.id,
 date: today,
 task_description: taskDesc,
 percentage_completed: parseInt(percentDone) || 0,
 hours_worked: parseFloat(hours) || 0,
 challenges_faced: challenges,
 next_day_plan: nextPlan
 };

 const { data, error } = await supabase
 .from('daily_updates')
 .insert([newUpdate])
 .select()
 .single();

 if (error) throw error;

 if (data) {
 setDailyUpdates(prev => [data, ...prev]);
 setShowSuccess(true);
 // Reset form
 setTaskDesc('');
 setPercentDone(100);
 setHours('');
 setChallenges('');
 setNextPlan('');
 
 setTimeout(() => setShowSuccess(false), 3000);
 }
 } catch (err) {
 console.error('Error submitting daily update:', err);
 alert('Failed to submit daily update.');
 } finally {
 setIsSubmitting(false);
 }
 };

 // Group updates for THIS project
 const projectUpdates = dailyUpdates.filter(u => u.project_id === project.id);
 
 const groupedUpdates = projectUpdates.reduce((acc, update) => {
 const d = new Date(update.date);
 const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
 if (!acc[key]) acc[key] = [];
 acc[key].push(update);
 return acc;
 }, {});

 return (
 <div className="animate-in fade-in duration-150">
 <div className="flex justify-between items-end mb-10">
 <div>
 <h2 className="page-title tracking-tight">Daily Work Updates</h2>
 <p className="text-[var(--text-secondary)] mt-1">Submit your end-of-day report for {project.name}.</p>
 </div>
 </div>

 <div className="flex flex-col lg:flex-row gap-8">
 {/* Submission Form */}
 <div className="w-full lg:w-1/3">
 <div className="linear-card overflow-hidden sticky top-24">
 <div className="p-6 border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] font-medium flex items-center gap-3">
 <FileText className="w-5 h-5" />
 <h2 className="text-xl font-bold">Submit Update</h2>
 </div>
 
 <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[var(--bg-secondary)]">
 {showSuccess && (
 <div className="bg-[var(--btn-primary-bg)] border border-[var(--border)] text-[var(--btn-primary-text)] p-3 text-sm font-bold flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4" /> Update submitted successfully!
 </div>
 )}

 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">What did you work on today?</label>
 <textarea 
 required
 rows={3}
 className="w-full px-4 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm"
 placeholder="Summarize your tasks..."
 value={taskDesc}
 onChange={e => setTaskDesc(e.target.value)}
 />
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">% Completed</label>
 <input 
 type="number" min="0" max="100" required
 className="w-full px-4 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm"
 value={percentDone}
 onChange={e => setPercentDone(e.target.value)}
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Hours Worked</label>
 <input 
 type="number" step="0.5" min="0" required
 className="w-full px-4 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm"
 placeholder="e.g. 8"
 value={hours}
 onChange={e => setHours(e.target.value)}
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Challenges Faced (Optional)</label>
 <textarea 
 rows={2}
 className="w-full px-4 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm"
 placeholder="Any blockers or issues?"
 value={challenges}
 onChange={e => setChallenges(e.target.value)}
 />
 </div>

 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Plan for Tomorrow</label>
 <textarea 
 required
 rows={2}
 className="w-full px-4 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm"
 placeholder="What's next on your agenda?"
 value={nextPlan}
 onChange={e => setNextPlan(e.target.value)}
 />
 </div>

 <button 
 type="submit" 
 disabled={isSubmitting}
 className="btn-primary"
 >
 {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
 Submit Daily Update
 </button>
 </form>
 </div>
 </div>

 {/* History */}
 <div className="w-full lg:w-2/3">
 <div className="linear-card p-8">
 <h2 className="section-title mb-6 flex items-center gap-2">
 <Clock className="w-5 h-5 text-[var(--text-primary)]" /> Update History
 </h2>

 {Object.keys(groupedUpdates).length === 0 ? (
 <div className="text-center py-12">
 <CalendarIcon className="w-12 h-12 text-[var(--text-secondary)] opacity-50 mx-auto mb-6" />
 <p className="text-[var(--text-secondary)]">No daily updates submitted yet.</p>
 </div>
 ) : (
 <div className="space-y-8">
 {Object.entries(groupedUpdates).map(([monthYear, updates]) => (
 <div key={monthYear}>
 <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6 border-b border-[var(--border)] pb-2">
 {monthYear}
 </h3>
 <div className="space-y-6">
 {updates.map(update => (
 <div key={update.id} className="p-5 border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-white hover:border-[var(--border)] hover: transition-all group">
 <div className="flex justify-between items-start mb-3">
 <div className="flex items-center gap-2">
 <div className="w-10 h-10 bg-[var(--bg-secondary)] border border-[var(--border)] flex flex-col items-center justify-center text-[var(--text-primary)] shrink-0">
 <span className="text-xs font-bold leading-none">{new Date(update.date).getDate()}</span>
 <span className="text-[10px] uppercase font-bold leading-none mt-0.5">{new Date(update.date).toLocaleString('default', { month: 'short' })}</span>
 </div>
 <div>
 <p className="font-bold text-[var(--text-primary)]">{new Date(update.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
 <p className="text-xs text-[var(--text-secondary)]">{update.hours_worked} hours • {update.percentage_completed}% Completed</p>
 </div>
 </div>
 <span className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--border)] text-xs font-bold px-2.5 py-1 flex items-center gap-1">
 <CheckCircle2 className="w-3 h-3" /> Submitted
 </span>
 </div>
 
 <div className="pl-12 space-y-3">
 <div>
 <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Work Done</p>
 <p className="text-sm text-[var(--text-primary)] mt-0.5">{update.task_description}</p>
 </div>
 
 {update.challenges_faced && (
 <div>
 <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Challenges</p>
 <p className="text-sm text-[var(--text-primary)] mt-0.5">{update.challenges_faced}</p>
 </div>
 )}
 
 <div>
 <p className="text-xs font-bold text-[var(--text-secondary)] uppercase flex items-center gap-1"><Target className="w-3 h-3"/> Next Plan</p>
 <p className="text-sm text-[var(--text-primary)] mt-0.5">{update.next_day_plan}</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}










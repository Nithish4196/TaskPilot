import { useState } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import { FileText, Calendar as CalendarIcon, CheckCircle2, Clock, Target, Loader2, Send } from 'lucide-react';

export default function DailyUpdates() {
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

  // Group updates by month/year for display (simple approach)
  const groupedUpdates = dailyUpdates.reduce((acc, update) => {
    const d = new Date(update.date);
    const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(update);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Daily Work Updates</h1>
          <p className="text-slate-500 mt-2">Submit your end-of-day report and view your previous updates.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Submission Form */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
            <div className="p-6 border-b border-slate-100 bg-brand-600 text-white flex items-center gap-3">
              <FileText className="w-5 h-5 text-brand-200" />
              <h2 className="text-xl font-bold">Submit Update</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-slate-50">
              {showSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Update submitted successfully!
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">What did you work on today?</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="Summarize your tasks..."
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">% Completed</label>
                  <input 
                    type="number" min="0" max="100" required
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm"
                    value={percentDone}
                    onChange={e => setPercentDone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Hours Worked</label>
                  <input 
                    type="number" step="0.5" min="0" required
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm"
                    placeholder="e.g. 8"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Challenges Faced (Optional)</label>
                <textarea 
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm"
                  placeholder="Any blockers or issues?"
                  value={challenges}
                  onChange={e => setChallenges(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Plan for Tomorrow</label>
                <textarea 
                  required
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm"
                  placeholder="What's next on your agenda?"
                  value={nextPlan}
                  onChange={e => setNextPlan(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-sm disabled:bg-brand-400 flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Submit Daily Update
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" /> Update History
            </h2>

            {Object.keys(groupedUpdates).length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No daily updates submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedUpdates).map(([monthYear, updates]) => (
                  <div key={monthYear}>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                      {monthYear}
                    </h3>
                    <div className="space-y-4">
                      {updates.map(update => (
                        <div key={update.id} className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-brand-100 rounded-lg flex flex-col items-center justify-center text-brand-700 shrink-0">
                                <span className="text-xs font-bold leading-none">{new Date(update.date).getDate()}</span>
                                <span className="text-[10px] uppercase font-bold leading-none mt-0.5">{new Date(update.date).toLocaleString('default', { month: 'short' })}</span>
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{new Date(update.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                <p className="text-xs text-slate-500">{update.hours_worked} hours • {update.percentage_completed}% Completed</p>
                              </div>
                            </div>
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Submitted
                            </span>
                          </div>
                          
                          <div className="pl-12 space-y-3">
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase">Work Done</p>
                              <p className="text-sm text-slate-700 mt-0.5">{update.task_description}</p>
                            </div>
                            
                            {update.challenges_faced && (
                              <div>
                                <p className="text-xs font-bold text-red-400 uppercase">Challenges</p>
                                <p className="text-sm text-slate-700 mt-0.5">{update.challenges_faced}</p>
                              </div>
                            )}
                            
                            <div>
                              <p className="text-xs font-bold text-brand-500 uppercase flex items-center gap-1"><Target className="w-3 h-3"/> Next Plan</p>
                              <p className="text-sm text-slate-700 mt-0.5">{update.next_day_plan}</p>
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

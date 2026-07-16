import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { MessageSquare, Star, Calendar, User, Briefcase, Activity, Target } from 'lucide-react';

export default function EmployeeFeedback() {
 const { currentUser, dailyFeedback, projectRatings, projects, employees } = useAppContext();
 const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'project'

 // Filter feedback for this employee
 const myDailyFeedback = dailyFeedback.filter(f => f.to_employee_id === currentUser?.id && f.feedback_type === 'TL_to_Emp');
 const myProjectRatings = projectRatings.filter(r => r.to_employee_id === currentUser?.id && r.rating_type === 'TL_to_Emp');

 const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unknown Project';
 const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || 'Unknown Manager';

 return (
 <div className="max-w-6xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="flex justify-between items-end mb-10">
 <div>
 <h1 className="page-title">My Feedback</h1>
 <p className="text-[var(--text-secondary)] mt-2">View your daily performance feedback and final project ratings.</p>
 </div>
 </div>

 <div className="flex gap-2 p-1 bg-[var(--surface-hover)]/50 mb-6 max-w-md">
 <button
 onClick={() => setActiveTab('daily')}
 className={`flex-1 py-2 text-sm font-bold transition-all ${
 activeTab === 'daily' ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] ' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]/50'
 }`}
 >
 Daily Feedback ({myDailyFeedback.length})
 </button>
 <button
 onClick={() => setActiveTab('project')}
 className={`flex-1 py-2 text-sm font-bold transition-all ${
 activeTab === 'project' ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] ' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]/50'
 }`}
 >
 Project Ratings ({myProjectRatings.length})
 </button>
 </div>

 {activeTab === 'daily' ? (
 <div className="space-y-6">
 {myDailyFeedback.length === 0 ? (
 <div className="bg-white p-12 border border-[var(--border)] text-center">
 <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-6" />
 <h3 className="card-title">No Daily Feedback</h3>
 <p className="text-[var(--text-secondary)] mt-2">You haven't received any daily feedback from your Team Leader yet.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {myDailyFeedback.map(fb => (
 <div key={fb.id} className="bg-white p-6 border border-[var(--border)] hover: transition-all">
 <div className="flex justify-between items-start mb-6">
 <div>
 <p className="font-bold text-[var(--text-primary)]">{getProjectName(fb.project_id)}</p>
 <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1 mt-1">
 <Calendar className="w-4 h-4" /> {new Date(fb.feedback_date).toLocaleDateString()}
 </p>
 </div>
 <div className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1 rounded-full text-xs font-bold text-[var(--text-secondary)] border border-[var(--border)]">
 <User className="w-3.5 h-3.5" /> TL: {getEmployeeName(fb.from_id)}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6 mb-6">
 <div className="bg-emerald-50 p-3 border border-emerald-100">
 <p className="text-xs font-bold text-emerald-600 uppercase">Productivity</p>
 <div className="flex items-center gap-1 mt-1">
 <span className="text-lg font-black text-emerald-700">{fb.productivity_rating}</span><span className="text-emerald-400 text-sm">/5</span>
 </div>
 </div>
 <div className="bg-blue-50 p-3 border border-blue-100">
 <p className="text-xs font-bold text-blue-600 uppercase">Quality</p>
 <div className="flex items-center gap-1 mt-1">
 <span className="text-lg font-black text-blue-700">{fb.quality_rating}</span><span className="text-blue-400 text-sm">/5</span>
 </div>
 </div>
 </div>

 {fb.comments && (
 <div className="mt-4">
 <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Team Leader Comments</p>
 <p className="text-sm text-[var(--text-primary)] italic bg-[var(--bg-secondary)] p-3">"{fb.comments}"</p>
 </div>
 )}

 {fb.improvement_suggestions && (
 <div className="mt-4">
 <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Improvement Suggestions</p>
 <p className="text-sm text-[var(--text-primary)]">{fb.improvement_suggestions}</p>
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 ) : (
 <div className="space-y-6">
 {myProjectRatings.length === 0 ? (
 <div className="bg-white p-12 border border-[var(--border)] text-center">
 <Star className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-6" />
 <h3 className="card-title">No Project Ratings</h3>
 <p className="text-[var(--text-secondary)] mt-2">You haven't been rated for any completed projects yet.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-6">
 {myProjectRatings.map(rating => (
 <div key={rating.id} className="bg-white p-6 border border-[var(--border)] flex flex-col md:flex-row gap-6">
 
 <div className="md:w-1/3 border-r border-[var(--border)] pr-6 flex flex-col justify-center">
 <div className="mb-6">
 <p className="font-extrabold text-xl text-[var(--text-primary)]">{getProjectName(rating.project_id)}</p>
 <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1 mt-1">
 <Calendar className="w-4 h-4" /> {new Date(rating.created_at).toLocaleDateString()}
 </p>
 </div>
 
 <div className="bg-[var(--bg-secondary)] p-6 border border-[var(--border)] text-center mb-6">
 <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Overall Score</p>
 <div className="flex items-center justify-center gap-1">
 <span className="text-4xl font-black text-[var(--text-primary)]">{rating.overall_score}</span>
 <span className="text-[var(--text-secondary)] text-lg font-bold">/5</span>
 </div>
 <div className="flex justify-center mt-2 text-[var(--text-primary)]">
 {[1,2,3,4,5].map(star => (
 <Star key={star} className={`w-5 h-5 ${star <= rating.overall_score ? 'fill-current text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`} />
 ))}
 </div>
 </div>

 <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
 <User className="w-4 h-4 text-[var(--text-secondary)]" /> Rated by TL: <span className="font-bold text-[var(--text-primary)]">{getEmployeeName(rating.from_id)}</span>
 </div>
 </div>

 <div className="md:w-2/3">
 <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-6 border-b border-[var(--border)] pb-2">Detailed Evaluation</h4>
 
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-6">
 {rating.criteria && Object.entries(rating.criteria).map(([key, val]) => (
 <div key={key} className="bg-[var(--bg-secondary)] p-3">
 <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">{key}</p>
 <div className="flex items-center gap-1 mt-1">
 <span className="text-lg font-black text-[var(--text-primary)]">{val}</span><span className="text-[var(--text-secondary)] text-xs">/5</span>
 </div>
 </div>
 ))}
 </div>

 {rating.comments && (
 <div>
 <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Final Comments</h4>
 <p className="text-[var(--text-primary)] bg-[var(--bg-secondary)] p-6 italic">"{rating.comments}"</p>
 </div>
 )}
 </div>

 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 );
}









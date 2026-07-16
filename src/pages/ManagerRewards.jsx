import { useState } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import { Gift, Calendar, Users, Target, CheckCircle2, AlertCircle, Plus, Settings, Crown, Upload, Search, X } from 'lucide-react';

export default function ManagerRewards() {
 const { teamRewards, rewardSettings, fetchGlobalData, employees, tasks, projects, projectTeams, rewardSubmissions } = useAppContext();
 
 const [activeTab, setActiveTab] = useState('active'); // active, premium, settings
 const [isCreating, setIsCreating] = useState(false);
 const [loading, setLoading] = useState(false);
 const [selectedRewardId, setSelectedRewardId] = useState(null);
 
 const [formData, setFormData] = useState({
 reward_type: 'Weekly',
 project_id: '',
 team_name: '',
 week_number: '',
 title: '',
 description: '',
 category: 'Activity',
 reward_date: '',
 deadline: '',
 start_date: '',
 end_date: '',
 image_file: null,
 rules: []
 });

 const activeProjects = projects.filter(p => p.status === 'Active');
 
 const uniqueTeams = formData.project_id 
 ? projectTeams.filter(t => t.project_id === formData.project_id).map(t => t.team_name)
 : [];

 const handleCreate = async (e) => {
 e.preventDefault();
 setLoading(true);
 try {
 let imageUrl = null;
 if (formData.image_file) {
 const fileExt = formData.image_file.name.split('.').pop();
 const fileName = `${Math.random()}.${fileExt}`;
 const { data: uploadData, error: uploadError } = await supabase.storage
 .from('reward_images')
 .upload(fileName, formData.image_file);
 
 if (uploadError) throw uploadError;
 
 const { data: publicUrlData } = supabase.storage.from('reward_images').getPublicUrl(fileName);
 imageUrl = publicUrlData.publicUrl;
 }

 const { error } = await supabase.from('team_rewards').insert([{
 reward_type: formData.reward_type,
 project_id: formData.project_id || null,
 team_name: formData.team_name,
 week_number: formData.week_number ? parseInt(formData.week_number) : null,
 title: formData.title,
 description: formData.description,
 category: formData.category,
 image_url: imageUrl,
 start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
 end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
 reward_date: formData.reward_date ? new Date(formData.reward_date).toISOString() : null,
 claim_deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
 rules: formData.rules,
 status: 'Locked'
 }]);
 
 if (error) throw error;
 
 setIsCreating(false);
 fetchGlobalData();
 } catch (err) {
 console.error('Error creating reward:', err);
 alert('Error creating reward. Check console.');
 } finally {
 setLoading(false);
 }
 };

 const handleUpdateSettings = async (val) => {
 try {
 await supabase.from('reward_settings').update({ allow_multiple_claims: val }).eq('id', 1);
 fetchGlobalData();
 } catch (e) {
 console.error(e);
 }
 };

 const handleDelete = async (id) => {
 if(!window.confirm('Are you sure you want to delete this reward?')) return;
 await supabase.from('team_rewards').delete().eq('id', id);
 fetchGlobalData();
 };

 const getTeamProgress = (teamName, projectId) => {
 const teamMembers = employees.filter(e => e.team === teamName);
 if (teamMembers.length === 0) return { completed: [], pending: [], percentage: 0 };
 
 const memberIds = teamMembers.map(m => m.id);
 let teamTasks = tasks.filter(t => memberIds.includes(t.employee_id));
 if (projectId) {
 teamTasks = teamTasks.filter(t => t.project_id === projectId);
 }
 
 let completedMembers = [];
 let pendingMembers = [];

 teamMembers.forEach(emp => {
 const empTasks = teamTasks.filter(t => t.employee_id === emp.id);
 if (empTasks.length === 0) {
 pendingMembers.push({ ...emp, remainingTasks: 0, status: 'No Tasks' });
 return;
 }
 
 const isCompleted = empTasks.every(t => t.status === 'Completed' && t.approval_status === 'Approved');
 if (isCompleted) {
 completedMembers.push({ ...emp, taskCount: empTasks.length });
 } else {
 const remaining = empTasks.filter(t => t.status !== 'Completed' || t.approval_status !== 'Approved');
 pendingMembers.push({ ...emp, remainingTasks: remaining.length, status: remaining[0]?.status || 'Pending' });
 }
 });

 const percentage = teamMembers.length === 0 ? 0 : Math.round((completedMembers.length / teamMembers.length) * 100);
 
 return {
 completed: completedMembers,
 pending: pendingMembers,
 percentage,
 totalMembers: teamMembers.length
 };
 };

 return (
 <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="flex justify-between items-end mb-6">
 <div>
 <h1 className="page-title">Reward Management</h1>
 <p className="text-[var(--text-secondary)] mt-2">Manage weekly and premium rewards for your teams.</p>
 </div>
 <button 
 onClick={() => {
 setIsCreating(!isCreating);
 setFormData({...formData, reward_type: activeTab === 'premium' ? 'Premium' : 'Weekly'});
 }}
 className="flex items-center gap-2 px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-medium border border-[var(--border)] hover:bg-[var(--btn-primary-hover)] font-bold hover:bg-[var(--btn-primary-hover)] transition-colors text-sm"
 >
 {isCreating ? 'Cancel' : <><Plus className="w-4 h-4" /> Create Reward</>}
 </button>
 </div>

 <div className="flex gap-6 border-b border-[var(--border)] mb-10">
 <button 
 onClick={() => {setActiveTab('active'); setIsCreating(false);}}
 className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'active' ? 'border-[var(--border)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
 >
 <Gift className="w-4 h-4 inline-block mr-2" /> Weekly Rewards
 </button>
 <button 
 onClick={() => {setActiveTab('premium'); setIsCreating(false);}}
 className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'premium' ? 'border-amber-500 text-amber-600' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
 >
 <Crown className="w-4 h-4 inline-block mr-2" /> Premium Rewards
 </button>
 <button 
 onClick={() => {setActiveTab('reviews'); setIsCreating(false);}}
 className={`pb-3 text-sm font-bold border-b-2 transition-colors relative ${activeTab === 'reviews' ? 'border-[var(--border)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
 >
 <CheckCircle2 className="w-4 h-4 inline-block mr-2" /> Reward Reviews
 {rewardSubmissions?.filter(s => s.status === 'Submitted for Review').length > 0 && (
 <span className="absolute -top-2 -right-3 badge-rejected text-[10px] font-bold px-1.5 py-0.5 rounded-full">
 {rewardSubmissions.filter(s => s.status === 'Submitted for Review').length}
 </span>
 )}
 </button>
 <button 
 onClick={() => {setActiveTab('settings'); setIsCreating(false);}}
 className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-[var(--border)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
 >
 <Settings className="w-4 h-4 inline-block mr-2" /> Settings
 </button>
 </div>

 {activeTab === 'settings' && (
 <div className="bg-white p-6 border border-[var(--border)] max-w-2xl">
 <h2 className="card-title mb-6 flex items-center gap-2">
 <Settings className="w-5 h-5 text-[var(--text-secondary)]" /> Global Reward Settings
 </h2>
 <div className="flex items-center justify-between p-6 bg-[var(--bg-secondary)] border border-[var(--border)]">
 <div>
 <h3 className="font-bold text-[var(--text-primary)]">Allow Multiple Claims</h3>
 <p className="text-sm text-[var(--text-secondary)]">If enabled, employees can claim all rewards they qualify for. If disabled, they must choose only one.</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input 
 type="checkbox" 
 className="sr-only peer" 
 checked={rewardSettings?.allow_multiple_claims || false}
 onChange={(e) => handleUpdateSettings(e.target.checked)}
 />
 <div className="w-11 h-6 bg-[var(--surface-hover)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--border)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--btn-primary-bg)]"></div>
 </label>
 </div>
 </div>
 )}

 {activeTab === 'reviews' && (
 <div className="space-y-6">
 {(!rewardSubmissions || rewardSubmissions.length === 0) ? (
 <div className="bg-white border border-[var(--border)] p-12 text-center">
 <CheckCircle2 className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-6" />
 <h3 className="page-title mb-2">No Submissions</h3>
 <p className="text-[var(--text-secondary)]">There are no reward submissions awaiting review.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-6">
 {rewardSubmissions.map(sub => {
 const emp = employees.find(e => e.id === sub.employee_id);
 const proj = projects.find(p => p.id === sub.project_id);
 const reward = teamRewards.find(r => r.id === sub.reward_id);
 
 return (
 <div key={sub.id} className="bg-white p-6 border border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-6">
 <div className="flex items-center gap-6">
 <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center font-bold">
 {emp?.name?.charAt(0) || '?'}
 </div>
 <div>
 <h3 className="font-bold text-[var(--text-primary)] text-lg">{emp?.name || 'Unknown Employee'}</h3>
 <p className="text-sm text-[var(--text-secondary)]">
 <span className="font-bold text-[var(--text-primary)]">{proj?.name || 'Unknown Project'}</span> &bull; {sub.team_name}
 </p>
 </div>
 </div>
 
 <div className="flex-1 px-6 border-x border-[var(--border)]">
 <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Target Reward</p>
 <h4 className="font-bold text-[var(--text-primary)]">{reward?.title || 'Unknown Reward'}</h4>
 <p className="text-xs text-[var(--text-secondary)]">Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
 </div>
 
 <div>
 {sub.status === 'Submitted for Review' ? (
 <div className="flex gap-2">
 <button onClick={async () => {
 await supabase.from('reward_submissions').update({ status: 'Approved', reviewed_at: new Date().toISOString() }).eq('id', sub.id);
 fetchGlobalData();
 }} className="px-4 py-2 badge-completed font-bold hover:bg-emerald-600">Approve</button>
 <button onClick={async () => {
 const reason = window.prompt("Rejection reason:");
 if(reason !== null) {
 await supabase.from('reward_submissions').update({ status: 'Rejected', manager_comments: reason, reviewed_at: new Date().toISOString() }).eq('id', sub.id);
 fetchGlobalData();
 }
 }} className="px-4 py-2 bg-red-100 text-red-600 font-bold hover:bg-red-200">Reject</button>
 </div>
 ) : (
 <span className={`px-4 py-2 font-bold text-sm ${sub.status === 'Approved' ? 'badge-completed' : 'bg-red-100 text-red-700'}`}>
 {sub.status}
 </span>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {isCreating && activeTab !== 'settings' && activeTab !== 'reviews' && (
 <div className="bg-white p-8 border border-[var(--border)] mb-10 animate-in slide-in-from-top-6">
 <h2 className="section-title mb-6">Create {formData.reward_type} Reward</h2>
 <form onSubmit={handleCreate} className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 
 <div className="bg-[var(--bg-secondary)] p-6 border border-[var(--border)] space-y-6 md:col-span-2">
 <h3 className="text-sm font-bold text-[var(--text-primary)] border-b pb-2">Target Audience</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Active Project (Required)</label>
 <select required className="w-full px-3 py-2 border" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
 <option value="">Select an Active Project...</option>
 {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Target Team</label>
 <select required className="w-full px-3 py-2 border disabled:opacity-50" disabled={!formData.project_id} value={formData.team_name} onChange={e => setFormData({...formData, team_name: e.target.value})}>
 <option value="">Select Team...</option>
 {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
 </select>
 </div>
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Reward Title</label>
 <input type="text" required placeholder="e.g. Trip to Goa" className="w-full px-3 py-2 border" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
 </div>
 
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Category</label>
 <select className="w-full px-3 py-2 border" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
 <option>Activity</option>
 <option>Food & Dining</option>
 <option>Gift</option>
 <option>Trip</option>
 <option>Bonus</option>
 </select>
 </div>

 <div className="md:col-span-2">
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Description</label>
 <textarea className="w-full px-3 py-2 border h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
 </div>

 {formData.reward_type === 'Premium' && (
 <div className="md:col-span-2 bg-amber-50 border border-amber-200 p-6">
 <h3 className="text-sm font-bold text-amber-900 mb-6">Premium Settings</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-bold text-amber-900 mb-1">Custom Image (JPG/PNG)</label>
 <input type="file" accept="image/*" className="w-full text-sm" onChange={e => setFormData({...formData, image_file: e.target.files[0]})} />
 </div>
 <div>
 <label className="block text-sm font-bold text-amber-900 mb-1">Custom Rule</label>
 <select className="w-full px-3 py-2 border bg-white" onChange={e => setFormData({...formData, rules: [...formData.rules, e.target.value]})}>
 <option value="">Add a rule...</option>
 <option value="Top Performer">Top Performer</option>
 <option value="No Overdue Tasks">No Overdue Tasks</option>
 <option value="Manager Approval Required">Manager Approval Required</option>
 </select>
 {formData.rules.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-2">
 {formData.rules.map((r, i) => (
 <span key={i} className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded flex items-center gap-1">
 {r} <button type="button" onClick={() => setFormData({...formData, rules: formData.rules.filter((_, idx) => idx !== i)})}><X className="w-3 h-3"/></button>
 </span>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Reward Start Date</label>
 <input type="date" required className="w-full px-3 py-2 border" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
 </div>
 
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Claim Deadline</label>
 <input type="datetime-local" required className="w-full px-3 py-2 border" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
 </div>
 </div>
 
 <div className="flex justify-end pt-4 border-t">
 <button disabled={loading} type="submit" className="btn-primary">
 {loading ? 'Creating...' : 'Create Reward'}
 </button>
 </div>
 </form>
 </div>
 )}

 {/* List Rewards */}
 {activeTab !== 'settings' && activeTab !== 'reviews' && (
 <div className="space-y-8">
 {teamRewards.filter(r => (activeTab === 'premium' ? r.reward_type === 'Premium' : r.reward_type !== 'Premium')).map(reward => {
 const progress = getTeamProgress(reward.team_name, reward.project_id);
 const isUnlocked = reward.status === 'Unlocked';
 const projName = projects.find(p => p.id === reward.project_id)?.name || 'General';
 
 return (
 <div key={reward.id} className="bg-white border border-[var(--border)] overflow-hidden flex flex-col">
 {/* Header */}
 <div className={`p-6 flex justify-between items-start ${isUnlocked ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'bg-[var(--bg-secondary)] border-b border-[var(--border)]'}`}>
 <div className="flex gap-6">
 {reward.image_url ? (
 <img src={reward.image_url} alt="Reward" className="w-20 h-20 object-cover bg-white p-1" />
 ) : (
 <div className={`w-20 h-20 flex items-center justify-center ${isUnlocked ? 'bg-white/20 text-[var(--text-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}>
 {reward.reward_type === 'Premium' ? <Crown className="w-8 h-8" /> : <Gift className="w-8 h-8" />}
 </div>
 )}
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isUnlocked ? 'bg-white/20 text-[var(--text-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}>{projName}</span>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isUnlocked ? 'bg-emerald-400 text-white' : 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'}`}>{reward.status}</span>
 </div>
 <h3 className={`text-2xl font-extrabold ${isUnlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{reward.title}</h3>
 <p className={`text-sm max-w-xl mt-1 ${isUnlocked ? 'text-emerald-50' : 'text-[var(--text-secondary)]'}`}>{reward.description}</p>
 </div>
 </div>
 <button onClick={() => handleDelete(reward.id)} className={`text-sm font-bold ${isUnlocked ? 'text-white hover:text-emerald-200' : 'text-red-500 hover:text-red-700'}`}>Delete</button>
 </div>

 {/* Progress Grid */}
 <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Progress Summary */}
 <div className="col-span-1 lg:col-span-3 mb-2">
 <h4 className="font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-[var(--text-primary)]" /> Overall Progress</h4>
 <div className="flex items-end justify-between mb-2">
 <div className="text-3xl font-extrabold text-[var(--text-primary)]">{progress.completed.length} <span className="text-[var(--text-secondary)] text-xl">/ {progress.totalMembers}</span> <span className="text-sm font-bold text-[var(--text-secondary)] ml-2">Members Completed</span></div>
 <div className="section-title">{progress.percentage}%</div>
 </div>
 <div className="w-full h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
 <div className={`h-full transition-all duration-1000 ${isUnlocked ? 'bg-emerald-500' : 'bg-[var(--bg-secondary)]0'}`} style={{ width: `${progress.percentage}%` }}></div>
 </div>
 </div>

 {/* Completed Members */}
 <div className="col-span-1 lg:col-span-1 border border-emerald-100 bg-emerald-50/30 p-6">
 <h4 className="font-bold text-emerald-900 mb-6 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed Members</h4>
 {progress.completed.length === 0 ? <p className="text-sm text-[var(--text-secondary)] italic">No members have completed yet.</p> : (
 <div className="space-y-3">
 {progress.completed.map(m => (
 <div key={m.id} className="flex items-center gap-3 bg-white p-2 border border-emerald-100">
 <div className="w-8 h-8 rounded-full badge-completed flex items-center justify-center font-bold text-xs">{m.name.charAt(0)}</div>
 <div>
 <p className="text-sm font-bold text-[var(--text-primary)]">{m.name}</p>
 <p className="text-[10px] text-emerald-600 font-bold uppercase">{m.taskCount} Tasks Approved</p>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Pending Members */}
 <div className="col-span-1 lg:col-span-2 border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
 <h4 className="font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2"><Users className="w-4 h-4 text-[var(--text-secondary)]" /> Pending Members</h4>
 {progress.pending.length === 0 ? <p className="text-sm text-[var(--text-secondary)] italic">Everyone has completed their tasks!</p> : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {progress.pending.map(m => (
 <div key={m.id} className="flex items-center gap-3 bg-white p-3 border border-[var(--border)]">
 <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)] flex items-center justify-center font-bold text-xs">{m.name.charAt(0)}</div>
 <div className="flex-1">
 <p className="text-sm font-bold text-[var(--text-primary)]">{m.name}</p>
 <div className="flex justify-between items-center mt-1">
 <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">{m.remainingTasks} Tasks Left</span>
 <span className="text-[10px] text-[var(--text-secondary)]">{m.status}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
}









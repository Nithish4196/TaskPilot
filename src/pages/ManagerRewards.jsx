import { useState } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import { Gift, Calendar, Users, Target, CheckCircle2, AlertCircle, Plus, Settings, Crown, Upload, Search, X } from 'lucide-react';

export default function ManagerRewards() {
  const { teamRewards, rewardSettings, fetchGlobalData, employees, tasks, projects } = useAppContext();
  
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
  
  // Get unique teams mapped to the selected project
  // In a real app, projects have assigned teams. Here we infer from employees assigned to tasks in the project,
  // or we just show all teams that have employees.
  const uniqueTeams = [...new Set(employees.filter(e => e.team).map(e => e.team))];

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
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reward Management</h1>
          <p className="text-slate-500 mt-2">Manage weekly and premium rewards for your teams.</p>
        </div>
        <button 
          onClick={() => {
            setIsCreating(!isCreating);
            setFormData({...formData, reward_type: activeTab === 'premium' ? 'Premium' : 'Weekly'});
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors shadow-sm text-sm"
        >
          {isCreating ? 'Cancel' : <><Plus className="w-4 h-4" /> Create Reward</>}
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200 mb-8">
        <button 
          onClick={() => {setActiveTab('active'); setIsCreating(false);}}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'active' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Gift className="w-4 h-4 inline-block mr-2" /> Weekly Rewards
        </button>
        <button 
          onClick={() => {setActiveTab('premium'); setIsCreating(false);}}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'premium' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Crown className="w-4 h-4 inline-block mr-2" /> Premium Rewards
        </button>
        <button 
          onClick={() => {setActiveTab('settings'); setIsCreating(false);}}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Settings className="w-4 h-4 inline-block mr-2" /> Settings
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" /> Global Reward Settings
          </h2>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900">Allow Multiple Claims</h3>
              <p className="text-sm text-slate-500">If enabled, employees can claim all rewards they qualify for. If disabled, they must choose only one.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={rewardSettings?.allow_multiple_claims || false}
                onChange={(e) => handleUpdateSettings(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>
      )}

      {isCreating && activeTab !== 'settings' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-8 animate-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Create {formData.reward_type} Reward</h2>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 md:col-span-2">
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Target Audience</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Active Project (Required)</label>
                    <select required className="w-full px-3 py-2 border rounded-lg" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                      <option value="">Select an Active Project...</option>
                      {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Target Team</label>
                    <select required className="w-full px-3 py-2 border rounded-lg disabled:opacity-50" disabled={!formData.project_id} value={formData.team_name} onChange={e => setFormData({...formData, team_name: e.target.value})}>
                      <option value="">Select Team...</option>
                      {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Reward Title</label>
                <input type="text" required placeholder="e.g. Trip to Goa" className="w-full px-3 py-2 border rounded-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                <select className="w-full px-3 py-2 border rounded-lg" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option>Activity</option>
                  <option>Food & Dining</option>
                  <option>Gift</option>
                  <option>Trip</option>
                  <option>Bonus</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border rounded-lg h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              {formData.reward_type === 'Premium' && (
                <div className="md:col-span-2 bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-amber-900 mb-4">Premium Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-amber-900 mb-1">Custom Image (JPG/PNG)</label>
                      <input type="file" accept="image/*" className="w-full text-sm" onChange={e => setFormData({...formData, image_file: e.target.files[0]})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-amber-900 mb-1">Custom Rule</label>
                      <select className="w-full px-3 py-2 border rounded-lg bg-white" onChange={e => setFormData({...formData, rules: [...formData.rules, e.target.value]})}>
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
                <label className="block text-sm font-bold text-slate-700 mb-1">Reward Start Date</label>
                <input type="date" required className="w-full px-3 py-2 border rounded-lg" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Claim Deadline</label>
                <input type="datetime-local" required className="w-full px-3 py-2 border rounded-lg" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <button disabled={loading} type="submit" className="px-8 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Reward'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Rewards */}
      {activeTab !== 'settings' && (
        <div className="space-y-8">
          {teamRewards.filter(r => (activeTab === 'premium' ? r.reward_type === 'Premium' : r.reward_type !== 'Premium')).map(reward => {
            const progress = getTeamProgress(reward.team_name, reward.project_id);
            const isUnlocked = reward.status === 'Unlocked';
            const projName = projects.find(p => p.id === reward.project_id)?.name || 'General';
            
            return (
              <div key={reward.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Header */}
                <div className={`p-6 flex justify-between items-start ${isUnlocked ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'bg-slate-50 border-b border-slate-100'}`}>
                  <div className="flex gap-4">
                    {reward.image_url ? (
                      <img src={reward.image_url} alt="Reward" className="w-20 h-20 rounded-xl object-cover shadow-md bg-white p-1" />
                    ) : (
                      <div className={`w-20 h-20 rounded-xl flex items-center justify-center shadow-md ${isUnlocked ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-600'}`}>
                        {reward.reward_type === 'Premium' ? <Crown className="w-8 h-8" /> : <Gift className="w-8 h-8" />}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isUnlocked ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'}`}>{projName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isUnlocked ? 'bg-emerald-400 text-white' : 'bg-slate-200 text-slate-600'}`}>{reward.status}</span>
                      </div>
                      <h3 className={`text-2xl font-extrabold ${isUnlocked ? 'text-white' : 'text-slate-900'}`}>{reward.title}</h3>
                      <p className={`text-sm max-w-xl mt-1 ${isUnlocked ? 'text-emerald-50' : 'text-slate-500'}`}>{reward.description}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(reward.id)} className={`text-sm font-bold ${isUnlocked ? 'text-white hover:text-emerald-200' : 'text-red-500 hover:text-red-700'}`}>Delete</button>
                </div>

                {/* Progress Grid */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Progress Summary */}
                  <div className="col-span-1 lg:col-span-3 mb-2">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-brand-600" /> Overall Progress</h4>
                    <div className="flex items-end justify-between mb-2">
                      <div className="text-3xl font-extrabold text-slate-900">{progress.completed.length} <span className="text-slate-400 text-xl">/ {progress.totalMembers}</span> <span className="text-sm font-bold text-slate-500 ml-2">Members Completed</span></div>
                      <div className="text-xl font-bold text-brand-600">{progress.percentage}%</div>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${isUnlocked ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${progress.percentage}%` }}></div>
                    </div>
                  </div>

                  {/* Completed Members */}
                  <div className="col-span-1 lg:col-span-1 border border-emerald-100 bg-emerald-50/30 rounded-xl p-4">
                    <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed Members</h4>
                    {progress.completed.length === 0 ? <p className="text-sm text-slate-500 italic">No members have completed yet.</p> : (
                      <div className="space-y-3">
                        {progress.completed.map(m => (
                          <div key={m.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-emerald-100 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">{m.name.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{m.name}</p>
                              <p className="text-[10px] text-emerald-600 font-bold uppercase">{m.taskCount} Tasks Approved</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pending Members */}
                  <div className="col-span-1 lg:col-span-2 border border-slate-200 bg-slate-50 rounded-xl p-4">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" /> Pending Members</h4>
                    {progress.pending.length === 0 ? <p className="text-sm text-slate-500 italic">Everyone has completed their tasks!</p> : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {progress.pending.map(m => (
                          <div key={m.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">{m.name.charAt(0)}</div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-900">{m.name}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">{m.remainingTasks} Tasks Left</span>
                                <span className="text-[10px] text-slate-500">{m.status}</span>
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

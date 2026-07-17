import React, { useState, useMemo } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import { 
  Gift, Users, Target, CheckCircle2, AlertCircle, Plus, 
  Crown, Upload, Search, X, BarChart3, Clock, Lock, Unlock,
  Archive, FileText, CheckSquare, Settings
} from 'lucide-react';

export default function ManagerRewards() {
  const { 
    enterpriseRewards = [], 
    enterpriseRewardClaims = [], 
    enterpriseRewardAuditLog = [], 
    employees = [], 
    projects = [], 
    projectTeams = [], 
    tasks = [],
    projectModules = [],
    currentUser,
    fetchGlobalData
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, list, approvals, audit
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward_type: 'Weekly',
    reward_value: '',
    project_id: '',
    team_id: '',
    priority: 'Medium',
    expiry_date: '',
    rules: '',
    image_file: null,
    image_url: ''
  });

  // Analytics
  const stats = useMemo(() => {
    return {
      total: enterpriseRewards.length,
      locked: enterpriseRewards.filter(r => r.status === 'Locked').length,
      unlocked: enterpriseRewards.filter(r => r.status === 'Unlocked' || r.status === 'Ready for Unlock').length,
      claimed: enterpriseRewards.filter(r => r.status === 'Claimed').length,
      completed: enterpriseRewards.filter(r => r.status === 'Completed').length,
    };
  }, [enterpriseRewards]);

  // Image Upload Logic
  const handleImageUpload = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('reward-images')
      .upload(filePath, file);

    if (uploadError) {
      alert('Error uploading image: ' + uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from('reward-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleCreateReward = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let imageUrl = formData.image_url;
    if (formData.image_file) {
      const uploadedUrl = await handleImageUpload(formData.image_file);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    const newReward = {
      title: formData.title,
      description: formData.description,
      reward_type: formData.reward_type,
      reward_value: formData.reward_value,
      project_id: formData.project_id,
      team_id: formData.team_id,
      priority: formData.priority,
      expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null,
      rules: formData.rules ? formData.rules.split(',').map(r => r.trim()) : [],
      image_url: imageUrl,
      status: 'Draft'
    };

    const { data: insertedReward, error } = await supabase
      .from('enterprise_rewards')
      .insert([newReward])
      .select();

    if (error) {
      alert('Error creating reward: ' + error.message);
    } else if (insertedReward && insertedReward[0]) {
      // Create Audit Log
      await supabase.from('enterprise_reward_audit_log').insert([{
        reward_id: insertedReward[0].id,
        action_type: 'Created',
        action_by: currentUser?.id,
        action_by_role: 'Manager',
        details: { status: 'Draft', type: formData.reward_type }
      }]);
      setIsCreating(false);
      fetchGlobalData();
    }
    setLoading(false);
  };

  const updateRewardStatus = async (id, newStatus) => {
    setLoading(true);
    const { error } = await supabase
      .from('enterprise_rewards')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      await supabase.from('enterprise_reward_audit_log').insert([{
        reward_id: id,
        action_type: 'Status Change',
        action_by: currentUser?.id,
        action_by_role: 'Manager',
        details: { new_status: newStatus }
      }]);
      fetchGlobalData();
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Rewards', value: stats.total, icon: <Gift className="w-5 h-5 text-indigo-500" /> },
          { label: 'Locked', value: stats.locked, icon: <Lock className="w-5 h-5 text-red-500" /> },
          { label: 'Unlocked', value: stats.unlocked, icon: <Unlock className="w-5 h-5 text-emerald-500" /> },
          { label: 'Claimed', value: stats.claimed, icon: <CheckCircle2 className="w-5 h-5 text-blue-500" /> },
          { label: 'Completed', value: stats.completed, icon: <Archive className="w-5 h-5 text-gray-500" /> },
        ].map((s, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">{s.label}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{s.value}</p>
            </div>
            <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">{s.icon}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRewardList = () => (
    <div className="space-y-4">
      {enterpriseRewards.map(r => {
        const proj = projects.find(p => p.id === r.project_id);
        const team = projectTeams.find(t => p.id === r.team_id);
        
        return (
          <div key={r.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {r.image_url ? (
                <img src={r.image_url} alt="Reward" className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center">
                  <Gift className="w-8 h-8 text-[var(--text-secondary)]" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-[var(--text-primary)] text-lg">{r.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    r.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                    r.status === 'Locked' ? 'bg-red-100 text-red-700' :
                    r.status === 'Unlocked' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {r.status}
                  </span>
                  • {proj?.name || 'No Project'} • {r.reward_type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {r.status === 'Draft' && <button onClick={() => updateRewardStatus(r.id, 'Assigned')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">Assign</button>}
              {r.status === 'Assigned' && <button onClick={() => updateRewardStatus(r.id, 'Locked')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Lock</button>}
              {(r.status === 'Locked' || r.status === 'Ready for Unlock') && <button onClick={() => updateRewardStatus(r.id, 'Unlocked')} className="px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] rounded-lg text-sm font-semibold hover:bg-[var(--bg-secondary)]"><Unlock className="w-4 h-4 inline mr-1" /> Force Unlock</button>}
              <button onClick={() => updateRewardStatus(r.id, 'Archived')} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-lg"><Archive className="w-5 h-5" /></button>
            </div>
          </div>
        )
      })}
      {enterpriseRewards.length === 0 && (
        <div className="text-center p-12 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)]">
          No rewards found in the enterprise workflow.
        </div>
      )}
    </div>
  );

  const renderApprovalChecklist = () => {
    // Show only locked or ready for unlock
    const pendingRewards = enterpriseRewards.filter(r => ['Locked', 'Ready for Unlock'].includes(r.status));
    
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Reward Approval Dashboard</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {pendingRewards.map(r => {
            const teamTasks = tasks.filter(t => t.team_id === r.team_id);
            const allTasksDone = teamTasks.length > 0 && teamTasks.every(t => t.status === 'Completed');
            // Simplified check for module submission assuming latest module for that team
            const teamModule = projectModules.find(m => m.project_id === r.project_id);
            const moduleDone = teamModule ? teamModule.status === 'Completed' : false;
            
            return (
              <div key={r.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">{r.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Team ID: {r.team_id}</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{r.status}</span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    {allTasksDone ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 border-2 border-[var(--border)] rounded" />}
                    <span className="text-sm text-[var(--text-primary)]">All employee tasks approved</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {moduleDone ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 border-2 border-[var(--border)] rounded" />}
                    <span className="text-sm text-[var(--text-primary)]">Module reached 100% completion</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[var(--border)] rounded" />
                    <span className="text-sm text-[var(--text-primary)]">TL Final Module Report submitted</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => updateRewardStatus(r.id, 'Unlocked')}
                  disabled={!allTasksDone || loading}
                  className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                    allTasksDone ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed'
                  }`}
                >
                  Approve & Unlock Reward
                </button>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Crown className="w-6 h-6 text-brand-600" />
            Enterprise Rewards Workflow
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Manage lifecycle, approvals, and distribution of project rewards.
          </p>
        </div>
        
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Reward
        </button>
      </div>

      {isCreating ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Create Enterprise Reward</h2>
            <button onClick={() => setIsCreating(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
          </div>
          
          <form onSubmit={handleCreateReward} className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Reward Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-brand-500" placeholder="e.g., MacBook Pro" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Reward Type</label>
                <select value={formData.reward_type} onChange={e => setFormData({...formData, reward_type: e.target.value})} className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-brand-500">
                  <option>Weekly</option>
                  <option>Milestone</option>
                  <option>Grand Reward</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Description</label>
                <textarea required rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-brand-500" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Target Project</label>
                <select required value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-brand-500">
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Target Team</label>
                <select required value={formData.team_id} onChange={e => setFormData({...formData, team_id: e.target.value})} className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-brand-500">
                  <option value="">Select Team</option>
                  {projectTeams.filter(t => t.project_id === formData.project_id).map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Upload Reward Image (Supabase Storage)</label>
                <input type="file" accept="image/*" onChange={e => setFormData({...formData, image_file: e.target.files[0]})} className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Expiry Date</label>
                <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-brand-500" />
              </div>
            </div>
            
            <div className="flex justify-end pt-6 border-t border-[var(--border)]">
              <button disabled={loading} type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700">
                {loading ? 'Creating...' : 'Create Reward'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] p-1 rounded-xl w-fit mb-6">
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'list' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Reward List</button>
            <button onClick={() => setActiveTab('approvals')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'approvals' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Approval Dashboard</button>
          </div>

          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'list' && renderRewardList()}
          {activeTab === 'approvals' && renderApprovalChecklist()}
        </>
      )}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import { 
  Gift, Users, Target, CheckCircle2, AlertCircle, Plus, 
  Upload, Search, X, BarChart3, Clock, Lock, Unlock,
  Archive, FileText, ChevronRight, Check, CheckSquare
} from 'lucide-react';

export default function ManagerRewards() {
  const { 
    enterpriseRewards = [], 
    enterpriseRewardClaims = [], 
    enterpriseRewardAuditLog = [], 
    employees = [], 
    projects = [], 
    projectTeams = [], 
    projectModules = [],
    tasks = [],
    moduleSubmissions = [],
    currentUser,
    fetchGlobalData,
    triggerNotification
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, list, unlocks, audit
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    project_id: '',
    team_ids: [],
    module_ids: [],
    title: '',
    description: '',
    reward_type: 'Weekly',
    reward_value: '',
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
      locked: enterpriseRewards.filter(r => r.status === 'Locked' || r.status === 'Assigned' || r.status.includes('Waiting')).length,
      readyToUnlock: enterpriseRewards.filter(r => r.status === 'Ready To Unlock').length,
      unlocked: enterpriseRewards.filter(r => r.status === 'Unlocked').length,
      claimed: enterpriseRewards.filter(r => r.status === 'Claimed').length,
      completed: enterpriseRewards.filter(r => r.status === 'Completed').length,
    };
  }, [enterpriseRewards]);

  // Wizard Data filtering
  const activeProjects = projects.filter(p => p.status !== 'Completed' && p.status !== 'Archived');
  const projectTeamsList = projectTeams.filter(t => t.project_id === wizardData.project_id);
  const projectModulesList = projectModules.filter(m => 
    m.project_id === wizardData.project_id && 
    (wizardData.team_ids.length === 0 || wizardData.team_ids.includes(m.team_id))
  );

  const resetWizard = () => {
    setWizardStep(1);
    setWizardData({
      project_id: '',
      team_ids: [],
      module_ids: [],
      title: '',
      description: '',
      reward_type: 'Weekly',
      reward_value: '',
      priority: 'Medium',
      expiry_date: '',
      rules: '',
      image_file: null,
      image_url: ''
    });
    setIsCreating(false);
  };

  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `rewards/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('reward-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('reward-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
      return null;
    }
  };

  const handleAssignReward = async () => {
    try {
      setLoading(true);
      
      let imageUrl = wizardData.image_url;
      if (wizardData.image_file) {
        imageUrl = await uploadImage(wizardData.image_file);
      }

      const rulesArray = wizardData.rules.split('\\n').filter(r => r.trim());

      const rewardPayload = {
        title: wizardData.title,
        description: wizardData.description,
        reward_type: wizardData.reward_type,
        reward_value: wizardData.reward_value,
        project_id: wizardData.project_id,
        team_ids: wizardData.team_ids,
        module_ids: wizardData.module_ids,
        priority: wizardData.priority,
        expiry_date: wizardData.expiry_date ? new Date(wizardData.expiry_date).toISOString() : null,
        rules: rulesArray,
        image_url: imageUrl,
        status: 'Assigned',
        unlock_condition: 'module_completion'
      };

      const { data: newReward, error } = await supabase
        .from('enterprise_rewards')
        .insert(rewardPayload)
        .select()
        .single();

      if (error) throw error;

      // Log Audit
      await supabase.from('enterprise_reward_audit_log').insert({
        reward_id: newReward.id,
        action_type: 'Assigned',
        action_by: currentUser.id,
        action_by_role: 'Manager',
        details: { message: 'Reward assigned to project and teams via Wizard', payload: rewardPayload }
      });

      // Notify TLs of selected teams
      for (const tId of wizardData.team_ids) {
        const team = projectTeams.find(t => t.id === tId);
        if (team && team.team_leader_id) {
          triggerNotification(team.team_leader_id, 'New Reward Assigned!', `The reward "${wizardData.title}" has been assigned to your team.`, 'system');
        }
      }

      await fetchGlobalData();
      resetWizard();
      setActiveTab('list');
    } catch (err) {
      console.error('Error assigning reward:', err);
      alert(err.message || 'Failed to assign reward.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockReward = async (reward) => {
    if (!confirm(`Unlock reward "${reward.title}" for the assigned teams?`)) return;

    try {
      setLoading(true);
      await supabase.from('enterprise_rewards').update({ status: 'Unlocked' }).eq('id', reward.id);

      await supabase.from('enterprise_reward_audit_log').insert({
        reward_id: reward.id,
        action_type: 'Unlocked',
        action_by: currentUser.id,
        action_by_role: 'Manager',
        details: { message: 'Manager manually unlocked reward' }
      });

      // Notify TLs
      const assignedTeams = projectTeams.filter(t => reward.team_ids?.includes(t.id));
      for (const team of assignedTeams) {
        if (team.team_leader_id) {
          triggerNotification(team.team_leader_id, 'Reward Unlocked!', `Congratulations! The reward "${reward.title}" has been unlocked by the Manager.`, 'reward');
        }
        if (team.team_members) {
          for (const mId of team.team_members) {
            triggerNotification(mId, 'Reward Unlocked!', `Congratulations! The reward "${reward.title}" has been unlocked by the Manager. Claim it now!`, 'reward');
          }
        }
      }

      await fetchGlobalData();
    } catch (err) {
      console.error('Error unlocking reward:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (rewardId, newStatus, message) => {
    try {
      setLoading(true);
      await supabase.from('enterprise_rewards').update({ status: newStatus }).eq('id', rewardId);
      
      await supabase.from('enterprise_reward_audit_log').insert({
        reward_id: rewardId,
        action_type: newStatus === 'Archived' ? 'Archived' : 'StatusUpdate',
        action_by: currentUser.id,
        action_by_role: 'Manager',
        details: { message }
      });

      await fetchGlobalData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rewardId) => {
    if (!confirm('Are you sure you want to delete this reward? This cannot be undone.')) return;
    try {
      setLoading(true);
      await supabase.from('enterprise_rewards').delete().eq('id', rewardId);
      await fetchGlobalData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UI Renders ---

  const renderWizard = () => {
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Gift className="w-6 h-6 text-[var(--text-primary)]" />
            Assign Enterprise Reward
          </h2>
          <button onClick={resetWizard} className="p-2 hover:bg-[var(--surface)] rounded-full text-[var(--text-secondary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  wizardStep === step ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] ring-4 ring-[var(--btn-primary-bg)]/20' :
                  wizardStep > step ? 'bg-green-500 text-white' :
                  'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]'
                }`}>
                  {wizardStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
              </div>
              {step < 6 && (
                <div className={`flex-1 h-[2px] mx-2 ${wizardStep > step ? 'bg-green-500' : 'bg-[var(--border)]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="linear-card p-6">
          {wizardStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Step 1: Select Project</h3>
              {activeProjects.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-sm">No active projects available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeProjects.map(proj => (
                    <div 
                      key={proj.id} 
                      onClick={() => setWizardData(prev => ({ ...prev, project_id: proj.id, team_ids: [], module_ids: [] }))}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        wizardData.project_id === proj.id 
                          ? 'border-[var(--btn-primary-bg)] bg-[var(--btn-primary-bg)]/5 ring-2 ring-[var(--btn-primary-bg)]/20' 
                          : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      <h4 className="font-semibold text-[var(--text-primary)]">{proj.name}</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{proj.description}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end mt-6 pt-4 border-t border-[var(--border)]">
                <button 
                  onClick={() => setWizardStep(2)} 
                  disabled={!wizardData.project_id}
                  className="px-6 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold rounded-[10px] disabled:opacity-50 flex items-center"
                >
                  Next: Select Teams <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Step 2: Select Teams</h3>
              {projectTeamsList.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-sm">No teams found for this project.</p>
              ) : (
                <div className="space-y-3">
                  <div 
                    className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--surface)]"
                    onClick={() => {
                      if (wizardData.team_ids.length === projectTeamsList.length) {
                        setWizardData(prev => ({ ...prev, team_ids: [], module_ids: [] }));
                      } else {
                        setWizardData(prev => ({ ...prev, team_ids: projectTeamsList.map(t => t.id), module_ids: [] }));
                      }
                    }}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${wizardData.team_ids.length === projectTeamsList.length ? 'bg-[var(--btn-primary-bg)] border-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]' : 'border-[var(--border)]'}`}>
                      {wizardData.team_ids.length === projectTeamsList.length && <Check className="w-3 h-3" />}
                    </div>
                    <span className="font-semibold text-[var(--text-primary)]">Select All Teams</span>
                  </div>

                  {projectTeamsList.map(team => (
                    <div 
                      key={team.id} 
                      className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--surface)]"
                      onClick={() => {
                        const newTeams = wizardData.team_ids.includes(team.id)
                          ? wizardData.team_ids.filter(id => id !== team.id)
                          : [...wizardData.team_ids, team.id];
                        setWizardData(prev => ({ ...prev, team_ids: newTeams, module_ids: [] }));
                      }}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${wizardData.team_ids.includes(team.id) ? 'bg-[var(--btn-primary-bg)] border-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]' : 'border-[var(--border)]'}`}>
                        {wizardData.team_ids.includes(team.id) && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--text-primary)]">{team.team_name}</span>
                        <p className="text-xs text-[var(--text-secondary)]">{team.team_members?.length || 0} Members</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-6 pt-4 border-t border-[var(--border)]">
                <button onClick={() => setWizardStep(1)} className="px-6 py-2 border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-[10px] hover:bg-[var(--surface)]">Back</button>
                <button 
                  onClick={() => setWizardStep(3)} 
                  disabled={wizardData.team_ids.length === 0}
                  className="px-6 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold rounded-[10px] disabled:opacity-50 flex items-center"
                >
                  Next: Select Modules <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Step 3: Select Modules</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-2">Displaying modules assigned to the selected teams.</p>
              {projectModulesList.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-sm">No modules found for these teams.</p>
              ) : (
                <div className="space-y-3">
                  {projectModulesList.map(mod => {
                    const teamName = projectTeamsList.find(t => t.id === mod.team_id)?.team_name;
                    return (
                      <div 
                        key={mod.id} 
                        className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--surface)]"
                        onClick={() => {
                          const newMods = wizardData.module_ids.includes(mod.id)
                            ? wizardData.module_ids.filter(id => id !== mod.id)
                            : [...wizardData.module_ids, mod.id];
                          setWizardData(prev => ({ ...prev, module_ids: newMods }));
                        }}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${wizardData.module_ids.includes(mod.id) ? 'bg-[var(--btn-primary-bg)] border-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]' : 'border-[var(--border)]'}`}>
                          {wizardData.module_ids.includes(mod.id) && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <span className="font-semibold text-[var(--text-primary)]">{mod.name}</span>
                          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">Assigned to: {teamName}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-between mt-6 pt-4 border-t border-[var(--border)]">
                <button onClick={() => setWizardStep(2)} className="px-6 py-2 border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-[10px] hover:bg-[var(--surface)]">Back</button>
                <button 
                  onClick={() => setWizardStep(4)} 
                  disabled={wizardData.module_ids.length === 0}
                  className="px-6 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold rounded-[10px] disabled:opacity-50 flex items-center"
                >
                  Next: Reward Details <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Step 4: Reward Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Reward Title</label>
                  <input 
                    type="text" 
                    className="linear-input w-full" 
                    placeholder="e.g. Trip to Goa, Amazon Gift Card"
                    value={wizardData.title}
                    onChange={e => setWizardData({...wizardData, title: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Description</label>
                  <textarea 
                    className="linear-input w-full h-20" 
                    placeholder="Describe the reward..."
                    value={wizardData.description}
                    onChange={e => setWizardData({...wizardData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Reward Type</label>
                  <select 
                    className="linear-input w-full py-2"
                    value={wizardData.reward_type}
                    onChange={e => setWizardData({...wizardData, reward_type: e.target.value})}
                  >
                    <option>Weekly</option>
                    <option>Milestone</option>
                    <option>Grand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Reward Value</label>
                  <input 
                    type="text" 
                    className="linear-input w-full" 
                    placeholder="e.g. ₹5000, Paid Trip"
                    value={wizardData.reward_value}
                    onChange={e => setWizardData({...wizardData, reward_value: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Priority</label>
                  <select 
                    className="linear-input w-full py-2"
                    value={wizardData.priority}
                    onChange={e => setWizardData({...wizardData, priority: e.target.value})}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Expiry Date</label>
                  <input 
                    type="date" 
                    className="linear-input w-full" 
                    value={wizardData.expiry_date}
                    onChange={e => setWizardData({...wizardData, expiry_date: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Reward Image</label>
                  <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:bg-[var(--surface)] transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setWizardData({...wizardData, image_file: file});
                        }
                      }}
                    />
                    {wizardData.image_file ? (
                      <p className="text-[var(--text-primary)] font-medium">Selected: {wizardData.image_file.name}</p>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2 opacity-50" />
                        <p className="text-[var(--text-secondary)] text-sm">Click or drag image to upload</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-6 pt-4 border-t border-[var(--border)]">
                <button onClick={() => setWizardStep(3)} className="px-6 py-2 border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-[10px] hover:bg-[var(--surface)]">Back</button>
                <button 
                  onClick={() => setWizardStep(5)} 
                  disabled={!wizardData.title}
                  className="px-6 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold rounded-[10px] disabled:opacity-50 flex items-center"
                >
                  Next: Unlock Rules <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 5 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Step 5: Unlock Rules</h3>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-5">
                <h4 className="font-semibold text-blue-500 mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Reward Unlock Condition
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <CheckSquare className="w-4 h-4 text-blue-500" /> All employee tasks approved
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <CheckSquare className="w-4 h-4 text-blue-500" /> Module Progress = 100%
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <CheckSquare className="w-4 h-4 text-blue-500" /> Team Leader submitted Final Module Report
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <CheckSquare className="w-4 h-4 text-blue-500" /> Manager approved Final Module Report
                  </li>
                </ul>
                <p className="text-xs text-[var(--text-secondary)] mt-4 italic">These enterprise rules are fixed and cannot be modified.</p>
              </div>
              <div className="flex justify-between mt-6 pt-4 border-t border-[var(--border)]">
                <button onClick={() => setWizardStep(4)} className="px-6 py-2 border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-[10px] hover:bg-[var(--surface)]">Back</button>
                <button 
                  onClick={() => setWizardStep(6)} 
                  className="px-6 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold rounded-[10px] flex items-center"
                >
                  Review Assignment <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 6 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Step 6: Confirmation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Project</p>
                  <p className="font-medium text-[var(--text-primary)]">{activeProjects.find(p => p.id === wizardData.project_id)?.name}</p>
                </div>
                <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Reward</p>
                  <p className="font-medium text-[var(--text-primary)]">{wizardData.title} <span className="text-xs text-[var(--text-secondary)]">({wizardData.reward_type})</span></p>
                </div>
                <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Assigned Teams</p>
                  <ul className="text-sm text-[var(--text-primary)] space-y-1">
                    {wizardData.team_ids.map(tId => (
                      <li key={tId}>• {projectTeams.find(t => t.id === tId)?.team_name}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Assigned Modules</p>
                  <ul className="text-sm text-[var(--text-primary)] space-y-1">
                    {wizardData.module_ids.map(mId => (
                      <li key={mId}>• {projectModules.find(m => m.id === mId)?.name}</li>
                    ))}
                  </ul>
                </div>
                <div className="col-span-2 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">Unlock Rule</p>
                    <p className="font-medium text-amber-500 flex items-center gap-2"><Lock className="w-4 h-4"/> Manager Approval Required</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6 pt-4 border-t border-[var(--border)]">
                <button onClick={() => setWizardStep(5)} disabled={loading} className="px-6 py-2 border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-[10px] hover:bg-[var(--surface)] disabled:opacity-50">Back</button>
                <button 
                  onClick={handleAssignReward} 
                  disabled={loading}
                  className="px-6 py-2 bg-green-500 text-white font-semibold rounded-[10px] disabled:opacity-50 flex items-center"
                >
                  {loading ? 'Assigning...' : 'Assign Reward'} <CheckCircle2 className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Reward Workflow Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage enterprise rewards across projects and teams.</p>
        </div>
        <button 
          onClick={() => { setIsCreating(true); setWizardStep(1); }}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold rounded-[10px] transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Assign New Reward
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Rewards', value: stats.total, icon: Gift, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Locked & Working', value: stats.locked, icon: Lock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Ready to Unlock', value: stats.readyToUnlock, icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Unlocked', value: stats.unlocked, icon: Unlock, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Claimed/Completed', value: stats.claimed + stats.completed, icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        ].map((stat, i) => (
          <div key={i} className="linear-card p-5 flex flex-col items-center justify-center text-center hover:border-[var(--text-secondary)] transition-colors cursor-pointer" onClick={() => setActiveTab('list')}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">{stat.value}</p>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUnlocks = () => {
    const readyRewards = enterpriseRewards.filter(r => r.status === 'Ready To Unlock');

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Rewards Waiting For Unlock</h2>
        </div>

        {readyRewards.length === 0 ? (
          <div className="linear-card p-12 text-center">
            <Unlock className="w-12 h-12 text-[var(--text-secondary)] opacity-30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">All Caught Up!</h3>
            <p className="text-[var(--text-secondary)]">There are no rewards currently waiting for Manager unlock.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {readyRewards.map(reward => {
              const proj = projects.find(p => p.id === reward.project_id);
              const teams = projectTeams.filter(t => reward.team_ids?.includes(t.id));
              const mods = projectModules.filter(m => reward.module_ids?.includes(m.id));

              // We could fetch actual module completion metrics, but for now we assume 100% since it's Ready To Unlock.
              
              return (
                <div key={reward.id} className="linear-card p-6 border-l-4 border-l-purple-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{reward.title}</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Project: {proj?.name}</p>
                    </div>
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">
                      Ready To Unlock
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border)]">
                      <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Teams</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{teams.map(t => t.team_name).join(', ')}</p>
                    </div>
                    <div className="bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border)]">
                      <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Modules</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{mods.map(m => m.name).join(', ')}</p>
                    </div>
                    <div className="bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border)]">
                      <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Completion</p>
                      <p className="text-sm text-green-500 font-bold">100%</p>
                    </div>
                    <div className="bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border)]">
                      <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Manager Approval</p>
                      <p className="text-sm text-green-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                    <button 
                      onClick={() => handleUnlockReward(reward)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors flex justify-center items-center gap-2"
                    >
                      <Unlock className="w-4 h-4" /> Unlock Reward
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderList = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">All Rewards</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {enterpriseRewards.map(reward => {
            const proj = projects.find(p => p.id === reward.project_id);
            const teams = projectTeams.filter(t => reward.team_ids?.includes(t.id));
            const mods = projectModules.filter(m => reward.module_ids?.includes(m.id));

            return (
              <div key={reward.id} className="linear-card flex flex-col md:flex-row gap-6 p-6">
                <div className="w-full md:w-1/3 aspect-square rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {reward.image_url ? (
                    <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" />
                  ) : (
                    <Gift className="w-12 h-12 text-[var(--text-secondary)] opacity-30" />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight">{reward.title}</h3>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        reward.status === 'Draft' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
                        reward.status === 'Assigned' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        reward.status === 'Locked' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        reward.status === 'Ready To Unlock' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                        reward.status === 'Unlocked' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                        'bg-[var(--surface)] text-[var(--text-secondary)]'
                      }`}>
                        {reward.status}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">{reward.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-[var(--bg-secondary)] px-3 py-2 rounded border border-[var(--border)]">
                        <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Project</p>
                        <p className="text-xs text-[var(--text-primary)] font-medium truncate">{proj?.name}</p>
                      </div>
                      <div className="bg-[var(--bg-secondary)] px-3 py-2 rounded border border-[var(--border)]">
                        <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Type</p>
                        <p className="text-xs text-[var(--text-primary)] font-medium">{reward.reward_type}</p>
                      </div>
                      <div className="bg-[var(--bg-secondary)] px-3 py-2 rounded border border-[var(--border)] col-span-2">
                        <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Teams</p>
                        <p className="text-xs text-[var(--text-primary)] font-medium">{teams.map(t=>t.team_name).join(', ') || 'None'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border)]">
                    {reward.status === 'Draft' || reward.status === 'Assigned' ? (
                      <button onClick={() => handleDelete(reward.id)} className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded text-xs font-semibold transition-colors">
                        Delete
                      </button>
                    ) : (
                      <button onClick={() => handleUpdateStatus(reward.id, 'Archived', 'Reward Archived manually')} className="px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded text-xs font-semibold transition-colors">
                        Archive
                      </button>
                    )}
                    {reward.status === 'Unlocked' && (
                      <button onClick={() => handleUpdateStatus(reward.id, 'Locked', 'Locked again by Manager')} className="px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded text-xs font-semibold transition-colors ml-auto">
                        Lock Again
                      </button>
                    )}
                    {(reward.status === 'Draft' || reward.status === 'Locked') && (
                      <button onClick={() => handleUnlockReward(reward)} className="px-3 py-1.5 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white rounded text-xs font-semibold transition-colors ml-auto">
                        Force Unlock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen pb-24">
      {isCreating ? (
        renderWizard()
      ) : (
        <>
          {renderDashboard()}
          
          <div className="mt-8">
            <div className="flex border-b border-[var(--border)] mb-6">
              {[
                { id: 'unlocks', label: 'Waiting for Unlock', icon: AlertCircle },
                { id: 'list', label: 'All Rewards', icon: FileText },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors duration-150 border-b-2 relative top-[1px] ${
                    activeTab === tab.id 
                      ? 'border-[var(--text-primary)] text-[var(--text-primary)]' 
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'unlocks' && renderUnlocks()}
            {activeTab === 'list' && renderList()}
          </div>
        </>
      )}
    </div>
  );
}

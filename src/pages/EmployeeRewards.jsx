import { useState, useEffect } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import { Gift, Calendar, CheckCircle2, AlertCircle, Users, Lock, Unlock, TrendingUp, Medal, Trophy, Crown, ArrowRight } from 'lucide-react';

export default function EmployeeRewards() {
  const { currentUser, teamRewards, rewardClaims, rewardSettings, employees, tasks, projects, fetchGlobalData } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('current'); // current, premium, history
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [unlockedClaims, setUnlockedClaims] = useState([]);

  // Check for multiple unlocked claims if allow_multiple_claims is false
  useEffect(() => {
    if (!currentUser) return;
    const myUnlocked = rewardClaims.filter(c => c.employee_id === currentUser.id && c.status === 'Unlocked');
    setUnlockedClaims(myUnlocked);
    
    if (myUnlocked.length > 1 && !rewardSettings?.allow_multiple_claims) {
      setShowClaimModal(true);
    } else {
      setShowClaimModal(false);
    }
  }, [rewardClaims, currentUser, rewardSettings]);

  if (!currentUser) return null;

  const handleClaim = async (claimId) => {
    try {
      if (!rewardSettings?.allow_multiple_claims && unlockedClaims.length > 1) {
        // Claim the selected one, mark others as Not Claimed
        const otherClaims = unlockedClaims.filter(c => c.id !== claimId).map(c => c.id);
        
        await supabase.from('reward_claims').update({ status: 'Claimed', claimed_at: new Date().toISOString() }).eq('id', claimId);
        if (otherClaims.length > 0) {
          await supabase.from('reward_claims').update({ status: 'Not Claimed' }).in('id', otherClaims);
        }
      } else {
        // Just claim this one
        await supabase.from('reward_claims').update({ status: 'Claimed', claimed_at: new Date().toISOString() }).eq('id', claimId);
      }
      setShowClaimModal(false);
      fetchGlobalData();
    } catch (err) {
      console.error('Error claiming reward:', err);
    }
  };

  // Helper to get team progress
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
    return { completed: completedMembers, pending: pendingMembers, percentage, totalMembers: teamMembers.length };
  };

  const myTeamRewards = teamRewards.filter(r => r.team_name === currentUser.team);
  
  // Filter for tabs
  const currentRewards = myTeamRewards.filter(r => r.reward_type !== 'Premium' && r.status !== 'Expired' && r.status !== 'Cancelled');
  const premiumRewards = myTeamRewards.filter(r => r.reward_type === 'Premium' && r.status !== 'Expired' && r.status !== 'Cancelled');
  
  const myClaims = rewardClaims.filter(c => c.employee_id === currentUser.id);
  const claimHistory = myClaims.filter(c => c.status === 'Claimed' || c.status === 'Not Claimed' || c.status === 'Expired');

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Choose Your Reward Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center mb-8">
              <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-3xl font-extrabold text-slate-900">Congratulations!</h2>
              <p className="text-slate-600 mt-2 text-lg">You qualified for multiple team rewards.<br/>Please select <strong className="text-brand-600">only one</strong> reward before the claim deadline.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {unlockedClaims.map(claim => {
                const reward = teamRewards.find(r => r.id === claim.reward_id);
                if (!reward) return null;
                const projName = projects.find(p => p.id === reward.project_id)?.name || 'General';
                return (
                  <div key={claim.id} className="border-2 border-slate-200 rounded-2xl p-6 hover:border-brand-500 cursor-pointer transition-all flex flex-col group" onClick={() => handleClaim(claim.id)}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase">{projName}</span>
                      {reward.reward_type === 'Premium' && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded flex items-center gap-1"><Crown className="w-3 h-3"/> Premium</span>}
                    </div>
                    {reward.image_url ? (
                      <img src={reward.image_url} alt="Reward" className="w-full h-32 object-cover rounded-xl mb-4" />
                    ) : (
                      <div className="w-full h-32 bg-brand-50 rounded-xl flex items-center justify-center mb-4 text-brand-300">
                        <Gift className="w-12 h-12" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-600">{reward.title}</h3>
                    <p className="text-sm text-slate-500 flex-1">{reward.description}</p>
                    <button className="mt-4 w-full py-2 bg-brand-50 text-brand-700 font-bold rounded-xl group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      Claim This Reward
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-8 mb-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-10">
          <Gift className="w-64 h-64" />
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Team Weekend Rewards</h1>
            <p className="text-slate-300 max-w-xl">Complete all weekly tasks as a team to unlock exciting rewards together!</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 mb-8">
        <button onClick={() => setActiveTab('current')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'current' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Current Rewards
        </button>
        <button onClick={() => setActiveTab('premium')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'premium' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Premium Rewards
        </button>
        <button onClick={() => setActiveTab('history')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Reward History
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date Earned</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reward</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claimHistory.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500 italic">No reward history yet.</td></tr>
              ) : (
                claimHistory.map(claim => {
                  const reward = teamRewards.find(r => r.id === claim.reward_id);
                  return (
                    <tr key={claim.id} className="hover:bg-slate-50">
                      <td className="p-4 text-sm text-slate-600 font-medium">{new Date(claim.earned_at).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-bold text-slate-900">{reward?.title || 'Unknown Reward'}</td>
                      <td className="p-4 text-sm text-slate-600">{projects.find(p => p.id === reward?.project_id)?.name || 'General'}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${claim.status === 'Claimed' ? 'bg-emerald-100 text-emerald-700' : claim.status === 'Not Claimed' ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-700'}`}>
                          {claim.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-8">
          {(activeTab === 'current' ? currentRewards : premiumRewards).length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
              <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No {activeTab} rewards scheduled</h3>
              <p className="text-slate-500 mt-2">Check back later or view your history.</p>
            </div>
          ) : (
            (activeTab === 'current' ? currentRewards : premiumRewards).map(reward => {
              const progress = getTeamProgress(reward.team_name, reward.project_id);
              const myClaim = rewardClaims.find(c => c.reward_id === reward.id && c.employee_id === currentUser.id);
              const isUnlocked = myClaim?.status === 'Unlocked' || reward.status === 'Unlocked';
              const isClaimed = myClaim?.status === 'Claimed';
              const projName = projects.find(p => p.id === reward.project_id)?.name || 'General';

              return (
                <div key={reward.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
                  {/* Visual Left Side */}
                  <div className={`w-full lg:w-1/3 p-8 flex flex-col justify-center ${isClaimed ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' : isUnlocked ? 'bg-gradient-to-br from-brand-500 to-indigo-600 text-white' : 'bg-slate-50 border-r border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded uppercase ${isUnlocked || isClaimed ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'}`}>
                        {projName}
                      </span>
                      {reward.reward_type === 'Premium' && (
                        <span className={`text-xs font-bold px-3 py-1 rounded flex items-center gap-1 uppercase ${isUnlocked || isClaimed ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
                          <Crown className="w-3 h-3"/> Premium
                        </span>
                      )}
                    </div>
                    
                    {reward.image_url ? (
                      <img src={reward.image_url} alt="Reward" className="w-full h-48 object-cover rounded-xl mb-6 shadow-md" />
                    ) : (
                      <div className="text-6xl mb-6 text-center">🎁</div>
                    )}
                    
                    <h3 className={`text-3xl font-extrabold mb-2 ${isUnlocked || isClaimed ? 'text-white' : 'text-slate-900'}`}>{reward.title}</h3>
                    <p className={`text-sm mb-6 ${isUnlocked || isClaimed ? 'text-white/80' : 'text-slate-500'}`}>{reward.description}</p>
                    
                    {isClaimed ? (
                      <div className="bg-white/20 rounded-xl p-4 text-center">
                        <CheckCircle2 className="w-8 h-8 text-white mx-auto mb-2" />
                        <span className="font-bold">Reward Claimed!</span>
                      </div>
                    ) : isUnlocked ? (
                      <button onClick={() => handleClaim(myClaim?.id)} className="w-full py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-lg">
                        Claim Reward Now
                      </button>
                    ) : (
                      <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                        <div className="text-3xl font-extrabold text-brand-600 mb-1">{progress.percentage}%</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Team Completion</div>
                      </div>
                    )}
                  </div>

                  {/* Tracking Right Side */}
                  <div className="w-full lg:w-2/3 p-8 flex flex-col">
                    
                    {/* Rules */}
                    {reward.rules && reward.rules.length > 0 && (
                      <div className="mb-6 bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                          <h4 className="text-sm font-bold text-amber-900 mb-1">Premium Eligibility Rules</h4>
                          <ul className="list-disc list-inside text-xs text-amber-700">
                            {reward.rules.map((rule, idx) => <li key={idx}>{rule}</li>)}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2"><Target className="w-5 h-5 text-brand-600" /> Team Progress Tracker</h4>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-500">Deadline: {new Date(reward.claim_deadline).toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-6">
                      <div className={`h-full transition-all duration-1000 ${isUnlocked || isClaimed ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${progress.percentage}%` }}></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                      {/* Pending Members */}
                      <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 flex flex-col max-h-64 overflow-y-auto">
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center justify-between sticky top-0 bg-slate-50 pb-2 border-b">
                          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" /> Pending Members</span>
                          <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded">{progress.pending.length}</span>
                        </h4>
                        {progress.pending.length === 0 ? <p className="text-sm text-slate-500 italic mt-4 text-center">Everyone has completed their tasks!</p> : (
                          <div className="space-y-3 mt-2">
                            {progress.pending.map(m => (
                              <div key={m.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">{m.name.charAt(0)}</div>
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-900">{m.name}</p>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">{m.remainingTasks} Left</span>
                                    <span className="text-[10px] text-slate-500">{m.status}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Completed Members */}
                      <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4 flex flex-col max-h-64 overflow-y-auto">
                        <h4 className="font-bold text-emerald-900 mb-4 flex items-center justify-between sticky top-0 bg-emerald-50/90 pb-2 border-b border-emerald-100">
                          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed</span>
                          <span className="text-xs font-bold bg-emerald-200 text-emerald-800 px-2 py-1 rounded">{progress.completed.length}</span>
                        </h4>
                        {progress.completed.length === 0 ? <p className="text-sm text-slate-500 italic mt-4 text-center">No members have completed yet.</p> : (
                          <div className="space-y-3 mt-2">
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
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

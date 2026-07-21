import React, { useMemo, useState } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import { Gift, CheckCircle2, AlertCircle, Clock, Trophy, Heart } from 'lucide-react';

export default function EmployeeRewards() {
  const { 
    enterpriseRewards = [], 
    enterpriseRewardClaims = [], 
    projectTeams = [],
    currentUser,
    fetchGlobalData
  } = useAppContext();

  const [claiming, setClaiming] = useState(null);

  // Find teams this employee belongs to (including if they are the TL)
  const myTeams = useMemo(() => {
    return projectTeams.filter(t => t.team_members?.includes(currentUser?.id) || t.team_leader_id === currentUser?.id);
  }, [projectTeams, currentUser]);

  const myTeamIds = myTeams.map(t => t.id);

  // Filter rewards assigned to those teams
  const myRewards = useMemo(() => {
    return enterpriseRewards.filter(r => r.team_ids?.some(id => myTeamIds.includes(id)));
  }, [enterpriseRewards, myTeamIds]);

  const handleClaim = async (rewardId) => {
    setClaiming(rewardId);
    
    // Check if already claimed
    const existing = enterpriseRewardClaims.find(c => c.reward_id === rewardId && c.employee_id === currentUser.id);
    if (existing) {
      alert("You have already claimed this reward.");
      setClaiming(null);
      return;
    }

    const { error } = await supabase.from('enterprise_reward_claims').insert([{
      reward_id: rewardId,
      employee_id: currentUser.id,
      status: 'Claimed'
    }]);

    if (!error) {
      // Create Audit Log
      await supabase.from('enterprise_reward_audit_log').insert([{
        reward_id: rewardId,
        action_type: 'Claimed',
        action_by: currentUser.id,
        action_by_role: 'Employee'
      }]);
      fetchGlobalData();
    } else {
      alert("Error claiming reward: " + error.message);
    }
    setClaiming(null);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Trophy className="w-6 h-6 text-brand-600" />
          My Rewards
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          View and claim rewards unlocked by your team's hard work.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myRewards.map(r => {
          const isClaimed = enterpriseRewardClaims.some(c => c.reward_id === r.id && c.employee_id === currentUser?.id);
          const canClaim = r.status === 'Unlocked' && !isClaimed;
          const isLocked = r.status === 'Locked' || r.status === 'Assigned' || r.status === 'Ready for Unlock';

          return (
            <div key={r.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col relative">
              {/* Status Badge */}
              <div className="absolute top-3 right-3 z-10">
                <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
                  isClaimed ? 'bg-blue-100 text-blue-700' :
                  isLocked ? 'bg-red-100 text-red-700' :
                  r.status === 'Unlocked' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {isClaimed ? 'Claimed' : r.status}
                </span>
              </div>

              {r.image_url ? (
                <img src={r.image_url} alt={r.title} className={`w-full h-48 object-cover ${isLocked ? 'grayscale opacity-75' : ''}`} />
              ) : (
                <div className={`w-full h-48 bg-gradient-to-br from-brand-50 to-indigo-50 flex items-center justify-center ${isLocked ? 'grayscale opacity-75' : ''}`}>
                  <Gift className="w-16 h-16 text-brand-300" />
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">{r.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4 flex-1">{r.description}</p>
                
                {r.rules && r.rules.length > 0 && (
                  <div className="mb-4 space-y-1">
                    <p className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">Eligibility Rules:</p>
                    {r.rules.map((rule, i) => (
                      <p key={i} className="text-xs text-[var(--text-secondary)] flex gap-2">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 text-brand-500" /> {rule}
                      </p>
                    ))}
                  </div>
                )}
                
                <button 
                  onClick={() => handleClaim(r.id)}
                  disabled={!canClaim || claiming === r.id}
                  className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all mt-auto ${
                    isClaimed ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed' :
                    canClaim ? 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-md hover:-translate-y-0.5' :
                    'bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed'
                  }`}
                >
                  {isClaimed ? (
                    <><CheckCircle2 className="w-4 h-4" /> Already Claimed</>
                  ) : claiming === r.id ? (
                    'Claiming...'
                  ) : isLocked ? (
                    <><AlertCircle className="w-4 h-4" /> Locked by Manager</>
                  ) : (
                    <><Heart className="w-4 h-4" /> Claim Reward</>
                  )}
                </button>
              </div>
            </div>
          )
        })}
        {myRewards.length === 0 && (
          <div className="col-span-full text-center p-12 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)]">
            You don't have any rewards assigned to your teams yet.
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Crown, Gift, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TeamLeaderRewards() {
  const { 
    enterpriseRewards = [], 
    projectTeams = [], 
    employees = [],
    currentUser
  } = useAppContext();

  // Find teams led by this user
  const myTeams = useMemo(() => {
    return projectTeams.filter(t => t.team_leader_id === currentUser?.id);
  }, [projectTeams, currentUser]);

  const myTeamIds = myTeams.map(t => t.id);

  // Filter rewards assigned to those teams
  const teamRewards = useMemo(() => {
    return enterpriseRewards.filter(r => myTeamIds.includes(r.team_id));
  }, [enterpriseRewards, myTeamIds]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Crown className="w-6 h-6 text-brand-600" />
          Team Rewards Dashboard
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Monitor reward progress for your assigned teams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamRewards.map(r => {
          const team = myTeams.find(t => t.id === r.team_id);
          const eligibleCount = team?.team_members?.length || 0;
          
          return (
            <div key={r.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col">
              {r.image_url ? (
                <img src={r.image_url} alt={r.title} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-brand-50 to-indigo-50 flex items-center justify-center">
                  <Gift className="w-16 h-16 text-brand-300" />
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">{r.title}</h3>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    r.status === 'Locked' ? 'bg-red-100 text-red-700' :
                    r.status === 'Unlocked' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4 flex-1">{r.description}</p>
                
                <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)] flex items-center gap-2"><Users className="w-4 h-4" /> Team</span>
                    <span className="font-semibold text-[var(--text-primary)]">{team?.team_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)] flex items-center gap-2"><Clock className="w-4 h-4" /> Expiry</span>
                    <span className="font-semibold text-[var(--text-primary)]">{r.expiry_date ? new Date(r.expiry_date).toLocaleDateString() : 'No Expiry'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)] flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Eligible Members</span>
                    <span className="font-semibold text-[var(--text-primary)]">{eligibleCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {teamRewards.length === 0 && (
          <div className="col-span-full text-center p-12 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)]">
            No rewards assigned to your teams yet.
          </div>
        )}
      </div>
    </div>
  );
}

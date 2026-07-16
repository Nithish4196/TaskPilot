import { useState, useEffect, useMemo } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import { Gift, Calendar, CheckCircle2, AlertCircle, Users, Lock, Unlock, Trophy, Crown, Clock, Milestone, Target, Info, Check } from 'lucide-react';

export default function EmployeeRewards() {
 const { currentUser, teamRewards, rewardClaims, rewardSettings, employees, tasks, projects, projectTeams, rewardSubmissions, fetchGlobalData } = useAppContext();
 
 const [activeTab, setActiveTab] = useState('current'); // current, upcoming, history
 
 // 1. PROJECT SCOPING: Find projects/teams the employee is part of
 const myTeams = useMemo(() => {
 if (!currentUser) return [];
 return projectTeams.filter(t => 
 t.team_leader_id === currentUser.id || 
 (t.team_members && t.team_members.includes(currentUser.id))
 );
 }, [currentUser, projectTeams]);

 // 2. REWARD VISIBILITY: Filter rewards mapped to my teams
 const myEligibleRewards = useMemo(() => {
 if (myTeams.length === 0) return [];
 
 // A reward is visible if it matches one of the employee's project_ids and team_names
 return teamRewards.filter(reward => {
 return myTeams.some(t => t.project_id === reward.project_id && t.team_name === reward.team_name);
 });
 }, [teamRewards, myTeams]);

 // Split rewards into categories
 const currentRewards = myEligibleRewards.filter(r => {
 const now = new Date();
 const start = new Date(r.start_date || r.created_at);
 return start <= now && r.status !== 'Expired' && r.status !== 'Cancelled';
 });

 const upcomingRewards = myEligibleRewards.filter(r => {
 const now = new Date();
 const start = new Date(r.start_date || r.created_at);
 return start > now && r.status !== 'Cancelled';
 });

 const historyRewards = myEligibleRewards.filter(r => {
 return r.status === 'Expired' || r.status === 'Cancelled' || rewardClaims.some(c => c.reward_id === r.id && c.employee_id === currentUser.id && c.status === 'Claimed');
 });

 // Default to the first current reward
 const [selectedRewardId, setSelectedRewardId] = useState(null);
 
 useEffect(() => {
 if (currentRewards.length > 0 && !selectedRewardId) {
 setSelectedRewardId(currentRewards[0].id);
 }
 }, [currentRewards, selectedRewardId]);

 const activeReward = currentRewards.find(r => r.id === selectedRewardId) || currentRewards[0];

 // Helper to get Team Progress (Dynamic)
 const getTeamProgressData = (reward) => {
 if (!reward) return null;
 
 // Find the actual team
 const team = myTeams.find(t => t.project_id === reward.project_id && t.team_name === reward.team_name);
 if (!team) return null;

 // Get all members
 const memberIds = new Set();
 if (team.team_leader_id) memberIds.add(team.team_leader_id);
 if (team.team_members) team.team_members.forEach(id => memberIds.add(id));
 
 const teamEmployees = employees.filter(e => memberIds.has(e.id));
 
 // Get all tasks for this project
 const projectTasks = tasks.filter(t => t.project_id === reward.project_id);

 let completedMembers = [];
 let pendingMembers = [];

 teamEmployees.forEach(emp => {
 const empTasks = projectTasks.filter(t => t.employee_id === emp.id);
 
 // If employee has no tasks assigned yet, they are pending assignment, not completed.
 if (empTasks.length === 0) {
 pendingMembers.push({ ...emp, remainingTasks: 0, status: 'No Tasks' });
 return;
 }
 
 const isCompleted = empTasks.every(t => t.status === 'Completed' || t.status === 'Approved');
 
 if (isCompleted) {
 completedMembers.push({ ...emp, taskCount: empTasks.length });
 } else {
 const remaining = empTasks.filter(t => t.status !== 'Completed' && t.status !== 'Approved');
 pendingMembers.push({ ...emp, remainingTasks: remaining.length, status: remaining[0]?.status || 'Pending' });
 }
 });

 const percentage = teamEmployees.length === 0 ? 0 : Math.round((completedMembers.length / teamEmployees.length) * 100);
 
 // MY Contribution
 const myTasks = projectTasks.filter(t => t.employee_id === currentUser.id);
 const myCompleted = myTasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
 const myProgress = myTasks.length > 0 ? Math.round((myCompleted / myTasks.length) * 100) : 0;

 return { completedMembers, pendingMembers, percentage, totalMembers: teamEmployees.length, myTasks, myCompleted, myProgress };
 };

 const activeData = getTeamProgressData(activeReward);

 // Auto-Unlock Logic (Manager usually unlocks, but if dynamic progress is 100%, we treat it as unlocked visually)
 useEffect(() => {
 const checkUnlock = async () => {
 if (activeReward && activeReward.status !== 'Unlocked' && activeData && activeData.percentage === 100) {
 // Theoretically, if the team hits 100%, we should update the DB if it hasn't been done.
 // We will do a silent update here to maintain the hybrid timeline integrity
 try {
 await supabase.from('team_rewards').update({ 
 status: 'Unlocked', 
 unlocked_at: new Date().toISOString() 
 }).eq('id', activeReward.id);
 fetchGlobalData();
 } catch (e) { console.error('Unlock error', e); }
 }
 };
 checkUnlock();
 }, [activeReward, activeData, fetchGlobalData]);


 const handleSubmitForReview = async (rewardId, projectId, teamName) => {
 try {
 const submissionData = {
 reward_id: rewardId,
 employee_id: currentUser.id,
 project_id: projectId,
 team_name: teamName,
 status: 'Submitted for Review'
 };
 
 await supabase.from('reward_submissions').insert([submissionData]);
 fetchGlobalData();
 } catch (err) {
 console.error('Error submitting for review:', err);
 }
 };

 if (!currentUser) return null;

 return (
 <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-2 duration-150">
 
 {/* Header */}
 <div className="bg-[var(--surface)] p-8 mb-10 text-[var(--text-primary)] relative overflow-hidden">
 <div className="absolute right-0 top-0 w-64 h-64 bg-[var(--bg-secondary)]0 rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
 <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
 <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center transform -rotate-6">
 <Trophy className="w-8 h-8 text-[var(--text-primary)]" />
 </div>
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight mb-2">My Rewards Dashboard</h1>
 <p className="text-[var(--text-muted)] max-w-xl text-lg">Track your team's progress, fulfill your tasks, and claim your well-deserved rewards.</p>
 </div>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex gap-2 mb-10 bg-white p-2 border border-[var(--border)] sticky top-6 z-40 overflow-x-auto">
 {[
 { id: 'current', label: 'Current Rewards', icon: Gift },
 { id: 'upcoming', label: 'Upcoming', icon: Calendar },
 { id: 'history', label: 'Reward History', icon: CheckCircle2 }
 ].map(tab => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all ${
 isActive ? 'bg-[var(--surface)] text-[var(--text-primary)] ' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
 }`}
 >
 <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--text-secondary)]' : ''}`} /> {tab.label}
 </button>
 )
 })}
 </div>

 {/* CURRENT REWARDS TAB */}
 {activeTab === 'current' && (
 <div className="space-y-8">
 {currentRewards.length === 0 ? (
 <div className="bg-white border border-[var(--border)] p-12 text-center">
 <Gift className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-6" />
 <h3 className="page-title mb-2">No Active Rewards</h3>
 <p className="text-[var(--text-secondary)] max-w-md mx-auto">There are currently no active rewards for the projects and teams you are assigned to. Keep up the good work!</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
 {/* Left Column: Reward Hero & Timeline */}
 <div className="lg:col-span-2 space-y-8">
 
 {/* Reward Hero Card */}
 {activeReward && (
 <div className="bg-white border border-[var(--border)] overflow-hidden flex flex-col md:flex-row relative">
 <div className="absolute top-6 right-4 z-10">
 <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
 activeReward.status === 'Unlocked' ? 'bg-emerald-500/90 text-white' : 'bg-[var(--surface)]/80 text-white'
 }`}>
 {activeReward.status === 'Unlocked' ? 'Unlocked & Ready' : 'Locked'}
 </span>
 </div>
 {activeReward.image_url ? (
 <div className="md:w-2/5 h-64 md:h-auto bg-[var(--surface-hover)] relative">
 <img src={activeReward.image_url} alt={activeReward.title} className="w-full h-full object-cover" />
 </div>
 ) : (
 <div className="md:w-2/5 h-64 md:h-auto bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center p-8 text-center">
 <div>
 <Gift className="w-16 h-16 text-[var(--text-primary)]/50 mx-auto mb-6" />
 <h3 className="page-title leading-tight">{activeReward.title}</h3>
 </div>
 </div>
 )}
 <div className="p-8 md:w-3/5 flex flex-col justify-center">
 <div className="flex flex-wrap gap-2 mb-6">
 <span className="text-xs font-bold bg-[var(--bg-secondary)] text-[var(--text-primary)] px-2 py-1 uppercase tracking-wider">
 Project: {projects.find(p => p.id === activeReward.project_id)?.name || 'Unknown'}
 </span>
 <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-1 uppercase tracking-wider">
 Team: {activeReward.team_name}
 </span>
 {activeReward.reward_type === 'Premium' && (
 <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-1 uppercase tracking-wider flex items-center gap-1">
 <Crown className="w-3 h-3"/> Premium
 </span>
 )}
 </div>
 
 <h2 className="text-3xl font-extrabold text-[var(--text-primary)] mb-3">{activeReward.title}</h2>
 <p className="text-[var(--text-secondary)] mb-6 text-lg">{activeReward.description}</p>
 
 <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-3 border border-[var(--border)] inline-flex w-fit">
 <Clock className="w-4 h-4 text-[var(--text-primary)]" />
 Deadline: {activeReward.claim_deadline ? new Date(activeReward.claim_deadline).toLocaleString() : 'No Deadline'}
 </div>
 </div>
 </div>
 )}

 {/* Team Progress & Member Status */}
 {activeData && (
 <div className="bg-white border border-[var(--border)] p-8">
 <div className="flex justify-between items-center mb-10">
 <div>
 <h3 className="section-title">Team Progress</h3>
 <p className="text-sm text-[var(--text-secondary)] mt-1">Live tracking of all assigned tasks.</p>
 </div>
 <div className="text-right">
 <span className="text-3xl font-extrabold text-[var(--text-primary)]">{activeData.percentage}%</span>
 </div>
 </div>
 
 <div className="w-full bg-[var(--bg-secondary)] rounded-full h-4 mb-6 overflow-hidden border border-[var(--border)]">
 <div className="bg-[var(--bg-secondary)]0 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${activeData.percentage}%` }}>
 <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
 </div>
 </div>
 <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-10">
 <span>{activeData.completedMembers.length} Members Completed</span>
 <span>{activeData.pendingMembers.length} Members Remaining</span>
 </div>

 <h4 className="text-sm font-bold text-[var(--text-primary)] mb-6 uppercase tracking-wider">Team Member Status</h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 {activeData.completedMembers.map(emp => (
 <div key={emp.id} className="flex items-center justify-between p-3 border border-emerald-100 bg-emerald-50">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-sm">
 {emp.name.charAt(0)}
 </div>
 <span className="font-bold text-emerald-900">{emp.name}</span>
 </div>
 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
 </div>
 ))}
 {activeData.pendingMembers.map(emp => (
 <div key={emp.id} className="flex items-center justify-between p-3 border border-[var(--border)] bg-white">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center justify-center font-bold text-sm">
 {emp.name.charAt(0)}
 </div>
 <div>
 <span className="font-bold text-[var(--text-primary)] block">{emp.name}</span>
 <span className="text-xs text-[var(--text-secondary)]">{emp.remainingTasks} Tasks Left</span>
 </div>
 </div>
 <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded">{emp.status}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Right Column: My Contribution, Claim Box, Timeline */}
 <div className="space-y-8">
 
 {/* My Contribution */}
 {activeData && (
 <div className="bg-[var(--surface)] p-6 text-[var(--text-primary)] relative overflow-hidden">
 <div className="absolute right-0 top-0 w-32 h-32 bg-[var(--bg-secondary)]0 rounded-full blur-3xl opacity-30 -mr-10 -mt-10"></div>
 <h3 className="text-lg font-bold mb-6 relative z-10">My Contribution</h3>
 
 <div className="space-y-6 relative z-10">
 <div>
 <div className="flex justify-between items-end mb-2">
 <span className="text-sm text-[var(--text-muted)]">My Progress</span>
 <span className="text-2xl font-extrabold text-[var(--text-primary)]">{activeData.myProgress}%</span>
 </div>
 <div className="w-full bg-[var(--surface)] rounded-full h-2">
 <div className="bg-white h-full rounded-full" style={{ width: `${activeData.myProgress}%` }}></div>
 </div>
 </div>
 
 <div className="grid grid-cols-2 gap-6">
 <div className="linear-card /50 p-6">
 <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Completed</p>
 <p className="text-xl font-bold">{activeData.myCompleted} <span className="text-sm text-[var(--text-secondary)] font-normal">/ {activeData.myTasks.length} Tasks</span></p>
 </div>
 <div className="linear-card /50 p-6">
 <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Remaining</p>
 <p className="text-xl font-bold text-amber-400">{activeData.myTasks.length - activeData.myCompleted}</p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Claim Box */}
 {activeReward && activeData && (
 <div className="bg-white border border-[var(--border)] p-8 text-center">
 {/* Eligibility Logic */}
 {(() => {
 const myClaim = rewardClaims.find(c => c.reward_id === activeReward.id && c.employee_id === currentUser.id);
 const isTeamDone = activeData.percentage === 100;
 const isMeDone = activeData.myProgress === 100 && activeData.myTasks.length > 0;
 const isUnlocked = activeReward.status === 'Unlocked' || isTeamDone;
 
 const mySubmission = rewardSubmissions?.find(s => s.reward_id === activeReward.id && s.employee_id === currentUser.id);
 
 if (mySubmission) {
 if (mySubmission.status === 'Approved') {
 return (
 <>
 <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <Trophy className="w-8 h-8 text-emerald-600" />
 </div>
 <h3 className="section-title mb-2">Reward Approved!</h3>
 <p className="text-sm text-[var(--text-secondary)] mb-6">Your manager has approved your reward submission.</p>
 <div className="bg-[var(--bg-secondary)] p-3 border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] break-all">
 Reviewed on: {mySubmission.reviewed_at ? new Date(mySubmission.reviewed_at).toLocaleDateString() : 'N/A'}
 </div>
 </>
 );
 } else if (mySubmission.status === 'Rejected') {
 return (
 <>
 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <AlertCircle className="w-8 h-8 text-red-600" />
 </div>
 <h3 className="section-title mb-2">Submission Rejected</h3>
 <p className="text-sm text-[var(--text-secondary)] mb-6 text-red-600">{mySubmission.manager_comments}</p>
 <button onClick={() => handleSubmitForReview(activeReward.id, activeReward.project_id, activeReward.team_name)} className="w-full py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-medium border border-[var(--border)] hover:bg-[var(--btn-primary-hover)] font-bold hover:bg-[var(--btn-primary-hover)]">
 Resubmit for Review
 </button>
 </>
 );
 } else {
 return (
 <>
 <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
 <Clock className="w-8 h-8 text-[var(--text-primary)]" />
 </div>
 <h3 className="section-title mb-2">Submitted for Review</h3>
 <p className="text-sm text-[var(--text-secondary)] mb-6">Your submission is pending manager approval.</p>
 </>
 );
 }
 }

 if (isUnlocked && isMeDone) {
 return (
 <>
 <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
 <Unlock className="w-8 h-8 text-[var(--text-primary)]" />
 </div>
 <h3 className="section-title mb-2">Eligible to Claim!</h3>
 <p className="text-sm text-[var(--text-secondary)] mb-6">Your team has qualified and you have finished your tasks.</p>
 <button onClick={() => handleSubmitForReview(activeReward.id, activeReward.project_id, activeReward.team_name)} className="w-full py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-medium border border-[var(--border)] hover:bg-[var(--btn-primary-hover)] font-bold hover:bg-[var(--btn-primary-hover)] transition-all transform hover:scale-105">
 Submit for Reward Review
 </button>
 </>
 );
 }

 return (
 <>
 <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
 <Lock className="w-8 h-8 text-[var(--text-secondary)]" />
 </div>
 <h3 className="section-title mb-2">Reward Locked</h3>
 <div className="text-sm text-[var(--text-secondary)] space-y-2 mb-6 text-left bg-[var(--bg-secondary)] p-6 border border-[var(--border)]">
 <p className="font-bold text-[var(--text-primary)] mb-2 uppercase text-xs tracking-wider">Waiting For:</p>
 {!isMeDone && <p className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500"/> You to finish your tasks</p>}
 {!isTeamDone && <p className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500"/> {activeData.pendingMembers.length} Team members to finish</p>}
 </div>
 <button disabled className="w-full py-3 bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold cursor-not-allowed">
 Claim Unavailable
 </button>
 </>
 );
 })()}
 </div>
 )}

 {/* Hybrid Timeline */}
 {activeReward && activeData && (() => {
 const mySubmission = rewardSubmissions?.find(s => s.reward_id === activeReward.id && s.employee_id === currentUser.id);
 const isMeDone = activeData.myProgress === 100 && activeData.myTasks.length > 0;
 const isTeamDone = activeData.percentage === 100;
 
 const timeline = [
 { 
 title: 'Reward Created', 
 time: activeReward.created_at ? new Date(activeReward.created_at).toLocaleDateString() : 'Historical', 
 done: true 
 },
 { 
 title: 'Tasks Assigned', 
 time: activeReward.start_date ? new Date(activeReward.start_date).toLocaleDateString() : 'Historical', 
 done: true 
 },
 { 
 title: 'My Tasks Completed', 
 time: isMeDone ? 'Live Status' : 'Pending', 
 done: isMeDone,
 dynamic: true
 },
 { 
 title: 'Team Qualified', 
 time: isTeamDone ? 'Live Status' : 'Pending', 
 done: isTeamDone,
 dynamic: true
 },
 { 
 title: 'Submitted for Review', 
 time: mySubmission ? new Date(mySubmission.submitted_at).toLocaleDateString() : 'Pending', 
 done: !!mySubmission 
 },
 { 
 title: 'Manager Approved', 
 time: mySubmission?.status === 'Approved' ? new Date(mySubmission.reviewed_at).toLocaleDateString() : 'Pending', 
 done: mySubmission?.status === 'Approved' 
 }
 ];

 return (
 <div className="bg-white border border-[var(--border)] p-6">
 <h4 className="text-sm font-bold text-[var(--text-primary)] mb-6 uppercase tracking-wider flex items-center gap-2">
 <Milestone className="w-4 h-4 text-[var(--text-primary)]" /> Reward Timeline
 </h4>
 <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
 {timeline.map((item, idx) => (
 <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
 <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${item.done ? 'border-emerald-500 text-emerald-500' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
 {item.done && <Check className="w-3 h-3" />}
 </div>
 <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 border border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col justify-center">
 <div className="flex items-center justify-between mb-1">
 <span className={`font-bold text-sm ${item.done ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{item.title}</span>
 {item.dynamic && <span className="text-[10px] font-bold bg-[var(--bg-secondary)] text-[var(--text-primary)] px-1.5 py-0.5 rounded uppercase">Live</span>}
 </div>
 <span className="text-xs text-[var(--text-secondary)] font-medium">{item.time}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
 })()}

 </div>
 </div>
 )}
 </div>
 )}

 {/* UPCOMING REWARDS TAB */}
 {activeTab === 'upcoming' && (
 <div className="space-y-6">
 <h2 className="section-title mb-6">Upcoming Rewards</h2>
 {upcomingRewards.length === 0 ? (
 <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-8 text-center">
 <Calendar className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-6" />
 <p className="text-[var(--text-secondary)]">No upcoming rewards scheduled yet.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {upcomingRewards.map(reward => (
 <div key={reward.id} className="bg-white border border-[var(--border)] p-6 flex flex-col items-center text-center opacity-80 hover:opacity-100 transition-opacity">
 <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-6">
 <Lock className="w-8 h-8 text-[var(--text-secondary)]" />
 </div>
 <h3 className="section-title mb-2">{reward.title}</h3>
 <p className="text-sm text-[var(--text-secondary)] mb-6">{reward.description}</p>
 <div className="mt-auto pt-4 border-t border-[var(--border)] w-full text-sm font-bold text-[var(--text-primary)]">
 Unlocks: {new Date(reward.start_date).toLocaleDateString()}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* REWARD HISTORY TAB */}
 {activeTab === 'history' && (
 <div className="space-y-6">
 <h2 className="section-title mb-6">Reward History</h2>
 {historyRewards.length === 0 ? (
 <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-8 text-center">
 <CheckCircle2 className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-6" />
 <p className="text-[var(--text-secondary)]">Your completed and past rewards will appear here.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {historyRewards.map(reward => {
 const mySub = rewardSubmissions?.find(c => c.reward_id === reward.id && c.employee_id === currentUser.id);
 const isClaimed = mySub?.status === 'Approved';
 
 return (
 <div key={reward.id} className="bg-white border border-[var(--border)] p-6 flex items-center gap-6">
 <div className={`w-16 h-16 flex items-center justify-center shrink-0 ${isClaimed ? 'bg-emerald-100 text-emerald-600' : (mySub?.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]')}`}>
 {isClaimed ? <Trophy className="w-8 h-8" /> : (mySub?.status === 'Rejected' ? <AlertCircle className="w-8 h-8" /> : <Clock className="w-8 h-8" />)}
 </div>
 <div className="flex-1">
 <h3 className="card-title">{reward.title}</h3>
 <p className="text-sm text-[var(--text-secondary)] mb-2">{reward.team_name}</p>
 <span className={`text-xs font-bold px-2.5 py-1 uppercase ${isClaimed ? 'bg-emerald-50 text-emerald-700' : (mySub?.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]')}`}>
 {mySub ? mySub.status : reward.status}
 </span>
 </div>
 </div>
 )
 })}
 </div>
 )}
 </div>
 )}

 </div>
 );
}











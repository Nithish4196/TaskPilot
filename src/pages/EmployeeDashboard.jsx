import { useState, useEffect } from 'react';
import { 
 CheckSquare, Clock, AlertCircle, CheckCircle2, 
 FolderGit2, Clock3, Bell, Activity, Gift
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TodaysScheduleWidget from '../components/TodaysScheduleWidget';

export default function EmployeeDashboard() {
 const { currentUser, tasks, getEmployeeActiveProjects, enterpriseRewards, projectTeams } = useAppContext();
 const [currentDate, setCurrentDate] = useState(new Date());

 useEffect(() => {
 const timer = setInterval(() => setCurrentDate(new Date()), 60000);
 return () => clearInterval(timer);
 }, []);

 // Dynamic calculations
 const myTasks = tasks?.filter(t => t.employee_id === currentUser?.id) || [];
 const pendingTasks = myTasks.filter(t => t.status !== 'Completed');
 const completedTasks = myTasks.filter(t => t.status === 'Completed');
 
 const today = new Date().toISOString().split('T')[0];
 const dueToday = pendingTasks.filter(t => t.due_date && t.due_date.startsWith(today)).length;
 
 const now = new Date();
 const upcoming = pendingTasks.filter(t => {
 if (!t.due_date) return false;
 const due = new Date(t.due_date);
 return due > now && due <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
 }).length;
 
 const activeProjectsCount = getEmployeeActiveProjects ? getEmployeeActiveProjects(currentUser?.id).length : 0;
 
 const pendingApprovals = completedTasks.filter(t => t.approval_status === 'Pending').length;
 
 const performanceScore = myTasks.length > 0 
 ? Math.round((completedTasks.length / myTasks.length) * 100) 
 : 0;

 // Rewards logic
 const myTeams = (projectTeams || []).filter(t => t.team_members?.includes(currentUser?.id));
 const myTeamIds = myTeams.map(t => t.id);
 const myRewards = (enterpriseRewards || []).filter(r => 
   r.team_ids?.some(tid => myTeamIds.includes(tid))
 ).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);

 const stats = [
 { label: 'Assigned Tasks', value: pendingTasks.length.toString(), icon: CheckSquare, color: 'text-[var(--text-primary)]', bg: 'bg-[var(--bg-secondary)]' },
 { label: 'Due Today', value: dueToday.toString(), icon: Clock, color: 'text-[var(--text-primary)]', bg: 'bg-[var(--bg-secondary)]' },
 { label: 'Upcoming Deadlines', value: upcoming.toString(), icon: AlertCircle, color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--bg-secondary)]' },
 { label: 'Completed Tasks', value: completedTasks.length.toString(), icon: CheckCircle2, color: 'text-[var(--text-primary)]', bg: 'bg-[var(--bg-secondary)]' },
 { label: 'Active Projects', value: activeProjectsCount.toString(), icon: FolderGit2, color: 'text-[var(--text-primary)]', bg: 'bg-[var(--bg-secondary)]' },
 { label: 'Pending Approvals', value: pendingApprovals.toString(), icon: Clock3, color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--bg-secondary)]' },
 { label: 'Unread Notifications', value: '0', icon: Bell, color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--bg-secondary)]' },
 { label: 'Performance Score', value: `${performanceScore}%`, icon: Activity, color: 'text-[var(--text-primary)]', bg: 'bg-[var(--bg-secondary)]' },
 ];

 return (
 <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-150 pb-24">
 {/* Welcome Section */}
 <div className="linear-card shadow-none overflow-hidden">
 <div className="h-32 bg-[var(--bg-secondary)] border-b border-[var(--border)]"></div>
 <div className="px-8 pb-8 relative">
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="flex items-end gap-6 -mt-12">
 <div className="w-24 h-24 bg-[var(--surface)] border-4 border-[#161616] flex items-center justify-center text-4xl font-bold text-[var(--text-primary)] shrink-0">
 {currentUser?.name ? currentUser.name.charAt(0) : 'E'}
 </div>
 <div className="pb-2">
 <h1 className="page-title">
 Welcome back, {currentUser?.name?.split(' ')[0] || 'Employee'}!
 </h1>
 <p className="text-[var(--text-secondary)] font-medium flex items-center gap-2 mt-1">
 {currentUser?.role || 'Software Engineer'} • {currentUser?.department || 'Engineering'}
 </p>
 </div>
 </div>
 <div className="pb-2 text-left md:text-right">
 <p className="card-title">
 {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
 </p>
 <p className="text-[var(--text-secondary)]">
 {currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-[var(--border)]">
 <div>
 <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Employee ID</p>
 <p className="font-semibold text-[var(--text-primary)]">{currentUser?.id?.slice(0, 8) || 'EMP-001'}</p>
 </div>
 <div>
 <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Team</p>
 <p className="font-semibold text-[var(--text-primary)]">{currentUser?.team || 'Frontend Development'}</p>
 </div>
 <div>
 <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Reporting Manager</p>
 <p className="font-semibold text-[var(--text-primary)]">{currentUser?.reporting_manager || 'Admin'}</p>
 </div>
 <div>
 <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Joining Date</p>
 <p className="font-semibold text-[var(--text-primary)]">
 {currentUser?.date_of_joining ? new Date(currentUser.date_of_joining).toLocaleDateString() : 'Recent'}
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Stats Grid */}
 <div>
 <h2 className="section-title mb-6">Dashboard Overview</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {stats.map((stat, index) => {
 const Icon = stat.icon;
 return (
 <div key={index} className="linear-card p-6 transition-colors hover:border-[var(--border)]">
 <div className="flex items-center gap-6">
 <div className={`w-12 h-12 flex items-center justify-center ${stat.bg} ${stat.color}`}>
 <Icon className="w-6 h-6" />
 </div>
 <div>
 <p className="text-2xl font-extrabold text-[var(--text-primary)]">{stat.value}</p>
 <p className="text-sm font-medium text-[var(--text-secondary)]">{stat.label}</p>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 
      {/* Dynamic Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
 <div className="linear-card p-8 shadow-none text-center">
 <h3 className="card-title mb-2">Ready to start your day?</h3>
 <p className="text-[var(--text-secondary)] mb-6">Check your tasks or submit your daily update.</p>
 <div className="flex justify-center gap-6">
 <button className="btn-primary" onClick={() => window.location.href='/employee/tasks'}>
 View My Tasks
 </button>
 <button className="px-6 py-2.5 bg-[var(--surface)] border border-[#2A2A2A] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-secondary)] transition-colors text-sm" onClick={() => window.location.href='/employee/submission-log'}>
 Submit Daily Update
 </button>
 </div>
 </div>

 {/* Latest Rewards Widget */}
 <div className="linear-card p-6 border border-brand-500/20">
   <div className="flex items-center justify-between mb-4">
     <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
       <Gift className="w-5 h-5 text-brand-500" /> Latest Rewards
     </h3>
     <a href="/employee/rewards" className="text-sm text-brand-500 hover:underline">View All</a>
   </div>
   {myRewards.length === 0 ? (
     <p className="text-sm text-[var(--text-secondary)]">No rewards assigned yet.</p>
   ) : (
     <div className="space-y-4">
       {myRewards.map(r => (
         <div key={r.id} className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border)] flex items-center justify-between">
           <div>
             <h4 className="font-semibold text-[var(--text-primary)]">{r.title}</h4>
             <p className="text-xs text-[var(--text-secondary)] mt-1">{r.description.substring(0, 60)}...</p>
           </div>
           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
             r.status === 'Assigned' ? 'bg-blue-500/10 text-blue-500' :
             r.status === 'Locked' ? 'bg-amber-500/10 text-amber-500' :
             r.status === 'Unlocked' ? 'bg-green-500/10 text-green-500' :
             'bg-purple-500/10 text-purple-500'
           }`}>
             {r.status}
           </span>
         </div>
       ))}
     </div>
   )}
 </div>
 </div>
 </div>
 <div className="lg:col-span-1 h-[400px]">
  <TodaysScheduleWidget />
 </div>
 </div>
 );
}










import { useState, useEffect } from 'react';
import { 
  CheckSquare, Clock, AlertCircle, CheckCircle2, 
  FolderGit2, Clock3, Bell, Activity
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function EmployeeDashboard() {
  const { currentUser } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { label: 'Assigned Tasks', value: '12', icon: CheckSquare, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Due Today', value: '3', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Upcoming Deadlines', value: '5', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Completed Tasks', value: '45', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Projects', value: '2', icon: FolderGit2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending Approvals', value: '1', icon: Clock3, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Unread Notifications', value: '4', icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Performance Score', value: '92%', icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand-600 to-indigo-600"></div>
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-end gap-6 -mt-12">
              <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-brand-600 shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0) : 'E'}
              </div>
              <div className="pb-2">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back, {currentUser?.name?.split(' ')[0] || 'Employee'}!
                </h1>
                <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                  {currentUser?.role || 'Software Engineer'} • {currentUser?.department || 'Engineering'}
                </p>
              </div>
            </div>
            <div className="pb-2 text-left md:text-right">
              <p className="text-lg font-bold text-slate-900">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-slate-500">
                {currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Employee ID</p>
              <p className="font-semibold text-slate-900">{currentUser?.id?.slice(0, 8) || 'EMP-001'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Team</p>
              <p className="font-semibold text-slate-900">{currentUser?.team || 'Frontend Development'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reporting Manager</p>
              <p className="font-semibold text-slate-900">{currentUser?.reporting_manager || 'Admin'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Joining Date</p>
              <p className="font-semibold text-slate-900">
                {currentUser?.date_of_joining ? new Date(currentUser.date_of_joining).toLocaleDateString() : 'Recent'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Dashboard Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions (Placeholder for Phase 2) */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Ready to start your day?</h3>
        <p className="text-slate-500 mb-6">Check your tasks or submit your daily update.</p>
        <div className="flex justify-center gap-4">
          <button className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
            View My Tasks
          </button>
          <button className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors">
            Submit Daily Update
          </button>
        </div>
      </div>
    </div>
  );
}

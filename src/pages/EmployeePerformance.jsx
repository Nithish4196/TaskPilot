import { Activity, CheckCircle2, Clock, Target, TrendingUp, BarChart3, Star } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function EmployeePerformance() {
  const { employeeTasks } = useAppContext();
  
  // Calculate real stats if tasks exist, otherwise mock
  const completedTasks = employeeTasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = employeeTasks.filter(t => t.status !== 'Completed').length;
  const totalTasks = employeeTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    { label: 'Task Completion Rate', value: `${completionRate || 0}%`, icon: Target, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Tasks Completed', value: completedTasks || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Tasks Pending', value: pendingTasks || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Productivity Score', value: '0/100', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Performance</h1>
          <p className="text-slate-500 mt-2">Track your productivity, task completion rates, and overall score.</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area (Mocked visually) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" /> Weekly Productivity Trend
              </h2>
              <select className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none">
                <option>This Month</option>
                <option>Last Month</option>
              </select>
            </div>
            
            {/* Visual representation of a bar chart */}
            <div className="h-64 flex items-end justify-between gap-2 md:gap-4 pt-4 border-b border-slate-200 pb-4">
              {[0, 0, 0, 0, 0, 0, 0].map((height, i) => (
                <div key={i} className="w-full flex flex-col items-center gap-2 group">
                  <div className="w-full bg-slate-100 rounded-t-md relative flex items-end justify-center h-full">
                    <div 
                      className="w-full bg-brand-500 rounded-t-md transition-all group-hover:bg-brand-600" 
                      style={{ height: `${height}%` }}
                    ></div>
                    {/* Tooltip */}
                    <div className="absolute -top-8 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {height}%
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">Week {i+1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-brand-600" /> Project Contribution
            </h2>
            <div className="space-y-6">
              <div className="text-center py-6 text-slate-500 text-sm">
                No active project contributions yet.
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <Star className="absolute -right-4 -top-4 w-24 h-24 text-white opacity-10" />
            <h3 className="text-lg font-bold mb-1 relative z-10">Performance Rating</h3>
            <p className="text-brand-100 text-sm mb-6 relative z-10">Based on manager reviews</p>
            <div className="flex items-end gap-2 relative z-10">
              <span className="text-5xl font-extrabold tracking-tight">0.0</span>
              <span className="text-brand-200 font-bold mb-1">/ 5.0</span>
            </div>
            <div className="flex gap-1 mt-4 relative z-10">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className="w-5 h-5 text-brand-300 fill-brand-300/30" />
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Feedback</h3>
            <div className="space-y-4">
              <div className="text-center py-6 text-slate-500 text-sm">
                No feedback received yet.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  BarChart3, Users, Target, CheckCircle, Clock, FileText, Download, 
  HeartPulse, TrendingUp, AlertCircle, Award, Briefcase, ChevronDown 
} from 'lucide-react';
import { exportToCSV, printReport } from '../utils/exportUtils';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell 
} from 'recharts';
import { GoogleGenerativeAI } from '@google/generative-ai';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ManagerAnalytics() {
  const { 
    projects = [], tasks = [], projectTeams = [], employees = [], daily_updates = [], 
    reward_claims = [], reminders = [] 
  } = useAppContext() || {};

  const [dateRange, setDateRange] = useState('All Time'); 
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const today = new Date();
  
  // --- Data Aggregation Engine ---
  
  // 1. Projects
  const activeProjects = projects.filter(p => p.status === 'Active');
  const completedProjects = projects.filter(p => p.status === 'Completed');
  const delayedProjects = activeProjects.filter(p => new Date(p.end_date) < today);
  
  // 2. Tasks
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const pendingTasks = tasks.filter(t => t.status !== 'Completed');
  const overallTaskCompletion = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  
  // 3. Teams & Employees
  const teamLeaders = employees.filter(e => projectTeams.some(t => t.team_leader_id === e.id));
  const departments = ['All', ...new Set(employees.map(e => e.department).filter(Boolean))];

  // 4. Organization Health Score
  const healthScore = useMemo(() => {
    if (projects.length === 0) return 100;
    const projCompScore = (completedProjects.length / projects.length) * 40;
    const deadlineScore = ((projects.length - delayedProjects.length) / projects.length) * 30;
    const taskScore = (overallTaskCompletion / 100) * 30;
    return Math.round(projCompScore + deadlineScore + taskScore);
  }, [projects.length, completedProjects.length, delayedProjects.length, overallTaskCompletion]);

  const getHealthStatus = (score) => {
    if (score >= 90) return { text: 'Excellent', color: 'text-emerald-500' };
    if (score >= 75) return { text: 'Good', color: 'text-blue-500' };
    if (score >= 60) return { text: 'Needs Attention', color: 'text-amber-500' };
    return { text: 'Critical', color: 'text-red-500' };
  };
  const healthStatus = getHealthStatus(healthScore);

  // --- Visualizations Data ---
  const taskTrendData = useMemo(() => {
    if (!tasks || !tasks.length) return [];
    
    // Group tasks into the last 4 weeks based on created_at or fallback to deadline
    const now = new Date();
    const msInWeek = 7 * 24 * 60 * 60 * 1000;
    
    const weeks = [
      { name: '3 Wks Ago', completed: 0, pending: 0, start: new Date(now.getTime() - 4 * msInWeek), end: new Date(now.getTime() - 3 * msInWeek) },
      { name: '2 Wks Ago', completed: 0, pending: 0, start: new Date(now.getTime() - 3 * msInWeek), end: new Date(now.getTime() - 2 * msInWeek) },
      { name: 'Last Week', completed: 0, pending: 0, start: new Date(now.getTime() - 2 * msInWeek), end: new Date(now.getTime() - 1 * msInWeek) },
      { name: 'This Week', completed: 0, pending: 0, start: new Date(now.getTime() - 1 * msInWeek), end: now }
    ];

    tasks.forEach(t => {
      const taskDate = new Date(t.created_at || t.deadline || new Date());
      for (let i = 0; i < 4; i++) {
        if (taskDate >= weeks[i].start && taskDate <= weeks[i].end) {
          if (t.status === 'Completed') {
            weeks[i].completed++;
          } else {
            weeks[i].pending++;
          }
          break; // Stop checking other weeks
        }
      }
    });

    return weeks.map(w => ({ name: w.name, completed: w.completed, pending: w.pending }));
  }, [tasks]);

  const deptData = useMemo(() => {
    if (!employees.length) return [];
    const counts = {};
    employees.forEach(e => {
      const dept = e.department || 'Unassigned';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [employees]);

  // --- AI Insights Generation ---
  const generateInsights = async () => {
    setLoadingAi(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setAiInsights("VITE_GEMINI_API_KEY is not configured in .env.local. AI Insights are unavailable.");
        setLoadingAi(false);
        return;
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        You are an Enterprise Analytics AI for Taskpilot. Analyze the following live organization metrics and provide 3-4 concise, actionable bullet points highlighting risks, bottlenecks, or top performers.
        
        Metrics:
        - Org Health Score: ${healthScore}%
        - Total Projects: ${projects.length} (${completedProjects.length} completed, ${delayedProjects.length} delayed)
        - Total Tasks: ${tasks.length} (${completedTasks.length} completed)
        - Total Employees: ${employees.length}
        
        Format as plain text bullet points. No markdown asterisks. Keep it professional and strictly based on the numbers.
      `;
      
      const result = await model.generateContent(prompt);
      setAiInsights(result.response.text());
    } catch (error) {
      console.error(error);
      setAiInsights("Failed to load AI insights due to an API error.");
    }
    setLoadingAi(false);
  };

  useEffect(() => {
    generateInsights();
    // eslint-disable-next-line
  }, [healthScore]); // Re-run if major health changes

  // --- Render Helpers ---
  const renderKPICard = (title, value, icon, color, subtitle) => (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)]">{title}</h3>
        <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')} ${color}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
        {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 print:bg-white print:p-0">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            Reports & Analytics
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Real-time organizational insights and performance metrics.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-brand-500"
          >
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-brand-500"
          >
            <option>All Time</option>
            <option>This Month</option>
            <option>This Week</option>
          </select>
          
          <button onClick={() => exportToCSV(projects, 'projects_report.csv')} className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-semibold hover:bg-[var(--bg-secondary)] transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
          
          <button onClick={printReport} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* 1. Executive Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {renderKPICard('Health Score', `${healthScore}%`, <HeartPulse className="w-5 h-5" />, healthStatus.color, `Status: ${healthStatus.text}`)}
        {renderKPICard('Total Projects', projects.length, <Target className="w-5 h-5" />, 'text-blue-500', `${activeProjects.length} Active`)}
        {renderKPICard('Completed Projects', completedProjects.length, <CheckCircle className="w-5 h-5" />, 'text-emerald-500', `${delayedProjects.length} Delayed`)}
        {renderKPICard('Total Employees', employees.length, <Users className="w-5 h-5" />, 'text-indigo-500', `${teamLeaders.length} Team Leaders`)}
        {renderKPICard('Total Tasks', tasks.length, <Briefcase className="w-5 h-5" />, 'text-amber-500', `${overallTaskCompletion}% Completion`)}
        {renderKPICard('Total Rewards', reward_claims.length, <Award className="w-5 h-5" />, 'text-purple-500', 'Claimed Rewards')}
      </div>

      {/* 12. AI Insights Panel */}
      <div className="bg-gradient-to-r from-brand-900 to-indigo-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden print:bg-white print:text-black print:border">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <HeartPulse className="w-24 h-24" />
        </div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 relative z-10">
          <TrendingUp className="w-5 h-5 text-brand-300" />
          Gemini AI Organization Insights
        </h2>
        <div className="relative z-10 text-brand-100 text-sm leading-relaxed space-y-2 print:text-black">
          {loadingAi ? (
            <p className="animate-pulse">Analyzing live organizational data...</p>
          ) : aiInsights ? (
            aiInsights.split('\n').filter(line => line.trim() !== '').map((line, i) => (
              <p key={i} className="flex gap-2">
                <span className="text-brand-400">•</span>
                {line.replace(/^- /, '')}
              </p>
            ))
          ) : (
            <p>No insights generated.</p>
          )}
        </div>
      </div>

      {/* 16. Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">Task Completion Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={taskTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="completed" name="Completed Tasks" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="pending" name="Pending Tasks" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">Department Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Project Analytics Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden print:break-inside-avoid">
        <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" /> Project Analytics
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3 font-semibold">Project Name</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Deadline</th>
                <th className="px-6 py-3 font-semibold">Completion</th>
                <th className="px-6 py-3 font-semibold">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {projects.map(p => {
                const pTasks = tasks.filter(t => t.project_id === p.id);
                const pComp = pTasks.length ? Math.round((pTasks.filter(t => t.status === 'Completed').length / pTasks.length) * 100) : 0;
                const isDelayed = p.status === 'Active' && new Date(p.end_date) < today;
                return (
                  <tr key={p.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{p.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full ${
                        p.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        p.status === 'Active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{new Date(p.end_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden w-24">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pComp}%` }} />
                        </div>
                        <span className="text-xs font-bold w-8">{pComp}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isDelayed ? (
                        <span className="text-red-500 flex items-center gap-1 font-semibold text-xs"><AlertCircle className="w-3 h-3"/> Delayed</span>
                      ) : pComp === 100 ? (
                        <span className="text-emerald-500 flex items-center gap-1 font-semibold text-xs"><CheckCircle className="w-3 h-3"/> On Track</span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-1 font-semibold text-xs"><TrendingUp className="w-3 h-3"/> In Progress</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {projects.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[var(--text-secondary)]">No projects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Team Analytics Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden print:break-inside-avoid">
        <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Team Analytics
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3 font-semibold">Team Name</th>
                <th className="px-6 py-3 font-semibold">Team Leader</th>
                <th className="px-6 py-3 font-semibold">Project</th>
                <th className="px-6 py-3 font-semibold">Members</th>
                <th className="px-6 py-3 font-semibold">Productivity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {projectTeams.map(t => {
                const tl = employees.find(e => e.id === t.team_leader_id);
                const proj = projects.find(p => p.id === t.project_id);
                const tTasks = tasks.filter(task => task.team_id === t.id);
                const comp = tTasks.length ? Math.round((tTasks.filter(x => x.status === 'Completed').length / tTasks.length) * 100) : 0;
                
                return (
                  <tr key={t.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{t.team_name}</td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{tl?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{proj?.name || 'Unknown Project'}</td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{t.team_members?.length || 0} Employees</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden w-24">
                          <div className={`h-full rounded-full ${comp > 75 ? 'bg-emerald-500' : comp > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${comp}%` }} />
                        </div>
                        <span className="text-xs font-bold w-8">{comp}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {projectTeams.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[var(--text-secondary)]">No teams found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

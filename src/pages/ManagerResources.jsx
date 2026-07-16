import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, Users, Activity, BarChart3, Briefcase, Calendar, AlertTriangle } from 'lucide-react';

export default function ManagerResources() {
 const { employees, getEmployeeWorkload, getEmployeeActiveProjects, getEmployeeAvailabilityStatus, projects, tasks } = useAppContext();
 
 const [searchQuery, setSearchQuery] = useState('');
 const [deptFilter, setDeptFilter] = useState('');
 const [statusFilter, setStatusFilter] = useState('');

 const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

 const resourceData = useMemo(() => {
 return employees.map(emp => {
 const workload = getEmployeeWorkload(emp.id);
 const activeProjs = getEmployeeActiveProjects(emp.id);
 const status = getEmployeeAvailabilityStatus(workload);
 
 // Calculate active tasks
 const activeTasksCount = tasks.filter(t => t.employee_id === emp.id && t.status !== 'Completed').length;
 const completedTasksCount = tasks.filter(t => t.employee_id === emp.id && t.status === 'Completed').length;

 // Find if they are working on any cross-department projects
 const crossDeptProjs = activeProjs.filter(p => p.department && p.department !== emp.department);

 return {
 ...emp,
 workload,
 activeProjs,
 status,
 activeTasksCount,
 completedTasksCount,
 crossDeptProjs
 };
 });
 }, [employees, getEmployeeWorkload, getEmployeeActiveProjects, getEmployeeAvailabilityStatus, tasks]);

 const filteredResources = useMemo(() => {
 return resourceData.filter(emp => {
 const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
 (emp.designation && emp.designation.toLowerCase().includes(searchQuery.toLowerCase()));
 const matchesDept = deptFilter ? emp.department === deptFilter : true;
 const matchesStatus = statusFilter ? emp.status === statusFilter : true;
 
 return matchesSearch && matchesDept && matchesStatus;
 });
 }, [resourceData, searchQuery, deptFilter, statusFilter]);

 // Summary stats
 const totalEmployees = resourceData.length;
 const availableCount = resourceData.filter(r => r.status === 'Available').length;
 const fullCapacityCount = resourceData.filter(r => r.status === 'Full Capacity').length;

 return (
 <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-2 duration-150">
 
 <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
 <div>
 <h1 className="page-title">Resource Management</h1>
 <p className="text-[var(--text-secondary)] mt-1">Monitor employee bandwidth, active projects, and cross-department assignments.</p>
 </div>
 </div>

 {/* Stats row */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
 <div className="bg-white border border-[var(--border)] p-6 flex items-center gap-6">
 <div className="w-12 h-12 bg-[var(--bg-secondary)] flex items-center justify-center"><Users className="w-6 h-6 text-[var(--text-secondary)]" /></div>
 <div><p className="text-sm font-bold text-[var(--text-secondary)]">Total Workforce</p><p className="text-2xl font-extrabold text-[var(--text-primary)]">{totalEmployees}</p></div>
 </div>
 <div className="bg-white border border-emerald-200 p-6 flex items-center gap-6">
 <div className="w-12 h-12 bg-emerald-100 flex items-center justify-center"><Activity className="w-6 h-6 text-emerald-600" /></div>
 <div><p className="text-sm font-bold text-emerald-700">Available Resources</p><p className="text-2xl font-extrabold text-emerald-900">{availableCount}</p></div>
 </div>
 <div className="bg-white border border-amber-200 p-6 flex items-center gap-6">
 <div className="w-12 h-12 bg-amber-100 flex items-center justify-center"><BarChart3 className="w-6 h-6 text-amber-600" /></div>
 <div><p className="text-sm font-bold text-amber-700">At Full Capacity</p><p className="text-2xl font-extrabold text-amber-900">{fullCapacityCount}</p></div>
 </div>
 <div className="bg-white border border-[var(--border)] p-6 flex items-center gap-6">
 <div className="w-12 h-12 bg-[var(--bg-secondary)] flex items-center justify-center"><Briefcase className="w-6 h-6 text-[var(--text-primary)]" /></div>
 <div><p className="text-sm font-bold text-[var(--text-primary)]">Active Projects</p><p className="text-2xl font-extrabold text-[var(--text-primary)]">{projects.filter(p=>p.status==='Active').length}</p></div>
 </div>
 </div>

 {/* Filters */}
 <div className="bg-white p-6 border border-[var(--border)] flex flex-col md:flex-row gap-6 mb-10">
 <div className="flex-1 relative">
 <Search className="w-5 h-5 absolute left-3 top-3 text-[var(--text-secondary)]" />
 <input type="text" placeholder="Search employees..." className="w-full pl-10 pr-4 py-2 border focus:ring-2 focus:ring-[var(--ring-focus)] outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
 </div>
 <div className="flex gap-6">
 <select className="px-4 py-2 border text-sm outline-none" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
 <option value="">All Departments</option>
 {departments.map(d => <option key={d} value={d}>{d}</option>)}
 </select>
 <select className="px-4 py-2 border text-sm outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
 <option value="">All Statuses</option>
 <option value="Available">Available</option>
 <option value="Moderate Workload">Moderate Workload</option>
 <option value="Busy">Busy</option>
 <option value="Full Capacity">Full Capacity</option>
 </select>
 </div>
 </div>

 {/* Resource Table */}
 <div className="bg-white border border-[var(--border)] overflow-hidden">
 <div className="linear-table-container">
 <table className="linear-table">
 <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
 <tr>
 <th className="p-6 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Employee</th>
 <th className="p-6 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Department</th>
 <th className="p-6 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Workload</th>
 <th className="p-6 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Projects / Tasks</th>
 <th className="p-6 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Cross-Dept Assignments</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredResources.length === 0 ? (
 <tr><td colSpan="5" className="p-8 text-center text-[var(--text-secondary)] italic">No resources match your filters.</td></tr>
 ) : (
 filteredResources.map(emp => {
 let statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
 if (emp.status === 'Moderate Workload') statusColor = 'badge-progress border-blue-200';
 if (emp.status === 'Busy') statusColor = 'bg-amber-100 text-amber-800 border-amber-200';
 if (emp.status === 'Full Capacity') statusColor = 'badge-rejected border-red-200';

 return (
 <tr key={emp.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
 <td className="p-6">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)] flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
 {emp.name.charAt(0)}
 </div>
 <div>
 <p className="text-sm font-bold text-[var(--text-primary)]">{emp.name}</p>
 <p className="text-[10px] text-[var(--text-secondary)]">{emp.designation}</p>
 </div>
 </div>
 </td>
 <td className="p-6">
 <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded uppercase tracking-wide border border-[var(--border)]">{emp.department}</span>
 </td>
 <td className="p-6">
 <div className="flex flex-col items-start gap-1">
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${statusColor}`}>
 {emp.status}
 </span>
 <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full mt-1 overflow-hidden w-24">
 <div className={`h-full ${emp.workload > 90 ? 'bg-red-500' : emp.workload > 75 ? 'bg-amber-500' : emp.workload > 50 ? 'bg-blue-500' : 'bg-emerald-500'}`} style={{width: `${emp.workload}%`}}></div>
 </div>
 <span className="text-[10px] text-[var(--text-secondary)]">{emp.workload}% Capacity</span>
 </div>
 </td>
 <td className="p-6">
 <p className="text-sm text-[var(--text-primary)] font-bold">{emp.activeProjs.length} <span className="font-normal text-[var(--text-secondary)]">Active Projects</span></p>
 <p className="text-xs text-[var(--text-secondary)] mt-1">{emp.activeTasksCount} Pending Tasks • {emp.completedTasksCount} Completed</p>
 </td>
 <td className="p-6">
 {emp.crossDeptProjs.length > 0 ? (
 <div className="space-y-1">
 {emp.crossDeptProjs.map(p => (
 <div key={p.id} className="text-xs flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-100">
 <AlertTriangle className="w-3 h-3" />
 <span className="font-bold truncate max-w-[120px]">{p.name}</span>
 <span className="opacity-75">({p.department})</span>
 </div>
 ))}
 </div>
 ) : (
 <span className="text-xs text-[var(--text-secondary)] italic">None</span>
 )}
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}








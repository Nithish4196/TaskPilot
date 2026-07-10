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
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Resource Management</h1>
          <p className="text-slate-500 mt-1">Monitor employee bandwidth, active projects, and cross-department assignments.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center"><Users className="w-6 h-6 text-slate-600" /></div>
          <div><p className="text-sm font-bold text-slate-500">Total Workforce</p><p className="text-2xl font-extrabold text-slate-900">{totalEmployees}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center"><Activity className="w-6 h-6 text-emerald-600" /></div>
          <div><p className="text-sm font-bold text-emerald-700">Available Resources</p><p className="text-2xl font-extrabold text-emerald-900">{availableCount}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center"><BarChart3 className="w-6 h-6 text-amber-600" /></div>
          <div><p className="text-sm font-bold text-amber-700">At Full Capacity</p><p className="text-2xl font-extrabold text-amber-900">{fullCapacityCount}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-brand-200 p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center"><Briefcase className="w-6 h-6 text-brand-600" /></div>
          <div><p className="text-sm font-bold text-brand-700">Active Projects</p><p className="text-2xl font-extrabold text-brand-900">{projects.filter(p=>p.status==='Active').length}</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
          <input type="text" placeholder="Search employees..." className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-4">
          <select className="px-4 py-2 border rounded-xl text-sm outline-none" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="px-4 py-2 border rounded-xl text-sm outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Moderate Workload">Moderate Workload</option>
            <option value="Busy">Busy</option>
            <option value="Full Capacity">Full Capacity</option>
          </select>
        </div>
      </div>

      {/* Resource Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Workload</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Projects / Tasks</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cross-Dept Assignments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResources.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500 italic">No resources match your filters.</td></tr>
              ) : (
                filteredResources.map(emp => {
                  let statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  if (emp.status === 'Moderate Workload') statusColor = 'bg-blue-100 text-blue-800 border-blue-200';
                  if (emp.status === 'Busy') statusColor = 'bg-amber-100 text-amber-800 border-amber-200';
                  if (emp.status === 'Full Capacity') statusColor = 'bg-red-100 text-red-800 border-red-200';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{emp.name}</p>
                            <p className="text-[10px] text-slate-500">{emp.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded uppercase tracking-wide border border-slate-200">{emp.department}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${statusColor}`}>
                            {emp.status}
                          </span>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden w-24">
                            <div className={`h-full ${emp.workload > 90 ? 'bg-red-500' : emp.workload > 75 ? 'bg-amber-500' : emp.workload > 50 ? 'bg-blue-500' : 'bg-emerald-500'}`} style={{width: `${emp.workload}%`}}></div>
                          </div>
                          <span className="text-[10px] text-slate-500">{emp.workload}% Capacity</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-700 font-bold">{emp.activeProjs.length} <span className="font-normal text-slate-500">Active Projects</span></p>
                        <p className="text-xs text-slate-500 mt-1">{emp.activeTasksCount} Pending Tasks • {emp.completedTasksCount} Completed</p>
                      </td>
                      <td className="p-4">
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
                          <span className="text-xs text-slate-400 italic">None</span>
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

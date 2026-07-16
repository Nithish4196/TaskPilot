import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Mail, ShieldCheck, Clock, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Employees = () => {
 const { employees } = useAppContext();
 
 // Group employees by department
 const groupedEmployees = employees.reduce((acc, emp) => {
 const dept = emp.department || 'Unassigned';
 if (!acc[dept]) acc[dept] = [];
 acc[dept].push(emp);
 return acc;
 }, {});

 // State to handle collapsible departments
 const [expandedDepts, setExpandedDepts] = useState(
 Object.keys(groupedEmployees).reduce((acc, key) => ({ ...acc, [key]: true }), {})
 );

 const toggleDept = (dept) => {
 setExpandedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
 };

 return (
 <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-150 pb-24">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
 <div>
 <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">Team Members</h1>
 <p className="text-[var(--text-secondary)] mt-1">Manage your team, send invites, and view statuses across departments.</p>
 </div>
 <Link 
 className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold border border-[var(--border)] hover:bg-[var(--btn-primary-hover)] transition-all"
 >
 <UserPlus className="w-5 h-5" />
 Add Employee
 </Link>
 </div>

 {employees.length === 0 ? (
 <div className="bg-[var(--surface)] border border-dashed border-[#111111] p-12 text-center flex flex-col items-center">
 <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-6">
 <UserPlus className="w-8 h-8 text-[var(--text-secondary)]" />
 </div>
 <h3 className="section-title mb-2">No employees yet</h3>
 <p className="text-[var(--text-secondary)] mb-6 max-w-sm">Start building your team by adding employees and sending them invitation links.</p>
 <Link 
 className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--btn-primary-bg)] border border-[var(--border)] text-[var(--btn-primary-text)] font-bold hover:bg-[var(--btn-primary-hover)] transition-all"
 >
 Add Your First Employee
 </Link>
 </div>
 ) : (
 <div className="space-y-6">
 {Object.entries(groupedEmployees).sort(([a], [b]) => a.localeCompare(b)).map(([dept, emps]) => (
 <div key={dept} className="linear-card overflow-hidden transition-all duration-150">
 <div 
 className="bg-[var(--bg-secondary)] border-b border-[var(--border)] p-6 flex items-center justify-between cursor-pointer select-none"
 onClick={() => toggleDept(dept)}
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center">
 <Building2 className="w-5 h-5" />
 </div>
 <div>
 <h2 className="card-title">{dept}</h2>
 <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{emps.length} Members</p>
 </div>
 </div>
 <div className="text-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-secondary)] p-2 rounded-full border border-[var(--border)]">
 {expandedDepts[dept] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
 </div>
 </div>
 
 {expandedDepts[dept] && (
 <div className="overflow-x-auto animate-in slide-in-from-top-2 duration-150">
 <table className="w-full text-left text-sm text-[var(--text-secondary)]">
 <thead className="bg-[var(--surface)] text-xs uppercase font-bold text-[var(--text-secondary)] border-b border-[var(--border)]">
 <tr>
 <th className="px-6 py-4">Employee Name</th>
 <th className="px-6 py-4">Designation / Role</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {emps.map((emp) => (
 <tr key={emp.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center font-bold text-lg border border-[var(--border)]">
 {emp.name.charAt(0)}
 </div>
 <div>
 <div className="font-bold text-[var(--text-primary)] text-base">{emp.name}</div>
 <div className="text-xs text-[var(--text-secondary)]">{emp.email}</div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="font-bold text-[var(--text-primary)]">{emp.designation || 'Team Member'}</div>
 <div className="text-xs text-[var(--text-secondary)]">{emp.role}</div>
 </td>
 <td className="px-6 py-4">
 {emp.status === 'Active' ? (
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--border)]">
 <ShieldCheck className="w-4 h-4" />
 Active
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
 <Clock className="w-4 h-4" />
 Pending Invite
 </span>
 )}
 </td>
 <td className="px-6 py-4 text-right">
 {emp.status !== 'Active' && (
 <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--border)] hover:text-[var(--text-primary)] transition-all">
 <Mail className="w-4 h-4" />
 Resend Invite
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 );
};

export default Employees;









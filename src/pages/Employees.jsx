import { Link } from 'react-router-dom';
import { UserPlus, Mail, ShieldCheck, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Employees = () => {
  const { employees } = useAppContext();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Team Members</h1>
          <p className="text-slate-500 mt-1">Manage your team, send invites, and view statuses.</p>
        </div>
        <Link 
          to="/add-employee"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-medium rounded-lg shadow-sm hover:bg-brand-700 hover:shadow transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Add Employee
        </Link>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No employees yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm">Start building your team by adding employees and sending them invitation links.</p>
          <Link 
            to="/add-employee"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-brand-200 text-brand-700 font-bold rounded-xl hover:bg-brand-50 hover:border-brand-300 transition-all"
          >
            Add Your First Employee
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department / Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-xs text-slate-500">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{emp.department}</div>
                      <div className="text-xs text-slate-500">{emp.role}</div>
                    </td>
                    <td className="px-6 py-4">
                      {emp.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          Invited - Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {emp.status !== 'Active' && (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-all">
                          <Mail className="w-3.5 h-3.5" />
                          Resend Invite
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;

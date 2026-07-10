import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Folders, FileText,
  Calendar, Bell, Award, FileStack, Settings, LogOut, Briefcase, User, Activity
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const EmployeeLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAppContext();

  const navItems = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', path: '/employee/tasks', icon: CheckSquare },
    { name: 'My Projects', path: '/employee/projects', icon: Folders },
    { name: 'Daily Update', path: '/employee/daily-updates', icon: FileText },
    { name: 'Calendar', path: '/employee/calendar', icon: Calendar },
    { name: 'Notifications', path: '/employee/notifications', icon: Bell },
    { name: 'Performance', path: '/employee/performance', icon: Activity },
    { name: 'Rewards', path: '/employee/rewards', icon: Award },
    { name: 'Documents', path: '/employee/documents', icon: FileStack },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="flex-1 overflow-y-auto">
          <div className="h-16 flex items-center px-6 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2 text-brand-600">
              <img src="/logo.png" alt="Taskpilot Logo" className="h-10 w-auto object-contain" />
              <span className="text-xl font-bold tracking-tight">Taskpilot</span>
            </div>
            <div className="ml-auto text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">Employee</div>
          </div>
          <nav className="p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2 mt-2">Work</div>
            {navItems.slice(0, 4).map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2 mt-6">Company</div>
            {navItems.slice(4).map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
          <Link to="/employee/profile" className="mb-4 px-3 py-2 flex items-center gap-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors block">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700 text-sm shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0) : 'E'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.name || 'Employee'}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
            </div>
          </Link>
          <Link to="/employee/settings" className="flex items-center gap-3 px-3 py-2 w-full text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-colors">
            <Settings className="w-5 h-5 text-slate-400" />
            Settings
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-md transition-colors mt-1">
            <LogOut className="w-5 h-5 text-red-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-2 text-brand-600">
            <img src="/logo.png" alt="Taskpilot Logo" className="h-8 w-auto object-contain" />
            <span className="text-lg font-bold">Taskpilot</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600"><LogOut className="w-5 h-5" /></button>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default EmployeeLayout;

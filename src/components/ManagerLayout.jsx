import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, Settings, LogOut, Gift } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const ManagerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAppContext();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: UserPlus },
    { name: 'Resources', path: '/manager/resources', icon: Users },
    { name: 'Leaderboard', path: '/leaderboard', icon: Users },
    { name: 'Weekend Rewards', path: '/manager/rewards', icon: Gift },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="flex items-center gap-2 text-brand-600">
              <img src="/logo.png" alt="Taskpilot Logo" className="h-10 w-auto object-contain" />
              <span className="text-xl font-bold tracking-tight">Taskpilot</span>
            </div>
            <div className="ml-auto text-xs font-bold px-2 py-1 bg-brand-100 text-brand-700 rounded-md">Manager</div>
          </div>
          <nav className="p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Main Menu</div>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === '/employees' && location.pathname === '/add-employee');
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive 
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
        <div className="p-4 border-t border-slate-100">
          <div className="mb-4 px-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
              {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button className="flex items-center gap-3 px-3 py-2 w-full text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-colors">
            <Settings className="w-5 h-5 text-slate-400" />
            Settings
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-md transition-colors mt-1">
            <LogOut className="w-5 h-5 text-red-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header (Optional) */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-2 text-brand-600">
            <img src="/logo.png" alt="Taskpilot Logo" className="h-8 w-auto object-contain" />
            <span className="text-lg font-bold">Taskpilot</span>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ManagerLayout;

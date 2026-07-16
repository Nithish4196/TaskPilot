import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, Settings, LogOut, Gift, BarChart3, Archive, Trophy, Moon, Sun } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const ManagerLayout = () => {
 const location = useLocation();
 const navigate = useNavigate();
 const { logout, currentUser } = useAppContext();

 const navItems = [
 { name: 'Dashboard', path: '/', icon: LayoutDashboard },
 { name: 'Employees', path: '/employees', icon: Users },
 { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
 { name: 'Completed Projects', path: '/completed-projects', icon: Archive },
 { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
 { name: 'Weekend Rewards', path: '/manager/rewards', icon: Gift },
 ];

 const handleLogout = () => {
 logout();
 navigate('/login');
 };

 return (
 <div className="flex h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)] overflow-hidden transition-colors duration-150">
 {/* Sidebar */}
 <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col justify-between hidden md:flex shrink-0 transition-colors duration-150">
 <div>
 <div className="h-16 flex items-center px-6 border-b border-[var(--border)]">
 <div className="flex items-center gap-2 text-[var(--text-primary)]">
 <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Taskpilot</span>
 </div>
 <div className="ml-auto text-[10px] font-semibold px-2 py-0.5 border border-[var(--border)] text-[var(--text-primary)] uppercase tracking-wider rounded">Manager</div>
 </div>
 <nav className="p-4 space-y-1">
 <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 px-3">Main Menu</div>
 {navItems.map((item) => {
 const isActive = location.pathname === item.path || (item.path === '/employees' && location.pathname === '/add-employee');
 const Icon = item.icon;
 return (
 <Link
 key={item.name}
 to={item.path}
 className={`flex items-center gap-3 px-3 h-[44px] text-[15px] rounded-[10px] transition-colors duration-150 ${
 isActive 
 ? 'bg-[#111111] text-[#FFFFFF] font-[500]' 
 : 'text-[var(--text-secondary)] hover:bg-[#F5F5F5] hover:text-[var(--text-primary)]'
 }`}
 >
 <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#FFFFFF]' : 'text-[var(--text-secondary)] opacity-80'}`} strokeWidth={isActive ? 2.5 : 2} />
 {item.name}
 </Link>
 );
 })}
 </nav>
 </div>
 <div className="p-4 border-t border-[var(--border)] space-y-1">
 <div className="my-2 px-3 flex items-center gap-3">
 <div className="w-8 h-8 rounded border border-[var(--border)] flex items-center justify-center font-semibold text-[var(--text-primary)] text-sm">
 {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
 </div>
 <div className="flex-1 overflow-hidden">
 <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{currentUser?.name || 'Admin'}</p>
 <p className="text-xs text-[var(--text-secondary)] truncate">{currentUser?.email}</p>
 </div>
 </div>
 <button className="flex items-center gap-3 px-3 py-2 w-full text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors duration-150">
 <Settings className="w-4 h-4 opacity-70" />
 Settings
 </button>
 

 <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors duration-150">
 <LogOut className="w-4 h-4 opacity-70" />
 Logout
 </button>
 </div>
 </aside>

 {/* Main Content Area */}
 <main className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)]">
 {/* Mobile Header */}
 <header className="md:hidden h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center px-4 justify-between shrink-0">
 <div className="flex items-center gap-2 text-[var(--text-primary)]">
 <span className="card-title">Taskpilot</span>
 </div>
 </header>

 {/* Scrollable Page Content */}
 <div className="flex-1 overflow-y-auto">
 <div className="max-w-[1600px] mx-auto w-full p-6 md:p-8">
 <Outlet />
 </div>
 </div>
 </main>
 </div>
 );
};

export default ManagerLayout;







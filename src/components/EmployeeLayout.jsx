import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
 LayoutDashboard, CheckSquare, Folders, FileText,
 Calendar as CalendarIcon, Bell, Award, FileStack, Settings, LogOut, Briefcase, User, Activity, Archive, Moon, Sun, Crown
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const EmployeeLayout = () => {
 const location = useLocation();
 const navigate = useNavigate();
 const { logout, currentUser, isTeamLeader } = useAppContext();

 const isLeader = currentUser ? isTeamLeader(currentUser.id) : false;

 const navItems = [
 { name: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
 { name: 'My Tasks', path: '/employee/tasks', icon: CheckSquare },
 { name: 'My Projects', path: '/employee/projects', icon: Folders },
 { name: 'Calendar', path: '/employee/calendar', icon: CalendarIcon },
 { name: 'Notifications', path: '/employee/notifications', icon: Bell },
 { name: 'Performance', path: '/employee/performance', icon: Activity },
 { name: 'Feedback', path: '/employee/feedback', icon: Award },
 { name: 'Rewards', path: '/employee/rewards', icon: Award },
 { name: 'Documents', path: '/employee/documents', icon: FileStack },
 ];

 const handleLogout = () => {
 logout();
 navigate('/login');
 };

 return (
 <div className="flex h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)] overflow-hidden transition-colors duration-150">
 {/* Sidebar */}
 <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col justify-between hidden md:flex shrink-0 transition-colors duration-150">
 <div className="flex-1 overflow-y-auto">
 <div className="h-16 flex items-center px-6 border-b border-[var(--border)] sticky top-0 bg-[var(--surface)] z-10 transition-colors duration-150">
 <div className="flex items-center gap-2 text-[var(--text-primary)]">
 <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Taskpilot</span>
 </div>
 <div className="ml-auto text-[10px] font-semibold px-2 py-0.5 border border-[var(--border)] text-[var(--text-primary)] uppercase tracking-wider rounded">Employee</div>
 </div>
 <nav className="p-4 space-y-1">
 <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 px-3 mt-2">Work</div>
 {navItems.slice(0, 4).map((item) => {
 const isActive = location.pathname.startsWith(item.path);
 const Icon = item.icon;
 return (
 <Link
 key={item.name}
 to={item.path}
 className={`flex items-center gap-3 px-3 h-[44px] text-[15px] rounded-[10px] transition-colors duration-150 ${isActive
 ? 'bg-[#111111] text-[#FFFFFF] font-[500]'
 : 'text-[var(--text-secondary)] hover:bg-[#F5F5F5] hover:text-[var(--text-primary)]'
 }`}
 >
 <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#FFFFFF]' : 'text-[var(--text-secondary)] opacity-80'}`} strokeWidth={isActive ? 2.5 : 2} />
 {item.name}
 </Link>
 );
 })}

 {isLeader && (
 <>
 <div className="text-[10px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4 px-3 mt-6">Team Leader</div>
 <Link
 to="/employee/team-leader"
 className={`flex items-center gap-3 px-3 h-[44px] text-[15px] rounded-[10px] transition-colors duration-150 ${location.pathname.startsWith('/employee/team-leader')
 ? 'bg-[#111111] text-[#FFFFFF] font-[500]'
 : 'text-[var(--text-secondary)] hover:bg-[#F5F5F5] hover:text-[var(--text-primary)]'
 }`}
 >
 <Briefcase className={`w-[18px] h-[18px] ${location.pathname.startsWith('/employee/team-leader') ? 'text-[#FFFFFF]' : 'text-[var(--text-secondary)] opacity-80'}`} strokeWidth={location.pathname.startsWith('/employee/team-leader') ? 2.5 : 2} />
 Task Management
 </Link>
 <Link
 to="/employee/calendar"
 className={`flex items-center gap-3 px-3 h-[44px] text-[15px] rounded-[10px] transition-colors duration-150 ${location.pathname === '/employee/calendar'
 ? 'bg-[#111111] text-[#FFFFFF] font-[500]'
 : 'text-[var(--text-secondary)] hover:bg-[#F5F5F5] hover:text-[var(--text-primary)]'
 }`}
 >
 <CalendarIcon className={`w-[18px] h-[18px] ${location.pathname === '/employee/calendar' ? 'text-[#FFFFFF]' : 'text-[var(--text-secondary)] opacity-80'}`} strokeWidth={location.pathname === '/employee/calendar' ? 2.5 : 2} />
 Calendar
 </Link>
 <Link
 to="/employee/team-rewards"
 className={`flex items-center gap-3 px-3 h-[44px] text-[15px] rounded-[10px] transition-colors duration-150 ${location.pathname.startsWith('/employee/team-rewards')
 ? 'bg-[#111111] text-[#FFFFFF] font-[500]'
 : 'text-[var(--text-secondary)] hover:bg-[#F5F5F5] hover:text-[var(--text-primary)]'
 }`}
 >
 <Crown className={`w-[18px] h-[18px] ${location.pathname.startsWith('/employee/team-rewards') ? 'text-[#FFFFFF]' : 'text-[var(--text-secondary)] opacity-80'}`} strokeWidth={location.pathname.startsWith('/employee/team-rewards') ? 2.5 : 2} />
 Team Rewards
 </Link>

 </>
 )}

 <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 px-3 mt-6">Overview & Settings</div>
 {navItems.slice(4).map((item) => {
 const isActive = location.pathname.startsWith(item.path);
 const Icon = item.icon;
 return (
 <Link
 key={item.name}
 to={item.path}
 className={`flex items-center gap-3 px-3 h-[44px] text-[15px] rounded-[10px] transition-colors duration-150 ${isActive
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

 <div className="p-4 border-t border-[var(--border)] shrink-0 bg-[var(--surface)] space-y-1 transition-colors duration-150">
 <Link to="/employee/profile" className="my-2 px-3 flex items-center gap-3 hover:bg-[#F5F5F5] rounded-[10px] cursor-pointer transition-colors duration-150 h-[52px]">
 <div className="w-8 h-8 rounded border border-[var(--border)] flex items-center justify-center font-semibold text-[var(--text-primary)] text-sm shrink-0">
 {currentUser?.name ? currentUser.name.charAt(0) : 'E'}
 </div>
 <div className="flex-1 overflow-hidden">
 <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{currentUser?.name || 'Employee'}</p>
 <p className="text-xs text-[var(--text-secondary)] truncate">{currentUser?.email}</p>
 </div>
 </Link>
 <Link to="/employee/settings" className="flex items-center gap-3 px-3 h-[44px] w-full text-left text-[15px] text-[var(--text-secondary)] hover:bg-[#F5F5F5] hover:text-[var(--text-primary)] rounded-[10px] transition-colors duration-150">
 <Settings className="w-[18px] h-[18px] opacity-80" strokeWidth={2} />
 Settings
 </Link>


 <button onClick={handleLogout} className="flex items-center gap-3 px-3 h-[44px] w-full text-left text-[15px] text-[var(--text-secondary)] hover:bg-[#F5F5F5] hover:text-[var(--text-primary)] rounded-[10px] transition-colors duration-150 mt-1">
 <LogOut className="w-[18px] h-[18px] opacity-80" strokeWidth={2} />
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
 <button onClick={handleLogout} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><LogOut className="w-4 h-4" /></button>
 </header>

 <div className="flex-1 overflow-y-auto">
 <div className="max-w-[1600px] mx-auto w-full p-6 md:p-8">
 <Outlet />
 </div>
 </div>
 </main>
 </div>
 );
};

export default EmployeeLayout;







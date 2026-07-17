const fs = require('fs');

// 1. Update App.jsx
let appCode = fs.readFileSync('src/App.jsx', 'utf8');
if (!appCode.includes('import EnterpriseCalendar')) {
  appCode = appCode.replace('import EmployeeCalendar from \'./pages/EmployeeCalendar\';', 'import EnterpriseCalendar from \'./components/EnterpriseCalendar\';');
  
  // Replace Employee route
  appCode = appCode.replace('<Route path="calendar" element={<EmployeeCalendar />} />', '<Route path="calendar" element={<EnterpriseCalendar />} />');
  
  // Add Manager Route
  const managerRouteInjection = '<Route path="calendar" element={<EnterpriseCalendar />} />\n          <Route path="leaderboard" element={<Leaderboard />} />';
  appCode = appCode.replace('<Route path="leaderboard" element={<Leaderboard />} />', managerRouteInjection);
  
  fs.writeFileSync('src/App.jsx', appCode);
  console.log('App.jsx updated');
}

// 2. Update ManagerLayout.jsx
let mgrLayoutCode = fs.readFileSync('src/components/ManagerLayout.jsx', 'utf8');
if (!mgrLayoutCode.includes('Calendar as CalendarIcon')) {
  mgrLayoutCode = mgrLayoutCode.replace('import { LayoutDashboard, Users,', 'import { LayoutDashboard, Users, Calendar as CalendarIcon,');
  const mgrNavSearch = "{ name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },";
  const mgrNavInject = "{ name: 'Calendar', path: '/calendar', icon: CalendarIcon },\n  { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },";
  mgrLayoutCode = mgrLayoutCode.replace(mgrNavSearch, mgrNavInject);
  fs.writeFileSync('src/components/ManagerLayout.jsx', mgrLayoutCode);
  console.log('ManagerLayout.jsx updated');
}

// 3. Update EmployeeLayout.jsx
let empLayoutCode = fs.readFileSync('src/components/EmployeeLayout.jsx', 'utf8');
if (!empLayoutCode.includes('Calendar as CalendarIcon')) {
  empLayoutCode = empLayoutCode.replace('import { LayoutDashboard, Target,', 'import { LayoutDashboard, Target, Calendar as CalendarIcon,');
}
// Check if Team Leader has a Calendar link.
if (!empLayoutCode.includes('to="/employee/tl-calendar"')) {
  const tlLinkInject = `
 <Link
 to="/employee/calendar"
 className={\`flex items-center gap-3 px-3 h-[44px] text-[15px] rounded-[10px] transition-colors duration-150 \${location.pathname === '/employee/calendar'
 ? 'bg-[#111111] text-[#FFFFFF] font-[500]'
 : 'text-[var(--text-secondary)] hover:bg-[#F5F5F5] hover:text-[var(--text-primary)]'
 }\`}
 >
 <CalendarIcon className={\`w-[18px] h-[18px] \${location.pathname === '/employee/calendar' ? 'text-[#FFFFFF]' : 'text-[var(--text-secondary)] opacity-80'}\`} strokeWidth={location.pathname === '/employee/calendar' ? 2.5 : 2} />
 Calendar
 </Link>
`;
  empLayoutCode = empLayoutCode.replace('Task Management\n </Link>', 'Task Management\n </Link>' + tlLinkInject);
  fs.writeFileSync('src/components/EmployeeLayout.jsx', empLayoutCode);
  console.log('EmployeeLayout.jsx updated');
}

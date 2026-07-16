import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ManagerLayout from './components/ManagerLayout';
import EmployeeLayout from './components/EmployeeLayout';
import ManagerDashboard from './pages/ManagerDashboard';
import CreateProject from './pages/CreateProject';
import AddModules from './pages/AddModules';
import ProjectDetail from './pages/ProjectDetail';
import Leaderboard from './pages/Leaderboard';
import ManagerRewards from './pages/ManagerRewards';
import ManagerResources from './pages/ManagerResources';
import Employees from './pages/Employees';
import AddEmployeeWizard from './pages/AddEmployeeWizard';
import AcceptInvite from './pages/AcceptInvite';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeProfile from './pages/EmployeeProfile';
import EmployeeTasks from './pages/EmployeeTasks';
import EmployeeProjects from './pages/EmployeeProjects';
import DailyUpdates from './pages/DailyUpdates';
import EmployeeCalendar from './pages/EmployeeCalendar';
import EmployeeNotifications from './pages/EmployeeNotifications';
import EmployeePerformance from './pages/EmployeePerformance';
import EmployeeFeedback from './pages/EmployeeFeedback';
import EmployeeRewards from './pages/EmployeeRewards';
import EmployeeDocuments from './pages/EmployeeDocuments';
import EmployeeSettings from './pages/EmployeeSettings';
import TeamLeaderWorkspace from './pages/TeamLeaderWorkspace';
import CompletedProjects from './pages/CompletedProjects';
import { useAppContext } from './context/AppContext';

// Simple wrapper for protected routes
const ProtectedRoute = ({ children, allowedRole }) => {
  const { currentUser, userRole } = useAppContext();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && userRole !== allowedRole) {
    // Redirect to their respective home if they try to access the wrong role's routes
    return <Navigate to={userRole === 'manager' ? '/' : '/employee/dashboard'} replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />

        {/* Manager Routes */}
        <Route path="/" element={<ProtectedRoute allowedRole="manager"><ManagerLayout /></ProtectedRoute>}>
          <Route index element={<ManagerDashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="add-employee" element={<AddEmployeeWizard />} />
          <Route path="create-project" element={<CreateProject />} />
          <Route path="add-modules/:projectId" element={<AddModules />} />
          <Route path="project/:projectId" element={<ProjectDetail />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="manager/rewards" element={<ManagerRewards />} />
          <Route path="manager/resources" element={<ManagerResources />} />
          <Route path="completed-projects" element={<CompletedProjects />} />
        </Route>

        {/* Employee Routes */}
        <Route path="/employee" element={<ProtectedRoute allowedRole="employee"><EmployeeLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="tasks" element={<EmployeeTasks />} />
          <Route path="projects" element={<EmployeeProjects />} />
          <Route path="daily-updates" element={<DailyUpdates />} />
          <Route path="calendar" element={<EmployeeCalendar />} />
          <Route path="notifications" element={<EmployeeNotifications />} />
          <Route path="performance" element={<EmployeePerformance />} />
          <Route path="feedback" element={<EmployeeFeedback />} />
          <Route path="rewards" element={<EmployeeRewards />} />
          <Route path="documents" element={<EmployeeDocuments />} />
          <Route path="settings" element={<EmployeeSettings />} />
          <Route path="team-leader" element={<TeamLeaderWorkspace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

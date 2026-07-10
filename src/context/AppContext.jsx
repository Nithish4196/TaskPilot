import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('taskpilot_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('taskpilot_role') || null;
  });

  const [employees, setEmployees] = useState([]);
  
  // Phase 2 State
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [employeeProjects, setEmployeeProjects] = useState([]);
  const [dailyUpdates, setDailyUpdates] = useState([]);

  // App-wide state (Supabase)
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]); // This replaces 'modules'
  const [teamRewards, setTeamRewards] = useState([]);
  const [rewardClaims, setRewardClaims] = useState([]);
  const [rewardSettings, setRewardSettings] = useState({ allow_multiple_claims: false });

  // Fetch employees from Supabase
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching employees:', error);
      } else {
        setEmployees(data || []);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchGlobalData = async () => {
    try {
      const [projsRes, tasksRes, rewardsRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('team_rewards').select('*').order('week_number', { ascending: true }),
        supabase.from('reward_claims').select('*'),
        supabase.from('reward_settings').select('*').limit(1).single()
      ]);
      if (projsRes.data) setProjects(projsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (rewardsRes.data) setTeamRewards(rewardsRes.data);
      if (claimsRes && claimsRes.data) setRewardClaims(claimsRes.data);
      if (settingsRes && settingsRes.data) setRewardSettings(settingsRes.data);
    } catch (err) {
      console.error('Error fetching global data:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchGlobalData();

    // Setup realtime subscription for employees, projects, and tasks
    const subscription = supabase.channel('public_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => fetchEmployees())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_rewards' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_claims' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_settings' }, () => fetchGlobalData())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Fetch Employee-specific data when logged in as employee
  useEffect(() => {
    if (currentUser && userRole === 'employee') {
      const fetchEmployeeData = async () => {
        try {
          // Fetch Projects where employee is assigned or team member (simplified to all active for now)
          const { data: projs } = await supabase.from('projects').select('*');
          if (projs) setEmployeeProjects(projs);

          // Fetch Tasks assigned to this employee
          const { data: tsks } = await supabase.from('tasks').select('*').eq('employee_id', currentUser.id);
          if (tsks) setEmployeeTasks(tsks);

          // Fetch Daily Updates for this employee
          const { data: updates } = await supabase.from('daily_updates').select('*').eq('employee_id', currentUser.id).order('date', { ascending: false });
          if (updates) setDailyUpdates(updates);

        } catch (err) {
          console.error('Error fetching employee data:', err);
        }
      };

      fetchEmployeeData();
    }
  }, [currentUser, userRole]);



  // Evaluates if any active rewards should be unlocked for employees based on completed tasks
  const evaluateTeamReward = async () => {
    try {
      // 1. Get all Active rewards
      const { data: activeRewards } = await supabase
        .from('team_rewards')
        .select('*')
        .in('status', ['Active', 'Locked']);
      
      if (!activeRewards || activeRewards.length === 0) return;

      for (const reward of activeRewards) {
        // Find team members
        const { data: teamMembers } = await supabase
          .from('employees')
          .select('id')
          .eq('team', reward.team_name);
        
        if (!teamMembers || teamMembers.length === 0) continue;
        const memberIds = teamMembers.map(m => m.id);

        // Find tasks for this team on this project
        let query = supabase.from('tasks').select('*').in('employee_id', memberIds);
        if (reward.project_id) {
          query = query.eq('project_id', reward.project_id);
        }
        
        const { data: teamTasks } = await query;
        if (!teamTasks || teamTasks.length === 0) continue;

        // Check if every task is Completed & Approved
        const allCompleted = teamTasks.every(t => t.status === 'Completed' && t.approval_status === 'Approved');
        
        // Additional custom rules evaluation could happen here for Premium rewards
        let qualifies = allCompleted;

        if (qualifies) {
          // If the reward is Weekly and unlocks for the whole team
          if (reward.status !== 'Unlocked') {
            await supabase.from('team_rewards').update({ status: 'Unlocked' }).eq('id', reward.id);
          }
          
          // Insert claims for every member if not exists
          const claimsToInsert = memberIds.map(empId => ({
            reward_id: reward.id,
            employee_id: empId,
            status: 'Unlocked'
          }));
          
          // Upsert to handle unique constraint (ignore if already unlocked/claimed)
          await supabase.from('reward_claims').upsert(claimsToInsert, { onConflict: 'reward_id, employee_id', ignoreDuplicates: true });
        }
      }
      fetchGlobalData();
    } catch (err) {
      console.error('Error evaluating team rewards:', err);
    }
  };

  const addProject = async (projectData) => {
    // projectData is currently coming from CreateProject.jsx
    try {
      const { data, error } = await supabase.from('projects').insert([{
        name: projectData.name,
        description: projectData.description || null,
        manager_id: projectData.projectManager || null,
        start_date: projectData.startDate || new Date().toISOString().split('T')[0],
        end_date: projectData.deadline || null,
        status: 'Active',
        progress: 0
      }]).select().single();

      if (error) throw error;
      if (data) {
        setProjects(prev => [data, ...prev]);
        return data.id;
      }
    } catch (err) {
      console.error('Error adding project:', err);
      return null;
    }
  };

  const addModules = async (projectId, newModules) => {
    try {
      const tasksToInsert = newModules.map(mod => ({
        project_id: projectId,
        employee_id: mod.assignedTo || null,
        name: mod.name,
        description: mod.description || null,
        due_date: mod.deadline || null,
        priority: 'Medium',
        status: 'Not Started',
        estimated_hours: 0,
        progress: 0
      }));

      const { data, error } = await supabase.from('tasks').insert(tasksToInsert).select();
      if (error) throw error;
      
      if (data) {
        setTasks(prev => [...data, ...prev]);
        
        // Also update the project's progress/modules count locally or let realtime handle it
        // We let realtime fetch the updated tasks and projects
      }
    } catch (err) {
      console.error('Error adding modules:', err);
    }
  };

  // --- Resource Management Helpers ---
  const getEmployeeActiveProjects = (employeeId) => {
    // An active project is one where the project status is Active
    // AND the employee is assigned as team leader, team member, or has tasks in it.
    const activeProjs = projects.filter(p => p.status === 'Active' || p.status === 'In Progress');
    
    return activeProjs.filter(proj => {
      // Check if leader or member
      if (proj.team_leader_id === employeeId) return true;
      if (proj.team_members && proj.team_members.includes(employeeId)) return true;
      
      // Check if they have tasks in this project
      const hasTasks = tasks.some(t => t.project_id === proj.id && t.employee_id === employeeId && t.status !== 'Completed');
      return hasTasks;
    });
  };

  const getEmployeeWorkload = (employeeId) => {
    const activeProjs = getEmployeeActiveProjects(employeeId);
    if (activeProjs.length === 0) return 0;
    
    // Check their active tasks. 
    // We assume 40 hrs a week capacity.
    const empTasks = tasks.filter(t => t.employee_id === employeeId && t.status !== 'Completed');
    
    // If estimated_hours is 0 or missing, we fall back to a heuristic (e.g., 20% per active project)
    let totalEstimatedHours = empTasks.reduce((sum, t) => sum + (Number(t.estimated_hours) || 0), 0);
    
    let percentage = 0;
    if (totalEstimatedHours > 0) {
      percentage = Math.round((totalEstimatedHours / 40) * 100);
    } else {
      // Fallback heuristic: 25% per active project
      percentage = activeProjs.length * 25;
    }
    
    return percentage > 100 ? 100 : percentage;
  };

  const getEmployeeAvailabilityStatus = (workloadPercentage) => {
    if (workloadPercentage < 50) return 'Available';
    if (workloadPercentage <= 75) return 'Moderate Workload';
    if (workloadPercentage <= 95) return 'Busy';
    return 'Full Capacity';
  };

  const login = (user, role) => {
    setCurrentUser(user);
    setUserRole(role);
    localStorage.setItem('taskpilot_user', JSON.stringify(user));
    localStorage.setItem('taskpilot_role', role);
  };

  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem('taskpilot_user');
    localStorage.removeItem('taskpilot_role');
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      userRole,
      login,
      logout,
      employees,
      projects,
      tasks,
      teamRewards,
      rewardClaims,
      rewardSettings,
      addProject,
      addModules,
      evaluateTeamReward,
      getEmployeeActiveProjects,
      getEmployeeWorkload,
      getEmployeeAvailabilityStatus,
      fetchGlobalData,
      fetchEmployees, // export if manual refresh is ever needed
      employeeTasks,
      setEmployeeTasks,
      employeeProjects,
      setEmployeeProjects,
      dailyUpdates,
      setDailyUpdates
    }}>
      {children}
    </AppContext.Provider>
  );
};

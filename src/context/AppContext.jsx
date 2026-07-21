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
  const [enterpriseRewards, setEnterpriseRewards] = useState([]);
  const [enterpriseRewardClaims, setEnterpriseRewardClaims] = useState([]);
  const [enterpriseRewardAuditLog, setEnterpriseRewardAuditLog] = useState([]);
  const [rewardClaims, setRewardClaims] = useState([]);
  const [rewardSettings, setRewardSettings] = useState({ allow_multiple_claims: false });
  const [projectTeams, setProjectTeams] = useState([]);
  const [projectModules, setProjectModules] = useState([]);
  const [rewardSubmissions, setRewardSubmissions] = useState([]);
  const [taskDeliverables, setTaskDeliverables] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Phase 3: Enterprise Workflow State
  const [dailyWorkSubmissions, setDailyWorkSubmissions] = useState([]);
  const [dailyTeamReports, setDailyTeamReports] = useState([]);
  const [finalTeamReports, setFinalTeamReports] = useState([]);
  const [moduleSubmissions, setModuleSubmissions] = useState([]);
  const [dailyFeedback, setDailyFeedback] = useState([]);
const [projectRatings, setProjectRatings] = useState([]);
  const [reminders, setReminders] = useState([]);

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
      const [
        projsRes, tasksRes, rewardsRes, claimsRes, settingsRes, teamsRes, modulesRes, updatesRes, subsRes, deliverableRes, historyRes, notifRes,
        workSubsRes, teamReportsRes, finalTeamReportsRes, modSubsRes, feedbackRes, ratingsRes, remindersRes,
        entRewardsRes, entClaimsRes, entAuditRes
      ] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('team_rewards').select('*').order('week_number', { ascending: true }),
        supabase.from('reward_claims').select('*'),
        supabase.from('reward_settings').select('*').limit(1).single(),
        supabase.from('project_teams').select('*'),
        supabase.from('project_modules').select('*'),
        supabase.from('daily_updates').select('*').order('date', { ascending: false }),
        supabase.from('reward_submissions').select('*').order('submitted_at', { ascending: false }),
        supabase.from('task_deliverables').select('*').order('submitted_at', { ascending: false }),
        supabase.from('task_history').select('*').order('timestamp', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('daily_work_submissions').select('*').order('submitted_at', { ascending: false }),
        supabase.from('daily_team_reports').select('*').order('report_date', { ascending: false }),
        supabase.from('final_team_reports').select('*').order('submitted_at', { ascending: false }),
        supabase.from('module_submissions').select('*').order('submitted_at', { ascending: false }),
        supabase.from('daily_feedback').select('*').order('created_at', { ascending: false }),
        supabase.from('project_ratings').select('*').order('created_at', { ascending: false }),
        supabase.from('reminders').select('*').order('reminder_date', { ascending: true }),
        supabase.from('enterprise_rewards').select('*').order('created_at', { ascending: false }),
        supabase.from('enterprise_reward_claims').select('*'),
        supabase.from('enterprise_reward_audit_log').select('*').order('action_timestamp', { ascending: false })
      ]);
      if (projsRes.data) setProjects(projsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (rewardsRes.data) setTeamRewards(rewardsRes.data);
      if (claimsRes && claimsRes.data) setRewardClaims(claimsRes.data);
      if (settingsRes && settingsRes.data) setRewardSettings(settingsRes.data);
      if (teamsRes && teamsRes.data) setProjectTeams(teamsRes.data);
      if (modulesRes && modulesRes.data) setProjectModules(modulesRes.data);
      if (updatesRes && updatesRes.data) setDailyUpdates(updatesRes.data);
      if (subsRes && subsRes.data) setRewardSubmissions(subsRes.data);
      if (deliverableRes && deliverableRes.data) setTaskDeliverables(deliverableRes.data);
      if (historyRes && historyRes.data) setTaskHistory(historyRes.data);
      if (notifRes && notifRes.data) setNotifications(notifRes.data);
      if (workSubsRes && workSubsRes.data) setDailyWorkSubmissions(workSubsRes.data);
      if (teamReportsRes && teamReportsRes.data) setDailyTeamReports(teamReportsRes.data);
      if (finalTeamReportsRes && finalTeamReportsRes.data) setFinalTeamReports(finalTeamReportsRes.data);
      if (modSubsRes && modSubsRes.data) setModuleSubmissions(modSubsRes.data);
      if (feedbackRes && feedbackRes.data) setDailyFeedback(feedbackRes.data);
      if (ratingsRes && ratingsRes.data) setProjectRatings(ratingsRes.data);
      if (remindersRes && remindersRes.data) setReminders(remindersRes.data);
      if (entRewardsRes && entRewardsRes.data) setEnterpriseRewards(entRewardsRes.data);
      if (entClaimsRes && entClaimsRes.data) setEnterpriseRewardClaims(entClaimsRes.data);
      if (entAuditRes && entAuditRes.data) setEnterpriseRewardAuditLog(entAuditRes.data);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_teams' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_modules' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_updates' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_submissions' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_deliverables' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_history' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_work_submissions' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_team_reports' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'final_team_reports' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'module_submissions' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_feedback' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_ratings' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enterprise_rewards' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enterprise_reward_claims' }, () => fetchGlobalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enterprise_reward_audit_log' }, () => fetchGlobalData())
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



  const triggerNotification = async (recipientId, title, message, type, referenceId, priority = 'Medium', category = 'System') => {
    try {
      if (!recipientId) return;
      const { notificationService } = await import('../services/notificationService');
      await notificationService.publishEvent({
        sender_id: currentUser?.id,
        receiver_id: recipientId,
        title,
        description: message,
        event_type: type,
        priority,
        category,
        action_url: `/dashboard`
      });
    } catch (err) {
      console.error("Exception creating notification:", err);
    }
  };

  const evaluateDeadlinesAndNotify = async () => {
    if (!currentUser) return;
    
    // Check if we already evaluated today to prevent spamming
    const lastCheck = localStorage.getItem('taskpilot_last_deadline_check');
    const today = new Date().toDateString();
    if (lastCheck === today) return;
    
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // normalize to midnight
      const notificationsToInsert = [];
      const generatedNotifKeys = new Set(); // To prevent duplicate inserts in the array

      // Helper to generate a notification
      const createNotif = (recipientId, title, message, type, refId) => {
        const key = `${recipientId}-${type}-${refId}-${today}`;
        if (generatedNotifKeys.has(key)) return;
        
        // Also check if already in DB (to prevent re-insertion if another user triggered it)
        const exists = notifications.find(n => 
          n.recipient_id === recipientId && 
          n.reference_id === refId && 
          n.type === type &&
          new Date(n.created_at).toDateString() === today
        );
        
        if (!exists) {
          generatedNotifKeys.add(key);
          notificationsToInsert.push({ recipient_id: recipientId, title, message, type, reference_id: refId });
        }
      };

      // 1. Evaluate Modules (Notify Team Leaders & Manager)
      for (const mod of projectModules) {
        if (!mod.end_date || !mod.start_date) continue;
        
        // Check module status
        // A module is completed if all tasks are completed
        const mTasks = tasks.filter(t => t.module_id === mod.id);
        const allCompleted = mTasks.length > 0 && mTasks.every(t => t.status === 'Completed' || t.status === 'Approved');
        if (allCompleted) continue;

        const endDate = new Date(mod.end_date);
        endDate.setHours(0, 0, 0, 0);
        
        const startDate = new Date(mod.start_date);
        startDate.setHours(0, 0, 0, 0);

        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Find team leader for this module
        const team = projectTeams.find(t => t.id === mod.team_id);
        const teamLeaderId = team?.team_leader_id;

        // Module Starts Today
        if (startDate.getTime() === now.getTime() && teamLeaderId) {
          createNotif(teamLeaderId, `Module Started`, `Module "${mod.name}" officially starts today.`, 'module_start', mod.id);
        }

        if (diffDays === 3 && teamLeaderId) {
          createNotif(teamLeaderId, `Deadline Approaching`, `Module "${mod.name}" is due in 3 days.`, 'deadline_warning_3', mod.id);
        } else if (diffDays === 1 && teamLeaderId) {
          createNotif(teamLeaderId, `Deadline Tomorrow`, `Module "${mod.name}" is due tomorrow!`, 'deadline_warning_1', mod.id);
        } else if (diffDays === 0 && teamLeaderId) {
          createNotif(teamLeaderId, `Due Today`, `Module "${mod.name}" is due today.`, 'deadline_today', mod.id);
        } else if (diffDays < 0 && teamLeaderId) {
          createNotif(teamLeaderId, `Module Overdue`, `Module "${mod.name}" is overdue by ${Math.abs(diffDays)} days.`, 'overdue', mod.id);
        }
      }

      // 2. Evaluate Tasks (Notify Employees & Team Leader)
      for (const task of tasks) {
        if (!task.due_date || task.status === 'Completed' || task.status === 'Pending Team Leader Review' || task.status === 'Approved') continue;
        
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        const diffTime = dueDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 3 && task.employee_id) {
          createNotif(task.employee_id, `Task Approaching Deadline`, `Task "${task.name}" is due in 3 days.`, 'deadline_warning_3', task.id);
        } else if (diffDays === 1 && task.employee_id) {
          createNotif(task.employee_id, `Task Due Tomorrow`, `Task "${task.name}" is due tomorrow.`, 'deadline_warning_1', task.id);
        } else if (diffDays === 0 && task.employee_id) {
          createNotif(task.employee_id, `Task Due Today`, `Task "${task.name}" is due today!`, 'deadline_today', task.id);
        } else if (diffDays < 0 && task.employee_id) {
          createNotif(task.employee_id, `Task Overdue`, `Task "${task.name}" is overdue by ${Math.abs(diffDays)} days.`, 'overdue', task.id);
          
          // Also notify the team leader if a task is overdue
          const mod = projectModules.find(m => m.id === task.module_id);
          if (mod) {
            const team = projectTeams.find(t => t.id === mod.team_id);
            if (team && team.team_leader_id) {
              createNotif(team.team_leader_id, `Team Task Overdue`, `Task "${task.name}" assigned to ${employees.find(e => e.id === task.employee_id)?.name} is overdue.`, 'team_task_overdue', task.id);
            }
          }
        }
      }

      if (notificationsToInsert.length > 0) {
        // Disabled temporarily to prevent 401 network errors on the frontend console
        // const { error } = await supabase.from('notifications').insert(notificationsToInsert);
        // if (!error) {
        //   localStorage.setItem('taskpilot_last_deadline_check', today);
        //   fetchGlobalData(); // refresh to get new notifications
        // } else {
        //   if (error.code !== '42501') {
        //     console.error("Error inserting JIT notifications:", error);
        //   }
        // }
        
        // Mock success to prevent continuous retries
        localStorage.setItem('taskpilot_last_deadline_check', today);
      } else {
        localStorage.setItem('taskpilot_last_deadline_check', today);
      }
      
    } catch (err) {
      console.error('Error evaluating deadlines:', err);
    }
  };

  useEffect(() => {
    // Run evaluation a few seconds after load to ensure data is fetched
    if (projects.length > 0 && tasks.length > 0) {
      const timer = setTimeout(() => {
        evaluateDeadlinesAndNotify();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [projects, tasks, currentUser]);
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
        
        // If team members or leader were assigned during project creation, create a default team
        if (projectData.team_leader_id || (projectData.team_members && projectData.team_members.length > 0)) {
          const teamName = projectData.department ? `${projectData.department} Team` : 'Core Team';
          
          await supabase.from('project_teams').insert({
            project_id: data.id,
            team_name: teamName,
            team_leader_id: projectData.team_leader_id || null,
            team_members: projectData.team_members || []
          });
          
          // Trigger a global fetch to ensure project_teams updates are pulled in
          fetchGlobalData();
        }
        
        return data.id;
      }
    } catch (err) {
      console.error('Error adding project:', err);
      return null;
    }
  };

  const createFullProjectTransaction = async (projectData, teams, modules) => {
    let newProjectId = null;
    try {
      // 1. Create Project
      const isValidUUID = currentUser?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id);
      
      const projPayload = {
        name: projectData.name,
        description: projectData.description || null,
        manager_id: isValidUUID ? currentUser.id : null,
        start_date: (projectData.startDate && projectData.startDate.trim() !== '') ? projectData.startDate : new Date().toISOString().split('T')[0],
        end_date: (projectData.deadline && projectData.deadline.trim() !== '') ? projectData.deadline : null,
        status: projectData.status || 'Active',
        progress: 0
      };
      
      const { data: projData, error: projError } = await supabase.from('projects').insert([projPayload]).select().single();

      if (projError) throw projError;
      newProjectId = projData.id;

      // 2. Create Teams
      const teamIdMap = {}; // Maps local temp IDs to DB UUIDs
      if (teams && teams.length > 0) {
        for (const team of teams) {
          const { data: teamData, error: teamError } = await supabase.from('project_teams').insert({
            project_id: newProjectId,
            team_name: team.name,
            team_leader_id: team.team_leader_id || null,
            team_members: team.team_members || []
          }).select().single();
          
          if (teamError) throw teamError;
          teamIdMap[team.id] = teamData.id;
        }
      }

      // 3. Create Modules
      if (modules && modules.length > 0) {
        const modulesToInsert = modules.map(mod => ({
          project_id: newProjectId,
          team_id: teamIdMap[mod.team_id] || null, // Map temp ID to real UUID
          name: mod.name,
          description: mod.description || null,
          start_date: mod.start_date || null,
          end_date: mod.end_date || null,
          priority: mod.priority || 'Medium'
        }));

        const { error: modError } = await supabase.from('project_modules').insert(modulesToInsert);
        if (modError) throw modError;
      }

      // Success, refresh state
      fetchGlobalData();
      return newProjectId;
    } catch (err) {
      console.error('Transaction Failed, rolling back project:', JSON.stringify(err));
      alert(`Transaction Failed: ${err?.message || JSON.stringify(err)}`);
      // Rollback: Delete the project (Cascades delete teams and modules)
      if (newProjectId) {
        await supabase.from('projects').delete().eq('id', newProjectId);
      }
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
      // Check if leader or member in project_teams
      const myTeams = projectTeams.filter(t => t.project_id === proj.id);
      if (myTeams.some(t => t.team_leader_id === employeeId)) return true;
      if (myTeams.some(t => t.team_members && t.team_members.includes(employeeId))) return true;
      
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

  const isTeamLeader = (employeeId) => {
    return projectTeams.some(team => team.team_leader_id === employeeId);
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
      createFullProjectTransaction,
      addModules,
      evaluateTeamReward,
      getEmployeeActiveProjects,
      getEmployeeWorkload,
      getEmployeeAvailabilityStatus,
      isTeamLeader,
      projectTeams,
      projectModules,
      rewardSubmissions,
      taskDeliverables,
      taskHistory,
      notifications,
      
      dailyWorkSubmissions,
      dailyTeamReports,
      finalTeamReports,
      moduleSubmissions,
      dailyFeedback,
      projectRatings,
      reminders,
      setReminders,
      
      enterpriseRewards,
      enterpriseRewardClaims,
      enterpriseRewardAuditLog,

      fetchGlobalData,
      triggerNotification,
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

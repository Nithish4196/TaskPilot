import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar as CalendarIcon, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TodaysScheduleWidget() {
  const { currentUser, userRole, reminders = [], projectTeams = [], projects = [] } = useAppContext();
  const getLocalDateString = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const myTeams = useMemo(() => {
    return projectTeams.filter(t => 
      t.team_leader_id === currentUser?.id || 
      (t.team_members && t.team_members.includes(currentUser?.id))
    ).map(t => t.id);
  }, [projectTeams, currentUser]);

  const isManager = userRole === 'manager';

  const todayStr = getLocalDateString(new Date());
  
  const todaysReminders = useMemo(() => {
    return reminders.filter(r => {
      let hasAccess = false;
      if (r.type === 'Personal' && r.created_by === currentUser?.id) hasAccess = true;
      if (r.type === 'Team Leader') {
        if (r.created_by === currentUser?.id) hasAccess = true;
        else if (r.assigned_to) {
          if (r.assigned_to === currentUser?.id) hasAccess = true;
        } else if (myTeams.includes(r.team_id)) {
          hasAccess = true;
        }
      }
      if (r.type === 'Manager') {
        if (r.created_by === currentUser?.id || isManager) hasAccess = true;
        else if (r.assigned_to) {
          if (r.assigned_to === currentUser?.id) hasAccess = true;
        } else if (myTeams.includes(r.team_id)) {
          hasAccess = true;
        }
      }
      return hasAccess && r.reminder_date === todayStr;
    }).sort((a, b) => a.reminder_time.localeCompare(b.reminder_time));
  }, [reminders, currentUser, myTeams, todayStr, isManager]);

  const getReminderColor = (type) => {
    if (type === 'Personal') return 'bg-emerald-500';
    if (type === 'Team Leader') return 'bg-amber-500';
    if (type === 'Manager') return 'bg-rose-500';
    return 'bg-slate-500';
  };

  return (
    <div className="linear-card p-5 border border-[var(--border)] shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600"/> Today's Schedule
        </h3>
        <Link to={isManager ? "/calendar" : "/employee/calendar"} className="text-xs font-semibold text-blue-600 hover:underline">
          View Calendar
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {todaysReminders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-75 py-6">
            <CalendarIcon className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">No reminders for today.</p>
          </div>
        ) : (
          todaysReminders.map(r => (
            <div key={r.id} className="p-3 border border-[var(--border)] rounded-lg bg-[var(--surface)] hover:bg-[var(--bg-secondary)] transition-colors flex items-start gap-3">
              <div className="pt-1 shrink-0">
                <span className={`block w-3 h-3 rounded-full ${getReminderColor(r.type)}`}></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{r.title}</h4>
                  <span className="text-[10px] font-semibold bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border)] shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {r.reminder_time}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">{r.type} Reminder</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

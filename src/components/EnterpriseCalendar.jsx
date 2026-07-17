import { useState, useMemo, useEffect } from 'react';
import { useAppContext, supabase } from '../context/AppContext';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, 
  AlertCircle, Plus, Search, Filter, CheckCircle, Target, ListTodo, X
} from 'lucide-react';

export default function EnterpriseCalendar() {
  const { 
    currentUser, userRole, reminders = [], fetchGlobalData, projectTeams = [], projects = [], employees = [], triggerNotification
  } = useAppContext();

  const [currentDate, setCurrentDate] = useState(new Date());
  const getLocalDateString = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const [view, setView] = useState('Month'); // Month, Week, Day
  const [filterType, setFilterType] = useState('All'); // All, Personal, Team Leader, Manager
  const [filterStatus, setFilterStatus] = useState('All'); // All, Pending, Completed, Overdue

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);

  // --- Filtering Logic ---
  const myTeams = useMemo(() => {
    return projectTeams.filter(t => 
      t.team_leader_id === currentUser?.id || 
      (t.team_members && t.team_members.includes(currentUser?.id))
    ).map(t => t.id);
  }, [projectTeams, currentUser]);

  const isManager = userRole === 'manager';
  const isTeamLeader = useMemo(() => projectTeams.some(t => t.team_leader_id === currentUser?.id), [projectTeams, currentUser]);

  const visibleReminders = useMemo(() => {
    const filtered = reminders.filter(r => {
      // 1. Role / Access Check
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
      if (!hasAccess) return false;

      // 2. Type Filter
      if (filterType !== 'All' && r.type !== filterType) return false;

      // 3. Status Filter
      if (filterStatus !== 'All' && r.status !== filterStatus) return false;

      return true;
    });

    // Deduplicate reminders that were created for multiple teams at once (e.g. Manager "All Teams")
    // so they don't show up as duplicates on the calendar for the creator.
    const uniqueMap = new Map();
    filtered.forEach(r => {
      const key = `${r.title}-${r.reminder_date}-${r.type}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, r);
      }
    });
    
    return Array.from(uniqueMap.values());
  }, [reminders, currentUser, myTeams, filterType, filterStatus, isManager]);

  // --- Calendar Math ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  // --- Create Reminder State ---
  const [newReminder, setNewReminder] = useState({
    title: '', description: '', type: 'Personal', date: getLocalDateString(new Date()),
    time: '10:00', priority: 'Medium', project_id: '', team_id: '', assigned_to: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getReminderColor = (type) => {
    if (type === 'Personal') return 'bg-emerald-500';
    if (type === 'Team Leader') return 'bg-amber-500';
    if (type === 'Manager') return 'bg-rose-500';
    return 'bg-slate-500';
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Handle legacy mock users (e.g. "admin-1") by getting a valid UUID from the DB to satisfy FK constraints
      let creatorId = currentUser.id;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(creatorId);
      
      if (!isUUID) {
        const { data: empData } = await supabase.from('employees').select('id').limit(1);
        if (empData && empData.length > 0) {
          creatorId = empData[0].id;
        } else {
          alert('Database has no valid employees to act as reminder creator.');
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        title: newReminder.title,
        description: newReminder.description,
        type: newReminder.type,
        reminder_date: newReminder.date,
        reminder_time: newReminder.time,
        priority: newReminder.priority,
        created_by: creatorId,
        assigned_by: creatorId,
        status: 'Pending'
      };
      
      if (newReminder.assigned_to) {
        payload.assigned_to = newReminder.assigned_to;
      }

      if (newReminder.type === 'Team Leader') {
        if (newReminder.team_id === 'ALL') {
          const myTlTeams = projectTeams.filter(t => t.team_leader_id === currentUser.id);
          const inserts = myTlTeams.map(t => ({...payload, team_id: t.id, project_id: t.project_id}));
          if (inserts.length > 0) { const { error } = await supabase.from('reminders').insert(inserts); if (error) throw error; }
          else { const { error } = await supabase.from('reminders').insert(payload); if (error) throw error; }
        } else {
          payload.team_id = newReminder.team_id;
          const tm = projectTeams.find(t => t.id === newReminder.team_id);
          payload.project_id = tm?.project_id;
          const { error } = await supabase.from('reminders').insert(payload); if (error) throw error;
        }
      } else if (newReminder.type === 'Manager') {
        if (newReminder.team_id === 'ALL') {
          const projTeams = projectTeams.filter(t => t.project_id === newReminder.project_id);
          const inserts = projTeams.map(t => ({...payload, team_id: t.id, project_id: newReminder.project_id}));
          if (inserts.length > 0) { const { error } = await supabase.from('reminders').insert(inserts); if (error) throw error; }
          else { const { error } = await supabase.from('reminders').insert({...payload, project_id: newReminder.project_id}); if (error) throw error; }
        } else {
          payload.project_id = newReminder.project_id;
          payload.team_id = newReminder.team_id;
          const { error } = await supabase.from('reminders').insert(payload); if (error) throw error;
        }
      } else {
        const { error } = await supabase.from('reminders').insert(payload); if (error) throw error;
      }
      setShowCreateModal(false);
      fetchGlobalData();
    } catch (err) {
      console.error(err);
      alert('Failed to create reminder.');
    }
    setIsSubmitting(false);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await supabase.from('reminders').update({ status: newStatus }).eq('id', id);
      fetchGlobalData();
      if (selectedReminder?.id === id) {
        setSelectedReminder({ ...selectedReminder, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder permanently?')) return;
    try {
      await supabase.from('reminders').delete().eq('id', id);
      setShowViewModal(false);
      fetchGlobalData();
    } catch (err) {
      console.error(err);
    }
  };

  const todayStr = getLocalDateString(new Date());
  const upcomingReminders = visibleReminders
    .filter(r => r.status === 'Pending' && r.reminder_date >= todayStr)
    .sort((a,b) => new Date(a.reminder_date) - new Date(b.reminder_date))
    .slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Enterprise Calendar</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage reminders and deadlines.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Calendar Area */}
        <div className="w-full lg:w-3/4 space-y-6">
          
          {/* Filters & Controls */}
          <div className="linear-card p-4 flex flex-wrap justify-between items-center gap-4 border border-[var(--border)] shadow-sm">
            <div className="flex gap-2 bg-[var(--bg-secondary)] p-1 rounded-lg">
              {['Month', 'Week', 'Day'].map(v => (
                <button 
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${view === v ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <select 
                value={filterType} onChange={e => setFilterType(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-1.5 outline-none focus:border-brand-500"
              >
                <option value="All">All Types</option>
                <option value="Personal">Personal</option>
                <option value="Team Leader">Team Leader</option>
                <option value="Manager">Manager</option>
              </select>
              <select 
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-1.5 outline-none focus:border-brand-500"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Calendar Grid (Month View) */}
          {view === 'Month' && (
            <div className="linear-card overflow-hidden border border-[var(--border)] shadow-sm">
              <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]">
                <button onClick={prevMonth} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)]"><ChevronLeft className="w-5 h-5"/></button>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <button onClick={nextMonth} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)]"><ChevronRight className="w-5 h-5"/></button>
              </div>
              <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-3 text-center text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-[120px]">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={idx} className="border-r border-b border-[var(--border)] bg-[var(--bg-secondary)]/30"></div>;
                  
                  const isToday = day.toDateString() === new Date().toDateString();
                  const dateStr = getLocalDateString(day);
                  const dayReminders = visibleReminders.filter(r => r.reminder_date === dateStr);

                  return (
                    <div key={idx} className={`border-r border-b border-[var(--border)] p-2 relative hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      onClick={() => {
                         setNewReminder({...newReminder, date: dateStr});
                         setShowCreateModal(true);
                      }}
                    >
                      <div className={`text-sm font-semibold mb-2 ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-[var(--text-secondary)]'}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayReminders.slice(0, 3).map(r => (
                          <div 
                            key={r.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedReminder(r); setShowViewModal(true); }}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate text-white ${getReminderColor(r.type)}`}
                          >
                            {r.title}
                          </div>
                        ))}
                        {dayReminders.length > 3 && (
                          <div className="text-[10px] font-bold text-[var(--text-secondary)] px-1">+{dayReminders.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="linear-card p-4 border border-[var(--border)] shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center bg-[var(--surface)]">
             <div className="flex items-center gap-3 text-sm">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <div>
                  <p className="font-bold text-[var(--text-primary)]">Personal Reminder</p>
                  <p className="text-xs text-[var(--text-secondary)]">Created by you. Visible only to you.</p>
                </div>
             </div>
             <div className="flex items-center gap-3 text-sm">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <div>
                  <p className="font-bold text-[var(--text-primary)]">Team Leader Reminder</p>
                  <p className="text-xs text-[var(--text-secondary)]">Assigned by TL. Visible to team.</p>
                </div>
             </div>
             <div className="flex items-center gap-3 text-sm">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <div>
                  <p className="font-bold text-[var(--text-primary)]">Manager Reminder</p>
                  <p className="text-xs text-[var(--text-secondary)]">Assigned by Manager. Visible to team.</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Panel: Upcoming Reminders */}
        <div className="w-full lg:w-1/4">
          <div className="linear-card p-5 sticky top-24 border border-[var(--border)] shadow-sm">
            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-blue-600"/> Upcoming Reminders
            </h3>
            
            {upcomingReminders.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)] text-sm">
                No upcoming reminders.
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingReminders.map(r => (
                  <div key={r.id} onClick={() => { setSelectedReminder(r); setShowViewModal(true); }} className="p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors bg-[var(--surface)]">
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${getReminderColor(r.type)}`}></span>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-primary)] leading-tight">{r.title}</h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{new Date(r.reminder_date).toLocaleDateString()} at {r.reminder_time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Create Reminder</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-secondary)] hover:text-red-500"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Reminder Type</label>
                <select 
                  className="w-full px-3 py-2 linear-card text-sm"
                  value={newReminder.type}
                  onChange={e => setNewReminder({...newReminder, type: e.target.value})}
                >
                  <option value="Personal">🟢 Personal Reminder</option>
                  {isTeamLeader && <option value="Team Leader">🟡 Team Leader Reminder</option>}
                  {isManager && <option value="Manager">🔴 Manager Reminder</option>}
                </select>
              </div>

              {newReminder.type === 'Team Leader' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Select Team (Assigns to Entire Team)</label>
                    <select 
                      required className="w-full px-3 py-2 linear-card text-sm"
                      value={newReminder.team_id}
                      onChange={e => setNewReminder({...newReminder, team_id: e.target.value, assigned_to: ''})}
                    >
                      <option value="">Choose Team...</option>
                      <option value="ALL">All My Teams</option>
                      {projectTeams.filter(t => t.team_leader_id === currentUser?.id).map(t => (
                        <option key={t.id} value={t.id}>{t.team_name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {newReminder.type === 'Manager' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Select Project</label>
                    <select 
                      required className="w-full px-3 py-2 linear-card text-sm"
                      value={newReminder.project_id}
                      onChange={e => setNewReminder({...newReminder, project_id: e.target.value, team_id: ''})}
                    >
                      <option value="">Choose Project...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  {newReminder.project_id && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Select Team</label>
                        <select 
                          required className="w-full px-3 py-2 linear-card text-sm"
                          value={newReminder.team_id}
                          onChange={e => setNewReminder({...newReminder, team_id: e.target.value})}
                        >
                          <option value="">Choose Team...</option>
                          <option value="ALL">All Teams in Project</option>
                          {projectTeams.filter(t => t.project_id === newReminder.project_id).map(t => (
                            <option key={t.id} value={t.id}>{t.team_name}</option>
                          ))}
                        </select>
                      </div>
                      {newReminder.team_id && newReminder.team_id !== 'ALL' && (
                        <div>
                          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Assign To</label>
                          <select 
                            className="w-full px-3 py-2 linear-card text-sm"
                            value={newReminder.assigned_to}
                            onChange={e => setNewReminder({...newReminder, assigned_to: e.target.value})}
                          >
                            <option value="">Entire Team (TL and Employees)</option>
                            {(() => {
                              const tm = projectTeams.find(t => t.id === newReminder.team_id);
                              if (!tm) return null;
                              const tl = employees.find(e => e.id === tm.team_leader_id);
                              const teamMembers = employees.filter(e => tm.team_members && tm.team_members.includes(e.id));
                              
                              return (
                                <>
                                  {tl && <option value={tl.id}>Team Leader ({tl.name})</option>}
                                  {teamMembers.map(e => (
                                    <option key={e.id} value={e.id}>Employee: {e.name}</option>
                                  ))}
                                </>
                              );
                            })()}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Title</label>
                <input required type="text" className="w-full px-3 py-2 linear-card text-sm" value={newReminder.title} onChange={e => setNewReminder({...newReminder, title: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Description</label>
                <textarea className="w-full px-3 py-2 linear-card text-sm h-20" value={newReminder.description} onChange={e => setNewReminder({...newReminder, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Date</label>
                  <input required type="date" className="w-full px-3 py-2 linear-card text-sm" value={newReminder.date} onChange={e => setNewReminder({...newReminder, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Time</label>
                  <input required type="time" className="w-full px-3 py-2 linear-card text-sm" value={newReminder.time} onChange={e => setNewReminder({...newReminder, time: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Priority</label>
                <select className="w-full px-3 py-2 linear-card text-sm" value={newReminder.priority} onChange={e => setNewReminder({...newReminder, priority: e.target.value})}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Save Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Reminder Details Modal */}
      {showViewModal && selectedReminder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${getReminderColor(selectedReminder.type)}`}></span>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedReminder.type} Reminder</h3>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-[var(--text-secondary)] hover:text-red-500"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{selectedReminder.title}</h2>
                <p className="text-[var(--text-secondary)] mt-2">{selectedReminder.description || 'No description provided.'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border)]">
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Date & Time</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">{new Date(selectedReminder.reminder_date).toLocaleDateString()} at {selectedReminder.reminder_time}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Status</p>
                  <p className={`text-sm font-semibold mt-1 ${selectedReminder.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedReminder.status}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Assigned To</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
                    {selectedReminder.assigned_to 
                      ? employees.find(e => e.id === selectedReminder.assigned_to)?.name 
                      : (selectedReminder.team_id ? projectTeams.find(t => t.id === selectedReminder.team_id)?.team_name + ' (Entire Team)' : 'You')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Assigned By</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
                    {selectedReminder.type === 'Manager' ? 'Project Manager' : 
                     selectedReminder.type === 'Team Leader' ? 'Team Leader' :
                     (employees.find(e => e.id === selectedReminder.assigned_by)?.name || 'Unknown')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Priority</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">{selectedReminder.priority}</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
                {selectedReminder.status === 'Pending' && (
                  <button onClick={() => handleUpdateStatus(selectedReminder.id, 'Completed')} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">Mark Completed</button>
                )}
                {selectedReminder.created_by === currentUser?.id && (
                  <button onClick={() => handleDelete(selectedReminder.id)} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Delete</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

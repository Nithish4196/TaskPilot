import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';

export default function EmployeeCalendar() {
  const { employeeTasks } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  // Helper to get events for a specific day
  const getEventsForDay = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    const events = [];

    // Check tasks due this day
    employeeTasks.forEach(task => {
      if (task.due_date && task.due_date.startsWith(dateStr)) {
        events.push({ type: 'task', title: task.name, priority: task.priority });
      }
    });

    return events;
  };

  const getEventColor = (event) => {
    if (event.type === 'task') {
      return event.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-brand-100 text-brand-700 border-brand-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Calendar</h1>
          <p className="text-slate-500 mt-2">Manage your deadlines, milestones, and schedule.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{monthName} {year}</h2>
              <p className="text-sm font-medium text-slate-500">{employeeTasks.length} tasks scheduled</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={today} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 shadow-sm text-sm">
              Today
            </button>
            <div className="flex bg-slate-200 rounded-lg p-1 gap-1">
              <button onClick={prevMonth} className="p-1.5 bg-white rounded-md shadow-sm text-slate-600 hover:text-slate-900 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-1.5 bg-white rounded-md shadow-sm text-slate-600 hover:text-slate-900 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-px mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for previous month */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[100px] p-2 rounded-xl bg-slate-50/50 border border-slate-100 opacity-50"></div>
            ))}
            
            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isToday = 
                day === new Date().getDate() && 
                currentDate.getMonth() === new Date().getMonth() && 
                currentDate.getFullYear() === new Date().getFullYear();
                
              const events = getEventsForDay(day);

              return (
                <div 
                  key={day} 
                  className={`min-h-[100px] p-2 rounded-xl border transition-all ${
                    isToday ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200' : 'bg-white border-slate-200 hover:border-brand-300 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
                    isToday ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-700'
                  }`}>
                    {day}
                  </div>
                  
                  <div className="space-y-1.5">
                    {events.map((event, eventIdx) => (
                      <div 
                        key={eventIdx} 
                        className={`text-xs px-2 py-1 rounded border font-medium truncate flex items-center gap-1 ${getEventColor(event)}`}
                        title={event.title}
                      >
                        {event.priority === 'High' ? <AlertCircle className="w-3 h-3 shrink-0" /> : <Clock className="w-3 h-3 shrink-0" />}
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

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
 return event.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)]';
 }
 return 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)]';
 };

 return (
 <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="flex justify-between items-end mb-10">
 <div>
 <h1 className="page-title">Calendar</h1>
 <p className="text-[var(--text-secondary)] mt-2">Manage your deadlines, milestones, and schedule.</p>
 </div>
 </div>

 <div className="bg-white border border-[var(--border)] overflow-hidden">
 {/* Calendar Header */}
 <div className="p-6 border-b border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-6 bg-[var(--bg-secondary)]">
 <div className="flex items-center gap-6">
 <div className="w-12 h-12 bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)]">
 <CalendarIcon className="w-6 h-6" />
 </div>
 <div>
 <h2 className="page-title">{monthName} {year}</h2>
 <p className="text-sm font-medium text-[var(--text-secondary)]">{employeeTasks.length} tasks scheduled</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={today} className="btn-primary">
 Today
 </button>
 <div className="flex bg-[var(--surface-hover)] p-1 gap-1">
 <button onClick={prevMonth} className="btn-primary">
 <ChevronLeft className="w-5 h-5" />
 </button>
 <button onClick={nextMonth} className="btn-primary">
 <ChevronRight className="w-5 h-5" />
 </button>
 </div>
 </div>
 </div>

 {/* Calendar Grid */}
 <div className="p-6">
 <div className="grid grid-cols-7 gap-px mb-2">
 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
 <div key={day} className="text-center text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider py-2">
 {day}
 </div>
 ))}
 </div>
 
 <div className="grid grid-cols-7 gap-2">
 {/* Empty cells for previous month */}
 {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
 <div key={`empty-${idx}`} className="min-h-[100px] p-2 bg-[var(--bg-secondary)]/50 border border-[var(--border)] opacity-50"></div>
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
 className={`min-h-[100px] p-2 border transition-all ${
 isToday ? 'bg-[var(--bg-secondary)] border-[var(--border)] ring-1 ring-white' : 'bg-white border-[var(--border)] hover:border-[var(--border)] hover:'
 }`}
 >
 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
 isToday ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-medium border border-[var(--border)] hover:bg-[var(--btn-primary-hover)] ' : 'text-[var(--text-primary)]'
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










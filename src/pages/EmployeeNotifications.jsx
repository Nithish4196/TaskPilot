import { useState } from 'react';
import { Bell, CheckSquare, MessageSquare, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { useAppContext, supabase } from '../context/AppContext';

export default function EmployeeNotifications() {
 const { currentUser, notifications, fetchGlobalData } = useAppContext();
 
 // Filter for current user's notifications
 const myNotifications = notifications.filter(n => n.recipient_id === currentUser?.id);

 const markAllRead = async () => {
 const unreadIds = myNotifications.filter(n => !n.is_read).map(n => n.id);
 if (unreadIds.length > 0) {
 await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
 fetchGlobalData();
 }
 };

 const deleteNotification = async (id) => {
 await supabase.from('notifications').delete().eq('id', id);
 fetchGlobalData();
 };

 const markRead = async (id) => {
 await supabase.from('notifications').update({ is_read: true }).eq('id', id);
 fetchGlobalData();
 };

 const unreadCount = myNotifications.filter(n => !n.is_read).length;

 return (
 <div className="max-w-4xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="flex justify-between items-end mb-10">
 <div>
 <h1 className="page-title">Notifications</h1>
 <p className="text-[var(--text-secondary)] mt-2">Stay updated with tasks, alerts, and messages.</p>
 </div>
 {unreadCount > 0 && (
 <button 
 onClick={markAllRead}
 className="btn-primary"
 >
 Mark all as read
 </button>
 )}
 </div>

 <div className="bg-white border border-[var(--border)] overflow-hidden">
 {myNotifications.length === 0 ? (
 <div className="p-12 text-center">
 <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
 <Bell className="w-8 h-8 text-[var(--text-secondary)]" />
 </div>
 <h3 className="card-title">All caught up!</h3>
 <p className="text-[var(--text-secondary)] mt-2">You have no notifications at the moment.</p>
 </div>
 ) : (
 <div className="divide-y divide-slate-100">
 {myNotifications.map(notification => {
 
 let Icon = Bell;
 let bg = 'bg-[var(--bg-secondary)]';
 let color = 'text-[var(--text-secondary)]';
 
 if (notification.type.includes('deadline')) { Icon = Clock; bg = 'bg-amber-100'; color = 'text-amber-600'; }
 if (notification.type === 'overdue' || notification.type === 'team_task_overdue') { Icon = AlertCircle; bg = 'bg-red-100'; color = 'text-red-600'; }
 if (notification.type === 'module_start') { Icon = CheckCircle2; bg = 'bg-emerald-100'; color = 'text-emerald-600'; }

 return (
 <div 
 key={notification.id} 
 className={`p-6 flex gap-6 transition-colors ${notification.is_read ? 'bg-white' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/50'}`}
 >
 <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${bg} ${color}`}>
 <Icon className="w-6 h-6" />
 </div>
 
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start mb-1">
 <h4 className={`text-base font-bold truncate pr-4 ${notification.is_read ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
 {notification.title}
 </h4>
 <span className="text-xs font-bold text-[var(--text-secondary)] whitespace-nowrap">{new Date(notification.created_at).toLocaleDateString()}</span>
 </div>
 <p className={`text-sm ${notification.is_read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)] font-medium'}`}>
 {notification.message}
 </p>
 
 <div className="flex gap-6 mt-3">
 {!notification.is_read && (
 <button onClick={() => markRead(notification.id)} className="text-xs font-bold text-[var(--text-primary)] hover:text-[var(--text-primary)]">
 Mark as read
 </button>
 )}
 <button onClick={() => deleteNotification(notification.id)} className="text-xs font-bold text-[var(--text-secondary)] hover:text-red-600 flex items-center gap-1">
 <Trash2 className="w-3 h-3" /> Delete
 </button>
 </div>
 </div>
 
 {!notification.is_read && (
 <div className="w-2.5 h-2.5 bg-[var(--bg-secondary)]0 rounded-full shrink-0 mt-2"></div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 );
}








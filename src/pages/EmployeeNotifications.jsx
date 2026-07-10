import { useState } from 'react';
import { Bell, CheckSquare, MessageSquare, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

export default function EmployeeNotifications() {
  const [notifications, setNotifications] = useState([]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 mt-2">Stay updated with tasks, alerts, and messages.</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
            <p className="text-slate-500 mt-2">You have no notifications at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(notification => {
              const Icon = notification.icon;
              return (
                <div 
                  key={notification.id} 
                  className={`p-6 flex gap-4 transition-colors ${notification.read ? 'bg-white' : 'bg-slate-50 hover:bg-slate-100/50'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${notification.bg} ${notification.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-base font-bold truncate pr-4 ${notification.read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs font-bold text-slate-400 whitespace-nowrap">{notification.time}</span>
                    </div>
                    <p className={`text-sm ${notification.read ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex gap-4 mt-3">
                      {!notification.read && (
                        <button onClick={() => markRead(notification.id)} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                          Mark as read
                        </button>
                      )}
                      <button onClick={() => deleteNotification(notification.id)} className="text-xs font-bold text-slate-400 hover:text-red-600 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 bg-brand-500 rounded-full shrink-0 mt-2"></div>
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

import React, { useState } from 'react';
import { Bell, X, Check, Trash2, Calendar, Target, Briefcase, MessageSquare, Award, Clock, AlertCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && <NotificationDrawer onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export const NotificationDrawer = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState('All'); // All, Unread

  const filtered = filter === 'Unread' ? notifications.filter(n => !n.is_read) : notifications;

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Low': default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'System': return <AlertCircle className="w-4 h-4" />;
      case 'Project': return <Briefcase className="w-4 h-4" />;
      case 'Module': return <Target className="w-4 h-4" />;
      case 'Calendar': return <Calendar className="w-4 h-4" />;
      case 'Reward': return <Award className="w-4 h-4" />;
      case 'Feedback': return <MessageSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[400px] max-w-[90vw] bg-[var(--bg-primary)] border-l border-[var(--border)] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Notifications</h2>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-xs font-bold">
                {notifications.filter(n => !n.is_read).length} New
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAllAsRead} className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Mark all read
            </button>
            <button onClick={onClose} className="p-1 hover:bg-[var(--bg-secondary)] rounded-full text-[var(--text-secondary)]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-3 border-b border-[var(--border)] bg-[var(--surface)]">
          {['All', 'Unread'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${filter === f ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] opacity-50 space-y-4">
              <Bell className="w-12 h-12" />
              <p className="text-sm font-semibold">No notifications</p>
            </div>
          ) : (
            filtered.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 rounded-xl border transition-all ${notification.is_read ? 'bg-[var(--surface)] border-transparent opacity-75 hover:opacity-100' : 'bg-[var(--bg-primary)] border-[var(--border)] shadow-sm'}`}
                onClick={() => { if (!notification.is_read) markAsRead(notification.id); }}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                    {getCategoryIcon(notification.category)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`text-sm font-bold truncate ${notification.is_read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-[10px] text-[var(--text-secondary)] whitespace-nowrap">
                        {new Date(notification.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    
                    <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                      {notification.description}
                    </p>

                    <div className="flex items-center gap-2">
                      {notification.action_url && (
                        <a 
                          href={notification.action_url}
                          className="px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--btn-primary-bg)] hover:text-[var(--btn-primary-text)] text-[var(--text-primary)] text-[10px] font-bold rounded transition-colors"
                        >
                          View Details
                        </a>
                      )}
                      
                      {!notification.is_read && (
                        <button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} className="p-1 text-[var(--text-secondary)] hover:text-green-500 transition-colors ml-auto">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} className="p-1 text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

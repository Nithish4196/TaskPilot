import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase, useAppContext } from './AppContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial notifications and subscribe to realtime events
  useEffect(() => {
    if (!currentUser || currentUser.id === 'admin-1') return;
    const fetchNotifications = async () => {
      if (!currentUser || currentUser.id === 'admin-1') return; // Prevent 400 error for invalid UUID
      try {
        setIsLoading(true);
        // 1. Fetch preferences
        const { data: prefData } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        
        if (prefData) {
          setPreferences(prefData);
        } else {
          // Auto-create default preferences if none exist
          const defaultPrefs = { user_id: currentUser.id };
          await supabase.from('notification_preferences').insert(defaultPrefs);
          setPreferences(defaultPrefs);
        }

        // 2. Fetch top 20 notifications
        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .eq('receiver_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (notifData) {
          setNotifications(notifData);
          setUnreadCount(notifData.filter(n => !n.is_read).length);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // 3. Set up Real-Time Listener
    const subscription = supabase.channel('schema-db-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `receiver_id=eq.${currentUser.id}`
      }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(count => count + 1);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'notifications',
        filter: `receiver_id=eq.${currentUser.id}`
      }, payload => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
        // Unread count is re-calculated whenever we mark as read in the markAsRead function
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  // Actions
  const markAsRead = async (notificationId) => {
    if (!notificationId) return;
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await supabase.from('notifications').update({ is_read: true }).eq('receiver_id', currentUser.id).eq('is_read', false);
  };

  const deleteNotification = async (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    // If it was unread, decrement
    const isUnread = notifications.find(n => n.id === notificationId && !n.is_read);
    if (isUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    await supabase.from('notifications').delete().eq('id', notificationId);
  };

  const updatePreferences = async (newPrefs) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
    await supabase.from('notification_preferences').update(newPrefs).eq('user_id', currentUser.id);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      preferences,
      isLoading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      updatePreferences
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

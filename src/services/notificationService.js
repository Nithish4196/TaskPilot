import { supabase } from '../context/AppContext';

export const notificationService = {
  /**
   * Publishes a new notification to the enterprise notification system.
   * Also implements smart de-duplication so we don't spam users.
   */
  publishEvent: async (payload) => {
    try {
      const { 
        sender_id, 
        receiver_id, 
        project_id, 
        module_id, 
        task_id, 
        title, 
        description, 
        event_type, 
        priority = 'Low', 
        category = 'System', 
        action_url,
        metadata = {} 
      } = payload;

      if (!receiver_id) return null;
      if (sender_id === receiver_id) return null; // Don't notify yourself

      // Smart De-duplication check
      // Check if an identical UNREAD event from the same sender on the same entity exists
      let query = supabase.from('notifications')
        .select('id')
        .eq('receiver_id', receiver_id)
        .eq('event_type', event_type)
        .eq('is_read', false)
        .eq('archived', false);

      if (sender_id) query = query.eq('sender_id', sender_id);
      if (project_id) query = query.eq('project_id', project_id);
      if (module_id) query = query.eq('module_id', module_id);
      if (task_id) query = query.eq('task_id', task_id);

      const { data: existing } = await query.limit(1);

      if (existing && existing.length > 0) {
        // We already have an unread notification for this exact event.
        // We can just update its timestamp to bump it to the top.
        await supabase.from('notifications')
          .update({ created_at: new Date().toISOString() })
          .eq('id', existing[0].id);
        return existing[0];
      }

      // Create new notification
      const { data, error } = await supabase.from('notifications').insert({
        sender_id,
        receiver_id,
        project_id,
        module_id,
        task_id,
        title,
        description,
        event_type,
        priority,
        category,
        action_url,
        metadata
      }).select();

      if (error) throw error;
      return data?.[0];

    } catch (err) {
      console.error('Failed to publish notification event:', err);
      return null;
    }
  }
};

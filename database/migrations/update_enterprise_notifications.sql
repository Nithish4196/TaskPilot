-- ==============================================================================
-- X10 Enterprise Notification System Schema
-- ==============================================================================

-- 1. Create or Replace notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
    enable_email BOOLEAN DEFAULT true,
    enable_in_app BOOLEAN DEFAULT true,
    enable_browser BOOLEAN DEFAULT true,
    daily_reminder BOOLEAN DEFAULT true,
    submission_reminder BOOLEAN DEFAULT true,
    reward_alerts BOOLEAN DEFAULT true,
    project_alerts BOOLEAN DEFAULT true,
    calendar_alerts BOOLEAN DEFAULT true,
    muted_projects UUID[] DEFAULT '{}',
    muted_teams UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Drop existing notifications table if it exists to replace with enterprise schema
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 3. Create Enterprise Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.employees(id) ON DELETE SET NULL, -- Who generated this
    receiver_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, -- Who receives this
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.project_modules(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL, -- e.g., 'Daily Update Submitted'
    priority TEXT NOT NULL DEFAULT 'Low', -- Critical, High, Medium, Low
    category TEXT NOT NULL DEFAULT 'System', -- Approval, Submission, Project, Calendar, Reward, etc.
    action_url TEXT, -- Deep link (e.g., /dashboard/submissions/123)
    is_read BOOLEAN DEFAULT false,
    archived BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb, -- Extra data (rating score, feedback text, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Notifications
CREATE POLICY "Users can read own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = receiver_id);

CREATE POLICY "Users can update own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = receiver_id);

CREATE POLICY "Users can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL); -- ANY authenticated user can trigger an event (sender)
    
CREATE POLICY "Users can delete own notifications"
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = receiver_id);

-- 6. RLS Policies for Preferences
CREATE POLICY "Users can read own preferences"
    ON public.notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON public.notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert own preferences"
    ON public.notification_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 7. Trigger for updating timestamps on preferences
CREATE OR REPLACE FUNCTION update_preference_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notification_preferences_updated ON public.notification_preferences;
CREATE TRIGGER trg_notification_preferences_updated
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_preference_timestamp();

-- 8. Indexes for Performance (Real-time and querying)
CREATE INDEX idx_notifications_receiver ON public.notifications(receiver_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- 9. Add notifications to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

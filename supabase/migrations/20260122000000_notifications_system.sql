-- Notifications table for storing autonomous directives and system alerts
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Notification metadata
    type text NOT NULL CHECK (type IN ('directive', 'alert', 'system', 'stewardship')),
    severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title text NOT NULL,
    message text NOT NULL,
    
    -- Directive-specific data
    directive_data jsonb, -- Full directive object from Sentinel
    affected_regions text[],
    statistics jsonb,
    
    -- Targeting
    target_audience text NOT NULL CHECK (target_audience IN ('admin', 'all', 'region')),
    target_regions text[], -- If target_audience = 'region'
    
    -- Status
    is_read boolean DEFAULT false,
    read_by uuid[], -- Array of user IDs who have read it
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz, -- Optional auto-expire
    
    -- Source tracking
    source text DEFAULT 'sentinel_agent'
);

-- Index for efficient querying
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_target ON notifications(target_audience);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admins can see all notifications
CREATE POLICY "Admins can view all notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Regular users see public notifications (region filtering can be added later when user_profiles has region)
CREATE POLICY "Users can view public notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (target_audience = 'all');

-- Function to auto-create notification from directive
CREATE OR REPLACE FUNCTION create_directive_notification(
    directive_json jsonb
) RETURNS uuid AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO notifications (
        type,
        severity,
        title,
        message,
        directive_data,
        affected_regions,
        statistics,
        target_audience,
        target_regions,
        expires_at
    ) VALUES (
        'directive',
        CASE 
            WHEN directive_json->>'status' = 'ALERT' THEN 'critical'
            ELSE 'warning'
        END,
        directive_json->>'directive_title',
        directive_json->>'directive_body',
        directive_json,
        ARRAY(SELECT jsonb_array_elements_text(directive_json->'affected_regions')),
        directive_json->'statistics',
        CASE 
            WHEN directive_json->>'status' = 'ALERT' THEN 'all'
            ELSE 'admin'
        END,
        ARRAY(SELECT jsonb_array_elements_text(directive_json->'affected_regions')),
        now() + interval '30 days'
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    notification_id uuid,
    user_id uuid
) RETURNS void AS $$
BEGIN
    UPDATE notifications
    SET read_by = array_append(
        COALESCE(read_by, ARRAY[]::uuid[]),
        user_id
    )
    WHERE id = notification_id
    AND NOT (read_by @> ARRAY[user_id]); -- Only if not already in array
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

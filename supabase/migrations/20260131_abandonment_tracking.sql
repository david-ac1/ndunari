-- Add abandonment tracking fields to medication_courses table
-- This enables Sentinel and Stewardship agents to analyze AMR risk patterns

ALTER TABLE medication_courses 
ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS abandonment_reason TEXT;

-- Create index for abandoned medications query performance
CREATE INDEX IF NOT EXISTS idx_medication_courses_abandoned 
ON medication_courses(user_id, status) 
WHERE status = 'abandoned';

-- Comment the columns for clarity
COMMENT ON COLUMN medication_courses.abandoned_at IS 'Timestamp when the medication course was abandoned by the user';
COMMENT ON COLUMN medication_courses.abandonment_reason IS 'Reason for abandonment (e.g., user_stopped_early, side_effects, etc.)';

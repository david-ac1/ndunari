-- Add dosage timing columns to existing medication_courses table
-- Safe to run multiple times

-- Add dose_interval_hours if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medication_courses' 
        AND column_name = 'dose_interval_hours'
    ) THEN
        ALTER TABLE public.medication_courses 
        ADD COLUMN dose_interval_hours int;
    END IF;
END $$;

-- Add next_dose_due if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medication_courses' 
        AND column_name = 'next_dose_due'
    ) THEN
        ALTER TABLE public.medication_courses 
        ADD COLUMN next_dose_due timestamptz;
    END IF;
END $$;

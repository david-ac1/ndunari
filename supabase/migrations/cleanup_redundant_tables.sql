-- Migration: Cleanup Redundant Tables
-- Description: Drops the confused 'user_profiles' table to enforce usage of 'profiles'.

-- 1. Drop the legacy/confused table if it exists
DROP TABLE IF EXISTS public.user_profiles;

-- 2. Ensure 'profiles' table is the source of truth
-- (This just verifies it exists, doesn't recreate it as that's handled by previous scripts)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE EXCEPTION 'CRITICAL: public.profiles table is missing. Please run 20260126_combined_profiles_setup.sql first.';
    ELSE
        RAISE NOTICE '✅ public.profiles exists and is the active table.';
    END IF;
END $$;

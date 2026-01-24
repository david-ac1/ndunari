-- Migration: Fix Policy Dependencies and Cleanup
-- Description: Updates notification policies to use 'profiles' instead of 'user_profiles', then drops 'user_profiles'.

-- 1. Drop the offending policy
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;

-- 2. Recreate the policy pointing to the correct 'profiles' table
CREATE POLICY "Admins can view all notifications"
  ON public.notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. Now we can safely drop the legacy table
DROP TABLE IF EXISTS public.user_profiles;

-- 4. Verification Check
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        RAISE EXCEPTION 'Failed to drop user_profiles table via script.';
    ELSE
        RAISE NOTICE '✅ Successfully dropped legacy user_profiles table.';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE NOTICE '⚠️ WARNING: public.profiles table seems missing. Please run the setup script.';
    ELSE
        RAISE NOTICE '✅ public.profiles table is active.';
    END IF;
END $$;

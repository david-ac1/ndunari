-- Migration: Promote User to Admin (Manual)
-- Version: 20260124_promote_admin
-- Description: Run this SQL in Supabase Dashboard to force-promote a user to Admin

-- 1. Replace 'YOUR_EMAIL@EXAMPLE.COM' with your actual production email
DO $$
DECLARE
    target_email TEXT := 'YOUR_EMAIL@EXAMPLE.COM'; -- << CHANGE THIS
    target_user_id UUID;
BEGIN
    -- Find the user ID from auth.users
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User not found: %', target_email;
    ELSE
        -- 2. Bypass the trigger to update the role
        -- We temporarily disable the trigger for this transaction
        ALTER TABLE public.user_profiles DISABLE TRIGGER on_role_change;

        UPDATE public.user_profiles
        SET role = 'admin'
        WHERE id = target_user_id;

        -- Re-enable the trigger immediately
        ALTER TABLE public.user_profiles ENABLE TRIGGER on_role_change;
        
        RAISE NOTICE 'User % promoted to Admin successfully.', target_email;
    END IF;
END $$;

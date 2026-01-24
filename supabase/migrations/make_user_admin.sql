-- Migration: Promote User to Admin (Robust Upsert)
-- Version: 20260126_promote_admin_v2
-- Description: Safely promotes a user to Admin, creating the profile row if it's missing (sync issue).

DO $$
DECLARE
    target_email TEXT := 'davidachibiri8@gmail.com'; -- << REPLACE THIS WITH YOUR EMAIL
    target_user_id UUID;
    target_meta JSONB;
BEGIN
    -- 1. Find the user ID and Metadata from auth.users
    SELECT id, raw_user_meta_data INTO target_user_id, target_meta 
    FROM auth.users 
    WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ User not found in auth.users: %', target_email;
    ELSE
        -- 2. Upsert into public.profiles
        -- This handles two cases:
        -- A) Profile exists: Updates role to 'admin'
        -- B) Profile missing (sync error): Creates new profile with 'admin' role
        
        INSERT INTO public.profiles (id, display_name, avatar_url, role, preferred_language)
        VALUES (
            target_user_id,
            COALESCE(target_meta->>'full_name', 'Admin User'),
            COALESCE(target_meta->>'avatar_url', ''),
            'admin',
            'en'
        )
        ON CONFLICT (id) DO UPDATE
        SET role = 'admin',
            updated_at = now();
            
        RAISE NOTICE '✅ SUCCESS: User % is now an Admin.', target_email;
    END IF;
END $$;

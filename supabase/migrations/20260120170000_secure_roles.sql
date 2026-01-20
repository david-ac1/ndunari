-- Migration: Hardening Admin Role Security
-- Version: 20260120170000
-- Description: Prevent users from self-promoting to Admin via API

create or replace function public.prevent_role_change()
returns trigger as $$
begin
  -- Allow if it's the Service Role (Supabase Dashboard / Admin API)
  if (auth.jwt() ->> 'role' = 'service_role') then
    return new;
  end if;

  -- Block if role is changing
  if (old.role is distinct from new.role) then
    raise exception 'UNAUTHORIZED: You cannot change your own role. Contact a System Administrator.';
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to protect the 'role' column on user_profiles
drop trigger if exists on_role_change on public.user_profiles;
create trigger on_role_change
  before update of role on public.user_profiles
  for each row
  execute function public.prevent_role_change();

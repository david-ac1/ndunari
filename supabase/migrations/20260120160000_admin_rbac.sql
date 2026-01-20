-- Migration: Admin RBAC Policies (God View)
-- Version: 20260120160000
-- Description: Grant read access to Admins for all scans and profiles

-- 1. Helper function to check if user is admin
-- (Ideally we check via JWT claim, but for robust RLS we can also check the profile)
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$ language sql security definer;

-- 2. Update SCANS policies
-- Allow admins to see ALL scans (Counterfeit Heatmap)
create policy "Admins can view all scans"
  on public.scans
  for select
  using (public.is_admin());

-- 3. Update USER_PROFILES policies
-- Allow admins to see ALL profiles (Surveillance & Contact Tracing)
create policy "Admins can view all profiles"
  on public.user_profiles
  for select
  using (public.is_admin());

-- 4. Update SCAN_EVIDENCE policies
-- Allow admins to view 3D evidence (Forensic Vault)
create policy "Admins can view all scan evidence"
  on public.scan_evidence
  for select
  using (public.is_admin());

-- 5. Update GUARDIAN_IMPACT policies
-- Allow admins to view leaderboard/stats (Audit)
create policy "Admins can view all guardian impact"
  on public.guardian_impact
  for select
  using (public.is_admin());

-- 6. Update DRUGS policies
-- Allow admins to INSERT/UPDATE/DELETE drugs (Registry Management)
create policy "Admins can manage drugs"
  on public.drugs
  for all
  using (public.is_admin());

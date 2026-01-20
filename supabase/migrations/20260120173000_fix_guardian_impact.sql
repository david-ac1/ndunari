-- Migration: Create Guardian Impact Table (Fix)
-- Version: 20260120173000
-- Description: Create guardian_impact table if it doesn't exist

create table if not exists public.guardian_impact (
  user_id uuid references auth.users(id) on delete cascade primary key,
  total_points integer default 0,
  rank_title text default 'Novice Guardian',
  updated_at timestamptz default now()
);

-- RLS POLICIES (Security)
alter table public.guardian_impact enable row level security;

-- Users can read their own score
drop policy if exists "Users can view own impact" on public.guardian_impact;
create policy "Users can view own impact"
  on public.guardian_impact for select
  using (auth.uid() = user_id);

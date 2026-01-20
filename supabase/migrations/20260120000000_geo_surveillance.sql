-- Enable PostGIS extension for geospatial queries
create extension if not exists postgis;

-- 1. SCANS TABLE (The Forensic Log)
create table if not exists public.scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  
  -- Metadata
  drug_name text not null,
  authenticity_score numeric check (authenticity_score >= 0 and authenticity_score <= 100),
  risk_level text check (risk_level in ('safe', 'caution', 'danger')),
  
  -- Geographic Location (WGS84)
  location geography(POINT, 4326),
  
  -- Artifact Links
  digital_twin_url text, -- Link to .glb file in Storage
  
  -- Thought Signature (Audit Trail)
  thought_signature text
);

-- Index for fast geospatial querying (finding clusters)
create index if not exists scans_geo_idx on public.scans using GIST (location);
create index if not exists scans_user_idx on public.scans (user_id);


-- 2. GUARDIAN IMPACT TABLE (Gamification)
create table if not exists public.guardian_impact (
  user_id uuid references auth.users(id) on delete cascade primary key,
  total_points integer default 0,
  rank_title text default 'Novice Guardian',
  updated_at timestamptz default now()
);

-- RLS POLICIES (Security)
alter table public.guardian_impact enable row level security;

-- Users can read their own score
create policy "Users can view own impact"
  on public.guardian_impact for select
  using (auth.uid() = user_id);

-- Only system (service_role) can update points
-- ( Implicitly denied for anon/authenticated users by default )


-- 3. STORAGE BUCKET CONFIGURATION (Scripted setup)
-- Note: Buckets are usually set up via API or dashboard, but we can attempt to assert it here if utilizing supabase-db extensions.
-- For standard migrations, we just define the reference in the table (digital_twin_url).

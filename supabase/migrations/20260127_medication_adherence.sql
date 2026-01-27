-- Create Enums (idempotent)
drop type if exists medication_category cascade;
create type medication_category as enum ('ANTIBIOTIC', 'ANTIMALARIAL', 'ANTIVIRAL', 'OTHER');

drop type if exists course_status cascade;
create type course_status as enum ('active', 'completed', 'abandoned');

-- Create Courses Table
create table public.medication_courses (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    drug_name text not null,
    indication text,
    category medication_category default 'OTHER',
    total_doses int not null,
    doses_taken int default 0,
    frequency text, -- e.g. "2x Daily"
    dose_interval_hours int, -- e.g. 8, 12, 24
    start_date timestamptz default now(),
    last_dose_time timestamptz,
    next_dose_due timestamptz,
    status course_status default 'active',
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.medication_courses enable row level security;

-- Policies
create policy "Users can view their own courses"
on public.medication_courses for select
using (auth.uid() = user_id);

create policy "Users can insert their own courses"
on public.medication_courses for insert
with check (auth.uid() = user_id);

create policy "Users can update their own courses"
on public.medication_courses for update
using (auth.uid() = user_id);

create policy "Users can delete their own courses"
on public.medication_courses for delete
using (auth.uid() = user_id);

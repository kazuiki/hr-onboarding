-- PostgreSQL Migration for Secure HR Onboarding Portal
-- Author: Claude Code (Senior Supabase Architect)
-- Date: 2026-09-15

-- 1. Create Enums
create type user_role as enum ('hr_manager', 'hr_assistant', 'employee');
create type task_status as enum ('not_started', 'in_progress', 'submitted', 'needs_changes', 'approved');
create type employee_status as enum ('active', 'completed', 'archived');
create type task_category as enum ('welcome', 'form', 'photo', 'document', 'medical', 'first_day', 'privacy', 'help', 'completion');
create type help_status as enum ('open', 'in_progress', 'resolved');

-- 2. Profiles Table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role user_role default 'employee' not null,
  full_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Employees Table (Linked to Profiles)
create table employees (
  id uuid references profiles(id) on delete cascade primary key,
  employee_number text unique not null,
  position text not null,
  department text not null,
  manager_name text not null,
  start_date date not null,
  access_window_days integer default 30 not null,
  status employee_status default 'active' not null,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. Onboarding Templates
create table onboarding_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  department text,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 5. Template Tasks
create table template_tasks (
  id uuid default gen_random_uuid() primary key,
  template_id uuid references onboarding_templates(id) on delete cascade not null,
  title text not null,
  description text,
  category task_category not null,
  required boolean default true not null,
  display_order integer default 0 not null,
  config jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

-- 6. Onboarding Packets (Individual Employee Instance)
create table onboarding_packets (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references employees(id) on delete cascade not null unique,
  template_id uuid references onboarding_templates(id) on delete set null,
  welcome_message text default 'Welcome to our team! We are excited to have you join us. Please complete your onboarding requirements prior to your first day.' not null,
  completion_percentage integer default 0 not null,
  has_watched_orientation boolean default false not null,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 7. Onboarding Tasks (Employee Tasks)
create table onboarding_tasks (
  id uuid default gen_random_uuid() primary key,
  packet_id uuid references onboarding_packets(id) on delete cascade not null,
  employee_id uuid references employees(id) on delete cascade not null,
  title text not null,
  description text,
  category task_category not null,
  status task_status default 'not_started' not null,
  required boolean default true not null,
  display_order integer default 0 not null,
  feedback text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id) on delete set null,
  config jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 8. Document Submissions
create table document_submissions (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references onboarding_tasks(id) on delete cascade not null,
  employee_id uuid references employees(id) on delete cascade not null,
  requirement_name text not null,
  file_name text not null,
  file_path text not null,
  file_size integer not null,
  mime_type text not null,
  status task_status default 'submitted' not null,
  rejection_reason text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 9. Photo Submissions
create table photo_submissions (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references onboarding_tasks(id) on delete cascade not null,
  employee_id uuid references employees(id) on delete cascade not null,
  file_path text not null,
  file_size integer not null,
  mime_type text not null,
  status task_status default 'submitted' not null,
  feedback text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 10. Form Submissions
create table form_submissions (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references onboarding_tasks(id) on delete cascade not null,
  employee_id uuid references employees(id) on delete cascade not null,
  form_type text not null,
  form_data jsonb not null,
  status task_status default 'submitted' not null,
  submitted_at timestamptz default now() not null
);

-- 11. Medical Records
create table medical_records (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references employees(id) on delete cascade not null unique,
  clinic_name text default 'Affiliated Health Center' not null,
  clinic_address text default 'Tower 2, Medical Arts Building, Makati City' not null,
  clinic_schedule text default 'Monday to Friday, 8:00 AM - 3:00 PM (Fasting required)' not null,
  expense_notes text default 'Company will directly cover standard pre-employment medical examinations (PEME). Bring company referral form.' not null,
  referral_doc_path text,
  proof_doc_path text,
  status task_status default 'not_started' not null,
  feedback text,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 12. First Day Guides
create table first_day_guides (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references employees(id) on delete cascade not null unique,
  office_name text default 'Philkoei Corporate Headquarters' not null,
  office_address text default '15th Floor, Enterprise Center, Ayala Avenue, Makati City' not null,
  arrival_time text default '8:00 AM Sharp' not null,
  dress_code text default 'Smart-Casual (Collared shirts, slacks/chinos, closed-toe shoes; no slippers or distressed denim)' not null,
  reporting_to text default 'HR Reception / Assigned Department Supervisor' not null,
  items_to_bring text[] default array['Original Government Valid IDs', 'Physical NBI Clearance', 'Bank Account Details for Payroll', 'Notarized Employment Agreement']::text[],
  intro_video_url text default 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  map_instructions text default 'Take the high-zone elevator to the 15th floor and register at the reception desk.',
  created_at timestamptz default now() not null
);

-- 13. Privacy Policies & Acknowledgements
create table privacy_policies (
  id uuid default gen_random_uuid() primary key,
  version text not null,
  title text not null,
  content text not null,
  effective_date date not null,
  is_current boolean default true not null,
  created_at timestamptz default now() not null
);

create table privacy_acknowledgements (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references employees(id) on delete cascade not null,
  policy_id uuid references privacy_policies(id) on delete cascade not null,
  policy_version text not null,
  acknowledged_at timestamptz default now() not null,
  ip_address text,
  user_agent text
);

-- 14. Help Requests
create table help_requests (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references employees(id) on delete cascade not null,
  subject text not null,
  message text not null,
  status help_status default 'open' not null,
  hr_response text,
  responded_by uuid references profiles(id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 15. Audit Events (Immutable compliance log)
create table audit_events (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references profiles(id) on delete set null,
  actor_role user_role not null,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

-- =========================================================================
-- HELPER FUNCTIONS FOR RLS & PROGRESS
-- =========================================================================

-- Function to check if authenticated user is HR
create or replace function is_hr()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('hr_manager', 'hr_assistant')
  );
end;
$$ language plpgsql security definer;

-- Function to recalculate packet progress
create or replace function recalculate_packet_progress(p_packet_id uuid)
returns void as $$
declare
  total_req integer;
  approved_count integer;
  new_pct integer;
begin
  select count(*) into total_req from onboarding_tasks where packet_id = p_packet_id and required = true;
  select count(*) into approved_count from onboarding_tasks where packet_id = p_packet_id and required = true and status = 'approved';

  if total_req > 0 then
    new_pct := (approved_count * 100) / total_req;
  else
    new_pct := 100;
  end if;

  update onboarding_packets
  set completion_percentage = new_pct,
      completed_at = case when new_pct = 100 then now() else null end,
      updated_at = now()
  where id = p_packet_id;
end;
$$ language plpgsql security definer;

-- =========================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- =========================================================================

alter table profiles enable row level security;
alter table employees enable row level security;
alter table onboarding_templates enable row level security;
alter table template_tasks enable row level security;
alter table onboarding_packets enable row level security;
alter table onboarding_tasks enable row level security;
alter table document_submissions enable row level security;
alter table photo_submissions enable row level security;
alter table form_submissions enable row level security;
alter table medical_records enable row level security;
alter table first_day_guides enable row level security;
alter table privacy_policies enable row level security;
alter table privacy_acknowledgements enable row level security;
alter table help_requests enable row level security;
alter table audit_events enable row level security;

-- 1. Profiles Policies
create policy "Users can read own profile or HR can read all" on profiles
  for select using (auth.uid() = id or is_hr());

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));

create policy "HR can manage profiles" on profiles
  for all using (is_hr());

-- 2. Employees Policies
create policy "Employees can read own record or HR can read all" on employees
  for select using (auth.uid() = id or is_hr());

create policy "HR can manage employee records" on employees
  for all using (is_hr());

-- 3. Onboarding Packets Policies
create policy "Employees can view own packet or HR can view all" on onboarding_packets
  for select using (auth.uid() = employee_id or is_hr());

create policy "HR can manage packets" on onboarding_packets
  for all using (is_hr());

-- 4. Onboarding Tasks Policies
create policy "Employees can read own tasks or HR can read all" on onboarding_tasks
  for select using (auth.uid() = employee_id or is_hr());

create policy "Employees can update task status to submitted" on onboarding_tasks
  for update using (auth.uid() = employee_id)
  with check (auth.uid() = employee_id and status in ('in_progress', 'submitted'));

create policy "HR can manage all tasks and reviews" on onboarding_tasks
  for all using (is_hr());

-- 5. Submissions Policies (Documents, Photos, Forms)
create policy "Submissions isolation for documents" on document_submissions
  for all using (auth.uid() = employee_id or is_hr());

create policy "Submissions isolation for photos" on photo_submissions
  for all using (auth.uid() = employee_id or is_hr());

create policy "Submissions isolation for forms" on form_submissions
  for all using (auth.uid() = employee_id or is_hr());

-- 6. Medical Records Policies
create policy "Medical record security isolation" on medical_records
  for select using (auth.uid() = employee_id or is_hr());

create policy "Employees can update medical submission" on medical_records
  for update using (auth.uid() = employee_id);

create policy "HR can manage medical records" on medical_records
  for all using (is_hr());

-- 7. First Day & Privacy Policies
create policy "First day guides viewable by assigned employee or HR" on first_day_guides
  for select using (auth.uid() = employee_id or is_hr());

create policy "Privacy policies viewable by all authenticated" on privacy_policies
  for select using (auth.role() = 'authenticated');

create policy "Privacy acknowledgements isolation" on privacy_acknowledgements
  for all using (auth.uid() = employee_id or is_hr());

-- 8. Help Requests Policies
create policy "Help requests isolation" on help_requests
  for all using (auth.uid() = employee_id or is_hr());

-- 9. Audit Events Policies
create policy "HR can read audit events" on audit_events
  for select using (is_hr());

create policy "Authenticated users can insert audit events" on audit_events
  for insert with check (auth.uid() = actor_id);

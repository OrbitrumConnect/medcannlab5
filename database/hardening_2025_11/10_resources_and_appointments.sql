set search_path = public;

-- Educational Resources -------------------------------------------------------------------------

create table if not exists public.educational_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  description text,
  category text,
  resource_type text default 'other',
  url text,
  status text default 'draft',
  audience text[] default '{}',
  allowed_roles text[] default '{}',
  role_permissions text[] default '{}',
  allowed_axes text[] default '{}',
  axis_permissions text[] default '{}',
  visibility_scope text,
  metadata jsonb default '{}'::jsonb,
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists educational_resources_category_idx
  on public.educational_resources (category);

create index if not exists educational_resources_status_idx
  on public.educational_resources (status);

create index if not exists educational_resources_resource_type_idx
  on public.educational_resources (resource_type);

drop trigger if exists trg_educational_resources_updated_at
  on public.educational_resources;

create trigger trg_educational_resources_updated_at
before update on public.educational_resources
for each row execute function public.tg_set_updated_at();

alter table public.educational_resources enable row level security;

drop policy if exists educational_resources_select on public.educational_resources;
create policy educational_resources_select
  on public.educational_resources
  for select
  to authenticated
  using (
    coalesce(lower(status), 'draft') in ('published','ativo','active','liberado')
    or created_by = auth.uid()
    or coalesce(public.current_user_role(), 'patient') in ('admin','professional')
  );

drop policy if exists educational_resources_manage on public.educational_resources;
create policy educational_resources_manage
  on public.educational_resources
  for all
  to authenticated
  using (
    created_by = auth.uid()
    or coalesce(public.current_user_role(), 'patient') in ('admin','professional')
  )
  with check (
    created_by = auth.uid()
    or coalesce(public.current_user_role(), 'patient') in ('admin','professional')
  );

-- Appointments -----------------------------------------------------------------------------------

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references auth.users (id) on delete set null,
  professional_id uuid references auth.users (id) on delete set null,
  doctor_id uuid references auth.users (id) on delete set null,
  title text,
  description text,
  appointment_date timestamptz not null,
  appointment_time text,
  duration integer default 60,
  appointment_type text,
  service_type text,
  specialty text,
  location text,
  room text,
  is_remote boolean default true,
  meeting_url text,
  status text default 'scheduled',
  priority text default 'normal',
  notes text,
  professional_name text,
  patient_notes text,
  rating numeric,
  comment text,
  metadata jsonb default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists appointments_patient_idx
  on public.appointments (patient_id);

create index if not exists appointments_professional_idx
  on public.appointments (professional_id);

create index if not exists appointments_date_idx
  on public.appointments (appointment_date);

drop trigger if exists trg_appointments_updated_at
  on public.appointments;

create trigger trg_appointments_updated_at
before update on public.appointments
for each row execute function public.tg_set_updated_at();

alter table public.appointments enable row level security;

drop policy if exists appointments_select on public.appointments;
create policy appointments_select
  on public.appointments
  for select
  to authenticated
  using (
    patient_id = auth.uid()
    or professional_id = auth.uid()
    or doctor_id = auth.uid()
    or coalesce(public.current_user_role(), 'patient') = 'admin'
  );

drop policy if exists appointments_manage on public.appointments;
create policy appointments_manage
  on public.appointments
  for all
  to authenticated
  using (
    professional_id = auth.uid()
    or doctor_id = auth.uid()
    or created_by = auth.uid()
    or coalesce(public.current_user_role(), 'patient') = 'admin'
  )
  with check (
    professional_id = auth.uid()
    or doctor_id = auth.uid()
    or created_by = auth.uid()
    or coalesce(public.current_user_role(), 'patient') = 'admin'
  );

-- View: v_patient_appointments -------------------------------------------------------------------

create or replace view public.v_patient_appointments as
select
  a.id,
  a.patient_id,
  p.name as patient_name,
  a.professional_id,
  coalesce(a.professional_name, prof.name) as professional_name,
  prof.name as professional_full_name,
  prof.email as professional_email,
  a.appointment_date,
  a.appointment_time,
  to_char(a.appointment_date, 'HH24:MI') as start_time,
  a.duration,
  coalesce(a.appointment_type, a.service_type) as appointment_type,
  coalesce(a.service_type, a.appointment_type) as service_type,
  a.status,
  a.is_remote,
  a.location,
  a.room,
  a.notes,
  a.priority
from public.appointments a
left join auth.users p on p.id = a.patient_id
left join auth.users prof on prof.id = coalesce(a.professional_id, a.doctor_id);

comment on view public.v_patient_appointments is
  'View exposing patient-safe appointment data with professional information for dashboards.';



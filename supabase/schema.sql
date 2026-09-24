-- =====================================================================
-- TABLA 1: REGISTROS MENSUALES CONSOLIDADOS (monthly_entries)
-- =====================================================================
create table if not exists public.monthly_entries (
  id uuid primary key default gen_random_uuid(),
  report_id text not null check (report_id in ('dengue', 'actividades', 'rabia')),
  year integer not null check (year between 2020 and 2035),
  month integer not null check (month between 1 and 12),
  facility_slug text not null,
  facility_name text not null,
  values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, year, month, facility_slug)
);

create index if not exists monthly_entries_period_idx
  on public.monthly_entries (year, month, report_id);

-- =====================================================================
-- TABLA 2: BITÁCORA DIARIA DE CAMPO (daily_logs)
-- Permite a los técnicos registrar actividades por jornada/turno (mañana/tarde/noche)
-- que luego alimentan automáticamente los formatos mensuales.
-- =====================================================================
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  facility_slug text not null,
  facility_name text not null,
  date date not null,
  year integer not null check (year between 2020 and 2035),
  month integer not null check (month between 1 and 12),
  shift text not null default 'manana' check (shift in ('manana', 'tarde', 'noche', 'completa')),
  community text not null default '',
  notes text default '',
  values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_logs_facility_date_idx
  on public.daily_logs (year, month, facility_slug);

-- Trigger de updated_at para ambas tablas
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists monthly_entries_set_updated_at on public.monthly_entries;
create trigger monthly_entries_set_updated_at
before update on public.monthly_entries
for each row
execute function public.set_updated_at();

drop trigger if exists daily_logs_set_updated_at on public.daily_logs;
create trigger daily_logs_set_updated_at
before update on public.daily_logs
for each row
execute function public.set_updated_at();

-- Políticas RLS para monthly_entries
alter table public.monthly_entries enable row level security;

drop policy if exists "monthly_entries_select_anon" on public.monthly_entries;
drop policy if exists "monthly_entries_insert_anon" on public.monthly_entries;
drop policy if exists "monthly_entries_update_anon" on public.monthly_entries;
drop policy if exists "monthly_entries_delete_anon" on public.monthly_entries;

create policy "monthly_entries_select_anon" on public.monthly_entries for select to anon using (true);
create policy "monthly_entries_insert_anon" on public.monthly_entries for insert to anon with check (true);
create policy "monthly_entries_update_anon" on public.monthly_entries for update to anon using (true) with check (true);
create policy "monthly_entries_delete_anon" on public.monthly_entries for delete to anon using (true);

-- Políticas RLS para daily_logs
alter table public.daily_logs enable row level security;

drop policy if exists "daily_logs_select_anon" on public.daily_logs;
drop policy if exists "daily_logs_insert_anon" on public.daily_logs;
drop policy if exists "daily_logs_update_anon" on public.daily_logs;
drop policy if exists "daily_logs_delete_anon" on public.daily_logs;

create policy "daily_logs_select_anon" on public.daily_logs for select to anon using (true);
create policy "daily_logs_insert_anon" on public.daily_logs for insert to anon with check (true);
create policy "daily_logs_update_anon" on public.daily_logs for update to anon using (true) with check (true);
create policy "daily_logs_delete_anon" on public.daily_logs for delete to anon using (true);

-- Sincronización confiable entre dispositivos.
-- Puede ejecutarse completa y repetidamente desde Supabase SQL Editor.

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select profiles.role
  from public.profiles as profiles
  where profiles.id = auth.uid()
    and profiles.active = true
  limit 1
$$;

revoke all on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;

create or replace function public.is_active_app_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_app_role() is not null
$$;

revoke all on function public.is_active_app_user() from public, anon;
grant execute on function public.is_active_app_user() to authenticated;

do $$
begin
  if to_regprocedure('public.configure_fixed_accounts()') is not null then
    perform public.configure_fixed_accounts();
  end if;
end
$$;

alter table public.profiles enable row level security;
alter table public.app_catalog enable row level security;
alter table public.monthly_entries enable row level security;
alter table public.daily_logs enable row level security;

revoke all on table public.profiles, public.app_catalog, public.monthly_entries, public.daily_logs from anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update on table public.app_catalog to authenticated;
grant select, insert, update on table public.monthly_entries to authenticated;
grant select, insert, update on table public.daily_logs to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'daily_logs'
    ) then
      alter publication supabase_realtime add table public.daily_logs;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'monthly_entries'
    ) then
      alter publication supabase_realtime add table public.monthly_entries;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_catalog'
    ) then
      alter publication supabase_realtime add table public.app_catalog;
    end if;
  end if;
end
$$;

notify pgrst, 'reload schema';

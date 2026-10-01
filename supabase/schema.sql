-- SALUD AMBIENTAL · ESQUEMA SEGURO PARA SUPABASE
-- Ejecutar desde el SQL Editor con una cuenta propietaria del proyecto.
-- Las contraseñas nunca se guardan en este archivo.

create extension if not exists pgcrypto;

-- ================================================================
-- PERFILES Y ROLES
-- ================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null,
  role text not null default 'technician'
    check (role in ('admin', 'supervisor', 'technician')),
  facility_slug text,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username));
create index if not exists profiles_role_idx
  on public.profiles (role) where active;

-- Validación estricta del catálogo compartido.
create or replace function public.valid_app_catalog(
  p_facilities jsonb,
  p_report_fields jsonb
)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  item_json jsonb;
  item_text text;
  item_slug text;
  report_key text;
  seen_slugs text[];
  object_key_count integer;
begin
  if jsonb_typeof(p_facilities) <> 'array'
     or jsonb_array_length(p_facilities) < 1
     or jsonb_array_length(p_facilities) > 100
     or jsonb_typeof(p_report_fields) <> 'object' then
    return false;
  end if;
  select count(*) into object_key_count from jsonb_object_keys(p_report_fields);
  if object_key_count <> 3
     or not (p_report_fields ?& array['dengue', 'rabia', 'actividades']) then
    return false;
  end if;

  seen_slugs := array[]::text[];
  for item_json in select value from jsonb_array_elements(p_facilities) loop
    if jsonb_typeof(item_json) <> 'string' then return false; end if;
    item_text := trim(item_json #>> '{}');
    item_slug := trim(both '_' from regexp_replace(
      translate(lower(item_text), 'áéíóúüñ', 'aeiouun'),
      '[^a-z0-9]+', '_', 'g'
    ));
    if item_text = '' or length(item_text) > 120 or item_slug = '' or item_slug = any(seen_slugs) then
      return false;
    end if;
    seen_slugs := array_append(seen_slugs, item_slug);
  end loop;

  foreach report_key in array array['dengue', 'rabia', 'actividades'] loop
    if jsonb_typeof(p_report_fields -> report_key) <> 'array'
       or jsonb_array_length(p_report_fields -> report_key) < 1
       or jsonb_array_length(p_report_fields -> report_key) > 250 then
      return false;
    end if;
    seen_slugs := array[]::text[];
    for item_json in select value from jsonb_array_elements(p_report_fields -> report_key) loop
      if jsonb_typeof(item_json) <> 'string' then return false; end if;
      item_text := trim(item_json #>> '{}');
      item_slug := trim(both '_' from regexp_replace(
        translate(lower(item_text), 'áéíóúüñ', 'aeiouun'),
        '[^a-z0-9]+', '_', 'g'
      ));
      if item_text = '' or length(item_text) > 160 or item_slug = '' or item_slug = any(seen_slugs) then
        return false;
      end if;
      seen_slugs := array_append(seen_slugs, item_slug);
    end loop;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;

revoke all on function public.valid_app_catalog(jsonb, jsonb) from public, anon;
grant execute on function public.valid_app_catalog(jsonb, jsonb) to authenticated;

create table if not exists public.app_catalog (
  id text primary key default 'main' check (id = 'main'),
  facilities jsonb not null,
  report_fields jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_catalog_payload_check
    check (public.valid_app_catalog(facilities, report_fields))
);

-- ================================================================
-- REGISTROS OPERATIVOS
-- ================================================================
create table if not exists public.monthly_entries (
  id uuid primary key default gen_random_uuid(),
  report_id text not null check (report_id in ('dengue', 'actividades', 'rabia')),
  year integer not null check (year between 2020 and 2035),
  month integer not null check (month between 1 and 12),
  facility_slug text not null,
  facility_name text not null,
  values jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (report_id, year, month, facility_slug)
);

alter table public.monthly_entries
  add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid(),
  add column if not exists updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  add column if not exists deleted_at timestamptz;

create index if not exists monthly_entries_period_idx
  on public.monthly_entries (year, month, report_id);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  facility_slug text not null,
  facility_name text not null,
  date date not null,
  year integer not null check (year between 2020 and 2035),
  month integer not null check (month between 1 and 12),
  shift text not null default 'manana'
    check (shift in ('manana', 'tarde', 'noche', 'completa')),
  community text not null default '',
  notes text default '',
  values jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.daily_logs
  add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid(),
  add column if not exists updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  add column if not exists deleted_at timestamptz;

create index if not exists daily_logs_facility_date_idx
  on public.daily_logs (year, month, facility_slug);

-- ================================================================
-- MARCAS DE AUDITORÍA
-- ================================================================
drop trigger if exists monthly_entries_set_updated_at on public.monthly_entries;
drop trigger if exists daily_logs_set_updated_at on public.daily_logs;
drop function if exists public.set_updated_at();

create or replace function public.set_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = now();
    new.updated_at = new.created_at;
    new.created_by = auth.uid();
    new.updated_by = auth.uid();
  else
    new.created_at = old.created_at;
    new.created_by = old.created_by;
    new.updated_at = now();
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists monthly_entries_set_audit_fields on public.monthly_entries;
create trigger monthly_entries_set_audit_fields
before insert or update on public.monthly_entries
for each row execute function public.set_audit_fields();

drop trigger if exists daily_logs_set_audit_fields on public.daily_logs;
create trigger daily_logs_set_audit_fields
before insert or update on public.daily_logs
for each row execute function public.set_audit_fields();

create or replace function public.set_catalog_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.id = 'main';
    new.revision = 1;
    new.created_at = now();
    new.updated_at = new.created_at;
    new.created_by = auth.uid();
    new.updated_by = auth.uid();
  else
    new.id = old.id;
    new.revision = old.revision + 1;
    new.created_at = old.created_at;
    new.created_by = old.created_by;
    new.updated_at = now();
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists app_catalog_set_audit_fields on public.app_catalog;
create trigger app_catalog_set_audit_fields
before insert or update on public.app_catalog
for each row execute function public.set_catalog_audit_fields();

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.created_at = old.created_at;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_profile_updated_at();

-- Todo usuario nuevo queda bloqueado hasta que el propietario ejecute
-- configure_fixed_accounts() desde el SQL Editor.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, role, active)
  values (
    new.id,
    'pending_' || replace(new.id::text, '-', ''),
    'Usuario pendiente',
    'technician',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Mapea únicamente las tres cuentas creadas manualmente en Authentication.
-- Es una función administrativa: no se concede al navegador.
create or replace function public.configure_fixed_accounts()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, role, active)
  select
    users.id,
    case lower(users.email)
      when '1999cazg@gmail.com' then 'Admin'
      when 'supervisor@saludambiental.local' then 'Supervisor'
      when 'tecnico@saludambiental.local' then 'Tecnico'
    end,
    case lower(users.email)
      when '1999cazg@gmail.com' then 'Administrador'
      when 'supervisor@saludambiental.local' then 'Supervisor'
      when 'tecnico@saludambiental.local' then 'Técnico'
    end,
    case lower(users.email)
      when '1999cazg@gmail.com' then 'admin'
      when 'supervisor@saludambiental.local' then 'supervisor'
      when 'tecnico@saludambiental.local' then 'technician'
    end,
    true
  from auth.users as users
  where lower(users.email) in (
    '1999cazg@gmail.com',
    'supervisor@saludambiental.local',
    'tecnico@saludambiental.local'
  )
  on conflict (id) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    role = excluded.role,
    active = true,
    updated_at = now();
end;
$$;

revoke all on function public.configure_fixed_accounts() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

-- ================================================================
-- HELPERS DE AUTORIZACIÓN
-- ================================================================
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select profiles.role
  from public.profiles as profiles
  join auth.users as users on users.id = profiles.id
  where profiles.id = auth.uid()
    and profiles.active = true
    and (
      (lower(users.email) = '1999cazg@gmail.com'
        and profiles.username = 'Admin' and profiles.role = 'admin')
      or (lower(users.email) = 'supervisor@saludambiental.local'
        and profiles.username = 'Supervisor' and profiles.role = 'supervisor')
      or (lower(users.email) = 'tecnico@saludambiental.local'
        and profiles.username = 'Tecnico' and profiles.role = 'technician')
      or (
        users.raw_app_meta_data ->> 'salud_ambiental_managed' = 'true'
        and lower(profiles.username) = lower(users.raw_app_meta_data ->> 'salud_ambiental_username')
        and profiles.role = users.raw_app_meta_data ->> 'salud_ambiental_role'
        and profiles.role in ('supervisor', 'technician')
      )
    )
  limit 1
$$;

create or replace function public.is_active_app_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_app_role() is not null
$$;

revoke all on function public.current_app_role() from public, anon;
revoke all on function public.is_active_app_user() from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_active_app_user() to authenticated;

-- Permite al Administrador verificar, antes de editar el catálogo, si un
-- identificador ya está ligado a datos históricos. El navegador nunca recibe
-- privilegios para saltarse esta comprobación.
create or replace function public.catalog_item_in_use(
  p_kind text,
  p_slug text,
  p_report_id text default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_app_role() is distinct from 'admin' then
    raise exception 'Solo el Administrador puede verificar el catálogo'
      using errcode = '42501';
  end if;

  if p_kind = 'facility' then
    return exists (
      select 1 from public.monthly_entries where facility_slug = p_slug
    ) or exists (
      select 1 from public.daily_logs where facility_slug = p_slug
    );
  elsif p_kind = 'field' then
    if p_report_id not in ('dengue', 'actividades', 'rabia') then
      raise exception 'Informe inválido' using errcode = '22023';
    end if;
    return exists (
      select 1
      from public.monthly_entries
      where report_id = p_report_id
        and values ? p_slug
    );
  end if;

  raise exception 'Tipo de catálogo inválido' using errcode = '22023';
end;
$$;

revoke all on function public.catalog_item_in_use(text, text, text) from public, anon;
grant execute on function public.catalog_item_in_use(text, text, text) to authenticated;

-- Normaliza identificadores exactamente como el cliente para validar referencias.
create or replace function public.catalog_slug(p_value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select trim(both '_' from pg_catalog.regexp_replace(
    pg_catalog.translate(pg_catalog.lower(p_value), 'áéíóúüñ', 'aeiouun'),
    '[^a-z0-9]+', '_', 'g'
  ))
$$;

revoke all on function public.catalog_slug(text) from public, anon;
grant execute on function public.catalog_slug(text) to authenticated;

-- Serializa cada escritura operativa con la fila del catálogo y rechaza
-- establecimientos, indicadores o métricas que ya no formen parte de éste.
create or replace function public.guard_operational_catalog()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  catalog_facilities jsonb;
  catalog_report_fields jsonb;
begin
  select catalog.facilities, catalog.report_fields
    into catalog_facilities, catalog_report_fields
  from public.app_catalog as catalog
  where catalog.id = 'main'
  for share;

  if not found then
    raise exception 'El catálogo principal debe sincronizarse antes de registrar datos'
      using errcode = '23503';
  end if;

  if public.catalog_slug(new.facility_name) is distinct from new.facility_slug
     or not exists (
       select 1
       from pg_catalog.jsonb_array_elements_text(catalog_facilities) as facility(label)
       where public.catalog_slug(facility.label) = new.facility_slug
     ) then
    raise exception 'El establecimiento no pertenece al catálogo vigente'
      using errcode = '23503';
  end if;

  if pg_catalog.jsonb_typeof(new.values) is distinct from 'object'
     or exists (
       select 1
       from pg_catalog.jsonb_each(new.values) as metric(metric_key, metric_value)
       where pg_catalog.jsonb_typeof(metric.metric_value) <> 'number'
          or (metric.metric_value #>> '{}')::numeric < 0
     ) then
    raise exception 'Las métricas deben ser números no negativos'
      using errcode = '22023';
  end if;

  if tg_table_name = 'monthly_entries' and exists (
    select 1
    from pg_catalog.jsonb_object_keys(new.values) as value_key(field_slug)
    where not exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(
        catalog_report_fields -> new.report_id
      ) as allowed_field(label)
      where public.catalog_slug(allowed_field.label) = value_key.field_slug
    )
  ) then
    raise exception 'El registro contiene indicadores fuera del catálogo vigente'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_operational_catalog() from public, anon;

drop trigger if exists monthly_entries_guard_catalog on public.monthly_entries;
create trigger monthly_entries_guard_catalog
before insert or update on public.monthly_entries
for each row execute function public.guard_operational_catalog();

drop trigger if exists daily_logs_guard_catalog on public.daily_logs;
create trigger daily_logs_guard_catalog
before insert or update on public.daily_logs
for each row execute function public.guard_operational_catalog();

-- La validación ocurre dentro de la misma escritura del catálogo. Así, una
-- comprobación previa desde el navegador nunca es la única barrera de seguridad.
create or replace function public.guard_catalog_references()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  report_key text;
  required_slug text;
  required_slugs text[];
begin
  if exists (
    select 1
    from public.monthly_entries as entry
    where not exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(new.facilities) as facility(label)
      where public.catalog_slug(facility.label) = entry.facility_slug
    )
  ) or exists (
    select 1
    from public.daily_logs as log
    where not exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(new.facilities) as facility(label)
      where public.catalog_slug(facility.label) = log.facility_slug
    )
  ) then
    raise exception 'No se puede retirar un establecimiento con datos históricos'
      using errcode = '23503';
  end if;

  if exists (
    select 1
    from public.monthly_entries as entry
    cross join lateral pg_catalog.jsonb_object_keys(entry.values) as value_key(field_slug)
    where not exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(
        new.report_fields -> entry.report_id
      ) as allowed_field(label)
      where public.catalog_slug(allowed_field.label) = value_key.field_slug
    )
  ) then
    raise exception 'No se puede retirar un indicador con datos históricos'
      using errcode = '23503';
  end if;

  foreach report_key in array array['dengue', 'rabia', 'actividades'] loop
    if report_key = 'dengue' then
      required_slugs := array[
        'viviendas_inspeccionadas', 'viviendas_positivas', 'viviendas_abatizadas',
        'viviendas_nebulizadas', 'criaderos_eliminados', 'depositos_inspeccionados',
        'depositos_positivos', 'depositos_eliminados', 'bti_becto_vac_gramos',
        'deltametrina_litros', 'aquareslin_litros', 'solfac_litros'
      ];
    elsif report_key = 'rabia' then
      required_slugs := array[
        'caninos_vacunados', 'felinos_vacunados', 'viviendas_visitadas',
        'canes_observados', 'mordeduras_notificadas', 'charlas_educativas'
      ];
    else
      required_slugs := array[
        'no_de_viviendas_abatizadas_bti', 'no_de_viviendas_fumigadas_nebulizadas',
        'eliminacion_de_criaderos_de_vectores', 'vacunacion_canina_y_felina',
        'observacion_a_canes_mordedores',
        'monitoreo_de_cloro_residual_en_sistemas_de_agua',
        'analisis_bacteriologico_de_agua_para_consumo_humano',
        'denuncias_ambientales_atendidas', 'seguimiento_a_inspecciones_ambientales',
        'coordinacion_de_operativos_de_limpieza',
        'juntas_de_agua_supervisadas_o_capacitadas'
      ];
    end if;

    foreach required_slug in array required_slugs loop
      if not exists (
        select 1
        from pg_catalog.jsonb_array_elements_text(
          new.report_fields -> report_key
        ) as required_field(label)
        where public.catalog_slug(required_field.label) = required_slug
      ) then
        raise exception 'No se puede retirar el indicador integrado % de %', required_slug, report_key
          using errcode = '23503';
      end if;
    end loop;
  end loop;

  return new;
end;
$$;

revoke all on function public.guard_catalog_references() from public, anon;

drop trigger if exists app_catalog_guard_references on public.app_catalog;
create trigger app_catalog_guard_references
before insert or update on public.app_catalog
for each row execute function public.guard_catalog_references();

-- ================================================================
-- RLS: SIN ACCESO ANÓNIMO
-- ================================================================
alter table public.profiles enable row level security;
alter table public.app_catalog enable row level security;
alter table public.monthly_entries enable row level security;
alter table public.daily_logs enable row level security;

drop policy if exists "monthly_entries_select_anon" on public.monthly_entries;
drop policy if exists "monthly_entries_insert_anon" on public.monthly_entries;
drop policy if exists "monthly_entries_update_anon" on public.monthly_entries;
drop policy if exists "monthly_entries_delete_anon" on public.monthly_entries;
drop policy if exists "daily_logs_select_anon" on public.daily_logs;
drop policy if exists "daily_logs_insert_anon" on public.daily_logs;
drop policy if exists "daily_logs_update_anon" on public.daily_logs;
drop policy if exists "daily_logs_delete_anon" on public.daily_logs;

drop policy if exists "profiles_read_self_or_admin" on public.profiles;
create policy "profiles_read_self_or_admin"
on public.profiles for select to authenticated
using (id = auth.uid() or public.current_app_role() = 'admin');

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert"
on public.profiles for insert to authenticated
with check (public.current_app_role() = 'admin');

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete"
on public.profiles for delete to authenticated
using (public.current_app_role() = 'admin');

drop policy if exists "app_catalog_active_users_read" on public.app_catalog;
create policy "app_catalog_active_users_read"
on public.app_catalog for select to authenticated
using (public.is_active_app_user());

drop policy if exists "app_catalog_admin_insert" on public.app_catalog;
create policy "app_catalog_admin_insert"
on public.app_catalog for insert to authenticated
with check (public.current_app_role() = 'admin');

drop policy if exists "app_catalog_admin_update" on public.app_catalog;
create policy "app_catalog_admin_update"
on public.app_catalog for update to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

drop policy if exists "monthly_entries_authenticated_select" on public.monthly_entries;
create policy "monthly_entries_authenticated_select"
on public.monthly_entries for select to authenticated
using (public.is_active_app_user());

drop policy if exists "monthly_entries_authenticated_insert" on public.monthly_entries;
create policy "monthly_entries_authenticated_insert"
on public.monthly_entries for insert to authenticated
with check (public.is_active_app_user());

drop policy if exists "monthly_entries_authenticated_update" on public.monthly_entries;
create policy "monthly_entries_authenticated_update"
on public.monthly_entries for update to authenticated
using (public.is_active_app_user())
with check (public.is_active_app_user());

drop policy if exists "monthly_entries_authenticated_delete" on public.monthly_entries;

drop policy if exists "daily_logs_authenticated_select" on public.daily_logs;
create policy "daily_logs_authenticated_select"
on public.daily_logs for select to authenticated
using (public.is_active_app_user());

drop policy if exists "daily_logs_authenticated_insert" on public.daily_logs;
create policy "daily_logs_authenticated_insert"
on public.daily_logs for insert to authenticated
with check (public.is_active_app_user());

drop policy if exists "daily_logs_authenticated_update" on public.daily_logs;
create policy "daily_logs_authenticated_update"
on public.daily_logs for update to authenticated
using (public.is_active_app_user())
with check (public.is_active_app_user());

drop policy if exists "daily_logs_authenticated_delete" on public.daily_logs;

revoke all on table public.profiles, public.app_catalog, public.monthly_entries, public.daily_logs from anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update on table public.app_catalog to authenticated;
grant select, insert, update on table public.monthly_entries to authenticated;
grant select, insert, update on table public.daily_logs to authenticated;

-- Si las tres cuentas ya existen, las activa ahora. Si se crean después,
-- vuelva a ejecutar: select public.configure_fixed_accounts();
select public.configure_fixed_accounts();

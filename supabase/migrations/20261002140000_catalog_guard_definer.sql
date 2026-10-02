-- El trigger debe poder leer el catálogo aunque la evaluación RLS de la
-- escritura operativa todavía esté en curso. Solo valida NEW y no expone datos.

create or replace function public.guard_operational_catalog()
returns trigger
language plpgsql
security definer
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

revoke all on function public.guard_operational_catalog() from public, anon, authenticated;

notify pgrst, 'reload schema';

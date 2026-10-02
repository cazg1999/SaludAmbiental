-- Garantiza que el catálogo compartido exista antes de aceptar bitácoras.
-- Es idempotente: no reemplaza un catálogo que ya haya sido personalizado.

with default_facilities as (
  select $json$[
    "Cornelio Moncada", "La Pita", "Travesía", "Saraguayna", "Bajamar",
    "Fraternidad", "Puente Alto", "Baracoa", "Calán", "Caoba", "Medina",
    "Kele Kele"
  ]$json$::jsonb as facilities
),
historical_facilities as (
  select distinct btrim(facility_name) as facility_name
  from (
    select facility_name from public.monthly_entries
    union all
    select facility_name from public.daily_logs
  ) as historical
  where btrim(facility_name) <> ''
)
insert into public.app_catalog (id, facilities, report_fields, revision)
select
  'main',
  defaults.facilities || coalesce((
    select jsonb_agg(historical.facility_name order by historical.facility_name)
    from historical_facilities as historical
    where not exists (
      select 1
      from jsonb_array_elements_text(defaults.facilities) as official(facility_name)
      where lower(official.facility_name) = lower(historical.facility_name)
    )
  ), '[]'::jsonb),
  $json${
    "dengue": [
      "Viviendas inspeccionadas", "Viviendas positivas", "Viviendas abatizadas",
      "Viviendas nebulizadas", "Criaderos eliminados", "Depósitos inspeccionados",
      "Depósitos positivos", "Depósitos negativos", "Depósitos eliminados",
      "Ovitrampas existentes", "Ovitrampas inspeccionadas", "Ovitrampas positivas",
      "Sitios de riesgo existentes", "Sitios de riesgo inspeccionados",
      "Sitios de riesgo positivos", "BTI / Becto Vac gramos",
      "Deltametrina litros", "AquaReslin litros", "Solfac litros",
      "Operativos programados", "Operativos ejecutados", "AGI"
    ],
    "rabia": [
      "Caninos vacunados", "Felinos vacunados", "Viviendas visitadas",
      "Canes observados", "Mordeduras notificadas", "Personas referidas",
      "Charlas educativas", "Comunidades intervenidas", "Dosis aplicadas",
      "Jornadas realizadas"
    ],
    "actividades": [
      "Organización a grupos comunitarios",
      "Personal inter/institucional capacitado",
      "Juntas de agua supervisadas o capacitadas",
      "Comités de salud capacitados COL / Vol.",
      "Niños y niñas escolares capacitadas en salud ambiental",
      "No. de días en vacunación infantil y otros",
      "Vacunación canina y felina",
      "Promoción y asistencia a puestos de COL / VOL.",
      "Participación entrega de paquetes básicos",
      "Elaboración de planes e informes mensuales",
      "Levantamiento diagnóstico ambiental",
      "Elaboración y actualización de croquis comunales",
      "Análisis bacteriológico de agua para consumo humano",
      "Notificaciones de resultado de análisis de calidad de agua",
      "Monitoreo de cloro residual en sistemas de agua",
      "Coordinación de operativos de limpieza",
      "Levantamiento de índices de infestación vectorial (LIRA)",
      "Eliminación de criaderos de vectores",
      "Participación control de brotes epidemiológico",
      "Observación a canes mordedores",
      "Reuniones interinstitucionales de concertación",
      "Denuncias ambientales atendidas",
      "Seguimiento a inspecciones ambientales",
      "Control de casos de dengue",
      "No. de viviendas abatizadas (BTI)",
      "No. de viviendas fumigadas / nebulizadas",
      "Tratamiento antimalárico clínico y laboratorial",
      "Toma de muestra para Dx de malaria",
      "No. de viviendas rociadas para eliminación de anofelinos",
      "Fumigación a centros educativos y otros",
      "Fumigación con antipandémico",
      "Participación en SINEIA",
      "Aplicación de bacilo y control a criaderos",
      "Detección de casos de leishmaniasis y tratamiento",
      "Días en levantamiento de fichas de salud familiar",
      "Exhumaciones realizadas",
      "Fumigación de cementerios",
      "Instalación de ovitrampas"
    ]
  }$json$::jsonb,
  1
from default_facilities as defaults
on conflict (id) do nothing;

notify pgrst, 'reload schema';

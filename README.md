# Herramienta Web de Consolidado Municipal

Aplicacion estatica para alimentar informacion mensual por establecimiento de salud y consolidarla automaticamente como municipio.

## Uso

Abra `index.html` en un navegador. La aplicacion puede trabajar de dos formas:

- Local: guarda una copia de respaldo en el navegador mediante `localStorage`.
- Supabase: guarda y consulta los registros historicos en una base de datos.

## Incluye

- Captura mensual por establecimiento.
- Informes iniciales: Consolidado de Dengue, Rab 05 y 33 Actividades.
- Consolidado mensual, trimestral, semestral y anual.
- Exportacion Excel `.xlsx` independiente para Consolidado de Dengue, 33 Actividades y Rab 05.
- Exportacion CSV del consolidado activo.
- Respaldo e importacion JSON.
- Catalogos editables de establecimientos e indicadores.
- Sincronizacion con Supabase para guardar historico mensual.

## Configuracion de Supabase

1. Cree un proyecto en Supabase.
2. Abra el SQL Editor y ejecute `supabase/schema.sql`.
3. Copie el Project URL y la anon public key del proyecto.
4. En la app, entre a `Catalogos` > `Base de datos`.
5. Pegue la URL y la anon key, y pulse `Conectar`.
6. Use `Subir datos locales` si ya habia registros en el navegador.

La tabla principal es `monthly_entries`. Cada fila guarda un formato, ano, mes, establecimiento y sus indicadores en JSON.

## Establecimientos precargados

Pto. Cortes, La Pita, Travesia, Saraguayna, Bajamar, Fraternidad, Puente Alto, Baracoa, Calan, Caoba, Medina y Kele Kele.

# Sistema de Salud Ambiental · Puerto Cortés

Aplicación web progresiva y responsiva (*offline-first*) para la captura diaria en bitácora de campo por establecimiento de salud, generación de reportes individuales de entrega y consolidación municipal automática.

---

## 🚀 Flujo de Trabajo

### 1. 📔 Bitácora Diaria de Campo (Para Técnicos en Salud Ambiental)
Resuelve el problema del trabajo dinámico y sin orden fijo (vacunación y abatización por la mañana, fumigación/nebulización por la tarde o noche):
- **Registro por Jornada/Turno:** El técnico registra el trabajo del día seleccionando la fecha, el turno (`☀️ Mañana`, `🌇 Tarde / Noche` o `🕒 Jornada completa`) y la comunidad o barrio visitado.
- **Distribución Automática:** Las actividades registradas en la bitácora alimentan automáticamente los formatos mensuales correspondientes sin tener que duplicar información:
  - *Abatización, nebulización y criaderos* alimentan **Dengue** y **33 Actividades**.
  - *Vacunación de caninos y felinos* alimenta **Rab 05** y **33 Actividades**.
  - *Monitoreo de cloro, análisis de agua y denuncias* alimentan **33 Actividades**.
- **Historial del Mes:** Línea de tiempo con todas las jornadas realizadas, notas de campo y opción de imprimir el soporte de visitas.

### 2. 📄 Reportes Individuales y Entrega al Supervisor
- **Asignación en el dispositivo:** El técnico deja seleccionado su centro de salud asignado en su teléfono móvil (por ejemplo, **Cornelio Moncada** o **Baracoa**) para que el dispositivo lo recuerde siempre.
- **🖨️ Imprimir / Guardar PDF:** Hoja membretada oficial (Secretaría de Salud de Honduras, Región Sanitaria No. 5 de Cortés, Coordinación de Salud de Puerto Cortés) con casillas de firma física para el técnico y supervisor.
- **📥 Descargar Excel (.xlsx):** Genera el archivo Excel individual del establecimiento correspondiente al mes.

### 3. 📊 Rol Supervisor Municipal
- **🚦 Semáforo de Cumplimiento (Monitoreo):** Matriz visual de los 12 establecimientos $\times$ 12 meses para supervisar en tiempo real quién ya entregó datos y quién está pendiente. Con 1 clic en cualquier casilla se accede directamente a los datos de ese establecimiento.
- **📋 Consolidado Municipal:** Tablas consolidadas para todo el municipio por mes, trimestre, semestre o año completo.
- **Formatos Oficiales de Exportación:**
  - **Consolidado Dengue (.xlsx):** Con cálculo de Índice de Vivienda, Índice de Breteau e Índice de Recipientes.
  - **33 Actividades (.xlsx):** Con suma acumulada anual corregida y observaciones del municipio.
  - **Rab 05 (.xlsx):** Formato oficial de vacunación y vigilancia antirrábica.
  - **Exportar CSV:** Con codificación UTF-8 BOM compatible con acentos y letra ñ en Excel para Windows.

---

## 📱 Uso en Dispositivos Móviles

1. Abra `index.html` en el navegador del teléfono móvil o desde un enlace web compartido.
2. La aplicación cuenta con una **Barra de Navegación Inferior (*Bottom Navigation Bar*)** accesible con el pulgar:
   - **📔 Bitácora:** Registro diario por jornada (mañana/tarde/noche).
   - **📝 Captura:** Totales mensuales por informe.
   - **📄 Mi Reporte:** Vista previa imprimible y descarga en Excel del centro de salud.
   - **📊 Supervisor:** Semáforo de avance y consolidado municipal.
   - **⚙️ Ajustes:** Sincronización y catálogos.
3. En la barra lateral o ajustes, elija su centro de salud en **"Mi establecimiento asignado"** para que el teléfono lo recuerde siempre.

---

## ☁️ Conexión Centralizada a Supabase

Para que todos los técnicos se conecten automáticamente al abrir la aplicación en sus teléfonos sin tener que escribir claves:

1. Abra el archivo [`config.js`](config.js).
2. Pegue su `Project URL` y `anonKey`:
   ```javascript
   const DEFAULT_SUPABASE_CONFIG = {
     url: "https://ejemplo.supabase.co",
     anonKey: "eyJhbGciOi..."
   };
   ```
3. Ejecute [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor de su proyecto de Supabase (crea `monthly_entries` y `daily_logs`).
4. ¡Listo! Cualquier técnico que abra la aplicación estará conectado de forma automática.

*(Nota: También es posible configurar o sobrescribir credenciales manualmente desde la pestaña **Catálogos y Ajustes** > **Base de datos**).*

---

## 🏥 Establecimientos Precargados (12)

Cornelio Moncada (Pto. Cortés centro), La Pita, Travesía, Saraguayna, Bajamar, Fraternidad, Puente Alto, Baracoa, Calán, Caoba, Medina y Kele Kele.

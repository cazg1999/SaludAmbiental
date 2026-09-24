# Sistema de Salud Ambiental · Puerto Cortés

Aplicación web progresiva y responsiva (*offline-first*) para la captura mensual de indicadores de salud ambiental en campo por establecimiento de salud, generación de reportes individuales de entrega y consolidación municipal automática.

---

## 🚀 Flujo de Trabajo

### 1. Rol Técnico en Salud Ambiental (Campo / Móvil)
- **Captura enfocada:** Diseñada para celulares con teclado numérico accesible, búsqueda rápida de indicadores y autoguardado en tiempo real.
- **Asignación en el dispositivo:** El técnico puede dejar seleccionado su centro de salud asignado en su teléfono móvil para no tener que seleccionarlo cada vez.
- **Entrega individual al Supervisor:**
  - **🖨️ Imprimir / Guardar PDF:** Genera una hoja membretada oficial (Secretaría de Salud de Honduras, Región Sanitaria de Cortés, Puerto Cortés) con tabla de actividades y casillas de firma física para el técnico y supervisor.
  - **📥 Descargar Excel (.xlsx):** Genera el archivo Excel individual del establecimiento correspondiente al mes.
- **Modo sin conexión (*Offline-First*):** Si no hay señal en la comunidad, los datos se guardan de inmediato en el teléfono y se sincronizan automáticamente con la base de datos municipal cuando se restablece la conexión.

### 2. Rol Supervisor Municipal
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
   - **📝 Captura:** Formulario mensual rápido.
   - **📄 Mi Reporte:** Vista previa imprimible y descarga en Excel de su centro de salud.
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
3. Ejecute [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor de su proyecto de Supabase.
4. ¡Listo! Cualquier técnico que abra la aplicación estará conectado de forma automática.

*(Nota: También es posible configurar o sobrescribir credenciales manualmente desde la pestaña **Catálogos y Ajustes** > **Base de datos**).*

---

## 🏥 Establecimientos Precargados (12)

Puerto Cortés, La Pita, Travesía, Saraguayna, Bajamar, Fraternidad, Puente Alto, Baracoa, Calán, Caoba, Medina y Kele Kele.

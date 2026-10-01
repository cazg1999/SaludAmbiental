# Sistema de Salud Ambiental · Puerto Cortés

Aplicación web progresiva y responsiva (*offline-first*) para la captura diaria en bitácora de campo por establecimiento de salud, generación de reportes individuales de entrega y consolidación municipal automática.

---

## 🚀 Flujo de Trabajo

### 1. 📔 Bitácora Diaria de Campo (Para Técnicos en Salud Ambiental)
Resuelve el problema del trabajo dinámico y sin orden fijo (vacunación y abatización por la mañana, fumigación/nebulización por la tarde o noche):
- **Registro por Jornada/Turno:** El técnico registra el trabajo del día seleccionando la fecha, el turno (`☀️ Mañana`, `🌇 Tarde / Noche` o `🕒 Jornada completa`) y la comunidad o barrio visitado.
- **Distribución Automática:** Las actividades registradas en la bitácora alimentan automáticamente los formatos mensuales correspondientes sin tener que duplicar información:
  - *Abatización, nebulización y criaderos* alimentan **Dengue** y **33 Actividades**.
  - *Vacunación de caninos, felinos y otros animales* alimenta el total de animales vacunados en **33 Actividades**; caninos y felinos también alimentan **Rab 05**.
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

## 🔐 Usuarios y permisos

La aplicación usa **Supabase Auth**. La interfaz solicita únicamente nombre de usuario y contraseña; internamente utiliza estos alias técnicos:

| Usuario visible | Alias interno de Auth | Permisos |
| --- | --- | --- |
| `Admin` | Cuenta interna del propietario | Acceso y control total |
| `Supervisor` | `supervisor@saludambiental.local` | Todo excepto Catálogos y ajustes |
| `Tecnico` | `tecnico@saludambiental.local` | Bitácora, captura mensual y reporte del establecimiento |

Las contraseñas nunca se guardan en el código del navegador. Al crear o restablecer una cuenta se exige una contraseña de 6 a 16 caracteres, formada únicamente por letras y números y con al menos una letra y un número. Supabase Auth aplica la misma composición y su mínimo técnico de 6 caracteres.

El Administrador dispone además de **Usuarios del sistema** en Catálogos y ajustes. Desde allí puede crear Supervisores y Técnicos usando solamente usuario y contraseña, activar o desactivar cuentas y cambiar sus contraseñas. Los identificadores internos permanecen ocultos. Estas operaciones se ejecutan en la Edge Function segura [`manage-users`](supabase/functions/manage-users/index.ts); ninguna clave administrativa se entrega al navegador.

### Preparación inicial

1. En **Authentication → Users**, cree manualmente los tres alias anteriores, asigne las contraseñas acordadas y marque las cuentas como confirmadas.
2. Desactive el registro público de usuarios en la configuración de Authentication.
3. Ejecute [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor. Si creó las cuentas después de ejecutar el esquema, ejecute:

   ```sql
   select public.configure_fixed_accounts();
   ```

4. Abra [`config.js`](config.js) y pegue únicamente el `Project URL` y la clave pública `anon`/`publishable`:

   ```javascript
   const DEFAULT_SUPABASE_CONFIG = {
     url: "https://ejemplo.supabase.co",
     anonKey: "eyJhbGciOi..."
   };
   ```

Nunca coloque la clave `service_role` en `config.js`. El esquema bloquea completamente el acceso anónimo y autoriza únicamente perfiles activos.

5. Publique la función de administración desde una sesión autenticada de Supabase CLI:

   ```powershell
   npx supabase functions deploy manage-users --project-ref zgunzfhaudumzpahgcfa
   ```

La aplicación conserva cambios en una cola local separada por usuario cuando no hay red. Al recuperar conexión usa control de versión: si otro dispositivo cambió el mismo registro, conserva la copia local pendiente y muestra un conflicto en vez de sobrescribir silenciosamente el dato remoto. Para resolverlo, pulse el indicador **Conflicto** de la cabecera y confirme únicamente si desea reemplazar la versión remota. Los borrados también se sincronizan mediante marcas recuperables, no mediante borrado físico.

Los establecimientos e indicadores forman un catálogo compartido. Solo el Administrador puede modificarlo; Supervisor y Técnico reciben automáticamente la versión vigente gracias a las políticas RLS de Supabase. El sistema rechaza duplicados y no permite renombrar o eliminar elementos que ya tengan datos históricos.

### Verificación

Desde la carpeta del proyecto:

```powershell
npm test
```

La suite valida sintaxis, referencias de interfaz, matriz de permisos, aislamiento local por usuario, control de conflictos, borrados sincronizables, catálogo compartido y arranque seguro sin configuración.

---

## 🏥 Establecimientos Precargados (12)

Cornelio Moncada (Pto. Cortés centro), La Pita, Travesía, Saraguayna, Bajamar, Fraternidad, Puente Alto, Baracoa, Calán, Caoba, Medina y Kele Kele.

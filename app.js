/**
 * SALUD AMBIENTAL · PUERTO CORTÉS, HONDURAS
 * Sistema de Captura de Campo, Bitácora Diaria y Consolidado Municipal
 */

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Centro de salud principal de Puerto Cortés: Cornelio Moncada
const defaultFacilities = [
  "Cornelio Moncada", "La Pita", "Travesía", "Saraguayna", "Bajamar", "Fraternidad",
  "Puente Alto", "Baracoa", "Calán", "Caoba", "Medina", "Kele Kele"
];

const defaultReports = {
  dengue: {
    name: "Consolidado de Dengue",
    shortName: "Dengue",
    description: "Prevención, control y vigilancia de dengue",
    fields: [
      "Viviendas inspeccionadas", "Viviendas positivas", "Viviendas abatizadas",
      "Viviendas nebulizadas", "Criaderos eliminados", "Depósitos inspeccionados",
      "Depósitos positivos", "Depósitos negativos", "Depósitos eliminados",
      "Ovitrampas existentes", "Ovitrampas inspeccionadas", "Ovitrampas positivas",
      "Sitios de riesgo existentes", "Sitios de riesgo inspeccionados",
      "Sitios de riesgo positivos", "BTI / Becto Vac gramos",
      "Deltametrina litros", "AquaReslin litros", "Solfac litros",
      "Operativos programados", "Operativos ejecutados", "AGI"
    ]
  },
  rabia: {
    name: "Rab 05",
    shortName: "Rab 05",
    description: "Control de rabia, vacunación y vigilancia",
    fields: [
      "Caninos vacunados", "Felinos vacunados", "Viviendas visitadas",
      "Canes observados", "Mordeduras notificadas", "Personas referidas",
      "Charlas educativas", "Comunidades intervenidas", "Dosis aplicadas",
      "Jornadas realizadas"
    ]
  },
  actividades: {
    name: "33 Actividades",
    shortName: "33 Actividades",
    description: "Actividades mensuales de salud ambiental",
    fields: [
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
  }
};

// Mapeo inteligente de actividades de bitácora diaria a reportes mensuales
const logFieldMapping = {
  viviendas_inspeccionadas: [
    { reportId: "dengue", fieldSlug: "viviendas_inspeccionadas" }
  ],
  viviendas_positivas: [
    { reportId: "dengue", fieldSlug: "viviendas_positivas" }
  ],
  viviendas_abatizadas: [
    { reportId: "dengue", fieldSlug: "viviendas_abatizadas" },
    { reportId: "actividades", fieldSlug: "no_de_viviendas_abatizadas_bti" }
  ],
  viviendas_nebulizadas: [
    { reportId: "dengue", fieldSlug: "viviendas_nebulizadas" },
    { reportId: "actividades", fieldSlug: "no_de_viviendas_fumigadas_nebulizadas" }
  ],
  criaderos_eliminados: [
    { reportId: "dengue", fieldSlug: "criaderos_eliminados" },
    { reportId: "actividades", fieldSlug: "eliminacion_de_criaderos_de_vectores" }
  ],
  depositos_inspeccionados: [
    { reportId: "dengue", fieldSlug: "depositos_inspeccionados" }
  ],
  depositos_positivos: [
    { reportId: "dengue", fieldSlug: "depositos_positivos" }
  ],
  depositos_eliminados: [
    { reportId: "dengue", fieldSlug: "depositos_eliminados" }
  ],
  bti_gramos: [
    { reportId: "dengue", fieldSlug: "bti_becto_vac_gramos" }
  ],
  deltametrina_litros: [
    { reportId: "dengue", fieldSlug: "deltametrina_litros" }
  ],
  aquareslin_litros: [
    { reportId: "dengue", fieldSlug: "aquareslin_litros" }
  ],
  solfac_litros: [
    { reportId: "dengue", fieldSlug: "solfac_litros" }
  ],
  caninos_vacunados: [
    { reportId: "rabia", fieldSlug: "caninos_vacunados" },
    { reportId: "actividades", fieldSlug: "vacunacion_canina_y_felina", isVaccinatedAnimalTotal: true }
  ],
  felinos_vacunados: [
    { reportId: "rabia", fieldSlug: "felinos_vacunados" },
    { reportId: "actividades", fieldSlug: "vacunacion_canina_y_felina", isVaccinatedAnimalTotal: true }
  ],
  otros_animales_vacunados: [
    { reportId: "actividades", fieldSlug: "vacunacion_canina_y_felina", isVaccinatedAnimalTotal: true }
  ],
  viviendas_visitadas_rabia: [
    { reportId: "rabia", fieldSlug: "viviendas_visitadas" }
  ],
  canes_observados: [
    { reportId: "rabia", fieldSlug: "canes_observados" },
    { reportId: "actividades", fieldSlug: "observacion_a_canes_mordedores" }
  ],
  mordeduras_notificadas: [
    { reportId: "rabia", fieldSlug: "mordeduras_notificadas" }
  ],
  charlas_educativas: [
    { reportId: "rabia", fieldSlug: "charlas_educativas" }
  ],
  monitoreo_cloro: [
    { reportId: "actividades", fieldSlug: "monitoreo_de_cloro_residual_en_sistemas_de_agua" }
  ],
  analisis_agua: [
    { reportId: "actividades", fieldSlug: "analisis_bacteriologico_de_agua_para_consumo_humano" }
  ],
  denuncias_atendidas: [
    { reportId: "actividades", fieldSlug: "denuncias_ambientales_atendidas" }
  ],
  seguimiento_inspecciones: [
    { reportId: "actividades", fieldSlug: "seguimiento_a_inspecciones_ambientales" }
  ],
  operativos_limpieza: [
    { reportId: "actividades", fieldSlug: "coordinacion_de_operativos_de_limpieza" }
  ],
  juntas_agua_supervisadas: [
    { reportId: "actividades", fieldSlug: "juntas_de_agua_supervisadas_o_capacitadas" }
  ]
};

function totalVaccinatedAnimals(values = {}) {
  return ["caninos_vacunados", "felinos_vacunados", "otros_animales_vacunados"]
    .reduce((total, key) => total + Number(values[key] || 0), 0);
}

const legacyStorageKey = "saludAmbientalMunicipal.v1";
const userStoragePrefix = "saludAmbientalMunicipal.user.v1";
const supabaseConfigKey = "saludAmbientalMunicipal.supabase.v1";
const cachedProfileKey = "saludAmbientalMunicipal.authProfile.v1";
const logoutBarrierKey = "saludAmbientalMunicipal.logoutBarrier.v1";
const AUTO_SYNC_INTERVAL_MS = 15000;

const loginAliases = Object.freeze({
  admin: "1999cazg@gmail.com",
  supervisor: "supervisor@saludambiental.local",
  tecnico: "tecnico@saludambiental.local"
});
const managedLoginDomain = "saludambiental.local";

const roleLabels = Object.freeze({
  admin: "Administrador",
  supervisor: "Supervisor",
  technician: "Técnico"
});

const allowedViewsByRole = Object.freeze({
  admin: ["logbook", "capture", "facilityReport", "supervisor", "catalogs"],
  supervisor: ["logbook", "capture", "facilityReport", "supervisor"],
  technician: ["logbook", "capture", "facilityReport"]
});

let activeStorageKey = null;
let state = loadState();
let supabaseClient = null;
let supabaseReady = false;
let syncDebounceTimer = null;
let syncInProgress = false;
let queueRevision = 0;
let sessionGeneration = 0;
let currentSession = null;
let currentProfile = null;
let authSubscription = null;
let activatingUserId = null;
let authIntentGeneration = 0;
let logoutBarrierActive = false;
let logoutPromise = null;
let autoSyncIntervalId = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function createUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function slug(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function currentYearDefault() {
  const y = new Date().getFullYear();
  return (y >= 2020 && y <= 2035) ? y : 2026;
}

function migrateFacilityName(name) {
  if (name === "Pto. Cortés" || name === "Pto. Cortes" || name === "Puerto Cortés" || name === "Puerto Cortes") {
    return "Cornelio Moncada";
  }
  return name;
}

function normalizeMetricValues(values) {
  const normalized = {};
  if (!values || typeof values !== "object" || Array.isArray(values)) return normalized;
  Object.entries(values).forEach(([key, value]) => {
    const safeKey = slug(key);
    const number = Number(value);
    if (safeKey && Number.isFinite(number) && number >= 0) normalized[safeKey] = number;
  });
  return normalized;
}

function cloneDefaultReports() {
  return Object.fromEntries(
    Object.entries(defaultReports).map(([reportId, report]) => [
      reportId,
      { ...report, fields: [...report.fields] }
    ])
  );
}

function ensureUniqueSlugs(items, label) {
  const seen = new Set();
  items.forEach((item) => {
    const itemSlug = slug(item);
    if (!itemSlug || seen.has(itemSlug)) {
      throw new Error(`El catálogo contiene ${label} duplicados o inválidos.`);
    }
    seen.add(itemSlug);
  });
}

function uniqueCatalogLabels(items, maxLength, maxCount) {
  const seen = new Set();
  const result = [];
  (Array.isArray(items) ? items : []).forEach((item) => {
    const value = String(item || "").trim().slice(0, maxLength);
    const valueSlug = slug(value);
    if (!valueSlug || seen.has(valueSlug) || result.length >= maxCount) return;
    seen.add(valueSlug);
    result.push(value);
  });
  return result;
}

function normalizeImportedState(parsed) {
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.facilities) || !parsed.reports) {
    throw new Error("El archivo no tiene el formato de respaldo esperado.");
  }
  const facilities = [...new Set(parsed.facilities
    .map((facility) => String(facility || "").trim().slice(0, 120))
    .filter(Boolean))].slice(0, 100);
  if (!facilities.length) throw new Error("El respaldo no contiene establecimientos válidos.");
  ensureUniqueSlugs(facilities, "establecimientos");

  const reports = {};
  Object.entries(defaultReports).forEach(([reportId, defaults]) => {
    const importedFields = parsed.reports?.[reportId]?.fields;
    reports[reportId] = {
      ...defaults,
      fields: (Array.isArray(importedFields) ? importedFields : defaults.fields)
        .map((field) => String(field || "").trim().slice(0, 160))
        .filter(Boolean)
        .slice(0, 250)
    };
    ensureUniqueSlugs(reports[reportId].fields, `indicadores de ${reportId}`);
  });

  const entries = {};
  Object.entries(parsed.entries || {}).slice(0, 20000).forEach(([key, values]) => {
    const [reportId, year, monthIndex, facilitySlug] = String(key).split("|");
    if (!reports[reportId] || !/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(monthIndex) || !facilitySlug) return;
    entries[[reportId, year, monthIndex, slug(facilitySlug)].join("|")] = normalizeMetricValues(values);
  });

  const dailyLogs = (Array.isArray(parsed.dailyLogs) ? parsed.dailyLogs : []).slice(0, 20000).map((log) => {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(log.date || "")) ? String(log.date) : localDateString();
    const dateObject = new Date(`${date}T12:00:00`);
    return {
      id: isUuid(log.id) ? log.id : createUuid(),
      facility: String(log.facility || facilities[0]).slice(0, 120),
      date,
      year: dateObject.getFullYear(),
      month: dateObject.getMonth(),
      shift: ["manana", "tarde", "noche", "completa"].includes(log.shift) ? log.shift : "manana",
      community: String(log.community || "").slice(0, 200),
      notes: String(log.notes || "").slice(0, 2000),
      values: normalizeMetricValues(log.values),
      created_at: log.created_at || new Date().toISOString(),
      updated_at: log.updated_at || log.created_at || new Date().toISOString(),
      server_updated_at: log.server_updated_at || null
    };
  });

  return {
    schemaVersion: 2,
    year: Math.max(2020, Math.min(2035, Number(parsed.year) || currentYearDefault())),
    facilities,
    reports,
    entries,
    entryMeta: {},
    catalogMeta: { revision: null, updated_at: null, local_only: true },
    dailyLogs,
    pendingOperations: [],
    localOnlyMigrationPending: true
  };
}

function loadState(key = null) {
  const saved = key ? localStorage.getItem(key) : null;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const reports = cloneDefaultReports();
      Object.keys(defaultReports).forEach((reportId) => {
        const storedReport = parsed.reports?.[reportId];
        const fields = uniqueCatalogLabels(
          Array.isArray(storedReport?.fields) ? storedReport.fields : defaultReports[reportId].fields,
          160,
          250
        );
        reports[reportId] = {
          ...defaultReports[reportId],
          ...(storedReport && typeof storedReport === "object" ? storedReport : {}),
          name: defaultReports[reportId].name,
          shortName: defaultReports[reportId].shortName,
          description: defaultReports[reportId].description,
          fields: fields.length ? fields : [...defaultReports[reportId].fields]
        };
      });

      // Migrar Pto. Cortés -> Cornelio Moncada en establecimientos
      let facilities = uniqueCatalogLabels(
        (parsed.facilities?.length ? parsed.facilities : defaultFacilities)
          .map((facility) => migrateFacilityName(String(facility || ""))),
        120,
        100
      );
      if (!facilities.some((facility) => slug(facility) === "cornelio_moncada")) {
        facilities.unshift("Cornelio Moncada");
        facilities = facilities.slice(0, 100);
      }

      // Migrar claves de datos históricas de pto_cortes -> cornelio_moncada
      const entries = {};
      Object.entries(parsed.entries || {}).forEach(([k, v]) => {
        const parts = k.split("|");
        if (parts[3] === "pto_cortes" || parts[3] === "puerto_cortes") {
          parts[3] = "cornelio_moncada";
        }
        entries[parts.join("|")] = normalizeMetricValues(v);
      });

      // Migrar bitácora si existía
      const pendingOperations = Array.isArray(parsed.pendingOperations)
        ? parsed.pendingOperations.filter((operation) => operation && typeof operation === "object")
        : [];
      const dailyLogs = (Array.isArray(parsed.dailyLogs) ? parsed.dailyLogs : []).map((log) => {
        const id = isUuid(log.id) ? log.id : createUuid();
        const rawFacility = migrateFacilityName(String(log.facility || facilities[0] || "Cornelio Moncada"));
        const normalized = {
          id,
          facility: facilities.find((facility) => slug(facility) === slug(rawFacility)) || facilities[0],
          date: String(log.date || localDateString()),
          year: Number(log.year) || currentYearDefault(),
          month: Math.max(0, Math.min(11, Number(log.month) || 0)),
          shift: ["manana", "tarde", "noche", "completa"].includes(log.shift) ? log.shift : "manana",
          community: String(log.community || "").slice(0, 200),
          notes: String(log.notes || "").slice(0, 2000),
          values: normalizeMetricValues(log.values),
          created_at: log.created_at || new Date().toISOString(),
          updated_at: log.updated_at || log.created_at || new Date().toISOString(),
          server_updated_at: log.server_updated_at || null
        };
        if (id !== log.id) {
          pendingOperations.push({
            id: createUuid(),
            entity: "daily_log",
            entityKey: id,
            action: "upsert",
            payload: normalized,
            queued_at: new Date().toISOString()
          });
        }
        return normalized;
      });

      return {
        schemaVersion: 2,
        year: parsed.year || currentYearDefault(),
        facilities,
        reports,
        entries,
        entryMeta: parsed.entryMeta && typeof parsed.entryMeta === "object" ? parsed.entryMeta : {},
        catalogMeta: parsed.catalogMeta && typeof parsed.catalogMeta === "object"
          ? parsed.catalogMeta
          : { revision: null, updated_at: null, local_only: false },
        dailyLogs,
        pendingOperations,
        localOnlyMigrationPending: Boolean(parsed.localOnlyMigrationPending)
      };
    } catch (error) {
      console.warn("No se pudo leer el respaldo local", error);
    }
  }

  return {
    schemaVersion: 2,
    year: currentYearDefault(),
    facilities: [...defaultFacilities],
    reports: cloneDefaultReports(),
    entries: {},
    entryMeta: {},
    catalogMeta: { revision: null, updated_at: null, local_only: false },
    dailyLogs: [],
    pendingOperations: [],
    localOnlyMigrationPending: false
  };
}

function userStateKey(userId) {
  return `${userStoragePrefix}.${userId}`;
}

function activateUserState(userId, role) {
  sessionGeneration += 1;
  const nextStorageKey = userStateKey(userId);
  const hasUserState = localStorage.getItem(nextStorageKey) !== null;
  activeStorageKey = nextStorageKey;

  if (hasUserState) {
    state = loadState(nextStorageKey);
  } else if (role === "admin" && localStorage.getItem(legacyStorageKey) !== null) {
    // Keep data from older installations, but not its unauthenticated queue.
    state = loadState(legacyStorageKey);
    state.pendingOperations = [];
    state.catalogMeta = { revision: null, updated_at: null, local_only: true };
    state.localOnlyMigrationPending = true;
    saveState();
  } else {
    state = loadState();
    saveState();
  }
  queueRevision = 0;
}

function clearActiveUserState() {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = null;
  activeStorageKey = null;
  state = loadState();
  queueRevision += 1;
  sessionGeneration += 1;
}

function saveState() {
  if (!activeStorageKey) return;
  try {
    localStorage.setItem(activeStorageKey, JSON.stringify(state));
    const savedState = $("#savedState");
    if (savedState) {
      const pendingCount = state.pendingOperations?.length || 0;
      const localUploadPending = Boolean(state.localOnlyMigrationPending);
      savedState.textContent = localUploadPending
        ? "Datos locales pendientes de subir"
        : pendingCount
          ? `Pendiente de sincronizar (${pendingCount})`
          : "Guardado";
      savedState.className = pendingCount || localUploadPending ? "status-pill saving" : "status-pill saved";
    }
  } catch (err) {
    console.error("Error al guardar estado local:", err);
  }
}

// Configuración de Supabase
function loadSupabaseConfig() {
  if (typeof DEFAULT_SUPABASE_CONFIG !== "undefined" && DEFAULT_SUPABASE_CONFIG.url && DEFAULT_SUPABASE_CONFIG.anonKey) {
    return DEFAULT_SUPABASE_CONFIG;
  }

  const localSaved = localStorage.getItem(supabaseConfigKey);
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (parsed.url && parsed.anonKey) return parsed;
    } catch (e) {}
  }

  return { url: "", anonKey: "" };
}

function saveSupabaseConfig(config) {
  localStorage.setItem(supabaseConfigKey, JSON.stringify(config));
}

function setSupabaseStatus(message, isConnected = false) {
  const statusEl = $("#supabaseStatus");
  const syncDot = $("#syncDot");
  const syncStatusText = $("#syncStatusText");
  const syncBadge = $("#syncStatusBadge");

  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = isConnected ? "db-status connected" : "db-status";
  }

  if (syncDot && syncStatusText) {
    if (isConnected) {
      syncDot.className = "status-indicator connected";
      syncStatusText.textContent = "En línea";
    } else if (/conflicto/i.test(message)) {
      syncDot.className = "status-indicator";
      syncStatusText.textContent = "Conflicto";
    } else if (/pendiente/i.test(message)) {
      syncDot.className = "status-indicator";
      syncStatusText.textContent = "Pendiente";
    } else if (navigator.onLine) {
      syncDot.className = "status-indicator";
      syncStatusText.textContent = "Local";
    } else {
      syncDot.className = "status-indicator";
      syncStatusText.textContent = "Sin red";
    }
  }
  if (syncBadge) syncBadge.title = message;
}

function setupSupabase() {
  const config = loadSupabaseConfig();
  const urlInput = $("#supabaseUrlInput");
  const keyInput = $("#supabaseAnonKeyInput");
  if (urlInput) urlInput.value = config.url || "";
  if (keyInput) keyInput.value = config.anonKey || "";

  if (!config.url || !config.anonKey) {
    supabaseReady = false;
    setSupabaseStatus("Supabase no configurado", false);
    return false;
  }

  if (!window.supabase?.createClient) {
    supabaseReady = false;
    setSupabaseStatus("Librería de Supabase no disponible", false);
    return false;
  }

  try {
    authSubscription?.unsubscribe?.();
    supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
    supabaseReady = true;
    setSupabaseStatus("Configurado · Inicie sesión", false);
    return true;
  } catch (err) {
    supabaseReady = false;
    setSupabaseStatus(`Error: ${err.message}`, false);
    return false;
  }
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function expectedRoleForEmail(email) {
  const normalized = String(email || "").toLowerCase();
  if (normalized === loginAliases.admin) return "admin";
  if (normalized === loginAliases.supervisor) return "supervisor";
  if (normalized === loginAliases.tecnico) return "technician";
  return null;
}

function loginEmailForUsername(username) {
  if (loginAliases[username]) return loginAliases[username];
  return /^[a-z0-9._-]{3,32}$/.test(username)
    ? `${username}@${managedLoginDomain}`
    : null;
}

function isManagedSessionProfile(user, profile) {
  const metadata = user?.app_metadata || {};
  return metadata.salud_ambiental_managed === true
    && metadata.salud_ambiental_username === normalizeUsername(profile?.username)
    && metadata.salud_ambiental_role === profile?.role
    && ["supervisor", "technician"].includes(profile?.role);
}

function setLoginError(message = "") {
  const errorEl = $("#loginError");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.style.display = message ? "block" : "none";
}

function setLoginBusy(isBusy) {
  const button = $("#loginSubmitBtn");
  if (!button) return;
  button.disabled = Boolean(isBusy) || !supabaseReady;
  button.textContent = isBusy ? "Verificando..." : "Iniciar Sesión";
}

function hasLogoutBarrier() {
  try {
    return logoutBarrierActive || localStorage.getItem(logoutBarrierKey) === "1";
  } catch (error) {
    return logoutBarrierActive;
  }
}

function setLogoutBarrier(active) {
  logoutBarrierActive = Boolean(active);
  try {
    if (logoutBarrierActive) {
      localStorage.setItem(logoutBarrierKey, "1");
    } else {
      localStorage.removeItem(logoutBarrierKey);
    }
  } catch (error) {
    console.warn("No se pudo persistir la barrera de cierre de sesión:", error);
  }
}

function showLoginScreen(message = null) {
  stopAutomaticSync();
  authIntentGeneration += 1;
  currentSession = null;
  currentProfile = null;
  clearActiveUserState();
  [
    "#reportSelect", "#summaryReportSelect", "#catalogReportSelect",
    "#facilityReportTypeSelect", "#monitoringReportSelect",
    "#monthSelect", "#facilityReportMonthSelect", "#logMonthSelect",
    "#facilitySelect", "#facilityReportSelect", "#logFacilitySelect",
    "#periodValueSelect"
  ].forEach((selector) => {
    const select = $(selector);
    if (select) select.value = "";
  });
  if ($("#periodTypeSelect")) $("#periodTypeSelect").value = "month";
  $("#appContainer")?.style.setProperty("display", "none");
  $("#loginScreen")?.style.setProperty("display", "flex");
  $$("dialog[open]").forEach((dialog) => dialog.close());
  if (message !== null) setLoginError(message);
  setLoginBusy(false);
  const usernameInput = $("#loginUsername");
  if (usernameInput) {
    usernameInput.value = "";
    usernameInput.focus();
  }
  const passwordInput = $("#loginPassword");
  if (passwordInput) passwordInput.value = "";
}

function allowedViews() {
  return currentProfile ? (allowedViewsByRole[currentProfile.role] || []) : [];
}

function canAccessView(viewName) {
  return Boolean(currentProfile && allowedViews().includes(viewName));
}

function initialViewForRole(role) {
  return role === "technician" ? "logbook" : "supervisor";
}

function applyRoleAccess() {
  const views = allowedViews();
  $$("[data-view]").forEach((element) => {
    const allowed = views.includes(element.dataset.view);
    element.hidden = !allowed;
    element.setAttribute("aria-hidden", String(!allowed));
  });

  const displayName = currentProfile?.display_name || currentProfile?.username || "Usuario";
  const roleLabel = roleLabels[currentProfile?.role] || "Sin rol";
  if ($("#headerUserText")) $("#headerUserText").textContent = displayName;
  if ($("#sidebarUserName")) $("#sidebarUserName").textContent = displayName;
  if ($("#sidebarUserRole")) $("#sidebarUserRole").textContent = roleLabel;
}

function loadCachedProfile(userId) {
  try {
    const cached = JSON.parse(localStorage.getItem(cachedProfileKey) || "null");
    return cached?.id === userId ? cached : null;
  } catch (error) {
    return null;
  }
}

async function fetchAuthenticatedProfile(user) {
  const { data, error, status } = await supabaseClient
    .from("profiles")
    .select("id, username, display_name, role, facility_slug, active")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    const cached = loadCachedProfile(user.id);
    const networkFailure = !navigator.onLine || status === 0 || /fetch|network/i.test(error.message || "");
    if (cached && networkFailure) return cached;
    throw error;
  }
  if (!data) throw new Error("La cuenta no tiene un perfil autorizado.");
  return data;
}

async function activateSession(session) {
  if (hasLogoutBarrier()) {
    showLoginScreen();
    return;
  }
  if (!session?.user || !supabaseClient) {
    showLoginScreen();
    return;
  }
  if (activatingUserId === session.user.id) return;
  if (currentSession?.user?.id === session.user.id && currentProfile?.id === session.user.id) {
    currentSession = session;
    startAutomaticSync();
    return;
  }

  const activationIntent = ++authIntentGeneration;
  activatingUserId = session.user.id;
  try {
    const profile = await fetchAuthenticatedProfile(session.user);
    if (activationIntent !== authIntentGeneration || hasLogoutBarrier()) return;
    const expectedRole = expectedRoleForEmail(session.user.email);
    const validFixedAccount = Boolean(expectedRole && profile.role === expectedRole);
    const validManagedAccount = isManagedSessionProfile(session.user, profile);
    if (!profile.active || (!validFixedAccount && !validManagedAccount) || !allowedViewsByRole[profile.role]) {
      throw new Error("La cuenta no tiene permisos válidos.");
    }

    activateUserState(session.user.id, profile.role);
    currentSession = session;
    currentProfile = profile;
    localStorage.setItem(cachedProfileKey, JSON.stringify(profile));
    setLoginError("");
    $("#loginScreen")?.style.setProperty("display", "none");
    $("#appContainer")?.style.setProperty("display", "block");
    applyRoleAccess();
    refreshSelectors();
    switchView(initialViewForRole(profile.role));
    await synchronizeWithSupabase();
    startAutomaticSync();
  } catch (error) {
    if (activationIntent !== authIntentGeneration) return;
    console.error("No se pudo activar la sesión:", error);
    setLogoutBarrier(true);
    localStorage.removeItem(cachedProfileKey);
    await supabaseClient.auth.signOut({ scope: "local" }).catch(() => {});
    showLoginScreen("Cuenta sin autorización. Contacte al administrador.");
  } finally {
    if (activatingUserId === session.user.id) activatingUserId = null;
  }
}

async function handleLogin(event) {
  event.preventDefault();
  setLoginError("");
  if (!supabaseReady || !supabaseClient) {
    setLoginError("Sistema no configurado. Contacte al administrador.");
    return;
  }

  const username = normalizeUsername($("#loginUsername")?.value);
  const passwordInput = $("#loginPassword");
  const email = loginEmailForUsername(username);
  if (!email || !passwordInput?.value) {
    setLoginError("Usuario o contraseña incorrectos.");
    return;
  }

  setLoginBusy(true);
  try {
    if (logoutPromise) await logoutPromise.catch(() => {});
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password: passwordInput.value
    });
    passwordInput.value = "";
    if (error || !data.session) throw error || new Error("No se creó la sesión.");
    // Solo un inicio de sesión explícito y exitoso levanta la barrera persistente.
    setLogoutBarrier(false);
    await activateSession(data.session);
  } catch (error) {
    console.warn("Inicio de sesión rechazado:", error?.message || error);
    passwordInput.value = "";
    setLoginError("Usuario o contraseña incorrectos.");
  } finally {
    setLoginBusy(false);
  }
}

async function handleLogout() {
  const client = supabaseClient;
  // Se establece antes de tocar la sesión remota: si signOut falla o se recarga,
  // INITIAL_SESSION no puede volver a abrir la aplicación.
  setLogoutBarrier(true);
  localStorage.removeItem(cachedProfileKey);
  showLoginScreen("");
  if (client) {
    logoutPromise = client.auth.signOut({ scope: "local" });
    try {
      const { error } = await logoutPromise;
      if (error) console.warn("No se pudo cerrar la sesión remota:", error);
    } finally {
      logoutPromise = null;
    }
  }
}

function watchAuthState() {
  const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
      if (hasLogoutBarrier()) {
        showLoginScreen();
        if (session && !logoutPromise) {
          logoutPromise = supabaseClient.auth.signOut({ scope: "local" })
            .catch((error) => console.warn("No se pudo limpiar la sesión cerrada:", error))
            .finally(() => { logoutPromise = null; });
        }
        return;
      }
      if (!session || event === "SIGNED_OUT") {
        showLoginScreen();
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        void activateSession(session);
        return;
      }
      currentSession = session;
    }, 0);
  });
  authSubscription = data.subscription;
}

function catalogSnapshot() {
  const snapshot = {
    facilities: [...state.facilities],
    report_fields: Object.fromEntries(
      Object.keys(defaultReports).map((reportId) => [
        reportId,
        [...(state.reports[reportId]?.fields || defaultReports[reportId].fields)]
      ])
    )
  };
  ensureUniqueSlugs(snapshot.facilities, "establecimientos");
  Object.entries(snapshot.report_fields).forEach(([reportId, fields]) => {
    ensureUniqueSlugs(fields, `indicadores de ${reportId}`);
  });
  return snapshot;
}

function normalizeRemoteCatalog(record) {
  if (!record || !Array.isArray(record.facilities) || !record.report_fields) {
    throw new Error("El catálogo remoto no tiene un formato válido.");
  }
  const facilities = [...new Set(record.facilities
    .map((facility) => String(facility || "").trim().slice(0, 120))
    .filter(Boolean))].slice(0, 100);
  if (!facilities.length) throw new Error("El catálogo remoto no contiene establecimientos.");
  ensureUniqueSlugs(facilities, "establecimientos");

  const reports = cloneDefaultReports();
  Object.keys(defaultReports).forEach((reportId) => {
    const fields = record.report_fields[reportId];
    if (!Array.isArray(fields)) throw new Error(`El catálogo remoto de ${reportId} no es válido.`);
    reports[reportId].fields = [...new Set(fields
      .map((field) => String(field || "").trim().slice(0, 160))
      .filter(Boolean))].slice(0, 250);
    if (!reports[reportId].fields.length) {
      throw new Error(`El catálogo remoto de ${reportId} está vacío.`);
    }
    ensureUniqueSlugs(reports[reportId].fields, `indicadores de ${reportId}`);
  });
  return { facilities, reports };
}

function applyRemoteCatalog(record) {
  if (!record) return false;
  const hasPendingCatalog = (state.pendingOperations || []).some(
    (operation) => operation.entity === "app_catalog"
  );
  if (hasPendingCatalog || (currentProfile?.role === "admin" && state.catalogMeta?.local_only)) return false;
  const catalog = normalizeRemoteCatalog(record);
  const catalogChanged = (
    JSON.stringify(state.facilities) !== JSON.stringify(catalog.facilities)
    || Object.keys(defaultReports).some((reportId) => (
      JSON.stringify(state.reports[reportId]?.fields || [])
        !== JSON.stringify(catalog.reports[reportId]?.fields || [])
    ))
  );
  state.facilities = catalog.facilities;
  state.reports = catalog.reports;
  state.catalogMeta = {
    revision: Number(record.revision),
    updated_at: record.updated_at || null,
    local_only: false
  };
  return catalogChanged;
}

function queueCatalogUpsert() {
  if (currentProfile?.role !== "admin") return;
  const snapshot = catalogSnapshot();
  state.catalogMeta = {
    ...(state.catalogMeta || {}),
    local_only: true
  };
  queueOperation({
    entity: "app_catalog",
    entityKey: "main",
    action: "upsert",
    payload: {
      ...snapshot,
      baseRevision: state.catalogMeta?.revision ?? null
    }
  });
}

function entryRecord(reportId, year, monthIndex, facility, values) {
  return {
    report_id: reportId,
    year,
    month: monthIndex + 1,
    facility_slug: slug(facility),
    facility_name: facility,
    values: normalizeMetricValues(values),
    deleted_at: null
  };
}

function applyRemoteRecords(records) {
  if (!Array.isArray(records)) return;
  const pendingKeys = new Set(
    (state.pendingOperations || [])
      .filter((operation) => operation.entity === "monthly_entry")
      .map((operation) => operation.entityKey)
  );
  records.forEach((record) => {
    const monthIndex = Number(record.month) - 1;
    const facName = migrateFacilityName(record.facility_name);
    const key = entryKey(record.report_id, record.year, monthIndex, facName);
    if (pendingKeys.has(key)) return;
    const hasLocalEntry = Object.prototype.hasOwnProperty.call(state.entries, key);
    const meta = state.entryMeta?.[key] || {};
    // A local-only value must be uploaded explicitly; a pull cannot erase it.
    if (hasLocalEntry && !meta.server_updated_at) return;
    const remoteTimestamp = Date.parse(record.updated_at || 0);
    const knownServerTimestamp = Date.parse(meta.server_updated_at || 0);
    if (!knownServerTimestamp || remoteTimestamp >= knownServerTimestamp) {
      if (record.deleted_at) {
        delete state.entries[key];
      } else {
        state.entries[key] = normalizeMetricValues(record.values);
      }
      state.entryMeta ||= {};
      state.entryMeta[key] = {
        ...meta,
        updated_at: record.updated_at || new Date().toISOString(),
        server_updated_at: record.updated_at || null,
        deleted_at: record.deleted_at || null
      };
    }
  });
}

function applyRemoteDailyLogs(logs) {
  if (!Array.isArray(logs)) return;
  const mergedMap = new Map();
  (state.dailyLogs || []).forEach((item) => mergedMap.set(item.id, item));
  const pendingIds = new Set(
    (state.pendingOperations || [])
      .filter((operation) => operation.entity === "daily_log")
      .map((operation) => operation.entityKey)
  );
  logs.forEach((log) => {
    if (!isUuid(log.id) || pendingIds.has(log.id)) return;
    const current = mergedMap.get(log.id);
    if (current && !current.server_updated_at) return;
    const remoteTimestamp = Date.parse(log.updated_at || log.created_at || 0);
    const knownServerTimestamp = Date.parse(current?.server_updated_at || 0);
    if (current && knownServerTimestamp > remoteTimestamp) return;
    if (log.deleted_at) {
      mergedMap.delete(log.id);
      return;
    }
    mergedMap.set(log.id, {
      id: log.id,
      facility: migrateFacilityName(log.facility_name),
      date: log.date,
      year: log.year,
      month: log.month - 1,
      shift: log.shift,
      community: String(log.community || "").slice(0, 200),
      notes: String(log.notes || "").slice(0, 2000),
      values: normalizeMetricValues(log.values),
      created_at: log.created_at,
      updated_at: log.updated_at || log.created_at,
      server_updated_at: log.updated_at || null
    });
  });
  state.dailyLogs = Array.from(mergedMap.values());
}

function dailyLogRecord(log) {
  return {
    id: log.id,
    facility_slug: slug(log.facility),
    facility_name: String(log.facility || "").slice(0, 120),
    date: log.date,
    year: Number(log.year),
    month: Number(log.month) + 1,
    shift: log.shift,
    community: String(log.community || "").slice(0, 200),
    notes: String(log.notes || "").slice(0, 2000),
    values: normalizeMetricValues(log.values),
    deleted_at: null
  };
}

function scheduleSynchronization(delay = 500) {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    syncDebounceTimer = null;
    void synchronizeWithSupabase();
  }, delay);
}

function requestAutomaticSync() {
  if (document.visibilityState === "hidden") return;
  if (supabaseReady && currentSession && navigator.onLine) {
    void synchronizeWithSupabase();
  }
}

function startAutomaticSync() {
  if (autoSyncIntervalId !== null) return;
  autoSyncIntervalId = setInterval(requestAutomaticSync, AUTO_SYNC_INTERVAL_MS);
}

function stopAutomaticSync() {
  if (autoSyncIntervalId === null) return;
  clearInterval(autoSyncIntervalId);
  autoSyncIntervalId = null;
}

function queueOperation(operation) {
  state.pendingOperations ||= [];
  const index = state.pendingOperations.findIndex(
    (item) => item.entity === operation.entity && item.entityKey === operation.entityKey
  );
  const previous = index >= 0 ? state.pendingOperations[index] : null;
  const payload = operation.payload ? { ...operation.payload } : null;
  if (payload && previous?.payload) {
    ["baseUpdatedAt", "baseRevision"].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(previous.payload, field)) {
        payload[field] = previous.payload[field];
      }
    });
    if (
      Object.prototype.hasOwnProperty.call(payload, "source")
      || Object.prototype.hasOwnProperty.call(previous.payload, "source")
    ) {
      const previousSource = previous.payload.source || "manual";
      const nextSource = payload.source || "manual";
      payload.source = previousSource === nextSource
        ? nextSource
        : "mixed";
    }
    if (operation.entity === "daily_log") {
      const buckets = [
        ...(Array.isArray(previous.payload.affectedBuckets) ? previous.payload.affectedBuckets : []),
        ...(Array.isArray(payload.affectedBuckets) ? payload.affectedBuckets : [])
      ];
      payload.affectedBuckets = buckets.filter((bucket, bucketIndex) => (
        buckets.findIndex((candidate) => (
          Number(candidate.year) === Number(bucket.year)
          && Number(candidate.monthIndex) === Number(bucket.monthIndex)
          && slug(candidate.facility) === slug(bucket.facility)
        )) === bucketIndex
      ));
    }
  }
  const normalized = {
    // A replacement receives a new id so an in-flight older request cannot remove it.
    id: createUuid(),
    entity: operation.entity,
    entityKey: operation.entityKey,
    action: operation.action,
    payload,
    queued_at: new Date().toISOString()
  };
  if (index >= 0) {
    state.pendingOperations[index] = normalized;
  } else {
    state.pendingOperations.push(normalized);
  }
  queueRevision += 1;
  saveState();
  scheduleSynchronization();
}

function queueMonthlyUpsert(reportId, year, monthIndex, facility, values, source = "manual") {
  const key = entryKey(reportId, year, monthIndex, facility);
  const baseUpdatedAt = state.entryMeta?.[key]?.server_updated_at || null;
  queueOperation({
    entity: "monthly_entry",
    entityKey: key,
    action: "upsert",
    payload: {
      reportId,
      year,
      monthIndex,
      facility,
      values: normalizeMetricValues(values),
      baseUpdatedAt,
      source
    }
  });
}

function affectedLogBuckets(...logs) {
  const buckets = logs.filter(Boolean).map((log) => ({
    year: Number(log.year),
    monthIndex: Number(log.month),
    facility: log.facility
  }));
  return buckets.filter((bucket, bucketIndex) => (
    buckets.findIndex((candidate) => (
      candidate.year === bucket.year
      && candidate.monthIndex === bucket.monthIndex
      && slug(candidate.facility) === slug(bucket.facility)
    )) === bucketIndex
  ));
}

function upsertDailyLogRemote(log, previousLog = null) {
  queueOperation({
    entity: "daily_log",
    entityKey: log.id,
    action: "upsert",
    payload: {
      ...log,
      baseUpdatedAt: log.server_updated_at || null,
      affectedBuckets: affectedLogBuckets(log, previousLog)
    }
  });
}

function deleteDailyLogRemote(log) {
  if (!log) return;
  queueOperation({
    entity: "daily_log",
    entityKey: log.id,
    action: "delete",
    payload: {
      baseUpdatedAt: log.server_updated_at || null,
      deletedAt: new Date().toISOString(),
      year: Number(log.year),
      monthIndex: Number(log.month),
      facility: log.facility,
      affectedBuckets: affectedLogBuckets(log)
    }
  });
}

function deleteEntryRemote(reportId, monthIndex, facility, year = state.year) {
  const key = entryKey(reportId, year, monthIndex, facility);
  queueOperation({
    entity: "monthly_entry",
    entityKey: key,
    action: "delete",
    payload: {
      reportId,
      year,
      monthIndex,
      facility,
      baseUpdatedAt: state.entryMeta?.[key]?.server_updated_at || null,
      deletedAt: new Date().toISOString()
    }
  });
}

function expectSupabaseResult(result) {
  if (result?.error) throw result.error;
  return result?.data;
}

function createSyncConflict(message) {
  const error = new Error(message);
  error.code = "SYNC_CONFLICT";
  return error;
}

function createStaleSyncError() {
  const error = new Error("La sesión cambió durante la sincronización.");
  error.code = "STALE_SYNC";
  return error;
}

function isCurrentSyncContext(context) {
  return Boolean(
    context
    && sessionGeneration === context.generation
    && currentSession?.user?.id === context.userId
    && activeStorageKey === context.storageKey
  );
}

function assertCurrentSyncContext(context) {
  if (!isCurrentSyncContext(context)) throw createStaleSyncError();
}

function expectUpdatedRecord(result, message) {
  if (result?.error) {
    if (result.error.code === "23505") throw createSyncConflict(message);
    throw result.error;
  }
  if (!result?.data) throw createSyncConflict(message);
  return result.data;
}

function isCatalogConstraintViolation(error) {
  if (!error) return false;
  if (error.code === "23503") return true;
  const message = String(error.message || "").toLowerCase();
  return message.includes("no se puede retirar")
    || message.includes("datos históricos")
    || message.includes("indicador integrado");
}

function discardInvalidCatalogOperation(operation, error) {
  if (!operation || operation.entity !== "app_catalog" || !isCatalogConstraintViolation(error)) {
    return false;
  }
  state.pendingOperations = (state.pendingOperations || []).filter((item) => item.id !== operation.id);
  state.catalogMeta = {
    ...(state.catalogMeta || {}),
    local_only: false
  };
  saveState();
  setSupabaseStatus("El catálogo remoto bloqueó ese cambio porque ya hay datos históricos asociados.", false);
  return true;
}

async function executePendingOperation(operation) {
  if (operation.entity === "monthly_entry") {
    const payload = operation.payload || {};
    const baseUpdatedAt = payload.baseUpdatedAt || null;
    const baseQuery = () => supabaseClient
      .from("monthly_entries")
      .select("updated_at, deleted_at")
      .eq("report_id", payload.reportId)
      .eq("year", payload.year)
      .eq("month", Number(payload.monthIndex) + 1)
      .eq("facility_slug", slug(payload.facility));

    if (operation.action === "delete") {
      if (!baseUpdatedAt) {
        const existing = expectSupabaseResult(await baseQuery().maybeSingle());
        if (!existing) return { serverUpdatedAt: null };
        throw createSyncConflict("El registro mensual cambió en otro dispositivo.");
      }
      const row = expectUpdatedRecord(await supabaseClient
        .from("monthly_entries")
        .update({ deleted_at: payload.deletedAt || new Date().toISOString() })
        .eq("report_id", payload.reportId)
        .eq("year", payload.year)
        .eq("month", Number(payload.monthIndex) + 1)
        .eq("facility_slug", slug(payload.facility))
        .eq("updated_at", baseUpdatedAt)
        .select("updated_at")
        .maybeSingle(), "El registro mensual cambió en otro dispositivo.");
      return { serverUpdatedAt: row.updated_at };
    }

    const record = entryRecord(payload.reportId, payload.year, payload.monthIndex, payload.facility, payload.values);
    if (!baseUpdatedAt) {
      const row = expectUpdatedRecord(await supabaseClient
        .from("monthly_entries")
        .insert(record)
        .select("updated_at")
        .single(), "Ya existe una versión remota de este registro mensual.");
      return { serverUpdatedAt: row.updated_at };
    }
    const row = expectUpdatedRecord(await supabaseClient
      .from("monthly_entries")
      .update(record)
      .eq("report_id", payload.reportId)
      .eq("year", payload.year)
      .eq("month", Number(payload.monthIndex) + 1)
      .eq("facility_slug", slug(payload.facility))
      .eq("updated_at", baseUpdatedAt)
      .select("updated_at")
      .maybeSingle(), "El registro mensual cambió en otro dispositivo.");
    return { serverUpdatedAt: row.updated_at };
  }

  if (operation.entity === "daily_log") {
    const payload = operation.payload || {};
    const baseUpdatedAt = payload.baseUpdatedAt || null;
    if (operation.action === "delete") {
      if (!baseUpdatedAt) {
        const existing = expectSupabaseResult(await supabaseClient
          .from("daily_logs")
          .select("updated_at, deleted_at")
          .eq("id", operation.entityKey)
          .maybeSingle());
        if (!existing) return { serverUpdatedAt: null };
        throw createSyncConflict("La jornada cambió en otro dispositivo.");
      }
      const row = expectUpdatedRecord(await supabaseClient
        .from("daily_logs")
        .update({ deleted_at: payload.deletedAt || new Date().toISOString() })
        .eq("id", operation.entityKey)
        .eq("updated_at", baseUpdatedAt)
        .select("updated_at")
        .maybeSingle(), "La jornada cambió en otro dispositivo.");
      return { serverUpdatedAt: row.updated_at };
    }

    const record = dailyLogRecord(payload);
    if (!baseUpdatedAt) {
      const row = expectUpdatedRecord(await supabaseClient
        .from("daily_logs")
        .insert(record)
        .select("updated_at")
        .single(), "Ya existe una versión remota de esta jornada.");
      return { serverUpdatedAt: row.updated_at };
    }
    const row = expectUpdatedRecord(await supabaseClient
      .from("daily_logs")
      .update(record)
      .eq("id", operation.entityKey)
      .eq("updated_at", baseUpdatedAt)
      .select("updated_at")
      .maybeSingle(), "La jornada cambió en otro dispositivo.");
    return { serverUpdatedAt: row.updated_at };
  }

  if (operation.entity === "app_catalog") {
    if (currentProfile?.role !== "admin") throw new Error("Solo el Administrador puede modificar catálogos.");
    const payload = operation.payload || {};
    const catalogRecord = {
      id: "main",
      facilities: payload.facilities,
      report_fields: payload.report_fields
    };
    if (payload.baseRevision === null || payload.baseRevision === undefined) {
      const row = expectUpdatedRecord(await supabaseClient
        .from("app_catalog")
        .insert(catalogRecord)
        .select("revision, updated_at")
        .single(), "Ya existe una versión remota del catálogo.");
      return { catalogRevision: row.revision, serverUpdatedAt: row.updated_at };
    }
    const row = expectUpdatedRecord(await supabaseClient
      .from("app_catalog")
      .update(catalogRecord)
      .eq("id", "main")
      .eq("revision", payload.baseRevision)
      .select("revision, updated_at")
      .maybeSingle(), "El catálogo cambió en otro dispositivo.");
    return { catalogRevision: row.revision, serverUpdatedAt: row.updated_at };
  }
  throw new Error("Operación pendiente no reconocida.");
}

async function executePendingOperationAgainstLatest(operation, context) {
  const payload = { ...(operation.payload || {}) };
  if (operation.entity === "monthly_entry") {
    const latest = expectSupabaseResult(await supabaseClient
      .from("monthly_entries")
      .select("updated_at")
      .eq("report_id", payload.reportId)
      .eq("year", payload.year)
      .eq("month", Number(payload.monthIndex) + 1)
      .eq("facility_slug", slug(payload.facility))
      .maybeSingle());
    assertCurrentSyncContext(context);
    payload.baseUpdatedAt = latest?.updated_at || null;
  } else if (operation.entity === "daily_log") {
    const latest = expectSupabaseResult(await supabaseClient
      .from("daily_logs")
      .select("updated_at")
      .eq("id", operation.entityKey)
      .maybeSingle());
    assertCurrentSyncContext(context);
    payload.baseUpdatedAt = latest?.updated_at || null;
  } else if (operation.entity === "app_catalog") {
    const latest = expectSupabaseResult(await supabaseClient
      .from("app_catalog")
      .select("revision")
      .eq("id", "main")
      .maybeSingle());
    assertCurrentSyncContext(context);
    payload.baseRevision = latest?.revision ?? null;
  }
  return executePendingOperation({ ...operation, payload });
}

function recordOperationSuccess(operation, result) {
  const serverUpdatedAt = result?.serverUpdatedAt || null;
  const replacement = state.pendingOperations.find(
    (item) => item.id !== operation.id
      && item.entity === operation.entity
      && item.entityKey === operation.entityKey
  );
  if (replacement?.payload && serverUpdatedAt) {
    replacement.payload.baseUpdatedAt = serverUpdatedAt;
  }

  if (operation.entity === "monthly_entry") {
    state.entryMeta ||= {};
    const meta = state.entryMeta[operation.entityKey] || {};
    if (serverUpdatedAt) {
      state.entryMeta[operation.entityKey] = {
        ...meta,
        server_updated_at: serverUpdatedAt,
        deleted_at: operation.action === "delete" ? operation.payload?.deletedAt || serverUpdatedAt : null
      };
    }
  } else if (operation.entity === "daily_log" && serverUpdatedAt) {
    const log = state.dailyLogs.find((item) => item.id === operation.entityKey);
    if (log) log.server_updated_at = serverUpdatedAt;
  } else if (operation.entity === "app_catalog") {
    if (replacement?.payload && result?.catalogRevision) {
      replacement.payload.baseRevision = Number(result.catalogRevision);
    }
    state.catalogMeta = {
      revision: Number(result?.catalogRevision),
      updated_at: serverUpdatedAt,
      local_only: Boolean(replacement)
    };
  }
}

function operationTouchesBucket(operation, monthlyPayload) {
  if (operation.entity !== "daily_log") return false;
  const buckets = Array.isArray(operation.payload?.affectedBuckets)
    ? operation.payload.affectedBuckets
    : [{
        year: operation.payload?.year,
        monthIndex: operation.payload?.monthIndex ?? operation.payload?.month,
        facility: operation.payload?.facility
      }];
  return buckets.some((bucket) => (
    Number(bucket.year) === Number(monthlyPayload?.year)
    && Number(bucket.monthIndex) === Number(monthlyPayload?.monthIndex)
    && slug(bucket.facility) === slug(monthlyPayload?.facility)
  ));
}

async function flushPendingOperations(resolveConflicts = false, context = null) {
  if (!navigator.onLine || !currentSession || !currentProfile) {
    return { ok: false, fatal: false, conflicts: [] };
  }
  assertCurrentSyncContext(context);
  const priority = { app_catalog: 0, daily_log: 1, monthly_entry: 2 };
  const operations = [...(state.pendingOperations || [])]
    .sort((left, right) => (priority[left.entity] ?? 99) - (priority[right.entity] ?? 99));
  const conflicts = [];
  for (const operation of operations) {
    if (!state.pendingOperations.some((item) => item.id === operation.id)) continue;
    if (
      operation.entity === "monthly_entry"
      && operation.payload?.source === "logbook"
      && conflicts.some((conflict) => operationTouchesBucket(conflict, operation.payload))
    ) {
      conflicts.push(operation);
      continue;
    }
    try {
      let result;
      try {
        result = await executePendingOperation(operation);
        assertCurrentSyncContext(context);
      } catch (error) {
        assertCurrentSyncContext(context);
        if (error?.code !== "SYNC_CONFLICT") throw error;
        const derivedFromLogbook = operation.entity === "monthly_entry"
          && operation.payload?.source === "logbook";
        if (
          derivedFromLogbook
          || !resolveConflicts
          || !confirm(
            "Otra persona cambió este mismo registro. ¿Desea reemplazar la versión remota con su copia local? Si cancela, ambas versiones se conservarán sin sobrescribir."
          )
        ) {
          conflicts.push(operation);
          continue;
        }
        result = await executePendingOperationAgainstLatest(operation, context);
        assertCurrentSyncContext(context);
      }
      recordOperationSuccess(operation, result);
      state.pendingOperations = state.pendingOperations.filter((item) => item.id !== operation.id);
      saveState();
    } catch (error) {
      if (error?.code === "STALE_SYNC") throw error;
      if (discardInvalidCatalogOperation(operation, error)) {
        return { ok: false, fatal: false, conflicts: [] };
      }
      console.error("Error de sincronización:", error);
      const message = error?.code === "SYNC_CONFLICT"
        ? "Conflicto de sincronización; se conservó la copia local"
        : "Error al sincronizar";
      setSupabaseStatus(`${message} · ${state.pendingOperations.length} pendiente(s)`, false);
      return { ok: false, fatal: true, conflicts };
    }
  }
  if (conflicts.length) {
    setSupabaseStatus(
      `Conflicto de sincronización; pulse el estado para resolver · ${state.pendingOperations.length} pendiente(s)`,
      false
    );
    return { ok: false, fatal: false, conflicts };
  }
  return { ok: true, fatal: false, conflicts: [] };
}

async function fetchAllRowsForYears(table, columns, years, context) {
  const pageSize = 500;
  const rows = [];
  let total = null;
  let offset = 0;
  const safeYears = [...new Set(years.map(Number).filter((year) => year >= 2020 && year <= 2035))];
  if (!safeYears.length) return rows;

  do {
    const result = await supabaseClient
      .from(table)
      .select(columns, { count: "exact" })
      .in("year", safeYears)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    assertCurrentSyncContext(context);
    const page = expectSupabaseResult(result) || [];
    if (total === null) {
      if (!Number.isInteger(result.count) || result.count < 0) {
        throw new Error(`Supabase no informó el total de filas de ${table}.`);
      }
      total = result.count;
    }
    rows.push(...page);
    offset += page.length;
    if (!page.length && offset < total) {
      throw new Error(`Supabase no devolvió todas las filas de ${table}.`);
    }
  } while (offset < total);

  return rows;
}

function rebaseLogbookConflicts(conflicts, monthlyData) {
  const buckets = new Map();
  conflicts
    .filter((operation) => operation.entity === "monthly_entry" && operation.payload?.source === "logbook")
    .forEach((operation) => {
      const payload = operation.payload;
      const bucketKey = [payload.year, payload.monthIndex, slug(payload.facility)].join("|");
      buckets.set(bucketKey, {
        year: Number(payload.year),
        monthIndex: Number(payload.monthIndex),
        facility: payload.facility
      });
    });

  buckets.forEach((bucket) => {
    Object.keys(defaultReports).forEach((reportId) => {
      const key = entryKey(reportId, bucket.year, bucket.monthIndex, bucket.facility);
      const pending = state.pendingOperations.find(
        (operation) => operation.entity === "monthly_entry" && operation.entityKey === key
      );
      // Una edición manual o mixta nunca se sustituye automáticamente.
      if (pending && pending.payload?.source !== "logbook") return;
      const remote = monthlyData.find((record) => (
        record.report_id === reportId
        && Number(record.year) === bucket.year
        && Number(record.month) - 1 === bucket.monthIndex
        && record.facility_slug === slug(bucket.facility)
      ));
      const remoteValues = remote && !remote.deleted_at
        ? normalizeMetricValues(remote.values)
        : {};
      state.entries[key] = remoteValues;
      state.entryMeta ||= {};
      state.entryMeta[key] = {
        ...(state.entryMeta[key] || {}),
        updated_at: remote?.updated_at || new Date().toISOString(),
        server_updated_at: remote?.updated_at || null,
        deleted_at: remote?.deleted_at || null
      };
      if (pending?.payload) pending.payload.baseUpdatedAt = remote?.updated_at || null;
    });
    syncLogbookToMonthlyReports(bucket.facility, bucket.year, bucket.monthIndex);
  });
  return buckets.size;
}

async function syncFromSupabase(context, years = [state.year]) {
  const [monthlyData, logsData, catalogResult] = await Promise.all([
    fetchAllRowsForYears(
      "monthly_entries",
      "id, report_id, year, month, facility_slug, facility_name, values, updated_at, deleted_at",
      years,
      context
    ),
    fetchAllRowsForYears(
      "daily_logs",
      "id, facility_slug, facility_name, date, year, month, shift, community, notes, values, created_at, updated_at, deleted_at",
      years,
      context
    ),
    supabaseClient
      .from("app_catalog")
      .select("id, facilities, report_fields, revision, updated_at")
      .eq("id", "main")
      .maybeSingle()
  ]);
  assertCurrentSyncContext(context);
  const catalogData = expectSupabaseResult(catalogResult);
  let catalogChanged = false;
  if (catalogData) {
    catalogChanged = applyRemoteCatalog(catalogData);
  } else if (
    currentProfile?.role === "admin"
    && !(state.pendingOperations || []).some((operation) => operation.entity === "app_catalog")
  ) {
    queueCatalogUpsert();
  }
  applyRemoteRecords(monthlyData);
  applyRemoteDailyLogs(logsData);
  saveState();
  if (catalogChanged) {
    refreshSelectors();
  } else {
    renderSynchronizedData();
  }
  return { monthlyCount: monthlyData.length, logCount: logsData.length, monthlyData, logsData };
}

async function synchronizeWithSupabase(resolveConflicts = false) {
  if (syncInProgress || !supabaseReady || !supabaseClient || !currentSession) return false;
  if (!navigator.onLine) {
    setSupabaseStatus(`Sin red · ${state.pendingOperations?.length || 0} pendiente(s)`, false);
    return false;
  }

  syncInProgress = true;
  const revisionAtStart = queueRevision;
  const syncContext = {
    generation: sessionGeneration,
    userId: currentSession.user.id,
    storageKey: activeStorageKey
  };
  const syncDot = $("#syncDot");
  if (syncDot) syncDot.className = "status-indicator syncing";
  setSupabaseStatus("Sincronizando...", false);
  try {
    const flushResult = await flushPendingOperations(resolveConflicts, syncContext);
    assertCurrentSyncContext(syncContext);
    if (!flushResult || flushResult.fatal) return false;
    const conflictYears = (flushResult.conflicts || [])
      .map((operation) => Number(operation.payload?.year))
      .filter((year) => year >= 2020 && year <= 2035);
    const result = await syncFromSupabase(
      syncContext,
      [state.year, ...conflictYears]
    );
    assertCurrentSyncContext(syncContext);
    const dailyConflicts = (flushResult.conflicts || []).filter(
      (operation) => operation.entity === "daily_log"
    );
    const logbookConflicts = (flushResult.conflicts || []).filter(
      (operation) => operation.entity === "monthly_entry"
        && operation.payload?.source === "logbook"
        && !dailyConflicts.some((conflict) => operationTouchesBucket(conflict, operation.payload))
    );
    if (logbookConflicts.length) {
      const rebasedBuckets = rebaseLogbookConflicts(logbookConflicts, result.monthlyData);
      setSupabaseStatus(
        `Recalculando ${rebasedBuckets} período(s) con la bitácora completa · ${state.pendingOperations.length} pendiente(s)`,
        false
      );
    }
    const manualConflicts = (flushResult.conflicts || []).filter(
      (operation) => !logbookConflicts.includes(operation)
    );
    if (manualConflicts.length) {
      setSupabaseStatus(
        `Conflicto de sincronización; pulse el estado para resolver · ${state.pendingOperations.length} pendiente(s)`,
        false
      );
      return false;
    }
    if (logbookConflicts.length) return false;
    const pendingCount = state.pendingOperations?.length || 0;
    if (state.localOnlyMigrationPending) {
      setSupabaseStatus("Datos locales pendientes de subir · use “Subir Datos Locales”", false);
    } else {
      setSupabaseStatus(
        pendingCount ? `Conectado · ${pendingCount} pendiente(s)` : `Al día · ${result.logCount} jornada(s)`,
        true
      );
    }
    return pendingCount === 0;
  } catch (error) {
    if (error?.code === "STALE_SYNC") return false;
    console.error("No se pudo sincronizar:", error);
    setSupabaseStatus(`Error de sincronización: ${error.message || "revise la conexión"}`, false);
    return false;
  } finally {
    syncInProgress = false;
    if (!isCurrentSyncContext(syncContext)) {
      if (supabaseReady && currentSession && navigator.onLine) scheduleSynchronization(0);
    } else if (
      queueRevision > revisionAtStart
      && state.pendingOperations?.length
      && navigator.onLine
      && currentSession
    ) {
      scheduleSynchronization(100);
    }
  }
}

async function uploadLocalEntries() {
  if (currentProfile?.role !== "admin") return;
  queueCatalogUpsert();
  Object.entries(state.entries).forEach(([key, values]) => {
    const [reportId, year, monthIndex, facilitySlug] = key.split("|");
    const facility = state.facilities.find((item) => slug(item) === facilitySlug) || facilitySlug;
    queueMonthlyUpsert(reportId, Number(year), Number(monthIndex), facility, values);
  });
  (state.dailyLogs || []).forEach((log) => upsertDailyLogRemote(log));
  const success = await synchronizeWithSupabase(true);
  if (success) {
    state.localOnlyMigrationPending = false;
    saveState();
    setSupabaseStatus("Al día · datos locales sincronizados", true);
  }
  alert(success ? "Datos locales sincronizados correctamente." : "Quedaron datos pendientes. Revise el estado de conexión.");
}

function entryKey(reportId, year, monthIndex, facility) {
  return [reportId, year, monthIndex, slug(facility)].join("|");
}

function getEntry(reportId, monthIndex, facility, year = state.year) {
  const key = entryKey(reportId, year, monthIndex, facility);
  return state.entries[key] || {};
}

function setEntry(reportId, monthIndex, facility, values, year = state.year, source = "manual") {
  const key = entryKey(reportId, year, monthIndex, facility);
  state.entries[key] = normalizeMetricValues(values);
  state.entryMeta ||= {};
  state.entryMeta[key] = {
    ...(state.entryMeta[key] || {}),
    updated_at: new Date().toISOString(),
    deleted_at: null
  };
  queueMonthlyUpsert(reportId, year, monthIndex, facility, state.entries[key], source);
}

// Helpers de selección
function reportOptions(select) {
  if (!select) return;
  const options = Object.entries(state.reports).map(([id, report]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = String(report.name || id);
    return option;
  });
  select.replaceChildren(...options);
}

function monthOptions(select) {
  if (!select) return;
  const options = months.map((month, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = month;
    return option;
  });
  select.replaceChildren(...options);
}

function facilityOptions(select) {
  if (!select) return;
  const options = state.facilities.map((facility) => {
    const option = document.createElement("option");
    option.value = String(facility);
    option.textContent = String(facility);
    return option;
  });
  select.replaceChildren(...options);
}

function selectedReportId() {
  return $("#reportSelect")?.value || "dengue";
}

function selectedMonth() {
  return Number($("#monthSelect")?.value || 0);
}

function selectedFacility() {
  return $("#facilitySelect")?.value || state.facilities[0] || "Cornelio Moncada";
}

function currentFields(reportId) {
  return state.reports[reportId]?.fields || [];
}

// =====================================================================
// VISTA 0: BITÁCORA DIARIA DE CAMPO (NUEVA FUNCIONALIDAD)
// =====================================================================

/**
 * Consolida automáticamente las jornadas registradas en la bitácora
 * hacia los informes mensuales (Dengue, Rab 05 y 33 Actividades).
 */
function syncLogbookToMonthlyReports(facility, year, monthIndex) {
  const logs = (state.dailyLogs || []).filter(
    (l) => l.facility === facility && Number(l.year) === Number(year) && Number(l.month) === Number(monthIndex)
  );

  // Calcular totales acumulados por actividad en la bitácora
  const activitySums = {};
  logs.forEach((log) => {
    Object.entries(log.values || {}).forEach(([actKey, val]) => {
      activitySums[actKey] = (activitySums[actKey] || 0) + Number(val || 0);
    });
  });

  // Mapear a cada uno de los reportes mensuales
  const reportUpdates = { dengue: {}, rabia: {}, actividades: {} };

  Object.entries(logFieldMapping).forEach(([actKey, targets]) => {
    const val = activitySums[actKey] || 0;
    targets.forEach((target) => {
      const repObj = reportUpdates[target.reportId];
      if (repObj) {
        if (target.isVaccinatedAnimalTotal) {
          // Total de animales vacunados para 33 Actividades.
          repObj[target.fieldSlug] = totalVaccinatedAnimals(activitySums);
        } else {
          repObj[target.fieldSlug] = val;
        }
      }
    });
  });

  // Aplicar las sumas de la bitácora a los registros mensuales respetando campos manuales existentes
  Object.entries(reportUpdates).forEach(([repId, fieldsToUpdate]) => {
    const currentEntry = { ...getEntry(repId, monthIndex, facility, year) };
    Object.entries(fieldsToUpdate).forEach(([fieldSlug, totalVal]) => {
      if (totalVal > 0 || currentEntry[fieldSlug] !== undefined) {
        currentEntry[fieldSlug] = totalVal;
      }
    });
    setEntry(repId, monthIndex, facility, currentEntry, year, "logbook");
  });
}

function renderLogbook() {
  const facility = $("#logFacilitySelect")?.value || selectedFacility();
  const monthIndex = Number($("#logMonthSelect")?.value ?? selectedMonth());
  const shiftFilter = $("#logShiftFilter")?.value || "all";

  $("#logbookSummaryMeta").textContent = `${facility} · ${months[monthIndex]} ${state.year}`;

  const allLogsForMonth = (state.dailyLogs || []).filter(
    (l) => l.facility === facility && Number(l.year) === Number(state.year) && Number(l.month) === Number(monthIndex)
  );

  const filteredLogs = allLogsForMonth.filter((l) => shiftFilter === "all" || l.shift === shiftFilter);

  // Ordenar cronológicamente descendente (más reciente primero)
  filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

  $("#logbookEntryCount").textContent = `${allLogsForMonth.length} jornada${allLogsForMonth.length === 1 ? '' : 's'}`;

  // Resumen mensual de la bitácora
  const totals = {
    viviendas_abatizadas: 0,
    viviendas_nebulizadas: 0,
    criaderos_eliminados: 0,
    caninos_vacunados: 0,
    felinos_vacunados: 0,
    otros_animales_vacunados: 0,
    monitoreo_cloro: 0
  };

  allLogsForMonth.forEach((log) => {
    Object.keys(totals).forEach((key) => {
      totals[key] += Number(log.values?.[key] || 0);
    });
  });

  $("#logbookStatsGrid").innerHTML = `
    <div class="stat-card">
      <span>Jornadas registradas</span>
      <strong>${allLogsForMonth.length}</strong>
    </div>
    <div class="stat-card">
      <span>Viviendas abatizadas</span>
      <strong>${totals.viviendas_abatizadas.toLocaleString("es-HN")}</strong>
    </div>
    <div class="stat-card">
      <span>Viviendas nebulizadas</span>
      <strong>${totals.viviendas_nebulizadas.toLocaleString("es-HN")}</strong>
    </div>
    <div class="stat-card">
      <span>Criaderos eliminados</span>
      <strong>${totals.criaderos_eliminados.toLocaleString("es-HN")}</strong>
    </div>
    <div class="stat-card">
      <span>Total de animales vacunados</span>
      <strong>${totalVaccinatedAnimals(totals).toLocaleString("es-HN")}</strong>
    </div>
    <div class="stat-card">
      <span>Monitoreos cloro</span>
      <strong>${totals.monitoreo_cloro.toLocaleString("es-HN")}</strong>
    </div>
  `;

  // Lista de jornadas
  const listEl = $("#logbookList");
  if (!listEl) return;

  if (filteredLogs.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 32px 16px; color: var(--muted);">
        <p style="font-size: 1.1rem; margin-bottom: 8px;">📓 No hay jornadas registradas para este mes</p>
        <p style="font-size: 0.85rem;">Presione el botón <strong>"➕ Nueva jornada"</strong> para registrar las actividades de campo del día.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = filteredLogs.map((log) => {
    const shiftLabels = {
      manana: { text: "☀️ Mañana", cls: "manana" },
      tarde: { text: "🌇 Tarde / Noche", cls: "tarde" },
      completa: { text: "🕒 Jornada completa", cls: "completa" }
    };
    const shift = shiftLabels[log.shift] || shiftLabels.manana;

    // Resumen de tags con actividades > 0
    const activityTags = [];
    const v = log.values || {};
    if (v.viviendas_inspeccionadas) activityTags.push(`Viviendas Insp: <strong>${v.viviendas_inspeccionadas}</strong>`);
    if (v.viviendas_abatizadas) activityTags.push(`Abatizadas: <strong>${v.viviendas_abatizadas}</strong>`);
    if (v.viviendas_nebulizadas) activityTags.push(`Nebulizadas: <strong>${v.viviendas_nebulizadas}</strong>`);
    if (v.criaderos_eliminados) activityTags.push(`Criaderos elim: <strong>${v.criaderos_eliminados}</strong>`);
    if (v.bti_gramos) activityTags.push(`BTI: <strong>${v.bti_gramos}g</strong>`);
    if (v.deltametrina_litros) activityTags.push(`Deltametrina: <strong>${v.deltametrina_litros}L</strong>`);
    if (v.caninos_vacunados) activityTags.push(`Canes vac: <strong>${v.caninos_vacunados}</strong>`);
    if (v.felinos_vacunados) activityTags.push(`Felinos vac: <strong>${v.felinos_vacunados}</strong>`);
    if (v.otros_animales_vacunados) activityTags.push(`Otros animales vac: <strong>${v.otros_animales_vacunados}</strong>`);
    if (v.monitoreo_cloro) activityTags.push(`Cloro: <strong>${v.monitoreo_cloro}</strong>`);

    const safeId = escapeHtml(log.id);
    const safeDate = escapeHtml(log.date);
    const safeCommunity = escapeHtml(log.community || "Comunidad no especificada");
    const safeNotes = escapeHtml(log.notes || "");
    return `
      <div class="log-card">
        <div class="log-card-header">
          <div class="log-card-title">
            <span class="log-date">${safeDate}</span>
            <span class="shift-badge ${shift.cls}">${shift.text}</span>
            <span class="log-community">📍 ${safeCommunity}</span>
          </div>
          <div class="log-card-actions">
            <button type="button" class="secondary" data-edit-log="${safeId}">✏️ Editar</button>
            <button type="button" class="danger" data-delete-log="${safeId}">🗑️</button>
          </div>
        </div>
        ${activityTags.length ? `<div class="log-tags-grid">${activityTags.map(t => `<span class="log-tag">${t}</span>`).join("")}</div>` : ''}
        ${safeNotes ? `<div class="log-notes">📝 "${safeNotes}"</div>` : ''}
      </div>
    `;
  }).join("");

  // Acciones de las tarjetas de bitácora
  listEl.querySelectorAll("[data-edit-log]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const log = state.dailyLogs.find((l) => l.id === btn.dataset.editLog);
      if (log) openLogModal(log);
    });
  });

  listEl.querySelectorAll("[data-delete-log]").forEach((btn) => {
    btn.addEventListener("click", () => {
      showConfirmDialog(
        "Eliminar jornada de bitácora",
        "¿Desea eliminar esta entrada de la bitácora? Se actualizarán automáticamente los totales mensuales.",
        async () => {
          const logId = btn.dataset.deleteLog;
          const log = state.dailyLogs.find((l) => l.id === logId);
          state.dailyLogs = state.dailyLogs.filter((l) => l.id !== logId);
          saveState();

          if (log) {
            syncLogbookToMonthlyReports(log.facility, log.year, log.month);
            deleteDailyLogRemote(log);
          }

          renderLogbook();
          renderForm();
          renderSummary();
        }
      );
    });
  });
}

function openLogModal(editingLog = null) {
  const dialog = $("#logModal");
  if (!dialog) return;

  const facility = $("#logFacilitySelect")?.value || selectedFacility();
  const form = $("#logForm");
  form.reset();

  // Reset de pestañas del modal
  $$(".log-tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === "vector"));
  $$(".log-tab-content").forEach((c) => c.classList.toggle("active-tab-content", c.id === "tabVector"));

  if (editingLog) {
    $("#logModalTitle").textContent = `Editar Jornada · ${editingLog.facility}`;
    $("#editingLogId").value = editingLog.id;
    $("#logDateInput").value = editingLog.date;
    $("#logShiftSelect").value = editingLog.shift;
    $("#logCommunityInput").value = editingLog.community || "";
    $("#logNotesInput").value = editingLog.notes || "";

    // Cargar valores en los inputs
    Object.entries(editingLog.values || {}).forEach(([k, val]) => {
      const input = $(`#act_${k}`);
      if (input) input.value = val;
    });
  } else {
    $("#logModalTitle").textContent = `Nueva Jornada · ${facility}`;
    $("#editingLogId").value = "";
    // Fecha por defecto: hoy
    const today = localDateString();
    $("#logDateInput").value = today;
    $("#logShiftSelect").value = "manana";
    $("#logCommunityInput").value = "";
    $("#logNotesInput").value = "";
  }

  dialog.showModal();
}

function saveLogFromModal() {
  const facility = $("#logFacilitySelect")?.value || selectedFacility();
  const editingId = $("#editingLogId").value;
  const previousLog = editingId ? state.dailyLogs?.find((log) => log.id === editingId) : null;
  const dateStr = $("#logDateInput").value;
  const shift = $("#logShiftSelect").value;
  const community = $("#logCommunityInput").value.trim();
  const notes = $("#logNotesInput").value.trim();

  if (!dateStr || !community) {
    alert("Por favor complete la fecha y la comunidad intervenida.");
    return;
  }

  const dateObj = new Date(dateStr + "T12:00:00");
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  if (!Number.isFinite(dateObj.getTime()) || year < 2020 || year > 2035) {
    alert("La fecha de la jornada no es válida.");
    return;
  }

  // Recolectar valores de los campos de actividad
  const values = {};
  Object.keys(logFieldMapping).forEach((key) => {
    const input = $(`#act_${key}`);
    if (input) {
      const num = Number(input.value || 0);
      if (num > 0) values[key] = num;
    }
  });

  const logId = editingId || createUuid();
  const now = new Date().toISOString();
  const logRecord = {
    id: logId,
    facility,
    date: dateStr,
    year,
    month,
    shift,
    community,
    notes,
    values,
    created_at: previousLog?.created_at || now,
    updated_at: now,
    server_updated_at: previousLog?.server_updated_at || null
  };

  if (!state.dailyLogs) state.dailyLogs = [];

  if (editingId) {
    const idx = state.dailyLogs.findIndex((l) => l.id === editingId);
    if (idx !== -1) state.dailyLogs[idx] = logRecord;
  } else {
    state.dailyLogs.push(logRecord);
  }

  saveState();

  // Recalcular el origen primero si una edición cambió de período o establecimiento.
  if (previousLog && (
    previousLog.facility !== facility ||
    Number(previousLog.year) !== Number(year) ||
    Number(previousLog.month) !== Number(month)
  )) {
    syncLogbookToMonthlyReports(previousLog.facility, previousLog.year, previousLog.month);
  }

  // Alimentar automáticamente los informes mensuales correspondientes.
  syncLogbookToMonthlyReports(facility, year, month);

  // Sincronizar en segundo plano con Supabase si está disponible
  upsertDailyLogRemote(logRecord, previousLog);
  void synchronizeWithSupabase();

  $("#logModal").close();
  renderLogbook();
  renderForm();
  renderSummary();
  renderMonitoringGrid();
}

// =====================================================================
// VISTA 1: CAPTURA (TÉCNICO)
// =====================================================================
function renderForm() {
  const reportId = selectedReportId();
  const monthIndex = selectedMonth();
  const facility = selectedFacility();
  const report = state.reports[reportId];
  const entry = getEntry(reportId, monthIndex, facility);

  $("#captureSectionTitle").textContent = `${report.shortName || report.name}: ${facility}`;
  $("#captureSectionSubtitle").textContent = `${months[monthIndex]} ${state.year} · ${report.description}`;
  $("#headerFacilityText").textContent = facility;

  const searchQuery = ($("#formSearchInput")?.value || "").toLowerCase().trim();
  const fields = report.fields;

  const formGrid = $("#dynamicForm");
  formGrid.innerHTML = fields
    .map((field) => {
      const fieldId = slug(field);
      const isVisible = !searchQuery || field.toLowerCase().includes(searchQuery);
      const value = Number.isFinite(Number(entry[fieldId])) ? Number(entry[fieldId]) : "";
      const step = fieldId.includes("litros") ? "0.1" : "1";
      return `
        <div class="field-item" style="${isVisible ? '' : 'display: none;'}">
          <label for="field_${fieldId}">${escapeHtml(field)}</label>
          <input id="field_${fieldId}" type="number" min="0" step="${step}" inputmode="decimal" data-field="${fieldId}" value="${escapeHtml(value)}" placeholder="0">
        </div>
      `;
    })
    .join("");

  formGrid.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const savedState = $("#savedState");
      if (savedState) {
        savedState.textContent = "Guardando...";
        savedState.className = "status-pill saving";
      }

      const values = { ...getEntry(reportId, monthIndex, facility) };
      const rawVal = input.value.trim();
      if (rawVal === "") {
        delete values[input.dataset.field];
      } else {
        values[input.dataset.field] = Math.max(0, Number.parseFloat(rawVal) || 0);
      }
      setEntry(reportId, monthIndex, facility, values);
      renderMonthStats();
    });
  });

  renderMonthStats();
}

function sumFor(reportId, monthIndexes, facility = null) {
  const totals = {};
  currentFields(reportId).forEach((field) => {
    totals[slug(field)] = 0;
  });

  const facilities = facility ? [facility] : state.facilities;
  facilities.forEach((item) => {
    monthIndexes.forEach((monthIndex) => {
      const entry = getEntry(reportId, monthIndex, item);
      Object.keys(totals).forEach((fieldId) => {
        totals[fieldId] += Number(entry[fieldId] || 0);
      });
    });
  });

  return totals;
}

function renderMonthStats() {
  const reportId = selectedReportId();
  const facility = selectedFacility();
  const totals = sumFor(reportId, [selectedMonth()], facility);
  const fields = currentFields(reportId).slice(0, 6);

  $("#monthStatsSubtitle").textContent = `${facility} · ${months[selectedMonth()]}`;
  $("#monthStats").innerHTML = fields.map((field) => {
    const value = totals[slug(field)] || 0;
    return `
      <div class="stat-card">
        <span>${escapeHtml(field)}</span>
        <strong>${value.toLocaleString("es-HN")}</strong>
      </div>
    `;
  }).join("");
}

// =====================================================================
// VISTA 2: REPORTE INDIVIDUAL DEL ESTABLECIMIENTO (ENTREGA TÉCNICO)
// =====================================================================
function renderFacilityReport() {
  const facility = $("#facilityReportSelect")?.value || selectedFacility();
  const reportId = $("#facilityReportTypeSelect")?.value || selectedReportId();
  const monthIndex = Number($("#facilityReportMonthSelect")?.value ?? selectedMonth());

  const report = state.reports[reportId];
  const fields = currentFields(reportId);
  const entry = getEntry(reportId, monthIndex, facility);

  $("#repDocName").textContent = report.name;
  $("#repDocFacility").textContent = facility;
  $("#repDocMonth").textContent = months[monthIndex];
  $("#repDocYear").textContent = state.year;

  let rowsHtml = `
    <thead>
      <tr>
        <th style="width: 45px;">No.</th>
        <th>Actividad / Indicador de Salud Ambiental</th>
        <th class="num-cell" style="width: 140px;">Cantidad / Total</th>
      </tr>
    </thead>
    <tbody>
  `;

  let totalGeneral = 0;
  fields.forEach((field, idx) => {
    const val = Number(entry[slug(field)] || 0);
    totalGeneral += val;
    rowsHtml += `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(field)}</td>
        <td class="num-cell">${val.toLocaleString("es-HN")}</td>
      </tr>
    `;
  });

  rowsHtml += `
    <tr style="font-weight: bold; background: #eef5f2;">
      <td colspan="2" style="text-align: right;">Suma de actividades reportadas:</td>
      <td class="num-cell">${totalGeneral.toLocaleString("es-HN")}</td>
    </tr>
    </tbody>
  `;

  $("#facilityReportTable").innerHTML = rowsHtml;
}

// =====================================================================
// VISTA 3: SUPERVISOR (MONITOREO & CONSOLIDADO MUNICIPAL)
// =====================================================================
function renderMonitoringGrid() {
  if (!canAccessView("supervisor")) return;
  const reportId = $("#monitoringReportSelect")?.value || "dengue";
  const table = $("#monitoringGridTable");
  if (!table) return;

  let html = `<thead><tr><th>Establecimiento</th>`;
  months.forEach((m) => {
    html += `<th>${m.slice(0, 3)}</th>`;
  });
  html += `<th>Avance</th></tr></thead><tbody>`;

  state.facilities.forEach((fac) => {
    const safeFacility = escapeHtml(fac);
    html += `<tr><td><strong>${safeFacility}</strong></td>`;
    let filledMonths = 0;

    months.forEach((_, mIdx) => {
      const entry = getEntry(reportId, mIdx, fac);
      const hasData = Object.values(entry).some((v) => Number(v) > 0);
      if (hasData) filledMonths += 1;

      html += `
        <td class="monitoring-cell" data-facility="${safeFacility}" data-month="${mIdx}" data-report="${escapeHtml(reportId)}" title="${safeFacility} - ${months[mIdx]} (clic para ver)">
          <span class="status-cell-badge ${hasData ? 'done' : 'empty'}">
            ${hasData ? '✓' : '—'}
          </span>
        </td>
      `;
    });

    const percent = Math.round((filledMonths / 12) * 100);
    html += `<td><strong>${filledMonths}/12</strong> <small>(${percent}%)</small></td></tr>`;
  });

  html += `</tbody>`;
  table.innerHTML = html;

  table.querySelectorAll(".monitoring-cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      const fac = cell.dataset.facility;
      const mIdx = cell.dataset.month;
      const rId = cell.dataset.report;

      $("#facilitySelect").value = fac;
      $("#monthSelect").value = mIdx;
      $("#reportSelect").value = rId;

      switchView("capture");
      renderForm();
    });
  });
}

function periodMonths(type, value) {
  const numeric = Number(value);
  if (type === "month") return [numeric];
  if (type === "quarter") {
    const start = numeric * 3;
    return [start, start + 1, start + 2];
  }
  if (type === "semester") {
    return numeric === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
  }
  return months.map((_, index) => index);
}

function renderPeriodValues() {
  const type = $("#periodTypeSelect").value;
  const select = $("#periodValueSelect");
  if (type === "month") {
    monthOptions(select);
  } else if (type === "quarter") {
    select.innerHTML = ["I trimestre", "II trimestre", "III trimestre", "IV trimestre"]
      .map((label, index) => `<option value="${index}">${label}</option>`)
      .join("");
  } else if (type === "semester") {
    select.innerHTML = `<option value="0">I semestre</option><option value="1">II semestre</option>`;
  } else {
    select.innerHTML = `<option value="0">Año completo</option>`;
  }
}

function periodLabel() {
  const type = $("#periodTypeSelect").value;
  const value = $("#periodValueSelect").value;
  if (type === "month") return months[Number(value)];
  return $("#periodValueSelect").selectedOptions[0]?.textContent || "Año completo";
}

function renderSummary() {
  if (!canAccessView("supervisor")) return;
  const reportId = $("#summaryReportSelect").value || selectedReportId();
  const report = state.reports[reportId];
  const type = $("#periodTypeSelect").value;
  const monthsInPeriod = periodMonths(type, $("#periodValueSelect").value);
  const fields = currentFields(reportId);
  const municipalTotals = sumFor(reportId, monthsInPeriod);

  $("#summaryTitle").textContent = `${report.name}: consolidado municipal`;
  $("#summarySubtitle").textContent = `${periodLabel()} ${state.year} · ${report.description}`;

  $("#summaryStats").innerHTML = fields.slice(0, 6).map((field) => {
    const value = municipalTotals[slug(field)] || 0;
    return `
      <div class="stat-card">
        <span>${escapeHtml(field)}</span>
        <strong>${value.toLocaleString("es-HN")}</strong>
      </div>
    `;
  }).join("");

  const head = ["Establecimiento", ...fields, "Total indicadores"];
  const rows = state.facilities.map((facility) => {
    const totals = sumFor(reportId, monthsInPeriod, facility);
    const values = fields.map((field) => totals[slug(field)] || 0);
    return [facility, ...values, values.reduce((sum, value) => sum + value, 0)];
  });

  const municipalRow = [
    "TOTAL MUNICIPIO",
    ...fields.map((field) => municipalTotals[slug(field)] || 0),
    Object.values(municipalTotals).reduce((sum, value) => sum + value, 0)
  ];

  $("#summaryTable").innerHTML = `
    <thead><tr>${head.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map((row) => `<tr>${row.map((cell, index) => `<td>${index === 0 ? escapeHtml(cell) : Number(cell).toLocaleString("es-HN")}</td>`).join("")}</tr>`).join("")}
      <tr style="font-weight: 800; background: #eaf4ef;">${municipalRow.map((cell, index) => `<th>${index === 0 ? escapeHtml(cell) : Number(cell).toLocaleString("es-HN")}</th>`).join("")}</tr>
    </tbody>
  `;
}

// =====================================================================
// VISTA 4: CATÁLOGOS Y AJUSTES
// =====================================================================
function hasDuplicateSlug(items, candidate, ignoredIndex = -1) {
  const candidateSlug = slug(candidate);
  return !candidateSlug || items.some(
    (item, index) => index !== ignoredIndex && slug(item) === candidateSlug
  );
}

function isMappedReportField(reportId, fieldSlug) {
  return Object.values(logFieldMapping).some((targets) => targets.some(
    (target) => target.reportId === reportId && target.fieldSlug === fieldSlug
  ));
}

function catalogItemUsedLocally(kind, itemSlug, reportId = null) {
  if (kind === "facility") {
    const hasEntry = Object.keys(state.entries || {}).some((key) => key.split("|")[3] === itemSlug);
    const hasLog = (state.dailyLogs || []).some((log) => slug(log.facility) === itemSlug);
    const hasPending = (state.pendingOperations || []).some(
      (operation) => operation.entity !== "app_catalog"
        && slug(operation.payload?.facility) === itemSlug
    );
    return hasEntry || hasLog || hasPending;
  }
  return Object.entries(state.entries || {}).some(
    ([key, values]) => key.split("|")[0] === reportId
      && Object.prototype.hasOwnProperty.call(values || {}, itemSlug)
  );
}

async function catalogItemInUse(kind, itemSlug, reportId = null) {
  if (catalogItemUsedLocally(kind, itemSlug, reportId)) return true;
  if (!navigator.onLine || !supabaseClient || !currentSession) {
    throw new Error("Conéctese a internet para verificar que este elemento no tenga datos históricos.");
  }
  const { data, error } = await supabaseClient.rpc("catalog_item_in_use", {
    p_kind: kind,
    p_slug: itemSlug,
    p_report_id: reportId
  });
  if (error) throw error;
  return Boolean(data);
}

let managedUsersCache = [];
let managedUsersLoading = false;
const MANAGED_PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{6,16}$/;
const MANAGED_PASSWORD_ERROR = "La contraseña debe tener de 6 a 16 caracteres, usar solo letras y números e incluir al menos una letra y un número.";

function isManagedPasswordValid(password) {
  return MANAGED_PASSWORD_PATTERN.test(String(password || ""));
}

function validateManagedPasswordField(input) {
  const valid = isManagedPasswordValid(input?.value);
  input?.setCustomValidity(valid ? "" : MANAGED_PASSWORD_ERROR);
  if (!valid) input?.reportValidity();
  return valid;
}

function setUserManagementStatus(message, isError = false) {
  const element = $("#userManagementStatus");
  if (!element) return;
  element.textContent = message;
  element.style.color = isError ? "var(--danger)" : "var(--muted)";
}

async function invokeUserManagement(action, payload = {}) {
  if (currentProfile?.role !== "admin" || !supabaseClient || !currentSession) {
    throw new Error("Solo el Administrador puede gestionar usuarios.");
  }
  const { data, error } = await supabaseClient.functions.invoke("manage-users", {
    body: { action, ...payload }
  });
  if (error) {
    let message = error.message || "No se pudo ejecutar la administración de usuarios.";
    try {
      const details = await error.context?.json?.();
      if (details?.error) message = details.error;
    } catch (ignored) {}
    throw new Error(message);
  }
  if (!data?.ok) throw new Error(data?.error || "No se pudo completar la operación.");
  return data;
}

function renderManagedUsers() {
  const container = $("#managedUserList");
  if (!container || currentProfile?.role !== "admin") return;
  container.replaceChildren();

  if (!managedUsersCache.length) {
    const empty = document.createElement("p");
    empty.className = "form-help";
    empty.textContent = "No hay usuarios disponibles.";
    container.appendChild(empty);
    return;
  }

  managedUsersCache.forEach((user) => {
    const row = document.createElement("div");
    row.className = "managed-user-row";

    const identity = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = user.displayName || user.username;
    const meta = document.createElement("div");
    meta.className = "managed-user-meta";
    meta.textContent = `${user.username} · ${roleLabels[user.role] || user.role} · ${user.active ? "Activo" : "Inactivo"}`;
    identity.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "managed-user-actions";
    if (user.role !== "admin") {
      const statusButton = document.createElement("button");
      statusButton.type = "button";
      statusButton.className = user.active ? "secondary" : "primary";
      statusButton.textContent = user.active ? "Desactivar" : "Activar";
      statusButton.addEventListener("click", () => void setManagedUserActive(user.id, !user.active));

      const passwordButton = document.createElement("button");
      passwordButton.type = "button";
      passwordButton.className = "secondary";
      passwordButton.textContent = "Contraseña";
      passwordButton.addEventListener("click", () => openManagedUserPasswordDialog(user));
      actions.append(statusButton, passwordButton);
    }

    row.append(identity, actions);
    container.appendChild(row);
  });
}

async function refreshManagedUsers() {
  if (managedUsersLoading || currentProfile?.role !== "admin") return;
  managedUsersLoading = true;
  setUserManagementStatus("Cargando usuarios...");
  try {
    const result = await invokeUserManagement("list");
    managedUsersCache = Array.isArray(result.users) ? result.users : [];
    renderManagedUsers();
    setUserManagementStatus(`${managedUsersCache.length} usuario(s) registrado(s).`);
  } catch (error) {
    setUserManagementStatus(error.message, true);
  } finally {
    managedUsersLoading = false;
  }
}

async function createManagedUser(event) {
  event.preventDefault();
  if (currentProfile?.role !== "admin") return;
  const passwordInput = $("#newUserPassword");
  if (!validateManagedPasswordField(passwordInput)) {
    setUserManagementStatus(MANAGED_PASSWORD_ERROR, true);
    return;
  }
  const button = $("#createUserBtn");
  if (button) button.disabled = true;
  setUserManagementStatus("Creando usuario...");
  try {
    await invokeUserManagement("create", {
      username: $("#newUsername")?.value,
      displayName: $("#newUserDisplayName")?.value,
      password: passwordInput.value,
      role: $("#newUserRole")?.value
    });
    $("#userCreateForm")?.reset();
    setUserManagementStatus("Usuario creado correctamente.");
    await refreshManagedUsers();
  } catch (error) {
    setUserManagementStatus(error.message, true);
  } finally {
    if (button) button.disabled = false;
  }
}

async function setManagedUserActive(userId, active) {
  setUserManagementStatus(active ? "Activando usuario..." : "Desactivando usuario...");
  try {
    await invokeUserManagement("set_active", { userId, active });
    await refreshManagedUsers();
  } catch (error) {
    setUserManagementStatus(error.message, true);
  }
}

function openManagedUserPasswordDialog(user) {
  if (currentProfile?.role !== "admin") return;
  $("#userPasswordTargetId").value = user.id;
  $("#userPasswordTarget").textContent = `Usuario: ${user.username}`;
  $("#managedUserNewPassword").value = "";
  $("#userPasswordDialog")?.showModal();
}

async function updateManagedUserPassword(event) {
  event.preventDefault();
  const userId = $("#userPasswordTargetId")?.value;
  const passwordInput = $("#managedUserNewPassword");
  if (!validateManagedPasswordField(passwordInput)) {
    setUserManagementStatus(MANAGED_PASSWORD_ERROR, true);
    return;
  }
  const password = passwordInput.value;
  try {
    await invokeUserManagement("set_password", { userId, password });
    $("#userPasswordDialog")?.close();
    setUserManagementStatus("Contraseña actualizada correctamente.");
  } catch (error) {
    setUserManagementStatus(error.message, true);
  }
}

function renderCatalogs() {
  if (currentProfile?.role !== "admin") return;
  void refreshManagedUsers();
  $("#facilityList").innerHTML = state.facilities.map((facility, index) => `
    <div class="editable-row">
      <input value="${escapeHtml(facility)}" data-index="${index}" aria-label="Establecimiento ${index + 1}">
      <button type="button" class="danger" data-remove-facility="${index}" title="Eliminar">×</button>
    </div>
  `).join("");

  $("#facilityList").querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", async () => {
      if (currentProfile?.role !== "admin") return;
      const index = Number(input.dataset.index);
      const previous = state.facilities[index];
      const next = input.value.trim().slice(0, 120) || `Establecimiento ${index + 1}`;
      input.value = previous;
      if (next === previous) return;
      if (hasDuplicateSlug(state.facilities, next, index)) {
        alert("Ya existe un establecimiento con ese nombre o identificador.");
        return;
      }
      try {
        if (await catalogItemInUse("facility", slug(previous))) {
          alert("No se puede renombrar un establecimiento que ya tiene datos históricos.");
          return;
        }
      } catch (error) {
        alert(error.message || "No se pudo verificar el historial del establecimiento.");
        return;
      }
      if (currentProfile?.role !== "admin" || state.facilities[index] !== previous) return;
      state.facilities[index] = next;
      queueCatalogUpsert();
      refreshSelectors();
    });
  });

  $("#facilityList").querySelectorAll("[data-remove-facility]").forEach((button) => {
    button.addEventListener("click", () => {
      if (currentProfile?.role !== "admin") return;
      if (state.facilities.length <= 1) {
        alert("Debe haber al menos un establecimiento registrado.");
        return;
      }
      showConfirmDialog(
        "Eliminar establecimiento",
        "¿Está seguro de eliminar este establecimiento de la lista?",
        async () => {
          const index = Number(button.dataset.removeFacility);
          const facility = state.facilities[index];
          try {
            if (await catalogItemInUse("facility", slug(facility))) {
              alert("No se puede eliminar un establecimiento que ya tiene datos históricos.");
              return;
            }
          } catch (error) {
            alert(error.message || "No se pudo verificar el historial del establecimiento.");
            return;
          }
          if (currentProfile?.role !== "admin" || state.facilities[index] !== facility) return;
          state.facilities.splice(index, 1);
          queueCatalogUpsert();
          refreshSelectors();
        }
      );
    });
  });

  renderFieldCatalog();
}

function renderFieldCatalog() {
  if (currentProfile?.role !== "admin") return;
  const reportId = $("#catalogReportSelect").value || "dengue";
  const fields = currentFields(reportId);
  $("#fieldList").innerHTML = fields.map((field, index) => `
    <div class="editable-row">
      <input value="${escapeHtml(field)}" data-index="${index}" aria-label="Indicador ${index + 1}">
      <button type="button" class="danger" data-remove-field="${index}" title="Eliminar">×</button>
    </div>
  `).join("");

  $("#fieldList").querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", async () => {
      if (currentProfile?.role !== "admin") return;
      const index = Number(input.dataset.index);
      const previous = fields[index];
      const next = input.value.trim().slice(0, 160) || `Indicador ${index + 1}`;
      input.value = previous;
      if (next === previous) return;
      if (hasDuplicateSlug(fields, next, index)) {
        alert("Ya existe un indicador con ese nombre o identificador.");
        return;
      }
      if (isMappedReportField(reportId, slug(previous))) {
        alert("Este indicador alimenta reportes desde la bitácora y no puede renombrarse.");
        return;
      }
      try {
        if (await catalogItemInUse("field", slug(previous), reportId)) {
          alert("No se puede renombrar un indicador que ya tiene datos históricos.");
          return;
        }
      } catch (error) {
        alert(error.message || "No se pudo verificar el historial del indicador.");
        return;
      }
      if (currentProfile?.role !== "admin" || fields[index] !== previous) return;
      fields[index] = next;
      queueCatalogUpsert();
      renderFieldCatalog();
      renderForm();
      renderSummary();
    });
  });

  $("#fieldList").querySelectorAll("[data-remove-field]").forEach((button) => {
    button.addEventListener("click", () => {
      if (currentProfile?.role !== "admin") return;
      if (fields.length <= 1) {
        alert("Debe haber al menos un indicador en el informe.");
        return;
      }
      const index = Number(button.dataset.removeField);
      const field = fields[index];
      if (isMappedReportField(reportId, slug(field))) {
        alert("Este indicador alimenta reportes desde la bitácora y no puede eliminarse.");
        return;
      }
      showConfirmDialog(
        "Eliminar indicador",
        "¿Está seguro de eliminar este indicador del informe?",
        async () => {
          try {
            if (await catalogItemInUse("field", slug(field), reportId)) {
              alert("No se puede eliminar un indicador que ya tiene datos históricos.");
              return;
            }
          } catch (error) {
            alert(error.message || "No se pudo verificar el historial del indicador.");
            return;
          }
          if (currentProfile?.role !== "admin" || fields[index] !== field) return;
          fields.splice(index, 1);
          queueCatalogUpsert();
          renderFieldCatalog();
          renderForm();
          renderSummary();
        }
      );
    });
  });
}

function refreshSelectors() {
  const restoreSelectValue = (select, previousValue) => {
    if (!select || !previousValue) return;
    if (Array.from(select.options).some((option) => option.value === previousValue)) {
      select.value = previousValue;
    }
  };

  const reportSelectors = [
    $("#reportSelect"),
    $("#summaryReportSelect"),
    $("#catalogReportSelect"),
    $("#facilityReportTypeSelect"),
    $("#monitoringReportSelect")
  ];
  const previousReports = reportSelectors.map((select) => select?.value || "");
  reportSelectors.forEach(reportOptions);
  reportSelectors.forEach((select, index) => restoreSelectValue(select, previousReports[index]));

  const monthSelectors = [
    $("#monthSelect"),
    $("#facilityReportMonthSelect"),
    $("#logMonthSelect")
  ];
  const previousMonths = monthSelectors.map((select) => select?.value || "");
  monthSelectors.forEach(monthOptions);
  monthSelectors.forEach((select, index) => restoreSelectValue(select, previousMonths[index]));

  const facilitySelectors = [
    $("#facilitySelect"),
    $("#facilityReportSelect"),
    $("#logFacilitySelect")
  ];
  const previousFacilities = facilitySelectors.map((select) => select?.value || "");
  facilitySelectors.forEach(facilityOptions);

  const fallbackFacility = state.facilities[0] || "Cornelio Moncada";
  facilitySelectors.forEach((select, index) => {
    if (!select) return;
    const previousFacility = previousFacilities[index];
    select.value = state.facilities.includes(previousFacility)
      ? previousFacility
      : fallbackFacility;
  });
  const activeFacility = $("#facilitySelect")?.value || fallbackFacility;
  if ($("#headerFacilityText")) $("#headerFacilityText").textContent = activeFacility;

  const yearSelect = $("#yearSelect");
  if (yearSelect) yearSelect.value = state.year;

  const previousPeriodValue = $("#periodValueSelect")?.value || "";
  renderPeriodValues();
  restoreSelectValue($("#periodValueSelect"), previousPeriodValue);
  renderLogbook();
  if (!document.activeElement?.closest?.("#dynamicForm")) renderForm();
  else renderMonthStats();
  renderFacilityReport();
  if (canAccessView("supervisor")) {
    renderMonitoringGrid();
    renderSummary();
  }
  if (
    currentProfile?.role === "admin"
    && !document.activeElement?.closest?.("#facilityList, #fieldList")
  ) renderCatalogs();
}

function renderSynchronizedData() {
  renderLogbook();
  if (!document.activeElement?.closest?.("#dynamicForm")) renderForm();
  else renderMonthStats();
  renderFacilityReport();
  if (canAccessView("supervisor")) {
    renderMonitoringGrid();
    renderSummary();
  }
}

function showConfirmDialog(title, message, onConfirm) {
  const dialog = $("#confirmDialog");
  if (!dialog) {
    if (confirm(message)) onConfirm();
    return;
  }

  $("#dialogTitle").textContent = title;
  $("#dialogMessage").textContent = message;

  const confirmBtn = $("#dialogConfirmBtn");
  const cancelBtn = $("#dialogCancelBtn");

  const cleanup = () => {
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    dialog.close();
  };

  $("#dialogCancelBtn").addEventListener("click", () => {
    cleanup();
  }, { once: true });

  $("#dialogConfirmBtn").addEventListener("click", () => {
    cleanup();
    onConfirm();
  }, { once: true });

  dialog.showModal();
}

// =====================================================================
// GENERADOR NATIVO OPENXML (.XLSX)
// =====================================================================
function colName(index) {
  let name = "";
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function numberValue(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function percent(numerator, denominator) {
  const top = numberValue(numerator);
  const bottom = numberValue(denominator);
  return bottom ? Number(((top / bottom) * 100).toFixed(2)) : 0;
}

function xCell(value, style = 0, mergeAcross = 0, mergeDown = 0) {
  return { value, style, mergeAcross, mergeDown };
}

function xFormula(formula, value = 0, style = 0, mergeAcross = 0, mergeDown = 0) {
  return { formula, value, style, mergeAcross, mergeDown };
}

function xlsxCellXml(cellData, rowIndex, columnIndex) {
  const reference = `${colName(columnIndex)}${rowIndex}`;
  const style = cellData.style ? ` s="${cellData.style}"` : "";
  if (cellData.formula) {
    return `<c r="${reference}"${style}><f>${xmlEscape(cellData.formula)}</f><v>${numberValue(cellData.value)}</v></c>`;
  }
  if (typeof cellData.value === "number") {
    return `<c r="${reference}"${style}><v>${cellData.value}</v></c>`;
  }
  return `<c r="${reference}" t="inlineStr"${style}><is><t>${xmlEscape(cellData.value)}</t></is></c>`;
}

function sheetXml(rows, widths = []) {
  const merges = [];
  const cols = widths.length
    ? `<cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("")}</cols>`
    : "";

  const sheetRows = rows.map((cells, rowIndex) => {
    let columnIndex = 1;
    const cellXml = cells.map((cellData) => {
      const xml = xlsxCellXml(cellData, rowIndex + 1, columnIndex);
      if (cellData.mergeAcross || cellData.mergeDown) {
        merges.push(`${colName(columnIndex)}${rowIndex + 1}:${colName(columnIndex + (cellData.mergeAcross || 0))}${rowIndex + 1 + (cellData.mergeDown || 0)}`);
      }
      columnIndex += (cellData.mergeAcross || 0) + 1;
      return xml;
    }).join("");
    return `<row r="${rowIndex + 1}">${cellXml}</row>`;
  }).join("");

  const mergeXml = merges.length
    ? `<mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  ${cols}
  <sheetData>${sheetRows}</sheetData>
  ${mergeXml}
</worksheet>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="10"/><name val="Arial"/></font>
    <font><b/><sz val="13"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><name val="Arial"/></font>
    <font><b/><sz val="9"/><name val="Arial"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFDDEFE7"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFC9E4F2"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEAF4EF"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="9">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="4" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="4" fontId="3" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function crc32(bytes) {
  const table = crc32.table || (crc32.table = Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  }));
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(buffer, offset, value) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(buffer, offset, value) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
  buffer[offset + 3] = (value >>> 24) & 0xff;
}

function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function zipStore(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.content === "string" ? encoder.encode(file.content) : file.content;
    const crc = crc32(dataBytes);
    const local = new Uint8Array(30 + nameBytes.length);
    writeUint32(local, 0, 0x04034b50);
    writeUint16(local, 4, 20);
    writeUint16(local, 6, 0);
    writeUint16(local, 8, 0);
    writeUint32(local, 14, crc);
    writeUint32(local, 18, dataBytes.length);
    writeUint32(local, 22, dataBytes.length);
    writeUint16(local, 26, nameBytes.length);
    local.set(nameBytes, 30);
    localParts.push(local, dataBytes);

    const central = new Uint8Array(46 + nameBytes.length);
    writeUint32(central, 0, 0x02014b50);
    writeUint16(central, 4, 20);
    writeUint16(central, 6, 20);
    writeUint16(central, 8, 0);
    writeUint16(central, 10, 0);
    writeUint32(central, 16, crc);
    writeUint32(central, 20, dataBytes.length);
    writeUint32(central, 24, dataBytes.length);
    writeUint16(central, 28, nameBytes.length);
    writeUint32(central, 42, offset);
    central.set(nameBytes, 46);
    centralParts.push(central);

    offset += local.length + dataBytes.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  writeUint32(end, 0, 0x06054b50);
  writeUint16(end, 8, files.length);
  writeUint16(end, 10, files.length);
  writeUint32(end, 12, centralDirectory.length);
  writeUint32(end, 16, offset);

  return concatBytes([...localParts, centralDirectory, end]);
}

function buildXlsxPackage(sheetName, rows, widths) {
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${xmlEscape(sheetName.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
    },
    { name: "xl/styles.xml", content: stylesXml() },
    { name: "xl/worksheets/sheet1.xml", content: sheetXml(rows, widths) }
  ];
  return zipStore(files);
}

function monthRangeLabel(monthIndexes) {
  if (monthIndexes.length === 1) return months[monthIndexes[0]];
  return `${months[monthIndexes[0]]} a ${months[monthIndexes.length - 1]}`;
}

function finalPeriodMonth(monthIndexes) {
  return Math.max(...monthIndexes);
}

// Plantillas oficiales XLSX
function xlsxDengueRows(monthIndexes) {
  const colCount = 27;
  const rows = [
    [xCell("SECRETARIA DE SALUD HONDURAS", 1, colCount - 1)],
    [xCell("INFORME MENSUAL DE ACTIVIDADES DE PREVENCION CONTROL Y VIGILANCIA DE DENGUE", 1, colCount - 1)],
    [xCell("PROGRAMA NACIONAL DE DENGUE", 1, colCount - 1)],
    [xCell("Region Departamental de Cortes No 5", 2, colCount - 1)],
    [xCell("SEMANA EPIDEMIOLOGICA", 3), xCell("MES", 3), xCell(monthRangeLabel(monthIndexes).toUpperCase(), 5), xCell("AÑO", 3), xCell(state.year, 6), xCell("RISS PUERTO CORTES", 3, 3)],
    [xCell("", 4), xCell("", 4), xCell("Viviendas", 4, 5), xCell("Depositos", 4, 5), xCell("Ovitrampas", 4, 2), xCell("Sitios de Riesgo", 4, 2), xCell("Consumo", 4, 3), xCell("Operativos", 4, 2)],
    [
      xCell("No.", 3), xCell("COMUNIDAD", 3),
      xCell("Inspeccionadas", 3), xCell("Positivas", 3), xCell("In. Vivienda %", 3),
      xCell("Abatizadas", 3), xCell("Nebulizadas", 3), xCell("Criaderos Eliminados", 3),
      xCell("Total Inspeccionados", 3), xCell("Positivos", 3), xCell("Negativos", 3),
      xCell("Eliminados", 3), xCell("In. Bretau %", 3), xCell("In. De Recipientes", 3),
      xCell("Existentes", 3), xCell("Inspeccionadas", 3), xCell("Positivas", 3),
      xCell("Existentes", 3), xCell("Inspeccionadas", 3), xCell("Positivos", 3),
      xCell("Becto Vac Gramos", 3), xCell("Deltametrina litro", 3),
      xCell("AquaReslin litro", 3), xCell("Solfac litro", 3),
      xCell("Programados", 3), xCell("Ejecutados", 3), xCell("AGI", 3)
    ]
  ];

  state.facilities.forEach((facility, index) => {
    const totals = sumFor("dengue", monthIndexes, facility);
    rows.push(dengueXlsxDataRow(facility, index + 1, totals, 6));
  });
  rows.push(dengueXlsxDataRow("TOTAL MUNICIPIO", "", sumFor("dengue", monthIndexes), 8));
  return rows;
}

function dengueXlsxDataRow(label, index, totals, numberStyle) {
  const inspectedHomes = totals.viviendas_inspeccionadas || 0;
  const positiveHomes = totals.viviendas_positivas || 0;
  const inspectedContainers = totals.depositos_inspeccionados || 0;
  const positiveContainers = totals.depositos_positivos || 0;

  return [
    xCell(index, numberStyle), xCell(label, 5),
    xCell(inspectedHomes, numberStyle), xCell(positiveHomes, numberStyle),
    xCell(percent(positiveHomes, inspectedHomes), 7),
    xCell(totals.viviendas_abatizadas || 0, numberStyle),
    xCell(totals.viviendas_nebulizadas || 0, numberStyle),
    xCell(totals.criaderos_eliminados || 0, numberStyle),
    xCell(inspectedContainers, numberStyle),
    xCell(positiveContainers, numberStyle),
    xCell(totals.depositos_negativos || 0, numberStyle),
    xCell(totals.depositos_eliminados || 0, numberStyle),
    xCell(percent(positiveContainers, inspectedHomes), 7),
    xCell(percent(positiveContainers, inspectedContainers), 7),
    xCell(totals.ovitrampas_existentes || 0, numberStyle),
    xCell(totals.ovitrampas_inspeccionadas || 0, numberStyle),
    xCell(totals.ovitrampas_positivas || 0, numberStyle),
    xCell(totals.sitios_de_riesgo_existentes || 0, numberStyle),
    xCell(totals.sitios_de_riesgo_inspeccionados || 0, numberStyle),
    xCell(totals.sitios_de_riesgo_positivos || 0, numberStyle),
    xCell(totals.bti_becto_vac_gramos || 0, numberStyle),
    xCell(totals.deltametrina_litros || 0, numberStyle),
    xCell(totals.aquareslin_litros || 0, numberStyle),
    xCell(totals.solfac_litros || 0, numberStyle),
    xCell(totals.operativos_programados || 0, numberStyle),
    xCell(totals.operativos_ejecutados || 0, numberStyle),
    xCell(totals.agi || 0, numberStyle)
  ];
}

function xlsxActivitiesRows(monthIndexes) {
  const fields = currentFields("actividades");
  const colCount = 16;
  const cumulativeMonths = months.slice(0, finalPeriodMonth(monthIndexes) + 1).map((_, index) => index);
  const templateFacilities = state.facilities;
  const rows = Array.from({ length: 56 }, () => []);

  rows[0] = [xCell("SECRETARIA DE SALUD", 1, colCount - 1)];
  rows[1] = [xCell("REGIÓN DEPARTAMENTAL DE CORTES", 1, colCount - 1)];
  rows[2] = [xCell("UNIDAD DE RIESGOS AMBIENTALES.", 1, colCount - 1)];
  rows[3] = [xCell("", 0), xCell("COORDINACION DE SALUD  PUERTO CORTES", 2, 13)];
  rows[4] = [xCell("", 0), xCell("REDES INTEGRADAS", 2, colCount - 2)];
  rows[5] = [
    xCell(`Mes: ${monthRangeLabel(monthIndexes).toUpperCase()}`, 5),
    xCell(`INFORME : MENSUAL        ${monthRangeLabel(monthIndexes).toUpperCase()}                              Responsable:`, 5)
  ];
  rows[6] = [xCell("", 0), xCell(`Año: ${state.year}`, 5)];
  rows[7] = [xCell("Puerto Cortes", 5)];
  rows[9] = [
    xCell("No", 3, 0, 4),
    xCell("ACTIVIDADES ", 3, 0, 2),
    ...templateFacilities.map((facility) => xCell(facility, 3, 0, 4)),
    xCell("Total Municipio", 3, 0, 4),
    xCell("Total  Acumulado ", 3, 0, 4)
  ];
  rows[12] = [xCell("", 0), xCell("PROMOCIÓN PARA LA SALUD ", 5, 0, 1)];
  rows[24] = [xCell("", 4, colCount - 1)];

  fields.slice(0, 38).forEach((field, index) => {
    const rowNumber = index <= 9 ? 15 + index : 16 + index;
    const fieldId = slug(field);
    const facilityValues = templateFacilities.map((facility) => sumFor("actividades", monthIndexes, facility)[fieldId] || 0);
    const municipal = facilityValues.reduce((sum, value) => sum + value, 0);
    const cumulative = templateFacilities.reduce((sum, facility) => sum + (sumFor("actividades", cumulativeMonths, facility)[fieldId] || 0), 0);
    rows[rowNumber - 1] = [
      xCell(index + 1, 6),
      xCell(field, 5),
      ...facilityValues.map((value) => xCell(value, 6)),
      xFormula(`SUM(C${rowNumber}:N${rowNumber})`, municipal, 8),
      xCell(cumulative, 8)
    ];
  });

  rows[53] = [xCell("", 0), xCell("Observacion: Puente Alto se cuenta en estos momentos con ASA Municipal de contrato temporal, ", 5, 1, 1)];
  rows[55] = [xCell("", 0), xCell("Calan, Caoba , kele Kele NO HAY TSA", 5)];
  return rows;
}

function xlsxRabiaRows(monthIndexes) {
  const fields = currentFields("rabia");
  const colCount = state.facilities.length + 3;
  const rows = [
    [xCell("SECRETARIA DE SALUD HONDURAS", 1, colCount - 1)],
    [xCell("RAB 05", 1, colCount - 1)],
    [xCell("REGION DEPARTAMENTAL DE CORTES - PUERTO CORTES", 2, colCount - 1)],
    [xCell(`${monthRangeLabel(monthIndexes).toUpperCase()} ${state.year}`, 2, colCount - 1)],
    [xCell("No", 3), xCell("Actividad / Indicador", 3), ...state.facilities.map((facility) => xCell(facility, 3)), xCell("Total Municipio", 3)]
  ];

  fields.forEach((field, index) => {
    const fieldId = slug(field);
    const facilityValues = state.facilities.map((facility) => sumFor("rabia", monthIndexes, facility)[fieldId] || 0);
    rows.push([
      xCell(index + 1, 6), xCell(field, 5),
      ...facilityValues.map((value) => xCell(value, 6)),
      xCell(facilityValues.reduce((sum, value) => sum + value, 0), 8)
    ]);
  });

  return rows;
}

// Exportación individual por establecimiento (.xlsx)
function xlsxFacilityRows(reportId, facility, monthIndex) {
  const report = state.reports[reportId];
  const fields = currentFields(reportId);
  const entry = getEntry(reportId, monthIndex, facility);
  const colCount = 3;

  const rows = [
    [xCell("SECRETARÍA DE SALUD DE HONDURAS", 1, colCount - 1)],
    [xCell("REGIÓN DEPARTAMENTAL DE SALUD DE CORTÉS (NO. 5)", 2, colCount - 1)],
    [xCell("COORDINACIÓN DE SALUD PUERTO CORTÉS · SALUD AMBIENTAL", 2, colCount - 1)],
    [xCell(`INFORME INDIVIDUAL: ${report.name.toUpperCase()}`, 1, colCount - 1)],
    [xCell(`ESTABLECIMIENTO: ${facility.toUpperCase()}`, 3), xCell(`MES: ${months[monthIndex].toUpperCase()}`, 3), xCell(`AÑO: ${state.year}`, 3)],
    [xCell("No.", 3), xCell("Actividad / Indicador", 3), xCell("Cantidad Reportada", 3)]
  ];

  let total = 0;
  fields.forEach((field, idx) => {
    const val = Number(entry[slug(field)] || 0);
    total += val;
    rows.push([
      xCell(idx + 1, 6),
      xCell(field, 5),
      xCell(val, 6)
    ]);
  });

  rows.push([
    xCell("", 8),
    xCell("TOTAL ACTIVIDADES REPORTADAS", 8),
    xCell(total, 8)
  ]);

  return rows;
}

function exportFacilityXlsx() {
  const facility = $("#facilityReportSelect")?.value || selectedFacility();
  const reportId = $("#facilityReportTypeSelect")?.value || selectedReportId();
  const monthIndex = Number($("#facilityReportMonthSelect")?.value ?? selectedMonth());

  const rows = xlsxFacilityRows(reportId, facility, monthIndex);
  const bytes = buildXlsxPackage(`${facility.slice(0, 15)}_${months[monthIndex]}`, rows, [6, 46, 20]);
  const filename = `Reporte_${slug(facility)}_${reportId}_${months[monthIndex]}_${state.year}.xlsx`;
  downloadBlob(bytes, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

function exportSpecificXlsx(reportId) {
  if (!canAccessView("supervisor")) return;
  const type = $("#periodTypeSelect").value;
  const value = $("#periodValueSelect").value;
  const monthsInPeriod = periodMonths(type, value);

  const builders = {
    dengue: {
      sheetName: "Consolidado Dengue",
      filename: "Consolidado_Dengue",
      rows: xlsxDengueRows,
      widths: [8, 24, ...Array(25).fill(12)]
    },
    actividades: {
      sheetName: "33 Actividades",
      filename: "33_Actividades",
      rows: xlsxActivitiesRows,
      widths: [3.71, 48, ...Array(12).fill(7.71), 9.29, 11]
    },
    rabia: {
      sheetName: "Rab 05",
      filename: "Rab_05",
      rows: xlsxRabiaRows,
      widths: [8, 34, ...Array(state.facilities.length).fill(13), 15]
    }
  };

  const builder = builders[reportId];
  const bytes = buildXlsxPackage(builder.sheetName, builder.rows(monthsInPeriod), builder.widths);
  const label = periodLabel().replace(/\s+/g, "_");
  downloadBlob(bytes, `${builder.filename}_${label}_${state.year}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

function exportCsv() {
  if (!canAccessView("supervisor")) return;
  const reportId = $("#summaryReportSelect").value || selectedReportId();
  const fields = currentFields(reportId);
  const type = $("#periodTypeSelect").value;
  const monthsInPeriod = periodMonths(type, $("#periodValueSelect").value);
  const header = ["Informe", "Año", "Periodo", "Establecimiento", ...fields];
  const rows = state.facilities.map((facility) => {
    const totals = sumFor(reportId, monthsInPeriod, facility);
    return [state.reports[reportId].name, state.year, periodLabel(), facility, ...fields.map((field) => totals[slug(field)] || 0)];
  });

  const csvRows = [header, ...rows].map((row) => row.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","));
  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  downloadBlob(csvContent, `consolidado_${reportId}_${state.year}.csv`, "text/csv;charset=utf-8");
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// =====================================================================
// NAVEGACIÓN Y ROLES
// =====================================================================
function switchView(viewName) {
  if (!currentProfile) {
    showLoginScreen();
    return false;
  }
  if (!canAccessView(viewName)) {
    viewName = initialViewForRole(currentProfile.role);
  }
  $$(".view").forEach((v) => v.classList.remove("active-view"));
  $$(".nav-button").forEach((b) => b.classList.toggle("active", b.dataset.view === viewName));
  $$(".bottom-nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === viewName));

  const targetView = $(`#${viewName}View`);
  if (targetView) targetView.classList.add("active-view");

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (viewName === "logbook") renderLogbook();
  if (viewName === "capture") renderForm();
  if (viewName === "facilityReport") renderFacilityReport();
  if (viewName === "supervisor") {
    renderMonitoringGrid();
    renderSummary();
    if (currentSession && !activatingUserId) requestAutomaticSync();
  }
  if (viewName === "catalogs" && currentProfile.role === "admin") renderCatalogs();
  return true;
}

function bindEvents() {
  $("#loginForm")?.addEventListener("submit", handleLogin);
  $("#togglePasswordBtn")?.addEventListener("click", () => {
    const input = $("#loginPassword");
    const button = $("#togglePasswordBtn");
    if (!input || !button) return;
    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";
    button.setAttribute("aria-pressed", String(showPassword));
    button.textContent = showPassword ? "🙈" : "👁️";
  });
  $("#headerLogoutBtn")?.addEventListener("click", () => void handleLogout());
  $("#sidebarLogoutBtn")?.addEventListener("click", () => void handleLogout());
  $("#syncStatusBadge")?.addEventListener("click", () => void synchronizeWithSupabase(true));

  // Navegación escritorio y móvil
  $$(".nav-button, .bottom-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  // Eventos de la Bitácora
  $("#logFacilitySelect")?.addEventListener("change", renderLogbook);
  $("#logMonthSelect")?.addEventListener("change", renderLogbook);
  $("#logShiftFilter")?.addEventListener("change", renderLogbook);
  $("#openNewLogBtn")?.addEventListener("click", () => openLogModal());
  $("#closeLogModalBtn")?.addEventListener("click", () => $("#logModal")?.close());
  $("#cancelLogBtn")?.addEventListener("click", () => $("#logModal")?.close());

  // Tabs dentro del modal de bitácora
  $$(".log-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".log-tab-btn").forEach((b) => b.classList.remove("active"));
      $$(".log-tab-content").forEach((c) => c.classList.remove("active-tab-content"));
      btn.classList.add("active");
      const targetId = btn.dataset.tab === "vector" ? "tabVector" : btn.dataset.tab === "rabia" ? "tabRabia" : "tabSaneamiento";
      $(`#${targetId}`)?.classList.add("active-tab-content");
    });
  });

  $("#logForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveLogFromModal();
  });

  $("#syncLogbookToMonthlyBtn")?.addEventListener("click", () => {
    const facility = $("#logFacilitySelect")?.value || selectedFacility();
    const monthIndex = Number($("#logMonthSelect")?.value ?? selectedMonth());
    syncLogbookToMonthlyReports(facility, state.year, monthIndex);
    alert(`Se consolidaron todas las jornadas de la bitácora de ${facility} para ${months[monthIndex]} en los informes mensuales.`);
    renderForm();
    renderSummary();
    renderMonitoringGrid();
  });

  $("#printLogbookBtn")?.addEventListener("click", () => window.print());

  // Filtros de captura mensual
  $("#facilitySelect")?.addEventListener("change", () => {
    renderForm();
    $("#facilityReportSelect").value = $("#facilitySelect").value;
    $("#logFacilitySelect").value = $("#facilitySelect").value;
  });
  $("#reportSelect")?.addEventListener("change", () => {
    renderForm();
    $("#facilityReportTypeSelect").value = $("#reportSelect").value;
  });
  $("#monthSelect")?.addEventListener("change", () => {
    renderForm();
    $("#facilityReportMonthSelect").value = $("#monthSelect").value;
    $("#logMonthSelect").value = $("#monthSelect").value;
  });

  // Búsqueda rápida en formulario de captura
  $("#formSearchInput")?.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    $$("#dynamicForm .field-item").forEach((item) => {
      const text = item.querySelector("label")?.textContent.toLowerCase() || "";
      item.style.display = !query || text.includes(query) ? "" : "none";
    });
  });

  // Acción rápida: Ver reporte del mes
  $("#quickViewReportBtn")?.addEventListener("click", () => {
    $("#facilityReportSelect").value = selectedFacility();
    $("#facilityReportTypeSelect").value = selectedReportId();
    $("#facilityReportMonthSelect").value = selectedMonth();
    switchView("facilityReport");
  });

  // Limpiar mes con confirmación
  $("#clearMonthBtn")?.addEventListener("click", () => {
    const reportId = selectedReportId();
    const monthIndex = selectedMonth();
    const facility = selectedFacility();
    showConfirmDialog(
      "Limpiar mes del establecimiento",
      `¿Desea borrar todos los valores capturados para ${facility} en ${months[monthIndex]}?`,
      () => {
        const key = entryKey(reportId, state.year, monthIndex, facility);
        delete state.entries[key];
        saveState();
        void deleteEntryRemote(reportId, monthIndex, facility);
        renderForm();
        renderSummary();
        renderMonitoringGrid();
      }
    );
  });

  // Vista 2: Filtros de Reporte individual
  $("#facilityReportSelect")?.addEventListener("change", renderFacilityReport);
  $("#facilityReportTypeSelect")?.addEventListener("change", renderFacilityReport);
  $("#facilityReportMonthSelect")?.addEventListener("change", renderFacilityReport);

  // Botones de impresión y exportación individual
  $("#printReportBtn")?.addEventListener("click", () => window.print());
  $("#exportFacilityPrintBtn")?.addEventListener("click", () => {
    $("#facilityReportSelect").value = selectedFacility();
    $("#facilityReportTypeSelect").value = selectedReportId();
    $("#facilityReportMonthSelect").value = selectedMonth();
    renderFacilityReport();
    switchView("facilityReport");
    setTimeout(() => window.print(), 250);
  });
  $("#downloadFacilityXlsxBtn")?.addEventListener("click", exportFacilityXlsx);
  $("#exportFacilityXlsxBtn")?.addEventListener("click", exportFacilityXlsx);

  // Subnavegación del Supervisor
  $$(".subnav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".subnav-tab").forEach((t) => t.classList.remove("active"));
      $$(".subtab-content").forEach((c) => c.classList.remove("active-subtab"));
      tab.classList.add("active");
      $(`#${tab.dataset.subtab}Subtab`)?.classList.add("active-subtab");
    });
  });

  $("#monitoringReportSelect")?.addEventListener("change", renderMonitoringGrid);
  $("#summaryReportSelect")?.addEventListener("change", renderSummary);
  $("#periodTypeSelect")?.addEventListener("change", () => {
    renderPeriodValues();
    renderSummary();
  });
  $("#periodValueSelect")?.addEventListener("change", renderSummary);

  // Cambio de año
  $("#yearSelect")?.addEventListener("change", async () => {
    state.year = Math.max(2020, Math.min(2035, Number($("#yearSelect").value) || currentYearDefault()));
    saveState();
    renderLogbook();
    renderForm();
    renderFacilityReport();
    renderMonitoringGrid();
    renderSummary();
    if (supabaseReady && currentSession) {
      await synchronizeWithSupabase();
    }
  });

  // Exportaciones del Supervisor
  $("#exportDengueXlsxBtn")?.addEventListener("click", () => exportSpecificXlsx("dengue"));
  $("#exportActivitiesXlsxBtn")?.addEventListener("click", () => exportSpecificXlsx("actividades"));
  $("#exportRabiaXlsxBtn")?.addEventListener("click", () => exportSpecificXlsx("rabia"));
  $("#exportCsvBtn")?.addEventListener("click", exportCsv);
  $("#printConsolidatedBtn")?.addEventListener("click", () => window.print());

  // Respaldo e Importación JSON
  $("#exportJsonBtn")?.addEventListener("click", () => {
    if (currentProfile?.role !== "admin") return;
    downloadBlob(JSON.stringify(state, null, 2), `respaldo_salud_ambiental_${state.year}.json`, "application/json");
  });

  $("#importJsonInput")?.addEventListener("change", async (event) => {
    if (currentProfile?.role !== "admin") return;
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      state = normalizeImportedState(parsed);
      saveState();
      refreshSelectors();
      alert("Respaldo validado y restaurado localmente. Use “Subir Datos Locales” para sincronizarlo.");
    } catch (err) {
      alert(`Error al importar: ${err.message}`);
    }
    event.target.value = "";
  });

  // Catálogos
  $("#addFacilityBtn")?.addEventListener("click", () => {
    if (currentProfile?.role !== "admin") return;
    let number = state.facilities.length + 1;
    let name = `Establecimiento ${number}`;
    while (state.facilities.some((facility) => slug(facility) === slug(name))) {
      number += 1;
      name = `Establecimiento ${number}`;
    }
    state.facilities.push(name);
    queueCatalogUpsert();
    refreshSelectors();
  });

  $("#resetFacilitiesBtn")?.addEventListener("click", () => {
    if (currentProfile?.role !== "admin") return;
    showConfirmDialog(
      "Restaurar establecimientos",
      "¿Desea restaurar la lista oficial de los 12 establecimientos de Puerto Cortés?",
      async () => {
        const snapshot = [...state.facilities];
        const changedFacilities = snapshot.filter(
          (facility) => !defaultFacilities.includes(facility)
        );
        try {
          const usage = await Promise.all(
            changedFacilities.map((facility) => catalogItemInUse("facility", slug(facility)))
          );
          if (usage.some(Boolean)) {
            alert("No se puede restaurar la lista porque uno de los establecimientos que desaparecería tiene datos históricos.");
            return;
          }
        } catch (error) {
          alert(error.message || "No se pudo verificar el historial de establecimientos.");
          return;
        }
        if (
          currentProfile?.role !== "admin"
          || JSON.stringify(state.facilities) !== JSON.stringify(snapshot)
        ) return;
        state.facilities = [...defaultFacilities];
        queueCatalogUpsert();
        refreshSelectors();
      }
    );
  });

  $("#catalogReportSelect")?.addEventListener("change", renderFieldCatalog);
  $("#addFieldBtn")?.addEventListener("click", () => {
    if (currentProfile?.role !== "admin") return;
    const reportId = $("#catalogReportSelect").value || "dengue";
    const fields = state.reports[reportId].fields;
    let number = fields.length + 1;
    let name = `Indicador ${number}`;
    while (fields.some((field) => slug(field) === slug(name))) {
      number += 1;
      name = `Indicador ${number}`;
    }
    fields.push(name);
    queueCatalogUpsert();
    renderFieldCatalog();
    renderForm();
    renderSummary();
  });

  // Usuarios administrados (solo Admin)
  $("#userCreateForm")?.addEventListener("submit", createManagedUser);
  $("#newUserPassword")?.addEventListener("input", (event) => event.currentTarget.setCustomValidity(""));
  $("#refreshUsersBtn")?.addEventListener("click", () => void refreshManagedUsers());
  $("#userPasswordForm")?.addEventListener("submit", updateManagedUserPassword);
  $("#managedUserNewPassword")?.addEventListener("input", (event) => event.currentTarget.setCustomValidity(""));
  $("#cancelUserPasswordBtn")?.addEventListener("click", () => $("#userPasswordDialog")?.close());

  // Supabase
  $("#saveSupabaseConfigBtn")?.addEventListener("click", () => {
    if (currentProfile?.role !== "admin") return;
    const config = {
      url: $("#supabaseUrlInput").value.trim(),
      anonKey: $("#supabaseAnonKeyInput").value.trim()
    };
    saveSupabaseConfig(config);
    alert("Configuración guardada. La aplicación se reiniciará para conectar de forma segura.");
    window.location.reload();
  });

  $("#syncSupabaseBtn")?.addEventListener("click", () => void synchronizeWithSupabase(true));
  $("#uploadLocalBtn")?.addEventListener("click", uploadLocalEntries);

  window.addEventListener("online", () => {
    setSupabaseStatus("Conexión restablecida", supabaseReady);
    if (supabaseReady && currentSession) void synchronizeWithSupabase();
  });

  window.addEventListener("offline", () => {
    setSupabaseStatus("Sin conexión a internet (Modo local)", false);
  });

  window.addEventListener("focus", requestAutomaticSync);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") requestAutomaticSync();
  });
}

// =====================================================================
// INICIALIZACIÓN
// =====================================================================
function init() {
  bindEvents();
  $("#appContainer")?.style.setProperty("display", "none");
  $("#loginScreen")?.style.setProperty("display", "flex");
  if (!setupSupabase()) {
    setLoginError("Sistema no configurado. Contacte al administrador.");
    setLoginBusy(false);
    return;
  }
  setLoginBusy(false);
  watchAuthState();
}

init();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js?v=13", { updateViaCache: "none" }).catch((error) => {
      console.warn("No se pudo registrar el modo offline:", error);
    });
  });
}

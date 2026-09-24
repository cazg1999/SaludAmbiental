/**
 * SALUD AMBIENTAL · PUERTO CORTÉS, HONDURAS
 * Sistema de Captura de Campo y Consolidado Municipal
 */

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const defaultFacilities = [
  "Pto. Cortés", "La Pita", "Travesía", "Saraguayna", "Bajamar", "Fraternidad",
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

const storageKey = "saludAmbientalMunicipal.v1";
const supabaseConfigKey = "saludAmbientalMunicipal.supabase.v1";
const deviceFacilityKey = "saludAmbientalMunicipal.deviceFacility";
const userRoleKey = "saludAmbientalMunicipal.userRole";

let state = loadState();
let supabaseClient = null;
let supabaseReady = false;
let syncDebounceTimer = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

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

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const reports = parsed.reports || defaultReports;
      Object.keys(defaultReports).forEach((reportId) => {
        reports[reportId] = {
          ...defaultReports[reportId],
          ...(reports[reportId] || {}),
          name: defaultReports[reportId].name,
          shortName: defaultReports[reportId].shortName,
          description: defaultReports[reportId].description
        };
      });
      return {
        year: parsed.year || currentYearDefault(),
        facilities: parsed.facilities?.length ? parsed.facilities : defaultFacilities,
        reports,
        entries: parsed.entries || {}
      };
    } catch (error) {
      console.warn("No se pudo leer el respaldo local", error);
    }
  }

  return {
    year: currentYearDefault(),
    facilities: defaultFacilities,
    reports: defaultReports,
    entries: {}
  };
}

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    const savedState = $("#savedState");
    if (savedState) {
      savedState.textContent = "Guardado";
      savedState.className = "status-pill saved";
    }
  } catch (err) {
    console.error("Error al guardar estado local:", err);
  }
}

// Configuración de Supabase (prevalece config.js central, con opción de sobreescribir en localStorage)
function loadSupabaseConfig() {
  const localSaved = localStorage.getItem(supabaseConfigKey);
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (parsed.url && parsed.anonKey) return parsed;
    } catch (e) {
      // Ignorar error y usar config central
    }
  }

  if (typeof DEFAULT_SUPABASE_CONFIG !== "undefined" && DEFAULT_SUPABASE_CONFIG.url && DEFAULT_SUPABASE_CONFIG.anonKey) {
    return DEFAULT_SUPABASE_CONFIG;
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

  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = isConnected ? "db-status connected" : "db-status";
  }

  if (syncDot && syncStatusText) {
    if (isConnected) {
      syncDot.className = "status-indicator connected";
      syncStatusText.textContent = "En línea";
    } else if (navigator.onLine) {
      syncDot.className = "status-indicator";
      syncStatusText.textContent = "Local";
    } else {
      syncDot.className = "status-indicator";
      syncStatusText.textContent = "Sin red";
    }
  }
}

function setupSupabase() {
  const config = loadSupabaseConfig();
  const urlInput = $("#supabaseUrlInput");
  const keyInput = $("#supabaseAnonKeyInput");
  if (urlInput) urlInput.value = config.url || "";
  if (keyInput) keyInput.value = config.anonKey || "";

  if (!config.url || !config.anonKey) {
    supabaseReady = false;
    setSupabaseStatus("Sin conectar (modo local offline)", false);
    return false;
  }

  if (!window.supabase?.createClient) {
    supabaseReady = false;
    setSupabaseStatus("Librería de Supabase no disponible", false);
    return false;
  }

  try {
    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    supabaseReady = true;
    setSupabaseStatus("Conectado a Supabase", true);
    return true;
  } catch (err) {
    supabaseReady = false;
    setSupabaseStatus(`Error al inicializar: ${err.message}`, false);
    return false;
  }
}

function entryRecord(reportId, year, monthIndex, facility, values) {
  return {
    report_id: reportId,
    year,
    month: monthIndex + 1,
    facility_slug: slug(facility),
    facility_name: facility,
    values,
    updated_at: new Date().toISOString()
  };
}

function applyRemoteRecords(records) {
  if (!Array.isArray(records)) return;
  records.forEach((record) => {
    const monthIndex = Number(record.month) - 1;
    const key = entryKey(record.report_id, record.year, monthIndex, record.facility_name);
    state.entries[key] = record.values || {};
  });
  saveState();
}

async function syncFromSupabase() {
  if (!supabaseReady || !supabaseClient) return;

  const syncDot = $("#syncDot");
  if (syncDot) syncDot.className = "status-indicator syncing";
  setSupabaseStatus("Sincronizando...", false);

  try {
    const { data, error } = await supabaseClient
      .from("monthly_entries")
      .select("report_id, year, month, facility_name, values")
      .eq("year", state.year);

    if (error) {
      setSupabaseStatus(`Error: ${error.message}`, false);
      return;
    }

    applyRemoteRecords(data || []);
    refreshSelectors();
    setSupabaseStatus(`Sincronizado (${(data || []).length} registros)`, true);
  } catch (err) {
    setSupabaseStatus("Sin conexión al servidor", false);
  }
}

async function upsertEntryRemote(reportId, monthIndex, facility, values) {
  if (!supabaseReady || !supabaseClient || !navigator.onLine) return;
  const record = entryRecord(reportId, state.year, monthIndex, facility, values);

  const syncDot = $("#syncDot");
  if (syncDot) syncDot.className = "status-indicator syncing";

  const { error } = await supabaseClient
    .from("monthly_entries")
    .upsert(record, { onConflict: "report_id,year,month,facility_slug" });

  if (error) {
    console.warn("Fallo al guardar en Supabase:", error.message);
    setSupabaseStatus(`Error al guardar: ${error.message}`, false);
    return;
  }
  setSupabaseStatus("Conectado a Supabase", true);
}

async function deleteEntryRemote(reportId, monthIndex, facility) {
  if (!supabaseReady || !supabaseClient || !navigator.onLine) return;
  await supabaseClient
    .from("monthly_entries")
    .delete()
    .eq("report_id", reportId)
    .eq("year", state.year)
    .eq("month", monthIndex + 1)
    .eq("facility_slug", slug(facility));
}

async function uploadLocalEntries() {
  if (!supabaseReady || !supabaseClient) {
    alert("Configure la conexión a Supabase primero.");
    return;
  }
  const records = Object.entries(state.entries).map(([key, values]) => {
    const [reportId, year, monthIndex, facilitySlug] = key.split("|");
    const facility = state.facilities.find((item) => slug(item) === facilitySlug) || facilitySlug;
    return entryRecord(reportId, Number(year), Number(monthIndex), facility, values);
  });

  if (!records.length) {
    alert("No hay datos locales para subir.");
    return;
  }

  setSupabaseStatus("Subiendo datos locales...", false);
  const { error } = await supabaseClient
    .from("monthly_entries")
    .upsert(records, { onConflict: "report_id,year,month,facility_slug" });

  if (error) {
    alert(`Error al subir: ${error.message}`);
    setSupabaseStatus(`Error al subir: ${error.message}`, false);
    return;
  }
  alert(`Se subieron exitosamente ${records.length} registros a la base de datos.`);
  setSupabaseStatus(`Datos subidos: ${records.length}`, true);
}

function entryKey(reportId, year, monthIndex, facility) {
  return [reportId, year, monthIndex, slug(facility)].join("|");
}

function getEntry(reportId, monthIndex, facility) {
  const key = entryKey(reportId, state.year, monthIndex, facility);
  return state.entries[key] || {};
}

function setEntry(reportId, monthIndex, facility, values) {
  const key = entryKey(reportId, state.year, monthIndex, facility);
  state.entries[key] = values;
  saveState();

  // Debounce para no saturar Supabase con cada tecla
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    void upsertEntryRemote(reportId, monthIndex, facility, values);
  }, 400);
}

// Helpers de selección
function reportOptions(select) {
  if (!select) return;
  select.innerHTML = Object.entries(state.reports)
    .map(([id, report]) => `<option value="${id}">${report.name}</option>`)
    .join("");
}

function monthOptions(select) {
  if (!select) return;
  select.innerHTML = months.map((month, index) => `<option value="${index}">${month}</option>`).join("");
}

function facilityOptions(select) {
  if (!select) return;
  select.innerHTML = state.facilities.map((facility) => `<option value="${facility}">${facility}</option>`).join("");
}

function selectedReportId() {
  return $("#reportSelect")?.value || "dengue";
}

function selectedMonth() {
  return Number($("#monthSelect")?.value || 0);
}

function selectedFacility() {
  return $("#facilitySelect")?.value || state.facilities[0] || "Pto. Cortés";
}

function currentFields(reportId) {
  return state.reports[reportId]?.fields || [];
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
      const value = entry[fieldId] ?? "";
      return `
        <div class="field-item" style="${isVisible ? '' : 'display: none;'}">
          <label for="field_${fieldId}">${field}</label>
          <input id="field_${fieldId}" type="number" min="0" step="1" inputmode="numeric" data-field="${fieldId}" value="${value}" placeholder="0">
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
        values[input.dataset.field] = Math.max(0, parseInt(rawVal, 10) || 0);
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
        <span>${field}</span>
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
        <td>${field}</td>
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
  const reportId = $("#monitoringReportSelect")?.value || "dengue";
  const table = $("#monitoringGridTable");
  if (!table) return;

  let html = `<thead><tr><th>Establecimiento</th>`;
  months.forEach((m) => {
    html += `<th>${m.slice(0, 3)}</th>`;
  });
  html += `<th>Avance</th></tr></thead><tbody>`;

  state.facilities.forEach((fac) => {
    html += `<tr><td><strong>${fac}</strong></td>`;
    let filledMonths = 0;

    months.forEach((_, mIdx) => {
      const entry = getEntry(reportId, mIdx, fac);
      const hasData = Object.values(entry).some((v) => Number(v) > 0);
      if (hasData) filledMonths += 1;

      html += `
        <td class="monitoring-cell" data-facility="${fac}" data-month="${mIdx}" data-report="${reportId}" title="${fac} - ${months[mIdx]} (clic para ver)">
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

  // Clic en celda para saltar directamente a captura
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
        <span>${field}</span>
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
    <thead><tr>${head.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map((row) => `<tr>${row.map((cell, index) => `<td>${index === 0 ? cell : Number(cell).toLocaleString("es-HN")}</td>`).join("")}</tr>`).join("")}
      <tr style="font-weight: 800; background: #eaf4ef;">${municipalRow.map((cell, index) => `<th>${index === 0 ? cell : Number(cell).toLocaleString("es-HN")}</th>`).join("")}</tr>
    </tbody>
  `;
}

// =====================================================================
// VISTA 4: CATÁLOGOS Y AJUSTES
// =====================================================================
function renderCatalogs() {
  $("#facilityList").innerHTML = state.facilities.map((facility, index) => `
    <div class="editable-row">
      <input value="${facility}" data-index="${index}" aria-label="Establecimiento ${index + 1}">
      <button type="button" class="danger" data-remove-facility="${index}" title="Eliminar">×</button>
    </div>
  `).join("");

  $("#facilityList").querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      state.facilities[Number(input.dataset.index)] = input.value.trim() || `Establecimiento ${Number(input.dataset.index) + 1}`;
      saveState();
      refreshSelectors();
    });
  });

  $("#facilityList").querySelectorAll("[data-remove-facility]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.facilities.length <= 1) {
        alert("Debe haber al menos un establecimiento registrado.");
        return;
      }
      showConfirmDialog(
        "Eliminar establecimiento",
        "¿Está seguro de eliminar este establecimiento de la lista?",
        () => {
          state.facilities.splice(Number(button.dataset.removeFacility), 1);
          saveState();
          refreshSelectors();
        }
      );
    });
  });

  renderFieldCatalog();
}

function renderFieldCatalog() {
  const reportId = $("#catalogReportSelect").value || "dengue";
  const fields = currentFields(reportId);
  $("#fieldList").innerHTML = fields.map((field, index) => `
    <div class="editable-row">
      <input value="${field}" data-index="${index}" aria-label="Indicador ${index + 1}">
      <button type="button" class="danger" data-remove-field="${index}" title="Eliminar">×</button>
    </div>
  `).join("");

  $("#fieldList").querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      fields[Number(input.dataset.index)] = input.value.trim() || `Indicador ${Number(input.dataset.index) + 1}`;
      saveState();
      renderForm();
      renderSummary();
    });
  });

  $("#fieldList").querySelectorAll("[data-remove-field]").forEach((button) => {
    button.addEventListener("click", () => {
      if (fields.length <= 1) {
        alert("Debe haber al menos un indicador en el informe.");
        return;
      }
      showConfirmDialog(
        "Eliminar indicador",
        "¿Está seguro de eliminar este indicador del informe?",
        () => {
          fields.splice(Number(button.dataset.removeField), 1);
          saveState();
          renderFieldCatalog();
          renderForm();
          renderSummary();
        }
      );
    });
  });
}

function refreshSelectors() {
  reportOptions($("#reportSelect"));
  reportOptions($("#summaryReportSelect"));
  reportOptions($("#catalogReportSelect"));
  reportOptions($("#facilityReportTypeSelect"));
  reportOptions($("#monitoringReportSelect"));

  monthOptions($("#monthSelect"));
  monthOptions($("#facilityReportMonthSelect"));

  facilityOptions($("#facilitySelect"));
  facilityOptions($("#facilityReportSelect"));
  facilityOptions($("#deviceDefaultFacility"));

  const savedFacility = localStorage.getItem(deviceFacilityKey);
  if (savedFacility && state.facilities.includes(savedFacility)) {
    $("#deviceDefaultFacility").value = savedFacility;
    $("#facilitySelect").value = savedFacility;
    $("#facilityReportSelect").value = savedFacility;
  }

  $("#yearSelect").value = state.year;

  renderPeriodValues();
  renderForm();
  renderFacilityReport();
  renderMonitoringGrid();
  renderSummary();
  renderCatalogs();
}

// Diálogo de confirmación accesible
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
  const templateFacilities = defaultFacilities;
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
      xCell(cumulative, 8) // CORRECCIÓN: Valor acumulado anual exacto
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
  // \uFEFF asegura compatibilidad UTF-8 completa con tildes y ñ en Excel para Windows
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
  $$(".view").forEach((v) => v.classList.remove("active-view"));
  $$(".nav-button").forEach((b) => b.classList.toggle("active", b.dataset.view === viewName));
  $$(".bottom-nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === viewName));

  const targetView = $(`#${viewName}View`);
  if (targetView) targetView.classList.add("active-view");

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (viewName === "facilityReport") renderFacilityReport();
  if (viewName === "supervisor") {
    renderMonitoringGrid();
    renderSummary();
  }
}

function setRole(role) {
  localStorage.setItem(userRoleKey, role);
  $("#roleBtnTechnician").classList.toggle("active", role === "technician");
  $("#roleBtnSupervisor").classList.toggle("active", role === "supervisor");

  if (role === "technician") {
    switchView("capture");
  } else {
    switchView("supervisor");
  }
}

function bindEvents() {
  // Navegación escritorio y móvil
  $$(".nav-button, .bottom-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  // Selector de roles
  $("#roleBtnTechnician")?.addEventListener("click", () => setRole("technician"));
  $("#roleBtnSupervisor")?.addEventListener("click", () => setRole("supervisor"));

  // Cambio de establecimiento predeterminado en el dispositivo
  $("#deviceDefaultFacility")?.addEventListener("change", (e) => {
    const fac = e.target.value;
    localStorage.setItem(deviceFacilityKey, fac);
    $("#facilitySelect").value = fac;
    $("#facilityReportSelect").value = fac;
    renderForm();
    renderFacilityReport();
  });

  // Filtros de captura
  $("#facilitySelect")?.addEventListener("change", () => {
    renderForm();
    $("#facilityReportSelect").value = $("#facilitySelect").value;
  });
  $("#reportSelect")?.addEventListener("change", () => {
    renderForm();
    $("#facilityReportTypeSelect").value = $("#reportSelect").value;
  });
  $("#monthSelect")?.addEventListener("change", () => {
    renderForm();
    $("#facilityReportMonthSelect").value = $("#monthSelect").value;
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

  // Subnavegación del Supervisor (Semáforo vs Consolidado)
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

  // Cambio de año con auto-sincronización remota
  $("#yearSelect")?.addEventListener("change", async () => {
    state.year = Math.max(2020, Math.min(2035, Number($("#yearSelect").value) || currentYearDefault()));
    saveState();
    renderForm();
    renderFacilityReport();
    renderMonitoringGrid();
    renderSummary();
    if (supabaseReady) {
      await syncFromSupabase();
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
    downloadBlob(JSON.stringify(state, null, 2), `respaldo_salud_ambiental_${state.year}.json`, "application/json");
  });

  $("#importJsonInput")?.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.reports || !parsed.facilities) {
        throw new Error("El archivo no tiene el formato de respaldo esperado.");
      }
      state = parsed;
      saveState();
      refreshSelectors();
      alert("Respaldo restaurado con éxito.");
    } catch (err) {
      alert(`Error al importar: ${err.message}`);
    }
    event.target.value = "";
  });

  // Catálogos
  $("#addFacilityBtn")?.addEventListener("click", () => {
    state.facilities.push(`Establecimiento ${state.facilities.length + 1}`);
    saveState();
    refreshSelectors();
  });

  $("#resetFacilitiesBtn")?.addEventListener("click", () => {
    showConfirmDialog(
      "Restaurar establecimientos",
      "¿Desea restaurar la lista oficial de los 12 establecimientos de Puerto Cortés?",
      () => {
        state.facilities = [...defaultFacilities];
        saveState();
        refreshSelectors();
      }
    );
  });

  $("#catalogReportSelect")?.addEventListener("change", renderFieldCatalog);
  $("#addFieldBtn")?.addEventListener("click", () => {
    const reportId = $("#catalogReportSelect").value || "dengue";
    state.reports[reportId].fields.push(`Indicador ${state.reports[reportId].fields.length + 1}`);
    saveState();
    renderFieldCatalog();
    renderForm();
    renderSummary();
  });

  // Base de datos Supabase
  $("#saveSupabaseConfigBtn")?.addEventListener("click", async () => {
    const config = {
      url: $("#supabaseUrlInput").value.trim(),
      anonKey: $("#supabaseAnonKeyInput").value.trim()
    };
    saveSupabaseConfig(config);
    if (setupSupabase()) {
      await syncFromSupabase();
    }
  });

  $("#syncSupabaseBtn")?.addEventListener("click", syncFromSupabase);
  $("#uploadLocalBtn")?.addEventListener("click", uploadLocalEntries);

  // Monitoreo de conectividad del navegador
  window.addEventListener("online", () => {
    setSupabaseStatus("Conexión restablecida", supabaseReady);
    if (supabaseReady) syncFromSupabase();
  });

  window.addEventListener("offline", () => {
    setSupabaseStatus("Sin conexión a internet (Modo local)", false);
  });
}

// =====================================================================
// INICIALIZACIÓN
// =====================================================================
async function init() {
  bindEvents();
  refreshSelectors();

  // Restaurar rol activo si existe
  const savedRole = localStorage.getItem(userRoleKey) || "technician";
  setRole(savedRole);

  if (setupSupabase()) {
    await syncFromSupabase();
  }
}

void init();

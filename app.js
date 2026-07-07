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
    name: "Dengue",
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
let state = loadState();
let supabaseClient = null;
let supabaseReady = false;

const $ = (selector) => document.querySelector(selector);

function slug(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
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
          description: defaultReports[reportId].description
        };
      });
      return {
        year: parsed.year || 2025,
        facilities: parsed.facilities?.length ? parsed.facilities : defaultFacilities,
        reports,
        entries: parsed.entries || {}
      };
    } catch (error) {
      console.warn("No se pudo leer el respaldo local", error);
    }
  }

  return {
    year: 2025,
    facilities: defaultFacilities,
    reports: defaultReports,
    entries: {}
  };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  const savedState = $("#savedState");
  if (savedState) savedState.textContent = "Guardado";
}

function loadSupabaseConfig() {
  const saved = localStorage.getItem(supabaseConfigKey);
  if (!saved) return { url: "", anonKey: "" };
  try {
    return JSON.parse(saved);
  } catch (error) {
    console.warn("No se pudo leer la configuracion de Supabase", error);
    return { url: "", anonKey: "" };
  }
}

function saveSupabaseConfig(config) {
  localStorage.setItem(supabaseConfigKey, JSON.stringify(config));
}

function setSupabaseStatus(message, isConnected = false) {
  const status = $("#supabaseStatus");
  if (!status) return;
  status.textContent = message;
  status.className = isConnected ? "db-status connected" : "db-status";
}

function setupSupabase() {
  const config = loadSupabaseConfig();
  const urlInput = $("#supabaseUrlInput");
  const keyInput = $("#supabaseAnonKeyInput");
  if (urlInput) urlInput.value = config.url || "";
  if (keyInput) keyInput.value = config.anonKey || "";

  if (!config.url || !config.anonKey) {
    supabaseReady = false;
    setSupabaseStatus("Sin conectar");
    return false;
  }

  if (!window.supabase?.createClient) {
    supabaseReady = false;
    setSupabaseStatus("No se pudo cargar la libreria de Supabase");
    return false;
  }

  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  supabaseReady = true;
  setSupabaseStatus("Conectado a Supabase", true);
  return true;
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
  records.forEach((record) => {
    const monthIndex = Number(record.month) - 1;
    const key = entryKey(record.report_id, record.year, monthIndex, record.facility_name);
    state.entries[key] = record.values || {};
  });
  saveState();
}

async function syncFromSupabase() {
  if (!supabaseReady || !supabaseClient) {
    setSupabaseStatus("Configure Supabase primero");
    return;
  }
  setSupabaseStatus("Sincronizando...");
  const { data, error } = await supabaseClient
    .from("monthly_entries")
    .select("report_id, year, month, facility_name, values")
    .eq("year", state.year);

  if (error) {
    setSupabaseStatus(`Error al sincronizar: ${error.message}`);
    return;
  }

  applyRemoteRecords(data || []);
  refreshSelectors();
  setSupabaseStatus(`Sincronizado: ${(data || []).length} registros`, true);
}

async function upsertEntryRemote(reportId, monthIndex, facility, values) {
  if (!supabaseReady || !supabaseClient) return;
  const record = entryRecord(reportId, state.year, monthIndex, facility, values);
  const { error } = await supabaseClient
    .from("monthly_entries")
    .upsert(record, { onConflict: "report_id,year,month,facility_slug" });

  if (error) {
    setSupabaseStatus(`Error al guardar: ${error.message}`);
    return;
  }
  setSupabaseStatus("Guardado en Supabase", true);
}

async function deleteEntryRemote(reportId, monthIndex, facility) {
  if (!supabaseReady || !supabaseClient) return;
  const { error } = await supabaseClient
    .from("monthly_entries")
    .delete()
    .eq("report_id", reportId)
    .eq("year", state.year)
    .eq("month", monthIndex + 1)
    .eq("facility_slug", slug(facility));

  if (error) {
    setSupabaseStatus(`Error al limpiar: ${error.message}`);
    return;
  }
  setSupabaseStatus("Registro eliminado en Supabase", true);
}

async function uploadLocalEntries() {
  if (!supabaseReady || !supabaseClient) {
    setSupabaseStatus("Configure Supabase primero");
    return;
  }
  const records = Object.entries(state.entries).map(([key, values]) => {
    const [reportId, year, monthIndex, facilitySlug] = key.split("|");
    const facility = state.facilities.find((item) => slug(item) === facilitySlug) || facilitySlug;
    return entryRecord(reportId, Number(year), Number(monthIndex), facility, values);
  });

  if (!records.length) {
    setSupabaseStatus("No hay datos locales para subir", true);
    return;
  }

  setSupabaseStatus("Subiendo datos locales...");
  const { error } = await supabaseClient
    .from("monthly_entries")
    .upsert(records, { onConflict: "report_id,year,month,facility_slug" });

  if (error) {
    setSupabaseStatus(`Error al subir: ${error.message}`);
    return;
  }
  setSupabaseStatus(`Datos locales subidos: ${records.length}`, true);
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
  void upsertEntryRemote(reportId, monthIndex, facility, values);
}

function reportOptions(select) {
  select.innerHTML = Object.entries(state.reports)
    .map(([id, report]) => `<option value="${id}">${report.name}</option>`)
    .join("");
}

function monthOptions(select) {
  select.innerHTML = months.map((month, index) => `<option value="${index}">${month}</option>`).join("");
}

function facilityOptions(select) {
  select.innerHTML = state.facilities.map((facility) => `<option value="${facility}">${facility}</option>`).join("");
}

function selectedReportId() {
  return $("#reportSelect").value;
}

function selectedMonth() {
  return Number($("#monthSelect").value);
}

function selectedFacility() {
  return $("#facilitySelect").value;
}

function currentFields(reportId) {
  return state.reports[reportId].fields;
}

function renderForm() {
  const reportId = selectedReportId();
  const monthIndex = selectedMonth();
  const facility = selectedFacility();
  const report = state.reports[reportId];
  const entry = getEntry(reportId, monthIndex, facility);

  $("#captureTitle").textContent = `${report.name}: ${facility}`;
  $("#captureSubtitle").textContent = `${months[monthIndex]} ${state.year} · ${report.description}`;

  $("#dynamicForm").innerHTML = report.fields.map((field) => {
    const id = slug(field);
    const value = entry[id] ?? "";
    return `
      <label>
        ${field}
        <input type="number" min="0" step="1" inputmode="numeric" data-field="${id}" value="${value}">
      </label>
    `;
  }).join("");

  $("#dynamicForm").querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      $("#savedState").textContent = "Guardando...";
      const values = { ...getEntry(reportId, monthIndex, facility) };
      values[input.dataset.field] = Number(input.value || 0);
      setEntry(reportId, monthIndex, facility, values);
      renderMonthStats();
      renderSummary();
    });
  });

  renderMonthStats();
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
  const totals = sumFor(reportId, [selectedMonth()]);
  const fields = currentFields(reportId).slice(0, 6);

  $("#monthStats").innerHTML = fields.map((field) => {
    const value = totals[slug(field)] || 0;
    return `<div class="stat"><span>${field}</span><strong>${value.toLocaleString("es-HN")}</strong></div>`;
  }).join("");
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
    return `<div class="stat"><span>${field}</span><strong>${value.toLocaleString("es-HN")}</strong></div>`;
  }).join("");

  const head = ["Establecimiento", ...fields, "Total indicadores"];
  const rows = state.facilities.map((facility) => {
    const totals = sumFor(reportId, monthsInPeriod, facility);
    const values = fields.map((field) => totals[slug(field)] || 0);
    return [facility, ...values, values.reduce((sum, value) => sum + value, 0)];
  });
  const municipalRow = [
    "Total municipio",
    ...fields.map((field) => municipalTotals[slug(field)] || 0),
    Object.values(municipalTotals).reduce((sum, value) => sum + value, 0)
  ];

  $("#summaryTable").innerHTML = `
    <thead><tr>${head.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map((row) => `<tr>${row.map((cell, index) => `<td>${index === 0 ? cell : Number(cell).toLocaleString("es-HN")}</td>`).join("")}</tr>`).join("")}
      <tr>${municipalRow.map((cell, index) => `<th>${index === 0 ? cell : Number(cell).toLocaleString("es-HN")}</th>`).join("")}</tr>
    </tbody>
  `;
}

function renderCatalogs() {
  $("#facilityList").innerHTML = state.facilities.map((facility, index) => `
    <div class="editable-row">
      <input value="${facility}" data-index="${index}" aria-label="Establecimiento ${index + 1}">
      <button class="danger" data-remove-facility="${index}" title="Eliminar">×</button>
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
      if (state.facilities.length <= 1) return;
      state.facilities.splice(Number(button.dataset.removeFacility), 1);
      saveState();
      refreshSelectors();
    });
  });

  renderFieldCatalog();
}

function renderFieldCatalog() {
  const reportId = $("#catalogReportSelect").value;
  const fields = currentFields(reportId);
  $("#fieldList").innerHTML = fields.map((field, index) => `
    <div class="editable-row">
      <input value="${field}" data-index="${index}" aria-label="Indicador ${index + 1}">
      <button class="danger" data-remove-field="${index}" title="Eliminar">×</button>
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
      if (fields.length <= 1) return;
      fields.splice(Number(button.dataset.removeField), 1);
      saveState();
      renderFieldCatalog();
      renderForm();
      renderSummary();
    });
  });
}

function refreshSelectors() {
  reportOptions($("#reportSelect"));
  reportOptions($("#summaryReportSelect"));
  reportOptions($("#catalogReportSelect"));
  monthOptions($("#monthSelect"));
  facilityOptions($("#facilitySelect"));
  $("#yearSelect").value = state.year;
  renderPeriodValues();
  renderForm();
  renderSummary();
  renderCatalogs();
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
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

function cell(value, styleId = "", type = null) {
  const isNumber = type === "Number" || (type == null && typeof value === "number");
  const dataType = isNumber ? "Number" : "String";
  const style = styleId ? ` ss:StyleID="${styleId}"` : "";
  return `<Cell${style}><Data ss:Type="${dataType}">${xmlEscape(value)}</Data></Cell>`;
}

function blankCell(styleId = "") {
  const style = styleId ? ` ss:StyleID="${styleId}"` : "";
  return `<Cell${style}/>`;
}

function row(cells, height = null) {
  const rowHeight = height ? ` ss:Height="${height}"` : "";
  return `<Row${rowHeight}>${cells.join("")}</Row>`;
}

function worksheet(name, rows, columnWidths = []) {
  const columns = columnWidths.map((width) => `<Column ss:Width="${width}"/>`).join("");
  return `
    <Worksheet ss:Name="${xmlEscape(name.slice(0, 31))}">
      <Table>
        ${columns}
        ${rows.join("")}
      </Table>
    </Worksheet>
  `;
}

function workbookXml(sheets) {
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="10"/>
    </Style>
    <Style ss:ID="Title">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="13" ss:Bold="1"/>
    </Style>
    <Style ss:ID="Subtitle">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1"/>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
      <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1"/>
      <Interior ss:Color="#DDEFE7" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Group">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
      <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1"/>
      <Interior ss:Color="#C9E4F2" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Text">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="Number">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
    <Style ss:ID="Integer">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
      <NumberFormat ss:Format="#,##0"/>
    </Style>
    <Style ss:ID="Total">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
      <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/>
      <Interior ss:Color="#EAF4EF" ss:Pattern="Solid"/>
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
  </Styles>
  ${sheets.join("")}
</Workbook>`;
}

function mergedTitle(text, columns, styleId = "Title") {
  return row([`<Cell ss:MergeAcross="${columns - 1}" ss:StyleID="${styleId}"><Data ss:Type="String">${xmlEscape(text)}</Data></Cell>`]);
}

function groupedHeader(label, span) {
  return `<Cell ss:MergeAcross="${span - 1}" ss:StyleID="Group"><Data ss:Type="String">${xmlEscape(label)}</Data></Cell>`;
}

function currentExportContext() {
  const reportId = $("#summaryReportSelect").value || selectedReportId();
  const type = $("#periodTypeSelect").value;
  const value = $("#periodValueSelect").value;
  const monthsInPeriod = periodMonths(type, value);
  return { reportId, type, value, monthsInPeriod };
}

function finalPeriodMonth(monthIndexes) {
  return Math.max(...monthIndexes);
}

function monthRangeLabel(monthIndexes) {
  if (monthIndexes.length === 1) return months[monthIndexes[0]];
  return `${months[monthIndexes[0]]} a ${months[monthIndexes.length - 1]}`;
}

function dengueRow(label, index, totals, style = "Integer") {
  const inspectedHomes = totals.viviendas_inspeccionadas || 0;
  const positiveHomes = totals.viviendas_positivas || 0;
  const inspectedContainers = totals.depositos_inspeccionados || 0;
  const positiveContainers = totals.depositos_positivos || 0;
  const values = [
    index,
    label,
    inspectedHomes,
    positiveHomes,
    percent(positiveHomes, inspectedHomes),
    totals.viviendas_abatizadas || 0,
    totals.viviendas_nebulizadas || 0,
    totals.criaderos_eliminados || 0,
    inspectedContainers,
    positiveContainers,
    totals.depositos_negativos || 0,
    totals.depositos_eliminados || 0,
    percent(positiveContainers, inspectedHomes),
    percent(positiveContainers, inspectedContainers),
    totals.ovitrampas_existentes || 0,
    totals.ovitrampas_inspeccionadas || 0,
    totals.ovitrampas_positivas || 0,
    totals.sitios_de_riesgo_existentes || 0,
    totals.sitios_de_riesgo_inspeccionados || 0,
    totals.sitios_de_riesgo_positivos || 0,
    totals.bti_becto_vac_gramos || 0,
    totals.deltametrina_litros || 0,
    totals.aquareslin_litros || 0,
    totals.solfac_litros || 0,
    totals.operativos_programados || 0,
    totals.operativos_ejecutados || 0,
    totals.agi || 0
  ];

  return row(values.map((value, position) => {
    if (position === 1) return cell(value, style === "Total" ? "Text" : "Text");
    return cell(value, style, "Number");
  }));
}

function buildDengueSheet(monthIndexes) {
  const colCount = 27;
  const rows = [
    mergedTitle("SECRETARIA DE SALUD HONDURAS", colCount),
    mergedTitle("INFORME MENSUAL DE ACTIVIDADES DE PREVENCION CONTROL Y VIGILANCIA DE DENGUE", colCount),
    mergedTitle("PROGRAMA NACIONAL DE DENGUE", colCount),
    mergedTitle("Region Departamental de Cortes No 5", colCount, "Subtitle"),
    row([cell("SEMANA EPIDEMIOLOGICA", "Header"), cell("MES", "Header"), cell(monthRangeLabel(monthIndexes).toUpperCase(), "Text"), cell("AÑO", "Header"), cell(state.year, "Integer", "Number"), cell("RISS PUERTO CORTES", "Header")]),
    row([
      blankCell("Group"),
      blankCell("Group"),
      groupedHeader("Viviendas", 6),
      groupedHeader("Depositos", 6),
      groupedHeader("Ovitrampas", 3),
      groupedHeader("Sitios de Riesgo", 3),
      groupedHeader("Consumo", 4),
      groupedHeader("Operativos", 3)
    ]),
    row([
      cell("No.", "Header"), cell("COMUNIDAD", "Header"),
      cell("Inspeccionadas", "Header"), cell("Positivas", "Header"), cell("In. Vivienda %", "Header"),
      cell("Abatizadas", "Header"), cell("Nebulizadas", "Header"), cell("Criaderos Eliminados", "Header"),
      cell("Total Inspeccionados", "Header"), cell("Positivos", "Header"), cell("Negativos", "Header"),
      cell("Eliminados", "Header"), cell("In. Bretau %", "Header"), cell("In. De Recipientes", "Header"),
      cell("Existentes", "Header"), cell("Inspeccionadas", "Header"), cell("Positivas", "Header"),
      cell("Existentes", "Header"), cell("Inspeccionadas", "Header"), cell("Positivos", "Header"),
      cell("Becto Vac Gramos", "Header"), cell("Deltametrina litro", "Header"),
      cell("AquaReslin litro", "Header"), cell("Solfac litro", "Header"),
      cell("Programados", "Header"), cell("Ejecutados", "Header"), cell("AGI", "Header")
    ], 34)
  ];

  state.facilities.forEach((facility, index) => {
    rows.push(dengueRow(facility, index + 1, sumFor("dengue", monthIndexes, facility)));
  });

  rows.push(dengueRow("TOTAL MUNICIPIO", "", sumFor("dengue", monthIndexes), "Total"));
  return worksheet("DENGUE", rows, [36, 150, ...Array(25).fill(76)]);
}

function buildActivitiesSheet(monthIndexes) {
  const reportId = "actividades";
  const fields = currentFields(reportId);
  const cumulativeMonths = months.slice(0, finalPeriodMonth(monthIndexes) + 1).map((_, index) => index);
  const colCount = state.facilities.length + 4;
  const rows = [
    mergedTitle("SECRETARIA DE SALUD", colCount),
    mergedTitle("REGION DEPARTAMENTAL DE CORTES", colCount),
    mergedTitle("UNIDAD DE RIESGOS AMBIENTALES", colCount),
    mergedTitle("COORDINACION DE SALUD PUERTO CORTES", colCount, "Subtitle"),
    mergedTitle(`INFORME: ${monthRangeLabel(monthIndexes).toUpperCase()} ${state.year}`, colCount, "Subtitle"),
    row([
      cell("No", "Header"), cell("ACTIVIDADES", "Header"),
      ...state.facilities.map((facility) => cell(facility, "Header")),
      cell("Total Municipio", "Header"), cell("Total Acumulado", "Header")
    ], 34)
  ];

  fields.forEach((field, index) => {
    const fieldId = slug(field);
    const facilityValues = state.facilities.map((facility) => sumFor(reportId, monthIndexes, facility)[fieldId] || 0);
    const municipal = facilityValues.reduce((sum, value) => sum + value, 0);
    const cumulative = state.facilities.reduce((sum, facility) => {
      return sum + (sumFor(reportId, cumulativeMonths, facility)[fieldId] || 0);
    }, 0);
    rows.push(row([
      cell(index + 1, "Integer", "Number"),
      cell(field, "Text"),
      ...facilityValues.map((value) => cell(value, "Integer", "Number")),
      cell(municipal, "Total", "Number"),
      cell(cumulative, "Total", "Number")
    ]));
  });

  return worksheet("ACTIVIDADES", rows, [36, 260, ...Array(state.facilities.length).fill(82), 90, 96]);
}

function buildRabiaSheet(monthIndexes) {
  const reportId = "rabia";
  const fields = currentFields(reportId);
  const colCount = state.facilities.length + 3;
  const rows = [
    mergedTitle("SECRETARIA DE SALUD HONDURAS", colCount),
    mergedTitle("INFORME MENSUAL DE RABIA", colCount),
    mergedTitle("REGION DEPARTAMENTAL DE CORTES - PUERTO CORTES", colCount, "Subtitle"),
    mergedTitle(`${monthRangeLabel(monthIndexes).toUpperCase()} ${state.year}`, colCount, "Subtitle"),
    row([
      cell("No", "Header"), cell("Actividad / Indicador", "Header"),
      ...state.facilities.map((facility) => cell(facility, "Header")),
      cell("Total Municipio", "Header")
    ], 34)
  ];

  fields.forEach((field, index) => {
    const fieldId = slug(field);
    const facilityValues = state.facilities.map((facility) => sumFor(reportId, monthIndexes, facility)[fieldId] || 0);
    const municipal = facilityValues.reduce((sum, value) => sum + value, 0);
    rows.push(row([
      cell(index + 1, "Integer", "Number"),
      cell(field, "Text"),
      ...facilityValues.map((value) => cell(value, "Integer", "Number")),
      cell(municipal, "Total", "Number")
    ]));
  });

  return worksheet("RABIA", rows, [36, 230, ...Array(state.facilities.length).fill(82), 96]);
}

function buildGenericSummarySheet(reportId, monthIndexes) {
  const fields = currentFields(reportId);
  const report = state.reports[reportId];
  const rows = [
    mergedTitle(`CONSOLIDADO MUNICIPAL - ${report.name.toUpperCase()}`, fields.length + 2),
    mergedTitle(`${monthRangeLabel(monthIndexes).toUpperCase()} ${state.year}`, fields.length + 2, "Subtitle"),
    row([cell("Establecimiento", "Header"), ...fields.map((field) => cell(field, "Header")), cell("Total indicadores", "Header")], 34)
  ];

  state.facilities.forEach((facility) => {
    const totals = sumFor(reportId, monthIndexes, facility);
    const values = fields.map((field) => totals[slug(field)] || 0);
    rows.push(row([
      cell(facility, "Text"),
      ...values.map((value) => cell(value, "Integer", "Number")),
      cell(values.reduce((sum, value) => sum + value, 0), "Total", "Number")
    ]));
  });

  const municipal = sumFor(reportId, monthIndexes);
  const municipalValues = fields.map((field) => municipal[slug(field)] || 0);
  rows.push(row([
    cell("TOTAL MUNICIPIO", "Text"),
    ...municipalValues.map((value) => cell(value, "Total", "Number")),
    cell(municipalValues.reduce((sum, value) => sum + value, 0), "Total", "Number")
  ]));

  return worksheet("CONSOLIDADO", rows, [150, ...Array(fields.length).fill(95), 110]);
}

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
      xFormula(`SUM(C${rowNumber}:N${rowNumber})`, cumulative, 8)
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

function exportSpecificXlsx(reportId) {
  const { monthsInPeriod } = currentExportContext();
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
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadBlob(csv, `consolidado_${reportId}_${state.year}.csv`, "text/csv;charset=utf-8");
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-button").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("active-view"));
      button.classList.add("active");
      $(`#${button.dataset.view}View`).classList.add("active-view");
      $("#viewTitle").textContent = button.dataset.view === "capture"
        ? "Captura mensual por establecimiento"
        : button.dataset.view === "summary"
          ? "Consolidado municipal"
          : "Catálogos y configuración";
    });
  });

  ["#reportSelect", "#monthSelect", "#facilitySelect"].forEach((selector) => {
    $(selector).addEventListener("change", renderForm);
  });

  $("#summaryReportSelect").addEventListener("change", renderSummary);
  $("#periodTypeSelect").addEventListener("change", () => {
    renderPeriodValues();
    renderSummary();
  });
  $("#periodValueSelect").addEventListener("change", renderSummary);

  $("#yearSelect").addEventListener("change", () => {
    state.year = Number($("#yearSelect").value || 2025);
    saveState();
    renderForm();
    renderSummary();
  });

  $("#clearMonthBtn").addEventListener("click", () => {
    const reportId = selectedReportId();
    const monthIndex = selectedMonth();
    const facility = selectedFacility();
    const key = entryKey(reportId, state.year, monthIndex, facility);
    delete state.entries[key];
    saveState();
    void deleteEntryRemote(reportId, monthIndex, facility);
    renderForm();
    renderSummary();
  });

  $("#exportDengueXlsxBtn").addEventListener("click", () => exportSpecificXlsx("dengue"));
  $("#exportActivitiesXlsxBtn").addEventListener("click", () => exportSpecificXlsx("actividades"));
  $("#exportRabiaXlsxBtn").addEventListener("click", () => exportSpecificXlsx("rabia"));
  $("#exportCsvBtn").addEventListener("click", exportCsv);
  $("#exportJsonBtn").addEventListener("click", () => {
    downloadBlob(JSON.stringify(state, null, 2), `respaldo_salud_ambiental_${state.year}.json`, "application/json");
  });

  $("#importJsonInput").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    state = JSON.parse(await file.text());
    saveState();
    refreshSelectors();
    event.target.value = "";
  });

  $("#addFacilityBtn").addEventListener("click", () => {
    state.facilities.push(`Establecimiento ${state.facilities.length + 1}`);
    saveState();
    refreshSelectors();
  });

  $("#resetFacilitiesBtn").addEventListener("click", () => {
    state.facilities = [...defaultFacilities];
    saveState();
    refreshSelectors();
  });

  $("#catalogReportSelect").addEventListener("change", renderFieldCatalog);
  $("#addFieldBtn").addEventListener("click", () => {
    const reportId = $("#catalogReportSelect").value;
    state.reports[reportId].fields.push(`Indicador ${state.reports[reportId].fields.length + 1}`);
    saveState();
    renderFieldCatalog();
    renderForm();
    renderSummary();
  });

  $("#saveSupabaseConfigBtn").addEventListener("click", async () => {
    const config = {
      url: $("#supabaseUrlInput").value.trim(),
      anonKey: $("#supabaseAnonKeyInput").value.trim()
    };
    saveSupabaseConfig(config);
    if (setupSupabase()) {
      await syncFromSupabase();
    }
  });

  $("#syncSupabaseBtn").addEventListener("click", syncFromSupabase);
  $("#uploadLocalBtn").addEventListener("click", uploadLocalEntries);
}

async function init() {
  bindEvents();
  refreshSelectors();
  if (setupSupabase()) {
    await syncFromSupabase();
  }
}

void init();

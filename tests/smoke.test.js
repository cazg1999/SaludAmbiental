const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = read("app.js");
const html = read("index.html");
const css = read("styles.css");
const readme = read("README.md");
const serviceWorker = read("sw.js");
const schema = read("supabase/schema.sql");
const manageUsers = read("supabase/functions/manage-users/index.ts");
const supabaseConfig = read("supabase/config.toml");

function bootApp(storageEntries = []) {
  const storage = new Map(storageEntries);
  const context = vm.createContext({
    console,
    crypto: webcrypto,
    navigator: { onLine: true },
    location: { protocol: "file:" },
    document: {
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      visibilityState: "visible"
    },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key)
    },
    window: {
      addEventListener: () => {},
      scrollTo: () => {}
    },
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    Blob,
    URL,
    alert: () => {},
    confirm: () => false
  });
  context.globalThis = context;
  vm.runInContext(app, context, { filename: "app.js" });
  return { context, storage };
}

test("all static ID selectors used by app.js exist in index.html", () => {
  const htmlIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
  const referencedIds = new Set([...app.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g)].map((match) => match[1]));
  const missing = [...referencedIds].filter((id) => !htmlIds.has(id));
  assert.deepEqual(missing, []);
});

test("login is wired to Supabase Auth and no obsolete role controls remain", () => {
  assert.match(app, /signInWithPassword/);
  assert.match(app, /from\("profiles"\)/);
  assert.match(app, /allowedViewsByRole/);
  assert.doesNotMatch(app, /roleBtnTechnician|roleBtnSupervisor|userRoleKey/);
  assert.match(html, /id="loginForm"/);
  assert.match(html, /id="appContainer"[^>]*display:\s*none/);
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /script-src[^;]*'unsafe-inline'/);
});

test("role matrix matches the product requirements", () => {
  assert.match(app, /admin:\s*\["logbook", "capture", "facilityReport", "supervisor", "catalogs"\]/);
  assert.match(app, /supervisor:\s*\["logbook", "capture", "facilityReport", "supervisor"\]/);
  assert.match(app, /technician:\s*\["logbook", "capture", "facilityReport"\]/);
});

test("admin user management is server-side and keeps email out of the login UI", () => {
  assert.match(html, /id="userCreateForm"/);
  assert.match(html, /id="managedUserList"/);
  assert.match(app, /functions\.invoke\("manage-users"/);
  assert.match(app, /loginEmailForUsername/);
  assert.match(manageUsers, /salud_ambiental_managed/);
  assert.match(manageUsers, /auth\.admin\.createUser/);
  assert.match(manageUsers, /auth\.admin\.updateUserById/);
  assert.match(manageUsers, /callerRole !== "admin"/);
  assert.match(manageUsers, /"Autenticación requerida\."\s*},\s*401/);
  assert.equal((manageUsers.match(/managedPasswordPattern\.test\(password\)/g) || []).length, 2);
  assert.match(html, /id="newUserPassword"[^>]*minlength="6"[^>]*maxlength="16"[^>]*pattern="\(\?=\.\*\[A-Za-z\]\)\(\?=\.\*\[0-9\]\)\[A-Za-z0-9\]\{6,16\}"/);
  assert.match(html, /id="managedUserNewPassword"[^>]*minlength="6"[^>]*maxlength="16"[^>]*pattern="\(\?=\.\*\[A-Za-z\]\)\(\?=\.\*\[0-9\]\)\[A-Za-z0-9\]\{6,16\}"/);
  assert.match(supabaseConfig, /minimum_password_length\s*=\s*6/);
  assert.match(supabaseConfig, /password_requirements\s*=\s*"letters_digits"/);
  assert.doesNotMatch(`${app}\n${html}`, /SUPABASE_SERVICE_ROLE_KEY/);
  const { context } = bootApp();
  assert.equal(vm.runInContext('loginEmailForUsername("tecnico2")', context), "tecnico2@saludambiental.local");
  assert.equal(vm.runInContext('isManagedPasswordValid("abc123")', context), true);
  assert.equal(vm.runInContext('isManagedPasswordValid("abcdef")', context), false);
  assert.equal(vm.runInContext('isManagedPasswordValid("123456")', context), false);
  assert.equal(vm.runInContext('isManagedPasswordValid("abc12-")', context), false);
  assert.equal(vm.runInContext('isManagedPasswordValid("ab12")', context), false);
  assert.equal(vm.runInContext('isManagedPasswordValid("abcdefghijklmnop1")', context), false);
});

test("database access is authenticated and anonymous CRUD policies are absent", () => {
  assert.ok(
    app.indexOf("const localSaved = localStorage.getItem(supabaseConfigKey)")
      < app.indexOf('typeof DEFAULT_SUPABASE_CONFIG !== "undefined"')
  );
  assert.match(schema, /alter table public\.profiles enable row level security/i);
  assert.match(schema, /revoke all on table[\s\S]*from anon/i);
  assert.doesNotMatch(schema, /create policy[^;]+to anon/is);
  assert.match(schema, /public\.is_active_app_user\(\)/);
});

test("writes use optimistic concurrency and explicit tombstones", () => {
  assert.match(schema, /deleted_at timestamptz/i);
  assert.match(app, /\.eq\("updated_at", baseUpdatedAt\)/);
  assert.match(app, /SYNC_CONFLICT/);
  assert.match(app, /\.update\(\{ deleted_at:/);
  assert.doesNotMatch(app, /\.from\("monthly_entries"\)[\s\S]{0,120}\.delete\(\)/);
  assert.doesNotMatch(app, /\.from\("daily_logs"\)[\s\S]{0,120}\.delete\(\)/);
  assert.doesNotMatch(schema, /create policy "monthly_entries_authenticated_delete"/i);
  assert.doesNotMatch(schema, /create policy "daily_logs_authenticated_delete"/i);
});

test("offline state and queues are isolated by authenticated user", () => {
  assert.match(app, /userStoragePrefix/);
  assert.match(app, /userStateKey\(session\.user\.id\)|activateUserState\(session\.user\.id/);
  assert.match(app, /state\.pendingOperations = \[\]/);
  assert.match(app, /id: createUuid\(\),\s*\n\s*entity: operation\.entity/);
  assert.doesNotMatch(app, /normalized\.id = state\.pendingOperations\[index\]\.id/);
  assert.match(app, /queueRevision > revisionAtStart/);
  assert.match(app, /sessionGeneration === context\.generation/);
  assert.match(app, /assertCurrentSyncContext\(syncContext\)/);
});

test("cross-year logbook consolidation uses the log year", () => {
  assert.match(app, /function getEntry\(reportId, monthIndex, facility, year = state\.year\)/);
  assert.match(app, /function setEntry\(reportId, monthIndex, facility, values, year = state\.year, source = "manual"\)/);
  assert.match(app, /getEntry\(repId, monthIndex, facility, year\)/);
  assert.match(app, /setEntry\(repId, monthIndex, facility, currentEntry, year, "logbook"\)/);
});

test("other vaccinated animals feed the vaccinated-animal total", () => {
  assert.match(html, /id="act_otros_animales_vacunados"/);
  assert.match(app, /otros_animales_vacunados:\s*\[\s*\{ reportId: "actividades", fieldSlug: "vacunacion_canina_y_felina", isVaccinatedAnimalTotal: true \}/);
  assert.match(app, /Total de animales vacunados/);
  const { context } = bootApp();
  assert.equal(vm.runInContext("totalVaccinatedAnimals({ caninos_vacunados: 2, felinos_vacunados: 3, otros_animales_vacunados: 4 })", context), 9);
  assert.equal(vm.runInContext("totalVaccinatedAnimals({ caninos_vacunados: 2, felinos_vacunados: 3 })", context), 5);
  vm.runInContext(`
    state.entries = {};
    state.entryMeta = {};
    state.pendingOperations = [];
    state.dailyLogs = [{
      facility: "Cornelio Moncada",
      year: 2026,
      month: 0,
      values: { caninos_vacunados: 2, felinos_vacunados: 3, otros_animales_vacunados: 4 }
    }];
    syncLogbookToMonthlyReports("Cornelio Moncada", 2026, 0);
  `, context);
  assert.equal(vm.runInContext('getEntry("actividades", 0, "Cornelio Moncada", 2026).vacunacion_canina_y_felina', context), 9);
  vm.runInContext(`
    state.dailyLogs[0].values.otros_animales_vacunados = 0;
    syncLogbookToMonthlyReports("Cornelio Moncada", 2026, 0);
  `, context);
  assert.equal(vm.runInContext('getEntry("actividades", 0, "Cornelio Moncada", 2026).vacunacion_canina_y_felina', context), 5);
});

test("shared catalog is readable by active users and writable only by admin", () => {
  assert.match(schema, /create table if not exists public\.app_catalog/i);
  assert.match(schema, /insert into public\.app_catalog[\s\S]*on conflict \(id\) do nothing/i);
  assert.match(schema, /historical_facilities/);
  assert.match(schema, /where not exists \(\s*select 1 from public\.app_catalog where id = 'main'/i);
  assert.match(schema, /app_catalog_active_users_read/);
  assert.match(schema, /app_catalog_admin_insert/);
  assert.match(schema, /app_catalog_admin_update/);
  assert.doesNotMatch(schema, /app_catalog[^\n]*delete/i);
  assert.match(schema, /catalog_item_in_use/);
  assert.match(schema, /create trigger app_catalog_guard_references/i);
  assert.match(schema, /create trigger monthly_entries_guard_catalog/i);
  assert.match(schema, /create trigger daily_logs_guard_catalog/i);
  assert.match(schema, /for share/i);
  assert.doesNotMatch(schema, /jsonb_object_length/);
  assert.match(app, /queueCatalogUpsert/);
  assert.match(app, /baseRevision/);
  assert.match(app, /hasDuplicateSlug/);
  assert.match(app, /executePendingOperationAgainstLatest/);
});

test("daily log IDs and offline writes use the safe queue", () => {
  assert.match(schema, /create table if not exists public\.daily_logs[\s\S]*?id uuid/is);
  assert.match(app, /crypto\?\.randomUUID|crypto\.randomUUID/);
  assert.match(app, /pendingOperations/);
  assert.match(app, /flushPendingOperations/);
  assert.doesNotMatch(app, /log_\$\{Date\.now\(\)\}/);
});

test("a technician daily log is inserted remotely and removed from the local queue", async () => {
  const { context } = bootApp();
  vm.runInContext(`
    remoteWrites = [];
    currentSession = { user: { id: "user-1" } };
    currentProfile = { id: "user-1", role: "technician", active: true };
    state.dailyLogs = [{
      id: "11111111-1111-4111-8111-111111111111",
      facility: "Cornelio Moncada",
      date: "2026-10-02",
      year: 2026,
      month: 9,
      shift: "manana",
      community: "Centro",
      notes: "",
      values: { viviendas_inspeccionadas: 2 },
      created_at: "2026-10-02T12:00:00.000Z",
      updated_at: "2026-10-02T12:00:00.000Z",
      server_updated_at: null
    }];
    state.pendingOperations = [];
    supabaseClient = {
      from(table) {
        return {
          insert(record) {
            remoteWrites.push({ table, record });
            return {
              select() {
                return {
                  single() {
                    return { data: { updated_at: "2026-10-02T12:00:01.000Z" }, error: null };
                  }
                };
              }
            };
          }
        };
      }
    };
    upsertDailyLogRemote(state.dailyLogs[0]);
  `, context);

  const result = await vm.runInContext(`flushPendingOperations(false, {
    generation: sessionGeneration,
    userId: currentSession.user.id,
    storageKey: activeStorageKey
  })`, context);

  assert.equal(result.ok, true);
  assert.equal(vm.runInContext("remoteWrites.length", context), 1);
  assert.equal(vm.runInContext("remoteWrites[0].table", context), "daily_logs");
  assert.equal(vm.runInContext("state.pendingOperations.length", context), 0);
  assert.equal(
    vm.runInContext("state.dailyLogs[0].server_updated_at", context),
    "2026-10-02T12:00:01.000Z"
  );
});

test("active profiles are the shared authorization source for client and RLS", () => {
  assert.match(app, /!profile\.active \|\| profile\.id !== session\.user\.id/);
  assert.match(schema, /where profiles\.id = auth\.uid\(\)\s+and profiles\.active = true/i);
  assert.doesNotMatch(schema.match(/create or replace function public\.current_app_role\(\)[\s\S]*?\$\$;/i)?.[0] || "", /auth\.users|raw_app_meta_data|1999cazg@gmail\.com/);
});

test("logout remains closed until an explicit successful login", () => {
  assert.match(app, /logoutBarrierKey/);
  assert.match(app, /setLogoutBarrier\(true\)[\s\S]{0,240}signOut/);
  assert.match(app, /if \(hasLogoutBarrier\(\)\)[\s\S]{0,160}showLoginScreen\(\)/);
  assert.match(app, /setLogoutBarrier\(false\)[\s\S]{0,100}activateSession/);
});

test("multi-device synchronization pages rows and flushes logs before derived totals", () => {
  assert.match(app, /select\(columns, \{ count: "exact" \}\)/);
  assert.match(app, /\.range\(offset, offset \+ pageSize - 1\)/);
  assert.match(app, /Number\.isInteger\(result\.count\)/);
  assert.match(app, /priority = \{ app_catalog: 0, daily_log: 1, monthly_entry: 2 \}/);
  assert.match(app, /operationTouchesBucket\(conflict, operation\.payload\)/);
  assert.match(app, /affectedBuckets: affectedLogBuckets\(log, previousLog\)/);
  assert.match(app, /record\.facility_slug === slug\(bucket\.facility\)/);
  assert.match(app, /const AUTO_SYNC_INTERVAL_MS = 15000/);
  assert.match(app, /setInterval\(requestAutomaticSync, AUTO_SYNC_INTERVAL_MS\)/);
  assert.match(app, /\.channel\(`salud-ambiental-sync-/);
  assert.match(app, /table: "daily_logs"/);
  assert.match(schema, /alter publication supabase_realtime add table public\.daily_logs/i);
  assert.match(app, /window\.addEventListener\("focus", requestAutomaticSync\)/);
  assert.match(app, /document\.addEventListener\("visibilitychange"/);
  assert.match(app, /upsertDailyLogRemote\(logRecord, previousLog\);[\s\S]{0,1200}const synchronized = await synchronizeWithSupabase\(\);/);
  assert.match(app, /if \(catalogChanged\) \{\s*refreshSelectors\(\);\s*\} else \{\s*renderSynchronizedData\(\);/);
  assert.match(app, /restoreSelectValue\(\$\("#periodValueSelect"\), previousPeriodValue\)/);
});

test("obsolete device-wide facility selector is fully removed", () => {
  assert.doesNotMatch(
    `${app}\n${html}\n${css}\n${readme}`,
    /deviceDefaultFacility|deviceFacilityKey|device-facility-selector|Mi establecimiento asignado/
  );
});

test("manual and logbook writes become mixed while pure logbook rebase preserves remote manual fields", () => {
  const { context } = bootApp();
  vm.runInContext(`
    state = loadState();
    state.pendingOperations = [];
    queueOperation({ entity: "monthly_entry", entityKey: "mixed", payload: { source: "manual" } });
    queueOperation({ entity: "monthly_entry", entityKey: "mixed", payload: { source: "logbook" } });
  `, context);
  assert.equal(vm.runInContext('state.pendingOperations[0].payload.source', context), "mixed");

  vm.runInContext(`
    state = loadState();
    const key = entryKey("dengue", 2026, 0, "Cornelio Moncada");
    state.entries[key] = { manual_field: 1, viviendas_inspeccionadas: 1 };
    state.entryMeta[key] = { server_updated_at: "2026-01-01T00:00:00.000Z" };
    state.dailyLogs = [{
      id: createUuid(), facility: "Cornelio Moncada", year: 2026, month: 0,
      values: { viviendas_inspeccionadas: 2 }
    }];
    state.pendingOperations = [{
      id: createUuid(), entity: "monthly_entry", entityKey: key, action: "upsert",
      payload: { reportId: "dengue", year: 2026, monthIndex: 0,
        facility: "Cornelio Moncada", source: "logbook", baseUpdatedAt: "2026-01-01T00:00:00.000Z" }
    }];
    rebaseLogbookConflicts(state.pendingOperations.slice(), [{
      report_id: "dengue", year: 2026, month: 1, facility_slug: "cornelio_moncada",
      facility_name: "Cornelio Moncada", values: { manual_field: 9, viviendas_inspeccionadas: 5 },
      updated_at: "2026-01-02T00:00:00.000Z", deleted_at: null
    }]);
  `, context);
  assert.equal(vm.runInContext('state.entries["dengue|2026|0|cornelio_moncada"].manual_field', context), 9);
  assert.equal(vm.runInContext('state.entries["dengue|2026|0|cornelio_moncada"].viviendas_inspeccionadas', context), 2);
});

test("legacy local data stays visibly pending until explicit upload succeeds", () => {
  assert.match(app, /localOnlyMigrationPending: true/);
  assert.match(app, /Datos locales pendientes de subir/);
  assert.match(app, /state\.localOnlyMigrationPending = false/);
});

test("invalid catalog removals are discarded instead of retried forever", async () => {
  const { context } = bootApp();
  vm.runInContext(`
    supabaseClient = {
      from(table) {
        return {
          update(payload) {
            return {
              eq() { return this; },
              select() { return this; },
              maybeSingle() {
                return { error: { code: "23503", message: "No se puede retirar un establecimiento con datos históricos" } };
              }
            };
          }
        };
      }
    };
    currentSession = { user: { id: "user-1" } };
    currentProfile = { role: "admin" };
    navigator.onLine = true;
    state.pendingOperations = [{
      id: "catalog-op",
      entity: "app_catalog",
      entityKey: "main",
      action: "upsert",
      payload: { facilities: ["A"], report_fields: { dengue: ["campo1"] }, baseRevision: 1 }
    }];
  `, context);
  const result = await vm.runInContext(`(async () => {
    return await flushPendingOperations(false, {
      generation: sessionGeneration,
      userId: currentSession.user.id,
      storageKey: activeStorageKey
    });
  })()`, context);
  assert.equal(result.ok, false);
  assert.equal(vm.runInContext('state.pendingOperations.length', context), 0);
  assert.equal(vm.runInContext('state.catalogMeta.local_only', context), false);
});

test("PWA assets referenced by the document exist", () => {
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(html, /@supabase\/supabase-js@\d+\.\d+\.\d+/);
  assert.match(html, /integrity="sha384-/);
  assert.equal(fs.existsSync(path.join(root, "manifest.webmanifest")), true);
  assert.equal(fs.existsSync(path.join(root, "sw.js")), true);
  assert.equal(fs.existsSync(path.join(root, "icon.svg")), true);
  assert.match(html, /styles\.css\?v=14/);
  assert.match(html, /config\.js\?v=14/);
  assert.match(html, /app\.js\?v=14/);
  assert.match(app, /register\("\.\/sw\.js\?v=14", \{ updateViaCache: "none" \}\)/);
  assert.match(serviceWorker, /salud-ambiental-v14/);
  assert.match(serviceWorker, /\.\/app\.js\?v=14/);
});

test("app boots fail-closed without Supabase configuration", () => {
  const { context } = bootApp();
  assert.equal(vm.runInContext('normalizeUsername("Técnico")', context), "tecnico");
  assert.equal(vm.runInContext("supabaseReady", context), false);
});

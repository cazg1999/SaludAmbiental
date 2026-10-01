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
      querySelectorAll: () => []
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
  assert.match(schema, /salud_ambiental_managed/);
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

test("shared catalog is readable by active users and writable only by admin", () => {
  assert.match(schema, /create table if not exists public\.app_catalog/i);
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

test("PWA assets referenced by the document exist", () => {
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(html, /@supabase\/supabase-js@\d+\.\d+\.\d+/);
  assert.match(html, /integrity="sha384-/);
  assert.equal(fs.existsSync(path.join(root, "manifest.webmanifest")), true);
  assert.equal(fs.existsSync(path.join(root, "sw.js")), true);
  assert.equal(fs.existsSync(path.join(root, "icon.svg")), true);
});

test("app boots fail-closed without Supabase configuration", () => {
  const { context } = bootApp();
  assert.equal(vm.runInContext('normalizeUsername("Técnico")', context), "tecnico");
  assert.equal(vm.runInContext("supabaseReady", context), false);
});

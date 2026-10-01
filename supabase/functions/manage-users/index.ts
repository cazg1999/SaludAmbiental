import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const managedPasswordPattern = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{6,16}$/;
const managedPasswordError = "La contraseña debe tener de 6 a 16 caracteres, usar solo letras y números e incluir al menos una letra y un número.";

function response(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
  });
}

function normalizeUsername(value: unknown) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function listProfiles(admin: ReturnType<typeof createClient>) {
  const { data, error } = await admin
    .from("profiles")
    .select("id, username, display_name, role, active, created_at")
    .not("username", "like", "pending_%")
    .order("username", { ascending: true });
  if (error) throw error;
  return (data || []).map((profile) => ({
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    role: profile.role,
    active: profile.active,
    createdAt: profile.created_at
  }));
}

async function editableTarget(admin: ReturnType<typeof createClient>, userId: unknown) {
  const id = String(userId || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Usuario inválido.");
  const { data, error } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.role === "admin") throw new Error("La cuenta Administrador no puede modificarse aquí.");
  return data;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ ok: false, error: "Método no permitido." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publicKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("Authorization");
    if (!supabaseUrl || !publicKey || !serviceKey) {
      return response({ ok: false, error: "Configuración del servidor incompleta." }, 500);
    }
    if (!authorization) {
      return response({ ok: false, error: "Autenticación requerida." }, 401);
    }

    const caller = createClient(supabaseUrl, publicKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: callerRole, error: roleError } = await caller.rpc("current_app_role");
    if (roleError || callerRole !== "admin") {
      return response({ ok: false, error: "Solo el Administrador puede gestionar usuarios." }, 403);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "list") {
      return response({ ok: true, users: await listProfiles(admin) });
    }

    if (action === "create") {
      const username = normalizeUsername(body.username);
      const displayName = String(body.displayName || "").trim().slice(0, 80);
      const password = String(body.password || "");
      const role = String(body.role || "");
      if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
        return response({ ok: false, error: "El usuario debe tener de 3 a 32 caracteres, sin espacios. Puede usar letras, números, punto, guion o guion bajo." }, 400);
      }
      if (!displayName) return response({ ok: false, error: "Ingrese el nombre para mostrar." }, 400);
      if (!managedPasswordPattern.test(password)) {
        return response({ ok: false, error: managedPasswordError }, 400);
      }
      if (!['supervisor', 'technician'].includes(role)) {
        return response({ ok: false, error: "Rol inválido." }, 400);
      }

      const { data: existing, error: existingError } = await admin
        .from("profiles")
        .select("id")
        .ilike("username", username)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) return response({ ok: false, error: "Ese nombre de usuario ya existe." }, 409);

      const email = `${username}@saludambiental.local`;
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: {
          salud_ambiental_managed: true,
          salud_ambiental_username: username,
          salud_ambiental_role: role
        }
      });
      if (createError || !created.user) {
        return response({ ok: false, error: createError?.message || "No se pudo crear el usuario." }, 400);
      }

      const { error: profileError } = await admin.from("profiles").upsert({
        id: created.user.id,
        username,
        display_name: displayName,
        role,
        active: true
      }, { onConflict: "id" });
      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id);
        throw profileError;
      }
      return response({ ok: true, users: await listProfiles(admin) }, 201);
    }

    if (action === "set_active") {
      const target = await editableTarget(admin, body.userId);
      if (typeof body.active !== "boolean") return response({ ok: false, error: "Estado inválido." }, 400);
      const { error } = await admin.from("profiles").update({ active: body.active }).eq("id", target.id);
      if (error) throw error;
      return response({ ok: true, users: await listProfiles(admin) });
    }

    if (action === "set_password") {
      const target = await editableTarget(admin, body.userId);
      const password = String(body.password || "");
      if (!managedPasswordPattern.test(password)) {
        return response({ ok: false, error: managedPasswordError }, 400);
      }
      const { error } = await admin.auth.admin.updateUserById(target.id, { password });
      if (error) throw error;
      return response({ ok: true });
    }

    return response({ ok: false, error: "Acción no reconocida." }, 400);
  } catch (error) {
    console.error("manage-users:", error);
    return response({ ok: false, error: "No se pudo completar la administración de usuarios." }, 500);
  }
});

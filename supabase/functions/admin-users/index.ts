// Supabase Edge Function: admin-users
// Creates sign-ins and resets passwords for the SMR HRMS app. Only an active System Administrator
// or HR Director may call it. The service key never leaves the server.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const ROLES = ["System Administrator", "HR Director", "HR Specialist", "Payroll Specialist", "Finance Manager", "Employee"];

function tempPassword(): string {
  const c = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const a = new Uint32Array(10); crypto.getRandomValues(a);
  return Array.from(a, (x) => c[x % c.length]).join("") + "7a";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const caller = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Please sign in again." }, 401);
    const admin = createClient(url, svc);
    const { data: me } = await admin.from("profiles").select("role,active").eq("id", user.id).single();
    if (!me?.active || !["System Administrator", "HR Director"].includes(me.role)) return json({ error: "Only the System Administrator or HR Director can do this." }, 403);

    const b = await req.json();
    if (b.action === "create") {
      const email = String(b.email || "").trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
      if (!ROLES.includes(b.role)) return json({ error: "Choose a role." }, 400);
      if (me.role !== "System Administrator" && b.role === "System Administrator") return json({ error: "Only a System Administrator can create another one." }, 403);
      let empNo: string | null = null, name = String(b.full_name || "").trim();
      if (b.role === "Employee") {
        const { data: s } = await admin.from("app_store").select("v").eq("k", "smr_emp").single();
        const emp = (Array.isArray(s?.v) ? s!.v : []).find((e: any) => e.no === b.emp_no);
        if (!emp) return json({ error: "Choose the employee for this account." }, 400);
        empNo = emp.no; name = emp.name;
      }
      if (!name) name = email.split("@")[0];
      const password = tempPassword();
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name, must_change: true } });
      if (error || !data.user) return json({ error: /already/i.test(error?.message || "") ? "This email already has an account." : (error?.message || "Could not create the account.") }, 400);
      const { error: e2 } = await admin.from("profiles").update({ role: b.role, active: true, emp_no: empNo, full_name: name }).eq("id", data.user.id);
      if (e2) return json({ error: "Account created but the role was not set: " + e2.message }, 500);
      return json({ ok: true, email, password, role: b.role, name });
    }
    if (b.action === "reset") {
      const { data: t } = await admin.from("profiles").select("role").eq("id", b.user_id).single();
      if (!t) return json({ error: "No such user." }, 404);
      if (b.user_id === user.id) return json({ error: "Change your own password from the sign-in page (Forgot password)." }, 400);
      if (me.role !== "System Administrator" && t.role === "System Administrator") return json({ error: "Only a System Administrator can reset that account." }, 403);
      const password = tempPassword();
      const { error } = await admin.auth.admin.updateUserById(b.user_id, { password, user_metadata: { must_change: true } });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, password });
    }
    return json({ error: "Unknown action." }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

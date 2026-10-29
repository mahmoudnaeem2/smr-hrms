// Supabase Edge Function: notify-leave
// Sends the leave emails for the SMR HRMS app.
//   kind "submitted": an employee sent a request  -> email to the approver (line manager, else HR)
//   kind "decided"  : HR approved or rejected it  -> email to the employee
// The function reads the request from the database itself, so a caller cannot make it send text of their choice.
// Mail provider (set as secrets): MS_TENANT_ID + MS_CLIENT_ID + MS_CLIENT_SECRET + MAIL_FROM (Microsoft 365), or RESEND_API_KEY + MAIL_FROM, or SMTP_HOST + SMTP_PORT + SMTP_USER + SMTP_PASS + MAIL_FROM.
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const STAFF = ["System Administrator", "HR Director", "HR Specialist", "Payroll Specialist", "Finance Manager"];

function page(title: string, lines: string[], appUrl: string, button: string) {
  return `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;color:#10233d">
  <div style="background:#0460B5;color:#fff;padding:18px 22px;border-radius:14px 14px 0 0;font-weight:700;font-size:16px">SMR HRMS &amp; Payroll</div>
  <div style="border:1px solid #dfe5ee;border-top:0;border-radius:0 0 14px 14px;padding:22px">
    <h2 style="margin:0 0 12px;font-size:19px">${esc(title)}</h2>
    ${lines.map((l) => `<p style="margin:6px 0;color:#34465f;font-size:14.5px;line-height:1.5">${l}</p>`).join("")}
    <p style="margin:20px 0 4px"><a href="${esc(appUrl)}" style="background:#0460B5;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:600;display:inline-block">${esc(button)}</a></p>
  </div></div>`;
}

async function send(to: string[], subject: string, html: string) {
  const from = Deno.env.get("MAIL_FROM");
  if (!from) throw new Error("mail_not_configured");
  const tid = Deno.env.get("MS_TENANT_ID"), cid = Deno.env.get("MS_CLIENT_ID"), csec = Deno.env.get("MS_CLIENT_SECRET");
  if (tid && cid && csec) {
    // Microsoft 365 via Graph (app-only, Mail.Send). MAIL_FROM = the mailbox to send as, e.g. "SMR HRMS <hr-system@savills.me>".
    const addr = (from.match(/<([^>]+)>/)?.[1] || from).trim();
    const tr = await fetch(`https://login.microsoftonline.com/${tid}/oauth2/v2.0/token`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: cid, client_secret: csec, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }),
    });
    const tj = await tr.json();
    if (!tr.ok) throw new Error("Microsoft sign-in: " + (tj.error_description || tj.error));
    const r = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(addr)}/sendMail`, {
      method: "POST", headers: { Authorization: `Bearer ${tj.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: { subject, body: { contentType: "HTML", content: html }, toRecipients: to.map((a) => ({ emailAddress: { address: a } })) }, saveToSentItems: false }),
    });
    if (!r.ok) throw new Error("Graph: " + (await r.text()));
    return;
  }
  const rk = Deno.env.get("RESEND_API_KEY");
  if (rk) {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${rk}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to, subject, html }) });
    if (!r.ok) throw new Error("Resend: " + (await r.text()));
    return;
  }
  const host = Deno.env.get("SMTP_HOST");
  if (!host) throw new Error("mail_not_configured");
  const port = +(Deno.env.get("SMTP_PORT") || 465);
  const c = new SMTPClient({ connection: { hostname: host, port, tls: port === 465, auth: { username: Deno.env.get("SMTP_USER")!, password: Deno.env.get("SMTP_PASS")! } } });
  try { await c.send({ from, to, subject, content: "Open the SMR HRMS app to see this message.", html }); } finally { await c.close(); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appUrl = Deno.env.get("APP_URL") || "https://mahmoudnaeem2.github.io/smr-hrms/";
    const caller = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Please sign in again." }, 401);
    const admin = createClient(url, svc);
    const { data: me } = await admin.from("profiles").select("role,active,emp_no,full_name").eq("id", user.id).single();
    if (!me?.active) return json({ error: "Account is not active." }, 403);

    const { kind, lr_id } = await req.json();
    const get = async (k: string) => (await admin.from("app_store").select("v").eq("k", k).maybeSingle()).data?.v;
    const lrs: any[] = (await get("smr_lr")) || [], emps: any[] = (await get("smr_emp")) || [];
    const lr = lrs.find((r) => String(r.id) === String(lr_id));
    if (!lr) return json({ error: "Request not found." }, 404);
    const emp = emps.find((e) => e.no === lr.no);
    if (!emp) return json({ error: "Employee not found." }, 404);
    const when = lr.start === lr.end ? lr.start : `${lr.start} to ${lr.end}`;
    const info = [`<b>${esc(emp.name)}</b> · ${esc(lr.type)}`, `${esc(when)} (${esc(lr.days)} working day${lr.days === 1 ? "" : "s"})`];
    if (lr.note) info.push("Note: " + esc(lr.note));

    const emailOf = async (e: any): Promise<string | null> => {
      if (e?.email) return String(e.email);
      const { data } = await admin.from("profiles").select("id").eq("emp_no", e?.no).maybeSingle();
      if (!data) return null;
      const u = await admin.auth.admin.getUserById(data.id);
      return u.data.user?.email || null;
    };
    const dedupe = async (key: string, to: string[]) => {
      const { error } = await admin.from("mail_log").insert({ key, to_addr: to.join(",") });
      return !error;  // already sent when the key exists
    };

    if (kind === "submitted") {
      if (me.emp_no !== lr.no && !STAFF.includes(me.role)) return json({ error: "Not allowed." }, 403);
      if (lr.status !== "Pending") return json({ ok: true, skipped: "not pending" });
      let to: string[] = [];
      const mgrName = emp.lapp || emp.mgr;
      const mgr = mgrName ? emps.find((e) => e.name === mgrName && e.no !== emp.no) : null;
      const m = mgr ? await emailOf(mgr) : null;
      if (m) to = [m];
      else {
        const { data: hr } = await admin.from("profiles").select("id").in("role", ["HR Director", "HR Specialist"]).eq("active", true);
        for (const p of hr || []) { const u = await admin.auth.admin.getUserById(p.id); if (u.data.user?.email) to.push(u.data.user.email); }
      }
      to = [...new Set(to.map((x) => x.toLowerCase()))];
      if (!to.length) return json({ ok: true, skipped: "no recipient" });
      if (!(await dedupe(`lr:${lr.id}:submitted`, to))) return json({ ok: true, skipped: "already sent" });
      await send(to, `Leave request from ${emp.name} needs your decision`, page("A leave request needs your decision", info, appUrl, "Open Approvals"));
      return json({ ok: true, sent: to.length });
    }

    if (kind === "decided") {
      if (!STAFF.includes(me.role)) return json({ error: "Not allowed." }, 403);
      if (!["Approved", "Rejected"].includes(lr.status)) return json({ ok: true, skipped: "not decided" });
      const to = await emailOf(emp);
      if (!to) return json({ ok: true, skipped: "no recipient" });
      if (!(await dedupe(`lr:${lr.id}:${lr.status}`, [to]))) return json({ ok: true, skipped: "already sent" });
      const ok = lr.status === "Approved";
      await send([to], `Your leave request was ${lr.status.toLowerCase()}`, page(ok ? "Your leave request was approved" : "Your leave request was rejected", info, appUrl, "Open My Portal"));
      return json({ ok: true, sent: 1 });
    }
    return json({ error: "Unknown kind." }, 400);
  } catch (e) {
    const m = String((e as Error).message || e);
    return json({ error: m === "mail_not_configured" ? "Email is not set up yet. Add the mail secrets in Supabase." : m }, m === "mail_not_configured" ? 501 : 500);
  }
});

/* SMR HRMS cloud loader.
   If window.SMR_CLOUD = {url, key} is set, the app does not start until the user has signed in with
   Supabase Auth and the saved data has been loaded. Every later save is written back to Supabase.
   If it is not set, the app starts at once and keeps working from this browser only. */
(function () {
  var C = window.SMR_CLOUD || {};
  var src = document.getElementById("smr-app");
  function run() { var s = document.createElement("script"); s.text = src.textContent; document.body.appendChild(s); }
  if (!C.url || !C.key) { run(); return; }

  var URL_ = String(C.url).replace(/\/+$/, ""), KEY = C.key, SK = "smr_sb";
  var ver = {}, last = {}, pend = {}, timer = null, busy = false, status = "saved", retry = 0, stale = false;
  var NOSYNC = /^smr_(mode|gopen|rail|comfort|seed2|seed_pending|sb|staff|acct|users|localbak|cloud_init)$/;
  var syncable = function (k) { return typeof k === "string" && k.indexOf("smr_") === 0 && !NOSYNC.test(k) && !/_sample$/.test(k); };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;

  function css() {
    if ($("cgcss")) return;
    var s = document.createElement("style"); s.id = "cgcss";
    s.textContent = "#cg{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:linear-gradient(160deg,#0460B5,#0a3f78);font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#10233d}" +
      "#cg .cgc{width:100%;max-width:420px;background:#fff;border-radius:20px;padding:30px 28px;box-shadow:0 24px 60px rgba(0,0,0,.28)}" +
      "#cg h1{margin:0 0 4px;font-size:22px;color:#0460B5}#cg p{margin:0 0 16px;color:#52627a;font-size:14.5px;line-height:1.5}" +
      "#cg label{display:block;font-weight:600;font-size:13.5px;margin:12px 0 6px}#cg input{width:100%;box-sizing:border-box;height:46px;padding:0 14px;border:1px solid #cdd7e5;border-radius:12px;font:inherit;font-size:15px;background:#f6f8fc}" +
      "#cg input:focus{outline:0;border-color:#0460B5;box-shadow:0 0 0 3px rgba(4,96,181,.15)}" +
      "#cg button{font:inherit;cursor:pointer}#cg .p{width:100%;margin-top:18px;height:46px;border:0;border-radius:12px;background:#0460B5;color:#fff;font-weight:700;font-size:15px}" +
      "#cg .p:disabled{opacity:.6;cursor:wait}#cg .s{width:100%;margin-top:10px;height:44px;border:1px solid #cdd7e5;border-radius:12px;background:#fff;color:#0460B5;font-weight:600}" +
      "#cg .l{background:none;border:0;color:#0460B5;font-weight:600;padding:8px 0 0;font-size:13.5px}#cg .e{color:#b42318;font-size:13.5px;min-height:18px;margin-top:10px}#cg .m{color:#0b6b3a;font-size:13.5px;margin-top:10px}" +
      "#cst{font-size:12px;margin-top:6px;opacity:.85}#cst.off{color:#ffd166;font-weight:700}";
    document.head.appendChild(s);
  }
  function gate(html) {
    css(); var g = $("cg");
    if (!g) { g = document.createElement("div"); g.id = "cg"; document.body.appendChild(g); }
    g.innerHTML = '<div class="cgc" role="dialog" aria-modal="true">' + html + "</div>";
    var f = g.querySelector("input"); if (f) f.focus();
    return g;
  }
  function closeGate() { var g = $("cg"); if (g) g.remove(); }

  /* ---------- session and requests ---------- */
  function sess() { try { return JSON.parse(localStorage.getItem(SK) || "null"); } catch (e) { return null; } }
  function setSess(t) {
    var s = { access: t.access_token, refresh: t.refresh_token, exp: Date.now() + (t.expires_in || 3600) * 1000 - 60000, uid: t.user && t.user.id, email: t.user && t.user.email };
    rawSet.call(localStorage, SK, JSON.stringify(s)); return s;
  }
  function authCall(path, body, method, bearer) {
    var h = { apikey: KEY, "Content-Type": "application/json" }; if (bearer) h.Authorization = "Bearer " + bearer;
    return fetch(URL_ + "/auth/v1/" + path, { method: method || "POST", headers: h, body: (method === "GET") ? undefined : JSON.stringify(body) }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error_description || j.msg || j.message || j.error || "Request failed");
        return j;
      });
    });
  }
  function token() {
    var s = sess(); if (!s) return Promise.resolve(null);
    if (Date.now() < s.exp) return Promise.resolve(s.access);
    return authCall("token?grant_type=refresh_token", { refresh_token: s.refresh }).then(function (t) { return setSess(t).access; })
      .catch(function (e) { if (/network|fetch|failed to/i.test(e.message)) throw e; rawRemove.call(localStorage, SK); return null; });
  }
  function rest(path, o) {
    o = o || {};
    return token().then(function (t) {
      if (!t) { var er = new Error("auth"); er.auth = 1; throw er; }
      return fetch(URL_ + "/rest/v1/" + path, {
        method: o.method || "GET", keepalive: !!o.keepalive,
        headers: Object.assign({ apikey: KEY, Authorization: "Bearer " + t, "Content-Type": "application/json" }, o.headers || {}),
        body: o.body === undefined ? undefined : JSON.stringify(o.body)
      }).then(function (r) {
        return r.text().then(function (tx) {
          var j = null; try { j = tx ? JSON.parse(tx) : null; } catch (e) { }
          if (!r.ok) { var er = new Error((j && (j.message || j.hint)) || "HTTP " + r.status); er.status = r.status; er.code = j && j.code; throw er; }
          return j;
        });
      });
    });
  }

  /* ---------- status, saving ---------- */
  function setStatus(s) {
    status = s; var el = $("cst");
    if (el) { el.className = s === "saved" ? "" : s === "saving" ? "" : "off"; el.textContent = s === "saved" ? "All changes saved" : s === "saving" ? "Saving…" : s === "offline" ? "Offline. Changes are not saved yet." : s === "stale" ? "Newer data is available. Reload." : s === "conflict" ? "Conflict. Reload." : s; }
    try { window.dispatchEvent(new CustomEvent("smr-cloud-status", { detail: s })); } catch (e) { }
  }
  function canon(v) { return JSON.stringify(v, function (_, x) { if (x && typeof x === "object" && !Array.isArray(x)) { var o = {}; Object.keys(x).sort().forEach(function (q) { o[q] = x[q]; }); return o; } return x; }); }
  function queue(k, val) {
    if (val !== null) { var same = false; try { same = last[k] !== undefined && canon(JSON.parse(val)) === last[k]; } catch (e) { } if (same) { delete pend[k]; if (!Object.keys(pend).length) setStatus("saved"); return; } }
    else if (last[k] === undefined && ver[k] === undefined) { delete pend[k]; return; }
    pend[k] = val; setStatus("saving"); clearTimeout(timer); timer = setTimeout(flush, 700); }
  function conflict() {
    setStatus("conflict"); pend = {};
    var g = gate("<h1>Someone else saved first</h1><p>Another person changed the same records while you were working. Reload to get the latest data, then repeat your last change.</p><button class='p' id='cgr'>Reload latest data</button>");
    g.querySelector("#cgr").onclick = function () { location.reload(); };
  }
  function flush() {
    if (busy) { timer = setTimeout(flush, 400); return; }
    var keys = Object.keys(pend); if (!keys.length) { setStatus("saved"); return; }
    busy = true;
    var k = keys[0], val = pend[k];
    var p = val === null ? rest("rpc/del_store", { method: "POST", body: { p_k: k } }).then(function () { delete ver[k]; delete last[k]; })
      : rest("rpc/put_store", { method: "POST", body: { p_k: k, p_v: JSON.parse(val), p_ver: ver[k] || 0 } }).then(function (n) { ver[k] = n; last[k] = canon(JSON.parse(val)); });
    p.then(function () { if (pend[k] === val) delete pend[k]; busy = false; retry = 0; flush(); })
      .catch(function (e) {
        busy = false;
        if (/version_conflict/.test(e.message) || e.code === "23505" || e.code === "P0001") return conflict();
        if (e.auth || e.status === 401) { setStatus("offline"); return signedOut(); }
        retry++; setStatus("offline"); timer = setTimeout(flush, Math.min(30000, 1500 * retry));
      });
  }
  window.addEventListener("beforeunload", function (e) { if (Object.keys(pend).length) { e.preventDefault(); e.returnValue = ""; } });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") check(); else if (Object.keys(pend).length) flush(); });

  /* detect that someone else saved: compare versions, never merge silently */
  function check() {
    if (stale || busy || Object.keys(pend).length) return;
    rest("app_store?select=k,ver").then(function (rows) {
      var changed = rows.some(function (r) { return syncable(r.k) && (ver[r.k] || 0) !== r.ver; }) || Object.keys(ver).some(function (k) { return !rows.some(function (r) { return r.k === k; }); });
      if (changed) { stale = true; setStatus("stale"); }
    }).catch(function () { });
  }
  setInterval(check, 45000);

  function install() {
    Storage.prototype.setItem = function (k, v) { rawSet.call(this, k, v); if (this === localStorage && syncable(k)) queue(k, v); };
    Storage.prototype.removeItem = function (k) { rawRemove.call(this, k); if (this === localStorage && syncable(k)) queue(k, null); };
  }

  /* ---------- screens ---------- */
  function signedOut() { rawRemove.call(localStorage, SK); location.reload(); }
  function loginScreen(msg) {
    var g = gate("<h1>SMR HRMS &amp; Payroll</h1><p>Sign in with your company account.</p><form id='cgf'><label for='cge'>Email</label><input id='cge' type='email' required autocomplete='username'><label for='cgp'>Password</label><input id='cgp' type='password' required autocomplete='current-password'><div class='e' id='cgx' role='alert'>" + esc(msg || "") + "</div><button class='p' type='submit'>Sign in</button></form><button class='l' id='cgfp' type='button'>Forgot password?</button>");
    g.querySelector("#cgf").onsubmit = function (ev) {
      ev.preventDefault(); var b = g.querySelector(".p"); b.disabled = true; g.querySelector("#cgx").textContent = "";
      authCall("token?grant_type=password", { email: $("cge").value.trim(), password: $("cgp").value }).then(function (t) { setSess(t); start(); })
        .catch(function (e) { b.disabled = false; g.querySelector("#cgx").textContent = /invalid login/i.test(e.message) ? "Wrong email or password." : e.message; });
    };
    g.querySelector("#cgfp").onclick = function () {
      var em = $("cge").value.trim(); if (!em) { g.querySelector("#cgx").textContent = "Type your email first, then choose Forgot password."; return; }
      authCall("recover", { email: em }).then(function () { g.querySelector("#cgx").className = "m"; g.querySelector("#cgx").textContent = "If this email has an account, a reset link was sent."; })
        .catch(function (e) { g.querySelector("#cgx").textContent = e.message; });
    };
  }
  function passwordScreen(t) {
    var g = gate("<h1>Choose your password</h1><p>Use at least 8 characters, with letters and a digit.</p><form id='cgf'><label for='cgn'>New password</label><input id='cgn' type='password' required minlength='8' autocomplete='new-password'><div class='e' id='cgx' role='alert'></div><button class='p' type='submit'>Save password</button></form>");
    g.querySelector("#cgf").onsubmit = function (ev) {
      ev.preventDefault(); var p = $("cgn").value, x = g.querySelector("#cgx");
      if (!(p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p))) { x.textContent = "Use at least 8 characters, with letters and a digit."; return; }
      authCall("user", { password: p }, "PUT", t.access_token).then(function () { history.replaceState(null, "", location.pathname + location.search); start(); })
        .catch(function (e) { x.textContent = e.message; });
    };
  }
  function blocked(title, text) {
    var g = gate("<h1>" + esc(title) + "</h1><p>" + esc(text) + "</p><button class='s' id='cgo'>Sign out</button>");
    g.querySelector("#cgo").onclick = signedOut;
  }
  function firstRunScreen(prof, local, nEmp) {
    var g = gate("<h1>The cloud is empty</h1><p>This browser has " + (nEmp ? "<b>" + nEmp + " employee records</b>" : "saved data") + " from before. Upload it to the cloud so everyone sees the same data, or start with an empty system.</p><button class='p' id='cgu'>Upload this browser's data</button><button class='s' id='cge2'>Start empty</button><div class='e' id='cgx' role='alert'></div>");
    g.querySelector("#cgu").onclick = function () {
      this.disabled = true; var keys = Object.keys(local), i = 0;
      (function next() {
        if (i >= keys.length) { boot(prof, local); return; }
        var k = keys[i++];
        rest("rpc/put_store", { method: "POST", body: { p_k: k, p_v: JSON.parse(local[k]), p_ver: 0 } }).then(function (n) { ver[k] = n; last[k] = canon(JSON.parse(local[k])); next(); })
          .catch(function (e) { g.querySelector("#cgx").textContent = "Upload stopped at " + k + ": " + e.message; });
      })();
    };
    g.querySelector("#cge2").onclick = function () { boot(prof, {}); };
  }

  /* ---------- start ---------- */
  function start() {
    var s = sess(); if (!s) { loginScreen(); return; }
    gate("<h1>Loading…</h1><p>Getting your data.</p>");
    rest("profiles?select=full_name,role,active&id=eq." + s.uid).then(function (rows) {
      var p = rows && rows[0];
      if (!p) return blocked("Account not set up", "Your account has no profile yet. Ask the administrator to set it up.");
      if (!p.active || p.role === "Pending") return blocked("Waiting for access", "Your account exists but has no role yet. Ask the administrator to give you one, then sign in again.");
      return rest("app_store?select=k,v,ver").then(function (rows2) { hydrate(p, s, rows2 || []); });
    }).catch(function (e) {
      if (e.auth || e.status === 401) { rawRemove.call(localStorage, SK); loginScreen("Please sign in again."); }
      else blocked("Cannot reach the server", "Check your internet connection and reload. " + (e.message || ""));
    });
  }
  function hydrate(prof, s, rows) {
    var local = {}, i, k;
    for (i = 0; i < localStorage.length; i++) { k = localStorage.key(i); if (syncable(k)) local[k] = localStorage.getItem(k); }
    var first = !localStorage.getItem("smr_cloud_init");
    if (!rows.length && first && Object.keys(local).length) { prof._s = s; return firstRunScreen(prof, local, countEmp(local)); }
    boot(prof, null, rows, s);
  }
  function countEmp(local) { try { return JSON.parse(local.smr_emp || "[]").length; } catch (e) { return 0; } }
  function boot(prof, uploaded, rows, s) {
    s = s || prof._s;
    var local = {}, i, k;
    for (i = 0; i < localStorage.length; i++) { k = localStorage.key(i); if (syncable(k)) local[k] = localStorage.getItem(k); }
    if (Object.keys(local).length && !localStorage.getItem("smr_localbak")) rawSet.call(localStorage, "smr_localbak", JSON.stringify({ at: new Date().toISOString(), data: local }));
    Object.keys(local).forEach(function (key) { rawRemove.call(localStorage, key); });
    if (rows) { ver = {}; last = {}; }
    (rows || []).forEach(function (r) { if (syncable(r.k)) { rawSet.call(localStorage, r.k, JSON.stringify(r.v)); ver[r.k] = r.ver; last[r.k] = canon(r.v); } });
    if (uploaded) Object.keys(uploaded).forEach(function (key) { rawSet.call(localStorage, key, uploaded[key]); });
    rawSet.call(localStorage, "smr_mode", "mine"); rawSet.call(localStorage, "smr_seed2", "1"); rawRemove.call(localStorage, "smr_seed_pending"); rawSet.call(localStorage, "smr_cloud_init", "1");
    try { sessionStorage.setItem("smr_ss", JSON.stringify({ id: s.uid, name: prof.full_name || s.email, role: prof.role })); sessionStorage.removeItem("smr_es"); } catch (e) { }
    window.SMR_CLOUD_ON = {
      uid: s.uid, email: s.email, name: prof.full_name || s.email, role: prof.role,
      signOut: function () { flush(); var t = sess(); (t ? authCall("logout", {}, "POST", t.access) : Promise.resolve()).catch(function () { }).then(signedOut); },
      status: function () { return status; }, reload: function () { location.reload(); }
    };
    install(); closeGate(); run(); setStatus("saved");
  }

  /* invite and password-reset links arrive as #access_token=...&type=recovery */
  var h = location.hash && location.hash.length > 1 ? new URLSearchParams(location.hash.slice(1)) : null;
  if (h && h.get("access_token") && /recovery|invite/.test(h.get("type") || "")) {
    var t = { access_token: h.get("access_token"), refresh_token: h.get("refresh_token"), expires_in: +h.get("expires_in") || 3600 };
    authCall("user", null, "GET", t.access_token).then(function (u) { t.user = u; setSess(t); passwordScreen(t); }).catch(function () { loginScreen("This link has expired. Request a new one."); });
  } else start();
})();

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
  var ver = {}, last = {}, pend = {}, timer = null, busy = false, status = "saved", retry = 0, stale = false, portal = false, me = null;
  var PW = /^smr_(lr|hrq_mine|punch|photos_mine)$/;
  var NOSYNC = /^smr_(mode|gopen|rail|comfort|seed2|seed_pending|sb|staff|acct|users|localbak|cloud_init)$/;
  var syncable = function (k) { return typeof k === "string" && k.indexOf("smr_") === 0 && !NOSYNC.test(k) && !/_sample$/.test(k); };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;

  var LG = ""; try { var mm = /const LOGO="(data:image[^"]+)"/.exec(src.textContent); if (mm) LG = mm[1]; } catch (e) { }
  function css() {
    if ($("cgcss")) return;
    var s = document.createElement("style"); s.id = "cgcss";
    s.textContent = "#cg{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(1200px 600px at 15% 0%,#1b7fd6 0%,transparent 60%),linear-gradient(160deg,#0460B5,#08305e);font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#10233d;overflow:auto}" +
      "#cg .cgc{width:100%;max-width:880px;display:grid;grid-template-columns:1fr 1fr;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.35)}" +
      "#cg .cgl{background:linear-gradient(155deg,#0460B5,#0a3f78);color:#fff;padding:40px 36px;display:flex;flex-direction:column;justify-content:space-between;gap:28px;position:relative;overflow:hidden}" +
      "#cg .cgl:after{content:'';position:absolute;right:-90px;bottom:-90px;width:260px;height:260px;border-radius:50%;background:rgba(255,255,255,.07)}" +
      "#cg .cgl:before{content:'';position:absolute;right:30px;bottom:130px;width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,.05)}" +
      "#cg .cgl img{width:84px;height:84px;border-radius:18px;background:#fff;object-fit:contain;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,.25)}" +
      "#cg .cgl h2{margin:18px 0 6px;font-size:26px;line-height:1.2;letter-spacing:-.01em}#cg .cgl p{margin:20px 0 0;color:rgba(255,255,255,.82);font-size:14.5px;line-height:1.55}" +
      "#cg .cgl ul{list-style:none;margin:0;padding:0;display:grid;gap:10px;font-size:13.5px;color:rgba(255,255,255,.9);position:relative;z-index:1}#cg .cgl li{display:flex;gap:10px;align-items:center}#cg .cgl li i{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.16);display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-size:12px}" +
      "#cg .cgr{padding:40px 38px;display:flex;flex-direction:column;justify-content:center}" +
      "#cg h1{margin:0 0 6px;font-size:24px;color:#10233d;letter-spacing:-.01em}#cg .cgr>p{margin:0 0 14px;color:#52627a;font-size:14.5px;line-height:1.5}" +
      "#cg label.cgrm{display:flex!important;flex-direction:row!important;justify-content:flex-start!important;text-align:left!important;align-items:center;gap:10px;font-weight:500;font-size:14px;margin:14px 0 2px;cursor:pointer;min-height:44px}#cg label.cgrm input{width:20px;height:20px;min-width:20px;padding:0;margin:0;accent-color:#0460B5;border-radius:5px;cursor:pointer}" +
      "#cg label{display:block;font-weight:600;font-size:13.5px;margin:14px 0 6px}#cg input{width:100%;box-sizing:border-box;height:48px;padding:0 14px;border:1px solid #cdd7e5;border-radius:12px;font:inherit;font-size:16px;background:#f6f8fc;color:#10233d;-webkit-text-fill-color:#10233d;caret-color:#0460B5;color-scheme:light;transition:border-color .15s,box-shadow .15s}" +
      "#cg{color-scheme:light;--tx:#10233d;--hd:#10233d}#cg h1{color:#10233d!important;font-size:24px!important;letter-spacing:-.01em!important}#cg label,#cg .cgr>p{color:#10233d}#cg .cgr>p{color:#52627a}#cg .cgl,#cg .cgl p{color:#fff}#cg input::placeholder{color:#8a97ab;-webkit-text-fill-color:#8a97ab}#cg input:-webkit-autofill{-webkit-text-fill-color:#10233d;box-shadow:0 0 0 40px #f6f8fc inset}#cg select,#cg textarea{color:#10233d}" +
      "#cg input:focus{outline:0;border-color:#0460B5;background:#fff;box-shadow:0 0 0 4px rgba(4,96,181,.14)}" +
      "#cg button{font:inherit;cursor:pointer}#cg .p{width:100%;margin-top:20px;height:48px;border:0;border-radius:12px;background:#0460B5;color:#fff;font-weight:700;font-size:15px;transition:background .15s,transform .05s}#cg .p:hover{background:#0a54a0}#cg .p:active{transform:translateY(1px)}" +
      "#cg .p:disabled{opacity:.6;cursor:wait}#cg .s{width:100%;margin-top:10px;height:46px;border:1px solid #cdd7e5;border-radius:12px;background:#fff;color:#0460B5;font-weight:600}" +
      "#cg .l{background:none;border:0;color:#0460B5;font-weight:600;padding:12px 0 0;font-size:13.5px;text-align:left}#cg .e{color:#b42318;font-size:13.5px;min-height:18px;margin-top:8px}#cg .m{color:#0b6b3a;font-size:13.5px;margin-top:8px}" +
      "#cg .cgs{margin-top:22px;padding-top:14px;border-top:1px solid #e6ecf4;font-size:12px;color:#7b8aa0}" +
      "#cg .cgc.one{max-width:440px;grid-template-columns:1fr}#cg .cgc.one .cgl{display:none}" +
      "@media(max-width:760px){#cg{align-items:flex-start;padding:0}#cg .cgc{grid-template-columns:1fr;border-radius:0;min-height:100%;max-width:none}#cg .cgl{padding:26px 24px;gap:14px}#cg .cgl ul{display:none}#cg .cgl img{width:60px;height:60px}#cg .cgl h2{font-size:21px;margin-top:12px}#cg .cgr{padding:26px 24px 34px}}" +
      "#cst{font-size:12px;margin-top:6px;opacity:.85}#cst.off{color:#ffd166;font-weight:700}";
    document.head.appendChild(s);
  }
  function gate(html) {
    css(); var g = $("cg");
    if (!g) { g = document.createElement("div"); g.id = "cg"; document.body.appendChild(g); }
    g.innerHTML = '<div class="cgc" role="dialog" aria-modal="true"><div class="cgl">' + '<div>' + (LG ? '<img src="' + LG + '" alt="SMR">' : "") + '<p>Savills Management Resources, Egypt</p></div>' +
      '<ul><li><i>&#10003;</i>Your own data, protected by your account</li><li><i>&#10003;</i>Leave, attendance and payslips</li><li><i>&#10003;</i>Works on phone and desktop</li></ul></div><div class="cgr">' + html + "</div></div>";
    var f = g.querySelector("input"); if (f) f.focus();
    // one entrance when the sign-in card first appears (GSAP is loaded before this script)
    if (!g._an && window.gsap && window.matchMedia && matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      g._an = 1; var c = g.querySelector(".cgc");
      gsap.timeline({ defaults: { ease: "power3.out" } }).from(c, { autoAlpha: 0, y: 18, scale: .985, duration: .5, clearProps: "all" })
        .from(g.querySelectorAll(".cgr>*,.cgr form>*"), { autoAlpha: 0, y: 8, duration: .32, stagger: .035, clearProps: "all" }, .15)
        .from(g.querySelectorAll(".cgl li"), { autoAlpha: 0, x: -8, duration: .3, stagger: .06, clearProps: "all" }, .25);
    }
    return g;
  }
  function closeGate() { var g = $("cg"); if (g) g.remove(); }

  /* ---------- session and requests ---------- */
  function sess() {
    try {
      var s = JSON.parse(localStorage.getItem(SK) || "null");
      /* "Remember me" off: the session lasts only while this browser tab or window stays open */
      if (s && s.rm === false && !sessionStorage.getItem("smr_live")) { rawRemove.call(localStorage, SK); return null; }
      return s;
    } catch (e) { return null; }
  }
  function setSess(t, rm) {
    if (rm === undefined) { var o = null; try { o = JSON.parse(localStorage.getItem(SK) || "null"); } catch (e) { } rm = !(o && o.rm === false); }
    var s = { access: t.access_token, refresh: t.refresh_token, exp: Date.now() + (t.expires_in || 3600) * 1000 - 60000, uid: t.user && t.user.id, email: t.user && t.user.email, rm: rm !== false };
    rawSet.call(localStorage, SK, JSON.stringify(s));
    try { if (s.rm) sessionStorage.removeItem("smr_live"); else sessionStorage.setItem("smr_live", "1"); } catch (e) { }
    return s;
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
    if (portal && (val === null || !PW.test(k))) return;
    if (val !== null) { var same = false; try { same = last[k] !== undefined && canon(JSON.parse(val)) === last[k]; } catch (e) { } if (same) { delete pend[k]; if (!Object.keys(pend).length) setStatus("saved"); return; } }
    else if (last[k] === undefined && ver[k] === undefined) { delete pend[k]; return; }
    pend[k] = val; setStatus("saving"); clearTimeout(timer); timer = setTimeout(flush, 700); }
  function conflict() {
    setStatus("conflict"); pend = {};
    var g = gate("<h1>Someone else saved first</h1><p>Another person changed the same records while you were working. Reload to get the latest data, then repeat your last change.</p><button class='p' id='cgr'>Reload latest data</button>");
    g.querySelector("#cgr").onclick = function () { location.reload(); };
  }
  /* leave emails: sent by the server function, which reads the request itself. Failures never block the user. */
  function leaveIds(txt) { try { var o = {}; JSON.parse(txt).forEach(function (r) { o[r.id] = r.status; }); return o; } catch (e) { return {}; } }
  function notifyLeave(oldTxt, newVal) {
    if (!window.SMR_CLOUD_ON) return;
    var a = leaveIds(oldTxt || "[]"), b = leaveIds(JSON.stringify(newVal));
    Object.keys(b).forEach(function (id) {
      var kind = a[id] === undefined && b[id] === "Pending" ? "submitted" : (a[id] === "Pending" && (b[id] === "Approved" || b[id] === "Rejected") ? "decided" : null);
      if (kind) window.SMR_CLOUD_ON.fn("notify-leave", { kind: kind, lr_id: id }).catch(function (e) { try { console.warn("email not sent:", e.message); } catch (x) { } });
    });
  }
  function flush() {
    if (busy) { timer = setTimeout(flush, 400); return; }
    var keys = Object.keys(pend); if (!keys.length) { setStatus("saved"); return; }
    busy = true;
    var k = keys[0], val = pend[k];
    var p = portal ? rest("rpc/portal_put", { method: "POST", body: { p_k: k, p_v: JSON.parse(val) } }).then(function () { var o = last[k]; last[k] = canon(JSON.parse(val)); if (k === "smr_lr") notifyLeave(o, JSON.parse(val)); })
      : val === null ? rest("rpc/del_store", { method: "POST", body: { p_k: k } }).then(function () { delete ver[k]; delete last[k]; })
      : rest("rpc/put_store", { method: "POST", body: { p_k: k, p_v: JSON.parse(val), p_ver: ver[k] || 0 } }).then(function (n) { var o = last[k]; ver[k] = n; last[k] = canon(JSON.parse(val)); if (k === "smr_lr") notifyLeave(o, JSON.parse(val)); });
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
  /* When newer data exists and the person is not in the middle of something, reload by itself so HR edits show up without a click. */
  function idleNow() {
    var a = document.activeElement, dr = document.getElementById("drawer"), cf = document.getElementById("confirm");
    var typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
    return !typing && !(dr && dr.classList.contains("open")) && !(cf && !cf.hidden) && !document.getElementById("cg") && !busy && !Object.keys(pend).length && document.visibilityState === "visible";
  }
  function markStale() {
    stale = true; setStatus("stale");
    if (!portal) return;  /* staff keep the manual "Reload latest data" button so a report is never refreshed under them */
    var tries = 0, t = setInterval(function () { if (++tries > 40) return clearInterval(t); if (idleNow()) { clearInterval(t); location.reload(); } }, 3000);
  }
  /* live updates: take newer data from the server into this tab without a reload, then tell the app which keys changed.
     Keys with unsaved local edits are never overwritten (the version check on save still guards them). */
  function adopt(list) {
    var keys = [];
    list.forEach(function (r) {
      if (!syncable(r.k) || pend[r.k] !== undefined) return;
      var c = canon(r.v); if (r.ver !== undefined) ver[r.k] = r.ver;
      if (last[r.k] === c) return;
      try { rawSet.call(localStorage, r.k, JSON.stringify(r.v)); } catch (e) { }
      last[r.k] = c; keys.push(r.k);
    });
    if (keys.length) try { window.dispatchEvent(new CustomEvent("smr-data", { detail: keys })); } catch (e) { }
  }
  function check() {
    if (stale || busy || Object.keys(pend).length) return;
    if (portal) { rest("rpc/portal_data", { method: "POST", body: {} }).then(function (d) { adopt(Object.keys(d || {}).map(function (k) { return { k: k, v: d[k] }; })); }).catch(function () { }); return; }
    rest("app_store?select=k,ver").then(function (rows) {
      if (Object.keys(ver).some(function (k) { return !rows.some(function (r) { return r.k === k; }); })) return markStale();
      var ch = rows.filter(function (r) { return syncable(r.k) && (ver[r.k] || 0) !== r.ver && pend[r.k] === undefined; }).map(function (r) { return r.k; });
      if (!ch.length) return;
      return rest("app_store?select=k,v,ver&k=in.(" + ch.map(encodeURIComponent).join(",") + ")").then(adopt);
    }).catch(function () { });
  }
  setInterval(check, 15000);
  /* another tab of this browser saved: pick up the new version soon, so this tab's next save does not conflict */
  window.addEventListener("storage", function (e) { if (e.key && syncable(e.key)) { clearTimeout(window.__smrChk); window.__smrChk = setTimeout(check, 1200); } });

  function install() {
    Storage.prototype.setItem = function (k, v) { rawSet.call(this, k, v); if (this === localStorage && syncable(k)) queue(k, v); };
    Storage.prototype.removeItem = function (k) { rawRemove.call(this, k); if (this === localStorage && syncable(k)) queue(k, null); };
  }

  /* ---------- screens ---------- */
  function signedOut() {
    rawRemove.call(localStorage, SK);
    if (!Object.keys(pend).length) { var del = [], i, k; for (i = 0; i < localStorage.length; i++) { k = localStorage.key(i); if (syncable(k)) del.push(k); } del.forEach(function (x) { rawRemove.call(localStorage, x); }); }
    try { sessionStorage.removeItem("smr_es"); sessionStorage.removeItem("smr_ss"); } catch (e) { }
    location.reload();
  }
  function loginScreen(msg) {
    var g = gate("<h1>Welcome back</h1><p>Sign in with your work email and password.</p><form id='cgf' novalidate><label for='cge'>Work email</label><input id='cge' type='email' required autocomplete='username' placeholder='name@savills.me' inputmode='email' autocapitalize='off' spellcheck='false'><label for='cgp'>Password</label><input id='cgp' type='password' required autocomplete='current-password' placeholder='Your password'><label class='cgrm' for='cgrm'><input id='cgrm' type='checkbox' checked>Remember me on this device</label><div class='e' id='cgx' role='alert'>" + esc(msg || "") + "</div><button class='p' type='submit'>Sign in</button></form><button class='l' id='cgfp' type='button'>Forgot password?</button><div class='cgs'>Trouble signing in? Ask HR to check that your account is set up.</div>");
    g.querySelector("#cgf").onsubmit = function (ev) {
      ev.preventDefault(); var b = g.querySelector(".p");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($("cge").value.trim())) { g.querySelector("#cgx").textContent = "Enter your full work email, for example name@savills.me."; $("cge").focus(); return; }
      b.disabled = true; b.setAttribute("aria-busy", "true"); g.querySelector("#cgx").textContent = "";
      var rm = $("cgrm").checked; try { if (rm) localStorage.setItem("cg_email", $("cge").value.trim()); else localStorage.removeItem("cg_email"); } catch (e) { }
      authCall("token?grant_type=password", { email: $("cge").value.trim(), password: $("cgp").value }).then(function (t) { setSess(t, rm); start(); })
        .catch(function (e) { b.disabled = false; b.removeAttribute("aria-busy"); g.querySelector("#cgx").textContent = /invalid login/i.test(e.message) ? "Wrong email or password." : e.message; });
    };
    try { var le = localStorage.getItem("cg_email"); if (le) { $("cge").value = le; $("cgp").focus(); } else { $("cgrm").checked = true; } } catch (e) { }
    g.querySelector("#cgfp").onclick = function () {
      var em = $("cge").value.trim(); if (!em) { g.querySelector("#cgx").textContent = "Type your email first, then choose Forgot password."; return; }
      authCall("recover", { email: em }).then(function () { g.querySelector("#cgx").className = "m"; g.querySelector("#cgx").textContent = "If this email has an account, a reset link was sent."; })
        .catch(function (e) { g.querySelector("#cgx").textContent = e.message; });
    };
  }
  function passwordScreen(t, first) {
    var g = gate("<h1>" + (first ? "Set your own password" : "Choose your password") + "</h1><p>" + (first ? "You signed in with a temporary password. Choose a new one to continue. " : "") + "Use at least 8 characters, with letters and a digit.</p><form id='cgf' novalidate><label for='cgn'>New password</label><input id='cgn' type='password' required minlength='8' autocomplete='new-password'><div class='e' id='cgx' role='alert'></div><button class='p' type='submit'>Save password</button></form>");
    g.querySelector("#cgf").onsubmit = function (ev) {
      ev.preventDefault(); var p = $("cgn").value, x = g.querySelector("#cgx");
      if (!(p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p))) { x.textContent = "Use at least 8 characters, with letters and a digit."; return; }
      authCall("user", { password: p, data: { must_change: false } }, "PUT", t.access_token).then(function () { history.replaceState(null, "", location.pathname + location.search); start(); })
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
    authCall("user", null, "GET", s.access).then(function (u) { return u; }, function () { return null; }).then(function (u) {
      if (u && u.user_metadata && u.user_metadata.must_change) { passwordScreen({ access_token: s.access }, true); return null; }
      return load(s);
    });
  }
  function load(s) {
    rest("profiles?select=full_name,role,active,emp_no&id=eq." + s.uid).then(function (rows) {
      var p = rows && rows[0];
      if (!p) return blocked("Account not set up", "Your account has no profile yet. Ask the administrator to set it up.");
      if (!p.active && p.role !== "Pending") return blocked("Account disabled", "This account was turned off. Ask HR if you need access again.");
      if (p.role === "Pending") return blocked("Waiting for access", "Your account exists but has no role yet. Ask the administrator to give you one, then sign in again.");
      if (p.role === "Employee") {
        if (!p.emp_no) return blocked("Account not linked", "Your sign-in is not linked to an employee record yet. Ask HR to link it to your work email.");
        portal = true; me = p.emp_no;
        return rest("rpc/portal_data", { method: "POST", body: {} }).then(function (d) {
          var rows = Object.keys(d || {}).map(function (k) { return { k: k, v: d[k], ver: 0 }; });
          boot(p, null, rows, s);
        });
      }
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
    if (!portal && Object.keys(local).length && !localStorage.getItem("smr_localbak")) rawSet.call(localStorage, "smr_localbak", JSON.stringify({ at: new Date().toISOString(), data: local }));
    Object.keys(local).forEach(function (key) { rawRemove.call(localStorage, key); });
    if (rows) { ver = {}; last = {}; }
    (rows || []).forEach(function (r) { if (syncable(r.k)) { rawSet.call(localStorage, r.k, JSON.stringify(r.v)); ver[r.k] = r.ver; last[r.k] = canon(r.v); } });
    if (uploaded) Object.keys(uploaded).forEach(function (key) { rawSet.call(localStorage, key, uploaded[key]); });
    rawSet.call(localStorage, "smr_mode", "mine"); rawSet.call(localStorage, "smr_seed2", "1"); rawRemove.call(localStorage, "smr_seed_pending"); rawSet.call(localStorage, "smr_cloud_init", "1");
    try {
      if (portal) {
        var em = null; try { em = (JSON.parse(localStorage.getItem("smr_emp") || "[]").filter(function (x) { return x.no === me; })[0]) || null; } catch (e) { }
        sessionStorage.setItem("smr_es", JSON.stringify({ no: me, mode: "mine", lvl: "emp", view: "emp", dept: em ? em.dept : "", wrole: "Employee" })); sessionStorage.removeItem("smr_ss");
      } else { sessionStorage.setItem("smr_ss", JSON.stringify({ id: s.uid, name: prof.full_name || s.email, role: prof.role })); sessionStorage.removeItem("smr_es"); }
    } catch (e) { }
    window.SMR_CLOUD_ON = {
      uid: s.uid, email: s.email, name: prof.full_name || s.email, role: prof.role, emp: prof.emp_no || "",
      signOut: function () { flush(); var t = sess(); (t ? authCall("logout", {}, "POST", t.access) : Promise.resolve()).catch(function () { }).then(signedOut); },
      rpc: function (name, body) { return rest("rpc/" + name, { method: "POST", body: body || {} }); },
      fn: function (name, body) {
        return token().then(function (t) {
          return fetch(URL_ + "/functions/v1/" + name, { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + t, "Content-Type": "application/json" }, body: JSON.stringify(body) })
            .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.error) throw new Error(j.error || (r.status === 404 ? "The account service is not set up yet. Deploy the admin-users function in Supabase." : "Request failed")); return j; }); }).catch(function (e) { if (e instanceof TypeError || /failed to fetch|network/i.test(e.message)) throw new Error("Cannot reach the account service. In Supabase, deploy the function named admin-users (Edge Functions), then try again."); throw e; });
        });
      },
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

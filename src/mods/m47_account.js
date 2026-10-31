/* ===== m47: account menu at the top right (name, role, my profile, sign out). Replaces the sign-out block at the bottom of the menu. ===== */
/* the signed-in person's own employee record: the linked one, else the only employee with exactly the same name */
function acctEmp(no,name){const L=allEmps();if(no){const e=L.find(x=>x.no===no);if(e)return e}const n=String(name||"").trim().toLowerCase();if(!n)return null;const m=L.filter(x=>String(x.name||"").trim().toLowerCase()===n);return m.length===1?m[0]:null}
function acctInfo(){const C=window.SMR_CLOUD_ON;
 if(typeof ESES!=="undefined"&&ESES){const e=allEmps().find(x=>x.no===ESES.no);return{n:e?e.name:ESES.no,s:e&&e.pos?e.pos:"Employee",e,mgr:ESES.lvl==="mgr"}}
 if(C&&(C.name||C.email))return{n:C.name||C.email,s:[C.role,C.name?C.email:""].filter(Boolean).join(" · "),e:acctEmp(C.emp,C.name)};
 if(typeof SSES!=="undefined"&&SSES)return{n:SSES.name,s:SSES.role,e:acctEmp(SSES.no,SSES.name)};
 return null}
function acctUI(){const tb=document.querySelector(".topbar");if(!tb)return;const a=acctInfo();let w=document.getElementById("acct");
 if(!a){if(w)w.remove();document.body.classList.remove("hasacct");return}
 document.body.classList.add("hasacct");
 const sw=a.mgr?`<button type="button" role="menuitem" data-act="esview">${ESES.view==="mgr"?"Switch to my own workspace":"Switch to my work role"}</button>`:"";
 const ph=a.e&&typeof PHOTOS==="function"?PHOTOS()[a.e.no]||"":"";
 /* the role box in the side menu shows the same picture */
 const rma=document.querySelector(".rmb .rma");if(rma){if(ph){rma.classList.add("phi");rma.style.cssText="background-image:url('"+ph+"')!important;background-size:cover!important;background-position:center!important;color:transparent!important;font-size:0!important";rma.dataset.ph=1;rma.textContent=""}else if(rma.dataset.ph){rma.classList.remove("phi");rma.style.cssText="";delete rma.dataset.ph}}
 if(!document.getElementById("top-portal-btn")){
  const pbtn=`<button id="top-portal-btn" type="button" data-go="work" style="height:38px;padding:0 14px;border-radius:12px;font-size:13.5px;font-weight:600;display:inline-flex;align-items:center;gap:6px;background:var(--surf,#fff);border:1px solid var(--bd,#cdd7e5);color:var(--brand,#0460B5);cursor:pointer;box-shadow:0 1px 2px rgba(15,27,45,.05);"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>My portal</button>`;
  if(w)w.insertAdjacentHTML("beforebegin",pbtn);else tb.insertAdjacentHTML("beforeend",pbtn);
 }
 const key=[a.n,a.s,sw.length,role,ph.length].join("|");if(w&&w.dataset.k===key)return;
 const av=a.e&&typeof avi==="function"?avi(a.e):`<i class="av">${esc(ini(a.n))}</i>`;
 const html=`<details id="acct" class="acct" data-k="${esc(key)}"><summary class="acb" aria-label="Account menu for ${esc(a.n)}">${av}<span class="acn">${esc(String(a.n).split(/\s+/)[0])}</span><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></summary><div class="acm" role="menu"><div class="ach">${av}<div><b>${esc(a.n)}</b><small>${esc(a.s||"")}</small></div></div>${canSee("work")?`<button type="button" role="menuitem" data-go="work"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>My portal</button>`:""}${canSee("myprofile")?`<button type="button" role="menuitem" data-go="myprofile"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>My profile</button>`:""}${sw}<button type="button" role="menuitem" class="acx" data-act="esout">Sign out</button></div></details>`;
 if(w)w.outerHTML=html;else tb.insertAdjacentHTML("beforeend",html)}
document.addEventListener("click",ev=>{const d=document.getElementById("acct");if(d&&d.open&&(!d.contains(ev.target)||ev.target.closest(".acm button")))d.removeAttribute("open")});
document.addEventListener("keydown",ev=>{const d=document.getElementById("acct");if(ev.key==="Escape"&&d&&d.open){d.removeAttribute("open");d.querySelector("summary").focus()}});
(function(){const go=()=>{const v=document.getElementById("view");if(!v)return setTimeout(go,50);acctUI();new MutationObserver(acctUI).observe(v,{childList:true});setInterval(acctUI,1500)};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go()})();
/* home-screen icon (phones, pinned tabs): the real SMR logo */
(function(){try{if(typeof LOGO!=="string"||document.querySelector('link[rel="apple-touch-icon"]'))return;const l=document.createElement("link");l.rel="apple-touch-icon";l.href=LOGO;document.head.appendChild(l)}catch(e){}})();

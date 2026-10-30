/* ===== m47: account menu at the top right (name, role, my profile, sign out). Replaces the sign-out block at the bottom of the menu. ===== */
function acctInfo(){const C=window.SMR_CLOUD_ON;
 if(typeof ESES!=="undefined"&&ESES){const e=allEmps().find(x=>x.no===ESES.no);return{n:e?e.name:ESES.no,s:e&&e.pos?e.pos:"Employee",e,mgr:ESES.lvl==="mgr"}}
 if(typeof SSES!=="undefined"&&SSES)return{n:SSES.name,s:SSES.role};
 if(C&&(C.name||C.email))return{n:C.name||C.email,s:[C.role,C.name?C.email:""].filter(Boolean).join(" · ")};
 return null}
function acctUI(){const tb=document.querySelector(".topbar");if(!tb)return;const a=acctInfo();let w=document.getElementById("acct");
 if(!a){if(w)w.remove();document.body.classList.remove("hasacct");return}
 document.body.classList.add("hasacct");
 const sw=a.mgr?`<button type="button" role="menuitem" data-act="esview">${ESES.view==="mgr"?"Switch to my own workspace":"Switch to my work role"}</button>`:"";
 const key=[a.n,a.s,sw.length,role].join("|");if(w&&w.dataset.k===key)return;
 const av=a.e&&typeof avi==="function"?avi(a.e):`<i class="av">${esc(ini(a.n))}</i>`;
 const html=`<details id="acct" class="acct" data-k="${esc(key)}"><summary class="acb" aria-label="Account menu for ${esc(a.n)}">${av}<span class="acn">${esc(String(a.n).split(/\s+/)[0])}</span><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></summary><div class="acm" role="menu"><div class="ach">${av}<div><b>${esc(a.n)}</b><small>${esc(a.s||"")}</small></div></div>${canSee("myprofile")?`<button type="button" role="menuitem" data-go="myprofile">My profile</button>`:""}${sw}<button type="button" role="menuitem" class="acx" data-act="esout">Sign out</button></div></details>`;
 if(w)w.outerHTML=html;else tb.insertAdjacentHTML("beforeend",html)}
document.addEventListener("click",ev=>{const d=document.getElementById("acct");if(d&&d.open&&(!d.contains(ev.target)||ev.target.closest(".acm button")))d.removeAttribute("open")});
document.addEventListener("keydown",ev=>{const d=document.getElementById("acct");if(ev.key==="Escape"&&d&&d.open){d.removeAttribute("open");d.querySelector("summary").focus()}});
(function(){const go=()=>{const v=document.getElementById("view");if(!v)return setTimeout(go,50);acctUI();new MutationObserver(acctUI).observe(v,{childList:true});setInterval(acctUI,1500)};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go()})();

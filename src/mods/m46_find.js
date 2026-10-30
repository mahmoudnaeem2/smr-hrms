/* ===== m46: find things fast. A search box on every full list (tables and drill-down lists) that filters the rows on screen. ===== */
const TF={};
function tfBar(n){return`<div class="tsr tfb"><label class="tsrf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14"/></svg><input type="search" data-tf placeholder="Search in this list" aria-label="Search in this list" autocomplete="off"></label><span class="tsrn" aria-live="polite" data-n="${n}">${n} records</span></div>`}
function tfRows(w){return[...w.querySelectorAll("table tr")].filter(r=>!r.querySelector("th")).concat([...w.querySelectorAll(".drc")])}
function tfApply(inp){const w=inp.closest(".tfw");if(!w)return;const q=inp.value.trim().toLowerCase(),words=q.split(/\s+/).filter(Boolean),rows=tfRows(w);let shown=0;
 rows.forEach(r=>{const t=r.textContent.toLowerCase(),ok=!words.length||words.every(x=>t.includes(x));r.hidden=!ok;if(ok&&r.tagName==="TR")shown++});
 const n=w.querySelector(".tsrn"),all=+((n&&n.dataset.n)||0);if(n)n.textContent=q?shown+" of "+all:all+" records";
 let e=w.querySelector(".tfe");if(q&&!shown){if(!e){w.insertAdjacentHTML("beforeend",'<div class="empty tfe"></div>');e=w.querySelector(".tfe")}e.textContent='Nothing matches "'+inp.value.trim()+'". Try part of a name, a number or a department.'}else if(e)e.remove()}
function tfKey(inp){const v=inp.closest("#db")?"drawer":(typeof page!=="undefined"?page:"");const all=[...document.querySelectorAll(v==="drawer"?"#db [data-tf]":"#view [data-tf]")];return v+"|"+all.indexOf(inp)}
document.addEventListener("input",e=>{const i=e.target.closest&&e.target.closest("[data-tf]");if(!i)return;TF[tfKey(i)]=i.value;tfApply(i)});
document.addEventListener("keydown",e=>{const i=e.target.closest&&e.target.closest("[data-tf]");if(i&&e.key==="Escape"&&i.value){e.stopPropagation();i.value="";TF[tfKey(i)]="";tfApply(i)}},true);
/* keep what was typed when the page re-renders (saving, syncing, switching tabs inside the page) */
(function(){const re=root=>root.querySelectorAll("[data-tf]").forEach(i=>{const v=TF[tfKey(i)];if(v){i.value=v;tfApply(i)}});
 const go=()=>{const v=document.getElementById("view"),d=document.getElementById("db");if(!v)return setTimeout(go,50);new MutationObserver(()=>re(v)).observe(v,{childList:true});if(d)new MutationObserver(()=>{Object.keys(TF).forEach(k=>{if(k.startsWith("drawer|"))delete TF[k]})}).observe(d,{childList:true})};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go()})();
/* global search (top bar, Ctrl+K): people first, then pages (including hub tabs and settings), departments, projects and sign-in accounts. Every word must match. */
function palResults(q){q=q.trim().toLowerCase();const out=[],W=q.split(/\s+/).filter(Boolean),M=t=>{t=String(t||"").toLowerCase();return W.every(w=>t.includes(w))};
 if(!q){const seen=new Set();HIST.slice().reverse().forEach(h=>{if(seen.has(h.page)||h.page===page||!PAGES[h.page]||!canSee(h.page))return;seen.add(h.page);out.push({g:"Recent",t:PAGES[h.page].title,s:"Page",a:()=>go(h.page)})});return out.slice(0,6)}
 if(canSee("profile")||canSee("emp")){allEmps().filter(typeof inScope==="function"?inScope:()=>true).filter(e=>M([e.name,e.no,e.pos,e.grade,e.dept,e.project,e.email,e.mobile,e.mgr,e.loc,e.status].join(" "))).slice(0,6).forEach(e=>out.push({g:"Employees",t:e.name+" ("+e.no+")",s:[e.pos,e.dept,e.status].filter(Boolean).join(" · "),a:()=>canSee("profile")?ACTS.prof(e.no):(Q=e.no,go("emp"))}))}
 const hubTxt=k=>{try{const h=hubOf(k);if(!h)return"";const tab=(h.p.find(x=>x[1]===k)||[])[0]||"";const st=typeof SETG!=="undefined"?(SETG.flatMap(g=>g[1].map(x=>[x[0],g[0]+" "+x[1]])).find(x=>x[0]===k)||[])[1]||"":"";return h.n+" "+tab+" "+st}catch(e){return""}};
 Object.keys(PAGES).filter(k=>!(typeof HIDE_NAV!=="undefined"&&HIDE_NAV.includes(k))&&canSee(k)&&M(PAGES[k].title+" "+PAGES[k].desc+" "+hubTxt(k))).slice(0,6).forEach(k=>{const h=typeof hubOf==="function"?hubOf(k):null;out.push({g:"Pages",t:PAGES[k].title,s:(h&&h.n!==PAGES[k].title?h.n+" · ":"")+PAGES[k].desc,a:()=>go(k)})});
 if(canSee("rep_dp")){DEPTS.filter(d=>M(d)).forEach(d=>out.push({g:"Departments",t:d,s:"Open the department and project report",a:()=>{F.dept=d;F.project="";TAB.rdp="dept";go("rep_dp")}}));
  try{[...new Set([...ccNames(""),...PROJL()])].filter(p=>M(p)).slice(0,4).forEach(p=>out.push({g:"Projects and cost centers",t:p,s:"Open the project report",a:()=>{F.project=p;F.dept="";TAB.rdp="project";go("rep_dp")}}))}catch(e){}}
 try{if(typeof UP!=="undefined"&&Array.isArray(UP)&&canSee("users"))UP.filter(u=>M([u.full_name,u.email,u.role].join(" "))).slice(0,4).forEach(u=>out.push({g:"Sign-in accounts",t:u.full_name||u.email,s:[u.email,u.role].join(" · "),a:()=>go("users")}))}catch(e){}
 return out.slice(0,16)}

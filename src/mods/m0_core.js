/* ================= CORE FRAMEWORK ================= */
const R={HRD:"HR Director",HRS:"HR Specialist",PAY:"Payroll Specialist",FIN:"Finance Manager",DM:"Department Manager",EMP:"Employee",ADM:"System Administrator"};
const ROLES=Object.fromEntries(Object.values(R).map(r=>[r,1]));
const A=(...c)=>c.map(x=>R[x]);
const DB={};
function db(n,def,scoped=true){const k="smr_"+n+(scoped?"_"+MODE:"");if(!(k in DB)){let v=null;try{const s=localStorage.getItem(k);v=s?JSON.parse(s):null}catch(e){}DB[k]=v==null?structuredClone(def):v}return DB[k]}
function sv(n,scoped=true){const k="smr_"+n+(scoped?"_"+MODE:"");try{localStorage.setItem(k,JSON.stringify(DB[k]))}catch(e){}}
function toast(m){let t=$("#toast");if(!t){t=document.createElement("div");t.id="toast";t.setAttribute("role","status");document.body.appendChild(t)}t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("show"),2600)}
function audit(a,d){const L=db("audit",[],false);L.unshift({t:new Date().toISOString(),role,mode:MODE,a,d:d||""});if(L.length>600)L.length=600;sv("audit",false)}
const fmtC=c=>(c<0?"-":"")+"EGP "+(Math.abs(c)/100).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const C=n=>Math.round((+n||0)*100);
const bd=(t,c)=>`<span class="badge ${c||"s-mu"}">${esc(t)}</span>`;
const plain=h=>String(h).replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').trim();
const ALLE=()=>allEmps().filter(inScope);
const empBy=no=>allEmps().find(e=>e.no===no);
const monthsBack=n=>{const o=[];for(let i=0;i<n;i++){const d=new Date(T0.getFullYear(),T0.getMonth()-i,1);o.push({key:iso(d).slice(0,7),label:d.toLocaleString("en",{month:"long",year:"numeric"}),start:iso(d),end:i===0?iso(T0):iso(new Date(d.getFullYear(),d.getMonth()+1,0)),fullEnd:iso(new Date(d.getFullYear(),d.getMonth()+1,0))})}return o};

/* ----- registry, permissions, navigation ----- */
const PAGES={};
function reg(key,title,desc,roles,fn){PAGES[key]={title,desc,roles,fn}}
const PERM=()=>db("perm",{},false);
const canSee=p=>{if(!PAGES[p])return false;const o=PERM()[p+"|"+role];return o!=null?!!o:PAGES[p].roles.includes(role)};
const NAV=[["Overview",[["HR Dashboard","dash"],["Payroll Dashboard","paydash"],["Approvals","appr"],["My Portal","work"],["HR Requests","hr_req"],["My Profile","myprofile"]]],
["People",[["Employee Directory","emp"],["Employee Profiles","profile"],["Organization Chart","org"],["Departments","depts"],["Job Positions","positions"],["Employment Contracts","contracts"],["Data Completeness","completeness"],["Probation Tracker","probation"],["Employee Documents","docs"],["Disciplinary Warnings","warns"]]],
["Time & Attendance",[["Daily Attendance","att_d"],["Monthly Attendance","att_m"],["Timesheets","timesheets"],["Shifts & Scheduling","shifts"],["Overtime","overtime"],["Attendance Exceptions","exceptions"]]],
["Leave",[["Leave Requests","leave_req"],["Leave Balances","leave_bal"],["Leave Calendar","leave_cal"],["Leave Policies","leave_pol"]]],
["Payroll",[["Payroll Periods","pay_periods"],["Payroll Processing","pay_proc"],["Payroll Inputs","pay_inputs"],["Employee Loans","loans"],["Payroll Register","pay_reg"],["Payslips","payslips"],["Salary Components","pay_comp"],["Tax & Insurance Settings","comp"],["Payroll Variance Analysis","pay_var"],["Payroll Reconciliation","pay_rec"],["Final Settlements","pay_fs"]]],
["Talent",[["Recruitment","recruit"],["Onboarding","onboard"],["Offboarding","offboard"],["Performance Reviews","perf"],["Training & Development","training"]]],
["Reports",[["HR Analytics","rep_hr"],["Attendance Reports","rep_att"],["Payroll Reports","rep_pay"],["Headcount Reports","rep_head"],["Reports by Department & Project","rep_dp"],["Contract Expiry","rep_cx"],["Payroll Cost Analysis","rep_cost"]]],
["Administration",[["Approval Workflows","wf"],["Notifications","notif"],["User Management","users"],["Roles & Permissions","perms"],["Integrations","integ"],["Employee Access","emp_access"],["Cost Centers & Projects","cost_centers"],["Audit Logs","auditlog"],["Company Settings","company"]]]];
const HIDE_NAV=["recruit","onboard","perf","training"];NAV.forEach(g=>{g[1]=g[1].filter(i=>!HIDE_NAV.includes(i[1]))});
const ALLOW=g=>{const x=NAV.find(n=>n[0]===g);return !!x&&x[1].some(i=>canSee(i[1]))};
const groupOf=k=>{const x=NAV.find(n=>n[1].some(i=>i[1]===k));return x?x[0]:""};
const homeFor=r=>{const was=role;role=r;let h="dash";if(!canSee("dash")){for(const g of NAV)for(const i of g[1])if(canSee(i[1])){h=i[1];role=was;return h}}role=was;return r===R.EMP?"work":h};
const META=new Proxy({},{get:(_,k)=>PAGES[k]?[PAGES[k].title,PAGES[k].desc]:["",""]});

/* ----- tables, tabs, paging ----- */
const PGS={},TAB={},CSVS={};
function tbl(cols,rows,o={}){if(!rows.length)return`<div class="card"><div class="empty">${o.empty||"No records yet."}</div></div>`;return`<div class="card wrap"${o.csv?` data-csv="${o.csv}"`:""}><table><tr>${cols.map(c=>`<th>${c}</th>`).join("")}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`}
function ptbl(key,cols,rows,o={}){const ps=o.ps||15,n=Math.max(1,Math.ceil(rows.length/ps));let p=PGS[key]||0;if(p>=n)p=n-1;PGS[key]=p;const ck=o.csv||key;CSVS[ck]={cols,rows};
 return tbl(cols,rows.slice(p*ps,p*ps+ps),{...o,csv:ck})+(n>1?`<div class="bar" style="margin-top:10px"><button class="b" data-pgk="${key}:-1" ${p?"":"disabled"}>Previous</button><span>Page ${p+1} of ${n} · ${rows.length} records</span><button class="b" data-pgk="${key}:1" ${p>=n-1?"disabled":""}>Next</button></div>`:"")}
const csvBtn=(name,cols,rows)=>{CSVS[name]={cols,rows};return`<button class="b" data-act="xlsx:${name}">Export Excel</button> <button class="b" data-act="csv:${name}">Copy as CSV</button>`};
function tabs(key,items,def){const cur=TAB[key]||def||items[0][0];return`<div class="tabs" role="tablist">${items.map(([k,l])=>`<button role="tab" aria-selected="${k===cur}" class="tab ${k===cur?"on":""}" data-tab="${key}:${k}">${l}</button>`).join("")}</div>`}
const tab=(key,def)=>TAB[key]||def;
let STD={},STDN=0;
const dlink=(text,fn,go)=>{const id="sd:"+(STDN++);STD[id]={fn,go};return`<button class="lnk" data-d="${id}" title="Click for details">${text}</button>`};
const empRows=A=>A.map(e=>[e.no,e.name,e.dept,e.status,e.hire]),EMC=["No.","Name","Department","Status","Hire date"];
const stat=(l,v,s,fn,go)=>{const vs=typeof v==="string"&&plain(v).length>9?' style="font-size:18px;line-height:36px"':"";const body=`<span class="l">${l}</span><span class="v"${vs}>${v}</span>${s?`<span class="d">${s}</span>`:""}`;if(!fn)return`<div class="card k">${body}</div>`;const id="sd:"+(STDN++);STD[id]={fn,go};return`<button class="card k" data-d="${id}" style="text-align:left;cursor:pointer" title="Click for details">${body}</button>`};
const note=(t,c)=>`<div class="notice ${c||"sm"}">${t}</div>`;
const forbid=t=>`<div class="card"><div class="empty">${t||"Your role cannot use this action."}</div></div>`;
const secH=(t,right)=>`<div class="sech"><h2 class="sec">${t}</h2>${right||""}</div>`;

/* ----- delegated actions and forms ----- */
const ACTS={},FORMS={};
document.addEventListener("click",ev=>{const t=ev.target.closest("[data-act],[data-tab],[data-pgk]");if(!t)return;
 if(t.dataset.tab){const[k,v]=t.dataset.tab.split(":");TAB[k]=v;PGS[k]=0;draw();return}
 if(t.dataset.pgk){const[k,d]=t.dataset.pgk.split(":");PGS[k]=(PGS[k]||0)+ +d;draw();return}
 const i=t.dataset.act.indexOf(":"),a=i<0?t.dataset.act:t.dataset.act.slice(0,i),r=i<0?"":t.dataset.act.slice(i+1);if(ACTS[a])ACTS[a](r,t)});
document.addEventListener("submit",ev=>{const f=ev.target.closest("[data-form]");if(!f)return;ev.preventDefault();const fn=FORMS[f.dataset.form];if(!fn)return;
 const er=fn(Object.fromEntries(new FormData(f)),f),box=f.querySelector(".err")||(f.parentElement&&f.parentElement.querySelector(".err"));if(box)box.textContent=er||"";if(er&&typeof er==="string"&&typeof learnReq==="function")learnReq(f,er)});
ACTS.csv=n=>{const c=CSVS[n];if(!c)return;const q=v=>'"'+plain(v).replace(/"/g,'""').replace(/^([=+\-@])/,"'$1")+'"',t=[c.cols,...c.rows].map(r=>r.map(q).join(",")).join("\n");
 const done=()=>toast("Copied "+c.rows.length+" rows as CSV"),fb=()=>{const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();try{document.execCommand("copy")}catch(e){}a.remove();done()};
 try{navigator.clipboard.writeText(t).then(done,fb)}catch(e){fb()}};
/* dialog with optional reason / choice */
function ask(msg,label,fn,o={}){$("#cm").textContent=msg;const y=$("#cy"),r=$("#cr"),s=$("#cs");y.textContent=label;r.hidden=!o.reason;r.value="";s.hidden=!o.choices;if(o.choices)s.innerHTML=o.choices.map(c=>`<option>${esc(c)}</option>`).join("");$("#cerr").textContent="";$("#confirm").hidden=false;(o.reason?r:y).focus();
 y.onclick=()=>{if(o.reason&&!r.value.trim()){$("#cerr").textContent="Enter a reason.";return}$("#confirm").hidden=true;fn(r.value.trim(),s.value)};$("#cn").onclick=()=>{$("#confirm").hidden=true}}
const fld=(l,name,type,o={})=>`<label>${l}${o.req?"*":""}${type==="select"?`<select name="${name}" ${o.req?"required":""}>${(o.opts||[]).map(x=>Array.isArray(x)?`<option value="${esc(x[0])}" ${x[0]===o.val?"selected":""}>${esc(x[1])}</option>`:`<option ${x===o.val?"selected":""}>${esc(x)}</option>`).join("")}</select>`:type==="area"?`<textarea name="${name}" rows="${o.rows||3}" ${o.req?"required":""}>${esc(o.val||"")}</textarea>`:`<input name="${name}" type="${type}" value="${esc(o.val==null?"":o.val)}" ${o.req?"required":""} ${o.step?`step="${o.step}"`:""} ${o.min!=null?`min="${o.min}"`:""}></label>`.replace(/<\/label>$/,"")}</label>`;

/* ----- shell: nav, draw ----- */
const IC={"my_req":"M9 12l2 2 4-4M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20","hr_req":"M4 4h16v13H7l-3 3zM8 9h8M8 13h5","dash": "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z", "paydash": "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 12h.01M18 12h.01", "appr": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M9 12l2 2 4-4", "work": "M3 10.5 12 3l9 7.5V21H3zM9 21v-6h6v6", "emp": "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M21 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8", "profile": "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4M5 16c.5-1.5 1.8-2 3-2s2.5.5 3 2M14 9h5M14 13h4", "org": "M9 3h6v5H9zM3 16h6v5H3zM15 16h6v5h-6zM12 8v4M6 16v-4h12v4", "depts": "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18zM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4", "positions": "M3 7h18v13H3zM8 7V4h8v3M3 13h18", "contracts": "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5", "docs": "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "att_d": "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 16l2 2 4-4", "att_m": "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01", "timesheets": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2", "shifts": "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3", "overtime": "M10 2h4M12 14l3-3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16", "exceptions": "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01", "leave_req": "M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z", "leave_bal": "M21.2 15.9A10 10 0 1 1 8 2.8M22 12A10 10 0 0 0 12 2v10z", "leave_cal": "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM17 14h-6M13 18H7M7 14h.01M17 18h.01", "leave_pol": "M2 4h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z", "pay_periods": "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM12 14v3.5l2 1.5", "pay_proc": "M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4", "pay_reg": "M3 5h18v14H3zM3 10h18M3 15h18M9 5v14", "payslips": "M4 2v20l3-2 2.5 2L12 20l2.5 2L17 20l3 2V2zM8 7h8M8 11h8M8 15h5", "pay_comp": "M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5", "comp": "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4", "pay_var": "M22 7l-8.5 8.5-5-5L2 17M16 7h6v6", "pay_rec": "M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4", "pay_fs": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9", "recruit": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6", "onboard": "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14l2 2 4-4", "offboard": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 11h-6", "perf": "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z", "training": "M22 10 12 5 2 10l10 5zM6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 10v6", "rep_hr": "M3 3v18h18M8 17v-6M13 17V7M18 17v-3", "rep_att": "M22 12h-4l-3 9L9 3l-3 9H2", "rep_pay": "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 18v-3M12 18v-6M16 18v-2", "rep_head": "M18 21a8 8 0 0 0-16 0M10 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10M22 20c0-3.4-1.9-6.4-5-7.5M16 3.3a5 5 0 0 1 0 9.4", "rep_cx": "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM10 14l4 4M14 14l-4 4", "rep_cost": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M15 9.5a3 3 0 0 0-3-1.5c-1.7 0-3 .9-3 2s1.3 1.6 3 2 3 .9 3 2-1.3 2-3 2a3 3 0 0 1-3-1.5M12 6v2M12 16v2", "wf": "M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 9a9 9 0 0 1-9 9", "notif": "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0", "users": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M16 11l2 2 4-4", "perms": "M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4", "integ": "M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z", "auditlog": "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2", "company": "M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"};
const ic=k=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[k]||IC.dash}"/></svg>`;
const ini=n=>String(n||"").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
let FM=false;
const GIC={Overview:"dash",People:"emp","Time & Attendance":"timesheets",Leave:"leave_cal",Payroll:"paydash",Talent:"perf",Reports:"rep_hr",Administration:"perms"};
let GOPEN={},LASTPG="";try{GOPEN=JSON.parse(localStorage.getItem("smr_gopen")||"{}")}catch(e){}
const CHEV='<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
function nav(){const AC=canSee("appr")?apprItems().filter(canAct).length:0;if(LASTPG!==page){GOPEN[groupOf(page)]=true;LASTPG=page;try{localStorage.setItem("smr_gopen",JSON.stringify(GOPEN))}catch(e){}}
 $("#nav").innerHTML=NAV.filter(([g])=>ALLOW(g)).map(([g,items])=>{const open=GOPEN[g]!==undefined?GOPEN[g]:g==="Overview";return`<div class="grp2 ${open?"open":""}"><button class="gh" data-grp="${g}" aria-expanded="${open}">${ic(GIC[g])}<span class="lb">${g}</span>${CHEV}</button><div class="gl">`+items.filter(([n,k])=>canSee(k)).map(([n,k])=>`<button class="nav ${k===page?"on":""}" data-k="${k}" title="${n}">${ic(k)}<span class="lb">${n}</span>${k==="appr"&&AC?`<span class="cnt">${AC}</span>`:""}</button>`).join("")+`</div></div>`}).join("");
 document.querySelectorAll(".nav[data-k]").forEach(b=>b.onclick=()=>{page=b.dataset.k;PG=0;$("#side").classList.remove("open");closeDr();draw();window.scrollTo(0,0)});
 document.querySelectorAll(".gh").forEach(b=>b.onclick=()=>{const g=b.dataset.grp,o=b.parentElement.classList.toggle("open");GOPEN[g]=o;b.setAttribute("aria-expanded",o);try{localStorage.setItem("smr_gopen",JSON.stringify(GOPEN))}catch(e){}})}
function go(k){if(canSee(k)){page=k;PG=0;closeDr();draw();window.scrollTo(0,0)}}
function updBell(){const b=$("#bdg");if(!canSee("dash")){b.hidden=true;return}const m=page==="dash"?M:build(),n=m.alerts.filter(a=>a[0]!=="low"&&a[3]).length;b.textContent=n;b.hidden=!n}
function openNotif(){if(!canSee("dash"))return;const m=build(),order={high:0,med:1,low:2};LASTDRILL=null;$("#dt").textContent="Notifications";$("#dd").textContent="Items that need attention, most urgent first. Select one to see the records.";
 $("#db").innerHTML=m.alerts.filter(a=>a[3]).sort((a,b)=>order[a[0]]-order[b[0]]).map(([sv,t,id,n])=>`<button class="al" data-d="${id}"><i class="sv ${sv}"></i><span>${t}</span><span class="badge ${sv==="high"?"s-er":sv==="med"?"s-wn":"s-mu"}">${n}</span></button>`).join("")||`<div class="empty">Nothing needs attention right now.</div>`;$("#dx").hidden=true;$("#drawer").classList.add("open");$("#dcl").focus()}
const PACT={dash:()=>`${canSee("appr")?`<button class="b" data-go="appr">${ic("appr")} Approvals</button>`:""}${canSee("pay_proc")?`<button class="b p" data-go="pay_proc">${ic("pay_proc")} Payroll run</button>`:""}<button class="b" id="rf"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-15-6.7L3 8M3 3v5h5M3 12a9 9 0 0 0 15 6.7L21 16M21 21v-5h-5"/></svg> Refresh</button>`};
function draw(){if(!canSee(page))page=homeFor(role);document.body.classList.toggle("pdash",page==="dash");const pg=PAGES[page];$("#title").textContent=pg.title;$("#desc").textContent=pg.desc;nav();
 $("#crumb").innerHTML=`<b>SMR HRMS &amp; Payroll</b><span>· Savills Management Resources Egypt</span>`;$("#pact").innerHTML=PACT[page]?PACT[page]():"";trackNav();
 document.querySelectorAll("[data-mode]").forEach(b=>{const on=b.dataset.mode===MODE;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});
 $("#me").textContent=ini(typeof SSES!=="undefined"&&SSES?SSES.name:typeof ESES!=="undefined"&&ESES?(empBy(ESES.no)||{name:role}).name:role);$("#gs").disabled=!canSee("emp");$("#gs").placeholder=canSee("emp")?"Search employees":"Search not available";
 $("#strip").innerHTML=(MODE==="sample"?`<span class="chip">Sample data</span><span>Generated for demonstration. These are not real SMR employees or records.</span>`:`<span class="chip">My records</span><span>Only what you entered. Modules without data show empty states.</span>`)+`<span class="grow"></span><span class="mu">Prototype: data and roles stay in this browser.</span>`;
 $("#view").innerHTML=pg.fn();linkify($("#view"));wire();updBell()}
document.addEventListener("click",ev=>{const t=ev.target.closest("[data-go]");if(t)go(t.dataset.go)});

/* every employee number or name in any table opens that employee's profile */
function linkify(root){if(!root)return;root.querySelectorAll("td").forEach(td=>{if(!td.children.length&&td.textContent.length>26)td.classList.add("wr");else if(td.textContent.trim().length<=24)td.classList.add("nw")});if(!canSee("profile"))return;const byNo=new Map(allEmps().map(e=>[e.no,e])),cnt={};allEmps().forEach(e=>cnt[e.name]=(cnt[e.name]||0)+1);
 root.querySelectorAll("tr").forEach(tr=>{const tds=[...tr.querySelectorAll("td")];if(!tds.length)return;
  const plainTd=td=>!td.children.length&&td.textContent.trim();let no=null;
  for(const td of tds){const t=plainTd(td);if(t&&byNo.has(t)){no=t;break}}
  tds.forEach(td=>{const t=plainTd(td);if(!t)return;let target=null;
   if(byNo.has(t))target=t;else if(no&&byNo.get(no).name===t)target=no;else if(!no&&cnt[t]===1){const e=allEmps().find(x=>x.name===t);if(e)target=e.no}
   if(target){td.innerHTML=`<button class="lnk" data-act="prof:${esc(target)}">${esc(t)}</button>`}})})}

/* ----- history: Back button, Alt+Left, browser back via #hash ----- */
let HIST=[],BACKING=false,HASHSET="";
const hk=k=>k.replace(/_/g,"-"),unhk=h=>Object.keys(PAGES).find(k=>hk(k)===h);
function trackNav(){const top=HIST[HIST.length-1],cur={page,prof:typeof PROF!=="undefined"?PROF:""};
 if(!BACKING&&(!top||top.page!==cur.page||(cur.page==="profile"&&top.prof!==cur.prof))){HIST.push(cur);if(HIST.length>40)HIST.shift()}
 BACKING=false;try{const h=hk(page);if(location.hash.slice(1)!==h){HASHSET=h;location.hash=h}}catch(e){}
 const b=$("#backl"),prev=HIST[HIST.length-2];if(b){b.hidden=!prev;if(prev){const t=PAGES[prev.page]?PAGES[prev.page].title:"";b.innerHTML=`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg> Back to ${esc(t)}`}}}
function goBack(){if(HIST.length<2)return;HIST.pop();const p=HIST[HIST.length-1];BACKING=true;page=p.page;if(p.prof)PROF=p.prof;closeDr();draw();window.scrollTo(0,0)}
document.addEventListener("click",ev=>{if(ev.target.closest("#backl"))goBack()});
document.addEventListener("keydown",ev=>{if(ev.altKey&&ev.key==="ArrowLeft"){ev.preventDefault();goBack()}});
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(HASHSET===h){HASHSET="";return}const k=unhk(h);if(k&&k!==page&&canSee(k)){const i=HIST.map(x=>x.page).lastIndexOf(k);if(i>=0){HIST.length=i+1;const p=HIST[i];BACKING=true;if(p.prof)PROF=p.prof}page=k;closeDr();draw()}});

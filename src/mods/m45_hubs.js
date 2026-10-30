/* ===== m45: simpler navigation. The menu shows a few hubs; related pages become tabs inside each hub. Settings get one index page. ===== */
const HUBS=[
 {g:"Home",n:"Dashboard",ic:"dash",p:[["Summary","dash"]]},
 {g:"Home",n:"Inbox",ic:"appr",p:[["Approvals","appr"],["HR requests","hr_req"],["Notifications","notif"]]},
 {g:"Home",n:"My portal",ic:"work",p:[["My portal","work"],["My profile","myprofile"]]},
 {g:"People",n:"Employees",ic:"emp",p:[["Directory","emp"],["Organization chart","org"],["Reporting lines","reporting"],["Departments","depts"],["Job positions","positions"]]},
 {g:"People",n:"Contracts & records",ic:"contracts",p:[["Contracts","contracts"],["Probation","probation"],["Documents","docs"],["Warnings","warns"],["Offboarding","offboard"]]},
 {g:"Time & pay",n:"Attendance",ic:"att_d",p:[["Daily","att_d"],["Monthly","att_m"],["Timesheets","timesheets"],["Shifts","shifts"],["Overtime","overtime"],["Exceptions","exceptions"]]},
 {g:"Time & pay",n:"Leave",ic:"leave_req",p:[["Requests","leave_req"],["Balances","leave_bal"],["Calendar","leave_cal"],["Policies","leave_pol"]]},
 {g:"Time & pay",n:"Payroll",ic:"pay_proc",p:[["Overview","paydash"],["Run payroll","pay_proc"],["Inputs","pay_inputs"],["Loans","loans"],["Payslips","payslips"],["Final settlements","settle"]]},
 {g:"Manage",n:"Reports",ic:"reports",p:[["All reports","reports"]]},
 {g:"Manage",n:"Settings",ic:"company",p:[["Settings","settings"]]}];
const SETG=[["Organization",[["company","Company details, logo and work week"],["cost_centers","Projects and cost centers used in payroll"],["holidays","Official holidays for the year"]]],
 ["People and access",[["users","Sign-in accounts and roles"],["perms","Which pages each role can open"],["emp_access","Employee self-service sign-in"],["wf","Who approves leave, overtime and requests"]]],
 ["Payroll",[["pay_periods","Open and close payroll months"],["pay_comp","Allowances and deductions"],["comp","Tax and social insurance rules"]]],
 ["Leave",[["leave_pol","Entitlements and carry-forward"]]],
 ["Email",[["mail_set","Sender and email templates"],["mail_out","Emails waiting to be sent"]]],
 ["System",[["integ","Connections to other systems"],["auditlog","Who changed what, and when"]]]];
const SETK=SETG.flatMap(g=>g[1].map(x=>x[0]));
function hubOf(k){if(SETK.includes(k))return HUBS.find(h=>h.n==="Settings");return HUBS.find(h=>h.p.some(x=>x[1]===k))||null}
function hubKey(h){const x=h.p.find(x=>canSee(x[1]));return x?x[1]:null}
/* menu: one entry per hub, pointing to the first page this role can open */
function NAVV(){if(role===R.EMP){return[["Home",[["My portal","work"],["My profile","myprofile"],["HR requests","hr_req"],["Notifications","notif"]].filter(i=>canSee(i[1]))],["Time & pay",[["Leave","leave_req"],["Leave balances","leave_bal"],["Leave calendar","leave_cal"],["Payslips","payslips"]].filter(i=>canSee(i[1]))]].filter(([g,it])=>it.length)}
 const out=[];HUBS.forEach(h=>{const k=hubKey(h);if(!k)return;let G=out.find(x=>x[0]===h.g);if(!G){G=[h.g,[]];out.push(G)}G[1].push([h.n,k])});
 try{out.forEach(([g])=>{GOPEN[g]=true})}catch(e){}return out}
function NAVACT(k){if(k===page)return true;if(role===R.EMP)return false;const a=hubOf(k),b=hubOf(page);if(a&&b&&a===b)return true;return k==="reports"&&typeof REPKEYS!=="undefined"&&REPKEYS.includes(page)&&page!=="auditlog"}
function NAVGRP(k){const h=hubOf(k);return h?h.g:""}
/* settings index */
function settingsPage(){const sec=SETG.map(([g,L])=>{const it=L.filter(([k])=>PAGES[k]&&canSee(k));return it.length?`<section class="stg"><h2>${esc(g)}</h2><div class="stl">${it.map(([k,d])=>`<button class="sti" data-go="${k}">${ic(k)}<span><b>${esc(PAGES[k].title)}</b><small>${esc(d)}</small></span><svg class="ic sta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`).join("")}</div></section>`:""}).join("");
 return sec||`<div class="card"><div class="empty">Your role has no settings to manage.</div></div>`}
(function(){const ks=new Set();SETK.forEach(k=>{if(PAGES[k])(PAGES[k].roles||[]).forEach(r=>ks.add(r))});reg("settings","Settings","Company setup, access, payroll rules and email. Pick an area to change.",[...ks],settingsPage)})();
/* tabs inside a hub, shown above the page title */
function hubStrip(){const main=document.querySelector("main"),ph=main&&main.querySelector(".ph");if(!main||!ph)return;let s=main.querySelector(".hubt");const h=role===R.EMP?null:hubOf(page);
 let html="";
 if(h&&h.n==="Settings"&&page!=="settings")html=`<nav class="hubt hubs" aria-label="Settings"><button class="hbk" data-go="settings"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>Settings</button></nav>`;
 else if(h){const vis=h.p.filter(x=>PAGES[x[1]]&&canSee(x[1]));if(vis.length>1)html=`<nav class="hubt" aria-label="${esc(h.n)}"><div class="hubr" role="tablist">${vis.map(([l,k])=>`<button role="tab" aria-selected="${k===page}" class="${k===page?"on":""}" data-go="${k}">${esc(l)}</button>`).join("")}</div></nav>`}
 const key=page+"|"+role+"|"+html.length;if(s&&s.dataset.k===key)return;if(s)s.remove();if(!html)return;ph.insertAdjacentHTML("beforebegin",html);s=main.querySelector(".hubt");s.dataset.k=key;
 const on=s.querySelector(".on");if(on&&on.scrollIntoView)try{on.scrollIntoView({block:"nearest",inline:"nearest"})}catch(e){}}
(function(){const go=()=>{const v=document.getElementById("view");if(!v)return setTimeout(go,50);hubStrip();new MutationObserver(hubStrip).observe(v,{childList:true})};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go()})();
try{IC.settings=IC.mail_set||IC.company;IC.paydash=IC.pay_proc||IC.paydash}catch(e){}

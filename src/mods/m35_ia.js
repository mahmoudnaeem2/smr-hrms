/* Information architecture: a short, friendly menu and one Reports hub */
const REPKEYS=["rep_hr","rep_head","rep_dp","rep_cx","completeness","reporting","rep_att","rep_leave","leave_bal","rep_pay","rep_cost","pay_reg","pay_var","pay_rec","pay_je","pay_fs","auditlog"];
NAV.splice(0,NAV.length,
 ["Home",[["Dashboard","dash"],["Payroll Dashboard","paydash"],["Approvals","appr"],["My Portal","work"],["My Profile","myprofile"],["HR Requests","hr_req"],["Notifications","notif"]]],
 ["People",[["Employee Directory","emp"],["Organization Chart","org"],["Reporting Lines","reporting"],["Departments","depts"],["Job Positions","positions"],["Contracts","contracts"],["Probation Tracker","probation"],["Documents","docs"],["Warnings","warns"],["Offboarding","offboard"]]],
 ["Time & Leave",[["Daily Attendance","att_d"],["Monthly Attendance","att_m"],["Timesheets","timesheets"],["Shifts & Scheduling","shifts"],["Overtime","overtime"],["Exceptions","exceptions"],["Leave Requests","leave_req"],["Leave Balances","leave_bal"],["Leave Calendar","leave_cal"]]],
 ["Payroll",[["Payroll Processing","pay_proc"],["Payroll Inputs","pay_inputs"],["Loans","loans"],["Payslips","payslips"],["Final Settlements","settle"]]],
 ["Reports",[["All Reports","reports"]]],
 ["Settings",[["Company","company"],["Users","users"],["Roles & Permissions","perms"],["Employee Access","emp_access"],["Approval Workflows","wf"],["Cost Centers & Projects","cost_centers"],["Payroll Periods","pay_periods"],["Salary Components","pay_comp"],["Tax & Insurance","comp"],["Public Holidays","holidays"],["Leave Policies","leave_pol"],["Email Settings","mail_set"],["Email Outbox","mail_out"],["Integrations","integ"],["Audit Logs","auditlog"]]]);
IC.reports=IC.rep_hr;IC.reporting=IC.org;
GIC.Reports="rep_hr";GIC.Payroll="paydash";
function NAVV(){if(role===R.EMP){const pick=(g,ks)=>{const it=[];NAV.forEach(([,l])=>l.forEach(i=>{if(ks.includes(i[1])&&canSee(i[1]))it.push(i)}));return[g,ks.map(k=>it.find(i=>i[1]===k)).filter(Boolean)]};return[pick("Home",["work","myprofile","hr_req","notif"]),pick("Time & Leave",["leave_req","leave_bal","leave_cal","leave_pol"]),pick("Payroll",["payslips"])].filter(([g,it])=>it.length)}
 return NAV.map(([g,items])=>[g,items.filter(i=>canSee(i[1]))]).filter(([g,it])=>it.length)}
function NAVGRP(k){if(REPKEYS.includes(k)&&k!=="auditlog"&&k!=="reporting"&&k!=="leave_bal"&&k!=="pay_fs")return"Reports";if(k==="profile")return"People";const x=NAV.find(n=>n[1].some(i=>i[1]===k));return x?x[0]:""}
function NAVACT(k){return k===page||(k==="emp"&&page==="profile")||(k==="reports"&&["rep_hr","rep_head","rep_dp","rep_cx","completeness","rep_att","rep_leave","rep_pay","rep_cost","pay_reg","pay_var","pay_rec","pay_je"].includes(page))}
const RCATS=[["People & headcount","#14a39a","#dff5f2",["rep_hr","rep_head","rep_dp","rep_cx","completeness","reporting"]],
 ["Attendance & leave","#2f80ed","#e2eefd",["rep_att","rep_leave","leave_bal"]],
 ["Payroll & finance","#8a5cd1","#efe6fb",["rep_pay","rep_cost","pay_reg","pay_var","pay_rec","pay_je","pay_fs"]],
 ["Control & audit","#e5484d","#fde8e8",["auditlog"]]];
function reports(){const q=(TAB.rp_q||"").trim().toLowerCase(),vis=k=>PAGES[k]&&canSee(k),match=k=>!q||(PAGES[k].title+" "+PAGES[k].desc).toLowerCase().includes(q);
 const rec=[];const seen=new Set();HIST.slice().reverse().forEach(h=>{if(REPKEYS.includes(h.page)&&vis(h.page)&&!seen.has(h.page)&&rec.length<4){seen.add(h.page);rec.push(h.page)}});
 const card=(k,c,bg)=>`<button class="rpc" data-go="${k}" style="--rc:${c};--rb:${bg}"><span class="rpi"><svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[k]||IC.rep_hr}"/></svg></span><span class="rpt"><b>${esc(PAGES[k].title)}</b><small>${esc(PAGES[k].desc)}</small></span><svg class="rpa" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>`;
 const secs=RCATS.map(([t,c,bg,ks])=>{const L=ks.filter(k=>vis(k)&&match(k));return L.length?`<section class="rps"><h2>${t}<span>${L.length}</span></h2><div class="rpg">${L.map(k=>card(k,c,bg)).join("")}</div></section>`:""}).join("");
 return`<div class="bar"><input id="rpq" type="search" placeholder="Search reports" value="${esc(TAB.rp_q||"")}" style="flex:1 1 280px"></div>${!q&&rec.length?`<div class="rpr"><span class="mu">Recent:</span>${rec.map(k=>`<button class="chip2" data-go="${k}">${esc(PAGES[k].title)}</button>`).join("")}</div>`:""}${secs||`<div class="card"><div class="empty">No report matches "${esc(q)}".</div></div>`}<div class="cs">Every report can be exported to Excel from its own page. You only see the reports your role is allowed to open.</div>`}
reg("reports","Reports","Every report in one place. Pick one, or search by name.",A("HRD","HRS","DM","FIN","PAY"),reports);
document.addEventListener("input",ev=>{if(ev.target.id==="rpq"){TAB.rp_q=ev.target.value;const p=ev.target.selectionStart;draw();const n=$("#rpq");if(n){n.focus();n.setSelectionRange(p,p)}}});

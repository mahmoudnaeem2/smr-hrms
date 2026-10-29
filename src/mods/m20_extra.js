/* Payroll journal entry (finance review lens) */
function jeLines(run){const by={};run.results.forEach(x=>{const d=x.dept||"Unassigned";const o=by[d]||(by[d]={gross:0,er:0});o.gross+=x.gross||0;o.er+=Math.max(0,(x.cost||0)-(x.gross||0))});
 const T=k=>run.results.reduce((s,r)=>s+(r[k]||0),0),gross=T("gross"),net=T("net"),ins=T("empIns"),tax=T("tax"),cost=T("cost"),er=Math.max(0,cost-gross),oth=Math.round((gross-net-ins-tax)*100)/100;
 const dr=[],cr=[];Object.keys(by).sort().forEach(d=>{dr.push(["Salaries and wages",d,by[d].gross]);if(by[d].er>0)dr.push(["Employer social insurance expense",d,by[d].er])});
 cr.push(["Net salaries payable","",net],["Employee social insurance payable","",ins],["Income tax payable","",tax]);if(Math.abs(oth)>=.01)cr.push(["Loan, advance and other deductions (recoverable or payable)","",oth]);if(er>0)cr.push(["Employer social insurance payable","",er]);
 return{dr,cr}}
function pay_je(){if(!canSalV())return forbid("Salary data is restricted for your role.");const rs=rpRuns().sort((a,b)=>a.period<b.period?1:-1);if(!rs.length)return`<div class="card"><p class="mu">No calculated payroll yet. Calculate a payroll run first.</p></div>`;
 const id=TAB.jeRun||rs[0].id,run=rs.find(r=>String(r.id)===String(id))||rs[0],L=jeLines(run),sd=L.dr.reduce((s,x)=>s+x[2],0),sc=L.cr.reduce((s,x)=>s+x[2],0),ok=Math.abs(sd-sc)<.01;
 const rows=[...L.dr.map(x=>[esc(x[0]),esc(x[1]),fmtC(x[2]),""]),...L.cr.map(x=>[esc(x[0]),esc(x[1]),"",fmtC(x[2])]),["<b>Total</b>","","<b>"+fmtC(sd)+"</b>","<b>"+fmtC(sc)+"</b>"]];
 return`<div class="bar"><label>Payroll run<select data-je>${rs.map(r=>`<option value="${esc(String(r.id))}" ${r===run?"selected":""}>${esc(runLabel(r))}</option>`).join("")}</select></label></div>${tbl(["Account","Department","Debit","Credit"],rows)}<div class="card" style="margin-top:12px"><b>Review checklist</b><ul><li>Debits equal credits: ${ok?"<b>Yes</b>":"<b style='color:#b00020'>No, check the run</b>"}</li><li>Status of the run: ${esc(RS[run.status]||run.status)}${FINAL.includes(run.status)?"":" (not final yet, this entry is a draft)"}</li><li>${run.test?"This run used trial or test rules, do not post it.":"Rules used are approved for this period."}</li><li>Account codes: map each line to your chart of accounts before posting. They are not set here.</li></ul><div class="err"></div><button class="b p" data-act="je_csv:${esc(String(run.id))}">Download CSV</button></div>`}
ACTS.je_csv=id=>{const run=rpRuns().find(r=>String(r.id)===String(id));if(!run)return;const L=jeLines(run),q=v=>'"'+String(v).replace(/"/g,'""')+'"',lines=[["Account","Department","Debit","Credit","Memo"],...L.dr.map(x=>[x[0],x[1],x[2].toFixed(2),"","Payroll "+run.period]),...L.cr.map(x=>[x[0],x[1],"",x[2].toFixed(2),"Payroll "+run.period])].map(r=>r.map(q).join(",")).join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+lines],{type:"text/csv"}));a.download="payroll-journal-"+run.period+".csv";document.body.appendChild(a);a.click();a.remove();audit("Payroll journal exported",run.period);toast("Journal entry exported")};
document.addEventListener("change",ev=>{const s=ev.target.closest("[data-je]");if(s){TAB.jeRun=s.value;draw()}});
reg("pay_je","Payroll Journal Entry","Accounting entry for a payroll run: expense by department against payables. Draft for Finance review.",A("PAY","FIN","HRD"),pay_je);
NAV.forEach(g=>{if(g[0]==="Payroll"){const i=g[1].findIndex(x=>x[1]==="pay_rec");g[1].splice(i<0?g[1].length:i+1,0,["Payroll Journal Entry","pay_je"])}});
/* Org health metrics (people analytics lens) */
function orgHealth(){const L=ALLE().filter(e=>e.status!=="Terminated");if(L.length<2)return"";const names=new Set(L.map(e=>e.name)),sp=L.map(m=>({n:m.name,k:L.filter(e=>e.mgr===m.name).length})).filter(x=>x.k>0),avg=sp.length?(sp.reduce((s,x)=>s+x.k,0)/sp.length).toFixed(1):"0",mx=sp.sort((a,b)=>b.k-a.k)[0],noMgr=L.filter(e=>!e.mgr||(!names.has(e.mgr)&&e.mgr!=="Executive team")).length,ten=L.filter(e=>e.hire).map(e=>(T0-new Date(e.hire+"T00:00:00"))/31557600000),at=ten.length?(ten.reduce((a,b)=>a+b,0)/ten.length).toFixed(1):"–",miss=L.filter(e=>!e.dob||!e.nid||!e.mobile||!e.ecn).length;
 return`<div class="card" style="margin-top:14px"><h2>Organization health</h2>${tbl(["Measure","Value","What it tells you"],[["Average span of control",avg,"Direct reports per manager. 5 to 8 is a common healthy range."],["Widest span",mx?esc(mx.n)+" ("+mx.k+")":"–","A very wide span means one manager carries too much."],["People without a valid manager",noMgr,"They are missing from reporting lines and approval routing."],["Average tenure (years)",at,"Low tenure with growth is normal; a sudden drop signals attrition."],["Records with missing personal data",miss,"Date of birth, ID, mobile or emergency contact is empty."]])}</div>`}

/* Add employee (new record through the same full form) */
const nextEmpNo=()=>{const n=allEmps().map(e=>+(String(e.no).match(/(\d+)$/)||[0,0])[1]);return"E-"+String(Math.max(0,...n)+1).padStart(4,"0")};
ACTS.eadd=()=>{if(!canEditEmp())return toast("Only HR Director or HR Specialist can add employees.");if(MODE==="sample")return toast("Sample data is read-only.");
 const e={no:nextEmpNo(),name:"",status:"Active",type:"Full-time",nat:"Egyptian",loc:"Head Office",hire:iso(T0),sched:SCHEDS[0],dept:DEPTS[0]||"",project:"",bank:false,basic:0,allow:0};
 $("#dt").textContent="Add employee";$("#dd").textContent="Employee number "+e.no+" is assigned automatically.";
 let h=empForm(e,"full");const sal=`<div class="cs" style="grid-column:1/-1"><b>Starting salary</b> (later changes are made as approved, dated revisions in Compensation)</div><label>Basic salary (EGP, monthly)<input name="n_basic" type="number" placeholder="0" required></label>${ALWT.map(([k,l])=>`<label>${l} allowance (EGP)<input name="n_${k}" type="number" placeholder="0"></label>`).join("")}<div class="cs" style="grid-column:1/-1">Allowances are listed by type so the payslip and reports show what each one is. The total is added up for you.</div>`;
 h=h.replace('<input type="hidden" name="scope" value="full">','<input type="hidden" name="scope" value="full"><input type="hidden" name="isnew" value="1">'+'');
 h=h.replace(/(<button[^>]*type="submit"[^>]*>)/,sal+"$1");
 $("#db").innerHTML=h;$("#dx").hidden=true;const x=$("#dxx");if(x)x.hidden=true;$("#drawer").classList.add("open")};
(()=>{const orig=FORMS.empEdit2;FORMS.empEdit2=o=>{if(!o.isnew)return orig(o);
 if(!canEditEmp())return"Only HR Director or HR Specialist can add employees.";
 const num=v=>+String(v==null||v===""?0:v).replace(/,/g,""),bs=num(o.n_basic),alw={};let al=0;if(!(bs>=0)||o.n_basic===""||isNaN(bs))return"Enter the basic salary.";for(const[k,l]of ALWT){const v=num(o["n_"+k]);if(isNaN(v)||v<0)return l+" allowance must be zero or more.";if(v>0){alw[k]=v;al+=v}}
 if(allEmps().some(x=>x.no===o.no))return"Employee number already used, close and try again.";
 if(allEmps().some(x=>x.nid&&o.nid&&String(x.nid)===String(o.nid).trim()))return"An employee with this National ID or passport number already exists.";
 const d={no:o.no,name:"",status:"Active",type:"Full-time",nat:"Egyptian",loc:"",hire:"",sched:SCHEDS[0],dept:"",project:"",bank:false,basic:0,allow:0,mgr:"",coach:"",lapp:"",tapp:""};E.push(d);
 const r=orig(o);if(typeof r==="string"&&r){E.splice(E.indexOf(d),1);return r}
 empSet(o.no,{basic:bs,allow:al,alw});LOGC(o.no,"New joiner","Added to the system, start "+(o.hire||"")+", basic "+bs);audit("Employee added",o.no+" — "+o.name);save();return r}})();

/* Public holidays and weekend (drive working-day counts everywhere) */
function HOLS(){return db("hols",[],false)}
function WKOPTF(){return{"Fri–Sat":[5,6],"Sat–Sun":[6,0],"Friday only":[5],"Sunday only":[0]}}
function WKD(){return WKOPTF()[db("wkcfg",{w:"Fri–Sat"},false).w]||[5,6]}
function holidays(){const can=[R.HRD,R.HRS].includes(role),L=HOLS().slice().sort((a,b)=>a.d<b.d?1:-1),wk=db("wkcfg",{w:"Fri–Sat"},false).w;
 return`${can?`<div class="card"><h2>Weekly rest days</h2><form class="g" data-form="wkend"><label>Weekend<select name="w">${Object.keys(WKOPTF()).map(k=>`<option ${k===wk?"selected":""}>${k}</option>`).join("")}</select></label><button class="b p" type="submit">Save</button></form><div class="err"></div></div>`:`<div class="note">Weekend: <b>${esc(wk)}</b></div>`}
 ${can?`<div class="card" style="margin-top:12px"><h2>Add a public holiday</h2><form class="g" data-form="hol">${fld("Date","d","date",{req:1})}${fld("Name","n","text",{req:1})}<button class="b p" type="submit">Add holiday</button></form><div class="err"></div></div>`:""}
 <h2 class="sec">Holidays entered (${L.length})</h2>${tbl(["Date","Holiday","Weekday",can?"":""],L.map(h=>[h.d,esc(h.n),new Date(h.d+"T00:00:00").toLocaleDateString("en",{weekday:"long"}),can?`<button class="b s" data-act="hol_x:${esc(h.d)}">Remove</button>`:""]),{empty:"No holidays entered yet. Enter the official dates each year; they are not working days for leave, attendance and payroll proration."})}
 ${note("Dates of official holidays are announced each year (the religious ones move), so they are entered here by HR rather than preset.")}`}
FORMS.hol=o=>{if(![R.HRD,R.HRS].includes(role))return"Only HR can change holidays.";const n=o.n.trim();if(!o.d||!n)return"Enter the date and the name.";if(HOLS().some(h=>h.d===o.d))return"A holiday is already entered for that date.";HOLS().push({d:o.d,n});sv("hols",false);audit("Public holiday added",o.d+" "+n);toast("Holiday added");draw()};
FORMS.wkend=o=>{if(![R.HRD,R.HRS].includes(role))return"Only HR can change the weekend.";db("wkcfg",{w:"Fri–Sat"},false).w=o.w;sv("wkcfg",false);audit("Weekend changed",o.w);toast("Weekend saved");draw()};
ACTS.hol_x=d=>{if(![R.HRD,R.HRS].includes(role))return;ask("Remove the holiday on "+d+"?","Remove",()=>{const a=HOLS(),i=a.findIndex(h=>h.d===d);if(i>=0)a.splice(i,1);sv("hols",false);audit("Public holiday removed",d);draw()})};
reg("holidays","Public Holidays","Official holidays and the weekly rest days. They are not working days for leave, attendance and payroll.",A("HRD","HRS","PAY","FIN","DM"),holidays);
NAV.forEach(g=>{if(g[0]==="Time & Attendance")g[1].push(["Public Holidays","holidays"])});
/* Departments: rename, remove, assign head */
function depts2(){const L=ALLE().filter(e=>empAt(e,iso(T0))),can=[R.HRD].includes(role),H=db("dhead",{},false);
 const rows=DEPTS.map(d=>{const x=L.filter(e=>e.dept===d),h=H[d]||"";return[esc(d),can?`<select data-dh="${esc(d)}"><option value="">–</option>${x.map(e=>`<option ${e.name===h?"selected":""}>${esc(e.name)}</option>`).join("")}</select>`:esc(h||"–"),x.length,canSal()?fmtC(C(x.reduce((s,e)=>s+e.basic+e.allow,0))):'<span class="mu">Restricted</span>',can?`<button class="b s" data-act="dp_ren:${esc(d)}">Rename</button> <button class="b s" data-act="dp_del:${esc(d)}">Remove</button>`:""]});
 return`${tbl(["Department","Head","Headcount","Monthly gross (fixed pay)",""],rows)}${can?`<div class="card" style="margin-top:14px"><h2>Add a department</h2><form class="g" data-form="dept">${fld("Name","name","text",{req:1})}<button class="b p" type="submit">Add department</button></form><div class="err"></div></div>`:""}`}
document.addEventListener("change",ev=>{const s=ev.target.closest("[data-dh]");if(s&&role===R.HRD){const H=db("dhead",{},false);H[s.dataset.dh]=s.value;sv("dhead",false);audit("Department head set",s.dataset.dh+": "+(s.value||"none"));toast("Head saved")}});
ACTS.dp_ren=d=>{if(role!==R.HRD)return;$("#dt").textContent="Rename department";$("#dd").textContent=d;$("#db").innerHTML=`<form class="g1" data-form="dpren"><input type="hidden" name="old" value="${esc(d)}">${fld("New name","nn","text",{req:1,val:d})}<button class="b p" type="submit">Rename</button></form><div class="err"></div>`;$("#dx").hidden=true;const x=$("#dxx");if(x)x.hidden=true;$("#drawer").classList.add("open")};
FORMS.dpren=o=>{const n=o.nn.trim();if(!n)return"Enter a name.";if(n===o.old){closeDr();return""}if(DEPTS.some(x=>x.toLowerCase()===n.toLowerCase()))return"That department already exists.";
 E.forEach(e=>{if(e.dept===o.old)e.dept=n});const i=DEPTS.indexOf(o.old);if(i>=0)DEPTS[i]=n;const dl=db("depts",[],false),j=dl.indexOf(o.old);if(j>=0)dl[j]=n;else dl.push(n);const H=db("dhead",{},false);if(H[o.old]){H[n]=H[o.old];delete H[o.old];sv("dhead",false)}save();sv("depts",false);audit("Department renamed",o.old+" → "+n);closeDr();toast("Department renamed");draw()};
ACTS.dp_del=d=>{if(role!==R.HRD)return;if(allEmps().some(e=>e.dept===d&&e.status!=="Terminated"))return toast("Move the employees out of "+d+" first.");ask("Remove the department "+d+"?","Remove",()=>{const i=DEPTS.indexOf(d);if(i>=0)DEPTS.splice(i,1);const dl=db("depts",[],false),j=dl.indexOf(d);if(j>=0)dl.splice(j,1);sv("depts",false);audit("Department removed",d);draw()})};
reg("depts","Departments","Departments, their heads and headcount. HR Director can rename, remove and set the head.",A("HRD","HRS","DM","FIN"),depts2);

document.addEventListener("click",ev=>{if(ev.target.closest(".nav[data-k]"))HIST.length=0},true);

/* Role-based sidebar: daily pages first, the rest under More */
const DAILY={[R.HRD]:["dash","appr","hr_req","mail_out","emp","org","leave_req","att_d","holidays","docs","warns","pay_proc","payslips","rep_hr"],
 [R.HRS]:["dash","appr","hr_req","mail_out","emp","org","leave_req","leave_bal","att_d","holidays","docs","warns","offboard"],
 [R.PAY]:["paydash","appr","pay_proc","pay_inputs","overtime","loans","pay_reg","payslips","pay_je","pay_rec","rep_pay"],
 [R.FIN]:["paydash","appr","pay_reg","pay_je","pay_rec","pay_fs","rep_cost","rep_pay","loans"],
 [R.DM]:["dash","appr","work","emp","org","leave_req","att_d"]};
function NAVV(){const d=DAILY[role];if(!d)return NAV;const rest=[];const out=NAV.map(([g,items])=>{const keep=items.filter(i=>d.includes(i[1]));items.forEach(i=>{if(!d.includes(i[1])&&canSee(i[1]))rest.push(i)});return[g,keep]}).filter(([g,it])=>it.length);
 if(rest.length)out.push(["More",rest]);return out}
GIC.More=GIC.Administration;
/* Manual attendance and leave on behalf of an employee (HR) */
ACTS.att_man=pno=>{if(![R.HRD,R.HRS].includes(role))return;$("#dt").textContent="Record attendance";$("#dd").textContent="For an employee who could not clock in. Leave clock-out empty if they are still in.";
 $("#db").innerHTML=`<form class="g1" data-form="attman"><label>Employee<select name="no">${allEmps().filter(e=>e.status!=="Terminated").map(e=>`<option value="${esc(e.no)}">${esc(e.name)} (${esc(e.no)})</option>`).join("")}</select></label>${fld("Date","date","date",{req:1,val:iso(T0)})}${fld("Clock in","tin","time",{req:1,val:"09:00"})}${fld("Clock out","tout","time",{val:"17:00"})}${fld("Reason","reason","text",{req:1})}<button class="b p" type="submit">Save</button></form><div class="err"></div>`;if(pno&&$("#db [name=no]"))$("#db [name=no]").value=pno;$("#dx").hidden=true;const x=$("#dxx");if(x)x.hidden=true;$("#drawer").classList.add("open")};
FORMS.attman=o=>{if(![R.HRD,R.HRS].includes(role))return"Only HR can record attendance.";if(o.date>iso(T0))return"Choose today or an earlier date.";if(isWk(new Date(o.date+"T00:00:00")))return"That day is a weekend or holiday.";if(o.tout&&o.tout<=o.tin)return"Clock-out must be after clock-in.";
 const k=o.no+"|"+o.date;if((PUNCH[k]||[]).length)return"There is already attendance recorded for that day.";PUNCH[k]=[new Date(o.date+"T"+o.tin).toISOString()].concat(o.tout?[new Date(o.date+"T"+o.tout).toISOString()]:[]);saveW();audit("Attendance recorded manually",o.no+" "+o.date+" "+o.tin+"-"+(o.tout||"")+". "+o.reason);closeDr();toast("Attendance saved");draw()};
ACTS.lv_man=pno=>{if(![R.HRD,R.HRS].includes(role))return;$("#dt").textContent="Add leave for an employee";$("#dd").textContent="It goes through the normal approval, and the balance is checked.";
 const ee=allEmps().filter(e=>e.status!=="Terminated"),types=Object.keys(balances(ee[0]||{}));
 $("#db").innerHTML=`<form class="g1" data-form="lvman"><label>Employee<select name="no">${ee.map(e=>`<option value="${esc(e.no)}">${esc(e.name)} (${esc(e.no)})</option>`).join("")}</select></label><label>Leave type<select name="type">${types.map(t=>`<option>${esc(t)}</option>`).join("")}</select></label>${fld("From","start","date",{req:1})}${fld("To","end","date",{req:1})}${fld("Note","note","text")}<button class="b p" type="submit">Submit for approval</button></form><div class="err"></div>`;if(pno&&$("#db [name=no]"))$("#db [name=no]").value=pno;$("#dx").hidden=true;const x=$("#dxx");if(x)x.hidden=true;$("#drawer").classList.add("open")};
FORMS.lvman=o=>{if(![R.HRD,R.HRS].includes(role))return"Only HR can add leave for an employee.";const e=allEmps().find(x=>x.no===o.no);if(!e)return"Choose an employee.";const b=balances(e)[o.type];
 if(o.end<o.start)return"The end date must be on or after the start date.";const days=wdays(o.start,o.end);if(!days)return"The selected dates contain no working days.";
 if(LR.some(r=>r.mode===MODE&&r.no===e.no&&r.status!=="Rejected"&&r.start<=o.end&&r.end>=o.start))return"These dates overlap an existing leave request.";
 if(b&&b.avail!=null&&days>b.avail)return"Not enough balance: "+b.avail+" day(s) available, "+days+" requested.";
 LR.push({id:Date.now(),mode:MODE,no:e.no,type:o.type,start:o.start,end:o.end,days,note:(o.note||"")+" (entered by "+role+")",status:"Pending"});saveW();audit("Leave added for employee",e.no+" "+o.type+" "+o.start+" to "+o.end);closeDr();toast("Leave request created");draw()};

/* UX layer: quick actions on the home pages */
function qaList(){const n=canSee("appr")?apprItems().filter(canAct).length:0;
 const T={emp:["Add employee","Open the form","go:emp+eadd"],att:["Record attendance","For someone who missed clock-in","go:att_d+att_man"],lv:["Add leave","On behalf of an employee","go:leave_req+lv_man"],appr:["Approvals",n?n+" waiting for you":"Nothing waiting","go:appr",n],hrq:["HR Requests","Letters, loans, changes","go:hr_req"],mail:["Email outbox",MQ().filter(m=>m.st!=="Sent").length+" to send","go:mail_out"],run:["Payroll run","Calculate and approve","go:pay_proc"],inp:["Payroll inputs","Bonuses, deductions","go:pay_inputs"],je:["Journal entry","Accounting entry for a run","go:pay_je"],slip:["Payslips","Publish and review","go:payslips"],reg:["Payroll register","All runs and totals","go:pay_reg"],rec:["Reconciliation","Match payroll to the bank","go:pay_rec"],cost:["Cost analysis","By department and project","go:rep_cost"],org:["Organization chart","Reporting lines","go:org"],tl:["Team leave","Requests from your team","go:leave_req"],ta:["Team attendance","Who is in today","go:att_d"]};
 const by={[R.HRD]:["emp","lv","att","appr","hrq","mail"],[R.HRS]:["emp","lv","att","appr","hrq","mail"],[R.DM]:["appr","tl","ta","org"],[R.PAY]:["run","inp","je","slip","appr"],[R.FIN]:["reg","je","rec","cost","appr"]}[role]||[];
 return by.map(k=>({k,t:T[k]})).filter(x=>{const g=x.t[2].slice(3).split("+")[0];return canSee(g)})}
function uxUI(){try{if(typeof mailScan==="function")mailScan()}catch(e){}const v=$("#view");if(!v)return;const old=v.querySelector(".qa");if(old)old.remove();
 if(page!=="dash"&&page!=="paydash")return;const L=qaList();if(!L.length)return;
 const h=`<div class="qa" role="group" aria-label="Quick actions">${L.map(x=>`<button type="button" class="qt" data-q="${x.t[2]}">${ic(x.t[2].slice(3).split("+")[0])}<span class="qx"><b>${esc(x.t[0])}</b><small>${esc(x.t[1])}</small></span>${x.t[3]?`<i class="qn">${x.t[3]}</i>`:""}</button>`).join("")}</div>`;
 v.insertAdjacentHTML("afterbegin",h)}
document.addEventListener("click",ev=>{const q=ev.target.closest("[data-q]");if(!q)return;const[a,b]=q.dataset.q.slice(3).split("+");go(a);if(b)setTimeout(()=>ACTS[b]&&ACTS[b](),60)});

/* New request for an employee, from anywhere */
function NREQB(e){return[R.HRD,R.HRS,R.PAY].includes(role)&&e.status!=="Terminated"&&MODE==="mine"?`<div class="bar" style="margin-top:8px"><button class="b p" data-act="nreq:${esc(e.no)}">+ New request</button></div>`:""}
const openDr2=(t,d,h)=>{$("#dt").textContent=t;$("#dd").textContent=d;$("#db").innerHTML=h;$("#dx").hidden=true;const x=$("#dxx");if(x)x.hidden=true;$("#drawer").classList.add("open")};
ACTS.nreq=no=>{const e=allEmps().find(x=>x.no===no);if(!e)return;const hr=[R.HRD,R.HRS].includes(role),T=[];
 if(hr)T.push(["leave","Leave","Add leave for them"],["att","Attendance","Record clock-in and out"],["warn","Warning","Issue a disciplinary warning"]);
 if(hr||role===R.PAY)T.push(["loan","Loan","Grant a loan with installments"]);
 if(hr){HRQ.filter(x=>x.k!=="loan").forEach(x=>T.push([x.k,x.t,x.d]));T.push(["move","Promotion or transfer","Position, department or manager"],["salary","Salary revision","Open Compensation"],["docs","Documents","Upload or review"])}
 openDr2("New request for "+e.name,e.no+" · "+e.dept,`<div class="nrq">${T.map(t=>`<button type="button" class="nq" data-act="nrq:${t[0]}|${esc(no)}"><b>${esc(t[1])}</b><small>${esc(t[2])}</small></button>`).join("")}</div>`)};
ACTS.nrq=a=>{const[k,no]=a.split("|"),e=allEmps().find(x=>x.no===no);if(!e)return;
 if(k==="leave")return ACTS.lv_man(no);if(k==="att")return ACTS.att_man(no);if(k==="move")return ACTS.mv(no);
 if(k==="salary"){closeDr();return ACTS.gocomp?ACTS.gocomp(no):go("comp")}
 if(k==="docs"){closeDr();PROF=no;TAB.prof="docs";return go("profile")}
 if(k==="warn")return openDr2("Warning: "+e.name,"Recorded in their file; they acknowledge it in their portal.",`<form class="g1" data-form="wnnew"><input type="hidden" name="no" value="${esc(no)}"><input type="hidden" name="_dr" value="1">${fld("Type","level","select",{req:1,opts:WLV})}${fld("Date of the incident","date","date",{req:1,val:iso(T0)})}${fld("What happened","reason","area",{req:1,rows:3})}<button class="b p" type="submit">Issue warning</button></form><div class="err"></div>`);
 if(k==="loan")return openDr2("Loan: "+e.name,"Deducted in equal monthly installments through payroll.",`<form class="g1" data-form="lnnew"><input type="hidden" name="no" value="${esc(no)}"><input type="hidden" name="_dr" value="1">${fld("Loan amount (EGP)","amount","number",{req:1,min:1,step:"0.01"})}${fld("Number of monthly installments","n","number",{req:1,min:1,step:"1"})}${fld("First deduction","start","select",{req:1,opts:[monthsBack(1)[0],...monthsFwd(6)].map(m=>[m.key,m.label])})}${fld("Reason","note","text")}<button class="b p" type="submit">Grant loan</button></form><div class="err"></div>`);
 const t=HQT(k);if(!t)return;const pr=t.proof||t.proofAlways;
 openDr2(t.t+": "+e.name,"Created by HR for the employee. It opens in the HR inbox so you can decide.",`<form class="g1" data-form="hrqnew"><input type="hidden" name="type" value="${t.k}"><input type="hidden" name="on" value="${esc(no)}">${t.f.map(f=>hqField(f)).join("")}<label>Note<input name="note"></label><div class="fl">Supporting document${pr?" (required)":" (optional)"}${attBox("hrqform|"+no,true)}</div><button class="b p" type="submit">Create request</button></form><div class="err"></div>`)};
["wnnew","lnnew"].forEach(n=>{const f=FORMS[n];FORMS[n]=o=>{const r=f(o);if(!r&&o._dr)closeDr();return r}});

/* Money fields show thousands separators (8,000) and are read back as plain numbers */
const MNAME=/^(amount|basic|bank|allow|n_basic|n_housing|n_transport|n_meal|n_other|n_allow|alw_.*|a_.*)$/;
const fmtMoney=i=>{let v=i.value.replace(/[^0-9.]/g,"");const p=v.split(".");v=p[0].replace(/^0+(?=\d)/,"").replace(/\B(?=(\d{3})+(?!\d))/g,",")+(p.length>1?"."+p.slice(1).join("").slice(0,2):"");i.value=v};
function moneyize(){document.querySelectorAll("input[type=number]").forEach(i=>{if(!(MNAME.test(i.name)||i.closest("form[data-form=salReq],form[data-form=pinew],form[data-form=lnnew]")&&!/^(n|no|hours|days|pct)$/.test(i.name)&&i.name!=="no"&&/amount|basic|allow|alw|housing|transport|meal|other/i.test(i.name)))return;i.type="text";i.inputMode="decimal";i.dataset.money="1";i.removeAttribute("min");i.removeAttribute("step");i.removeAttribute("max");fmtMoney(i)})}
document.addEventListener("input",ev=>{const i=ev.target;if(!i||!i.dataset||!i.dataset.money)return;const pos=i.selectionStart,left=i.value.slice(0,pos).replace(/[^0-9.]/g,"").length;fmtMoney(i);let n=0,k=0;for(;k<i.value.length&&n<left;k++)if(/[0-9.]/.test(i.value[k]))n++;try{i.setSelectionRange(k,k)}catch(e){}});
document.addEventListener("submit",ev=>{const f=ev.target;if(!f||!f.querySelectorAll)return;const L=[...f.querySelectorAll("input[data-money]")];L.forEach(i=>{i.value=i.value.replace(/,/g,"")});setTimeout(()=>L.forEach(i=>{if(i.isConnected)fmtMoney(i)}),0)},true);
{let q=0;new MutationObserver(()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;moneyize()})}).observe(document.body,{childList:true,subtree:true})}

document.addEventListener("focusin",ev=>{const i=ev.target;if(i&&i.dataset&&i.dataset.money)setTimeout(()=>{try{i.select()}catch(e){}},0)});

/* Compact Add employee: only what is needed to start; the rest is completed later */
ACTS.eadd=()=>{if(!canEditEmp())return toast("Only HR Director or HR Specialist can add employees.");if(MODE==="sample")return toast("Sample data is read-only.");
 const no=nextEmpNo(),mgrs=allEmps().filter(e=>e.status!=="Terminated"),ccs=ccOpts("").filter(x=>x[0]);
 const sec=t=>`<div class="nsec">${t}</div>`;
 openDr2("Add employee","Number "+no+" is assigned automatically. Fill the essentials now; other details can be added later from the profile.",
 `<form class="nf" data-form="empnew"><input type="hidden" name="no" value="${no}">
 ${sec("Who")}${fld("Full name","name","text",{req:1})}${fld("Mobile","mobile","tel")}${fld("Work email","email","email")}${fld("National ID (14 digits)","nid","text")}
 ${sec("Job")}${fld("Department","dept","select",{req:1,opts:DEPTS})}${fld("Job title","pos","text",{req:1})}${fld("Reporting to","mgr","select",{opts:[["","None"],...mgrs.map(e=>[e.name,e.name])]})}${fld("Start date","hire","date",{req:1,val:iso(T0)})}${fld("Employment type","type","select",{opts:TYPES,val:"Full-time"})}${fld("Status","status","select",{opts:["Active","Probation"],val:"Active"})}${ccs.length?fld("Project or cost center","project","select",{opts:ccs}):""}
 ${sec("Pay")}<label>Basic salary (EGP / month)<input name="n_basic" type="number" placeholder="0" required></label>${ALWT.map(([k,l])=>`<label>${l} allowance<input name="n_${k}" type="number" placeholder="0"></label>`).join("")}
 ${sec("Bank (optional)")}${fld("Bank name","bankname","text")}${fld("Account number","bankacct","text")}${fld("IBAN","iban","text")}
 <button class="b p nsub" type="submit">Add employee</button></form><div class="err"></div>`)};
FORMS.empnew=o=>{if(!canEditEmp())return"Only HR can add employees.";const g=k=>(o[k]||"").trim(),num=v=>+String(v||0).replace(/,/g,"");
 if(!g("name"))return"Enter the full name.";if(!g("pos"))return"Enter the job title.";if(!g("hire"))return"Enter the start date.";if(!g("dept"))return"Choose the department.";
 if(g("email")&&!/^\S+@\S+\.\S+$/.test(g("email")))return"The email address looks invalid.";if(g("mobile")&&!/^\+?[\d\s\-]{8,16}$/.test(g("mobile")))return"The mobile number looks invalid.";
 const ch={no:g("no"),name:g("name"),mobile:g("mobile"),email:g("email"),dept:g("dept"),pos:g("pos"),mgr:g("mgr"),hire:g("hire"),type:g("type")||"Full-time",status:g("status")||"Active",loc:"Head Office",project:g("project")||"",nat:"Egyptian",sched:SCHEDS[0],coach:"",lapp:"",tapp:"",bank:false};
 if(g("nid")){const x=egyId(g("nid"));if(!x)return"The National ID must be 14 digits with a valid birth date inside it.";if(allEmps().some(e=>String(e.nid||"")===g("nid")))return"An employee with this National ID already exists.";ch.nid=g("nid");ch.dob=x.dob;ch.gender=x.gender}
 const bs=num(o.n_basic);if(!o.n_basic||isNaN(bs)||bs<0)return"Enter the basic salary.";const alw={};let al=0;for(const[k,l]of ALWT){const v=num(o["n_"+k]);if(isNaN(v)||v<0)return l+" allowance must be zero or more.";if(v>0){alw[k]=v;al+=v}}
 if(g("iban")&&!ibanOK(g("iban")))return"The IBAN is not valid. An Egyptian IBAN is EG followed by 27 digits.";if(g("bankacct")&&!/^\d{6,24}$/.test(g("bankacct").replace(/\s/g,"")))return"Account number should be 6 to 24 digits.";
 if((g("bankacct")||g("iban"))&&!g("bankname"))return"Enter the bank name.";if(g("bankname")&&(g("bankacct")||g("iban"))){ch.bankname=g("bankname");ch.bankacct=g("bankacct");ch.iban=g("iban");ch.bank=true}
 if(allEmps().some(e=>e.no===ch.no))return"Employee number already used, close and try again.";
 E.push({...ch,basic:bs,allow:al,alw,end:""});save();LOGC(ch.no,"New joiner","Added, start "+ch.hire+", basic "+bs);audit("Employee added",ch.no+" - "+ch.name);closeDr();toast(ch.name+" added");PROF=ch.no;TAB.prof="ov";draw()};

import re
src=open('dist/frag.html').read() if False else open('src/frag_v5.html').read()
pre,rest=src.split('<script>\n',1);js,post=rest.rsplit('</script>',1)
L=js.split('\n')
def drop(pred,count=1):
    global L
    for i,l in enumerate(L):
        if pred(l):
            del L[i:i+count];return
    raise Exception('not found')
sw=lambda s:(lambda l:l.startswith(s))
drop(sw('const ROLES={'));drop(sw('const NAV={'));drop(sw('const ALLOW='))
for i,l in enumerate(L):
    if l.startswith('const META={'): L[i]=l.replace('const META=','const META0=',1)

# old comp rules block
a=next(i for i,l in enumerate(L) if l.lstrip().startswith('const RULES=[['));b=next(i for i,l in enumerate(L) if 'Payroll cannot be calculated until' in l)
del L[a:b+1]
drop(sw('const IC={'));drop(sw('const ICN='));drop(sw('const ic='));drop(sw('const ini='));drop(sw('let FM=false'))
drop(sw('const canSee='));drop(sw('$("#role").onchange='))
a=next(i for i,l in enumerate(L) if l.startswith('function nav()'));b=next(i for i,l in enumerate(L) if l.startswith('function openDr'))
del L[a:b]
drop(sw('function ask('))
i=next(i for i,l in enumerate(L) if l.startswith('$("#role").innerHTML='))
mods=''.join(open(f'src/mods/{f}.js').read()+'\n' for f in ['m0_core','payroll_engine','m1_people','m2_time','m3_payroll','m4_talent_admin','m8_io','m9_files','m10_projects','m13_reports','m11_edit','m12_access','m14_nav','m15_requests','m16_portal','m17_login','m18_seed','m19_notify','m20_extra','m21_mail','m22_settle','m23_slip','m24_dp','m25_loan','m26_rolemenu','m27_leavebal','m28_leavereport','m29_sidesearch','m30_icons','m31_home','m32_positions','m33_build','m34_reporting','m35_ia','m36_reports2','m37_a11y','m38_emp','m39_cloud','m5_boot'])
mods=mods.replace('if(typeof module!=="undefined")module.exports={pe_calc,pe_annualTaxNum,pe_micro};','')
L[i:i]=mods.split('\n')
js='\n'.join(L)

def R_(a,b):
    global js
    assert a in js,a[:70]
    js=js.replace(a,b,1)
R_('const apr=S?inL(X.approvals).concat(LR.filter(r=>r.mode===MODE&&r.status==="Pending"&&nos.has(r.no)).map(r=>({type:"Leave request",no:r.no,detail:r.type+", "+r.days+" day(s) from "+r.start,due:iso(addD(T0,3))}))):[],ot=S?inL(X.overtime):[],exc=S?inL(X.exceptions):[],docs=S?inL(X.docs):[],onb=S?inL(X.onboarding):[],ano=S?inL(X.anomalies):[];',
 'const apr=apprItems().filter(i=>!i.fin&&i.type!=="Payroll finalization"&&(!i.no||nos.has(i.no))).map(i=>({type:i.type,no:i.no,detail:i.detail,due:i.due})),ot=apprItems().filter(i=>!i.fin&&i.type==="Overtime"&&nos.has(i.no)).map(i=>({no:i.no,detail:i.detail.replace("Overtime: ","")})),exc=excOpen().filter(x=>nos.has(x.no)),docs=docsMissing().filter(x=>nos.has(x.no)),onb=now.filter(e=>e.hire>=iso(addD(T0,-60))).map(e=>({no:e.no,n:OBT.filter(t=>!db("onbt",{})[e.no+"|"+t])})).filter(x=>x.n.length).map(x=>({no:x.no,detail:x.n.join(", ")})),RUN_=RUNS().filter(r=>r.results.length).sort((a,b)=>a.period<b.period?1:-1)[0],ano=RUN_?varRows(RUN_).map(v=>({no:v.no,detail:v.why,reason:v.reason?"Explained: "+v.reason:"Needs reason"})):[];')
R_('isWk=d=>d.getDay()===5||d.getDay()===6;','isWk=d=>{try{return WKD().includes(d.getDay())||HOLS().some(h=>h.d===iso(d))}catch(e){return d.getDay()===5||d.getDay()===6}};')
R_('return`${form}<div class="bar"><input id="q" type="search"','return`${S?form:""}<div class="bar"><input id="q" type="search"')
R_('const dshort=s=>new Date(s+"T00:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});','const dshort=s=>{const d=new Date(s+"T00:00:00");return d.toLocaleDateString("en-GB",{weekday:"short"})+" "+d.toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"})};')
R_('vac=S?X.vacancies.filter(v=>(!F.dept||v.dept===F.dept)&&(!F.loc||v.loc===F.loc)):[];','vac=VACS().filter(v=>(!F.dept||v.dept===F.dept)&&(!F.loc||v.loc===F.loc));')
js=re.sub(r'DR\.(apr|vac|a_anom|a_exc|a_ot|a_docs|a_onb|a_leave)=S\?',r'DR.\1=1?',js)
R_('["apr","Pending HR approvals",S?apr.length:"—","Leave, salary, contract and offboarding requests.","",S]','["apr","Pending approvals",apr.length,"Every request waiting in the Approvals inbox.","",true]')
R_('["vac","Open vacancies",S?vac.length:"—","Approved positions not yet filled.","",S]','["vac","Open vacancies",vac.length,"From Recruitment.","",true]')
a=js.index(' DR.a_run=');b=js.index('\n',a)
js=js[:a]+' DR.a_run=()=>({title:"Payroll awaiting review",desc:"Runs that are validating, under review or pending approval, from Payroll Processing.",cols:["Period","Status","Employees","Net pay","Blocking exceptions"],rows:RUNS().filter(r=>["validation_required","under_review","pending_approval"].includes(r.status)).map(r=>[(perOf(r.period)||{label:r.period}).label,RS[r.status],String(r.results.length),canSal()?fmtC(r.results.reduce((s,x)=>s+x.net,0)):"Restricted",String(r.exc.filter(x=>x.sev==="block").length)])});'+js[b:]
R_('["high","Payroll anomalies requiring investigation","a_anom",S?ano.length:null]','["high","Payroll variances needing a reason","a_anom",ano.filter(x=>x.reason==="Needs reason").length]')
R_('["high","Payroll runs awaiting review","a_run",S?1:null]','["high","Payroll runs awaiting review","a_run",RUNS().filter(r=>["validation_required","under_review","pending_approval"].includes(r.status)).length]')
R_('"a_exc",S?exc.length:null]','"a_exc",exc.length]')
R_('S?apr.filter(a=>a.type==="Leave request").length:null','apr.filter(a=>a.type==="Leave request").length')
R_('"a_ot",S?ot.length:null]','"a_ot",ot.length]');R_('"a_docs",S?docs.length:null]','"a_docs",docs.length]');R_('"a_onb",S?onb.length:null]','"a_onb",onb.length]')
# payroll cost from runs when available
R_('const gNow=mP?gross(mP.end):0,gPrev=mPP?gross(mPP.end):0','const rg=m=>{const r=m&&RUNS().find(x=>x.period===m.key&&x.kind==="regular"&&x.results.length);return r?r.results.reduce((s,x)=>s+x.gross,0)/100:null},gNow=mP?(rg(mP)??gross(mP.end)):0,gPrev=mPP?(rg(mPP)??gross(mPP.end)):0')
R_('"Gross earnings (basic + allowances)."+','(mP&&rg(mP)!=null?"From the payroll run for this month.":"Fixed pay (basic + allowances). Calculate a run for the real figure.")+')
R_('["ins","Employer social insurance cost","—","Needs approved insurance rules.","",false]','["ins","Employer social insurance cost",(RUN_&&!RUN_.test&&canSal())?"EGP "+fk(RUN_.results.reduce((s,x)=>s+x.erIns,0)/100):"—",(RUN_&&!RUN_.test)?"From the latest payroll run.":"Needs approved insurance rules and a calculated run.","",!!(RUN_&&!RUN_.test&&canSal())]')
R_('DR.ins=NA("Employer social insurance cost","Needs approved insurance rules (insurable wage limits and rates). See Tax & Insurance Settings. No figure is shown until the rules are verified.");','DR.ins=(RUN_&&!RUN_.test&&canSal())?()=>({title:"Employer insurance: "+runLabel(RUN_),desc:"From the latest payroll run using approved rules.",cols:["No.","Name","Department","Employer insurance"],rows:RUN_.results.map(x=>[x.no,x.name,x.dept,fmtC(x.erIns)])}):NA("Employer social insurance cost","Needs approved insurance rules and a calculated payroll run. See Tax & Insurance Settings.");')
# attendance cards use real punches in My records too
R_('const at=(k,cs)=>L.filter(e=>e.att&&cs.includes(e.att[k+90]));','const at=(k,cs)=>L.filter(e=>cs.includes(attCode(e,iso(addD(T0,k)))));')
# open-in-module button
R_('function openDr(id){','const DRGO={apr:"appr",a_leave:"leave_req",a_ot:"overtime",a_exc:"exceptions",a_docs:"docs",a_onb:"onboard",a_exp:"contracts",a_e30:"contracts",a_e90:"contracts",c60:"contracts",vac:"recruit",pay:"pay_reg",ins:"pay_reg",a_run:"pay_proc",a_anom:"pay_var",hc:"emp",act:"emp",hires:"emp",leave:"leave_cal",pres:"att_d",abs:"att_d",late:"att_d"};\nfunction openDr(id){openDr0(id);linkify($("#db"));const p=DRGO[id];if(p&&canSee(p))$("#db").insertAdjacentHTML("afterbegin",`<div class="bar" style="margin-bottom:10px"><button class="b p" data-go="${p}">Open ${PAGES[p].title}</button></div>`)}\nfunction openDr0(id){')

js=js.replace('r[t]={open,used,pend,avail:open==null?null:open-used-pend}','const adj=ladjSum(e.no,t);r[t]={open,used,pend,adj,avail:open==null?null:open+adj-used-pend}')
R_('<td>${esc(e.no)}</td><td><span class="who"><i class="av">${ini(e.name)}</i>${esc(e.name)}</span></td>','<td>${esc(e.no)}</td><td><button class="lnk who" data-act="prof:${esc(e.no)}"><i class="av">${ini(e.name)}</i>${esc(e.name)}</button></td>')
a=js.index('function dash(){');b=js.index('function emp(){')

js=js[:a]+open('src/mods/dash_new.js').read()+'\n'+js[b:]
R_('<b>${nOf("late")} late · ${nOf("abs")} absent · ${nOf("leave")} on leave</b>','<b>${nOf("late")==="—"?"No attendance recorded yet":nOf("late")+" late · "+nOf("abs")+" absent"} · ${nOf("leave")} on leave</b>')
R_('(gNow>=gPrev?"▲ +":"▼ ")+Math.abs(Math.round((gNow-gPrev)/gPrev*1000)/10)+"% vs "+mPP.label','(gNow===gPrev?"No change":(gNow>gPrev?"▲ +":"▼ ")+Math.abs(Math.round((gNow-gPrev)/gPrev*1000)/10)+"%")+" vs "+mPP.label')
R_('<div class="notice er" role="alert"><b>Payroll rules are missing</b> for today: ${rrNow.missing.map(k=>esc(RKEYS.find(x=>x[0]===k)[1])).join(", ")}.<div class="bar" style="margin-top:8px">','<div class="notice er" role="alert"><b>Before your first payroll run</b><ol class="steps"><li><b>Load the rules.</b> Use the first button to load the 2026 values for trial use.</li><li><b>Check and approve them.</b> Your accountant reviews the values in Tax &amp; Insurance Settings and approves them.</li><li><b>Create the run.</b> Come back here and create the run for the month.</li></ol><div class="cs">Still missing: ${rrNow.missing.map(k=>esc(RKEYS.find(x=>x[0]===k)[1])).join(", ")}.</div><div class="bar" style="margin-top:8px">')
R_('return`<form class="inl" data-form="attd"','return`${[R.HRD,R.HRS].includes(role)&&MODE==="mine"?`<div class="bar"><button class="b p" data-act="att_man">+ Record attendance manually</button></div>`:""}<form class="inl" data-form="attd"')
R_('return`${tabs("lr",[["pending","Pending"]','return`${[R.HRD,R.HRS].includes(role)&&MODE==="mine"?`<div class="bar"><button class="b p" data-act="lv_man">+ Add leave for an employee</button></div>`:""}${tabs("lr",[["pending","Pending"]')
R_('NAV.filter(([g])=>ALLOW(g)).map(([g,items])=>','NAVV().filter(([g,items])=>items.some(i=>canSee(i[1]))).map(([g,items])=>')
R_('const groupOf=k=>{const x=NAV.find(n=>n[1].some(i=>i[1]===k));return x?x[0]:""};','const groupOf=k=>{const x=NAVV().find(n=>n[1].some(i=>i[1]===k));return x?x[0]:""};')

# --- excel io ---
R_('<span class="tag">${base.length} record(s)</span>','<span class="tag">${base.length} record(s)</span><button class="b" data-act="empxl">Export Excel</button><button class="b" data-act="impemp">Import from Excel</button>')
R_('$("#view").innerHTML=pg.fn();linkify($("#view"));','STD={};STDN=0;$("#view").innerHTML=pg.fn();linkify($("#view"));injectXl();')
R_('const x=b[t];return`<div class="card k"><span class="l">${t}</span><span class="v" ${x.avail==null?\'style="font-size:18px;line-height:36px"\':""}>${x.avail==null?"No limit":x.avail}</span><span class="d">${x.open==null?"Deducts salary per payroll policy":`Opening ${x.open} · used ${x.used} · pending ${x.pend}`}</span></div>`}','const x=b[t];return stat(t,x.avail==null?"No limit":x.avail,x.open==null?"Deducts salary per payroll policy":`Opening ${x.open} · used ${x.used} · pending ${x.pend}`,()=>leaveDrill(e,t))}')
R_('<label style="grid-column:span 2">Note (optional)<input name="note"></label>','<label style="grid-column:span 2">Note (optional)<input name="note"></label><div style="grid-column:span 2" class="fl">Supporting document (optional, for example a medical certificate)<div data-attbox="leaveform|${e.no}">${attList("leaveform|"+e.no,true)}<label class="b" style="cursor:pointer">Attach file<input type="file" data-att="leaveform|${e.no}" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx" style="display:none"></label></div><div class="err" data-atterr="leaveform|${e.no}"></div></div>')
R_('LR.push({id:Date.now(),mode:MODE,no:e.no,type:o.type,start:o.start,end:o.end,days,note:o.note,status:"Pending"});','const nid=Date.now();LR.push({id:nid,mode:MODE,no:e.no,type:o.type,start:o.start,end:o.end,days,note:o.note,status:"Pending"});attMove("leaveform|"+e.no,"leave|"+nid);')
R_('<td>${r.days}</td><td><span class="badge ${r.status==="Pending"?"s-wn":"s-ok"}">${r.status}</span></td>','<td>${r.days}${attCount("leave|"+r.id)?` <button class="b" data-act="att:leave|${r.id}">Files (${attCount("leave|"+r.id)})</button>`:""}</td><td><span class="badge ${r.status==="Pending"?"s-wn":"s-ok"}">${r.status}</span></td>')
# --- projects ---
R_('let MODE="sample";try{MODE=localStorage.getItem("smr_mode")||"sample"}catch(e){}','let MODE="mine";')
js=js.replace('F={dept:"",loc:"",mgr:"",type:"",status:""}','F={dept:"",loc:"",mgr:"",type:"",status:"",project:""}')
R_('emps.forEach(e=>{e.att=[];e.late=[];','const PRJ={"Head Office":["Corporate"],"Site A":["Tower One","Business Park"],"Site B":["Retail Mall","Residential Compound"]};emps.forEach((e,i)=>{const a=PRJ[e.loc]||["Corporate"];e.project=a[i%a.length]});emps.forEach(e=>{e.att=[];e.late=[];')
R_('&&(!F.type||e.type===F.type)&&(!F.status||e.status===F.status));','&&(!F.type||e.type===F.type)&&(!F.status||e.status===F.status)&&(!F.project||e.project===F.project));')
R_('.filter(e=>(!F.dept||e.dept===F.dept)&&(!F.status||e.status===F.status)).filter(e=>!Q||','.filter(e=>(!F.dept||e.dept===F.dept)&&(!F.status||e.status===F.status)&&(!F.project||e.project===F.project)).filter(e=>!Q||')

R_('<th>Location</th>','<th>Project</th><th>Location</th>')
R_('<td>${esc(e.loc||"–")}</td>','<td>${esc(e.project||"–")}</td><td>${esc(e.loc||"–")}</td>')
R_('<select data-k="status">${opts(STAT,F.status,"All statuses")}</select>','<select data-k="project">${opts(PROJL(),F.project,"All projects")}</select><select data-k="status">${opts(STAT,F.status,"All statuses")}</select>')

R_('<div class="notice er" role="alert"><b>Before your first payroll run</b>','<div class="notice setup" role="status"><b>Before your first payroll run</b>')
R_('No employees yet. Use the form above to add the first record.','No employees yet. Use Add employee or Import from Excel above.')
# --- employees: manager filter/column, birthdays ---
R_('emp:["Employee Directory","Search, filter and manage employee records."','emp:["Employees","All employees. Search, filter by department, project, direct manager or status, and see who has a birthday coming up."')
R_('&&(!F.project||e.project===F.project)).filter(e=>!Q||[e.name,e.no,e.email,e.dept,e.pos].join(" ")','&&(!F.project||e.project===F.project)&&(!F.mgr||e.mgr===F.mgr)&&(!F.loc||e.loc===F.loc)).filter(e=>!Q||[e.name,e.no,e.email,e.dept,e.pos,e.mgr,e.loc].join(" ")')
R_('<select data-k="project">${opts(PROJL(),F.project,"All projects")}</select>','<select data-k="project">${opts(PROJL(),F.project,"All projects")}</select><select data-k="mgr" aria-label="Direct manager">${opts(uniq("mgr"),F.mgr,"All direct managers")}</select><select data-k="loc" aria-label="Location">${opts(uniq("loc"),F.loc,"All locations")}</select>')
R_('<th>Position</th><th>Project</th>','<th>Position</th><th>Direct manager</th><th>Project</th>')
R_('<td>${esc(e.pos||"–")}</td><td>${esc(e.project||"–")}</td>','<td>${esc(e.pos||"–")}</td><td>${esc(e.mgr||"–")}</td><td>${esc(e.project||"–")}</td>')
R_('return`${S?form:""}<div class="bar"><input id="q" type="search"','return`${S?form:""}${bdStrip()}<div class="bar"><input id="q" type="search"')
# --- employee editing ---
R_('const allEmps=()=>MODE==="sample"?SAMPLE.emps:E.map(normE);','const allEmps=()=>MODE==="sample"?(typeof applyOvr==="function"&&applyOvr(),SAMPLE.emps):E.map(normE);')
R_('${S?"":"<th></th>"}</tr>${L.map(e=>','<th></th></tr>${L.map(e=>')
R_('${S?"":`<td><button class="b" data-del="${esc(e.no)}">Archive</button></td>`}</tr>','<td>${canEditEmp()?`<button class="b" data-act="eedit:${esc(e.no)}">Edit</button> `:""}${S?"":`<button class="b" data-del="${esc(e.no)}">Archive</button>`}</td></tr>')
R_('<h2 class="sec">Leave balances</h2>','${myDetails(e)}<h2 class="sec">Leave balances</h2>')
# --- employee access ---
R_('if(!all.some(e=>e.no===WSNO))WSNO=all[0].no;','if(typeof ESES!=="undefined"&&ESES)WSNO=ESES.no;if(!all.some(e=>e.no===WSNO))WSNO=all[0].no;')
R_('${role==="Employee"?"Viewing your own workspace (preview)":"View workspace of"}','${ESES?"Your workspace":role==="Employee"?"Viewing your own workspace (preview)":"View workspace of"}')
R_('<button class="b p" type="submit">Save employee</button>','<label style="grid-column:1/-1;display:flex;gap:6px;align-items:center"><input type="checkbox" name="access"> Create a sign-in so this employee can open their own workspace</label><button class="b p" type="submit">Save employee</button>')
R_('E.push(o);save();draw()}}','const acc=o.access;delete o.access;E.push(o);save();draw();if(acc)mkAccess(o.no).then(pw=>showCred([{no:o.no,name:o.name,pw}]))}}')
R_('STD={};STDN=0;$("#view").innerHTML=pg.fn();linkify($("#view"));injectXl();','try{applyMoves()}catch(_){}STD={};STDN=0;$("#view").innerHTML=pg.fn();linkify($("#view"));injectXl();esUI();palUI();relUI();cmfUI();')
R_('Reporting manager<input name="mgr"></label>','Reporting manager<select name="mgr">${mgrSel("")}</select></label>')
R_('const inScope=e=>role!=="Department Manager"||e.dept==="Operations";','var MGRD="Operations";const inScope=e=>role!=="Department Manager"||e.dept===MGRD;')

R_('<label>Job position<input name="pos"></label><label>Location<input name="loc"></label>','<label>Job position*<input name="pos" required></label><label>Location*<input name="loc" required></label>')
R_('Reporting manager<select name="mgr">','Reporting manager*<select name="mgr" required>')
R_('<label>Basic salary (EGP)<input name="basic" type="number" min="0" step="0.01"></label>','<label>Project or cost center*<select name="project" required>${ccOpts("").map(x=>`<option value="${esc(x[0])}">${esc(x[1])}</option>`).join("")}</select></label><label>Date of birth*<input name="dob" type="date" required></label><label>Gender*<select name="gender" required><option value="">Select</option><option>Female</option><option>Male</option></select></label><label>Nationality*<select name="nat" required>${NATS.map(n=>`<option ${n==="Egyptian"?"selected":""}>${n}</option>`).join("")}</select></label><label>National ID (14 digits) or passport*<input name="nid" required></label><label>Social insurance number (Egyptians)<input name="sino"></label><label>Mobile*<input name="mobile" type="tel" required></label><label>Emergency contact name*<input name="ecn" required></label><label>Emergency contact phone*<input name="ecp" type="tel" required></label><label>Bank name*<input name="bankname" required></label><label>Account holder name<input name="bankholder"></label><label>Account number<input name="bankacct"></label><label>IBAN (EG + 27 digits)<input name="iban"></label><label>Basic salary (EGP)*<input name="basic" type="number" min="0.01" step="0.01" required></label>')
R_('const acc=o.access;delete o.access;E.push(o)','{const er0=empReqErr(o);if(er0){$("#er").textContent=er0;return}o.bank=true;o.project=(o.project||"").trim()}\nconst acc=o.access;delete o.access;E.push(o)')
# --- clickable charts ---
R_('const xl=(f,labels,cx)=>{const st=Math.ceil(labels.length/6);return labels.map((l,i)=>i%st===0?`<text x="${cx(i)}" y="${f.H-6}" text-anchor="middle" class="ax">${esc(l)}</text>`:"").join("")};',
 'const xl=(f,labels,cx,k)=>{const st=Math.ceil(labels.length/6);return labels.map((l,i)=>i%st===0?`<text x="${cx(i)}" y="${f.H-6}" text-anchor="middle" class="ax"${k?` data-d="${k(i,-1)}" style="cursor:pointer"`:""}>${esc(l)}</text>`:"").join("")};')
R_('let b="";labels.forEach((l,i)=>{let y=f.mt+f.ph;series.forEach(s=>{','let b="";labels.forEach((l,i)=>{let y=f.mt+f.ph;if(o.k)b+=`<rect x="${cx(i)-bw/2}" y="${f.mt}" width="${bw}" height="${f.ph}" fill="transparent" data-d="${o.k(i,-1)}" style="cursor:pointer"><title>${esc(l)}: click for details</title></rect>`;series.forEach((s,si)=>{')
R_('${o.f?` data-f="${o.f[i]}" style="cursor:pointer"`:""}>','${o.k?` data-d="${o.k(i,si)}" style="cursor:pointer"`:""}>')
R_('${f.g}${b}${xl(f,labels,cx)}</svg>`}\nconst cols=','${f.g}${b}${xl(f,labels,cx,o.k)}</svg>`}\nconst cols=')
R_('return`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"")}">${f.g}${p}${xl(f,labels,cx)}</svg>`}',
 'const hit=o.k?series.map((s,si)=>s.vals.map((v,i)=>`<circle cx="${cx(i)}" cy="${cy(v)}" r="9" fill="transparent" data-d="${o.k(i,si)}" style="cursor:pointer"><title>${esc(labels[i])} – ${esc(s.name)}: ${(o.tip||fmt)(v)} (click for details)</title></circle>`).join("")).join(""):"";\n return`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"")}">${f.g}${p}${hit}${xl(f,labels,cx,o.k)}</svg>`}')
R_('function diverge(vals,labels){','function diverge(vals,labels,o={}){')
R_('fill="${v>=0?"var(--brand)":"var(--c3)"}"><title>','fill="${v>=0?"var(--brand)":"var(--c3)"}"${o.k?` data-d="${o.k(i,0)}" style="cursor:pointer"`:""}><title>')
R_('${g}${b}${xl({H},labels,cx)}</svg>','${g}${b}${xl({H},labels,cx,o.k)}</svg>')
R_('${x.f?`data-f="${x.f}"`:""}><span class="n"','${x.d?`data-d="${x.d}"`:x.f?`data-f="${x.f}"`:""}><span class="n"')
R_('function openDr0(id){const f=M.DR&&M.DR[id];','function openDr0(id){const f=(M.DR&&M.DR[id])||(window.CDRES&&CDRES(id))||(STD[id]&&STD[id].fn);')
R_('const p=DRGO[id];','const p=DRGO[id]||(window.CDGO&&CDGO(id))||(STD[id]&&STD[id].go);')
css=open('src/mods/m5.css').read()+open('src/mods/m6.css').read()+open('src/mods/m7.css').read()
mp={9:12.5,10:12.5,11:12.5,12:13.5,13:14.5,14:15.5,15:16,18:19,20:21,22:24}
def fz(m):
    v=float(m.group(1));return 'font-size:%gpx'%mp.get(int(v),v)
pre=re.sub(r'font-size:(\d+(?:\.\d+)?)px',fz,pre)
pre=pre.replace('font:14px/1.5','font:15.5px/1.55').replace('IBM Plex Sans','Plus Jakarta Sans').replace('IBM+Plex+Sans:wght@400;500;600','Plus+Jakarta+Sans:wght@400;500;600;700')
ME='<div class="me"><i class="av" id="me">HR</i><select id="role" aria-label="Preview as role"></select></div>'
assert ME in pre
pre=pre.replace(ME,'',1)
pre=pre.replace('<div class="side-f">','<div class="side-u">'+ME+'</div><div class="side-f">',1)
PH='<div class="ph"><h1 id="title"></h1><p id="desc"></p></div>'
assert PH in pre
pre=pre.replace(PH,'<div class="ph"><div class="phl"><button class="backl" id="backl" hidden></button><h1 id="title"></h1><span class="uline"></span><p id="desc"></p></div><div class="pact" id="pact"></div></div>',1)
pre=pre.replace('</style>',css+'</style>',1)
pre=pre.replace('<p id="cm"></p><div>','<p id="cm"></p><textarea id="cr" rows="2" aria-label="Reason" hidden></textarea><select id="cs" aria-label="Choice" hidden></select><p id="cerr" class="err" role="alert"></p><div>')
import os,json
_cfgp='config.json'
_cfg=json.load(open(_cfgp)) if os.path.exists(_cfgp) else {}
_cfg={k:v for k,v in _cfg.items() if k in ('url','key') and v}
_ld=open('src/cloud_loader.js').read()
assert '</script' not in js
APP='<script id="smr-app" type="text/plain">\n'+js+'\n</script><script>window.SMR_CLOUD='+json.dumps(_cfg)+';\n'+_ld+'\n</script>'
frag=pre+APP+post
open('dist/frag.html','w').write(frag)
head=pre.split('<style>')[0]
m=re.match(r'(.*?)<style>(.*?)</style>(.*)',pre,re.S)
HEAD,CSS,BODY=m.group(1),m.group(2),m.group(3)
R_('<button class="b" data-act="impemp">Import from Excel</button>','${[R.HRD,R.HRS].includes(role)?`<button class="b p" data-act="eadd">+ Add employee</button>`:""}<button class="b" data-act="impemp">Import from Excel</button>')
R_('cmfUI();wire();updBell()}','cmfUI();uxUI();wire();updBell()}')
R_('const adj=ladjSum(e.no,t);r[t]={open,used','const adj=ladjSum(e.no,t);open=accOpen(e,t,open);r[t]={open,used')
R_('${note("Entitlements are sample policy values.','${accrualCard()}${note("Entitlements are sample policy values.')
APP='<script id="smr-app" type="text/plain">\n'+js+'\n</script><script>window.SMR_CLOUD='+json.dumps(_cfg)+';\n'+_ld+'\n</script>'
frag=pre+APP+post
open('dist/frag.html','w').write(frag)
full='<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'+HEAD+'<style>'+CSS+'</style></head><body>'+BODY+APP+'</body></html>\n'
open('index.html','w').write(full)
open('dist/chk.js','w').write(js)
print('ok',len(frag))

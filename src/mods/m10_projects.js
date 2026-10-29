/* ===== m10: projects + Department/Project report ===== */
const PROJL=()=>[...new Set(allEmps().filter(inScope).map(e=>e.project).filter(Boolean))].sort();
IC.rep_dp=IC.rep_head;
function rep_dp(){const today=rpAsof(),tb=tab("rdp","project"),sal=canSalV(),A0=ALLE(),projs=PROJL();
 const sel=A0.filter(e=>(!F.dept||e.dept===F.dept)&&(!F.project||(F.project==="Unassigned"?!e.project:e.project===F.project)));
 const L=sel.filter(e=>empAt(e,today)),yr=iso(addD(T0,-365)),run=rpRun(),R_={};if(run)run.results.forEach(x=>R_[x.no]=x);
 const days=rpDays();
 const AT={};L.forEach(e=>{let p=0,l=0,a=0,v=0;days.forEach(ds=>{if(!empAt(e,ds))return;const c=attCode(e,ds);if(c===1)p++;if(c===2){p++;l++}if(c===3)a++;if(c===4)v++});AT[e.no]={p,l,a,v}});
 const COLS=["No.","Name","Department","Project","Status","Hire date"],rowsOf=A=>A.map(e=>[e.no,e.name,e.dept,e.project||"Unassigned",e.status,e.hire]);
 const mk=(t,A)=>()=>({title:t,desc:"Employees in this group, matching the filters above.",cols:COLS,rows:rowsOf(A)});
 const wOf=(e,k)=>{const al=e.alloc&&e.alloc.length?e.alloc:null;if(al){const a=al.find(x=>x.to===k);return a?a.pct/100:0}return(e.project||"Unassigned")===k?1:0};
 const build=(keyf,label,wk)=>{const g={};L.forEach(e=>{const k=keyf(e)||"Unassigned";(g[k]=g[k]||[]).push(e)});sel.forEach(e=>{const k=keyf(e)||"Unassigned";g[k]=g[k]||[]});if(wk)L.forEach(e=>(e.alloc||[]).forEach(a=>{g[a.to]=g[a.to]||[]}));
  const row=(k,A,all)=>{const tot=A.reduce((s,e)=>({p:s.p+(AT[e.no]||{p:0}).p,l:s.l+(AT[e.no]||{l:0}).l,a:s.a+(AT[e.no]||{a:0}).a,v:s.v+(AT[e.no]||{v:0}).v}),{p:0,l:0,a:0,v:0}),den=tot.p+tot.a+tot.v,
   joined=all.filter(e=>e.hire>yr&&e.hire<=today),left=all.filter(e=>e.term&&e.term>yr&&e.term<=today),CM=wk&&k!==""?L.filter(e=>wk(e,k)>0):A,wt=e=>wk&&k!==""?wk(e,k):1,rr=CM.filter(e=>R_[e.no]),sm=f=>rr.reduce((s,e)=>s+R_[e.no][f]*wt(e),0),fte=CM.reduce((s,e)=>s+wt(e),0);
   return[dlink(esc(k),mk(label+": "+k,A)),dlink(A.length,mk("Headcount: "+k,A)),dlink(joined.length,mk("Joined in 12 months: "+k,joined)),dlink(left.length,mk("Left in 12 months: "+k,left)),
    ...(wk?[fte.toFixed(2)]:[]),...(sal?[fmtC(CM.reduce((s,e)=>s+(e.basic+e.allow)*100*wt(e),0)),run?fmtC(sm("gross")):"–",run?fmtC(sm("net")):"–",run?fmtC(sm("cost")):"–"]:[]),
    den?(tot.p/den*100).toFixed(1)+" %":"–",String(tot.l),String(tot.a)]};
  const rows=Object.keys(g).sort().map(k=>row(k,g[k],sel.filter(e=>(keyf(e)||"Unassigned")===k)));
  rows.push(["<b>Total</b>",...row("",L,sel).slice(1).map((c,i)=>i===0?dlink("<b>"+L.length+"</b>",mk("Headcount: all",L)):c)]);return rows};
 const hd=(lab,wk)=>[lab,"Headcount","Joined (12 m)","Left (12 m)",...(wk?["Allocated FTE"]:[]),...(sal?["Fixed pay","Payroll gross","Payroll net","Employer cost"]:[]),"Attendance rate","Late days","Absent days"];
 const pl=[...new Set([...projs,...(sel.some(e=>!e.project)?["Unassigned"]:[])])];
 const matrix=()=>{const ds=DEPTS.filter(d=>L.some(e=>e.dept===d)),ps=[...new Set(L.map(e=>e.project||"Unassigned"))].sort();if(!ds.length)return tbl([],[],{empty:"No employees match these filters."});
  const cell=(A,t)=>A.length?dlink(A.length,mk(t,A)):"–";
  return tbl(["Department",...ps,"Total"],[...ds.map(d=>[esc(d),...ps.map(p=>cell(L.filter(e=>e.dept===d&&(e.project||"Unassigned")===p),d+" / "+p)),dlink("<b>"+L.filter(e=>e.dept===d).length+"</b>",mk(d,L.filter(e=>e.dept===d)))]),["<b>Total</b>",...ps.map(p=>cell(L.filter(e=>(e.project||"Unassigned")===p),p)),dlink("<b>"+L.length+"</b>",mk("All",L))]])};
 const emps=sel.map(e=>[esc(e.no),esc(e.name),esc(e.dept),esc(e.project||"Unassigned"),esc(e.status),e.hire,...(sal?[run&&R_[e.no]?fmtC(R_[e.no].gross):"–",run&&R_[e.no]?fmtC(R_[e.no].net):"–"]:[])]);
 return`<div class="bar"><label class="fp"><span>Month</span><select data-rp="m"><option value="">Current month to date</option>${rpMonths().map(x=>`<option value="${x.key}" ${RPT.m===x.key?"selected":""}>${x.label}</option>`).join("")}</select></label><label class="fp"><span>Department</span><select data-k="dept">${opts(DEPTS,F.dept,"All departments")}</select></label><label class="fp"><span>Project</span><select data-k="project">${opts(pl,F.project,"All projects")}</select></label><button class="b" id="fr">Reset</button><span class="tag">${sel.length} employee(s), ${L.length} in service</span></div>
 ${note("Cost columns follow each employee's cost allocation when one is set, otherwise their primary project. Projects are set on each employee record (Employee Directory, import, or the employment tab). Headcount is for today. Attendance covers the last 30 working days."+(sal&&run?" Payroll figures come from "+esc(runLabel(run))+(run.test?" and use unverified rules.":"."):sal?" Payroll figures appear after a payroll run is calculated.":""),"sm")}
 ${tabs("rdp",[["project","By project"],["dept","By department"],["matrix","Department by project"]],"project")}<div style="margin-top:12px">
 ${tb==="project"?tbl(hd("Project",1),build(e=>e.project,"Project",wOf),{empty:"No employees match these filters."}):tb==="dept"?tbl(hd("Department"),build(e=>e.dept,"Department"),{empty:"No employees match these filters."}):matrix()}</div>
 ${secH("Employees in this selection")}${ptbl("rdpe",["No.","Name","Department","Project","Status","Hire date",...(sal?["Payroll gross","Payroll net"]:[])],emps,{csv:"rep_dp_emps",empty:"No employees match these filters."})}`}
reg("rep_dp","Reports by Department & Project","Headcount, movement, pay and attendance for each department and project.",A("HRD","HRS","FIN","DM","PAY"),rep_dp);

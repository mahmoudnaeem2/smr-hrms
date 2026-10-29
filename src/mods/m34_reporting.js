/* Reporting lines and career history */
IC.reporting=IC.org;
const mgrEmp=e=>e&&e.mgr?ALLE().find(x=>x.name===e.mgr&&x.status!=="Terminated"):null;
const directReports=e=>ALLE().filter(x=>x.mgr===e.name&&x.status!=="Terminated"&&x.no!==e.no);
function mgrChain(e){const out=[],seen=new Set([e.no]);let m=mgrEmp(e);while(m&&!seen.has(m.no)&&out.length<10){out.push(m);seen.add(m.no);m=mgrEmp(m)}return out}
function mgrLoop(no,mname){if(!mname||mname==="Executive team")return"";const e=ALLE().find(x=>x.no===no);if(!e)return"";if(mname===e.name)return"An employee cannot report to themselves.";
 const m=ALLE().find(x=>x.name===mname);if(!m)return"";if(m.status==="Terminated")return mname+" has left the company. Choose an active manager.";
 const ch=[m,...mgrChain(m)];if(ch.some(x=>x.no===e.no))return"That would create a loop: "+mname+" already reports (directly or indirectly) to "+e.name+".";return""}
const plink=e=>`<button type="button" class="lnk" data-act="prof:${esc(e.no)}">${esc(e.name)}</button>`;
function mgrLink(e){if(!e.mgr)return"";const m=mgrEmp(e);if(!m)return esc(e.mgr);const up=mgrChain(m);return plink(m)+(up.length?` <span class="mu">› ${up.map(x=>esc(x.name)).join(" › ")}</span>`:"")}
const ddm=v=>v?v.split("-").reverse().join("/"):"";
function careerRows(e){const mv=MOVES().filter(m=>m.no===e.no&&m.mode===MODE),L=[];const lab=k=>(MVF.find(x=>x[0]===k)||[k,k])[1].replace("Reporting manager","Reports to");
 const chg=(m,fr)=>Object.keys(m.ch).map(k=>lab(k)+": "+(fr&&fr[k]!==undefined?(fr[k]||"–")+" → ":"→ ")+(m.ch[k]||"–")).join("<br>");
 mv.forEach(m=>L.push({d:m.eff,t:m.type,det:chg(m,m.done?m.from:null),why:m.reason||"",by:m.by||"",st:m.done?"":"Scheduled"}));
 const cur={pos:e.pos||"",dept:e.dept||"",mgr:e.mgr||"",project:e.project||"",loc:e.loc||""};mv.filter(m=>m.done).sort((a,b)=>a.eff<b.eff?1:-1).forEach(m=>{if(m.from)Object.keys(m.from).forEach(k=>{cur[k]=m.from[k]})});
 L.push({d:e.hire,t:"Joined",det:"Position: "+(cur.pos||"–")+"<br>Department: "+(cur.dept||"–")+"<br>Reports to: "+(cur.mgr||"–"),why:"",by:"",st:""});
 if(canSal())(db("salh",{})[e.no]||[]).forEach(h=>L.push({d:h.eff,t:"Salary revision",det:"Basic "+fmtC(C(h.basic))+", allowances "+fmtC(C(h.allow)),why:h.reason||"",by:h.by||"",st:""}));
 CHIST().filter(c=>c.no===e.no&&/Contract renewed|Probation extended|Terminated|Confirmed/i.test(c.type)).forEach(c=>L.push({d:c.date,t:c.type,det:esc(c.detail||""),why:"",by:c.by||"",st:""}));
 return L.sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:0)}
function careerTab(e){const m=mgrEmp(e),dr=directReports(e),can=canEditEmp(),rows=careerRows(e);
 const card=`<div class="card"><h3 class="kt">Reporting line</h3><dl class="kv"><dt>Reports to</dt><dd>${e.mgr?(m?plink(m):esc(e.mgr)):'<span class="mu">No manager set</span>'}</dd><dt>Management chain</dt><dd>${mgrChain(e).length?mgrChain(e).map(plink).join(" › "):'<span class="mu">–</span>'}</dd><dt>Direct reports</dt><dd>${dr.length?dr.map(plink).join(", "):'<span class="mu">None</span>'}</dd></dl>${can?`<div style="margin-top:10px"><button class="b" data-act="mv:${esc(e.no)}">Promote / transfer / change manager</button></div>`:""}</div>`;
 return`${card}${secH("Career history")}${tbl(["Effective","Event","What changed","Reason","By",""],rows.map(r=>[ddm(r.d),`<b>${esc(r.t)}</b>`,r.det,esc(r.why),esc(r.by),r.st?bd(r.st,"s-wn"):""]),{empty:"No career events yet."})}<div class="cs">Promotions, transfers and manager changes are recorded here with the date they take effect. A change dated in the future is applied automatically on that day.</div>`}
function reporting(){const L=ALLE().filter(e=>e.status!=="Terminated"),can=canEditEmp()&&MODE!=="sample",q=(TAB.rl_q||"").toLowerCase(),d=TAB.rl_d||"";
 const R2=L.filter(e=>(!d||e.dept===d)&&(!q||[e.name,e.no,e.pos,e.mgr].join(" ").toLowerCase().includes(q)));
 const bad=L.filter(e=>e.mgr&&e.mgr!=="Executive team"&&!mgrEmp(e));
 const rows=R2.map(e=>{const m=mgrEmp(e),up=m?mgrEmp(m):null,n=directReports(e).length,warn=e.mgr&&e.mgr!=="Executive team"&&!m;
  const sel=can?`<select data-rlm="${esc(e.no)}" aria-label="Reports to">${mgrOpts(e).map(([v,l])=>`<option value="${esc(v)}" ${v===(e.mgr||"")?"selected":""}>${esc(l)}</option>`).join("")}</select>`:esc(e.mgr||"–");
  return[`<b>${esc(e.name)}</b><div class="mu">${esc(e.no)}</div>`,esc(e.pos||"–"),esc(e.dept),sel+(warn?` ${bd("Not found","s-er")}`:""),up?esc(up.name):(m?'<span class="mu">Top</span>':"–"),n?`<button class="lnk" data-act="prof:${esc(e.no)}">${n}</button>`:'<span class="mu">0</span>']});
 const dp=[...new Set(L.map(e=>e.dept).filter(Boolean))].sort();
 return`${MODE==="sample"?note("Sample data is read-only. Switch to <b>My records</b> to change who reports to whom.","sm"):""}${bad.length?note(bad.length+" employee(s) have a manager who is not an active employee. Pick the right manager below.","er"):""}<div class="bar"><input id="rlq" type="search" placeholder="Search name, number, position or manager" value="${esc(TAB.rl_q||"")}" style="flex:1 1 260px"><select id="rld"><option value="">All departments</option>${dp.map(x=>`<option ${x===d?"selected":""}>${esc(x)}</option>`).join("")}</select><span class="mu">${R2.length} employee(s)</span></div>${ptbl("rl",["Employee","Position","Department","Reports to","Manager's manager","Direct reports"],rows,{csv:"reporting_lines",ps:20,empty:"No employees yet."})}<div class="cs">Changing a manager here is recorded in the employee's Career history with today's date. A manager cannot report to someone below them.</div>`}
reg("reporting","Reporting Lines","Who each employee reports to, their manager's manager, and how many people report to them.",A("HRD","HRS","DM","FIN"),reporting);
document.addEventListener("change",ev=>{const s=ev.target.closest&&ev.target.closest("select[data-rlm]");if(s){const e=ALLE().find(x=>x.no===s.dataset.rlm);if(!e)return;const v=s.value;if(v===(e.mgr||""))return;
  const er=FORMS.mv({no:e.no,eff:iso(T0),type:"Change of manager",pos:e.pos||"",dept:e.dept||"",project:e.project||"",loc:e.loc||"",mgr:v,reason:"Updated in Reporting Lines"});if(er){toast(er);draw()}else toast("Manager updated");return}
 if(ev.target.id==="rld"){TAB.rl_d=ev.target.value;draw()}});
document.addEventListener("input",ev=>{if(ev.target.id==="rlq"){TAB.rl_q=ev.target.value;const p=ev.target.selectionStart;draw();const n=$("#rlq");if(n){n.focus();n.setSelectionRange(p,p)}}});

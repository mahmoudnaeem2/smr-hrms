/* ===== m14: smart navigation (command search, related links, drill links) ===== */
const REL={rep_cost:[["Payroll Register","pay_reg"],["Payroll Processing","pay_proc"],["Payroll Inputs","pay_inputs"],["Reports by Department & Project","rep_dp"]],
 rep_dp:[["Payroll Cost Analysis","rep_cost"],["Headcount Reports","rep_head"],["Cost Centers & Projects","cost_centers"],["Employees","emp"]],
 rep_head:[["HR Analytics","rep_hr"],["Reports by Department & Project","rep_dp"],["Employees","emp"],["Organization Chart","org"]],
 rep_hr:[["Headcount Reports","rep_head"],["Offboarding","offboard"],["Probation Tracker","probation"],["Data Completeness","completeness"]],
 rep_att:[["Daily Attendance","att_d"],["Attendance Exceptions","exceptions"],["Overtime","overtime"],["Timesheets","timesheets"]],
 rep_pay:[["Payroll Cost Analysis","rep_cost"],["Payroll Register","pay_reg"],["Payroll Variance Analysis","pay_var"],["Payroll Reconciliation","pay_rec"]],
 rep_cx:[["Employment Contracts","contracts"],["Probation Tracker","probation"]],
 pay_proc:[["Payroll Inputs","pay_inputs"],["Overtime","overtime"],["Tax & Insurance Settings","comp"],["Payroll Register","pay_reg"],["Payroll Cost Analysis","rep_cost"]],
 pay_inputs:[["Payroll Processing","pay_proc"],["Salary Components","pay_comp"]],
 emp:[["Data Completeness","completeness"],["Organization Chart","org"],["Employee Access","emp_access"],["Cost Centers & Projects","cost_centers"]],
 contracts:[["Probation Tracker","probation"],["Contract Expiry","rep_cx"],["Offboarding","offboard"]],
 probation:[["Employment Contracts","contracts"],["Offboarding","offboard"],["Employees","emp"]],
 completeness:[["Employees","emp"],["Headcount Reports","rep_head"]],
 comp:[["Payroll Processing","pay_proc"],["Salary Components","pay_comp"]],
 overtime:[["Timesheets","timesheets"],["Payroll Inputs","pay_inputs"],["Attendance Reports","rep_att"]]};
function relUI(){const v=$("#view");if(!v)return;const old=v.querySelector(".rel");if(old)old.remove();const L=(REL[page]||[]).filter(x=>{if(HIDE_NAV.some(h=>PAGES[h]&&PAGES[h].title===x[0]))return false;const k=Object.keys(PAGES).find(k=>PAGES[k].title===x[0]);return k&&canSee(k)});if(!L.length)return;
 v.insertAdjacentHTML("beforeend",`<div class="rel"><span class="mu">Related:</span> ${L.map(x=>{const k=Object.keys(PAGES).find(k=>PAGES[k].title===x[0]);return`<button class="chip2" data-go="${k}">${esc(x[0])}</button>`}).join("")}</div>`)}
/* command search */
let PALI=-1,PALR=[];
function palResults(q){q=q.trim().toLowerCase();const out=[];
 if(!q){const seen=new Set();HIST.slice().reverse().forEach(h=>{if(seen.has(h.page)||h.page===page||!PAGES[h.page]||!canSee(h.page))return;seen.add(h.page);out.push({g:"Recent",t:PAGES[h.page].title,s:"Page",a:()=>go(h.page)})});return out.slice(0,6)}
 Object.keys(PAGES).filter(k=>!HIDE_NAV.includes(k)&&canSee(k)&&(PAGES[k].title+" "+PAGES[k].desc).toLowerCase().includes(q)).slice(0,6).forEach(k=>out.push({g:"Pages",t:PAGES[k].title,s:PAGES[k].desc,a:()=>go(k)}));
 if(canSee("profile")||canSee("emp")){allEmps().filter(inScope).filter(e=>[e.name,e.no,e.pos,e.dept,e.project,e.email,e.mobile].join(" ").toLowerCase().includes(q)).slice(0,6).forEach(e=>out.push({g:"Employees",t:e.name+" ("+e.no+")",s:[e.pos,e.dept,e.project].filter(Boolean).join(" · "),a:()=>canSee("profile")?ACTS.prof(e.no):(Q=e.no,go("emp"))}))}
 if(canSee("rep_dp")){DEPTS.filter(d=>d.toLowerCase().includes(q)).forEach(d=>out.push({g:"Departments",t:d,s:"Open the department and project report",a:()=>{F.dept=d;F.project="";TAB.rdp="dept";go("rep_dp")}}));
  [...new Set([...ccNames(""),...PROJL()])].filter(p=>p.toLowerCase().includes(q)).slice(0,4).forEach(p=>out.push({g:"Projects and cost centers",t:p,s:"Open the project report",a:()=>{F.project=p;F.dept="";TAB.rdp="project";go("rep_dp")}}))}
 return out.slice(0,14)}
function palDraw(){let b=$("#pal");const g=$("#gs");if(!g)return;if(!b){g.parentNode.style.position="relative";g.parentNode.insertAdjacentHTML("beforeend",'<div id="pal" role="listbox" hidden></div>');b=$("#pal")}
 PALR=palResults(g.value);if(!PALR.length||document.activeElement!==g){b.hidden=true;return}
 let last="";b.innerHTML=PALR.map((r,i)=>{const h=r.g!==last?`<div class="pg">${esc(r.g)}</div>`:"";last=r.g;return h+`<button type="button" class="pi ${i===PALI?"on":""}" data-pi="${i}" role="option"><b>${esc(r.t)}</b><small>${esc((r.s||"").slice(0,80))}</small></button>`}).join("");b.hidden=false}
function palPick(i){const r=PALR[i];if(!r)return;$("#pal").hidden=true;const g=$("#gs");g.value="";g.blur();r.a()}
function palUI(){const g=$("#gs");if(!g)return;g.disabled=false;g.placeholder="Search (Ctrl+K)";g.setAttribute("aria-label","Search pages, people, projects");g.onkeydown=null;
 if(!g.dataset.pal){g.dataset.pal=1;g.addEventListener("input",()=>{PALI=-1;palDraw()});g.addEventListener("focus",()=>{PALI=-1;palDraw()});g.addEventListener("blur",()=>setTimeout(()=>{const b=$("#pal");if(b)b.hidden=true},180));
  g.addEventListener("keydown",e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();PALI=(PALI+(e.key==="ArrowDown"?1:-1)+PALR.length)%Math.max(1,PALR.length);palDraw()}else if(e.key==="Enter"){e.preventDefault();palPick(PALI>=0?PALI:0)}else if(e.key==="Escape"){g.value="";g.blur()}})}}
document.addEventListener("mousedown",e=>{const b=e.target.closest("[data-pi]");if(b){e.preventDefault();palPick(+b.dataset.pi)}});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();const g=$("#gs");if(g){g.focus();g.select()}}else if(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||"")){e.preventDefault();const g=$("#gs");if(g)g.focus()}else if(e.altKey&&e.key==="ArrowLeft"){e.preventDefault();goBack()}});
/* comfort theme */
const CMF=["light","soft","dark"];let CMFV="light";try{CMFV=localStorage.getItem("smr_comfort")||"light"}catch(e){}
function cmfApply(){const r=document.documentElement;r.setAttribute("data-comfort",CMFV);r.setAttribute("data-theme",CMFV==="dark"?"dark":"light")}
cmfApply();
function cmfUI(){let b=$("#thm");if(!b){const t=document.querySelector(".topbar");if(!t)return;t.insertAdjacentHTML("beforeend",'<button id="thm" type="button" data-act="thm"></button>');b=$("#thm")}b.textContent=({light:"Light",soft:"Soft",dark:"Dark"})[CMFV];b.title="Change screen colors to be easier on the eyes";b.setAttribute("aria-label","Screen colors: "+CMFV)}
ACTS.thm=()=>{CMFV=CMF[(CMF.indexOf(CMFV)+1)%3];try{localStorage.setItem("smr_comfort",CMFV)}catch(e){}cmfApply();cmfUI()};

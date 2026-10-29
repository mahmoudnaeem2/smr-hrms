/* ===== m19: in-app notifications for every signed-in person ===== */
const nkey=()=>(typeof ESES!=="undefined"&&ESES?ESES.no:typeof SSES!=="undefined"&&SSES?SSES.id:role===R.EMP?"emp:"+WSNO:role);
const nid=x=>nkey()+"|"+x.id;
const isRead=x=>!!db("nread",{})[nid(x)];
let NF=[];
function feed(){const o=[],who=(typeof ESES!=="undefined"&&ESES)?ESES.no:(role===R.EMP?WSNO:null);
 const ap=apprItems().filter(i=>!i.fin&&canAct(i));if(ap.length)o.push({id:"ap|"+ap.map(i=>i.id).join(","),t:ap.length+" approval"+(ap.length>1?"s":"")+" waiting for you",d:ap.slice(0,3).map(i=>i.type+" · "+((empBy(i.no)||{}).name||"")).join(", "),go:"appr",tone:"s-er"});
 if(who){
  LR.filter(r=>r.mode===MODE&&r.no===who&&(r.status==="Approved"||r.status==="Rejected")).forEach(r=>o.push({id:"lr|"+r.id+"|"+r.status,t:"Your "+r.type.toLowerCase()+" request for "+r.start+" was "+r.status.toLowerCase(),act:"to",tone:r.status==="Approved"?"s-ok":"s-er"}));
  HQL().filter(r=>r.no===who&&r.status!=="Pending").forEach(r=>o.push({id:"hq|"+r.id+"|"+r.status,t:"Your request ("+((HQT(r.type)||{}).t||r.type)+") is "+(HQS[r.status]||[r.status])[0].toLowerCase(),d:r.resp||"",act:"rq",tone:r.status==="Rejected"?"s-er":"s-ok"}));
  WARNS().filter(w=>w.no===who&&!w.withdrawn&&!w.ack).forEach(w=>o.push({id:"wn|"+w.id,t:"You have a warning to acknowledge ("+w.level+")",act:"wn",tone:"s-wn"}));
  const dm=DOCS_REQ.filter(d=>docStatus(who,d)==="Missing");if(dm.length)o.push({id:"dm|"+dm.join(","),t:dm.length+" document"+(dm.length>1?"s":"")+" HR still needs from you",d:dm.join(", "),act:"dc",tone:"s-wn"})}
 if(canSee("hr_req")){const n=hqOpen();if(n)o.push({id:"hr|"+n,t:n+" employee request"+(n>1?"s":"")+" waiting for HR",go:"hr_req",tone:"s-wn"})}
 return o}
function updBell(){const b=$("#bdg");if(!b)return;let n=0;try{n=feed().filter(x=>!isRead(x)).length;if(canSee("dash")){const m=page==="dash"?M:build();n+=m.alerts.filter(a=>a[0]!=="low"&&a[3]).length}}catch(e){}b.textContent=n;b.hidden=!n}
function openNotif(){NF=feed();LASTDRILL=null;$("#dt").textContent="Notifications";$("#dd").textContent="What needs you, and what happened to your requests.";
 const m=canSee("dash")?build():null,order={high:0,med:1,low:2},al=m?m.alerts.filter(a=>a[3]).sort((a,b)=>order[a[0]]-order[b[0]]):[];
 const un=NF.filter(x=>!isRead(x)).length;
 $("#db").innerHTML=`${NF.length?`<div class="bar"><b>${un} new</b>${un?`<button class="b" data-act="nrdall">Mark all as read</button>`:""}</div>`+NF.map((x,i)=>`<div class="act" style="align-items:flex-start;gap:10px"><span style="min-width:0">${isRead(x)?"":bd("New","s-in")+" "}${esc(x.t)}${x.d?`<div class="mu">${esc(x.d)}</div>`:""}</span><span style="display:flex;gap:6px;flex:none"><button class="b p" data-act="nopen:${i}">Open</button>${isRead(x)?"":`<button class="b" data-act="nrd:${i}">Read</button>`}</span></div>`).join(""):`<div class="empty">Nothing new for you.</div>`}
 ${al.length?`<h3 class="kt" style="margin-top:16px">HR alerts</h3>`+al.map(([sv,t,id,n])=>`<button class="al" data-d="${id}"><i class="sv ${sv}"></i><span>${t}</span><span class="badge ${sv==="high"?"s-er":sv==="med"?"s-wn":"s-mu"}">${n}</span></button>`).join(""):""}
 <div class="mu" style="margin-top:14px;font-size:12px">In-app only. Email and push messages need a server and are not active in this prototype.</div>`;
 $("#dx").hidden=true;const x=$("#dxx");if(x)x.hidden=true;$("#drawer").classList.add("open");$("#dcl").focus()}
const markN=x=>{db("nread",{})[nid(x)]=1;sv("nread")};
ACTS.nrd=i=>{const x=NF[+i];if(x)markN(x);openNotif();updBell()};
ACTS.nrdall=()=>{NF.forEach(markN);openNotif();updBell()};
ACTS.ptg=k=>{page="work";TAB._pp="work";TAB.pt=k;closeDr();draw();window.scrollTo(0,0);if(typeof tabVis==="function")tabVis()};
ACTS.nopen=i=>{const x=NF[+i];if(!x)return;markN(x);closeDr();if(x.act)ACTS.ptg(x.act);else{page=x.go;PG=0;draw()}};

/* ===== m19: in-app notifications for every signed-in person ===== */
const nkey=()=>(typeof ESES!=="undefined"&&ESES?ESES.no:typeof SSES!=="undefined"&&SSES?SSES.id:role===R.EMP?"emp:"+WSNO:role);
const nid=x=>nkey()+"|"+x.id;
const isRead=x=>!!db("nread",{})[nid(x)];
let NF=[];
function feed(){const o=[],who=(typeof ESES!=="undefined"&&ESES)?ESES.no:(role===R.EMP?WSNO:null);
 const ap=apprItems().filter(i=>!i.fin&&canAct(i));if(ap.length)o.push({id:"ap|"+ap.map(i=>i.id).join(","),t:ap.length+" approval"+(ap.length>1?"s":"")+" waiting for you",d:ap.slice(0,3).map(i=>i.type+" · "+((empBy(i.no)||{}).name||"")).join(", "),go:"appr",tone:"s-er"});
 if(who){
  LR.filter(r=>r.mode===MODE&&r.no===who&&(r.status==="Approved"||r.status==="Rejected")).forEach(r=>o.push({id:"lr|"+r.id+"|"+r.status,t:"Your "+r.type.toLowerCase()+" request for "+(typeof lrSpan==="function"?lrSpan(r.start,r.end):r.start)+" was "+r.status.toLowerCase(),act:"to",tone:r.status==="Approved"?"s-ok":"s-er"}));
  HQL().filter(r=>r.no===who&&r.status!=="Pending").forEach(r=>o.push({id:"hq|"+r.id+"|"+r.status,t:"Your request ("+((HQT(r.type)||{}).t||r.type)+") is "+(HQS[r.status]||[r.status])[0].toLowerCase(),d:r.resp||"",act:"rq",tone:r.status==="Rejected"?"s-er":"s-ok"}));
  WARNS().filter(w=>w.no===who&&!w.withdrawn&&!w.ack).forEach(w=>o.push({id:"wn|"+w.id,t:"You have a warning to acknowledge ("+w.level+")",act:"wn",tone:"s-wn"}));
  const dm=DOCS_REQ.filter(d=>docStatus(who,d)==="Missing");if(dm.length)o.push({id:"dm|"+dm.join(","),t:dm.length+" document"+(dm.length>1?"s":"")+" HR still needs from you",d:dm.join(", "),act:"dc",tone:"s-wn"})}
 if(canSee("hr_req")){const n=hqOpen();if(n)o.push({id:"hr|"+n,t:n+" employee request"+(n>1?"s":"")+" waiting for HR",go:"hr_req",tone:"s-wn"})}
 return o}
function updBell(){const b=$("#bdg");if(!b)return;let n=0;try{n=feed().filter(x=>!isRead(x)).length;if(canSee("dash")){const m=page==="dash"?M:build();n+=m.alerts.filter(a=>a[0]!=="low"&&a[3]).length}}catch(e){}b.textContent=n;b.hidden=!n}
function openNotif(){NF=feed();LASTDRILL=null;$("#dt").textContent="Notifications";$("#dd").textContent="What needs you, and what happened to your requests.";
 const m=canSee("dash")?build():null,order={high:0,med:1,low:2},al=m?m.alerts.filter(a=>a[3]).sort((a,b)=>order[a[0]]-order[b[0]]):[];
 const un=NF.filter(x=>!isRead(x)).length;
 const IN={ap:"M9 12l2 2 4-4M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",lr:"M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",hq:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",wn:"M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",dm:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15l3 3 3-3",hr:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"},
  ico=x=>{const k=String(x.id).split("|")[0],tn=x.tone==="s-ok"?"ok":x.tone==="s-wn"?"wn":"er";return`<span class="nfc ${tn}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IN[k]||IN.hq}"/></svg></span>`},
  row=(x,i)=>`<div class="nfr${isRead(x)?"":" un"}"><button class="nfi" data-act="nopen:${i}">${ico(x)}<span class="nft"><b>${esc(x.t)}</b>${x.d?`<span>${esc(x.d)}</span>`:""}</span>${isRead(x)?"":'<i class="nfd" aria-label="New"></i>'}</button>${isRead(x)?"":`<button class="nfx" data-act="nrd:${i}" title="Mark as read" aria-label="Mark as read">&#10003;</button>`}</div>`,
  idx=NF.map((x,i)=>[x,i]),newL=idx.filter(([x])=>!isRead(x)),oldL=idx.filter(([x])=>isRead(x));
 $("#db").innerHTML=`${NF.length?`<div class="nfh"><span>${un?`<b>${un}</b> new`:"You're all caught up"}</span>${un?`<button class="nfa" data-act="nrdall">Mark all as read</button>`:""}</div>
  ${newL.length?`<div class="nfg">New</div><div class="nfl">${newL.map(([x,i])=>row(x,i)).join("")}</div>`:""}${oldL.length?`<div class="nfg">Earlier</div><div class="nfl">${oldL.map(([x,i])=>row(x,i)).join("")}</div>`:""}`:`<div class="nfe"><span class="nfc ok"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg></span><b>You're all caught up</b><span>New approvals and updates on your requests will show up here.</span></div>`}
 ${al.length?`<div class="nfg">HR alerts</div><div class="nfl">`+al.map(([sv,t,id,n])=>`<div class="nfr"><button class="nfi" data-d="${id}"><span class="nfc ${sv==="high"?"er":sv==="med"?"wn":"mu"}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IN.wn}"/></svg></span><span class="nft"><b>${t}</b></span><span class="badge ${sv==="high"?"s-er":sv==="med"?"s-wn":"s-mu"}">${n}</span></button></div>`).join("")+`</div>`:""}
 <div class="nfn">Notifications show here only. Email alerts are not set up yet.</div>`;
 $("#dx").hidden=true;const x=$("#dxx");if(x)x.hidden=true;$("#drawer").classList.add("open");$("#dcl").focus()}
const markN=x=>{db("nread",{})[nid(x)]=1;sv("nread")};
ACTS.nrd=i=>{const x=NF[+i];if(x)markN(x);openNotif();updBell()};
ACTS.nrdall=()=>{NF.forEach(markN);openNotif();updBell()};
ACTS.ptg=k=>{page="work";TAB._pp="work";TAB.pt=k;closeDr();draw();window.scrollTo(0,0);if(typeof tabVis==="function")tabVis()};
ACTS.nopen=i=>{const x=NF[+i];if(!x)return;markN(x);closeDr();if(x.act)ACTS.ptg(x.act);else{page=x.go;PG=0;draw()}};

/* ===== m40: where a leave request stands (shown to the employee) ===== */
function lrTrack(r,e){
 const D=(db("dec",{})["L"+r.id])||{step:0,log:[]},log=D.log||[],lst=log[log.length-1],mg=String(e.lapp||e.mgr||"").trim(),hasM=!!mg&&mg!==e.name,fn=n=>String(n||"").split(" ")[0];
 const dt=x=>{try{return x&&x.t?new Date(x.t).toISOString().slice(0,10).split("-").reverse().join("/"):""}catch(_){return""}},who=x=>!x?"HR":x.role===R.DM?"your manager":"HR";
 const nodes=[["Sent","done",""]];if(hasM)nodes.push(["Manager","todo",fn(mg)]);nodes.push(["HR","todo",""]);
 let txt="",tone="";
 if(r.status==="Cancelled"){nodes.forEach((n,i)=>n[1]=i?"off":"done");txt="Cancelled by you.";tone="mu"}
 else if(r.status==="Rejected"){const bi=lst&&lst.role===R.DM&&hasM?1:nodes.length-1;nodes.forEach((n,i)=>n[1]=i===0||i<bi?"done":i===bi?"bad":"off");txt="Rejected by "+who(lst)+(dt(lst)?" on "+dt(lst):"")+(lst&&lst.reason?": "+lst.reason:"");tone="er"}
 else if(r.status==="Approved"){nodes.forEach(n=>n[1]="done");txt="Approved by "+who(lst)+(dt(lst)?" on "+dt(lst):"")+".";tone="ok"}
 else{const mDone=hasM&&(D.step||0)>=1;nodes[0][1]="done";const cur=hasM?(mDone?2:1):1;nodes.forEach((n,i)=>{if(i>0&&i<cur)n[1]="done";else if(i===cur)n[1]="cur"});
  txt=hasM&&!mDone?"Waiting for "+mg+" (your manager)":"Waiting for HR";tone="wn"}
 const ck='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',xx='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
 return`<ol class="lrs">${nodes.map(n=>`<li class="${n[1]}"><span class="dot">${n[1]==="done"?ck:n[1]==="bad"?xx:""}</span><span class="lbl">${esc(n[0])}</span>${n[2]?`<span class="sub">${esc(n[2])}</span>`:""}</li>`).join("")}</ol><div class="lrt ${tone}">${esc(txt)}</div>`}
function lrCards(mine,seed,e){
 if(!mine.length&&!seed.length)return`<div class="card"><div class="empty">No requests yet. Use the form above to submit your first leave request.</div></div>`;
 const bc=s=>s==="Pending"?"s-wn":s==="Approved"?"s-ok":s==="Rejected"?"s-er":"s-mu",dd=x=>typeof dmyS==="function"?dmyS(x):x;
 return`<div class="lrl">${mine.map(r=>{const n=typeof attCount==="function"?attCount("leave|"+r.id):0;return`<div class="lrc"><div class="lrh"><div><b>${esc(r.type)}</b><span>${dd(r.start)}${r.end!==r.start?" → "+dd(r.end):""} · ${r.days} day${+r.days===1?"":"s"}</span></div><span class="badge ${bc(r.status)}">${esc(r.status)}</span></div>${lrTrack(r,e)}${r.status==="Pending"||n?`<div class="lrf">${r.status==="Pending"?`<button class="b" data-ws="cancel:${r.id}">Cancel request</button>`:""}${n?`<button class="b" data-act="att:leave|${r.id}">Files (${n})</button>`:""}</div>`:""}</div>`}).join("")}${seed.map(a=>`<div class="lrc"><div class="lrh"><div><b>${esc(a.detail)}</b></div><span class="badge s-wn">Pending</span></div><div class="lrt wn">Waiting for ${esc(e.mgr||"HR")}</div></div>`).join("")}</div>`}

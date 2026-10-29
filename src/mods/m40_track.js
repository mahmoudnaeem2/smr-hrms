const LRM=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],LRD=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
 lrP=v=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(v||"");return m?{y:+m[1],m:+m[2]-1,d:+m[3],w:new Date(Date.UTC(+m[1],+m[2]-1,+m[3])).getUTCDay()}:null},
 lrNice=v=>{const a=lrP(v);return a?a.d+" "+LRM[a.m]+" "+a.y:""},
 lrSpan=(s,e)=>{const a=lrP(s),b=lrP(e);if(!a)return"";if(!b||s===e)return LRD[a.w]+" "+a.d+" "+LRM[a.m]+" "+a.y;if(a.y===b.y&&a.m===b.m)return a.d+" – "+b.d+" "+LRM[a.m]+" "+a.y;if(a.y===b.y)return a.d+" "+LRM[a.m]+" – "+b.d+" "+LRM[b.m]+" "+a.y;return lrNice(s)+" – "+lrNice(e)};
/* ===== m40: where a leave request stands (shown to the employee) ===== */
function lrTrack(r,e){
 const D=(db("dec",{})["L"+r.id])||{step:0,log:[]},log=D.log||[],lst=log[log.length-1],mg=String(e.lapp||e.mgr||"").trim(),hasM=!!mg&&mg!==e.name,fn=n=>String(n||"").split(" ")[0];
 const dt=x=>{try{return x&&x.t?lrNice(new Date(x.t).toISOString().slice(0,10)):""}catch(_){return""}},who=x=>!x?"HR":x.role===R.DM?"your manager":"HR";
 const nodes=[["Sent","done",""]];if(hasM)nodes.push(["Manager","todo",fn(mg)]);nodes.push(["HR","todo",""]);
 let txt="",tone="";
 if(r.status==="Cancelled"){nodes.forEach((n,i)=>n[1]=i?"off":"done");txt="Cancelled by you.";tone="mu"}
 else if(r.status==="Rejected"){const bi=lst&&lst.role===R.DM&&hasM?1:nodes.length-1;nodes.forEach((n,i)=>n[1]=i===0||i<bi?"done":i===bi?"bad":"off");txt="Rejected by "+who(lst)+(dt(lst)?" on "+dt(lst):"")+(lst&&lst.reason?": "+lst.reason:"");tone="er"}
 else if(r.status==="Approved"){nodes.forEach(n=>n[1]="done");txt="Approved by "+who(lst)+(dt(lst)?" on "+dt(lst):"")+".";tone="ok"}
 else{const mDone=hasM&&(D.step||0)>=1;nodes[0][1]="done";const cur=hasM?(mDone?2:1):1;nodes.forEach((n,i)=>{if(i>0&&i<cur)n[1]="done";else if(i===cur)n[1]="cur"});
  txt=hasM&&!mDone?"Waiting for "+mg+" (your manager)":"Waiting for HR";tone="wn"}
 const ck='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',xx='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
 lrTrack.last={txt,tone};return`<ol class="lrs">${nodes.map(n=>`<li class="${n[1]}"><span class="dot">${n[1]==="done"?ck:n[1]==="bad"?xx:""}</span><span class="lbl">${esc(n[0])}</span>${n[2]?`<span class="sub">${esc(n[2])}</span>`:""}</li>`).join("")}</ol><div class="lrt ${tone}">${esc(txt)}</div>`}
function lrCards(mine,seed,e){
 if(!mine.length&&!seed.length)return`<div class="card"><div class="empty">No requests yet. Use the form above to submit your first leave request.</div></div>`;
 const MN=["January","February","March","April","May","June","July","August","September","October","November","December"],bc=s=>s==="Pending"?"s-wn":s==="Approved"?"s-ok":s==="Rejected"?"s-er":"s-mu",
  ic={ok:'<path d="M20 6L9 17l-5-5"/>',er:'<path d="M18 6L6 18M6 6l12 12"/>',wn:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',mu:'<path d="M5 12h14"/>'};
 const all=mine.slice().sort((a,b)=>String(b.start).localeCompare(String(a.start))),nP=all.filter(r=>r.status==="Pending").length+seed.length,nA=all.filter(r=>r.status==="Approved").length,nR=all.filter(r=>r.status==="Rejected").length;
 const f=typeof tab==="function"?tab("lrf","all"):"all",list=all.filter(r=>f==="all"||(f==="pending"&&r.status==="Pending")||(f==="appr"&&r.status==="Approved")||(f==="rej"&&(r.status==="Rejected"||r.status==="Cancelled")));
 const lim=(typeof TAB!=="undefined"&&TAB.lrall)?9999:8,shown=list.slice(0,lim),openP=nP<=3;
 const row=r=>{const n=typeof attCount==="function"?attCount("leave|"+r.id):0,body=lrTrack(r,e),st=lrTrack.last;
  return`<details class="lrr"${r.status==="Pending"&&openP?" open":""}><summary><span class="lri ${st.tone}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic[st.tone]||ic.mu}</svg></span><span class="lrm"><b>${esc(r.type)}</b><span>${lrSpan(r.start,r.end)} · ${r.days} day${+r.days===1?"":"s"}</span></span><span class="lrq"><span class="badge ${bc(r.status)}">${esc(r.status)}</span><svg class="chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></span></summary><div class="lrb">${body}${r.status==="Pending"||n?`<div class="lrf">${r.status==="Pending"?`<button class="b" data-ws="cancel:${r.id}">Cancel request</button>`:""}${n?`<button class="b" data-act="att:leave|${r.id}">Files (${n})</button>`:""}</div>`:""}</div></details>`};
 let out="",cur="";
 shown.forEach(r=>{const m=P3m(r.start);if(list.length>6&&m!==cur){cur=m;out+=`<div class="lrg">${esc(m)}</div>`}out+=row(r)});
 function P3m(v){const m=/^(\d{4})-(\d{2})/.exec(v||"");return m?MN[+m[2]-1]+" "+m[1]:""}
 const sd=f==="all"||f==="pending"?seed.map(a=>`<div class="lrr"><div class="lrs0"><span class="lri wn"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">${ic.wn}</svg></span><span class="lrm"><b>${esc(a.detail)}</b><span>Waiting for ${esc(e.mgr||"HR")}</span></span><span class="lrq"><span class="badge s-wn">Pending</span></span></div></div>`).join(""):"";
 const chips=typeof tabs==="function"?tabs("lrf",[["all","All ("+all.length+")"],["pending","Pending ("+nP+")"],["appr","Approved ("+nA+")"],["rej","Rejected ("+nR+")"]],"all"):"";
 return`<div class="lrx">${all.length>3?chips:""}<div class="lrlist">${sd}${out||(sd?"":'<div class="empty" style="padding:22px">No requests in this view.</div>')}</div>${list.length>shown.length?`<button class="b lrmore" data-act="lrmore">Show all ${list.length} requests</button>`:""}</div>`}
ACTS.lrmore=()=>{TAB.lrall=1;draw()};

/* Employee home (ZenHR-style): welcome, balances, colourful tiles, pending requests */
const ZT=[["rq","Requests","overtime","#14a39a","#dff5f2"],["ps","Payslips","payslips","#e5484d","#fde8e8"],["dc","Documents","docs","#f0a020","#fff1d6"],["at","Attendance","att_d","#ee6c3a","#ffe9df"],["to","Time off","leave_cal","#2f80ed","#e2eefd"],["ln","Loans","loans","#2fa66a","#e0f5e9"],["wn","Warnings","warns","#d9822b","#fdebd6"],["ct","Contract","contracts","#5b5bd6","#e8e8fb"],["pf","Profile","profile","#8a5cd1","#efe6fb"]];
const zIc=(k,c)=>`<svg viewBox="0 0 24 24" fill="${c}" fill-opacity=".13" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[k]||IC.dash}"/></svg>`;
function portal(initial){const L=allEmps().filter(x=>x.status!=="Terminated");if(typeof ESES!=="undefined"&&ESES)WSNO=ESES.no;if(!L.some(x=>x.no===WSNO))WSNO=(L[0]||{}).no;const e=L.find(x=>x.no===WSNO);
 if(!e)return portalBase(initial);if(TAB._pp!==page){TAB._pp=page;TAB.pt=initial||"ov"}if((TAB.pt||"ov")!=="ov")return portalBase(initial);
 const b=balances(e),fx=v=>(+v).toFixed(2),first=esc((e.name||"").split(" ")[0]),nWn=WARNS().filter(w=>w.no===e.no&&!w.withdrawn&&!w.ack).length,
 bal=["Annual leave","Sick leave","Emergency leave"].filter(t=>b[t]&&b[t].open!=null).map(t=>{const x=b[t],tot=Math.max(0,x.open+x.adj);return`<button class="zb" data-act="pt:to"><span>${t.replace(" leave","")}${t==="Annual leave"?" vacation":" days"}</span><b>${fx(x.avail)}<small>/${fx(tot)}</small></b><i>Days</i></button>`}).join(""),
 tiles=ZT.map(([k,l,ic,c,bg])=>`<button class="zt" data-act="pt:${k}" style="--zc:${c};--zbg:${bg}"><span class="zi">${zIc(ic,c)}</span><span class="zl">${l}</span>${k==="wn"&&nWn?`<i class="zdot">${nWn}</i>`:""}</button>`).join(""),
 lv=LR.filter(r=>r.mode===MODE&&r.no===e.no&&r.status==="Pending").map(r=>({t:r.id,a:dmyS(r.start)+(r.end!==r.start?" - "+dmyS(r.end):""),b:r.note?r.note.replace(/ \(entered by .*\)$/,""):r.days+" working day(s)",c:r.type,s:"Pending",go:"to"})),
 hq=HQL().filter(r=>r.no===e.no&&!/closed|done|rejected|approved|complete/i.test(r.status||"")).map(r=>({t:+String(r.id).replace(/\D/g,"")||0,a:(HQT(r.type)||{}).t||r.type,b:r.note||"Sent to HR",c:"HR request",s:r.status||"Pending",go:"rq"})),
 P=[...lv,...hq].sort((a,c)=>c.t-a.t).slice(0,5),
 pend=P.length?P.map(p=>`<button class="zp" data-act="pt:${p.go}"><div><b>${esc(p.a)}</b><span>${esc(p.b)}</span><em>${esc(p.c)}<i>${esc(p.s)}</i></em></div></button>`).join(""):`<div class="zp zp0">Nothing waiting. Tap Requests or Time off to send one.</div>`;
 return`${MODE==="sample"?note("<b>Sample data.</b> Leave entitlements are sample policy values, not verified against Egyptian labour law.","sm"):""}
 <div class="zh"><h1 class="zw">Welcome, ${first}</h1><div class="zsub">${esc(e.pos||"")}${e.dept?" · "+esc(e.dept):""}</div>
 ${(typeof ESES!=="undefined"&&ESES)?"":`<label class="pprev2">Previewing <select id="wsel">${L.filter(x=>inScope(x)).map(x=>`<option value="${esc(x.no)}" ${x.no===WSNO?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>`}
 <div class="zrow"><span>Your remaining balance</span><button class="zlink" data-act="pt:to">Full Details</button></div><div class="zbal">${bal}</div>
 <div class="zq">What would you like to do?</div><div class="zgrid">${tiles}</div>
 <div class="zq">Pending requests</div><div class="zpl">${pend}</div></div>`}

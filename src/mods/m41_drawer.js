/* ===== m41: drill-down drawer that reads well (dates, plurals, badges, no clipped columns, cards on phones) ===== */
(function(){
 const MN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],ST={Approved:"s-ok",Active:"s-ok",Paid:"s-ok",Resolved:"s-ok",Reconciled:"s-ok",Pending:"s-wn",Open:"s-wn",Waiting:"s-wn",Draft:"s-wn",Rejected:"s-er",Terminated:"s-er",Cancelled:"s-mu",Closed:"s-mu"};
 const dmy=(d,m,y)=>(+d)+" "+MN[+m-1]+" "+y;
 function nice(t){
  let s=String(t==null?"":t);
  s=s.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,(a,d,m,y)=>+m>=1&&+m<=12?dmy(d,m,y):a).replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g,(a,y,m,d)=>+m>=1&&+m<=12?dmy(d,m,y):a);
  s=s.replace(/\b(\d{1,2} [A-Z][a-z]{2} \d{4}) to \1\b/g,"$1");
  s=s.replace(/\b(\d+(?:\.\d+)?) day\(s\)/g,(a,n)=>n+(+n===1?" day":" days"));
  if(/^[-+]?0+(\.0+)?$/.test(s.trim()))s="0";
  return s}
 const cell=v=>{const s=nice(v),k=s.trim();return ST[k]?`<span class="badge ${ST[k]}">${esc(k)}</span>`:esc(s)};
 window.drOpenNice=function(o){
  $("#dt").textContent=o.title;$("#dd").textContent=o.desc||"";
  const rows=o.rows||[],cols=o.cols||[];
  if(!rows.length){$("#db").innerHTML=`<div class="empty">${cols.length?"No records match the current filters.":esc(o.desc)}</div>`}
  else{
   const tbl=`<div class="wrap drt"><table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td${i===0?' class="f"':""}>${cell(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
   const cards=`<div class="drl">${rows.map(r=>{const t=r.findIndex(c=>String(c).trim()!=="");const head=t<0?"":cell(r[t]);return`<div class="drc"><div class="drh">${head}</div>${r.map((c,i)=>i===t||String(c).trim()===""?"":`<div class="drk"><span>${esc(cols[i]||"")}</span><b>${cell(c)}</b></div>`).join("")}</div>`}).join("")}</div>`;
   $("#db").innerHTML=(rows.length>8?`<div class="drn">${rows.length} records</div>`:"")+tbl+cards}
  $("#dx").hidden=!rows.length;$("#drawer").classList.add("open");$("#dcl").focus()};
 /* the side panel closes when you click anywhere outside it, or press Escape */
 document.addEventListener("click",ev=>{const d=document.getElementById("drawer");if(!d||!d.classList.contains("open"))return;const t=ev.target;if(!t||!t.closest)return;if(t.closest("#drawer,#confirm,.scrim,.rmo,.toast,#toast,#cg"))return;if(!document.contains(t))return;closeDr()},true);
 document.addEventListener("keydown",ev=>{if(ev.key!=="Escape")return;const d=document.getElementById("drawer"),c=document.getElementById("confirm");if(c&&!c.hidden)return;if(d&&d.classList.contains("open"))closeDr()});
})();

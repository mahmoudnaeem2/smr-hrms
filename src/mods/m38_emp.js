/* Employees page: upcoming birthdays strip */
function bdStrip(){
 const t=iso(T0),y=+t.slice(0,4),td=new Date(t+"T00:00:00Z"),MN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
 const L=allEmps().filter(inScope).filter(e=>e.dob&&e.status!=="Terminated").map(e=>{let d=y+"-"+e.dob.slice(5);if(d<t)d=(y+1)+"-"+e.dob.slice(5);const n=Math.round((new Date(d+"T00:00:00Z")-td)/864e5);return{e,d,n,age:+d.slice(0,4)-+e.dob.slice(0,4)}}).filter(x=>x.n<=30).sort((a,b)=>a.n-b.n);
 const hdr=`<div class="bdh"><b>Upcoming birthdays</b><span class="mu">next 30 days</span><button class="lnk" data-go="r_bday">All birthdays &amp; anniversaries</button></div>`;
 if(!L.length)return`<div class="card bds">${hdr}<p class="mu" style="margin:6px 0 0">${allEmps().some(e=>e.dob)?"No birthdays in the next 30 days.":"No dates of birth recorded yet. Add them in each employee profile to see birthdays here."}</p></div>`;
 return`<div class="card bds">${hdr}<div class="bdl">${L.slice(0,6).map(x=>`<div class="bdi"><i class="av">${ini(x.e.name)}</i><div><b>${esc(x.e.name)}</b><span>${+x.d.slice(8)} ${MN[+x.d.slice(5,7)-1]} · turns ${x.age} · ${x.n===0?"today":x.n===1?"tomorrow":"in "+x.n+" days"}</span></div></div>`).join("")}</div>${L.length>6?`<p class="mu" style="margin:8px 0 0">+ ${L.length-6} more in the full report.</p>`:""}</div>`}

/* Cloud mode (Supabase). Only active when the page was started by the cloud loader. */
(function(){const C=window.SMR_CLOUD_ON;if(!C)return;
 document.body.classList.add("cloud");
 try{const U=USR();if(!U.some(x=>x.id===C.uid))U.push({id:C.uid,name:C.name,role:C.role,active:true,email:C.email||""})}catch(e){}
 /* the signed-in role is fixed by the server: no "preview as" switching */
 const lockRole=()=>{try{if(role!==C.role)role=C.role;const sel=$("#role");if(sel){if(sel.value!==C.role)sel.value=C.role;sel.disabled=true}}catch(e){}};
 window.rmToggle=()=>{};lockRole();
 /* real accounts cannot preview other roles: show who is signed in instead of "Switch role" */
 const idBox=()=>{const b=document.querySelector(".rmb");if(!b)return;const sm=b.querySelector("small"),t=C.name||C.email||"";if(sm&&sm.textContent!==t)sm.textContent=t;const v=b.querySelector("svg");if(v)v.style.display="none";b.style.cursor="default";b.setAttribute("aria-haspopup","false");b.tabIndex=-1;b.setAttribute("aria-label","Signed in as "+t)};setInterval(idBox,500);idBox();setInterval(()=>{if(role!==C.role){lockRole();draw()}else lockRole()},500);
 /* sign-ins live in Supabase (Authentication > Users), not in this browser */
 try{NAV.forEach(g=>{g[1]=g[1].filter(i=>i[1]!=="emp_access");g[1].forEach(i=>{if(i[1]==="users")i[0]="Users & Access"})})}catch(e){}
 ACTS.esout=()=>{ask("Sign out?","Sign out",()=>C.signOut())};
 const st=()=>{const f=document.querySelector(".side-f");if(!f)return;let el=document.getElementById("cst");if(!el){f.insertAdjacentHTML("afterbegin",'<div id="cst" role="status" aria-live="polite"></div>');el=document.getElementById("cst")}
  const s=C.status();el.className=s==="saved"||s==="saving"?"":"off";el.textContent=s==="saved"?"All changes saved":s==="saving"?"Saving…":s==="offline"?"Offline. Changes are not saved yet.":s==="stale"?"Newer data is available. Reload.":"Conflict. Reload.";
  if(s==="stale"&&!document.getElementById("cstb"))el.insertAdjacentHTML("afterend",'<button class="b" id="cstb" style="margin-top:6px;width:100%">Reload latest data</button>')}
 window.addEventListener("smr-cloud-status",st);document.addEventListener("click",ev=>{if(ev.target.id==="cstb")C.reload()});
 setTimeout(st,0);

 /* ===== Users & Access: accounts live in Supabase; HR Director / System Administrator manage them here ===== */
 let UP=null,UPERR="",UPB=false;
 const isAdm=()=>role===R.ADM||role===R.HRD;
 const rolesFor=()=>["Employee","HR Specialist","Payroll Specialist","Finance Manager","HR Director",...(role===R.ADM?["System Administrator"]:[])];
 const empOpts=()=>[["","Choose an employee"],...allEmps().filter(e=>e.status!=="Terminated").map(e=>[e.no,e.name+" ("+e.no+")"])];
 const loadUP=()=>{if(UPB)return;UPB=true;C.rpc("list_profiles").then(r=>{UP=r||[];UPERR=""}).catch(e=>{UP=UP||[];UPERR=e.message||"Could not load the accounts."}).then(()=>{UPB=false;if(page==="users"||page==="emp_access")draw()})};
 const derr=m=>{const b=document.querySelector("#db .err");if(b)b.textContent=m||""};
 const nice=m=>/emp_already_linked/.test(m)?"That employee already has an account.":/admin_only/.test(m)?"Only a System Administrator can do that.":/cannot_edit_self/.test(m)?"You cannot change your own account.":/no_such_employee/.test(m)?"Choose a valid employee.":/not_allowed/.test(m)?"Only the System Administrator or HR Director can do this.":m;
 const showCred=(t,name,email,pw)=>openDr2(t,"Share this privately. The password is shown only now. The person chooses their own password at first sign-in.",tbl(["Name","Email","Temporary password"],[[esc(name),`<code>${esc(email)}</code>`,`<code>${esc(pw)}</code>`]]));
 const ago=d=>{if(!d)return bd("Never signed in","s-mu");const t=new Date(d);return isNaN(t)?"":t.toISOString().slice(0,10).split("-").reverse().join("/")};
 function usersPage(){
  if(!isAdm())return forbid("Only the System Administrator or HR Director can manage accounts.");
  if(UP===null){loadUP();return`<div class="card" aria-busy="true"><span class="sr-only">Loading accounts…</span><div class="skel" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>`}
  const rows=UP.map(u=>{const me=u.id===C.uid,locked=me||(role!==R.ADM&&u.role===R.ADM),st=u.role==="Pending"?bd("No role yet","s-wn"):u.active?bd("Active","s-ok"):bd("Disabled","s-mu"),en=u.emp_no?allEmps().find(e=>e.no===u.emp_no):null;
   const nm=u.full_name||(u.email||"").split("@")[0],rl=u.role==="Pending"?'<span class="uapill pend">Pending</span>':'<span class="uapill">'+esc(u.role)+"</span>";
   return[`<div class="uacc"><i class="av">${esc(ini(nm))}</i><div><b>${esc(nm)}</b>${me?' <span class="uyou">You</span>':""}<div class="mu">${esc(u.email||"")}</div></div></div>`,rl,u.emp_no?`<b>${esc(u.emp_no)}</b>`+(en?'<div class="mu">'+esc(en.dept||"")+"</div>":""):'<span class="mu">Not linked</span>',st,`<span class="mu2">${typeof lrNice==="function"&&u.last_sign_in_at?esc(lrNice(String(u.last_sign_in_at).slice(0,10))):ago(u.last_sign_in_at)}</span>`,locked?"":`<div class="acts uact"><button class="b" data-act="ua_role:${u.id}">Change role</button><button class="b" data-act="ua_rst:${u.id}">Reset password</button><button class="b ${u.active?"dng":""}" data-act="ua_tog:${u.id}">${u.active?"Disable":"Enable"}</button></div>`]});
  return`${UPERR?note(esc(UPERR),"er"):""}
  <div class="card" style="margin-bottom:12px"><h2>Add an account</h2><form class="g" data-form="cuser">${fld("Work email","email","email",{req:1})}${fld("Role","role","select",{req:1,opts:rolesFor(),val:"Employee"})}${fld("Employee (for the Employee role)","emp_no","select",{opts:empOpts()})}${fld("Full name (staff roles)","full_name","text")}<button class="b p" type="submit">Create account</button></form><div class="err"></div><div class="mu" style="margin-top:6px">An employee account shows that person's own data only. You get a temporary password to hand over, and they choose their own at first sign-in.</div></div>
  <div class="bar" style="margin-bottom:8px"><button class="b" data-act="ua_ref">Refresh</button><span class="mu">${UP.length} account(s)</span></div>
  <div class="uatb">${tbl(["Account","Role","Employee","Status","Last sign-in",""],rows,{empty:"No accounts yet.",search:true})}</div>`}
 ["users","emp_access"].forEach(k=>{if(PAGES[k]){PAGES[k].fn=usersPage;PAGES[k].title="Users & Access";PAGES[k].desc="Create sign-ins, set roles, and turn accounts on or off."}});
 ACTS.ua_ref=()=>{UP=null;draw()};
 ACTS.ua_role=id=>{const u=(UP||[]).find(x=>x.id===id);if(!u)return;openDr2("Change role",u.full_name+" · "+u.email,`<form class="g1" data-form="uarole"><input type="hidden" name="id" value="${esc(id)}">${fld("Role","role","select",{req:1,opts:rolesFor(),val:u.role==="Pending"?"Employee":u.role})}${fld("Employee (for the Employee role)","emp_no","select",{opts:empOpts(),val:u.emp_no||""})}<button class="b p" type="submit">Save role</button></form><div class="err"></div>`)};
 FORMS.uarole=o=>{if(!isAdm())return"Not allowed.";const u=(UP||[]).find(x=>x.id===o.id);if(!u)return"Account not found.";if(o.role==="Employee"&&!o.emp_no)return"Choose the employee for this account.";
  C.rpc("set_profile",{p_id:o.id,p_role:o.role,p_active:u.active||u.role==="Pending",p_emp_no:o.role==="Employee"?o.emp_no:null}).then(()=>{audit("Account role changed",(u.email||u.full_name)+": "+u.role+" to "+o.role);closeDr();toast("Role saved");UP=null;draw()}).catch(e=>derr(nice(e.message)));return""};
 ACTS.ua_tog=id=>{const u=(UP||[]).find(x=>x.id===id);if(!u)return;ask(u.active?"Turn this account off? The person can no longer sign in.":"Turn this account on again?",u.active?"Disable account":"Enable account",()=>{
  C.rpc("set_profile",{p_id:id,p_role:u.role,p_active:!u.active,p_emp_no:u.emp_no||null}).then(()=>{audit(u.active?"Account disabled":"Account enabled",u.email||u.full_name);toast(u.active?"Account disabled":"Account enabled");UP=null;draw()}).catch(e=>toast(nice(e.message)))})};
 ACTS.ua_rst=id=>{const u=(UP||[]).find(x=>x.id===id);if(!u)return;ask("Create a new temporary password for "+(u.full_name||u.email)+"? The old password stops working.","Reset password",()=>{
  C.fn("admin-users",{action:"reset",user_id:id}).then(r=>{audit("Account password reset",u.email||u.full_name);showCred("New temporary password",u.full_name||"",u.email||"",r.password)}).catch(e=>toast(nice(e.message)))})};
 FORMS.cuser=(o,f)=>{if(!isAdm())return"Not allowed.";const email=(o.email||"").trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return"Enter the full work email, for example name@savills.me.";
  if(o.role==="Employee"&&!o.emp_no)return"Choose the employee for this account.";if(o.role!=="Employee"&&!(o.full_name||"").trim())return"Enter the person's full name.";
  const b=f.querySelector("[type=submit]"),box=f.parentElement.querySelector(".err");b.disabled=true;
  C.fn("admin-users",{action:"create",email,role:o.role,emp_no:o.emp_no||null,full_name:(o.full_name||"").trim()}).then(r=>{audit("Account created",email+" as "+o.role);UP=null;showCred("Account created",r.name,r.email,r.password);draw2b()}).catch(e=>{b.disabled=false;if(box)box.textContent=nice(e.message)});return""};
})();

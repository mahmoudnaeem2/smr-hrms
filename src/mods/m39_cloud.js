/* Cloud mode (Supabase). Only active when the page was started by the cloud loader. */
(function(){const C=window.SMR_CLOUD_ON;if(!C)return;
 document.body.classList.add("cloud");
 try{const U=USR();if(!U.some(x=>x.id===C.uid))U.push({id:C.uid,name:C.name,role:C.role,active:true,email:C.email||""})}catch(e){}
 /* the signed-in role is fixed by the server: no "preview as" switching */
 const lockRole=()=>{try{if(role!==C.role)role=C.role;const sel=$("#role");if(sel){if(sel.value!==C.role)sel.value=C.role;sel.disabled=true}}catch(e){}};
 window.rmToggle=()=>{};lockRole();setInterval(()=>{if(role!==C.role){lockRole();draw()}else lockRole()},500);
 /* sign-ins live in Supabase (Authentication > Users), not in this browser */
 try{NAV.forEach(g=>{g[1]=g[1].filter(i=>!["users","emp_access"].includes(i[1]))})}catch(e){}
 ACTS.esout=()=>{ask("Sign out?","Sign out",()=>C.signOut())};
 const st=()=>{const f=document.querySelector(".side-f");if(!f)return;let el=document.getElementById("cst");if(!el){f.insertAdjacentHTML("afterbegin",'<div id="cst" role="status" aria-live="polite"></div>');el=document.getElementById("cst")}
  const s=C.status();el.className=s==="saved"||s==="saving"?"":"off";el.textContent=s==="saved"?"All changes saved":s==="saving"?"Saving…":s==="offline"?"Offline. Changes are not saved yet.":s==="stale"?"Newer data is available. Reload.":"Conflict. Reload.";
  if(s==="stale"&&!document.getElementById("cstb"))el.insertAdjacentHTML("afterend",'<button class="b" id="cstb" style="margin-top:6px;width:100%">Reload latest data</button>')}
 window.addEventListener("smr-cloud-status",st);document.addEventListener("click",ev=>{if(ev.target.id==="cstb")C.reload()});
 setTimeout(st,0);
})();

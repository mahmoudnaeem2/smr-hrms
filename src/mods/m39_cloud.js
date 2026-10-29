/* Cloud mode (Supabase). Only active when the page was started by the cloud loader. */
(function(){const C=window.SMR_CLOUD_ON;if(!C)return;
 document.body.classList.add("cloud");
 try{const U=USR();if(!U.some(x=>x.id===C.uid))U.push({id:C.uid,name:C.name,role:C.role,active:true,email:C.email||""})}catch(e){}
 ACTS.esout=()=>{ask("Sign out?","Sign out",()=>C.signOut())};
 const st=()=>{const f=document.querySelector(".side-f");if(!f)return;let el=document.getElementById("cst");if(!el){f.insertAdjacentHTML("afterbegin",'<div id="cst" role="status" aria-live="polite"></div>');el=document.getElementById("cst")}
  const s=C.status();el.className=s==="saved"||s==="saving"?"":"off";el.textContent=s==="saved"?"All changes saved":s==="saving"?"Saving…":s==="offline"?"Offline. Changes are not saved yet.":s==="stale"?"Newer data is available. Reload.":"Conflict. Reload.";
  if(s==="stale"&&!document.getElementById("cstb"))el.insertAdjacentHTML("afterend",'<button class="b" id="cstb" style="margin-top:6px;width:100%">Reload latest data</button>')}
 window.addEventListener("smr-cloud-status",st);document.addEventListener("click",ev=>{if(ev.target.id==="cstb")C.reload()});
 setTimeout(st,0);
})();

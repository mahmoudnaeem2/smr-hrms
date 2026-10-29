/* ===== boot: register legacy pages, change handlers ===== */
reg("dash",META0.dash[0],META0.dash[1],A("HRD","HRS","DM","FIN","PAY"),dash);
reg("myprofile","My Profile","Your personal and employment details.",A("EMP"),()=>portal("pf"));
reg("emp",META0.emp[0],META0.emp[1],A("HRD","HRS","DM","FIN"),emp);
reg("work",META0.work[0],META0.work[1],Object.values(R).map((_,i)=>Object.values(R)[i]),()=>role===R.EMP?portal("ov"):work());
document.addEventListener("change",ev=>{const t=ev.target;if(t.id==="atmd"){ATM.dept=t.value;draw()}else if(t.id==="tssel"){TSN=t.value;draw()}else if(t.id==="lcd"){LCD=t.value;draw()}});
$("#role").onchange=e=>{role=e.target.value;closeDr();page=role===R.EMP?"work":(canSee(page)?page:homeFor(role));draw()};
document.addEventListener("click",ev=>{const t=ev.target.closest("[data-rg]");if(t){RANGE=+t.dataset.rg;draw()}});
try{const hp=unhk(location.hash.slice(1));if(hp)page=hp}catch(e){}

Object.defineProperty(PAGES.work,"title",{get:()=>role===R.EMP?"My Portal":"My Workspace"});Object.defineProperty(PAGES.work,"desc",{get:()=>role===R.EMP?"Your details, payslips, leave, loans and requests to HR.":"Clock in and out, check leave balances, request time off and see who is out."});

/* accessibility: label unlabeled controls, modal semantics, skip link */
(function(){const fix=()=>{document.querySelectorAll("#view input,#view select,#view textarea,#drawer input,#drawer select").forEach(e=>{if(e.type==="hidden"||e.closest("label")||e.getAttribute("aria-label")||(e.id&&document.querySelector('label[for="'+e.id+'"]')))return;const t=e.placeholder||(e.tagName==="SELECT"&&e.options[0]?e.options[0].text.replace(/^All /,"Filter by "):"")||e.name||"Field";e.setAttribute("aria-label",t)});
 document.querySelectorAll("#view table").forEach(t=>{if(!t.getAttribute("aria-label"))t.setAttribute("aria-label",(document.getElementById("title")||{}).textContent||"Table")});
 const d=document.getElementById("drawer");if(d&&!d.getAttribute("aria-modal"))d.setAttribute("aria-modal","true");
 const m=document.querySelector("main");if(m&&!m.id){m.id="main";m.tabIndex=-1}
 if(!document.querySelector(".skip")){const a=document.createElement("a");a.className="skip";a.href="#main";a.textContent="Skip to main content";a.onclick=ev=>{ev.preventDefault();const mm=document.getElementById("main");mm&&mm.focus()};document.body.prepend(a)}};
 const v=document.getElementById("view");if(v){new MutationObserver(fix).observe(v,{childList:true,subtree:true});const dr=document.getElementById("drawer");dr&&new MutationObserver(fix).observe(dr,{childList:true,subtree:true});fix()}})();

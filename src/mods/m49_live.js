/* ===== m49: live data. When records change in another tab (same browser) or on the server (another person, another device),
   this tab picks them up without a reload: caches are dropped, lists redraw when you are not typing, and open forms get fresh choices. ===== */
const LIVE={t:0,due:false,at:0};
const LIVE_SKIP=/^smr_(rail|gopen|comfort|sb|live|mode|cloud_init|localbak|seed_pending|seed2|staff|acct|users)$/;
function liveRead(k,def){try{const s=localStorage.getItem(k);return s?JSON.parse(s):def}catch(e){return def}}
function liveApply(keys){keys=(keys||[]).filter(k=>k&&k.indexOf("smr_")===0&&!LIVE_SKIP.test(k));if(!keys.length)return;
 keys.forEach(k=>{delete DB[k];
  if(k==="smr_emp")E=liveRead(k,[]);
  if(k==="smr_lr")LR=liveRead(k,[]);
  if(k==="smr_punch")PUNCH=liveRead(k,{});
  if(k==="smr_depts")db("depts",[],false).forEach(d=>{if(!DEPTS.includes(d))DEPTS.push(d)})});
 LIVE.at=Date.now();liveSoon()}
/* typing, choosing in a list or an open confirm box: wait, so nothing jumps under the person */
function liveBusy(){const a=document.activeElement,cf=document.getElementById("confirm");return(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&!!a.closest("#view"))||(cf&&!cf.hidden)}
function liveSoon(){clearTimeout(LIVE.t);LIVE.t=setTimeout(()=>{liveForms();if(liveBusy()){LIVE.due=true;return}LIVE.due=false;try{draw()}catch(e){}liveToast()},150)}
/* open side-panel forms keep what the person typed; only the choice lists are refreshed */
function liveForms(){const d=document.getElementById("drawer");if(!d||!d.classList.contains("open"))return;
 d.querySelectorAll(nlSel).forEach(s=>{const c=NL[s.name],v=s.value,first=s.options[0]&&s.options[0].value===""?s.options[0].outerHTML:"",have=[...s.options].map(o=>o.value).filter(x=>x&&x!=="__new"),want=c.list();if(want.join("|")===have.join("|"))return;
  const nw=!!s.querySelector('option[value="__new"]');s.innerHTML=first+want.map(x=>`<option value="${esc(x)}" ${x===v?"selected":""}>${esc(x)}</option>`).join("")+(nw?`<option value="__new">+ New ${c.noun}…</option>`:"");if(v&&v!=="__new"&&!want.includes(v))s.insertAdjacentHTML("afterbegin",`<option value="${esc(v)}" selected>${esc(v)}</option>`)})}
function liveToast(){const n=document.getElementById("livepill");if(n){n.classList.add("on");clearTimeout(n._t);n._t=setTimeout(()=>n.classList.remove("on"),2200)}}
document.addEventListener("focusout",()=>setTimeout(()=>{if(LIVE.due&&!liveBusy()){LIVE.due=false;try{draw()}catch(e){}liveToast()}},60));
window.addEventListener("storage",ev=>{if(ev.key)liveApply([ev.key])});
window.addEventListener("smr-data",ev=>liveApply(ev.detail));
/* a small "Updated" note in the top bar so a change never looks like a glitch */
(function(){const go=()=>{const t=document.querySelector(".topbar");if(!t)return setTimeout(go,80);if(!document.getElementById("livepill"))t.insertAdjacentHTML("beforeend",'<span id="livepill" role="status" aria-live="polite">Updated just now</span>')};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go()})();
/* add a choice without leaving the form: Department, Job title and Grade lists end with "+ New …" (HR roles, My records) */
const NL={dept:{noun:"department",list:()=>DEPTS.slice(),add:n=>{DEPTS.push(n);db("depts",[],false).push(n);sv("depts",false)}},
 pos:{noun:"job title",list:()=>typeof jobTitles==="function"?jobTitles():[],add:n=>{POSS().push(n);sv("posl",false)}},
 grade:{noun:"grade",list:()=>typeof gradeList==="function"?gradeList():[],add:n=>{GRDS().push(n);sv("grades",false)}}};
const canNewDept=()=>[R.HRD,R.HRS,R.ADM].includes(role)&&MODE==="mine";
const nlSel='form select[name="dept"],form select[name="pos"],form select[name="grade"]';
function deptAddOpt(root){if(!canNewDept())return;(root||document).querySelectorAll(nlSel).forEach(s=>{if(s.querySelector('option[value="__new"]'))return;const c=NL[s.name];s.insertAdjacentHTML("beforeend",`<option value="__new">+ New ${c.noun}…</option>`);s.dataset.prev=s.value})}
document.addEventListener("focusin",e=>{const s=e.target.closest&&e.target.closest(nlSel);if(s&&!s.querySelector('option[value="__new"]'))deptAddOpt(s.closest("form"));if(s&&s.value!=="__new")s.dataset.prev=s.value});
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest(nlSel);if(!s||s.value!=="__new")return;const c=NL[s.name];
 s.value=s.dataset.prev||"";if(s.value===""&&s.options[0])s.selectedIndex=0;const lab=s.closest("label")||s.parentElement;if(lab.nextElementSibling&&lab.nextElementSibling.classList.contains("ndept"))return lab.nextElementSibling.querySelector("input").focus();
 lab.insertAdjacentHTML("afterend",`<div class="ndept" data-for="${s.name}"><input type="text" placeholder="New ${c.noun}" aria-label="New ${c.noun}" maxlength="60"><button type="button" class="b p sm" data-nd="add">Add</button><button type="button" class="b ghost sm" data-nd="x">Cancel</button><p class="err" role="alert"></p></div>`);
 lab.nextElementSibling.querySelector("input").focus()});
function ndeptAdd(box){const i=box.querySelector("input"),n=i.value.trim(),er=box.querySelector(".err"),key=box.dataset.for||"dept",c=NL[key];if(!n){er.textContent="Type the "+c.noun+".";return i.focus()}
 const ex=c.list().find(d=>d.toLowerCase()===n.toLowerCase());if(!ex){c.add(n);audit("Added "+c.noun,n);toast("Added: "+n)}const v=ex||n;
 document.querySelectorAll(`form select[name="${key}"]`).forEach(x=>{if(![...x.options].some(o=>o.value===v)){const nw=x.querySelector('option[value="__new"]');if(nw)nw.insertAdjacentHTML("beforebegin",`<option value="${esc(v)}">${esc(v)}</option>`);else x.insertAdjacentHTML("beforeend",`<option value="${esc(v)}">${esc(v)}</option>`)}});
 const s=box.previousElementSibling.querySelector(`select[name="${key}"]`);if(s){s.value=v;s.dataset.prev=v;s.dispatchEvent(new Event("change",{bubbles:true}))}box.remove()}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-nd]");if(!b)return;const box=b.closest(".ndept");if(b.dataset.nd==="x")return box.remove();ndeptAdd(box)});
document.addEventListener("keydown",e=>{const i=e.target.closest&&e.target.closest(".ndept input");if(!i)return;if(e.key==="Enter"){e.preventDefault();ndeptAdd(i.closest(".ndept"))}if(e.key==="Escape"){e.stopPropagation();i.closest(".ndept").remove()}},true);

/* data-source chip lives in the top bar (the strip row under it is hidden) */
(function(){const sync=()=>{const t=document.querySelector(".topbar"),s=document.getElementById("strip");if(!t||!s)return setTimeout(sync,80);let c=document.getElementById("srcchip");if(!c){c=document.createElement("span");c.id="srcchip";c.className="chip";c.setAttribute("role","status");t.appendChild(c)}const f=s.querySelector(".chip");if(f&&c.textContent!==f.textContent){c.textContent=f.textContent;c.title=(s.querySelector(".chip+span")||{}).textContent||""}};sync();new MutationObserver(sync).observe(document.getElementById("strip")||document.body,{childList:true,subtree:true})})();

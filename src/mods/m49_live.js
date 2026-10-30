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
 d.querySelectorAll('select[name="dept"]').forEach(s=>{const v=s.value,have=[...s.options].map(o=>o.value).filter(x=>x!=="__new");const want=DEPTS.slice();if(want.join("|")===have.join("|"))return;
  const nw=!!s.querySelector('option[value="__new"]');s.innerHTML=want.map(x=>`<option ${x===v?"selected":""}>${esc(x)}</option>`).join("")+(nw?'<option value="__new">+ New department…</option>':"");if(!want.includes(v)&&v&&v!=="__new"){s.insertAdjacentHTML("afterbegin",`<option selected>${esc(v)}</option>`)}})}
function liveToast(){const n=document.getElementById("livepill");if(n){n.classList.add("on");clearTimeout(n._t);n._t=setTimeout(()=>n.classList.remove("on"),2200)}}
document.addEventListener("focusout",()=>setTimeout(()=>{if(LIVE.due&&!liveBusy()){LIVE.due=false;try{draw()}catch(e){}liveToast()}},60));
window.addEventListener("storage",ev=>{if(ev.key)liveApply([ev.key])});
window.addEventListener("smr-data",ev=>liveApply(ev.detail));
/* a small "Updated" note in the top bar so a change never looks like a glitch */
(function(){const go=()=>{const t=document.querySelector(".topbar");if(!t)return setTimeout(go,80);if(!document.getElementById("livepill"))t.insertAdjacentHTML("beforeend",'<span id="livepill" role="status" aria-live="polite">Updated just now</span>')};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go()})();
/* add a department without leaving the form: every department list in a form ends with "+ New department…" (HR roles) */
const canNewDept=()=>[R.HRD,R.HRS,R.ADM].includes(role)&&MODE==="mine";
function deptAddOpt(root){if(!canNewDept())return;(root||document).querySelectorAll('form select[name="dept"]').forEach(s=>{if(s.querySelector('option[value="__new"]'))return;s.insertAdjacentHTML("beforeend",'<option value="__new">+ New department…</option>');s.dataset.prev=s.value})}
document.addEventListener("focusin",e=>{const s=e.target.closest&&e.target.closest('form select[name="dept"]');if(s&&!s.querySelector('option[value="__new"]'))deptAddOpt(s.closest("form"));if(s&&s.value!=="__new")s.dataset.prev=s.value});
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest('form select[name="dept"]');if(!s||s.value!=="__new")return;
 s.value=s.dataset.prev||s.options[0].value;const lab=s.closest("label")||s.parentElement;if(lab.nextElementSibling&&lab.nextElementSibling.classList.contains("ndept"))return lab.nextElementSibling.querySelector("input").focus();
 lab.insertAdjacentHTML("afterend",'<div class="ndept"><input type="text" placeholder="New department name" aria-label="New department name" maxlength="60"><button type="button" class="b p sm" data-nd="add">Add</button><button type="button" class="b ghost sm" data-nd="x">Cancel</button><p class="err" role="alert"></p></div>');
 lab.nextElementSibling.querySelector("input").focus()});
function ndeptAdd(box){const i=box.querySelector("input"),n=i.value.trim(),er=box.querySelector(".err");if(!n){er.textContent="Type the department name.";return i.focus()}
 const ex=DEPTS.find(d=>d.toLowerCase()===n.toLowerCase());if(!ex){DEPTS.push(n);db("depts",[],false).push(n);sv("depts",false);audit("Department added",n);toast("Department added: "+n)}
 const s=box.previousElementSibling.querySelector('select[name="dept"]')||box.previousElementSibling;
 document.querySelectorAll('form select[name="dept"]').forEach(x=>{if(![...x.options].some(o=>o.value===(ex||n)))x.querySelector('option[value="__new"]').insertAdjacentHTML("beforebegin",`<option>${esc(ex||n)}</option>`)});
 if(s&&s.tagName==="SELECT"){s.value=ex||n;s.dataset.prev=s.value;s.dispatchEvent(new Event("change",{bubbles:true}))}box.remove()}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-nd]");if(!b)return;const box=b.closest(".ndept");if(b.dataset.nd==="x")return box.remove();ndeptAdd(box)});
document.addEventListener("keydown",e=>{const i=e.target.closest&&e.target.closest(".ndept input");if(!i)return;if(e.key==="Enter"){e.preventDefault();ndeptAdd(i.closest(".ndept"))}if(e.key==="Escape"){e.stopPropagation();i.closest(".ndept").remove()}},true);

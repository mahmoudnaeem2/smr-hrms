/* Sidebar search: pages, people, projects (uses palResults) */
let SPI=-1,SPR=[];
function spInit(){const side=$("#side");if(!side||$("#sps"))return;const br=side.querySelector(".brand");if(!br)return;
 br.insertAdjacentHTML("afterend",'<div class="sps" id="sps"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14"/></svg><input id="gs2" type="search" placeholder="Search pages, people…" autocomplete="off" aria-label="Search pages, people, projects"><kbd>Ctrl K</kbd><div id="pal2" role="listbox" hidden></div></div>');
 const g=$("#gs2");
 g.addEventListener("input",()=>{SPI=-1;spDraw()});g.addEventListener("focus",()=>{SPI=-1;spDraw()});
 g.addEventListener("blur",()=>setTimeout(()=>{const b=$("#pal2");if(b)b.hidden=true},180));
 g.addEventListener("keydown",e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();SPI=(SPI+(e.key==="ArrowDown"?1:-1)+SPR.length)%Math.max(1,SPR.length);spDraw()}else if(e.key==="Enter"){e.preventDefault();spPick(SPI>=0?SPI:0)}else if(e.key==="Escape"){g.value="";g.blur()}});
 $("#pal2").addEventListener("mousedown",e=>{const b=e.target.closest("[data-si]");if(b){e.preventDefault();spPick(+b.dataset.si)}})}
function spDraw(){const g=$("#gs2"),b=$("#pal2");if(!g||!b)return;const qq=g.value.trim().toLowerCase();SPR=palResults(g.value);if(qq){SPR=SPR.filter(r=>r.g!=="Pages");const pk=Object.keys(PAGES).filter(k=>!HIDE_NAV.includes(k)&&canSee(k)&&(PAGES[k].title+" "+PAGES[k].desc).toLowerCase().includes(qq)).slice(0,12);SPR=pk.map(k=>({g:"Pages",t:PAGES[k].title,s:PAGES[k].desc,a:()=>go(k)})).concat(SPR);const w=r=>r.t.toLowerCase().startsWith(qq)?0:r.t.toLowerCase().includes(qq)?1:2;const gi={};SPR.forEach(r=>{if(!(r.g in gi))gi[r.g]=Object.keys(gi).length});SPR=SPR.map((r,i)=>[r,i]).sort((a,b)=>gi[a[0].g]-gi[b[0].g]||w(a[0])-w(b[0])||a[1]-b[1]).map(x=>x[0])}
 if(!SPR.length){b.innerHTML=g.value.trim()?'<div class="pg">No results</div>':"";b.hidden=!g.value.trim()||document.activeElement!==g;return}
 let last="";b.innerHTML=SPR.map((r,i)=>{const h=r.g!==last?`<div class="pg">${esc(r.g)}</div>`:"";last=r.g;return h+`<button type="button" class="pi ${i===SPI?"on":""}" data-si="${i}" role="option"><b>${esc(r.t)}</b><small>${esc((r.s||"").slice(0,80))}</small></button>`}).join("");b.hidden=document.activeElement!==g}
function spPick(i){const r=SPR[i];if(!r)return;$("#pal2").hidden=true;const g=$("#gs2");g.value="";g.blur();try{document.body.classList.remove("navopen")}catch(e){}r.a()}
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){const g=$("#gs2");if(g&&g.offsetParent!==null){e.preventDefault();e.stopImmediatePropagation();g.focus();g.select()}}},true);
spInit();

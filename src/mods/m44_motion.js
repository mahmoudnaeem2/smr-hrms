/* ===== m44: motion layer (GSAP). One entrance per page change, dashboard draw-in, drawer content, count-up. See docs/ANIMATION_GUIDELINES.md ===== */
const MO=(function(){
 const G=typeof window!=="undefined"&&window.gsap;if(!G)return{on:false};
 const mm=G.matchMedia(),st={on:false,ctx:null,key:"",dr:null};
 mm.add("(prefers-reduced-motion: no-preference)",()=>{st.on=true;document.documentElement.classList.add("mo");return()=>{st.on=false;document.documentElement.classList.remove("mo")}});
 const E={out:"power2.out",soft:"power3.out"},D={s:.2,m:.36,l:.6};
 // numbers: animate only plain integers or "EGP 156k"-style values; anything else is left as is
 function countUp(el){const t=el.textContent.trim(),m=/^([^\d-]*)(-?\d[\d,]*(?:\.\d+)?)(.*)$/.exec(t);if(!m)return;const to=parseFloat(m[2].replace(/,/g,""));if(!isFinite(to)||Math.abs(to)<2)return;
  const dec=(m[2].split(".")[1]||"").length,o={v:0},fmt=v=>m[1]+(dec?v.toFixed(dec):Math.round(v).toLocaleString("en-US"))+m[3];
  el.textContent=fmt(0);G.to(o,{v:to,duration:D.l,ease:E.out,onUpdate:()=>{el.textContent=fmt(o.v)},onComplete:()=>{el.textContent=t}})}
 function drawCharts(root){
  root.querySelectorAll(".card svg polyline,.card svg path[fill='none']").forEach(p=>{let L=0;try{L=p.getTotalLength()}catch(e){}if(L>4)G.fromTo(p,{strokeDasharray:L,strokeDashoffset:L},{strokeDashoffset:0,duration:D.l+.2,ease:E.soft,delay:.12,clearProps:"strokeDasharray,strokeDashoffset"})});
  const bars=[...root.querySelectorAll(".card svg rect")].filter(r=>{const f=r.getAttribute("fill");return f&&f!=="transparent"&&f!=="none"&&+r.getAttribute("height")>0});
  if(bars.length)G.from(bars,{scaleY:0,transformOrigin:"50% 100%",duration:D.m,ease:E.out,stagger:{each:.012,from:"start"},delay:.1,clearProps:"transform"});
  const hb=root.querySelectorAll(".row .f,.dpr .pb i");if(hb.length)G.from(hb,{scaleX:0,transformOrigin:"0 50%",duration:D.m+.1,ease:E.out,stagger:.03,delay:.15,clearProps:"transform"})}
 function reveal(){if(!st.on)return;const v=document.getElementById("view");if(!v)return;
  if(st.ctx)st.ctx.revert();
  st.ctx=G.context(()=>{const ph=document.querySelector("main>.ph"),kids=[...v.children].slice(0,10);
   const tl=G.timeline({defaults:{ease:E.out,duration:D.m}});
   if(ph)tl.from(ph,{autoAlpha:0,y:8,clearProps:"opacity,visibility,transform"},0);
   if(kids.length)tl.from(kids,{autoAlpha:0,y:12,stagger:.045,clearProps:"opacity,visibility,transform"},.04);
   if(page==="dash"){const n=v.querySelectorAll(".scn,.k .v");n.forEach(countUp);drawCharts(v)}
  },v)}
 function watch(){const v=document.getElementById("view");if(!v||v._mo)return;v._mo=1;
  new MutationObserver(()=>{const k=page+"|"+role+"|"+MODE;if(k!==st.key){st.key=k;reveal()}}).observe(v,{childList:true});
  const dr=document.getElementById("drawer");if(dr)new MutationObserver(()=>{const open=dr.classList.contains("open");if(open&&st.on){const b=document.getElementById("db");if(b&&b.children.length){if(st.dr)st.dr.kill();st.dr=G.from([...b.children].slice(0,8),{autoAlpha:0,y:10,duration:D.m,ease:E.out,stagger:.04,delay:.06,clearProps:"opacity,visibility,transform"})}}}).observe(dr,{attributes:true,attributeFilter:["class"]})}
 function boot(){watch();const v=document.getElementById("view");const g=document.getElementById("gate"),gated=g&&getComputedStyle(g).display!=="none"&&!g.hidden;if(!gated&&v&&v.children.length&&typeof page!=="undefined"){st.key=page+"|"+role+"|"+MODE;reveal()}}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
 return{get on(){return st.on},reveal,countUp,gsap:G}
})();
/* menus built on <details> (dashboard New menu): close on outside click and Esc */
document.addEventListener("click",ev=>{document.querySelectorAll("details.dnew[open]").forEach(d=>{if(!d.contains(ev.target)||ev.target.closest("[data-q]"))d.removeAttribute("open")})});
document.addEventListener("keydown",ev=>{if(ev.key!=="Escape")return;document.querySelectorAll("details.dnew[open]").forEach(d=>{d.removeAttribute("open");const s=d.querySelector("summary");if(s)s.focus()})});

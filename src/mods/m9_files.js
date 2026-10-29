/* ===== m9: file attachments (stored in this browser: IndexedDB) ===== */
const FEXT=["pdf","png","jpg","jpeg","webp","docx","xlsx","csv","txt"],FMAX=10*1024*1024;
const FS={mem:{},dbp:null,
 open(){if(FS.dbp)return FS.dbp;FS.dbp=new Promise(res=>{try{const q=indexedDB.open("smr_files",1);q.onupgradeneeded=()=>q.result.createObjectStore("b");q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)}catch(e){res(null)}});return FS.dbp},
 async put(id,blob){const d=await FS.open();FS.mem[id]=blob;if(!d)return false;return new Promise(r=>{try{const t=d.transaction("b","readwrite");t.objectStore("b").put(blob,id);t.oncomplete=()=>r(true);t.onerror=()=>r(false)}catch(e){r(false)}})},
 async get(id){if(FS.mem[id])return FS.mem[id];const d=await FS.open();if(!d)return null;return new Promise(r=>{try{const q=d.transaction("b").objectStore("b").get(id);q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)}catch(e){r(null)}})},
 async del(id){delete FS.mem[id];const d=await FS.open();if(!d)return;return new Promise(r=>{try{const t=d.transaction("b","readwrite");t.objectStore("b").delete(id);t.oncomplete=()=>r();t.onerror=()=>r()}catch(e){r()}})}};
const FILES=()=>db("files",[]);
const filesOf=ctx=>FILES().filter(f=>f.ctx===ctx);
const fsize=n=>n<1024?n+" B":n<1048576?(n/1024).toFixed(0)+" KB":(n/1048576).toFixed(1)+" MB";
const ATTC={};/* ctx -> {title,up} for the open drawer */
function attList(ctx,up){const L=filesOf(ctx);
 return(L.length?`<div class="wrap"><table><tr><th>File</th><th>Size</th><th>Added</th><th>By</th><th></th></tr>${L.map(f=>`<tr><td>${esc(f.name)}</td><td>${fsize(f.size)}</td><td>${f.t}</td><td>${esc(f.by)}</td><td><button class="b" data-act="fview:${f.id}">View</button> <button class="b" data-act="fdl:${f.id}">Download</button>${up?` <button class="b" data-act="fdel:${f.id}">Delete</button>`:""}</td></tr>`).join("")}</table></div>`:`<div class="empty">No files attached yet.</div>`)}
function attBox(ctx,up){return`<div class="att" data-attbox="${esc(ctx)}">${attList(ctx,up)}${up?`<div class="bar" style="margin-top:8px"><label class="b p" style="cursor:pointer">Attach file<input type="file" data-att="${esc(ctx)}" multiple accept=".${FEXT.join(",.")}" style="display:none"></label><span class="mu">PDF, images, Word, Excel, CSV or text. Up to 10 MB each. Stored in this browser only.</span></div>`:""}<div class="err" data-atterr="${esc(ctx)}"></div></div>`}
const attCount=ctx=>filesOf(ctx).length;
const ATTT={};
const attBtn=(ctx,title,label)=>{ATTT[ctx]=title;return`<button class="b" data-act="att:${esc(ctx)}">${label||"Files"}${attCount(ctx)?" ("+attCount(ctx)+")":""}</button>`};
const canAttach=ctx=>{const k=ctx.split("|")[0];if(k==="leave"||k==="leaveform"||k==="hrq"||k==="hrqform")return true;if(k==="doc"&&role===R.EMP&&ctx.split("|")[1]===WSNO)return true;if(k==="hqr")return[R.HRD,R.HRS,R.PAY].includes(role);if(k==="recon")return[R.PAY,R.FIN].includes(role);return[R.HRD,R.HRS].includes(role)};
ACTS.att=ctx=>{const title=ATTT[ctx]||({leave:"Leave request",cand:"Candidate",recon:"Bank statement",doc:"Employee document",contract:"Signed contract",emp:"Employee files"}[ctx.split("|")[0]]||"Files");ATTC.cur={ctx,title};
 $("#dt").textContent="Files: "+title;$("#dd").textContent="Documents attached to this record.";$("#db").innerHTML=attBox(ctx,canAttach(ctx));$("#dx").hidden=true;const x=$("#dxx");if(x)x.hidden=true;$("#drawer").classList.add("open")};
function attRefresh(ctx){document.querySelectorAll(`[data-attbox="${CSS.escape(ctx)}"]`).forEach(b=>b.outerHTML=attBox(ctx,canAttach(ctx)))}
async function attUpload(ctx,files,quiet){const er=document.querySelector(`[data-atterr="${CSS.escape(ctx)}"]`),bad=[];let n=0;
 for(const f of files){const ext=(f.name.split(".").pop()||"").toLowerCase();if(!FEXT.includes(ext)){bad.push(f.name+": type not allowed (use "+FEXT.join(", ")+")");continue}if(f.size>FMAX){bad.push(f.name+": larger than 10 MB");continue}if(!f.size){bad.push(f.name+": the file is empty");continue}
  const id="F"+Date.now()+Math.random().toString(36).slice(2,6);const ok=await FS.put(id,f);FILES().push({id,ctx,name:f.name,size:f.size,type:f.type||ext,by:role,t:iso(T0)});n++;if(!ok)bad.push(f.name+": kept for this session only (browser storage is unavailable)")}
 sv("files");if(n)audit("File attached",ctx+" ("+n+")");if(!quiet){attRefresh(ctx);const e2=document.querySelector(`[data-atterr="${CSS.escape(ctx)}"]`);if(e2)e2.textContent=bad.join(" · ")}if(n&&!quiet){toast(n+" file(s) attached");if(!ctx.startsWith("leaveform|")&&!ctx.startsWith("hrqform|"))draw2()}return{n,bad}}
function draw2(){const top=$("#drawer").classList.contains("open");const keep=top?$("#db").innerHTML:null;const x=$("#dt").textContent,y=$("#dd").textContent;draw();if(top){$("#dt").textContent=x;$("#dd").textContent=y;$("#db").innerHTML=keep;$("#drawer").classList.add("open")}}
document.addEventListener("change",ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.att&&t.files&&t.files.length){const ctx=t.dataset.att,fs=[...t.files];attUpload(ctx,fs).then(()=>{try{t.value=""}catch(e){}})}});
async function fdl(f,blob){const fn=f.name.replace(/[^\w\-. ؀-ۿ]+/g,"_");let dl=null;try{if(window.claude&&claude.use)dl=await claude.use("downloads")}catch(e){}
 if(dl){try{await dl.save({filename:fn,data:blob});toast("Saved "+fn)}catch(e){if(!e||e.code!=="declined")toast("Could not save the file here.")}return}
 try{const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}catch(e){toast("Could not download the file.")}}
ACTS.fdl=async id=>{const f=FILES().find(x=>x.id===id);if(!f)return;const b=await FS.get(id);if(!b)return toast("The file content is not available in this browser any more.");audit("File downloaded",f.name);fdl(f,b)};
ACTS.fview=async id=>{const f=FILES().find(x=>x.id===id);if(!f)return;const b=await FS.get(id);if(!b)return toast("The file content is not available in this browser any more.");const ext=f.name.split(".").pop().toLowerCase();audit("File viewed",f.name);
 $("#dt").textContent=f.name;$("#dd").textContent=fsize(f.size)+" · added "+f.t+" by "+f.by;
 if(["png","jpg","jpeg","webp"].includes(ext)){const u=URL.createObjectURL(b);$("#db").innerHTML=`<div class="bar"><button class="b" data-act="fdl:${id}">Download</button></div><img src="${u}" alt="${esc(f.name)}" style="max-width:100%;border:1px solid var(--bd);border-radius:8px">`}
 else if(["txt","csv"].includes(ext)){const t=await b.text();$("#db").innerHTML=`<div class="bar"><button class="b" data-act="fdl:${id}">Download</button></div><pre style="white-space:pre-wrap;max-height:60vh;overflow:auto">${esc(t.slice(0,20000))}</pre>`}
 else $("#db").innerHTML=`<div class="bar"><button class="b p" data-act="fdl:${id}">Download</button></div><div class="notice sm">A preview is not available for this file type inside the prototype. Download it to open it.</div>`;
 $("#dx").hidden=true;const x=$("#dxx");if(x)x.hidden=true;$("#drawer").classList.add("open")};
ACTS.fdel=id=>ask("Delete this file? This cannot be undone.","Delete file",()=>{const L=FILES(),i=L.findIndex(x=>x.id===id);if(i<0)return;const f=L[i];if(!canAttach(f.ctx))return;L.splice(i,1);sv("files");FS.del(id);audit("File deleted",f.name);toast("File deleted");if(ATTC.cur&&ATTC.cur.ctx===f.ctx){$("#db").innerHTML=attBox(f.ctx,canAttach(f.ctx));draw2()}else draw()});
function attMove(from,to){let n=0;FILES().forEach(f=>{if(f.ctx===from){f.ctx=to;n++}});if(n)sv("files");return n}

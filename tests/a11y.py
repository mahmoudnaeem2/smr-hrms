from playwright.sync_api import sync_playwright
import collections
JS="""()=>{const out={};const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'};
const nm=e=>(e.getAttribute('aria-label')||e.getAttribute('title')||e.innerText||e.textContent||'').trim();
out.btnNoName=[...document.querySelectorAll('button,[role=button],a[href]')].filter(vis).filter(e=>!nm(e)&&!e.querySelector('img[alt]')).map(e=>e.outerHTML.slice(0,90));
out.inputNoLabel=[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(vis).filter(e=>!(e.id&&document.querySelector('label[for="'+e.id+'"]'))&&!e.closest('label')&&!e.getAttribute('aria-label')&&!e.getAttribute('title')&&!e.placeholder).map(e=>e.outerHTML.slice(0,90));
out.small=[...document.querySelectorAll('button,a[href],input,select,.nav')].filter(vis).filter(e=>{const r=e.getBoundingClientRect();return r.height<32||r.width<32}).map(e=>(nm(e)||e.tagName).slice(0,30)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
out.h1=document.querySelectorAll('h1').length;out.lang=document.documentElement.lang;out.main=!!document.querySelector('main,[role=main]');out.nav=!!document.querySelector('nav,[role=navigation]');
out.imgNoAlt=[...document.querySelectorAll('img:not([alt])')].length;out.clickDivs=[...document.querySelectorAll('div[data-act],span[data-act],div[data-go],div[data-d],tr[data-go],td[data-go]')].filter(e=>!e.hasAttribute('tabindex')&&e.tagName!=='BUTTON').length;
out.tabbableFocusStyle=(()=>{const b=document.querySelector('button');if(!b)return'';b.focus();const s=getComputedStyle(b);return s.outlineStyle+' '+s.outlineWidth+' '+s.boxShadow.slice(0,40)})();
return out}"""
def lum(c):
    c=[x/255 for x in c];c=[x/12.92 if x<=.03928 else((x+.055)/1.055)**2.4 for x in c];return .2126*c[0]+.7152*c[1]+.0722*c[2]
with sync_playwright() as p:
    b=p.chromium.launch();agg=collections.defaultdict(set)
    for vw in [1300,390]:
      for r in ['HR Director','Employee','Department Manager']:
        pg=b.new_page(viewport={'width':vw,'height':900});pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(300);ev=pg.evaluate
        ev("document.getElementById('gate')&&document.getElementById('gate').remove()");ev(f"MODE='sample';role={r!r};WSNO=allEmps()[3].no;draw()")
        for k in ev("Object.keys(PAGES).filter(k=>canSee(k))")[:40]:
            ev(f"page={k!r};draw()");d=ev(JS)
            for key in ['btnNoName','inputNoLabel']:
                for x in d[key]:agg[key].add(x)
            if vw==390:
                for x in d['small']:agg['small390'].add(x)
            for key in ['h1','lang','main','nav','imgNoAlt','clickDivs','tabbableFocusStyle']:
                agg[key].add(str(d[key]))
    for k,v in agg.items():print(k,len(v),sorted(v)[:8])
    # contrast of key pairs
    pg=b.new_page(viewport={'width':1300,'height':900});pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(300);ev=pg.evaluate
    ev("document.getElementById('gate')&&document.getElementById('gate').remove()");ev("MODE='sample';role='HR Director';page='emp';draw()")
    for t in ['light','dark']:
        ev(f"document.documentElement.setAttribute('data-theme','{t}')");
        res=ev("""()=>{const out=[];const pick=(sel)=>{const e=document.querySelector(sel);if(!e)return;const cs=getComputedStyle(e);let bg=null,n=e;while(n&&!bg){const c=getComputedStyle(n).backgroundColor;const m=c.match(/[\\d.]+/g);if(m&&(m.length<4||+m[3]>.9))bg=m.slice(0,3).map(Number);n=n.parentElement}out.push([sel,cs.color.match(/[\\d.]+/g).slice(0,3).map(Number),bg||[255,255,255],cs.fontSize])};
        ['td','th','.ph p','.mu','.sub','.badge','.b.p','#side .nav','#side .gh','.chip2','input','.bd'].forEach(pick);return out}""")
        for sel,fg,bg,fs in res:
            r_=(max(lum(fg),lum(bg))+.05)/(min(lum(fg),lum(bg))+.05);print(t,sel,round(r_,2),'FAIL' if r_<4.5 else '',fs)

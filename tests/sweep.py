from playwright.sync_api import sync_playwright
import re
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1300,'height':900});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(500)
    pg.evaluate("document.getElementById('gate')&&document.getElementById('gate').remove()")
    ev=pg.evaluate
    roles=ev("[...document.querySelectorAll('#role option')].map(o=>o.value)")
    pages=ev("Object.keys(PAGES)")
    bad=[]
    for mode in ['sample','mine']:
        ev(f"MODE='{mode}'")
        for r in roles:
            for k in pages:
                ok=ev(f"role={r!r};(()=>{{try{{if(!canSee('{k}'))return 0;if(role==='Employee'&&!WSNO)WSNO=allEmps()[3]&&allEmps()[3].no;page='{k}';draw();return 1}}catch(e){{window.__e=String(e);return -1}}}})()")
                if ok==-1: bad.append((mode,r,k,'THROW',ev("window.__e")));continue
                if ok==0: continue
                t=ev("document.querySelector('#view').innerText")
                if len(t.strip())<20: bad.append((mode,r,k,'EMPTY'))
                m=re.findall(r'undefined|NaN|\[object|Invalid Date|null\b',t)
                if m: bad.append((mode,r,k,'TXT',set(m)))
    for x in bad: print(x)
    print('errs',errs[:5],len(bad));b.close()

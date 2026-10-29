import sys,json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1400,'height':900})
    errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' and 'fonts' not in m.text else None)
    pg.goto('file:///tmp/full_new.html');pg.evaluate("MODE='sample';document.getElementById('gate').style.display='none'");pg.wait_for_timeout(500)
    roles=pg.eval_on_selector_all('#role option','o=>o.map(x=>x.value)')
    for mode in ['sample','mine']:
        pg.evaluate(f"MODE='{mode}';draw()")
        for r in roles:
            pg.select_option('#role',r)
            keys=pg.evaluate("NAV.flatMap(g=>g[1].map(i=>i[1])).filter(k=>canSee(k))")
            for k in keys:
                n0=len(errs)
                pg.evaluate(f"page='{k}';draw()")
                txt=pg.inner_text('#view')
                if len(errs)>n0 or len(txt)<15: print(mode,r,k,len(txt),errs[n0:][:2])
    print('roles',roles);print('done',len(errs))
    for e in errs[:15]:print(e)
    b.close()

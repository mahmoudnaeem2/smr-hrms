from playwright.sync_api import sync_playwright
import json
roles=['HR Director','HR Specialist','Payroll Specialist','Finance Manager','Department Manager','Employee','System Administrator']
with sync_playwright() as p:
    b=p.chromium.launch();bad=[];n=0
    for mode in ['sample','mine']:
      for r in roles:
        pg=b.new_page(viewport={'width':1300,'height':900});errs=[]
        pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:150]))
        pg.on('console',lambda m:errs.append('CE '+m.text[:150]) if m.type=='error' and 'TUNNEL' not in m.text and 'fonts' not in m.text else None)
        pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(300);ev=pg.evaluate
        ev("document.getElementById('gate')&&document.getElementById('gate').remove()")
        ev(f"MODE={mode!r};role={r!r};WSNO=allEmps()[3].no;draw()")
        keys=ev("Object.keys(PAGES).filter(k=>canSee(k))")
        for k in keys:
            n+=1;before=len(errs)
            try:
                ev(f"page={k!r};draw()");pg.wait_for_timeout(15)
                t=ev("document.getElementById('main')?document.getElementById('main').innerText:document.body.innerText")
                if 'could not be built' in t or 'undefined' in t or 'NaN' in t or '[object' in t or 'Infinity' in t: bad.append((mode,r,k,'TEXT',[w for w in ['could not be built','undefined','NaN','[object','Infinity'] if w in t]))
                # click through tabs/buttons safely: drill links
                ev("document.querySelectorAll('[data-d]').length")
            except Exception as x: bad.append((mode,r,k,'EXC',str(x)[:120]))
            if len(errs)>before: bad.append((mode,r,k,'ERR',errs[before:]))
        # menu entries must all resolve
        miss=ev("NAVV().flatMap(([g,it])=>it).filter(i=>!PAGES[i[1]]).map(i=>i[1])")
        if miss: bad.append((mode,r,'NAV','missing',miss))
        # search palette
        pg.close()
    print('pages checked',n);
    for x in bad:print(x)
    print('issues',len(bad))

from playwright.sync_api import sync_playwright
import sys
W=int(sys.argv[1]) if len(sys.argv)>1 else 1300
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':W,'height':850});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(300);ev=pg.evaluate
    ev("document.getElementById('gate')&&document.getElementById('gate').remove()")
    ev("MODE='mine';role='Employee';E.push({no:'E-9',name:'Test User',dept:'Finance',pos:'Accountant',type:'Full-time',status:'Active',hire:'2024-01-01',basic:10000,allow:0,loc:'Head Office',mgr:''});WSNO='E-9';page='work';draw()");pg.wait_for_timeout(300)
    pg.click('[data-act="pt:rq"]')
    keys=ev("[...document.querySelectorAll('[data-act^=\"hqt:\"]')].map(x=>x.dataset.act.slice(4)).filter((v,i,a)=>a.indexOf(v)==i)")
    print(len(keys),keys)
    for k in keys:
        if not ev(f"!!document.querySelector('[data-act=\"hqt:{k}\"]:not(.hqm *)')"):
            pg.click('[data-act="pt:rq"]')
        pg.click(f'[data-act="hqt:{k}"]:not(.hqm *)');pg.wait_for_timeout(200)
        n0=ev("HQL().length")
        # fill
        info=ev("""[...document.querySelectorAll('.hqm-form [name]')].filter(x=>x.type!='hidden'&&x.type!='file').map(x=>[x.name,x.tagName,x.type,x.required])""")
        for nm,tag,ty,rq in info:
            s=f'.hqm-form [name="{nm}"]'
            try:
                if tag=='SELECT': pass
                elif ty=='date':
                    pg.evaluate(f"(()=>{{const i=document.querySelector('{s}');i.value='2026-12-01';i.dispatchEvent(new Event('input',{{bubbles:true}}));i.dispatchEvent(new Event('change',{{bubbles:true}}))}})()")
                elif ty=='number': pg.fill(s,'3')
                elif ty in('time',): pg.fill(s,'10:00')
                else: pg.fill(s,'Test value')
            except Exception as e: print(k,'fill fail',nm,str(e)[:80])
        if W<600 and k==keys[0]: pg.screenshot(path='/tmp/reqm.png')
        pg.click('.hqm-f .p');pg.wait_for_timeout(350)
        n1=ev("HQL().length");open_=ev("!!document.querySelector('.hqm')");err=ev("document.querySelector('.hqm .err')?.textContent||''")
        print(('OK  ' if n1==n0+1 and not open_ else 'FAIL'),k,n0,n1,'open' if open_ else '',err[:80])
        if open_: pg.click('.hqm-f .b:not(.p)');pg.wait_for_timeout(150)
    print('pageerrors',errs)

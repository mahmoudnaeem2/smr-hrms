from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':400,'height':800})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///tmp/full_new.html');pg.evaluate("MODE='sample';document.getElementById('gate').style.display='none'");pg.wait_for_timeout(400)
    pg.evaluate("role='HR Director';ACTS.testrules&&0")
    keys=pg.evaluate("NAV.flatMap(g=>g[1].map(i=>i[1]))")
    bad=[]
    for k in keys:
        pg.evaluate(f"role='{'Finance Manager' if k in ['paydash','pay_reg','pay_rec','pay_var','rep_pay','rep_cost'] else 'HR Director'}';page='{k}';draw()")
        w=pg.evaluate("[document.documentElement.scrollWidth,innerWidth]")
        if w[0]>w[1]+1: bad.append((k,w))
    print('overflow',bad,errs)
    b.close()

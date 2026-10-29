from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={"width":1300,"height":900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///tmp/full_new.html");pg.wait_for_timeout(800);pg.evaluate("(()=>{const g=document.getElementById('gate');g&&g.remove()})()")
    pg.evaluate("ACTS.cc_imp&&0")
    pg.evaluate("go('cost_centers')");pg.wait_for_timeout(300)
    pg.fill("form[data-form=ccnew] input[name=code]","cc-100");pg.fill("form[data-form=ccnew] input[name=name]","Head Office");pg.click("form[data-form=ccnew] button[type=submit]");pg.wait_for_timeout(300)
    print("cc rows",pg.inner_text("#view")[:300].replace("\n"," | "))
    pg.evaluate("go('emp')");pg.wait_for_timeout(300)
    no=pg.evaluate("allEmps()[3].no");pg.evaluate(f"ACTS.eedit('{no}')");pg.wait_for_timeout(300)
    print("mgr select:",pg.evaluate("document.querySelector('#db select[name=mgr]').options.length"),"alloc opts",pg.evaluate("[...document.querySelector('#db select[name=al_n0]').options].map(o=>o.text).slice(0,4)"))
    pg.select_option("#db select[name=mgr]",index=3);pg.select_option("#db select[name=al_n0]","Head Office");pg.fill("#db input[name=al_p0]","100");pg.select_option("#db select[name=marital]","Married");pg.fill("#db input[name=wphone]","+20 2 1234 5678")
    pg.click("#db form[data-form=empEdit2] button[type=submit]");pg.wait_for_timeout(400)
    print(pg.evaluate(f"(()=>{{const e=allEmps().find(x=>x.no=='{no}');return [e.mgr,JSON.stringify(e.alloc),e.marital,e.wphone]}})()"),errs)
    pg.evaluate("go('org')");pg.wait_for_timeout(200);print(len(pg.inner_text('#view')))
    b.close()

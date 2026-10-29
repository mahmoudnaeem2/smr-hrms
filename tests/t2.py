from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={"width":1300,"height":900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///tmp/full_new.html");pg.wait_for_timeout(800);pg.evaluate("(()=>{const g=document.getElementById('gate');g&&g.remove()})()")
    ev=pg.evaluate
    no=ev("allEmps().find(e=>e.dept==='Finance').no");dept="Finance"
    pw=ev(f"mkAccess('{no}')");pw=pg.evaluate(f"mkAccess('{no}')") if not isinstance(pw,str) else pw
    ev(f"(()=>{{const a=ACCT()[akey('{no}')];a.lvl='mgr';a.must=0;sv('acct',false)}})()")
    # set known password
    ev(f"(async()=>{{const a=ACCT()[akey('{no}')];a.hash=await hashPw('Passw0rd1',a.salt);sv('acct',false)}})()");pg.wait_for_timeout(200)
    ev("ACTS.esin()");pg.fill("form[data-esf=login] input[name=no]",no);pg.fill("form[data-esf=login] input[name=pw]","Passw0rd1");pg.click("form[data-esf=login] button");pg.wait_for_timeout(500)
    print("role",ev("role"),ev("MGRD"),ev("allEmps().filter(inScope).every(e=>e.dept==='Finance')"),ev("ALLE().length"),ev("page"))
    print(ev("document.querySelector('#esbar').innerText"))
    pg.click("#esbar [data-act=esview]");pg.wait_for_timeout(300);print("after switch",ev("role"),ev("page"),ev("WSNO")==no)
    pg.reload();pg.wait_for_timeout(600);pg.evaluate("(()=>{const g=document.getElementById('gate');g&&g.remove()})()");print("reload role",ev("role"),ev("ESES&&ESES.view"))
    pg.click("#esbar [data-act=esview]");pg.wait_for_timeout(300);print("mgr again",ev("role"),ev("hasMgr('Finance')"),ev("hasMgr('Leasing')"))
    pg.click("#esbar [data-act=esout]");pg.wait_for_timeout(200);print("out",ev("role"),errs)
    b.close()

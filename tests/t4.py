from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={"width":1300,"height":900});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///tmp/full_new.html");pg.wait_for_timeout(700);ev=pg.evaluate
    ev("(()=>{const g=document.getElementById('gate');g&&g.remove()})()");ev("role='Payroll Specialist';draw()")
    ev("ACTS.load26demo()");ev("document.getElementById('cy').click()")
    pk=ev("monthsBack(3)[1].key");ev(f"FORMS.runnew({{period:'{pk}'}})");rid=ev("RUNS().slice(-1)[0].id");print("calc",ev(f"calcRun(RUNS().find(x=>x.id=='{rid}'))"))
    ev("role='HR Director';draw()")
    for pgn in ["rep_cost","rep_head","rep_hr","rep_att","rep_pay","rep_dp","rep_cx"]:
        ev(f"go('{pgn}')");pg.wait_for_timeout(200)
        if pgn in("rep_cost","rep_pay","rep_dp"):
            pg.select_option("select[data-rp=m]",pk);pg.wait_for_timeout(250)
        # click every dlink and verify drawer opens
        n=ev("document.querySelectorAll('#view [data-d]').length");ok=0;bad=[]
        for i in range(min(n,60)):
            r=ev(f"(()=>{{const b=[...document.querySelectorAll('#view [data-d]')][{i}];if(!b)return 'none';b.click();const o=document.getElementById('drawer').classList.contains('open');const t=document.getElementById('dt').textContent;closeDr();return o?'ok':'fail:'+b.textContent.slice(0,20)}})()")
            if r=='ok':ok+=1
            else:bad.append(r)
        print(pgn,"drill links",n,"ok",ok,bad[:3])
    # palette
    ev("go('dash')");pg.click("#gs");pg.fill("#gs","fin");pg.wait_for_timeout(300);print("pal",ev("[...document.querySelectorAll('#pal .pi b')].map(x=>x.textContent).slice(0,6)"))
    pg.keyboard.press("Enter");pg.wait_for_timeout(300);print("page",ev("page"))
    ev("go('rep_cost')");pg.wait_for_timeout(200);print("rel",ev("document.querySelector('#view .rel')&&document.querySelector('#view .rel').innerText"))
    pg.screenshot(path="/tmp/sh_cost2.png");print(errs);b.close()

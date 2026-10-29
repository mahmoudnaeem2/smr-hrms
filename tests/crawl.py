from playwright.sync_api import sync_playwright
import sys,json
ROLE=sys.argv[1] if len(sys.argv)>1 else 'HR Director'
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1360,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    def boot():
        pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(300);pg.select_option('#grole',ROLE);pg.click('#gok');pg.wait_for_timeout(200)
    boot();ev=pg.evaluate
    pages=ev("Object.keys(PAGES).filter(canSee)")
    dead=[];n=0
    snap="()=>[document.getElementById('view').innerHTML.length,document.getElementById('drawer').classList.contains('open'),page,document.getElementById('toast')?document.getElementById('toast').textContent:'',document.querySelectorAll('.modal,.ask,#ask,[role=dialog]').length,document.getElementById('db')?document.getElementById('db').innerHTML.length:0,(window.SCR=window.SCR||0)]"
    for k in pages:
        ev(f"page='{k}';draw()");pg.wait_for_timeout(120)
        idx=ev("[...document.querySelectorAll('#view button[data-act],#view button[data-go],#view .lnk[data-act]')].map((b,i)=>[i,(b.innerText||b.title||'').trim().slice(0,30),b.dataset.act||b.dataset.go])")
        for i,t,a in idx[:25]:
            if a and a.split(':')[0] in ('empxl','impemp','dl','xl','csv','je_csv'):continue
            ev(f"page='{k}';draw()");pg.wait_for_timeout(60)
            before=pg.evaluate(snap)
            try:
                ok=pg.evaluate(f"(()=>{{const b=[...document.querySelectorAll('#view button[data-act],#view button[data-go],#view .lnk[data-act]')][{i}];if(!b)return 0;b.click();return 1}})()")
            except Exception as e: ok=0
            pg.wait_for_timeout(80);after=pg.evaluate(snap);n+=1
            tv=pg.evaluate("document.querySelector('.toast,#toasts,.tst')?document.querySelector('.toast,#toasts,.tst').innerText:''")
            if ok and before==after and not tv: dead.append((k,t,a))
            ev("closeDr&&closeDr()")
    print('clicked',n,'dead',len(dead));
    for d in dead[:60]:print(d)
    print('errs',errs[:5])

from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1400,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///tmp/full_new.html');pg.evaluate("MODE='sample';document.getElementById('gate').style.display='none'");pg.wait_for_timeout(300);pg.evaluate("document.getElementById('gate').style.display='none'")
    if pg.query_selector('#gok'):pg.evaluate("role='HR Director';draw()")
    ev=pg.evaluate;tot=0;dead=[];nodrill=[]
    # make runs exist in sample mode
    ev("role='Payroll Specialist';ACTS.testrules();FORMS.runnew({period:monthsBack(2)[1].key});calcRun(RUNS()[0]);sv('runs')")
    for mode in ['sample','mine']:
        ev(f"MODE='{mode}'")
        if mode=='mine':ev("E=[];['Finance','Leasing'].forEach((d,i)=>E.push({no:'M'+i,name:'Mine '+i,dept:d,type:'Full-time',status:'Active',hire:'2024-01-01',basic:5000,allow:500,pos:'x'}));save()")
        for role in ['HR Director','Payroll Specialist','Employee','Finance Manager']:
            pg.select_option('#role',role)
            for k in ev("NAV.flatMap(g=>g[1].map(i=>i[1])).filter(k=>canSee(k))")+['work']:
                ev(f"go('{k}')");pg.wait_for_timeout(20)
                n=ev("document.querySelectorAll('#view .card.k:not([data-d])').length");
                if n:nodrill.append((mode,role,k,n,ev("[...document.querySelectorAll('#view .card.k:not([data-d])')].map(e=>e.innerText.split('\\n')[0]).join('|')")))
                ids=ev("[...document.querySelectorAll('#view .card.k[data-d]')].map(e=>e.dataset.d)")
                for i in ids:
                    tot+=1
                    r=ev(f"(()=>{{openDr('{i}');return[document.querySelector('#dt').textContent,document.querySelector('#db').innerText.length]}})()")
                    if not r[0] or r[1]<5:dead.append((mode,role,k,i,r))
                    ev("closeDr()")
    print('stat buttons opened',tot,'dead',dead[:10]);
    seen=set()
    for x in nodrill:
        key=(x[2],x[4])
        if key not in seen:seen.add(key);print('no drill:',x)
    print(errs);b.close()

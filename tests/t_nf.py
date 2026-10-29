from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();errs=[]
    for n,(w,h) in {'d':(1300,900),'m':(390,880)}.items():
        pg=b.new_page(viewport={'width':w,'height':h});pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(700);pg.evaluate("localStorage.setItem('smr_mode','mine')");pg.reload();pg.wait_for_timeout(700);pg.click('text=Continue to prototype');pg.wait_for_timeout(500)
        pg.evaluate("""()=>{role='HR Director';E.push({no:'E-1',name:'Khaled Ashry',dept:'Finance',pos:'x',type:'Full-time',status:'Active',hire:'2024-01-01',basic:1,allow:0,loc:'HO',mgr:''});LR.push({id:Date.now(),no:'E-1',mode:MODE,type:'Annual leave',start:'2026-11-10',end:'2026-11-11',days:2,status:'Pending'});save();saveW();draw();openNotif()}""");pg.wait_for_timeout(500)
        pg.screenshot(path=f'/tmp/nf_{n}.png')
        if n=='d':
            pg.evaluate("ACTS.nrdall()");pg.wait_for_timeout(300);pg.screenshot(path='/tmp/nf_read.png')
    print(errs)

from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();errs=[]
    for n,(w,h) in {'d':(1400,950),'m':(390,900)}.items():
        pg=b.new_page(viewport={'width':w,'height':h});pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(800)
        pg.evaluate("""()=>{localStorage.setItem('smr_mode','mine');role='HR Director'}""");pg.reload();pg.wait_for_timeout(800);pg.click('text=Continue to prototype');pg.wait_for_timeout(600)
        pg.evaluate("""()=>{role='HR Director';const t=new Date(T0);const f=k=>iso(new Date(t.getFullYear(),t.getMonth(),t.getDate()+k));
         E.push({no:'E-1',name:'Khaled Ashry',dept:'Finance',pos:'x',type:'Full-time',status:'Active',hire:'2024-01-01',basic:1,allow:0,loc:'HO',mgr:''},{no:'E-2',name:'Mona Said',dept:'Finance',pos:'x',type:'Full-time',status:'Active',hire:'2024-01-01',basic:1,allow:0,loc:'HO',mgr:''},{no:'E-3',name:'Omar Fathy',dept:'Finance',pos:'x',type:'Full-time',status:'Active',hire:'2024-01-01',basic:1,allow:0,loc:'HO',mgr:''});
         LR.push({id:1,no:'E-1',mode:MODE,type:'Annual leave',start:f(1),end:f(3),days:3,status:'Approved'},{id:2,no:'E-2',mode:MODE,type:'Sick leave',start:f(2),end:f(2),days:1,status:'Approved'},{id:3,no:'E-3',mode:MODE,type:'Annual leave',start:f(2),end:f(4),days:3,status:'Pending'},{id:4,no:'E-1',mode:MODE,type:'Annual leave',start:f(8),end:f(9),days:2,status:'Pending'});save();saveW();go('leave_cal')}""");pg.wait_for_timeout(600)
        print(n,pg.evaluate("[...document.querySelectorAll('.lcd.wk .n')].map(x=>x.textContent).join(',')"));pg.screenshot(path=f'/tmp/cal_{n}.png')
        if n=='d':
            pg.evaluate("document.querySelector('.lcd.has')?.click()");pg.wait_for_timeout(400);pg.screenshot(path='/tmp/cal_drawer.png')
    print(errs)

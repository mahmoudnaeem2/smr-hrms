from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();errs=[]
    pg=b.new_page(viewport={'width':1200,'height':900});pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(600)
    pg.evaluate("""()=>{localStorage.setItem('smr_mode','mine');localStorage.setItem('smr_seed2','1');
     localStorage.setItem('smr_emp',JSON.stringify([{no:'E-1',name:'Mahmoud Naeem',dept:'Management',pos:'Head',type:'Full-time',status:'Active',hire:'2020-01-01',basic:1,allow:0,loc:'HO',mgr:''},{no:'E-2',name:'Khaled Ashry',dept:'Finance',pos:'Acc',type:'Full-time',status:'Active',hire:'2024-01-01',basic:1,allow:0,loc:'HO',mgr:'Mahmoud Naeem'}]));
     const now=Date.now();localStorage.setItem('smr_lr',JSON.stringify([{id:now,no:'E-2',mode:'mine',type:'Annual leave',start:'2026-11-10',end:'2026-11-11',days:2,status:'Pending'},{id:now-1,no:'E-2',mode:'mine',type:'Sick leave',start:'2026-10-01',end:'2026-10-01',days:1,status:'Approved'},{id:now-2,no:'E-2',mode:'mine',type:'Annual leave',start:'2026-09-01',end:'2026-09-02',days:2,status:'Rejected'}]));
     localStorage.setItem('smr_dec_mine',JSON.stringify({['L'+(now-1)]:{step:2,final:'Approved',log:[{role:'Department Manager',d:'Approved',t:new Date().toISOString()},{role:'HR Specialist',d:'Approved',t:new Date().toISOString()}]},['L'+(now-2)]:{step:0,final:'Rejected',log:[{role:'HR Specialist',d:'Rejected',t:new Date().toISOString(),reason:'Busy period'}]}}));
     sessionStorage.setItem('smr_es',JSON.stringify({no:'E-2',mode:'mine',lvl:'emp',view:'emp',dept:'Finance',wrole:'Employee'}))}""")
    pg.reload();pg.wait_for_timeout(900)
    pg.evaluate("page='work';draw();ACTS.ptg('to')");pg.wait_for_timeout(500)
    pg.screenshot(path='/tmp/trk.png',full_page=True);print(errs)

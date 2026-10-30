import json,re,time
from playwright.sync_api import sync_playwright
STORE={}   # k -> {v,ver}
USERS={'admin@x.com':{'id':'u-admin','pw':'Passw0rd1','role':'System Administrator','name':'Admin One','active':True},
       'hr@x.com':{'id':'u-hr','pw':'Passw0rd1','role':'HR Specialist','name':'Hala HR','active':True},
       'hd@x.com':{'id':'u-hd','pw':'Passw0rd1','role':'HR Director','name':'Hana Director','active':True},
       'emp@x.com':{'id':'u-emp','pw':'Passw0rd1','role':'Employee','name':'Mahmoud E','active':True,'emp_no':'E-1'},
       'new@x.com':{'id':'u-new','pw':'Passw0rd1','role':'Pending','name':'New','active':True}}
TOK={}
LOG=[];PUTS=[];SETP=[];FN=[];NOTI=[]
def who(req):
    a=req.headers.get('authorization','').replace('Bearer ','');return TOK.get(a)
def handler(route):
    r=route.request;u=r.url;m=r.method
    def js(code,obj):route.fulfill(status=code,content_type='application/json',headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'},body=json.dumps(obj))
    if m=='OPTIONS':return route.fulfill(status=204,headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'})
    if '/auth/v1/token' in u and 'password' in u:
        b=json.loads(r.post_data);us=USERS.get(b['email'])
        if not us or us['pw']!=b['password']:return js(400,{'error_description':'Invalid login credentials'})
        t='tok-'+us['id']+'-'+str(len(TOK));TOK[t]=us
        return js(200,{'access_token':t,'refresh_token':'r-'+us['id'],'expires_in':3600,'user':{'id':us['id'],'email':b['email']}})
    if '/auth/v1/logout' in u:return js(204,{})
    us=who(r)
    if '/rest/v1/' in u and not us:return js(401,{'message':'JWT expired'})
    if '/rest/v1/profiles' in u:
        return js(200,[{'full_name':us['name'],'role':us['role'],'active':us['active'],'emp_no':us.get('emp_no')}])
    if '/rest/v1/app_store' in u and m=='GET':
        if us['role']=='Pending':return js(200,[])
        if 'select=k,ver' in u:return js(200,[{'k':k,'ver':x['ver']} for k,x in STORE.items()])
        return js(200,[{'k':k,'v':x['v'],'ver':x['ver']} for k,x in STORE.items()])
    if '/auth/v1/user' in u and m=='GET':return js(200,{'id':us['id'] if us else 'x','email':'e','user_metadata':{'must_change':bool(us and us.get('must'))}}) if us else js(401,{})
    if '/rpc/list_profiles' in u:
        if us['role'] not in('HR Director','System Administrator'):return js(403,{'message':'not_allowed'})
        return js(200,[{'id':v['id'],'email':k,'full_name':v['name'],'role':v['role'],'active':v['active'],'emp_no':v.get('emp_no'),'last_sign_in_at':None} for k,v in USERS.items()])
    if '/rpc/set_profile' in u:
        b=json.loads(r.post_data);SETP.append(b)
        for k,v in USERS.items():
            if v['id']==b['p_id']:v['role']=b['p_role'];v['active']=b['p_active'];v['emp_no']=b['p_emp_no']
        return js(200,None)
    if '/functions/v1/notify-leave' in u:
        NOTI.append(json.loads(r.post_data));return js(200,{'ok':True})
    if '/functions/v1/admin-users' in u:
        b=json.loads(r.post_data);FN.append(b)
        if b['action']=='create':
            if b['email'] in USERS:return js(400,{'error':'This email already has an account.'})
            USERS[b['email']]={'id':'u-'+b['email'],'pw':'Temp1234ab','role':b['role'],'name':b.get('full_name') or 'Emp','active':True,'emp_no':b.get('emp_no'),'must':True}
            return js(200,{'ok':True,'email':b['email'],'password':'Temp1234ab','name':USERS[b['email']]['name'],'role':b['role']})
        return js(200,{'ok':True,'password':'Reset9999xy'})
    if '/rpc/portal_data' in u:
        if us['role']!='Employee':return js(403,{'message':'not_an_employee'})
        me=us['emp_no'];o={}
        for k,x in STORE.items():
            if k=='smr_emp':o[k]=[e for e in x['v'] if e['no']==me]
            elif k=='smr_lr':o[k]=[e for e in x['v'] if e['no']==me]
            elif k in('smr_depts',):o[k]=x['v']
        return js(200,o)
    if '/rpc/portal_put' in u:
        b=json.loads(r.post_data);PUTS.append(b);
        if b['p_k'] not in('smr_lr','smr_hrq_mine','smr_punch'):return js(403,{'message':'key_not_writable'})
        return js(200,None)
    if '/rpc/put_store' in u:
        b=json.loads(r.post_data);k=b['p_k'];cur=STORE.get(k)
        if (cur and cur['ver']!=b['p_ver']) or (not cur and b['p_ver']!=0):return js(400,{'code':'P0001','message':'version_conflict'})
        n=(cur['ver'] if cur else 0)+1;STORE[k]={'v':b['p_v'],'ver':n};LOG.append(('put',k,n));return js(200,n)
    if '/rpc/del_store' in u:
        b=json.loads(r.post_data);STORE.pop(b['p_k'],None);LOG.append(('del',b['p_k']));return js(204,None) if False else js(200,None)
    route.continue_()
def login(pg,em,pw):
    pg.fill('#cge',em);pg.fill('#cgp',pw);pg.click('#cgf .p')
def ok(c,msg):print(('PASS ' if c else 'FAIL ')+msg)
with sync_playwright() as p:
    b=p.chromium.launch()
    def ctx():
        c=b.new_context(viewport={'width':1300,'height':850});pg=c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        c.route('https://fake.supabase.co/**',handler);return c,pg,errs
    # 1 wrong password
    c1,pg,errs=ctx()
    pg.add_init_script("if(!localStorage.getItem('smr_emp')){localStorage.setItem('smr_emp',JSON.stringify([{no:'E-1',name:'Local One',dept:'Finance',pos:'Acc',type:'Full-time',status:'Active',hire:'2024-01-01',basic:1000,allow:0,loc:'Head Office',mgr:''},{no:'E-2',name:'Local Two',dept:'Finance',pos:'Acc',type:'Full-time',status:'Active',hire:'2024-01-01',basic:1000,allow:0,loc:'Head Office',mgr:''}]));localStorage.setItem('smr_seed2','1')}")
    pg.goto('file:///tmp/full_cloud.html');pg.wait_for_selector('#cgf')
    ok(pg.evaluate("typeof E==='undefined'"),'app not started before login')
    login(pg,'admin@x.com','bad');pg.wait_for_timeout(400);ok('Wrong email or password' in pg.inner_text('#cgx'),'wrong password message')
    # 2 first run upload
    login(pg,'admin@x.com','Passw0rd1');pg.wait_for_selector('#cgu',timeout=3000);ok('2 employee' in pg.inner_text('#cg'),'first-run screen shows local employee count')
    pg.click('#cgu');pg.wait_for_function("typeof E!=='undefined'&&document.querySelector('#cg')===null",timeout=5000);pg.wait_for_timeout(500)
    ok('smr_emp' in STORE and len(STORE['smr_emp']['v'])==2,'local data uploaded to cloud')
    ok(pg.evaluate("role")=='System Administrator' and pg.evaluate("MODE")=='mine','role from profile, mode mine')
    ok(pg.evaluate("document.querySelector('#cst')?.textContent")=='All changes saved','status pill saved')
    # 3 edit saves
    pg.evaluate("E.push({no:'E-3',name:'Cloud Three',dept:'Finance',pos:'Acc',type:'Full-time',status:'Active',hire:'2024-01-01',basic:1000,allow:0,loc:'Head Office',mgr:''});save()");pg.wait_for_timeout(1500)
    ok(len(STORE['smr_emp']['v'])==3 and STORE['smr_emp']['ver']==2,'edit written, version bumped to 2')
    n=len(LOG);pg.wait_for_timeout(1000)
    # 4 second user sees data, no first run
    c2,pg2,e2=ctx();pg2.goto('file:///tmp/full_cloud.html');pg2.wait_for_selector('#cgf');login(pg2,'hr@x.com','Passw0rd1')
    pg2.wait_for_function("typeof E!=='undefined'&&document.querySelector('#cg')===null",timeout=5000)
    ok(pg2.evaluate("E.length")==3 and pg2.evaluate("role")=='HR Specialist','second user loads 3 employees, own role')
    puts_before=len([x for x in LOG if x[0]=='put']);pg2.wait_for_timeout(1500)
    ok(len([x for x in LOG if x[0]=='put'])==puts_before,'no needless writes at startup')
    # 5 conflict
    pg.evaluate("E[0].name='Edited by admin';save()");pg.wait_for_timeout(1500)
    pg2.evaluate("E[1].name='Edited by hr';save()");pg2.wait_for_timeout(1800)
    ok(pg2.query_selector('#cgr') is not None,'conflict screen shown to the second writer')
    ok(STORE['smr_emp']['v'][0]['name']=='Edited by admin' and STORE['smr_emp']['v'][1]['name']!='Edited by hr','cloud kept the first writer\'s data')
    pg2.click('#cgr');pg2.wait_for_function("typeof E!=='undefined'&&document.querySelector('#cg')===null",timeout=6000)
    ok(pg2.evaluate("E[0].name")=='Edited by admin','after reload sees latest')
    # 6 stale detection
    pg.evaluate("E[2].name='Changed again';save()");pg.wait_for_timeout(1500)
    pg2.evaluate("window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'))");pg2.wait_for_timeout(800)
    pg2.wait_for_timeout(1500)
    ok(pg2.evaluate("E[2].name")=='Changed again','other session picks up the change live, without a reload')
    ok('Newer data' not in (pg2.evaluate("document.querySelector('#cst')?.textContent")or''),'no stale banner when the change could be taken in')
    # 7 pending user
    c3,pg3,e3=ctx();pg3.goto('file:///tmp/full_cloud.html');pg3.wait_for_selector('#cgf');login(pg3,'new@x.com','Passw0rd1');pg3.wait_for_timeout(800)
    ok('Waiting for access' in pg3.inner_text('#cg') and pg3.evaluate("typeof E==='undefined'"),'pending user blocked, app never starts')
    # 8 sign out
    pg.evaluate("ACTS.esout()");pg.wait_for_timeout(300)
    pg.click('#cy');pg.wait_for_selector('#cgf',timeout=4000);ok(pg.evaluate("localStorage.getItem('smr_sb')")is None,'sign out clears session')
    c4,pg4,e4=ctx();pg4.goto('file:///tmp/full_cloud.html');pg4.wait_for_selector('#cgf');login(pg4,'hd@x.com','Passw0rd1')
    pg4.wait_for_function("typeof E!=='undefined'&&document.querySelector('#cg')===null",timeout=6000)
    pg4.evaluate("go('emp')");pg4.wait_for_timeout(500)
    ok(pg4.evaluate("!!document.querySelector('[data-act=eadd]')"),'HR Director sees + Add employee')
    pg4.evaluate("const s=document.getElementById('role');s.disabled=false;s.value='Finance Manager';s.dispatchEvent(new Event('change',{bubbles:true}))");pg4.wait_for_timeout(1200)
    ok(pg4.evaluate("role")=='HR Director','role snaps back to the server role after tampering')
    ok(pg4.evaluate("document.querySelector('.rmb b')?.textContent")=='HR Director','role card shows HR Director')
    # 9 employee portal
    STORE['smr_lr']={'v':[{'id':1,'no':'E-1','status':'Approved','days':2},{'id':2,'no':'E-2','status':'Pending','days':5}],'ver':1}
    c5,pg5,e5=ctx();pg5.goto('file:///tmp/full_cloud.html');pg5.wait_for_selector('#cgf');login(pg5,'emp@x.com','Passw0rd1')
    pg5.wait_for_function("typeof E!=='undefined'&&document.querySelector('#cg')===null",timeout=6000);pg5.wait_for_timeout(600)
    ok(pg5.evaluate("role")=='Employee' and pg5.evaluate("WSNO")=='E-1','employee session role + own number')
    ok(pg5.evaluate("E.length")==1 and pg5.evaluate("E[0].no")=='E-1','employee only holds own record')
    ok(pg5.evaluate("JSON.parse(localStorage.getItem('smr_lr')).length")==1,'employee holds only own leave rows')
    ok(pg5.evaluate("sessionStorage.getItem('smr_ss')") is None,'no staff session for employee')
    ok(pg5.evaluate("document.body.innerText.includes('Edited by hr')||document.body.innerText.includes('Local Two')")==False,'other employees not visible')
    PUTS.clear()
    pg5.evaluate("const L=JSON.parse(localStorage.getItem('smr_lr'));L.push({id:99,no:'E-1',status:'Pending',days:1});localStorage.setItem('smr_lr',JSON.stringify(L))");pg5.wait_for_timeout(1500)
    ok(len(PUTS)==1 and PUTS[0]['p_k']=='smr_lr' and len(PUTS[0]['p_v'])==2,'leave request sent through portal_put')
    ok(any(n['kind']=='submitted' and str(n['lr_id'])=='99' for n in NOTI),'submitting a leave asks the server to email the approver')
    PUTS.clear();pg5.evaluate("localStorage.setItem('smr_emp','[]')");pg5.evaluate("localStorage.setItem('smr_loans_mine','[]')");pg5.wait_for_timeout(1200)
    ok(len(PUTS)==0 and not [x for x in LOG if x[1] in('smr_loans_mine',)],'non-writable keys never sent')
    pg5.evaluate("ACTS.esout()");pg5.wait_for_timeout(300);pg5.click('#cy');pg5.wait_for_selector('#cgf',timeout=4000)
    ok(pg5.evaluate("localStorage.getItem('smr_emp')") is None,'sign out wipes cached data')
    # 10 users and access page
    c6,pg6,e6=ctx();pg6.goto('file:///tmp/full_cloud.html');pg6.wait_for_selector('#cgf');login(pg6,'hd@x.com','Passw0rd1')
    pg6.wait_for_function("typeof E!=='undefined'&&document.querySelector('#cg')===null",timeout=6000)
    pg6.evaluate("go('users')");pg6.wait_for_timeout(900)
    ok('Add an account' in pg6.inner_text('#main') and 'emp@x.com' in pg6.inner_text('#main'),'Users & Access lists accounts and shows add form')
    ok(pg6.evaluate("!document.querySelector('[data-act^=\"ua_role:u-hd\"]')"),'no actions on your own row')
    pg6.fill('[data-form=cuser] [name=email]','new.emp@x.com');pg6.select_option('[data-form=cuser] [name=role]','Employee');pg6.click('[data-form=cuser] [type=submit]');pg6.wait_for_timeout(500)
    ok('Choose the employee' in pg6.inner_text('[data-form=cuser]+.err'),'employee role needs an employee')
    pg6.evaluate("E.push({no:'E-7',name:'Seven',dept:'Finance',pos:'A',type:'Full-time',status:'Active',hire:'2024-01-01',basic:1,allow:0,loc:'Head Office',mgr:''});save();go('users')");pg6.wait_for_timeout(500)
    pg6.fill('[data-form=cuser] [name=email]','new.emp@x.com');pg6.select_option('[data-form=cuser] [name=role]','Employee');    pg6.select_option('[data-form=cuser] [name=emp_no]','E-7');pg6.click('[data-form=cuser] [type=submit]');pg6.wait_for_timeout(900)
    ok(FN and FN[-1]['emp_no']=='E-7' and 'Temp1234ab' in pg6.inner_text('#drawer'),'account created, temporary password shown once')
    pg6.evaluate("closeDr()");pg6.evaluate("ACTS.ua_tog('u-new.emp@x.com')");pg6.click('#cy');pg6.wait_for_timeout(700)
    ok(SETP and SETP[-1]['p_active']==False,'disable sends set_profile')
    pg6.evaluate("ACTS.ua_rst('u-emp')");pg6.click('#cy');pg6.wait_for_timeout(700)
    ok('Reset9999xy' in pg6.inner_text('#drawer'),'reset shows new temporary password')
    # must-change flow
    c7,pg7,e7=ctx();pg7.goto('file:///tmp/full_cloud.html');pg7.wait_for_selector('#cgf');login(pg7,'new.emp@x.com','Temp1234ab');pg7.wait_for_timeout(900)
    ok('Set your own password' in pg7.inner_text('#cg'),'first sign-in forces a new password')
    # 11 HR Director approves a leave request on behalf of the manager step
    pg6.evaluate("closeDr();E.push({no:'E-8',name:'Eight',dept:'Finance',pos:'A',type:'Full-time',status:'Active',hire:'2024-01-01',basic:1,allow:0,loc:'Head Office',mgr:'Hana Director'});LR.push({id:Date.now(),no:'E-8',mode:MODE,type:'Annual',start:'2026-11-10',end:'2026-11-11',days:2,status:'Pending',note:''});save();saveW();go('appr')");pg6.wait_for_timeout(600)
    ok(pg6.evaluate("(()=>{const it=apprItems().find(x=>x.no==='E-8');return !!it&&canAct(it)})()"),'HR Director can act on a pending leave in cloud mode')
    pg6.wait_for_timeout(1800)
    pg6.evaluate("(()=>{const it=apprItems().find(x=>x.no==='E-8');decide(it.id,'Approved','ok')})()");pg6.wait_for_timeout(300)
    ok(pg6.evaluate("LR.find(r=>r.no==='E-8').status")=='Approved','one approval finalises the leave')
    pg6.wait_for_timeout(1800)
    ok(any(n['kind']=='decided' for n in NOTI),'approving a leave asks the server to email the employee')
    print('errors',errs,e2,e3,e4,e5,e6,e7)

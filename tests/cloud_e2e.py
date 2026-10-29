import json,re,time
from playwright.sync_api import sync_playwright
STORE={}   # k -> {v,ver}
USERS={'admin@x.com':{'id':'u-admin','pw':'Passw0rd1','role':'System Administrator','name':'Admin One','active':True},
       'hr@x.com':{'id':'u-hr','pw':'Passw0rd1','role':'HR Specialist','name':'Hala HR','active':True},
       'hd@x.com':{'id':'u-hd','pw':'Passw0rd1','role':'HR Director','name':'Hana Director','active':True},
       'emp@x.com':{'id':'u-emp','pw':'Passw0rd1','role':'Employee','name':'Mahmoud E','active':True,'emp_no':'E-1'},
       'new@x.com':{'id':'u-new','pw':'Passw0rd1','role':'Pending','name':'New','active':True}}
TOK={}
LOG=[];PUTS=[]
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
    ok('Newer data' in (pg2.evaluate("document.querySelector('#cst')?.textContent")or''),'stale banner on the other session')
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
    PUTS.clear();pg5.evaluate("localStorage.setItem('smr_emp','[]')");pg5.evaluate("localStorage.setItem('smr_loans_mine','[]')");pg5.wait_for_timeout(1200)
    ok(len(PUTS)==0 and not [x for x in LOG if x[1] in('smr_loans_mine',)],'non-writable keys never sent')
    pg5.evaluate("ACTS.esout()");pg5.wait_for_timeout(300);pg5.click('#cy');pg5.wait_for_selector('#cgf',timeout=4000)
    ok(pg5.evaluate("localStorage.getItem('smr_emp')") is None,'sign out wipes cached data')
    print('errors',errs,e2,e3,e4,e5)

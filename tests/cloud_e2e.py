import json,re,time
from playwright.sync_api import sync_playwright
STORE={}   # k -> {v,ver}
USERS={'admin@x.com':{'id':'u-admin','pw':'Passw0rd1','role':'System Administrator','name':'Admin One','active':True},
       'hr@x.com':{'id':'u-hr','pw':'Passw0rd1','role':'HR Specialist','name':'Hala HR','active':True},
       'new@x.com':{'id':'u-new','pw':'Passw0rd1','role':'Pending','name':'New','active':True}}
TOK={}
LOG=[]
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
        return js(200,[{'full_name':us['name'],'role':us['role'],'active':us['active']}])
    if '/rest/v1/app_store' in u and m=='GET':
        if us['role']=='Pending':return js(200,[])
        if 'select=k,ver' in u:return js(200,[{'k':k,'ver':x['ver']} for k,x in STORE.items()])
        return js(200,[{'k':k,'v':x['v'],'ver':x['ver']} for k,x in STORE.items()])
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
    print('errors',errs,e2,e3)

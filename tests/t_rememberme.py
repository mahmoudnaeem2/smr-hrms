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
    def run(remember):
        c=b.new_context(viewport={'width':1300,'height':850});c.route('https://fake.supabase.co/**',handler)
        pg=c.new_page();pg.goto('file:///tmp/full_cloud.html');pg.wait_for_selector('#cgf')
        ok(pg.is_checked('#cgrm'),'remember me is on by default')
        if not remember:pg.uncheck('#cgrm')
        login(pg,'hd@x.com','Passw0rd1');pg.wait_for_timeout(1500)
        st=json.loads(pg.evaluate("localStorage.getItem('smr_sb')"))
        ok(st['rm']==remember,'session flag rm=%s'%remember)
        pg.reload();pg.wait_for_timeout(1500)
        ok(pg.query_selector('#cgf') is None,'reload in same tab stays signed in')
        # simulate closing the browser: session storage is gone, local storage stays
        ls=pg.evaluate("localStorage.getItem('smr_sb')");em=pg.evaluate("localStorage.getItem('cg_email')")
        pg2=c.new_page();pg2.goto('file:///tmp/full_cloud.html');pg2.wait_for_timeout(1500)
        gate=pg2.query_selector('#cgf') is not None
        ok(gate==(not remember),'new window after close: %s'%('sign-in shown' if gate else 'still signed in'))
        if gate:
            ok(pg2.input_value('#cge')=='' ,'email not stored when remember is off')
        else:
            pass
        c.close()
    run(True);run(False)
    # remembered email prefilled after sign-in screen again
    c=b.new_context();c.route('https://fake.supabase.co/**',handler);pg=c.new_page();pg.goto('file:///tmp/full_cloud.html');pg.wait_for_selector('#cgf');login(pg,'hd@x.com','Passw0rd1');pg.wait_for_timeout(1200)
    pg.evaluate("localStorage.removeItem('smr_sb')");pg.reload();pg.wait_for_selector('#cgf')
    ok(pg.input_value('#cge')=='hd@x.com','email prefilled when remembered')
    pg.screenshot(path='/tmp/rm_login.png')
    pm=b.new_context(viewport={'width':390,'height':800});pm.route('https://fake.supabase.co/**',handler);q=pm.new_page();q.goto('file:///tmp/full_cloud.html');q.wait_for_selector('#cgf');q.screenshot(path='/tmp/rm_login_m.png')

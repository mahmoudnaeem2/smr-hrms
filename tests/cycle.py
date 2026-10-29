from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1300,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(600);ev=pg.evaluate
    ev("document.getElementById('gate')&&document.getElementById('gate').remove()")
    def step(n,x):print('>',n,'|',x)
    ev("MODE='mine';role='HR Director';draw()")
    step('employees at start',ev("allEmps().length"))
    # 1 hire 3 employees
    pk=ev("monthsBack(2)[1].key")
    hire=pk[:4]+'-01-05'
    for i,(nm,bs) in enumerate([('Test One',20000),('Test Two',35000),('Test Three',12000)]):
        r=ev(f"FORMS.empnew({{name:{nm!r},pos:'Accountant',hire:'{hire}',dept:'Finance',n_basic:'{bs}',bankname:'CIB',bankacct:'1000200030',type:'Full-time',status:'Active',email:'t{i}@x.com',mobile:'01012345678',no:'T{i+1}'}})")
        step('hire',nm+' '+str(r))
    step('employees',ev("allEmps().map(e=>e.no+':'+e.basic)"))
    # 2 leave via HR then approval chain
    d=ev("(()=>{let x=addD(T0,-20);while(isWk(x))x=addD(x,-1);return iso(x)})()")
    ev("go('leave_req')")
    r=ev(f"FORMS.lvman({{no:'T1',type:'Annual leave',start:'{d}',end:'{d}',note:'t'}})");step('lvman',r)
    it=ev("(apprItems().find(i=>i.lr&&i.no==='T1')||{}).id");step('appr item',it)
    step('avail pending',ev("balances(empBy('T1'))['Annual leave'].avail"))
    for rl in ['HR Director','HR Specialist','Department Manager']:
        ev(f"role='{rl}'");
        if ev(f"!!apprItems().find(i=>i.id==='{it}'&&canAct(i))"): ev(f"decide('{it}','Approved','')");step('approved by',rl)
    step('LR status',ev("LR.filter(x=>x.no==='T1').map(x=>x.status)"))
    step('avail after',ev("balances(empBy('T1'))['Annual leave'].avail"))
    # 3 loan
    ev("role='HR Director'");st=ev("iso(addD(T0,0)).slice(0,8)+'01'")
    step('loan',ev(f"createLoan('T2',6000,6,'{pk}-25','t')"))
    step('loan2 (block)',ev("createLoan('T2',1000,2,iso(T0),'')"))
    # 4 rules: demo load then verify via two roles (test harness only)
    ev("role='Payroll Specialist'");ev("ACTS.load26demo()");ev("document.querySelector('#confirm button.p')&&document.querySelector('#confirm button.p').click()")
    step('demo rules',ev("RULES().filter(r=>r.demo).length"))
    ev("RULES().filter(r=>r.demo).forEach(r=>ACTS.rver(r.id))")
    step('review',ev("RULES().filter(r=>r.status==='review').length"))
    ev("role='HR Director'")
    for rid in ev("RULES().filter(r=>r.status==='review').map(r=>r.id)"):
        ev(f"ACTS.rapp('{rid}')");
        ev(f"FORMS.rappf({{id:'{rid}',verifier:'QA',verDate:iso(T0),srcUrl:'https://example.gov.eg/x',legalRef:'test'}})")
    step('approved rules',ev("RULES().filter(r=>r.status==='approved').length"))
    # 5 run
    ev("role='Payroll Specialist'");step('runnew',ev(f"FORMS.runnew({{period:'{pk}'}})"))
    rid=ev("RUNS().slice(-1)[0].id");step('calc',ev(f"calcRun(RUNS().find(x=>x.id=='{rid}'))"))
    run=lambda:ev(f"RUNS().find(x=>x.id=='{rid}')")
    r=run();step('status',r['status']);step('exc',[ (x['sev'],x['msg'][:70]) for x in r['exc']])
    step('results',[{k:x.get(k) for k in ('no','basic','gross','ded','net','loan')} for x in r['results']])
    # move to under_review
    print(ev("Object.keys(ACTS).filter(k=>/rev|valid|chk|go/.test(k)).join(' ')"))
    ev(f"role='Payroll Specialist';(()=>{{const r=RUNS().find(x=>x.id=='{rid}');['E-0001','E-0002','E-0003','E-0004'].forEach(n=>r.excl[n]='placeholder');}})()")
    step('recalc',ev(f"ACTS.calc('{rid}')"));r=run();step('status',r['status']);step('exc',[(x['sev'],x['msg'][:60]) for x in r['exc']])
    step('submit',ev(f"ACTS.submit('{rid}')"));step('status',run()['status'])
    step('appr items',ev(f"apprItems().filter(i=>String(i.id).includes('{rid}')).map(i=>i.id+':'+i.fin)"))
    for rl in ['HR Director','Finance Manager']:
        ev(f"role='{rl}'")
        for i in ev(f"apprItems().filter(i=>String(i.id).includes('{rid}')&&canAct(i)).map(i=>i.id)"):
            ev(f"decide('{i}','Approved','')");step('approved',rl+' '+i)
    step('status',run()['status'])
    ev("role='Finance Manager'");ev(f"ACTS.fin('{rid}')");ev("document.querySelector('#confirm button.p')&&document.querySelector('#confirm button.p').click()");step('status',run()['status'])
    ev(f"ACTS.paid('{rid}')");ev("document.querySelector('#confirm button.p')&&document.querySelector('#confirm button.p').click()");step('status',run()['status'])
    r=run();step('results',[{k:x.get(k) for k in ('no','gross','net')} for x in r['results']])
    # payslip
    ev("role='HR Director';go('payslips')");step('payslips page',ev("document.querySelector('#view').innerText.slice(0,300)"))
    step('slip T2',ev(f"(()=>{{const r=RUNS().find(x=>x.id=='{rid}');return slipText(r,r.results.find(x=>x.no==='T2'))}})()"))
    ev("role='HR Director';go('loans')");step('loans page',ev("document.querySelector('#view').innerText.slice(0,900)"))
    step('LN data',ev("JSON.stringify((db('loans',[])||[]).filter(l=>l.no==='T2'))"))
    for k in ['rep_pay','rep_head','rep_cost','rep_dp','rep_leave','rep_hr','rep_att','pay_reg','pay_fs','pay_je','pay_rec','dash','paydash','auditlog','completeness','settle','loans']:
        ev(f"role='HR Director';go('{k}')") if k not in('rep_pay','pay_reg','pay_fs','pay_je','pay_rec','paydash','settle') else ev(f"role='Finance Manager';go('{k}')")
        t=ev("document.querySelector('#view').innerText");import re
        step('page '+k,str(len(t))+' '+str(set(re.findall(r'undefined|NaN|\[object|Invalid',t))))
    ev("role='Employee';WSNO='T2';go('payslips')");step('emp payslips',ev("document.querySelector('#view').innerText.slice(0,400)"))

    ev("role='HR Director'")
    wd=ev("(()=>{let x=addD(T0,-3);while(isWk(x))x=addD(x,-1);return iso(x)})()")
    step('attman',ev(f"FORMS.attman({{no:'T1',date:'{wd}',tin:'09:00',tout:'17:30',status:'Present'}})"))
    step('otx',ev(f"FORMS.otx({{no:'T3',date:'{wd}',hours:'2',kind:'Day'}})"))
    step('otx appr',ev("apprItems().filter(i=>/over|OT/i.test(i.type||i.kind||i.title||'')).map(i=>i.id+':'+(i.type||i.kind))"))
    step('salReq',ev(f"FORMS.salReq({{no:'T3',eff:iso(T0),basic:'15000',reason:'Annual raise'}})"))
    step('appr types',ev("[...new Set(apprItems().map(i=>i.type||i.kind||i.title))]"))
    step('wnnew',ev(f"FORMS.wnnew({{no:'T3',level:'Verbal warning',date:'{wd}',reason:'Late'}})"))
    step('mv',ev("FORMS.mv({no:'T1',eff:iso(T0),dept:'Operations',pos:'Senior Accountant',reason:'promo'})"))
    step('T1 after mv',ev("empBy('T1').dept+' '+empBy('T1').pos"))
    step('term2',ev("FORMS.term2({no:'T3',last:iso(T0),type:'Resignation',note:'ok',reason:'Resignation'})"))
    step('T3 status',ev("empBy('T3').status+' '+empBy('T3').term"))
    ev("role='Payroll Specialist';go('settle')");step('settle page',ev("document.querySelector('#view').innerText.slice(0,500)"))
    ev("role='HR Director';go('offboard')");step('offboard',ev("document.querySelector('#view').innerText.slice(0,300)"))
    ev("role='HR Director';go('notif')");step('notif',ev("document.querySelector('#view').innerText.slice(0,300)"))
    pg.screenshot(path='/tmp/cy1.png')
    print('errs',errs);b.close()

from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1400,'height':900})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///tmp/full_new.html');pg.evaluate("MODE='sample';document.getElementById('gate').style.display='none'");pg.wait_for_timeout(400)
    ev=pg.evaluate
    def setrole(r):ev(f"role='{r}';draw()")
    # 1 calc without rules
    setrole('Payroll Specialist')
    ev("localStorage.clear();location.reload()");pg.wait_for_timeout(400);ev("MODE='sample';document.getElementById('gate').style.display='none'");setrole('Payroll Specialist')
    pk=ev("monthsBack(2)[1].key")
    print('create',ev(f"FORMS.runnew({{period:'{pk}'}})"))
    rid=ev("RUNS()[0].id")
    print('calc w/o rules',ev(f"calcRun(RUNS().find(r=>r.id==='{rid}'))")[:90])
    # 2 test rules path
    ev("ACTS.testrules()")
    print('calc test',repr(ev(f"calcRun(RUNS().find(r=>r.id==='{rid}'))")),ev(f"RUNS()[0].status"),ev("RUNS()[0].results.length"),ev("RUNS()[0].test"))
    ev(f"RUNS()[0].exc.forEach(x=>x.sev='warn');RUNS()[0].status='under_review'")
    ev(f"ACTS.submit('{rid}')");print('status after submit(test)',ev("RUNS()[0].status"))
    # 3 real rules: delete test, draft real
    ev("db('rules',[],false).length=0")
    vals={'ins_min':'1000','ins_max':'10000','ins_emp':'10','ins_er':'20','tax_exempt':'15000','tax_insded':'yes'}
    for k,v in vals.items(): print(k,ev(f"FORMS.rnew({{key:'{k}',eff:'2020-01-01',val:'{v}',br:''}})"))
    print('br bad',ev("FORMS.rnew({key:'tax_brackets',eff:'2020-01-01',val:'',br:'40000,5\\n30000,10\\nopen,15'})"))
    print('br ok',ev("FORMS.rnew({key:'tax_brackets',eff:'2020-01-01',val:'',br:'40000,5\\n60000,10\\nopen,15'})"))
    ev("RULES().forEach(r=>ACTS.rsub(r.id))")
    print('statuses',ev("RULES().map(r=>r.status).join()"))
    setrole('Payroll Specialist');print('pay approve ->',ev("RULES().filter(r=>r.status==='review').map(r=>{ACTS.rapp(r.id);return FORMS.rappf({id:r.id,verifier:'x',verDate:'2026-10-01',srcUrl:'https://x.example.org',legalRef:'law'})}).slice(0,1)"))
    setrole('Finance Manager')
    print('fin approve',ev("RULES().map(r=>FORMS.rappf({id:r.id,verifier:'A. Tester',verDate:'2026-10-01',srcUrl:'bad',legalRef:'x'})).slice(0,1)"))
    print(ev("RULES().map(r=>FORMS.rappf({id:r.id,verifier:'A. Tester',verDate:'2026-10-01',srcUrl:'https://example.org/law',legalRef:'ref 1'}))"))
    print('rules approved',ev("RULES().filter(r=>r.status==='approved').length"))
    # run
    setrole('Payroll Specialist')
    ev("RUNS().length=0");ev(f"FORMS.runnew({{period:'{pk}'}})");rid=ev("RUNS()[0].id")
    ev(f"ACTS.calc('{rid}')");print('status',ev("RUNS()[0].status"),'exc',ev("RUNS()[0].exc.length"),'blocking',ev("RUNS()[0].exc.filter(x=>x.sev==='block').length"),'test',ev("RUNS()[0].test"))
    # exclude blockers
    ev("RUNS()[0].exc.filter(x=>x.sev==='block').forEach(x=>{RUNS()[0].excl[x.no]='test';});calcRun(RUNS()[0]);sv('runs')")
    print('after excl',ev("RUNS()[0].status"),ev("RUNS()[0].results.length"))
    # variance reasons
    print('var need',ev("varRows(RUNS()[0]).filter(v=>v.need&&!v.reason).length"))
    ev("varRows(RUNS()[0]).forEach(v=>{db('varr',{},false)[RUNS()[0].id+'|'+v.no]='ok'})")
    ev(f"ACTS.submit('{rid}')");print('after submit',ev("RUNS()[0].status"))
    # approvals inbox
    setrole('Finance Manager')
    print('canAct',ev(f"canAct(apprItems().find(i=>i.id==='P{rid}'))"))
    ev(f"decide('P{rid}','Approved','')");print('after approve',ev("RUNS()[0].status"))
    ev(f"ACTS.fin('{rid}')");pg.click('#cy');print('after fin',ev("RUNS()[0].status"))
    ev(f"ACTS.paid('{rid}')");pg.click('#cy');print('after paid',ev("RUNS()[0].status"))
    ev("RUNS()[0].results.length");no=ev("RUNS()[0].results[0].no")
    ev("page='pay_rec';draw()")
    print(ev(f"FORMS.recon({{id:'{rid}',bank:'1',why:''}})"))
    print(ev(f"FORMS.recon({{id:'{rid}',bank:String(tot(RUNS()[0],'net')/100),why:''}})"),ev("RUNS()[0].status"))
    ev("page='payslips';draw()");print('payslips rows',ev("document.querySelectorAll('#view tr').length"))
    r=ev("RUNS()[0].results[0]");print('sample result',r)
    # leave approval
    setrole('HR Director')
    n=ev("apprItems().filter(i=>i.type==='Leave request'&&!i.fin).length");print('leave items',n)
    it=ev("apprItems().find(i=>i.type==='Leave request'&&!i.fin).id")
    ev(f"decide('{it}','Approved','')");print('step1',ev(f"DEC()['{it}'].step"))
    print('audit entries',ev("db('audit',[],false).length"))
    print('errs',errs)
    b.close()

from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1300,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(600);ev=pg.evaluate
    ev("document.getElementById('gate')&&document.getElementById('gate').remove()")
    ev("MODE='mine';role='HR Director';draw()")
    def t(n,x):print(n,'=>',x)
    H="hire:'2025-01-05',dept:'Finance',pos:'X',n_basic:'10000'"
    t('no name',ev("FORMS.empnew({pos:'X',hire:'2025-01-05',dept:'Finance',n_basic:'1'})"))
    t('neg salary',ev("FORMS.empnew({name:'A',pos:'X',hire:'2025-01-05',dept:'Finance',n_basic:'-5'})"))
    t('bad nid',ev("FORMS.empnew({name:'A',pos:'X',hire:'2025-01-05',dept:'Finance',n_basic:'5',nid:'123'})"))
    t('fixed no end',ev("FORMS.empnew({name:'A',pos:'X',hire:'2025-01-05',dept:'Finance',n_basic:'5',type:'Fixed-term'})"))
    t('bad iban',ev("FORMS.empnew({name:'A',pos:'X',hire:'2025-01-05',dept:'Finance',n_basic:'5',iban:'EG12',bankname:'x'})"))
    t('ok',ev(f"FORMS.empnew({{name:'Neg A',{H},no:'N1',nid:'29501011234567'}})"))
    t('dup nid',ev(f"FORMS.empnew({{name:'Neg B',{H},no:'N2',nid:'29501011234567'}})"))
    t('dup no',ev(f"FORMS.empnew({{name:'Neg B',{H},no:'N1'}})"))
    t('hire in far future',ev(f"FORMS.empnew({{name:'Neg C',pos:'X',hire:'2031-01-05',dept:'Finance',n_basic:'5',no:'N3'}})"))
    print(ev("allEmps().map(e=>e.no+' '+e.hire)"))
    # leave negatives
    wd=lambda off:ev(f"(()=>{{let x=addD(T0,{off});while(isWk(x))x=addD(x,1);return iso(x)}})()")
    a=wd(5)
    t('lv end<start',ev(f"FORMS.lvman({{no:'N1',type:'Annual leave',start:'{a}',end:'{wd(2)}'}})"))
    t('lv > balance',ev(f"FORMS.lvman({{no:'N1',type:'Annual leave',start:'{a}',end:'2027-12-30'}})"))
    t('lv ok',ev(f"FORMS.lvman({{no:'N1',type:'Annual leave',start:'{a}',end:'{a}'}})"))
    t('lv overlap',ev(f"FORMS.lvman({{no:'N1',type:'Sick leave',start:'{a}',end:'{a}'}})"))
    t('lv before hire',ev("FORMS.lvman({no:'N1',type:'Annual leave',start:'2024-01-07',end:'2024-01-08'})"))
    t('lv bad emp',ev(f"FORMS.lvman({{no:'ZZ',type:'Annual leave',start:'{a}',end:'{a}'}})"))
    # loan negatives
    t('loan 0',ev("createLoan('N1',0,3,iso(T0),'')"));t('loan n=0',ev("createLoan('N1',1000,0,iso(T0),'')"));t('loan n=2.5',ev("createLoan('N1',1000,2.5,iso(T0),'')"))
    t('loan huge',ev("createLoan('N1',9999999,12,iso(T0),'')"));t('loan bad emp',ev("createLoan('ZZ',100,2,iso(T0),'')"))
    # role permission negatives
    for r in ['Employee','Payroll Specialist','Finance Manager','Department Manager','System Administrator']:
        ev(f"role='{r}'");t('empnew as '+r,ev(f"FORMS.empnew({{name:'P',{H},no:'P1'}})"));t('term2 as '+r,ev("FORMS.term2({no:'N1',last:iso(T0),note:'x'})"));t('lvedit as '+r,ev("FORMS.lvedit({no:'N1',t:'Annual leave',v:'5',reason:'x'})"))
    # approve own / wrong role
    ev("role='HR Director'");it=ev("(apprItems().find(i=>i.lr&&i.no==='N1')||{}).id")
    ev("role='Payroll Specialist'");t('PAY decide leave',ev(f"decide('{it}','Approved','');LR.filter(x=>x.no==='N1').map(x=>x.status)"))
    ev("role='Employee'");t('EMP decide leave',ev(f"decide('{it}','Approved','');LR.filter(x=>x.no==='N1').map(x=>x.status)"))
    # payroll gates
    ev("role='Payroll Specialist'");pk=ev("monthsBack(2)[1].key")
    t('run no rules calc',ev(f"(()=>{{FORMS.runnew({{period:'{pk}'}});const r=RUNS().slice(-1)[0];calcRun(r);return r.status+' '+r.exc.filter(x=>x.sev==='block').map(x=>x.msg.slice(0,50)).slice(0,3)}})()"))
    t('dup run',ev(f"FORMS.runnew({{period:'{pk}'}})"))
    t('future period',ev("FORMS.runnew({period:'2030-01'})"))
    rid=ev("RUNS().slice(-1)[0].id")
    t('submit under blocking',ev(f"ACTS.submit('{rid}');RUNS().slice(-1)[0].status"))
    ev("role='Finance Manager'");t('fin w/o approval',ev(f"ACTS.fin('{rid}');RUNS().slice(-1)[0].status"))
    ev("role='Payroll Specialist'");ev("ACTS.load26demo()");ev("document.querySelector('#confirm button.p')&&document.querySelector('#confirm button.p').click()")
    ev("RULES().filter(r=>r.demo).forEach(r=>ACTS.rver(r.id))")
    t('self-approve rule (same role)',ev("(()=>{const r=RULES().find(x=>x.status==='review');role='Payroll Specialist';ACTS.rapp(r.id);return $('#dd').textContent.slice(0,30)})()"))
    t('errs',errs);b.close()

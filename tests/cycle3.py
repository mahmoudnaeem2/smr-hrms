from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1300,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(600);ev=pg.evaluate
    ev("document.getElementById('gate')&&document.getElementById('gate').remove()")
    def t(n,x):print(n,'=>',x)
    ev("MODE='mine';role='HR Director';draw()")
    ev("FORMS.empnew({name:'Sal One',pos:'Acc',hire:'2025-01-05',dept:'Finance',n_basic:'10000',no:'S1',bankname:'CIB',bankacct:'123456789'})")
    eff=ev("iso(addD(T0,-10))")
    t('salReq',ev(f"FORMS.salReq({{no:'S1',eff:'{eff}',basic:'14000',reason:'raise'}})"))
    t('salary before',ev("salAt(empBy('S1'),iso(T0))&&salAt(empBy('S1'),iso(T0)).basic"))
    ids=ev("apprItems().filter(i=>i.no==='S1'&&/Salary/.test(i.type||'')).map(i=>i.id)");t('items',ids)
    for rl in ['HR Director','Finance Manager','HR Specialist','Payroll Specialist']:
        ev(f"role='{rl}'")
        for i in ev("apprItems().filter(i=>i.no==='S1'&&/Salary/.test(i.type||'')&&canAct(i)).map(i=>i.id)"):
            ev(f"decide('{i}','Approved','')");t('approved',rl)
    t('salary after',ev("salAt(empBy('S1'),iso(T0)).basic"))
    t('salary before eff',ev(f"salAt(empBy('S1'),iso(addD(new Date('{eff}T00:00:00'),-1))).basic"))
    t('emp basic',ev("empBy('S1').basic"))
    # persistence
    pg.reload();pg.wait_for_timeout(600)
    ev("document.getElementById('gate')&&document.getElementById('gate').remove()")
    t('after reload employees',ev("(MODE='mine',allEmps().map(e=>e.no))"))
    t('salary after reload',ev("salAt(empBy('S1'),iso(T0)).basic"))
    # employee view
    ev("MODE='mine';role='Employee';WSNO='S1';go('work')");t('employee work',ev("document.querySelector('#view').innerText.slice(0,200)"))
    for k in ['emp','comp','pay_reg','rep_pay','users','auditlog','loans','pay_proc']:
        t('Employee sees '+k,ev(f"canSee('{k}')"))
    t('emp salary visible to Dept Mgr?',ev("(role='Department Manager',typeof canSalV==='function'?canSalV():'n/a')"))
    t('errs',errs);b.close()

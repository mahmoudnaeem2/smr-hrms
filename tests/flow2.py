from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///tmp/full_new.html');pg.evaluate("MODE='sample';document.getElementById('gate').style.display='none'");pg.wait_for_timeout(300);ev=pg.evaluate
    ev("role='Employee';WSNO=allEmps()[3].no")
    no=ev("WSNO");before=ev("balances(empBy(WSNO))['Annual leave'].avail")
    d1=ev("iso(addD(T0,10))")
    ev(f"LR.push({{id:Date.now(),mode:MODE,no:WSNO,type:'Annual leave',start:'{d1}',end:'{d1}',days:1,note:'',status:'Pending'}});saveW()")
    print('pending avail',ev("balances(empBy(WSNO))['Annual leave'].avail"),'before',before)
    it=ev("apprItems().find(i=>i.lr&&i.no===WSNO).id");print('wfsteps',ev(f"wfOf('Leave request').steps"),ev(f"nextRole(apprItems().find(i=>i.id==='{it}'))"))
    ev("role='HR Director'");ev(f"decide('{it}','Approved','')")
    print('after step1',ev(f"apprItems().find(i=>i.id==='{it}').fin"),ev(f"nextRole(apprItems().find(i=>i.id==='{it}'))"))
    ev("role='HR Specialist'");ev(f"decide('{it}','Approved','')")
    print('after step2',ev(f"apprItems().find(i=>i.id==='{it}').fin"),ev("balances(empBy(WSNO))['Annual leave'].avail"))
    ev(f"role='HR Director';ACTS.apd('{it}')");print('drawer', ev("document.querySelector('#drawer').classList.contains('open')"))
    # contract renew & salary request
    print('renew form?',ev("typeof FORMS.renew"),ev("typeof FORMS.salReq"))
    print(errs);b.close()

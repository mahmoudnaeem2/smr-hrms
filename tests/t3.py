from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={"width":1300,"height":900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///tmp/full_new.html");pg.wait_for_timeout(800);ev=pg.evaluate
    ev("(()=>{const g=document.getElementById('gate');g&&g.remove()})()")
    ev("role='Payroll Specialist';draw()")
    ev("ACTS.load26demo()");ev("document.getElementById('cy').click()")
    print("rules",ev("RULES().filter(r=>r.demo).length"),"opt",ev("JSON.stringify(resolveOpt(iso(T0)))"))
    pk=ev("monthsBack(2)[1].key");fe=ev("monthsBack(2)[1].fullEnd");st=ev("monthsBack(2)[1].start")
    # pick two employees: one joiner mid-month, one with OT
    nos=ev("allEmps().filter(e=>e.status==='Active').slice(0,3).map(e=>e.no)")
    a,bb,c=nos
    ev(f"empSet('{a}',{{hire:'{pk}-16'}})")  # joiner mid month
    ev(f"empSet('{bb}',{{}})")
    # approved overtime for bb: 4h day + 2h night in the month; push approvals
    ev(f"db('otx',[]).push({{id:111,no:'{bb}',date:'{pk}-10',hours:4,kind:'Day',t:'{pk}-11'}},{{id:112,no:'{bb}',date:'{pk}-12',hours:2,kind:'Night',t:'{pk}-13'}})")
    ev("DEC()['U111']={step:9,log:[],final:'Approved'};DEC()['U112']={step:9,log:[],final:'Approved'}")
    ev(f"db('pinp',[]).push({{id:'i1',mode:MODE,no:'{c}',period:'{pk}',type:'Bonus',amount:1000,note:'t'}},{{id:'i2',mode:MODE,no:'{c}',period:'{pk}',type:'Loan installment',amount:500,note:'t'}})")
    print(ev(f"FORMS.runnew({{period:'{pk}'}})"))
    r=ev("RUNS().slice(-1)[0].id");print("calc",ev(f"calcRun(RUNS().find(x=>x.id=='{r}'))"))
    res=ev(f"RUNS().find(x=>x.id=='{r}').results.filter(x=>['{a}','{bb}','{c}'].includes(x.no)).map(x=>({{no:x.no,basic:x.basic,ot:x.ot,otH:x.otH,inp:x.inp,ded:x.ded,wd:x.wd,md:x.md,gross:x.gross,net:x.net}}))")
    print(json.dumps(res,indent=0))
    print("sal",ev(f"[salAt(empBy('{bb}'),'{fe}').basic]"))
    print("exc",ev(f"RUNS().find(x=>x.id=='{r}').exc.filter(x=>['{a}','{bb}','{c}'].includes(x.no)).map(x=>x.msg)"))
    for pgn in ["pay_proc","pay_inputs","pay_reg","payslips","comp","overtime","pay_comp"]:
        ev(f"go('{pgn}')");pg.wait_for_timeout(150)
    print(errs)
    # without opt rules: remove ot rules -> block
    ev("RULES().splice(0,RULES().length,...RULES().filter(r=>!r.key.startsWith('ot_')&&r.key!=='pr_div'))")
    print("noopt",ev(f"(calcRun(RUNS().find(x=>x.id=='{r}')),RUNS().find(x=>x.id=='{r}').exc.filter(x=>x.sev==='block').map(x=>x.msg.slice(0,60)))"))
    b.close()

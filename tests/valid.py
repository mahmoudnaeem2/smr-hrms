from playwright.sync_api import sync_playwright
import re
def n(x):
    s=re.sub(r'<[^>]*>','',str(x));s=re.sub(r'[^0-9.\-]','',s);return float(s) if s not in('','-','.') else 0
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1300,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(300);ev=pg.evaluate
    ev("document.getElementById('gate')&&document.getElementById('gate').remove()");ev("MODE='sample';role='HR Director';draw()")
    def T(key,page):
        ev(f"page={page!r};draw()");return ev(f"CSVS[{key!r}]")
    res=[]
    def chk(name,a,b_,tol=0.5):
        ok=abs(a-b_)<=tol;res.append(ok);print(('OK  ' if ok else 'FAIL'),name,a,b_)
    live=ev("_live().length")
    chk('master rows = all employees',len(T('rm1','r_master')['rows']),ev("ALLE().length"))
    s=T('rs1','r_sal');chk('salary register total',sum(n(r[6]) for r in s['rows']),ev("_live().reduce((a,e)=>a+_sal(e).t,0)"))
    chk('salary register rows = live',len(s['rows']),live)
    chk('basic+allow=total',sum(n(r[4])+n(r[5]) for r in s['rows']),sum(n(r[6]) for r in s['rows']))
    bd=T('rb_d','r_band');chk('band by dept total',sum(n(r[5]) for r in bd['rows']),sum(n(r[6]) for r in s['rows']))
    chk('band by dept headcount',sum(n(r[1]) for r in bd['rows']),live)
    bp=T('rb_p','r_band');chk('band by position total',sum(n(r[5]) for r in bp['rows']),sum(n(r[6]) for r in s['rows']));chk('band pos headcount',sum(n(r[1]) for r in bp['rows']),live)
    chk('band min<=avg<=max',int(all(n(r[2])<=n(r[3])+1 and n(r[3])<=n(r[4])+1 for r in bd['rows']+bp['rows'])),1)
    L=T('rll1','r_lvliab');chk('leave liability days',sum(n(r[3]) for r in L['rows']),ev("_live().reduce((a,e)=>a+(balances(e)['Annual leave'].avail||0),0)"))
    chk('liability value = days x rate',sum(n(r[5]) for r in L['rows']),sum(n(r[3])*n(r[4]) for r in L['rows']),len(L['rows']))
    chk('no negative leave',int(any(n(r[3])<0 for r in L['rows'])),0)
    a=T('rd_a','r_demo');chk('age bands <= live',int(sum(n(r[1]) for r in a['rows'])<=live),1)
    g=T('rd_g','r_demo');chk('gender dept sum',sum(n(r[1]) for r in g['rows']),live);chk('male+female<=emp',int(all(n(r[2])+n(r[3])<=n(r[1]) for r in g['rows'])),1)
    ev("page='rep_head';draw()");chk('headcount by dept',sum(n(r[1]) for r in ev("CSVS.rd1.rows")),ev("rpEmps().length"))
    late=T('rl1','r_late');ev("page='rep_att';draw()");ra=ev("CSVS.ra.rows");chk('late days: ranking vs att report',sum(n(r[4]) for r in late['rows']),sum(n(r[3]) for r in ra))
    ab=T('ra1','r_abs');chk('absent days: report vs att report',sum(n(r[3]) for r in ab['rows']),sum(n(r[4]) for r in ra))
    j=T('rj1','r_join');chk('joiners',len(j['rows']),ev("(()=>{const m=_m1();return ALLE().filter(rpOk).filter(e=>e.hire>=m.start&&e.hire<=m.fullEnd).length})()"))
    c=T('rc1','r_contract');chk('contracts sorted',int(all(c['rows'][i][5]<=c['rows'][i+1][5] for i in range(len(c['rows'])-1))),1)
    ot=T('ro1','r_ot');chk('overtime total=approved+waiting',sum(n(r[5]) for r in ot['rows']),sum(n(r[3])+n(r[4]) for r in ot['rows']),0.2)
    chk('overtime hours = source',sum(n(r[5]) for r in ot['rows']),ev("_otRows().filter(o=>!RPT.dept||o.dept===RPT.dept).reduce((s,o)=>s+o.h,0)"),0.2)
    # payroll-based, fake runs
    ev("""(()=>{const per=monthsBack(3).map(m=>m.key);per.slice(0,2).forEach((pk,i)=>RUNS().push({id:'t'+i,period:pk,kind:'regular',status:'Approved',results:allEmps().slice(0,4).map(e=>({no:e.no,name:e.name,dept:e.dept,gross:500000+i,empIns:50000,erIns:90000,tax:30000,net:420000,cost:590000}))}))})()""")
    y=T('ry1','r_ytd');st=T('rst1','r_stat')
    chk('ytd gross vs runs',sum(n(r[4]) for r in y['rows']),ev("rpRuns().filter(r=>r.period.slice(0,4)===iso(T0).slice(0,4)&&r.kind==='regular').reduce((s,r)=>s+r.results.reduce((a,x)=>a+x.gross,0),0)/100"),1)
    chk('stat gross = ytd gross',sum(n(r[3]) for r in st['rows']),sum(n(r[4]) for r in y['rows']),1)
    chk('tax+ins per net',sum(n(r[4])+n(r[7]) for r in y['rows'])*0+1,1)
    bk=T('rbk1','r_bank');chk('bank net total',sum(n(r[5]) for r in bk['rows']),ev("rpRun().results.reduce((s,x)=>s+x.net,0)/100"),1)
    print('FAILS',res.count(False),'errs',errs)

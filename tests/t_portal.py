from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1400,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto('file:///tmp/full_new.html');pg.evaluate("MODE='sample';document.getElementById('gate').style.display='none'");pg.wait_for_timeout(300);ev=pg.evaluate
    ev("role='HR Director';draw()")
    no=ev("allEmps()[3].no");print('emp',no)
    # HR: loan + warning
    print('loan err:',repr(ev(f"createLoan('{no}',3000,3,monthsFwd(1)[0].key,'test')")))
    print('pinp loans',ev("db('pinp',[]).filter(x=>x.type==='Loan installment').length"))
    print('warn',ev(f"FORMS.wnnew({{no:'{no}',level:'Written warning',date:iso(T0),reason:'Late 3 times'}})"))
    for pgk in ['loans','warns','hr_req']:
        ev(f"page='{pgk}';draw()");print(pgk,'ok',pg.locator('#view').inner_text()[:60].replace('\n',' '))
    ev(f"role='Employee';WSNO='{no}';page='work';draw()")
    for t in ['ov','ps','dc','wn','ln','ct','to','at','rq','pf']:
        ev(f"ACTS.pt('{t}')");txt=pg.locator('#view').inner_text();print(t,len(txt),txt[txt.find('New Request')+11:][:90].replace('\n',' | '))
    ev("ACTS.pt('rq')")
    print('tiles',pg.locator('.hqc').count())
    # submit each type
    tests={
     'trip':{'f_tt':'Domestic','f_dest':'Alex','f_from':'2026-11-10','f_to':'2026-11-12','f_purpose':'Client'},
     'tickets':{'f_for':'Myself','f_route':'CAI-DXB','f_date':'2026-12-01','f_ret':''},
     'visa':{'f_country':'UAE','f_from':'2026-12-01','f_to':'2026-12-05','f_lang':'English'},
     'cert':{'f_to':'Bank','f_purpose':'Bank','f_lang':'English','f_sal':'Include salary'},
     'sassign':{'f_bank':'CIB','f_purpose':'Loan'},'sclear':{'f_bank':'CIB','f_ref':''},
     'defl':{'f_to':'Whom','f_lang':'Arabic'},'slip':{'f_n':'3'},
     'resign':{'f_last':'2027-01-31','f_reason':''},
     'chg':{'f_what':'Job position','f_value':'Senior','f_reason':'Promotion'},
     'data':{'f_field':'mobile','f_value':'+201001234567'},
     'adv':{'f_amount':'500','f_month':ev("monthsFwd(1)[0].key"),'f_reason':'x'},
     'loan':{'f_amount':'6000','f_n':'6','f_month':ev("monthsFwd(1)[0].key"),'f_reason':'x'},
     'perm':{'f_date':'2026-11-02','f_from':'10:00','f_to':'12:00','f_reason':'x'},
     'asset':{'f_item':'Laptop','f_reason':'x'},'train':{'f_course':'PMP','f_reason':'x'},
     'exp':{'f_to':'','f_lang':'English'},'ask':{'f_subject':'Q','f_details':'d'},'other':{'f_subject':'Q','f_details':'d'}}
    import json
    for k,v in tests.items():
        v['type']=k;print(k,repr(ev(f"FORMS.hrqnew({json.dumps(v)})")))
    # bank needs proof
    print('bank noproof',ev("FORMS.hrqnew({type:'bank',f_bankname:'NBE',f_bankacct:'1234567890',f_iban:''})"))
    ev(f"FILES().push({{id:'Ft',ctx:'hrqform|{no}',name:'a.pdf',size:5,type:'pdf',by:'Employee',t:iso(T0)}})")
    print('bank',repr(ev("FORMS.hrqnew({type:'bank',f_bankname:'NBE',f_bankacct:'1234567890',f_iban:''})")))
    print('reqs',ev("HQL().length"))
    ev("page='work';draw()");pg.screenshot(path='/tmp/p_rq.png',full_page=False)
    # HR decides all
    ev("role='HR Director';page='hr_req';draw()")
    ids=ev("HQL().map(r=>r.id)")
    for i in ids:
        ev(f"ACTS.hqr('{i}')");kind=ev(f"(HQT(HQL().find(r=>r.id==='{i}').type)).kind")
        dec='Approve' if kind=='dec' else 'Complete (answered or document issued)'
        r=ev(f"FORMS.hrqdec({{id:'{i}',dec:'{dec}',resp:'Done'}})")
        if r: print('dec err',i,r)
    print('statuses',ev("HQL().map(r=>r.type+':'+r.status).join(' ')"))
    print('loans now',ev("LOANS().length"),'pinp',ev("db('pinp',[]).filter(x=>x.type==='Loan installment').length"),'adv',ev("db('pinp',[]).filter(x=>x.type==='Salary advance').length"))
    print('bank applied',ev(f"empBy('{no}').bankname"),ev(f"empBy('{no}').bankacct"),'offb',ev("db('offb',[]).length"))
    ev(f"role='Employee';WSNO='{no}';page='work';draw()")
    for t in ['ov','ln','wn','dc']:
        ev(f"ACTS.pt('{t}')");print(t,pg.locator('#view').inner_text()[200:420].replace('\n',' | '))
    ev("ACTS.pt('ov')");pg.screenshot(path='/tmp/p_ov.png')
    ev(f"ACTS.wn_ack(db('warns',[])[0].id)");print('ack',ev("db('warns',[])[0].ack"))
    ev("page='myprofile';draw()");print('myprofile tab',pg.locator('.ptab.on').inner_text())
    print('ERR',errs)

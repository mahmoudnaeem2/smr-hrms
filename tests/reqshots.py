from playwright.sync_api import sync_playwright
from PIL import Image
import sys
W=int(sys.argv[1]);H=int(sys.argv[2])
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':W,'height':H})
    pg.goto('file:///tmp/full_new.html');pg.wait_for_timeout(300);ev=pg.evaluate
    ev("document.getElementById('gate')&&document.getElementById('gate').remove()")
    ev("MODE='mine';role='Employee';E.push({no:'E-9',name:'Test User',dept:'Finance',pos:'Accountant',type:'Full-time',status:'Active',hire:'2024-01-01',basic:10000,allow:0,loc:'Head Office',mgr:''});WSNO='E-9';page='work';draw()");pg.wait_for_timeout(300)
    pg.click('[data-act="pt:rq"]')
    keys=ev("[...document.querySelectorAll('[data-act^=\"hqt:\"]')].map(x=>x.dataset.act.slice(4)).filter((v,i,a)=>a.indexOf(v)==i)")
    ims=[]
    for k in keys:
        pg.click(f'[data-act="hqt:{k}"]:not(.hqm *)');pg.wait_for_timeout(700)
        f=f'/tmp/rq_{k}.png';pg.screenshot(path=f);ims.append(f)
        pg.keyboard.press('Escape');pg.wait_for_timeout(100)
    cols=5;w,h=W//2,H//2
    m=Image.new('RGB',(cols*w,((len(ims)+cols-1)//cols)*h),'white')
    for i,f in enumerate(ims):
        m.paste(Image.open(f).resize((w,h)),((i%cols)*w,(i//cols)*h))
    m.save(f'/tmp/rq_montage_{W}.png')

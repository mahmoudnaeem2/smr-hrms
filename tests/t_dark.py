from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    c=b.new_context(viewport={'width':390,'height':800},color_scheme='dark',is_mobile=True,has_touch=True);pg=c.new_page()
    pg.goto('file:///tmp/full_cloud.html');pg.wait_for_selector('#cgf')
    pg.fill('#cge','khaled.ashry@savills.me');pg.fill('#cgp','abc12345')
    print(pg.evaluate("[getComputedStyle(document.querySelector('#cge')).color,getComputedStyle(document.querySelector('#cge')).webkitTextFillColor,getComputedStyle(document.querySelector('#cge')).backgroundColor]"))
    pg.screenshot(path='/tmp/login_dark.png')

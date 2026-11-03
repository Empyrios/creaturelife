"""Real Chromium browser smoke checks using in-memory ES module loading.
No external network or localhost navigation, so this does not verify GitHub Pages or offline SW.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64
root=Path(__file__).resolve().parents[1]
def dataurl(text):return 'data:text/javascript;base64,'+base64.b64encode(text.encode()).decode()
core=dataurl((root/'site/core.mjs').read_text())
app=(root/'site/app.mjs').read_text().replace("'./core.mjs'",repr(core))
index=(root/'site/index.html').read_text()
index=index.replace('<link rel="manifest" href="./manifest.webmanifest"/>','')
index=index.replace('<link rel="stylesheet" href="./styles.css"/>','<style>'+(root/'site/styles.css').read_text()+'</style>')
index=index.replace('<link rel="icon" type="image/svg+xml" href="./icons/icon.svg"/>','')
shim="""<script>window.__testStore={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return Object.prototype.hasOwnProperty.call(window.__testStore,k)?window.__testStore[k]:null},setItem(k,v){window.__testStore[k]=String(v)},removeItem(k){delete window.__testStore[k]}}});</script>"""
index=index.replace('<script type="module" src="./app.mjs"></script>',shim+'<script type="module">'+app+'</script>')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for mode,width,height in [('mobile',390,844),('desktop',1440,900)]:
  context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,accept_downloads=True)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(index,wait_until='load')
  page.locator('.hero').wait_for(timeout=12000)
  assert 'CreatureLife' in page.title()
  assert page.get_by_text('Good to see you again').count()==1
  assert page.locator('.hero .creature-art').count()==1
  page.screenshot(path=str(root/f'preview-{mode}.png'),full_page=True)
  # Care actions and local persistence
  before=page.evaluate("JSON.parse(localStorage.getItem('empyrios-creaturelife-v1') || '{}')")
  page.locator('.action-grid [data-action="feed"]').click()
  after=page.evaluate("JSON.parse(localStorage.getItem('empyrios-creaturelife-v1'))")
  assert after['resources']['berries']==before.get('resources',{}).get('berries',14)-2
  assert after['stats']['fed']==1
  nav_prefix='.mobile-nav' if mode=='mobile' else '.side-nav'
  page.locator(f'{nav_prefix} [data-view="creatures"]').click()
  assert page.locator('.creature-card').count()==1
  page.locator('#rename-input').fill('Moss Bean')
  page.locator('form[data-form="rename"] button[type="submit"]').click()
  assert page.get_by_role('heading',name='Moss Bean').count()>=1
  page.locator('#biome-select').select_option('grove')
  page.locator('form[data-form="move"] button[type="submit"]').click()
  assert page.get_by_role('heading',name='Moss Bean').count()>=1
  page.locator(f'{nav_prefix} [data-view="explore"]').click()
  assert page.get_by_role('heading',name='Expeditions').count()==1
  page.locator('.biome-card [data-action="explore"]').first.click()
  assert page.get_by_text('Expedition complete.',exact=False).count()>=1
  page.locator(f'{nav_prefix} [data-view="genetics"]').click()
  assert page.get_by_role('heading',name='Genetics & lineage').count()==1
  assert page.locator('.genome-row').count()==6
  page.locator(f'{nav_prefix} [data-view="journal"]').click()
  assert page.get_by_role('heading',name='The journal').count()==1
  with page.expect_download() as record: page.locator('[data-action="export"]').click()
  assert record.value.suggested_filename.startswith('creaturelife-day-')
  page.locator(f'{nav_prefix} [data-view="home"]').click()
  page.locator('.next-day [data-action="day"]').click()
  assert page.get_by_text('Day 2',exact=False).count()>=1
  dimension=page.evaluate('({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth})')
  assert dimension['scroll'] <= dimension['viewport']+1,dimension
  assert not errors,errors
  print(f'{mode} PASS, browser errors={len(errors)}, dimensions={dimension}')
  context.close()
 browser.close()

"""Browser smoke/regression checks via Chrome DevTools (requires websocket-client).
Start local server :8765 and a disposable headless Chrome with debugging :9222.
"""
import json, time, urllib.request, websocket, base64
page = next(p for p in json.load(urllib.request.urlopen('http://127.0.0.1:9222/json')) if p['type']=='page')
ws=websocket.create_connection(page['webSocketDebuggerUrl']); serial=0; errors=[]
def call(method, params=None):
    global serial
    serial+=1; ws.send(json.dumps({'id':serial,'method':method,'params':params or {}}))
    while True:
        msg=json.loads(ws.recv())
        if msg.get('method')=='Runtime.exceptionThrown': errors.append(msg['params'])
        if msg.get('id')==serial:
            if 'error' in msg: raise RuntimeError(msg)
            return msg.get('result',{})
def js(code):
    r=call('Runtime.evaluate',{'expression':code,'returnByValue':True,'awaitPromise':True})
    if 'exceptionDetails' in r: raise AssertionError(r)
    return r.get('result',{}).get('value')
def check(code, label):
    assert js(code), label
    print('PASS',label)
def click(selector):
    assert js(f"!!document.querySelector({json.dumps(selector)})"), selector
    js(f"document.querySelector({json.dumps(selector)}).click()")
def choice(target): click('[data-choice="'+target+'"]')
def travel(target): click('[data-travel="'+target+'"]')
def reload():
    call('Page.reload'); time.sleep(.25)
def start():
    js('localStorage.clear()'); reload(); choice('intro'); choice('new')
def supplies():
    travel('workshop'); choice('letter'); travel('orchard'); choice('oil')
call('Runtime.enable'); call('Page.enable')
call('Page.navigate',{'url':'http://127.0.0.1:8765/games/story/last-lantern.html'}); time.sleep(.4)
start()
check("document.querySelector('#world').dataset.place === 'square'",'opening and start')
travel('tower'); check("!document.querySelector('[data-choice=dawn]')",'tower supplies gate')
supplies(); travel('tower')
check("document.querySelector('#prose').textContent.includes('Someone is awake')",'unmet Mara passage')
choice('dawn'); check("document.querySelector('#endingCard').hidden === false",'beacon ending and recap')
reload(); choice('continue'); check("document.querySelector('#world').dataset.place==='dawn'",'ending reload')
choice('new'); supplies(); travel('dock'); choice('lens'); choice('song'); travel('tower'); choice('home')
check("document.querySelector('#endingsCount').textContent==='2 / 2 endings discovered'",'both endings tracked')
choice('new'); travel('workshop'); click('#exploration button'); choice('workshop')
check("JSON.parse(localStorage.getItem('timeflo-last-lantern-v2')).keepsake==='carry'",'keepsake decision persists')
travel('square'); travel('workshop'); check("document.querySelector('#prose').textContent.includes('touch the button')",'revisit consequence')
click('#satchel button'); check("document.querySelector('#itemDescription').textContent.includes('hinge')",'inventory examination')
for place in ['square','orchard','dock','tower']:
    travel(place); click('#exploration button'); choice(place)
check("JSON.parse(localStorage.getItem('timeflo-last-lantern-v2')).memories.length===5",'all optional memories')
old=js("localStorage.getItem('timeflo-last-lantern-v2')")
click('#endingCollection button'); check("document.querySelector('[data-choice=archive-back]')!==null",'ending archive')
choice('archive-back'); check("document.querySelector('#world').dataset.place==='tower'",'archive returns to journey')
assert js("localStorage.getItem('timeflo-last-lantern-v2')")==old
print('PASS archive preserves save')
click('#restart'); choice('cancel'); check("document.querySelector('#world').dataset.place==='tower'",'restart cancellation')
reload(); choice('restart'); choice('cancel'); check("document.querySelector('[data-choice=continue]')!==null",'opening replacement confirmation')
choice('continue'); travel('square')
call('Input.dispatchKeyEvent',{'type':'keyDown','key':'1','code':'Digit1'}); call('Input.dispatchKeyEvent',{'type':'keyUp','key':'1','code':'Digit1'})
check("document.querySelector('#world').dataset.place==='workshop'",'number shortcut')
click('#motion'); check("getComputedStyle(document.querySelector('.lantern-glow')).animationName==='none'",'stillness setting')
call('Emulation.setEmulatedMedia',{'features':[{'name':'prefers-reduced-motion','value':'reduce'}]})
click('#motion'); check("getComputedStyle(document.querySelector('.lantern-glow')).animationName==='none'",'system reduced motion')
call('Emulation.setEmulatedMedia',{'features':[]})
for width,height in [(1280,900),(390,844),(320,640),(844,390)]:
    call('Emulation.setDeviceMetricsOverride',{'width':width,'height':height,'deviceScaleFactor':1,'mobile':width<900})
    check('document.documentElement.scrollWidth<=innerWidth',f'no horizontal overflow {width}x{height}')
    if width==1280:
        data=call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':True})['data']
        open('/tmp/lantern-desktop.png','wb').write(base64.b64decode(data))
call('Emulation.clearDeviceMetricsOverride')
# Migration leaves the original intact.
legacy={'version':1,'node':'song','items':['song'],'notes':['Helped Mara.'],'visited':['square','dock'],'ended':False}
js('localStorage.clear(); localStorage.setItem("timeflo-last-lantern-v1",'+json.dumps(json.dumps(legacy))+')'); reload(); choice('continue'); travel('square')
check("JSON.parse(localStorage.getItem('timeflo-last-lantern-v2')).version===2 && JSON.parse(localStorage.getItem('timeflo-last-lantern-v1')).version===1",'v1 migration preserves original')
js("localStorage.setItem('timeflo-last-lantern-v2','{broken'); localStorage.setItem('timeflo-last-lantern-endings-v1','[\"home\"]')"); reload()
check("!document.querySelector('#recovery').hidden && document.querySelector('#endingsCount').textContent.startsWith('1')",'corrupt journey preserves ending collection')
choice('new'); travel('dock'); check("localStorage.getItem('timeflo-last-lantern-v2')==='{broken'",'corrupt save not overwritten')
# Impossible ending rejected.
legacy['node']='home'; legacy['items']=[]
js('localStorage.clear();localStorage.setItem("timeflo-last-lantern-v2",'+json.dumps(json.dumps(legacy))+')'); reload()
check("!document.querySelector('[data-choice=continue]')",'impossible saved ending rejected')
# Storage denied before initialization, including reads.
script=call('Page.addScriptToEvaluateOnNewDocument',{'source':"Storage.prototype.getItem=Storage.prototype.setItem=function(){throw new Error('denied')}"})['identifier']
reload(); choice('intro'); choice('new'); travel('dock'); check("document.querySelector('#saveStatus').textContent.includes('unavailable')",'storage denial still playable')
call('Page.removeScriptToEvaluateOnNewDocument',{'identifier':script})
js('void 0')
# Exercise every ordering of the two required supplies and optional song/lens flags.
js('localStorage.clear()'); reload()
for order in [('workshop','orchard'),('orchard','workshop')]:
    for song,lens in [(False,False),(True,False),(False,True),(True,True)]:
        start()
        for place in order:
            travel(place); choice('letter' if place=='workshop' else 'oil')
        if song: travel('dock'); choice('song')
        if lens: travel('dock'); choice('lens')
        travel('tower'); choice('dawn')
        check("document.querySelector('#world').dataset.place==='dawn'",f'beacon route {order[0]} song={song} lens={lens}')
        if song:
            choice('new'); supplies(); travel('dock'); choice('song')
            if lens: travel('dock'); choice('lens')
            travel('tower'); choice('home')
            check("document.querySelector('#world').dataset.place==='home'",f'village variant lens={lens}')
# The other keepsake decision, plus its ending consequence.
start(); travel('workshop'); click('#exploration button')
js("document.querySelectorAll('[data-choice=workshop]')[1].click()")
supplies(); travel('tower'); choice('dawn')
check("document.querySelector('#endingCard').textContent.includes('a child finds the button')",'leave keepsake ending consequence')
# Touch emulation and focus-visible keyboard navigation.
start(); call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
call('Emulation.setTouchEmulationEnabled',{'enabled':True})
js("document.querySelector('[data-choice=workshop]').scrollIntoView({block:'center'})")
rect=js("(()=>{const r=document.querySelector('[data-choice=workshop]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
call('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[rect]}); call('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]}); time.sleep(.1)
check("document.querySelector('#world').dataset.place==='workshop'",'touch choice')
call('Input.dispatchKeyEvent',{'type':'keyDown','key':'Tab','code':'Tab'}); call('Input.dispatchKeyEvent',{'type':'keyUp','key':'Tab','code':'Tab'})
check("document.activeElement.tagName==='BUTTON' && document.activeElement.matches(':focus-visible')",'visible keyboard focus')
call('Emulation.setTouchEmulationEnabled',{'enabled':False}); call('Emulation.clearDeviceMetricsOverride')
# Observe the real audio graph; no sound files or mocked audio methods.
instrument=call('Page.addScriptToEvaluateOnNewDocument',{'source':"const NativeAudio=window.AudioContext; window.AudioContext=class extends NativeAudio { constructor(...a){super(...a); window.testAudio=this;} createGain(){const g=super.createGain(); if(!window.testMaster) window.testMaster=g; return g;} };"})['identifier']
js('localStorage.clear()'); reload()
check("!window.testAudio",'audio stays uninitialized before opt-in')
call('Runtime.evaluate',{'expression':"document.querySelector('#sound').click()",'userGesture':True}); time.sleep(.5)
check("document.querySelector('#sound').getAttribute('aria-pressed')==='true' && testAudio.state==='running'",'audio enables after interaction')
js("window.meter=testAudio.createAnalyser();testMaster.connect(meter)"); time.sleep(.1)
check("(()=>{const a=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(a);return a.some(v=>Math.abs(v)>.00001)})()",'synth produces nonzero audio samples')
call('Runtime.evaluate',{'expression':"document.querySelector('#sound').click()",'userGesture':True}); time.sleep(2)
check("testMaster.gain.value<.001 && document.querySelector('#sound').getAttribute('aria-pressed')==='false'",'audio mute fades to silence')
call('Page.removeScriptToEvaluateOnNewDocument',{'identifier':instrument})
unsupported=call('Page.addScriptToEvaluateOnNewDocument',{'source':"window.AudioContext=window.webkitAudioContext=undefined"})['identifier']
reload(); click('#sound'); check("document.querySelector('#sound').textContent==='Sound unavailable'",'unsupported audio fallback')
call('Page.removeScriptToEvaluateOnNewDocument',{'identifier':unsupported})
assert not errors, errors
print('PASS no uncaught browser exceptions')
ws.close()

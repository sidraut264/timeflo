/* Run against a local server on :8765 and a disposable Chrome on :9222.
   Uses the ws dependency already installed by the chess project. */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const WebSocket = require('../chess2/node_modules/ws');
const delay = ms => new Promise(r => setTimeout(r, ms));
async function main() {
  const pages = await (await fetch('http://127.0.0.1:9222/json')).json();
  const page = pages.find(p => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  let id = 0; const pending = new Map(), errors = [];
  ws.on('message', raw => { const msg = JSON.parse(raw); if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params); if (msg.id) { const p = pending.get(msg.id); if (p) { pending.delete(msg.id); msg.error ? p.reject(msg.error) : p.resolve(msg.result); } } });
  function call(method, params = {}) { return new Promise((resolve, reject) => { const request = ++id; pending.set(request, { resolve, reject }); ws.send(JSON.stringify({ id: request, method, params })); }); }
  async function js(expression) { const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; }
  const check = async (expr, name) => { assert(await js(expr), name); console.log('PASS', name); };
  const click = selector => js(`document.querySelector(${JSON.stringify(selector)}).click()`);
  async function key(code, down = true) { await call('Input.dispatchKeyEvent', { type: down ? 'keyDown' : 'keyUp', code, key: code === 'Space' ? ' ' : code.replace('Key', ''), windowsVirtualKeyCode: code === 'Space' ? 32 : code.replace('Key', '').charCodeAt(0) }); }
  async function until(expr, timeout = 20000) { const end = Date.now() + timeout; while (Date.now() < end) { if (await js(expr)) return; await delay(80); } throw Error('Timed out: ' + expr + '\n' + JSON.stringify(errors)); }
  if (process.argv.includes('--snapshot')) { console.log(await js('cloudHop.snapshot()')); ws.close(); return; }
  await call('Runtime.enable'); await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: 'http://127.0.0.1:8765/games/zen/cloud-hop/' });
  await until('!!window.cloudHop');
  await check("cloudHop.snapshot().state==='intro' && !document.getElementById('playButton').disabled", '3D world loads and can start');
  await check('cloudHop.snapshot().rendering.triangles>1000', 'actual 3D geometry is rendered');
  await delay(900);
  fs.writeFileSync('/tmp/cloud-hop-desktop.png', Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  await click('#helpButton'); await check("!document.getElementById('help').hidden", 'instructions open'); await click('#helpDone');
  await click('#playButton'); await check("cloudHop.snapshot().state==='playing'", 'play button starts game');
  const before = await js('cloudHop.snapshot().position.z');
  await key('KeyW'); await delay(450); await key('KeyW', false);
  assert((await js('cloudHop.snapshot().position.z')) < before - .3, 'W moves forward'); console.log('PASS keyboard movement');
  await key('Space'); await key('Space', false); await until('cloudHop.snapshot().jumpCount===1');
  await key('Space'); await key('Space', false); await until('cloudHop.snapshot().jumpCount===2'); console.log('PASS double jump');
  await key('KeyP'); await key('KeyP', false); const paused = await js('cloudHop.snapshot().elapsed');
  await delay(350); await check(`cloudHop.snapshot().state==='paused' && cloudHop.snapshot().elapsed===${paused}`, 'pause freezes physics and timer');
  await click('#resumeButton'); await key('KeyR'); await key('KeyR', false);
  await check('cloudHop.snapshot().grounded===0 && cloudHop.snapshot().falls===1', 'return to checkpoint');
  const originalSeed = await js('cloudHop.snapshot().seed');
  await click('#shuffleButton'); await check(`cloudHop.snapshot().seed!==${originalSeed} && cloudHop.snapshot().elapsed<1 && cloudHop.snapshot().collected===0`, 'new world resets course and counters');
  await key('KeyD'); await until('cloudHop.snapshot().falls>0', 12000); await key('KeyD', false);
  await check('cloudHop.snapshot().position.y>-9', 'falling automatically respawns');
  await key('KeyP'); await key('KeyP', false); await click('#retryButton');
  await check('cloudHop.snapshot().falls===0 && cloudHop.snapshot().checkpoint===0', 'retry resets the current world');
  await click('#soundButton'); await check("document.getElementById('soundButton').getAttribute('aria-pressed')==='true'", 'sound toggle works');
  await click('#helpButton'); const helpTime = await js('cloudHop.snapshot().elapsed'); await delay(200);
  await check(`cloudHop.snapshot().state==='help' && cloudHop.snapshot().elapsed===${helpTime}`, 'instructions pause active game'); await click('#helpDone');
  // Drive the real keyboard controls through an entire generated course.
  await key('KeyP'); await key('KeyP', false); await click('#retryButton');
  const journey = await js(`(async()=>{
    const held=new Set(); let lastLaunch=-1, maxCheckpoint=0, airborneTarget=1;
    const set=(code,on)=>{if(on&&!held.has(code)){held.add(code);window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));}else if(!on&&held.has(code)){held.delete(code);window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));}};
    const jump=()=>{window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space',bubbles:true}));};
    const stop=()=>{for(const code of [...held])set(code,false);};
    const deadline=performance.now()+110000;
    while(performance.now()<deadline){
      const s=cloudHop.snapshot(); maxCheckpoint=Math.max(maxCheckpoint,s.checkpoint);
      if(s.state==='won'){stop();return {...s,maxCheckpoint};}
      if(s.state!=='playing'){stop();return s;}
      let target;
      if(s.grounded!==null){
        const current=s.grounded;
        if(current===s.platforms.length-1)target={x:s.platforms[current].x,z:s.platforms[current].z-.45};
        else{
          const p=s.platforms[current],next=s.platforms[current+1]; airborneTarget=current+1;
          target={x:next.x,z:p.z-p.d/2+.5};
          if(s.position.z<=p.z-p.d/2+1.05&&s.elapsed-lastLaunch>.3){jump();lastLaunch=s.elapsed;}
        }
      }else{
        const next=s.platforms[airborneTarget]; target={x:next.x,z:next.z+.4};
        if(s.jumpCount===1&&s.velocity.y<0&&Math.abs(target.z-s.position.z)>1.4)jump();
      }
      const dx=target.x-s.position.x,dz=target.z-s.position.z;
      set('KeyA',dx<-.18);set('KeyD',dx>.18);set('KeyW',dz<-.23);set('KeyS',dz>.23);
      await new Promise(r=>setTimeout(r,35));
    }
    stop();return {...cloudHop.snapshot(),timeout:true,maxCheckpoint};
  })()`);
  assert.equal(journey.state,'won',JSON.stringify(journey));
  assert(journey.maxCheckpoint>=10,'checkpoint flags are activated');
  assert(journey.collected>5,'gems collected on real crossings');
  console.log('PASS complete playable course, gems, checkpoints, and portal');
  await click('#resumeButton');
  await check("cloudHop.snapshot().level===2 && document.getElementById('worldLabel').textContent==='Mint meadows' && cloudHop.snapshot().state==='playing'",'next level generates a new world and theme');
  await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await call('Page.reload'); await until('!!window.cloudHop');
  await check('document.documentElement.scrollWidth<=innerWidth', 'mobile layout has no horizontal overflow');
  await click('#playButton'); await check("!document.getElementById('touchControls').hidden", 'touch controls are visible on mobile');
  await js("document.getElementById('touchJump').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7}))");
  await until('cloudHop.snapshot().jumpCount===1'); console.log('PASS mobile jump');
  await delay(350);
  fs.writeFileSync('/tmp/cloud-hop-mobile.png', Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  assert.equal(errors.length, 0, JSON.stringify(errors)); console.log('PASS no JavaScript exceptions');
  await call('Emulation.setTouchEmulationEnabled', { enabled: false });
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  ws.close();
}
main().catch(e => { console.error(e); process.exit(1); });

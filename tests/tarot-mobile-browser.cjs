// Requires local server on :8766 and disposable Chrome on :9222. No API quota used.
const fs=require('node:fs'),assert=require('node:assert/strict'),WebSocket=require('../chess2/node_modules/ws');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const pages=await(await fetch('http://127.0.0.1:9222/json')).json();
 const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise(r=>ws.once('open',r));let id=0;const pending=new Map(),errors=[];
 ws.on('message',raw=>{const m=JSON.parse(raw);if(m.method==='Runtime.exceptionThrown')errors.push(m.params);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}));});
 const js=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const check=async(expr,label)=>{assert(await js(expr),label);console.log('PASS',label);};
 const until=async expr=>{for(let i=0;i<100;i++){if(await js(expr))return;await delay(50);}throw Error('Timed out: '+expr);};
 const tap=async selector=>{const p=await js(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'nearest',inline:'nearest'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await delay(80);await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(80);};
 const viewport=(width,height)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
 const shot=async name=>{await delay(500);fs.writeFileSync('/tmp/tarot-new-'+name+'.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));};
 await call('Runtime.enable');await call('Page.enable');await viewport(390,844);await call('Emulation.setTouchEmulationEnabled',{enabled:true});
 await call('Page.navigate',{url:'http://127.0.0.1:8766/tarot-and-tea.html'});
 await until("document.getElementById('heroDeck')?.children.length===3");
 await js(`window.requestBodies=[];window.chatMode='success';window.fetch=async(url,options)=>{
  const body=JSON.parse(options.body);window.requestBodies.push(body);
  if(body.mode==='chat'){
   if(window.chatMode==='fail')return {ok:false};
   if(window.chatMode==='pending')return new Promise(resolve=>window.finishChat=()=>resolve({ok:true,json:async()=>({reply:'A stale reply',source:'gemini'})}));
   await new Promise(r=>setTimeout(r,150));
   return {ok:true,json:async()=>({reply:'The Fool is asking for one brave step. You are asking for a 47-slide guarantee. Put the presentation down and send the application. <img src=x onerror=alert(1)>',source:'gemini'})};
  }
  await new Promise(r=>setTimeout(r,300));
  return {ok:true,json:async()=>({source:'gemini',interpretations:body.drawnCards.map((d,cardIndex)=>({cardIndex,oracleTake:'You keep calling it a plot twist when it is the same episode. '+d.card.name+' invites you to stop rehearsing and take one small step.'})),cosmicVerdict:'The cards see potential. Your calendar sees twelve tabs and no decisions. Pick one thing and give it ten honest minutes.',cosmicDare:'Send the message you have rewritten six times. Keep it honest and under three sentences.'})};
 };`);
 await shot('setup');await tap('[data-cat="career"]');await tap('#questionChips button');
 await check("document.getElementById('qInput').value.includes('career')",'question chips match chosen topic');
 await tap('[data-spice="hot"]');await check("appState.spice==='hot'",'extra hot tone selected');await shot('setup-controls');
 await tap('.draw-cta');await check("appState.stage==='draw' && document.querySelectorAll('#fanRow button').length===12",'12 tappable cards dealt');await shot('draw');
 await tap('#fanRow button');await tap('#shuffleBtn');await check('!appState.fanCards.some(d=>d.card.id===appState.drawnCards[0].card.id)','reshuffle excludes chosen cards');
 await tap('#autoDrawBtn');await until("appState.readingStatus==='ready'");
 await check('appState.drawnCards.length===3 && new Set(appState.drawnCards.map(d=>d.card.id)).size===3','auto draw completes unique spread');
 await check("requestBodies[0].spice==='hot'",'tone reaches reading API');
 await check("!appState.drawnCards[0].flipped && document.querySelector('.reading-copy').textContent.includes('Turn the card')",'card and interpretation stay hidden until reveal');
 await tap('.reveal-card');await delay(650);await check("appState.drawnCards[0].flipped && document.querySelector('.reading-copy').textContent.includes('same episode')",'tap reveals interpretation');await shot('reading');
 const p=await js("(()=>{const r=document.getElementById('readPanel').getBoundingClientRect();return {x:r.right-30,y:r.top+130};})()");
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});
 for(let i=1;i<=6;i++){await delay(35);await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x-i*22,y:p.y+3}]});}
 await delay(35);await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await delay(450);await check('appState.activeTabIndex===1','touch swipe advances reading');
 await tap('#nextReading');await until('appState.activeTabIndex===2');await delay(350);await tap('#nextReading');await until('appState.activeTabIndex===3');await tap('.dare-button');await check('appState.dareAccepted','dare acceptance works');
 await tap('#flipAllBtn');await tap('.chat-chips button');await until('!appState.chatLoading');
 await check("appState.chatMessages.length===2 && requestBodies.at(-1).readingContext.includes('cosmicVerdict')",'chat carries current reading context');
 await check("!document.querySelector('#chatFeed img') && document.getElementById('chatFeed').textContent.includes('<img')",'chat content escaped');await shot('chat');
 await js("window.chatMode='fail';appState.chatDraft='But what if I change my mind?';sendOracleMessage()");await until('!!appState.chatError');await check('appState.chatMessages.length===3','failed message retained');
 await js("window.chatMode='success'");await tap('.chat-error button');await until('!appState.chatLoading');await check('appState.chatMessages.length===4','retry without duplicate messages');
 await viewport(390,430);await delay(150);await check("document.getElementById('chatInput').getBoundingClientRect().bottom<=innerHeight && document.getElementById('chatFeed').clientHeight>25",'chat and composer fit keyboard viewport');
 await viewport(320,568);await delay(150);await check('document.documentElement.scrollWidth<=innerWidth','320px layout fits');await shot('small-chat');
 await js("window.chatMode='pending';appState.chatDraft='Another question';sendOracleMessage();void 0");await until('appState.chatLoading');await tap('#stage-reading>div:last-child>button');await js('window.finishChat()');await delay(100);
 await check("appState.stage==='setup' && appState.chatMessages.length===0",'new reading ignores late reply');
 await js('startShuffle();autoDraw();resetToSetup()');await delay(1300);await check("appState.stage==='setup'",'leaving draw cancels auto selection');
 await viewport(1280,900);await delay(150);await shot('desktop');await check('document.documentElement.scrollWidth<=innerWidth','desktop layout fits');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await check("getComputedStyle(document.querySelector('.hero-deck')).animationName==='none'",'reduced motion respected');
 assert.deepEqual(errors,[],'no browser exceptions');ws.close();
})().catch(e=>{console.error(e);process.exit(1);});

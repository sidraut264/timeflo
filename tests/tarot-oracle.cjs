const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const handler = require('../api/tarot.js');
const realFetch = global.fetch;
const card = { positionTitle: 'Reality', isReversed: false, card: { name: 'The Fool' } };
const request = { method: 'POST', body: { question: 'What next?', category: 'general', drawnCards: [card] } };
const reading = { interpretations: [{ cardIndex: 0, oracleTake: 'A fresh start.' }], cosmicVerdict: 'Take the first step.', cosmicDare: 'Try something new.' };
function response() { return { headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(n) { this.code=n;return this; }, json(v) { this.body=v;return this; } }; }
async function apiTests() {
  process.env.GEMINI_API_KEY = 'test-key';
  delete process.env.GEMINI_MODEL;
  let calls = 0;
  global.fetch = async (url, options) => {
    calls++;
    assert(url.includes('gemini-3.5-flash-lite:generateContent'));
    assert(!url.includes('test-key'));
    assert.equal(options.headers['X-goog-api-key'], 'test-key');
    const payload = JSON.parse(options.body);
    assert(payload.generationConfig.responseSchema.required.includes('cosmicDare'));
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'private thought', thought: true }, { text: JSON.stringify(reading) }] } }] }) };
  };
  let res = response(); await handler(request,res);
  assert.equal(res.code,200); assert.equal(res.body.source,'gemini'); assert.equal(res.headers['Cache-Control'],'no-store'); assert.equal(calls,1);
  global.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({...reading,interpretations:[2,0,1].map(cardIndex=>({cardIndex,oracleTake:'Card '+cardIndex}))})}]}}]})});
  res=response();await handler({...request,body:{...request.body,drawnCards:[card,card,card]}},res);
  assert.equal(res.code,200);assert.deepEqual(res.body.interpretations.map(item=>item.cardIndex),[0,1,2]);
  res=response();await handler({...request,body:{...request.body,drawnCards:[]}},res);assert.equal(res.code,400);
  res=response();await handler({...request,body:'{'},res);assert.equal(res.code,400);
  res=response();await handler({...request,method:'GET'},res);assert.equal(res.code,405);
  global.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({...reading,interpretations:[{cardIndex:2,oracleTake:'Wrong card'}]})}]}}]})});
  res=response();await handler(request,res);assert.equal(res.code,502);
  calls=0;global.fetch=async()=>{calls++;return {ok:false,status:503,body:{cancel:async()=>{}}};};
  res=response();await handler(request,res);assert.equal(calls,2);assert.equal(res.code,502);assert(!res.body.details);
  const realTimeout=global.setTimeout;
  global.setTimeout=(fn,ms)=>realTimeout(fn,ms===25000?5:ms);
  global.fetch=async(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted'))));
  res=response();await handler(request,res);assert.equal(res.code,504);
  global.setTimeout=realTimeout;
  delete process.env.GEMINI_API_KEY;delete process.env.GOOGLE_API_KEY;
  res=response();await handler(request,res);assert.equal(res.code,503);
  global.fetch=realFetch;
  console.log('PASS server: model, schema, authentication, validation, retry, deadline, missing key');
}
async function pageTests() {
  const elements=new Map();
  const element=()=>({innerHTML:'',innerText:'',disabled:false,classList:{add(){},remove(){}},getAttribute(){return '';}});
  const context=vm.createContext({ console, AbortController, Date, Math, JSON,
    setTimeout:(fn,ms)=>setTimeout(fn,ms===30000?100:Math.min(ms,15)), clearTimeout,
    document:{getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);},querySelectorAll:()=>[]},
    window:{addEventListener(){}},localStorage:{setItem(){},getItem(){return null;}},navigator:{} });
  const html=fs.readFileSync('tarot-and-tea.html','utf8');
  for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))vm.runInContext(match[1],context);
  const run=code=>vm.runInContext(code,context);
  run("appState.drawnCards = [{card:FULL_DECK[0],isReversed:false,positionTitle:'Reality',flipped:true}]; appState.question='What next?'");
  let resolveFetch;
  context.fetch=()=>new Promise(resolve=>{resolveFetch=resolve;});
  let pending=run('requestOracleReading()');
  assert.equal(run('appState.readingStatus'),'loading');
  assert(!elements.get('readPanel').innerHTML.includes('Stop reading into'));
  assert(elements.get('readPanel').innerHTML.includes('connecting the dots'));
  assert(elements.get('shareBtn').disabled);
  resolveFetch({ok:true,json:async()=>reading});await pending;
  assert.equal(run('appState.readingStatus'),'ready');assert(elements.get('readPanel').innerHTML.includes('A fresh start.'));
  assert.equal(run('appState.journal.length'),1);
  context.fetch=async()=>({ok:false});await run('requestOracleReading()');
  assert.equal(run('appState.readingStatus'),'fallback');assert(elements.get('oracleStatus').innerHTML.includes('Try again'));
  assert.equal(run('appState.journal.length'),1);
  context.fetch=async()=>({ok:true,json:async()=>reading});await run('requestOracleReading()');assert.equal(run('appState.journal.length'),1);
  context.fetch=(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted'))));
  await run('requestOracleReading()');assert.equal(run('appState.readingStatus'),'fallback');
  context.fetch=()=>new Promise(resolve=>{resolveFetch=resolve;});pending=run('requestOracleReading()');
  run("cancelOracleReading();appState.question='New reading';appState.aiReading=null;");
  resolveFetch({ok:true,json:async()=>reading});await pending;assert.equal(run('appState.aiReading'),null);
  assert.equal(run("formatMarkdown('<img src=x onerror=alert(1)>')"),'&lt;img src=x onerror=alert(1)&gt;');
  const fronts=run('FULL_DECK.map(card=>renderCardFrontSVG(card,false))');
  assert.equal(fronts.length,78);assert.equal(new Set(fronts).size,78);assert(fronts.every(svg=>!svg.includes('undefined')&&!svg.includes('NaN')));
  assert(run('renderCardFrontSVG(FULL_DECK[0],true)').includes('rotate(180)'));
  assert.notEqual(run('renderCardBackSVG()'),run('renderCardBackSVG()'));
  console.log('PASS page: loading, Gemini, fallback, retry, timeout, stale response, journal, escaping, all 78 cards');
}
(async()=>{await apiTests();await pageTests();})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.fetch=realFetch;});

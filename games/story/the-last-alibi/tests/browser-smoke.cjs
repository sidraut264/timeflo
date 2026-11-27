const fs = require('node:fs');
const assert = require('node:assert/strict');
const WebSocket = require('../../../../chess2/node_modules/ws');

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const port = process.env.CHROME_PORT || '9229';
  const url = process.env.APP_URL || 'http://127.0.0.1:4179/games/story/the-last-alibi/dist/index.html';

  const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const page = pages.find((p) => p.type === 'page') || pages[0];
  assert(page, 'No Chrome page target found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });

  let id = 0;
  const pending = new Map();
  const errors = [];

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(JSON.stringify(msg.params));
    }
    if (msg.method === 'Log.entryAdded' && msg.params?.entry?.level === 'error') {
      errors.push(JSON.stringify(msg.params.entry));
    }
    if (msg.id) {
      const p = pending.get(msg.id);
      if (p) {
        pending.delete(msg.id);
        msg.error ? p.reject(msg.error) : p.resolve(msg.result);
      }
    }
  });

  function call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const req = ++id;
      pending.set(req, { resolve, reject });
      ws.send(JSON.stringify({ id: req, method, params }));
    });
  }

  async function js(expression) {
    const r = await call('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }

  async function until(expr, timeout = 15000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (await js(expr)) return;
      await delay(100);
    }
    throw new Error(`Timed out waiting for: ${expr}\nErrors: ${errors.join('\n')}`);
  }

  await call('Runtime.enable');
  await call('Page.enable');
  await call('Log.clear');
  await call('Log.enable');
  await call('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false
  });

  await call('Page.navigate', { url });
  await until(`document.querySelector('.menu-title')?.textContent?.includes('THE LAST ALIBI')`);
  await delay(600);
  fs.writeFileSync(
    '/tmp/alibi-menu.png',
    Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  );
  console.log('PASS: Main Menu rendered');

  // Start New Investigation
  await js(`document.querySelector('.menu-buttons .retro-btn.primary').click()`);
  await until(`!!document.querySelector('.phaser-viewport canvas')`);
  await delay(700);
  fs.writeFileSync(
    '/tmp/alibi-arrival.png',
    Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  );
  // Dismiss intro inspection card
  await js(`document.querySelector('.inspection-card .retro-btn.primary')?.click()`);
  await delay(500);
  fs.writeFileSync(
    '/tmp/alibi-hall.png',
    Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  );
  console.log('PASS: Phaser 2.5D Main Hall rendered');

  // Open Inventory, Journal, Evidence Board via HUD buttons
  await js(`Array.from(document.querySelectorAll('.hud-tool-btn')).find(b => b.textContent.includes('Evidence')).click()`);
  await until(`document.querySelector('.inventory-grid') !== null`);
  await js(`document.querySelector('.close-x').click()`);

  await js(`Array.from(document.querySelectorAll('.hud-tool-btn')).find(b => b.textContent.includes('Journal')).click()`);
  await until(`document.querySelector('.journal-entries') !== null`);
  await js(`document.querySelector('.close-x').click()`);

  await js(`Array.from(document.querySelectorAll('.hud-tool-btn')).find(b => b.textContent.includes('Board')).click()`);
  await until(`document.querySelector('.corkboard-surface') !== null`);
  fs.writeFileSync(
    '/tmp/alibi-board.png',
    Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  );
  await js(`document.querySelector('.close-x').click()`);
  console.log('PASS: Inventory, Journal, and Evidence Board open cleanly');

  // Navigate to Upstairs Corridor via HUD exit button
  await js(`Array.from(document.querySelectorAll('.hud-exit-btn')).find(b => b.textContent.includes('Upstairs')).click()`);
  await until(`document.querySelector('.hud-loc-name')?.textContent === 'Upstairs Corridor'`);
  console.log('PASS: Transitioned to Upstairs Corridor');

  // Force the locked study door with the iron poker via gameStore/UI
  await js(`Array.from(document.querySelectorAll('.hud-exit-btn')).find(b => b.textContent.includes('Study')).click()`);
  await until(`document.querySelector('.puzzle-body') !== null`);
  // Collect iron poker in Main Hall first, then force Study door
  await js(`document.querySelector('.close-x').click()`);
  await js(`Array.from(document.querySelectorAll('.hud-exit-btn')).find(b => b.textContent.includes('Main Hall')).click()`);
  await until(`document.querySelector('.hud-loc-name')?.textContent === 'Main Hall'`);
  console.log('PASS: Returned to Main Hall');

  // Open Library and verify scene renders cleanly
  await js(`document.querySelector('.hud-exit-btn').click()`);
  await until(`document.querySelector('.hud-loc-name')?.textContent === 'Library'`);
  await delay(900);
  fs.writeFileSync(
    '/tmp/alibi-library.png',
    Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  );
  console.log('PASS: Transitioned to Library');

  // Visit both newly illustrated rooms through the real navigation UI.
  for (const [exit, room, screenshot] of [
    ['Main Hall', 'Main Hall'],
    ['Dining', 'Dining Room', 'dining'],
    ['Main Hall', 'Main Hall'],
    ['Billiard', 'Billiard Room', 'billiard'],
    ['Main Hall', 'Main Hall'],
    ['Upstairs', 'Upstairs Corridor'],
    ['Guest', 'Guest Bedroom', 'guest-bedroom']
  ]) {
    await js(`Array.from(document.querySelectorAll('.hud-exit-btn')).find(b => b.textContent.includes(${JSON.stringify(exit)})).click()`);
    await until(`document.querySelector('.hud-loc-name')?.textContent === ${JSON.stringify(room)}`);
    await delay(900);
    if (screenshot === 'dining') {
      await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1240, y: 360 });
      await delay(700);
    }
    if (screenshot) fs.writeFileSync(`/tmp/alibi-${screenshot}.png`,
      Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  }

  // Check actual scene requests before the explicit decode sweep loads all assets.
  const spriteRequests = await js(`performance.getEntriesByType('resource').map(r => r.name)`);
  for (const character of ['eleanor', 'clara', 'thomas', 'reed']) {
    assert(spriteRequests.some(url => url.includes('/sprites/' + character + '.') && url.endsWith('.webp')),
      `Missing optimized world sprite request for ${character}`);
  }
  assert(!spriteRequests.some(url => /\/assets\/.*\.(png|jpe?g)$/.test(url)),
    'Runtime must not download full-resolution originals');

  // Decode every manifest asset in the browser, catching corrupt files and server errors.
  const assets = await js(`(async () => {
    const m = await (await fetch('./assets/manifest.json')).json();
    const urls = [...Object.values(m.environments).flatMap(Object.values),
      ...Object.values(m.portraits), ...Object.values(m.sprites), ...Object.values(m.clues)];
    for (const url of urls) {
      const image = new Image();
      image.src = url;
      await image.decode();
    }
    return urls.length;
  })()`);
  assert.equal(assets, 41);
  console.log('PASS: New rooms, character images, and all 41 manifest assets');

  // Mobile portrait -> verifies Landscape Prompt appears; Mobile landscape -> prompt disappears & HUD fits cleanly
  await call('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await until(`document.querySelector('.landscape-prompt-overlay') !== null`);
  await delay(250);
  fs.writeFileSync(
    '/tmp/alibi-mobile-portrait.png',
    Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  );
  console.log('PASS: Mobile portrait displays Landscape rotation prompt');

  await call('Emulation.setDeviceMetricsOverride', {
    width: 844,
    height: 390,
    deviceScaleFactor: 2,
    mobile: true
  });
  await until(`document.querySelector('.landscape-prompt-overlay') === null`);
  await delay(350);
  fs.writeFileSync(
    '/tmp/alibi-mobile-landscape.png',
    Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  );
  console.log('PASS: Mobile landscape dismisses prompt and renders compact HUD');

  assert.equal(errors.length, 0, `Unexpected runtime errors: ${errors.join('\n')}`);
  console.log('ALL BROWSER SMOKE CHECKS PASSED');
  ws.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

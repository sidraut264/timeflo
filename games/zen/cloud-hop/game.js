import * as THREE from './vendor/three.module.js';
import { generateCourse, randomSeed, rng } from './world.js';

const $ = id => document.getElementById(id);
const ui = Object.fromEntries(['stage','intro','playButton','game','levelLabel','worldLabel','seedLabel','gemCount','gemTotal','timer','pauseButton','overlay','modalTitle','modalText','modalEyebrow','modalIcon','resultStats','resumeButton','retryButton','goalHint','progress','progressFill','help','toast','touchControls','soundButton','loadingError','errorText'].map(id => [id, $(id)]));
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: ui.game, antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  ui.loadingError.hidden = false;
  ui.errorText.textContent = 'This browser could not start 3D graphics. Try a browser with WebGL enabled.';
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor('#d5cae9');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#d9cfed', 28, 95);
const camera = new THREE.PerspectiveCamera(43, 1, .1, 160);
scene.add(new THREE.HemisphereLight('#fff9ef', '#8a809b', 2.7));
const sun = new THREE.DirectionalLight('#fff4dc', 3);
sun.position.set(-12, 20, 12); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 70 });
sun.shadow.bias = -.001; sun.shadow.normalBias = .025;
scene.add(sun); scene.add(sun.target);
const world = new THREE.Group(); scene.add(world);
const materials = new Map(), geometries = new Map();
function material(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .85, ...extra }));
  return materials.get(key);
}
function sphere(r = 1) { const k = 'sphere' + r; if (!geometries.has(k)) geometries.set(k, new THREE.SphereGeometry(r, 12, 8)); return geometries.get(k); }
function box(x, y, z) { const k = `box${x},${y},${z}`; if (!geometries.has(k)) geometries.set(k, new THREE.BoxGeometry(x, y, z)); return geometries.get(k); }
function mesh(geo, mat, parent, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = shadow; parent.add(m); return m;
}
function roundedGeometry(w, d, depth, radius = .35) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2, r = Math.min(radius, w / 3, d / 3);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .1, bevelThickness: .1, curveSegments: 3 });
  g.rotateX(-Math.PI / 2); g.userData.owned = true; return g;
}
const circle = new THREE.CircleGeometry(.55, 24);
const shadowMaterial = new THREE.MeshBasicMaterial({ color: '#596347', transparent: true, opacity: .18, depthWrite: false });
const blob = mesh(circle, shadowMaterial, scene, 0, .025, 0, false); blob.rotation.x = -Math.PI / 2;

// A tiny explorer, modeled directly in 3D so no assets have to load during play.
const avatar = new THREE.Group(); scene.add(avatar);
const body = new THREE.Group(); avatar.add(body);
const lime = material('#c5e87d'), dark = material('#3d493c'), white = material('#fffcef');
mesh(new THREE.CapsuleGeometry(.36, .42, 4, 12), lime, body, 0, .73, 0);
mesh(sphere(.25), material('#a996c2'), body, 0, .68, -.31).scale.set(1.15, 1.2, .65);
const feet = [-1, 1].map(s => { const f = mesh(sphere(.16), dark, body, s * .22, .15, .1); f.scale.set(1, .65, 1.4); return f; });
const arms = [-1, 1].map(s => { const a = mesh(sphere(.13), lime, body, s * .42, .59, 0); a.scale.set(.8, 1.6, .8); return a; });
for (const x of [-.13, .13]) { mesh(sphere(.093), white, body, x, .9, .31); mesh(sphere(.045), dark, body, x, .91, .385); }
const smile = mesh(new THREE.TorusGeometry(.065, .012, 4, 12, Math.PI), dark, body, 0, .745, .354, false); smile.rotation.z = Math.PI;
mesh(sphere(.057), material('#d99b8f'), body, -.26, .77, .29); mesh(sphere(.057), material('#d99b8f'), body, .26, .77, .29);
const sprout = new THREE.Group(); body.add(sprout); sprout.position.y = 1.28;
mesh(box(.025, .13, .025), dark, sprout, 0, 0, 0);
for (const s of [-1, 1]) { const leaf = mesh(sphere(.09), material('#7e9c4d'), sprout, s * .065, .08, 0); leaf.scale.set(1.6, .55, .8); leaf.rotation.z = s * .35; }

const clouds = new THREE.Group(); scene.add(clouds);
const cloudMat = material('#fff9f0', { transparent: true, opacity: .55 });
const cloudRandom = rng(4917);
for (let i = 0; i < 18; i++) {
  const c = new THREE.Group(); c.position.set((cloudRandom() - .5) * 90, -5 - cloudRandom() * 7, 15 - cloudRandom() * 150);
  c.userData.originX = c.position.x;
  for (let j = 0; j < 4; j++) { const puff = mesh(sphere(1), cloudMat, c, (j - 1.5) * 1.7, Math.sin(j * 2) * .5, 0, false); puff.scale.set(2.4, .65 + cloudRandom() * .4, 1.7); }
  clouds.add(c);
}
let state = 'intro', level = 1, seed = randomSeed(), course, platforms = [], gems = [], checkpoint = 0;
let collected = 0, totalCollected = 0, elapsed = 0, falls = 0, worldTime = 0, grounded = null;
let vertical = 0, jumpCount = 0, coyote = 0, jumpBuffer = 0, invincible = 0, toastTimeout;
let sound = false, audioContext, helpWasPlaying = false;
const velocity = new THREE.Vector3(), position = new THREE.Vector3(), keys = new Set();
const touch = { x: 0, z: 0, pointer: null };
const particles = [], cameraTarget = new THREE.Vector3(), desiredCamera = new THREE.Vector3(), normalScale = new THREE.Vector3(1, 1, 1);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;
const STEP = 1 / 120, SPEED = 6.6, GRAVITY = 24, JUMP = 10.3;

function tone(freq, length = .1, type = 'sine', vol = .045) {
  if (!sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const osc = audioContext.createOscillator(), gain = audioContext.createGain(), now = audioContext.currentTime;
    osc.type = type; osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + length);
    gain.gain.setValueAtTime(vol, now); gain.gain.exponentialRampToValueAtTime(.001, now + length);
    osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(now + length);
  } catch { sound = false; updateSoundButton(); }
}
function toast(message) { clearTimeout(toastTimeout); ui.toast.textContent = message; ui.toast.classList.add('show'); toastTimeout = setTimeout(() => ui.toast.classList.remove('show'), 2300); }
function burst(x, y, z, color, count = 10) {
  if (reducedMotion) return;
  for (let i = 0; i < count; i++) {
    const m = mesh(sphere(.055), material(color), scene, x, y, z, false);
    particles.push({ mesh: m, vx: (Math.random() - .5) * 3.5, vy: 1 + Math.random() * 3, vz: (Math.random() - .5) * 3.5, life: .5 + Math.random() * .4 });
  }
}
function clearWorld() {
  world.traverse(o => { if (o.geometry?.userData.owned) o.geometry.dispose(); if (o.material?.userData.owned) o.material.dispose(); });
  world.clear(); gems = [];
  for (const p of particles) scene.remove(p.mesh); particles.length = 0;
}
function flower(parent, x, z, color, random) {
  const h = .15 + random() * .25;
  mesh(box(.025, h, .025), material('#7d965c'), parent, x, h / 2 + .17, z);
  mesh(sphere(.09), material(color), parent, x, h + .17, z).scale.set(1, .7, 1);
}
function buildLevel(nextSeed, nextLevel) {
  clearWorld(); level = nextLevel; seed = nextSeed; course = generateCourse(seed, level);
  const random = rng(seed ^ 4137), theme = course.theme;
  scene.background = new THREE.Color(theme.sky); scene.fog.color.set(theme.fog);
  ui.stage.style.background = theme.sky;
  platforms = course.platforms.map((p, index) => {
    const group = new THREE.Group(); group.position.set(p.x, p.y, p.z); world.add(group);
    mesh(roundedGeometry(p.w, p.d, 1.05), material(theme.side), group, 0, -1.18, 0);
    mesh(roundedGeometry(p.w + .12, p.d + .12, .2), material(theme.top), group, 0, -.25, 0);
    const rockGeo = new THREE.ConeGeometry(Math.min(p.w, p.d) * .5, 1.6, 4); rockGeo.userData.owned = true;
    const rock = mesh(rockGeo, material(theme.side), group, 0, -1.85, 0); rock.rotation.x = Math.PI; rock.rotation.y = Math.PI / 4;
    // Decorations stay near the edges, leaving the center clear to jump across.
    for (let j = 0; j < 6; j++) {
      const x = (j % 2 ? 1 : -1) * (p.w / 2 - .38 - random() * .4), z = (random() - .5) * (p.d - .8);
      flower(group, x, z, theme.flower, random);
      if (j % 3 === 0) mesh(sphere(.13), material(theme.leaf), group, x - .15, .22, z + .2).scale.set(1.5, 1, 1.1);
    }
    if (index === 0 || p.kind === 'checkpoint') {
      const pole = mesh(box(.055, 1.3, .055), material('#787961'), group, -p.w / 2 + .8, .72, -.7);
      const flag = mesh(box(.65, .38, .035), material(index === 0 ? '#f6f1d9' : '#e6d8f4'), group, pole.position.x + .31, 1.17, -.7);
      group.userData.flag = flag;
      const ringGeo = new THREE.RingGeometry(.4, .48, 24); ringGeo.userData.owned = true;
      const ring = mesh(ringGeo, material('#f8f3ce', { side: THREE.DoubleSide }), group, 0, .025, 0, false); ring.rotation.x = -Math.PI / 2;
    }
    if (p.kind === 'moving') {
      const inset = mesh(box(p.w - .7, .035, .09), material('#f0e4c3'), group, 0, .025, p.d / 2 - .3);
      inset.castShadow = false;
    }
    if (index > 0 && p.kind !== 'finish') {
      const g = mesh(new THREE.OctahedronGeometry(.24), material('#ffdc78', { metalness: .25, roughness: .4, emissive: '#d7a940', emissiveIntensity: .17 }), group, 0, 1.05, 0);
      g.geometry.userData.owned = true;
      gems.push({ mesh: g, platform: index, collected: false, baseY: 1.05, phase: random() * Math.PI * 2 });
    }
    if (p.kind === 'finish') {
      const torus = new THREE.TorusGeometry(1.1, .16, 8, 40); torus.userData.owned = true;
      const portal = mesh(torus, material('#f7e5a3', { emissive: '#eccc73', emissiveIntensity: .4 }), group, 0, 1.3, -.45);
      const discGeo = new THREE.CircleGeometry(.96, 40); discGeo.userData.owned = true;
      const disc = mesh(discGeo, new THREE.MeshBasicMaterial({ color: '#fff4c8', transparent: true, opacity: .4, side: THREE.DoubleSide, depthWrite: false }), group, 0, 1.3, -.47, false);
      disc.material.userData.owned = true; group.userData.portal = portal; group.userData.disc = disc;
      for (let j = 0; j < 5; j++) { const star = mesh(sphere(.06), material('#fff6cf'), group, Math.cos(j * 1.3) * 1.4, 1.4 + Math.sin(j * 1.3) * 1.4, -.45, false); group.userData['star' + j] = star; }
    }
    return { ...p, group, px: p.x, dx: 0, index };
  });
  checkpoint = 0; collected = 0; elapsed = 0; falls = 0; worldTime = 0;
  keys.clear(); touch.x = touch.z = 0;
  ui.levelLabel.textContent = 'Level ' + String(level).padStart(2, '0'); ui.worldLabel.textContent = theme.name;
  ui.seedLabel.textContent = seed.toString(36).toUpperCase().padStart(6, '0');
  ui.gemTotal.textContent = gems.length; ui.gemCount.textContent = '0'; ui.timer.textContent = '00:00';
  ui.progressFill.style.width = '0%';
  respawn(false); updateWorld(0);
}
function respawn(countFall = true) {
  const p = platforms[checkpoint];
  if (countFall) { falls++; tone(180, .16); toast(checkpoint ? 'Back at your checkpoint. You’ve got this.' : 'A little tumble. Try that hop again.'); }
  position.set(p.group.position.x, p.y + .02, p.z + (checkpoint === 0 ? 1.4 : .4));
  velocity.set(0, 0, 0); vertical = 0; grounded = p; jumpCount = 0; coyote = .12; invincible = .35; jumpBuffer = 0;
  avatar.position.copy(position); avatar.rotation.y = Math.PI;
  if (state !== 'intro') { cameraTarget.set(position.x, position.y, position.z - 2.7); camera.position.set(position.x, position.y + 10, position.z + 14); }
}
function begin() {
  state = 'playing'; ui.intro.hidden = true; ui.pauseButton.disabled = false;
  ui.goalHint.hidden = false; ui.progress.hidden = false; ui.overlay.hidden = true;
  ui.touchControls.hidden = !isTouch; ui.game.focus({ preventScroll: true });
  tone(440, .12); toast(isTouch ? 'Tap JUMP to hop. Tap again for a double jump.' : 'Space to hop. Tap it again for a double jump.');
}
function formatTime(t) { return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t) % 60).padStart(2, '0')}`; }
function resetInput() { keys.clear(); touch.x = touch.z = 0; touch.pointer = null; $('stick').style.transform = ''; jumpBuffer = 0; }
function pause() {
  if (state !== 'playing') return;
  state = 'paused'; resetInput(); ui.overlay.hidden = false; ui.touchControls.hidden = true;
  ui.modalIcon.textContent = '☁'; ui.modalEyebrow.textContent = 'TAKE A BREATHER'; ui.modalTitle.textContent = 'On cloud pause.';
  ui.modalText.textContent = 'Your next island will be right here.'; ui.resultStats.hidden = true;
  ui.resumeButton.innerHTML = 'Keep hopping <span>→</span>'; ui.retryButton.textContent = 'Retry this world'; ui.resumeButton.focus();
}
function resume() { state = 'playing'; ui.overlay.hidden = true; ui.touchControls.hidden = !isTouch; ui.game.focus({ preventScroll: true }); }
function win() {
  if (state !== 'playing') return;
  state = 'won'; resetInput(); totalCollected += collected; ui.touchControls.hidden = true;
  burst(position.x, position.y + 1, position.z, '#fff2b2', 30);
  tone(660, .16); setTimeout(() => tone(880, .2), 120);
  ui.modalIcon.textContent = '✦'; ui.modalEyebrow.textContent = 'A LITTLE VICTORY'; ui.modalTitle.textContent = 'You’re on cloud nine.';
  ui.modalText.textContent = collected === gems.length ? 'Every gem, every hop. A perfect little adventure.' : 'One world explored. A whole new sky is waiting.';
  ui.resultStats.innerHTML = `<span><strong>${collected}/${gems.length}</strong>gems found</span><span><strong>${formatTime(elapsed)}</strong>your time</span><span><strong>${falls}</strong>little tumbles</span>`;
  ui.resultStats.hidden = false; ui.resumeButton.innerHTML = 'Next adventure <span>→</span>'; ui.retryButton.textContent = 'Hop this world again';
  ui.overlay.hidden = false; ui.progressFill.style.width = '100%'; ui.resumeButton.focus();
  try { const best = JSON.parse(localStorage.getItem('timeflo-cloud-hop') || '{}'); localStorage.setItem('timeflo-cloud-hop', JSON.stringify({ highestLevel: Math.max(level, best.highestLevel || 0), gems: (best.gems || 0) + collected })); } catch { /* The game also works with storage disabled. */ }
}
function requestJump() { if (state === 'playing' && ui.help.hidden) jumpBuffer = .15; }
function updateWorld(dt) {
  for (const p of platforms) {
    const previousX = p.group.position.x;
    p.group.position.x = p.x + Math.sin(worldTime * .9 + p.phase) * p.amplitude;
    p.dx = p.group.position.x - previousX;
    if (p.group.userData.flag && !reducedMotion) p.group.userData.flag.rotation.y = Math.sin(worldTime * 2 + p.index) * .12;
    if (p.group.userData.portal) {
      p.group.userData.portal.rotation.z = worldTime * .3;
      p.group.userData.disc.material.opacity = .34 + Math.sin(worldTime * 2) * .08;
    }
  }
  for (const g of gems) if (!g.collected) { g.mesh.rotation.y = worldTime * 1.4 + g.phase; g.mesh.position.y = g.baseY + (reducedMotion ? 0 : Math.sin(worldTime * 2.2 + g.phase) * .13); }
}
function inside(p, x, z, margin = .18) { return Math.abs(x - p.group.position.x) < p.w / 2 + margin && Math.abs(z - p.z) < p.d / 2 + margin; }
function physics(dt) {
  elapsed += dt; worldTime += dt; invincible = Math.max(0, invincible - dt); updateWorld(dt);
  if (grounded) position.x += grounded.dx;
  let ix = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + touch.x;
  let iz = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) + touch.z;
  const length = Math.hypot(ix, iz); if (length > 1) { ix /= length; iz /= length; }
  const approach = 1 - Math.exp(-(grounded ? 18 : 9) * dt);
  velocity.x += (ix * SPEED - velocity.x) * approach; velocity.z += (iz * SPEED - velocity.z) * approach;
  if (grounded && !inside(grounded, position.x, position.z)) { grounded = null; coyote = .13; }
  if (grounded) { coyote = .13; jumpCount = 0; } else coyote -= dt;
  if (jumpBuffer > 0) {
    if (grounded || coyote > 0 || jumpCount < 2) {
      const onGround = grounded || coyote > 0;
      if (!onGround && jumpCount === 0) jumpCount = 1;
      vertical = onGround ? JUMP : JUMP * .91; jumpCount++; grounded = null; coyote = 0; jumpBuffer = 0;
      tone(onGround ? 360 : 530, .09, 'sine', .03);
      burst(position.x, position.y + .05, position.z, onGround ? '#f0ead3' : '#e7e6fa', onGround ? 6 : 12);
      body.scale.set(.88, 1.15, .88);
    } else jumpBuffer -= dt;
  }
  const previousY = position.y;
  position.x += velocity.x * dt; position.z += velocity.z * dt;
  if (grounded && !inside(grounded, position.x, position.z)) { grounded = null; coyote = .13; }
  if (!grounded) { vertical -= GRAVITY * dt; position.y += vertical * dt; }
  if (vertical <= 0 && !grounded) {
    for (const p of platforms) {
      if (previousY >= p.y - .035 && position.y <= p.y + .02 && inside(p, position.x, position.z)) {
        grounded = p; position.y = p.y + .01; vertical = 0; jumpCount = 0; coyote = .13;
        body.scale.set(1.14, .8, 1.14); tone(230, .05, 'sine', .015);
        if (p.kind === 'checkpoint' && p.index > checkpoint) {
          checkpoint = p.index; p.group.userData.flag.material = material('#c7e68c');
          burst(position.x, position.y + .5, position.z, '#d4ee9c', 14); toast('Checkpoint! A cozy place to land.'); tone(720, .13);
        }
        break;
      }
    }
  }
  for (const g of gems) {
    if (g.collected) continue;
    const p = platforms[g.platform];
    if (Math.hypot(position.x - p.group.position.x, position.z - p.z) < .75 && Math.abs(position.y + .65 - (p.y + g.mesh.position.y)) < .9) {
      g.collected = true; g.mesh.visible = false; collected++; ui.gemCount.textContent = collected;
      burst(p.group.position.x, p.y + 1, p.z, '#ffe397', 10); tone(850 + collected * 12, .12);
    }
  }
  const finish = platforms[platforms.length - 1];
  if (grounded === finish && Math.hypot(position.x - finish.group.position.x, position.z - (finish.z - .45)) < 1.15) win();
  if (position.y < -9 && invincible === 0) respawn();
  avatar.position.copy(position);
}
function renderAvatar(dt, t) {
  if (state === 'intro') { avatar.position.y = position.y + (reducedMotion ? 0 : Math.sin(t * 2) * .035); avatar.rotation.y = .25; }
  const speed = Math.hypot(velocity.x, velocity.z);
  if (state === 'playing' && speed > .15) {
    const target = Math.atan2(velocity.x, velocity.z), difference = Math.atan2(Math.sin(target - avatar.rotation.y), Math.cos(target - avatar.rotation.y));
    avatar.rotation.y += difference * (1 - Math.exp(-16 * dt));
  }
  const moving = state === 'playing' && grounded && speed > .3;
  for (let i = 0; i < 2; i++) { feet[i].position.y = .15 + (moving ? Math.sin(t * 16 + i * Math.PI) * .085 : 0); feet[i].position.z = .1 + (moving ? Math.cos(t * 16 + i * Math.PI) * .1 : 0); arms[i].rotation.x = moving ? Math.sin(t * 16 + i * Math.PI) * .5 : .12; }
  body.scale.lerp(normalScale, 1 - Math.exp(-12 * dt));
  let below = null; for (const p of platforms) if (inside(p, position.x, position.z, 0) && p.y <= position.y + .05 && (!below || p.y > below.y)) below = p;
  blob.visible = !!below;
  if (below) { blob.position.set(position.x, below.y + .027, position.z); const s = Math.max(.55, 1 - (position.y - below.y) * .09); blob.scale.set(s, s, s); }
}
function updateCamera(dt) {
  if (state === 'intro') {
    const mobile = ui.stage.clientWidth < 600;
    cameraTarget.set(mobile ? -2.5 : -6.2, .15, mobile ? -5 : -7);
    desiredCamera.set(mobile ? 9 : 12, mobile ? 13 : 12, mobile ? 15 : 18);
  } else {
    cameraTarget.set(position.x, position.y + .8, position.z - 3);
    desiredCamera.set(position.x, Math.max(position.y, -.5) + 10, position.z + 14);
  }
  camera.position.lerp(desiredCamera, 1 - Math.exp(-5 * dt));
  camera.lookAt(cameraTarget);
  sun.position.set(position.x - 10, 22, position.z + 12); sun.target.position.set(position.x, 0, position.z - 5);
}
function resize() {
  const w = ui.stage.clientWidth, h = ui.stage.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(ui.stage);
let last = performance.now(), accumulator = 0, hudTime = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (state === 'playing') {
    accumulator += dt;
    while (accumulator >= STEP) { physics(STEP); accumulator -= STEP; if (state !== 'playing') { accumulator = 0; break; } }
  } else { accumulator = 0; if (state === 'intro') { worldTime += dt; updateWorld(dt); } }
  for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); continue; } p.vy -= 6 * dt; p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt; p.mesh.scale.setScalar(Math.min(1, p.life * 3)); }
  if (!reducedMotion) for (let i = 0; i < clouds.children.length; i++) clouds.children[i].position.x = clouds.children[i].userData.originX + Math.sin(now * .00006 + i) * 2;
  renderAvatar(dt, now / 1000); updateCamera(dt);
  hudTime += dt; if (hudTime > .15) { hudTime = 0; ui.timer.textContent = formatTime(elapsed); const lastZ = platforms[platforms.length - 1].z; ui.progressFill.style.width = `${THREE.MathUtils.clamp(position.z / lastZ * 100, 0, 100)}%`; }
  renderer.render(scene, camera);
}
ui.playButton.addEventListener('click', begin);
ui.pauseButton.addEventListener('click', () => state === 'playing' ? pause() : state === 'paused' ? resume() : null);
ui.resumeButton.addEventListener('click', () => { if (state === 'won') { buildLevel(randomSeed(), level + 1); resume(); toast('A fresh world. A fresh little adventure.'); } else resume(); });
ui.retryButton.addEventListener('click', () => { buildLevel(seed, level); resume(); });
$('shuffleButton').addEventListener('click', () => { const wasIntro = state === 'intro'; ui.help.hidden = true; buildLevel(randomSeed(), level); if (!wasIntro) resume(); toast('A brand-new world, just for you.'); });
function openHelp() { if (!ui.help.hidden) return; helpWasPlaying = state === 'playing'; if (helpWasPlaying) { state = 'help'; resetInput(); ui.touchControls.hidden = true; } ui.help.hidden = false; $('helpDone').focus(); }
function closeHelp() { ui.help.hidden = true; if (helpWasPlaying) resume(); else $('helpButton').focus(); helpWasPlaying = false; }
$('helpButton').addEventListener('click', openHelp); $('helpDone').addEventListener('click', closeHelp); $('closeHelp').addEventListener('click', closeHelp);
function updateSoundButton() { ui.soundButton.setAttribute('aria-label', sound ? 'Turn sound off' : 'Turn sound on'); ui.soundButton.setAttribute('aria-pressed', String(sound)); ui.soundButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z ${sound ? 'M15 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14' : 'M16 9l5 6m0-6-5 6'}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
ui.soundButton.addEventListener('click', () => { sound = !sound; updateSoundButton(); if (sound) tone(520, .12); });
$('fullscreenButton').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (ui.stage.requestFullscreen) await ui.stage.requestFullscreen(); else toast('Fullscreen is not available in this browser.'); } catch { toast('Fullscreen is not available here.'); } });
const moveCodes = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];
window.addEventListener('keydown', e => {
  const isButton = e.target.closest?.('button,a,input');
  if (e.code === 'Escape') { if (!ui.help.hidden) closeHelp(); else if (state === 'playing') pause(); else if (state === 'paused') resume(); return; }
  if (e.code === 'KeyP' && !e.repeat && ui.help.hidden) { if (state === 'playing') pause(); else if (state === 'paused') resume(); }
  if (state !== 'playing' || !ui.help.hidden || isButton) return;
  if (moveCodes.includes(e.code) || e.code === 'Space') { e.preventDefault(); keys.add(e.code); }
  if (e.code === 'Space' && !e.repeat) requestJump();
  if (e.code === 'KeyR' && !e.repeat) respawn();
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => { resetInput(); pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { resetInput(); pause(); } last = performance.now(); });
const joystick = $('joystick'), stick = $('stick');
function moveStick(e) { const r = joystick.getBoundingClientRect(), max = r.width * .3; let x = e.clientX - (r.left + r.width / 2), z = e.clientY - (r.top + r.height / 2); const distance = Math.hypot(x, z); if (distance > max) { x *= max / distance; z *= max / distance; } touch.x = x / max; touch.z = z / max; stick.style.transform = `translate(${x}px,${z}px)`; }
joystick.addEventListener('pointerdown', e => { if (touch.pointer !== null || state !== 'playing') return; e.preventDefault(); touch.pointer = e.pointerId; joystick.setPointerCapture(e.pointerId); moveStick(e); });
joystick.addEventListener('pointermove', e => { if (e.pointerId === touch.pointer) moveStick(e); });
for (const event of ['pointerup','pointercancel','lostpointercapture']) joystick.addEventListener(event, e => { if (e.pointerId === touch.pointer) { touch.pointer = null; touch.x = touch.z = 0; stick.style.transform = ''; } });
$('touchJump').addEventListener('pointerdown', e => { e.preventDefault(); requestJump(); });
// Keep keyboard focus inside an open dialog.
window.addEventListener('keydown', e => { if (e.key !== 'Tab') return; const container = !ui.help.hidden ? ui.help : !ui.overlay.hidden ? ui.overlay : null; if (!container) return; const buttons = [...container.querySelectorAll('button')]; const first = buttons[0], end = buttons[buttons.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); } else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); } });
for (const panel of [ui.help, ui.overlay]) { panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); }
ui.overlay.setAttribute('aria-labelledby','modalTitle'); ui.help.setAttribute('aria-label','How to play');
ui.game.addEventListener('webglcontextlost', e => { e.preventDefault(); pause(); ui.loadingError.hidden = false; ui.errorText.textContent = 'The graphics connection paused. Refresh to create a new world.'; });
buildLevel(seed, level); resize(); camera.position.set(12, 12, 18); updateCamera(1);
ui.playButton.disabled = false; ui.playButton.innerHTML = 'Let’s hop <span>→</span>';
requestAnimationFrame(frame);
// Read-only inspection is useful for diagnostics without exposing gameplay cheats.
window.cloudHop = Object.freeze({ snapshot: () => ({ state, seed, level, checkpoint, collected, elapsed, falls, grounded: grounded?.index ?? null, position: { x: position.x, y: position.y, z: position.z }, velocity: { x: velocity.x, y: vertical, z: velocity.z }, jumpCount, platforms: platforms.map(p => ({ x: p.group.position.x, y: p.y, z: p.z, w: p.w, d: p.d, kind: p.kind })), rendering: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }, gems: gems.map(g => ({ collected: g.collected, platform: g.platform })) }) });

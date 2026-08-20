/* ================================================================
   ENGINE CORE
   Everything in this section is plumbing: rendering, the ghost
   controller, camera, and the quest runner. It reads from the
   registries (Game.structures / Game.quests / Game.updaters) but
   never hardcodes content itself. Add content at the bottom of
   the file, not here.
   ================================================================ */

const Game = {
    structures: [],   // (scene, M) => void          -- world-building callbacks
    quests: [],        // quest definition objects
    updaters: [],       // (dt, t) => void             -- extra per-frame behavior
    questIndex: 0,
    input: { x: 0, z: 0 },
    keys: {},
};

Game.registerStructure = (fn) => Game.structures.push(fn);
Game.registerQuest = (q) => Game.quests.push(q);
Game.registerUpdate = (fn) => Game.updaters.push(fn);

// ---------- renderer / scene / camera ----------
const scene = new THREE.Scene();
const fogColor = 0x0b0f1a;
scene.fog = new THREE.FogExp2(fogColor, 0.022);
scene.background = new THREE.Color(fogColor);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

// ---------- lighting & sky ----------
scene.add(new THREE.AmbientLight(0x334066, 0.55));
const moon = new THREE.DirectionalLight(0x9fb3ff, 0.9);
moon.position.set(-30, 40, -20);
scene.add(moon);

const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(6, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xdfe6ff })
);
moonMesh.position.copy(moon.position).multiplyScalar(3);
scene.add(moonMesh);

(function buildStars() {
    const count = 800;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = 180 + Math.random() * 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 0.9);
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.cos(phi) + 10;
        pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xaab4ff, size: 0.6 })));
})();

// ---------- shared materials (content can reuse these) ----------
const M = {
    stone: new THREE.MeshStandardMaterial({ color: 0x8a8478, flatShading: true, roughness: 0.95 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: 0x5f5b53, flatShading: true, roughness: 1 }),
    moss: new THREE.MeshStandardMaterial({ color: 0x4d5a3c, flatShading: true, roughness: 1 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x3a2a1e, flatShading: true, roughness: 1 }),
    cloth: new THREE.MeshStandardMaterial({ color: 0x6b2c2c, flatShading: true, roughness: 1, side: THREE.DoubleSide }),
    emberOff: new THREE.MeshStandardMaterial({ color: 0x2a1c14, flatShading: true }),
    emberOn: new THREE.MeshStandardMaterial({ color: 0xff8a3d, emissive: 0xff5500, emissiveIntensity: 1.2, flatShading: true }),
};

// ---------- ground ----------
(function buildGround() {
    const size = 140, seg = 60;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = [];
    const base = new THREE.Color(0x2a3324), variant = new THREE.Color(0x3c4a2e);
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        pos.setY(i, Math.sin(x * 0.15) * Math.cos(z * 0.17) * 0.15 + (Math.random() - 0.5) * 0.1);
        const c = base.clone().lerp(variant, Math.random() * 0.6 + Math.max(0, 1 - (x * x + z * z) / 2500));
        colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));

    const rubbleGeo = new THREE.IcosahedronGeometry(0.3, 0);
    const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x5c5850, flatShading: true, roughness: 1 });
    const rubble = new THREE.InstancedMesh(rubbleGeo, rubbleMat, 90);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 90; i++) {
        const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 55;
        dummy.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const s = 0.4 + Math.random() * 1.1;
        dummy.scale.set(s, s * 0.6, s);
        dummy.updateMatrix();
        rubble.setMatrixAt(i, dummy.matrix);
    }
    scene.add(rubble);
})();

// ---------- ghost (player) ----------
const Ghost = (() => {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({
        color: 0xcfe0ff, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false
    });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65), mat);
    head.position.y = 0.9;
    group.add(head);

    const wisps = [];
    for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const s = 0.5 * (1 - t * 0.75);
        const m = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 10), mat.clone());
        m.material.opacity = 0.45 * (1 - t * 0.8);
        m.position.set(0, 0.7 - t * 1.0, 0);
        group.add(m);
        wisps.push(m);
    }

    const light = new THREE.PointLight(0xaac4ff, 1.4, 8, 2);
    light.position.y = 1.0;
    group.add(light);

    const moteGeo = new THREE.BufferGeometry();
    const moteCount = 50;
    const motePos = new Float32Array(moteCount * 3);
    const moteSeed = [];
    for (let i = 0; i < moteCount; i++) {
        motePos[i * 3] = (Math.random() - 0.5) * 4;
        motePos[i * 3 + 1] = Math.random() * 3;
        motePos[i * 3 + 2] = (Math.random() - 0.5) * 4;
        moteSeed.push(Math.random() * Math.PI * 2);
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
        color: 0xbfd4ff, size: 0.05, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending, depthWrite: false
    }));
    group.add(motes);

    group.position.set(0, 1.1, 6);
    scene.add(group);

    const velocity = new THREE.Vector3();
    const heading = new THREE.Vector3(0, 0, -1);

    function update(dt, t, moveVec) {
        const speed = 4.2;
        const targetVel = new THREE.Vector3(moveVec.x, 0, moveVec.z);
        if (targetVel.lengthSq() > 0.0001) targetVel.normalize().multiplyScalar(speed);
        velocity.lerp(targetVel, 1 - Math.pow(0.001, dt));
        group.position.x += velocity.x * dt;
        group.position.z += velocity.z * dt;
        group.position.y = 1.1 + Math.sin(t * 1.3) * 0.15;

        if (velocity.lengthSq() > 0.05) {
            heading.set(velocity.x, 0, velocity.z).normalize();
            const targetAngle = Math.atan2(heading.x, heading.z);
            const diff = ((targetAngle - group.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
            group.rotation.y += diff * Math.min(1, dt * 6);
        }

        wisps.forEach((w, i) => {
            w.position.x = Math.sin(t * 2 + i) * 0.1;
            w.position.z = Math.cos(t * 1.7 + i) * 0.1;
        });
        light.intensity = 1.1 + Math.sin(t * 3) * 0.3;

        const arr = moteGeo.attributes.position.array;
        for (let i = 0; i < moteCount; i++) arr[i * 3 + 1] = (t * 0.3 + moteSeed[i]) % 3;
        moteGeo.attributes.position.needsUpdate = true;
    }

    return { group, update, get position() { return group.position; } };
})();

// ---------- input: keyboard + on-screen joystick ----------
addEventListener('keydown', e => Game.keys[e.key.toLowerCase()] = true);
addEventListener('keyup', e => Game.keys[e.key.toLowerCase()] = false);

const joystickEl = document.getElementById('joystick');
const knobEl = document.getElementById('joystickKnob');
let joyVec = { x: 0, y: 0 };
if ('ontouchstart' in window) {
    joystickEl.style.display = 'block';
    let active = false, originX = 0, originY = 0;
    joystickEl.addEventListener('pointerdown', e => {
        active = true;
        const r = joystickEl.getBoundingClientRect();
        originX = r.left + r.width / 2; originY = r.top + r.height / 2;
    });
    addEventListener('pointermove', e => {
        if (!active) return;
        let dx = e.clientX - originX, dy = e.clientY - originY;
        const max = 40, len = Math.hypot(dx, dy);
        if (len > max) { dx = dx / len * max; dy = dy / len * max; }
        knobEl.style.left = (28 + dx) + 'px';
        knobEl.style.top = (28 + dy) + 'px';
        joyVec = { x: dx / max, y: dy / max };
    });
    addEventListener('pointerup', () => {
        active = false; joyVec = { x: 0, y: 0 };
        knobEl.style.left = '28px'; knobEl.style.top = '28px';
    });
}

// ---------- camera: third-person, drag to orbit ----------
let camDist = 12, camYaw = 0.6, camPitch = 0.5;
let dragging = false, lastX = 0, lastY = 0;
const dom = renderer.domElement;
dom.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
addEventListener('pointerup', () => dragging = false);
addEventListener('pointermove', e => {
    if (!dragging) return;
    camYaw -= (e.clientX - lastX) * 0.006;
    camPitch = Math.min(1.3, Math.max(0.15, camPitch - (e.clientY - lastY) * 0.006));
    lastX = e.clientX; lastY = e.clientY;
});
dom.addEventListener('wheel', e => { camDist = Math.min(40, Math.max(5, camDist + e.deltaY * 0.02)); }, { passive: true });

// ---------- quest UI ----------
const questTitleEl = document.getElementById('questTitle');
const questTextEl = document.getElementById('questText');
const toastEl = document.getElementById('toast');
let toastTimer = null;

function showQuest(q) {
    questTitleEl.textContent = q.title;
    questTextEl.textContent = q.text;
}
function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3800);
}

function startQuestRunner() {
    if (Game.quests.length) showQuest(Game.quests[0]);
}

function updateQuestRunner() {
    const q = Game.quests[Game.questIndex];
    if (!q || !q.target) return;
    const d = Ghost.position.distanceTo(q.target);
    if (d < (q.radius || 2.5)) {
        if (q.onComplete) q.onComplete(scene, M);
        Game.questIndex++;
        const next = Game.quests[Game.questIndex];
        showToast(q.completeMsg || '\u2726');
        if (next) setTimeout(() => showQuest(next), 900);
    }
}

// ---------- build world & story from registries ----------
Game.structures.forEach(fn => fn(scene, M));
startQuestRunner();

// ---------- main loop ----------
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.getElapsedTime();

    let ix = (Game.keys['d'] || Game.keys['arrowright'] ? 1 : 0) - (Game.keys['a'] || Game.keys['arrowleft'] ? 1 : 0);
    let iz = (Game.keys['s'] || Game.keys['arrowdown'] ? 1 : 0) - (Game.keys['w'] || Game.keys['arrowup'] ? 1 : 0);
    ix += joyVec.x; iz += joyVec.y;

    const sinY = Math.sin(camYaw), cosY = Math.cos(camYaw);
    const forward = { x: -sinY, z: -cosY };
    const right = { x: cosY, z: -sinY };
    const finalMove = { x: forward.x * (-iz) + right.x * ix, z: forward.z * (-iz) + right.z * ix };

    Ghost.update(dt, t, finalMove);
    updateQuestRunner();
    Game.updaters.forEach(fn => fn(dt, t));

    const target = Ghost.position;
    camera.position.set(
        target.x + camDist * Math.sin(camYaw) * Math.cos(camPitch),
        target.y + camDist * Math.sin(camPitch) + 1.5,
        target.z + camDist * Math.cos(camYaw) * Math.cos(camPitch)
    );
    camera.lookAt(target.x, target.y + 0.8, target.z);

    renderer.render(scene, camera);
}
animate();


/* ================================================================
   CONTENT — RUINS
   ================================================================ */

function jaggedBox(w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d, 2, 4, 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y > h * 0.15) {
            pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.4);
            pos.setY(i, y + (Math.random() - 0.3) * h * 0.35);
            pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.4);
        }
    }
    geo.computeVertexNormals();
    return geo;
}

function brokenColumn(scene, x, z, height, rot, matSet) {
    const g = new THREE.Group();
    const drumCount = Math.max(2, Math.round(height));
    let y = 0;
    for (let i = 0; i < drumCount; i++) {
        const r = 0.55 - i * 0.01;
        const hDrum = 0.9 + Math.random() * 0.15;
        const geo = new THREE.CylinderGeometry(r, r * 1.02, hDrum, 8);
        const mesh = new THREE.Mesh(geo, i % 3 === 0 ? matSet.moss : matSet.stone);
        mesh.position.set((Math.random() - 0.5) * 0.08, y + hDrum / 2, (Math.random() - 0.5) * 0.08);
        mesh.rotation.y = Math.random() * Math.PI;
        g.add(mesh);
        y += hDrum * 0.96;
        if (Math.random() < 0.15 && i < drumCount - 1) break;
    }
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
    return g;
}

function ruinedWall(scene, x, z, w, h, rot, material) {
    const mesh = new THREE.Mesh(jaggedBox(w, h, 0.6), material);
    mesh.position.set(x, h / 2 - 0.3, z);
    mesh.rotation.y = rot;
    scene.add(mesh);
    return mesh;
}

function archway(scene, x, z, rot, matSet) {
    const g = new THREE.Group();
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.55, 3.4, 8);
    const pillarL = new THREE.Mesh(pillarGeo, matSet.stone);
    pillarL.position.set(-1.6, 1.7, 0);
    const pillarR = new THREE.Mesh(pillarGeo, matSet.stone);
    pillarR.position.set(1.6, 1.7, 0);
    g.add(pillarL, pillarR);
    const lintel = new THREE.Mesh(jaggedBox(3.6, 0.7, 0.9), matSet.stoneDark);
    lintel.position.set(0, 3.5, 0);
    g.add(lintel);
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
    return g;
}

Game.registerStructure((scene, M) => {
    const wallSegs = [
        [-8, -10, 7, 4.2, 0.3], [-1, -13, 6, 3.0, 0.15], [10, -8, 8, 5.0, -0.4],
        [12, 2, 5, 2.6, 1.4], [8, 11, 7, 3.6, 2.1], [-6, 12, 6, 4.6, -2.2], [-13, 4, 6, 3.2, -1.1],
    ];
    wallSegs.forEach(([x, z, w, h, rot], i) => ruinedWall(scene, x, z, w, h, rot, i % 2 ? M.stone : M.stoneDark));

    [[-3, -3, 4.5], [4, -4, 3.6], [6, 4, 2.8], [-5, 5, 4.0], [0, 7, 3.2], [-9, -2, 2.4]]
        .forEach(([x, z, h]) => brokenColumn(scene, x, z, h, Math.random() * Math.PI, M));

    const blockGeo = new THREE.BoxGeometry(1, 0.7, 1.2);
    for (let i = 0; i < 14; i++) {
        const b = new THREE.Mesh(blockGeo, Math.random() < 0.5 ? M.stone : M.stoneDark);
        const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 14;
        b.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r);
        b.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
        b.scale.setScalar(0.6 + Math.random() * 0.8);
        scene.add(b);
    }
});

Game.registerStructure((scene, M) => archway(scene, 2, -1, 0.5, M));

const WELL_POS = new THREE.Vector3(-9, 0, 8);
Game.registerStructure((scene, M) => {
    const g = new THREE.Group();
    const ringCount = 10;
    for (let i = 0; i < ringCount; i++) {
        const a = (i / ringCount) * Math.PI * 2;
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.5), M.stoneDark);
        block.position.set(Math.cos(a) * 1.3, 0.4, Math.sin(a) * 1.3);
        block.rotation.y = -a;
        g.add(block);
    }
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6);
    const postL = new THREE.Mesh(postGeo, M.wood); postL.position.set(-1, 1.9, 0);
    const postR = new THREE.Mesh(postGeo, M.wood); postR.position.set(1, 1.9, 0);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.15, 0.15), M.wood);
    beam.position.set(0, 2.9, 0);
    g.add(postL, postR, beam);
    g.position.copy(WELL_POS);
    scene.add(g);
});

const STATUE_POS = new THREE.Vector3(9, 0, 9);
Game.registerStructure((scene, M) => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), M.stoneDark);
    base.position.y = 0.25;
    const torso = new THREE.Mesh(jaggedBox(1.0, 1.8, 0.8), M.stone);
    torso.position.y = 1.4;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 1.1, 6), M.stone);
    arm.position.set(0.7, 1.9, 0);
    arm.rotation.z = -0.7;
    g.add(base, torso, arm);
    g.position.copy(STATUE_POS);
    g.rotation.y = -0.6;
    scene.add(g);
});

const GRAVE_POS = new THREE.Vector3(-3, 0, -16);
Game.registerStructure((scene, M) => {
    brokenColumn(scene, -2, -17, 6, 0.3, M);
    const grave = new THREE.Mesh(jaggedBox(0.7, 1.1, 0.25), M.stoneDark);
    grave.position.copy(GRAVE_POS);
    grave.position.y = 0.3;
    scene.add(grave);
    for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const stone = new THREE.Mesh(jaggedBox(0.4, 0.6 + Math.random() * 0.3, 0.15), M.stone);
        stone.position.set(GRAVE_POS.x + Math.cos(a) * 2.5, 0.25, GRAVE_POS.z + Math.sin(a) * 2.5);
        stone.rotation.y = Math.random();
        scene.add(stone);
    }
});


/* ================================================================
   CONTENT — STORY
   ================================================================ */

Game.registerQuest({
    title: 'Awaken',
    text: 'Cold stone. A sky full of unfamiliar stars. Something ahead — a broken archway — feels like it should mean something to you.',
    target: new THREE.Vector3(2, 0, -1),
    radius: 3,
    completeMsg: 'A memory stirs...',
});

Game.registerQuest({
    title: 'The Archway',
    text: 'You remember hands, not your own, stacking these stones. A voice, once. It came from the north, where water used to be.',
    target: WELL_POS,
    radius: 3,
    completeMsg: 'The well remembers you.',
    onComplete: (scene, M) => {
        const glow = new THREE.PointLight(0x6fa8ff, 1.2, 6, 2);
        glow.position.copy(WELL_POS).add(new THREE.Vector3(0, 2, 0));
        scene.add(glow);
    },
});

Game.registerQuest({
    title: 'The Well',
    text: 'A face carved in stone, arm raised toward the east, as if pointing you onward. You knew this figure once.',
    target: STATUE_POS,
    radius: 3,
    completeMsg: 'The statue\u2019s gaze softens.',
});

Game.registerQuest({
    title: 'The Statue',
    text: 'South, past the fallen tower, something waits with your name on it. You are not ready, and you go anyway.',
    target: GRAVE_POS,
    radius: 3,
    completeMsg: 'Chapter One complete \u00b7 to be continued...',
    onComplete: (scene, M) => {
        const glow = new THREE.PointLight(0xaac4ff, 1.6, 7, 2);
        glow.position.copy(GRAVE_POS).add(new THREE.Vector3(0, 1.5, 0));
        scene.add(glow);
    },
});

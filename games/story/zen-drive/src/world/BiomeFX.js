/**
 * BiomeFX
 * -------
 * Manages biome-specific particle and ambient effects. 
 * Stylized for a slightly magical, non-photorealistic look.
 */
class BiomeFX {
  constructor(scene) {
    this.scene = scene;
    this._active = null;    // id of currently running effect
    this._system = null;    // current particle system
    this._shimmerEl = null; // DOM element for heat shimmer

    // Generate lightweight procedural textures for particles once
    this._textures = {
      glow: this._createGlowTexture()
    };
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  update(biome, carPos, elapsedTime) {
    const id = biome.id;

    if (id !== this._active) {
      this._destroy();
      this._active = id;
      this._create(biome);
    }

    if (!this._system) return;
    this._tick(elapsedTime, carPos);
  }

  // ─── Create / Destroy ────────────────────────────────────────────────────

  _create(biome) {
    switch (biome.id) {
      case 'autumn':
        // Vivid, flat autumnal colors
        this._buildLeaves(0xe64a19, 0xff9800, 0xffc107); break;
      case 'blossom':
        // Stylized cherry blossoms
        this._buildLeaves(0xff80ab, 0xffb2cb, 0xffe4ed); break;
      case 'volcanic':
        this._buildEmbers(); break;
      case 'swamp':
        this._buildFireflies(); break;
      case 'desert':
        this._buildShimmer(); break;
      default:
        break;
    }
  }

  _destroy() {
    if (this._shimmerEl) {
      this._shimmerEl.remove();
      this._shimmerEl = null;
    }

    if (!this._system) return;
    const s = this._system;

    if (s.mesh) { this.scene.remove(s.mesh); s.geo.dispose(); s.mat.dispose(); }
    if (s.fireMesh) { this.scene.remove(s.fireMesh); s.fireGeo.dispose(); s.fireMat.dispose(); }

    this._system = null;
    this._active = null;
  }

  // ─── Procedural Assets ───────────────────────────────────────────────────

  _createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Creates a soft, magical orb shape instead of harsh squares
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
  }

  // ─── Leaves (Instanced Mesh - Stylized Shapes) ───────────────────────────

  _buildLeaves(...cols) {
    const MAX = 350;

    // 1. Create a stylized tear-drop/diamond leaf shape
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.3);
    shape.quadraticCurveTo(0.2, 0.1, 0, -0.3);
    shape.quadraticCurveTo(-0.2, 0.1, 0, 0.3);
    const geo = new THREE.ShapeGeometry(shape);

    // 2. Use BasicMaterial for a flat, unlit, "painterly" look
    const mat = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    // 3. InstancedMesh allows independent rotation/position in 1 draw call
    const mesh = new THREE.InstancedMesh(geo, mat, MAX);
    const dummy = new THREE.Object3D();
    const states = [];

    for (let i = 0; i < MAX; i++) {
      const color = new THREE.Color(cols[Math.floor(Math.random() * cols.length)]);
      mesh.setColorAt(i, color);

      states.push({
        pos: new THREE.Vector3((Math.random() - 0.5) * 80, Math.random() * 20, (Math.random() - 0.5) * 80),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.05, -(0.04 + Math.random() * 0.06), (Math.random() - 0.5) * 0.04),
        rot: new THREE.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        rotVel: new THREE.Vector3((Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08),
        driftSync: Math.random() * Math.PI * 2
      });
    }

    mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    this.scene.add(mesh);

    this._system = { type: 'leaves', geo, mat, mesh, states, dummy, MAX };
  }

  // ─── Embers (Magical Soft Orbs) ──────────────────────────────────────────

  _buildEmbers() {
    const MAX = 400;
    const pos = new Float32Array(MAX * 3);
    const vel = new Float32Array(MAX * 3);
    const life = new Float32Array(MAX);

    for (let i = 0; i < MAX; i++) {
      this._respawnEmber(pos, vel, life, i, true);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));

    // Outer Glow
    const mat = new THREE.PointsMaterial({
      color: 0xff3300, size: 0.8,
      map: this._textures.glow, // Soft texture
      transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const mesh = new THREE.Points(geo, mat);
    mesh.frustumCulled = false;
    this.scene.add(mesh);

    // Bright Inner Core
    const fireGeo = new THREE.BufferGeometry();
    const fireAttr = new THREE.BufferAttribute(pos.slice(), 3).setUsage(THREE.DynamicDrawUsage);
    fireGeo.setAttribute('position', fireAttr);

    const fireMat = new THREE.PointsMaterial({
      color: 0xffdd44, size: 0.35,
      map: this._textures.glow,
      transparent: true, opacity: 1.0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const fireMesh = new THREE.Points(fireGeo, fireMat);
    fireMesh.frustumCulled = false;
    this.scene.add(fireMesh);

    this._system = {
      type: 'embers', geo, mat, mesh, pos, vel, life, MAX,
      fireMesh, fireGeo, fireAttr, fireMat,
    };
  }

  _respawnEmber(pos, vel, life, i, randomY = false) {
    pos[i * 3] = (Math.random() - 0.5) * 60;
    pos[i * 3 + 1] = randomY ? Math.random() * 12 : 0.5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    vel[i * 3] = (Math.random() - 0.5) * 0.05;
    vel[i * 3 + 1] = 0.08 + Math.random() * 0.1;
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    life[i] = Math.random();
  }

  // ─── Fireflies (Bioluminescent Orbs) ─────────────────────────────────────

  _buildFireflies() {
    const MAX = 120;
    const pos = new Float32Array(MAX * 3);
    const vel = new Float32Array(MAX * 3);
    const phase = new Float32Array(MAX);

    for (let i = 0; i < MAX; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 1] = 0.5 + Math.random() * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 70;
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      phase[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));

    // Magical teal/green
    const mat = new THREE.PointsMaterial({
      color: 0x66ffcc, size: 1.2,
      map: this._textures.glow,
      transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });

    const mesh = new THREE.Points(geo, mat);
    mesh.frustumCulled = false;
    this.scene.add(mesh);

    this._system = { type: 'fireflies', geo, mat, mesh, pos, vel, phase, MAX };
  }

  // ─── Heat Shimmer (CSS - Unchanged) ──────────────────────────────────────

  _buildShimmer() {
    const el = document.createElement('div');
    el.id = 'heat-shimmer';
    el.style.cssText = [
      'position: fixed; inset: 0; pointer-events: none; z-index: 4;',
      'clip-path: inset(45% 0 0 0);',
      'animation: heatShimmer 1.8s ease-in-out infinite;',
    ].join(' ');

    if (!document.getElementById('heat-shimmer-style')) {
      const style = document.createElement('style');
      style.id = 'heat-shimmer-style';
      style.textContent = `
        @keyframes heatShimmer {
          0%   { backdrop-filter: blur(0px)   brightness(1.00); }
          30%  { backdrop-filter: blur(0.6px) brightness(1.03); }
          60%  { backdrop-filter: blur(1.1px) brightness(1.06); }
          100% { backdrop-filter: blur(0px)   brightness(1.00); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(el);
    this._shimmerEl = el;
    this._system = { type: 'shimmer' };
  }

  // ─── Tick ────────────────────────────────────────────────────────────────

  _tick(elapsedTime, carPos) {
    const s = this._system;
    if (!s || s.type === 'shimmer') return;

    if (s.mesh) s.mesh.position.set(carPos.x, 0, carPos.z);
    if (s.fireMesh) s.fireMesh.position.set(carPos.x, 0, carPos.z);

    if (s.type === 'leaves') {
      // Instanced Mesh animation block
      for (let i = 0; i < s.MAX; i++) {
        const state = s.states[i];

        // Apply wind and gravity
        state.pos.add(state.vel);
        state.pos.x += Math.sin(elapsedTime * 0.9 + state.driftSync) * 0.02;

        // Tumbling rotation
        state.rot.add(state.rotVel);

        // Respawn if hit ground
        if (state.pos.y < -2) {
          state.pos.set((Math.random() - 0.5) * 80, 18 + Math.random() * 4, (Math.random() - 0.5) * 80);
        }

        // Apply transforms to dummy object and pass to instanced mesh
        s.dummy.position.copy(state.pos);
        s.dummy.rotation.setFromVector3(state.rot);
        s.dummy.updateMatrix();
        s.mesh.setMatrixAt(i, s.dummy.matrix);
      }
      s.mesh.instanceMatrix.needsUpdate = true;
    }

    else if (s.type === 'embers') {
      const pos = s.pos;
      for (let i = 0; i < s.MAX; i++) {
        const i3 = i * 3;
        s.life[i] += 0.003;
        pos[i3] += s.vel[i3] + Math.sin(elapsedTime * 2.1 + i * 0.7) * 0.015;
        pos[i3 + 1] += s.vel[i3 + 1];
        pos[i3 + 2] += s.vel[i3 + 2];
        if (s.life[i] > 1 || pos[i3 + 1] > 18) {
          this._respawnEmber(pos, s.vel, s.life, i, false);
        }
      }
      s.geo.attributes.position.needsUpdate = true;
      s.fireAttr.array.set(pos);
      s.fireAttr.needsUpdate = true;

      // Gentle pulsing core
      s.mat.opacity = 0.6 + Math.sin(elapsedTime * 4) * 0.2;
    }

    else if (s.type === 'fireflies') {
      const pos = s.pos;
      const bound = 35;
      for (let i = 0; i < s.MAX; i++) {
        const i3 = i * 3;
        pos[i3] += s.vel[i3];
        pos[i3 + 1] += s.vel[i3 + 1] + Math.sin(elapsedTime + s.phase[i]) * 0.008;
        pos[i3 + 2] += s.vel[i3 + 2];

        // Bounce off bounds gently
        if (Math.abs(pos[i3]) > bound) s.vel[i3] *= -1;
        if (pos[i3 + 1] < 0.3) s.vel[i3 + 1] = Math.abs(s.vel[i3 + 1]);
        if (pos[i3 + 1] > 6) s.vel[i3 + 1] = -Math.abs(s.vel[i3 + 1]);
        if (Math.abs(pos[i3 + 2]) > bound) s.vel[i3 + 2] *= -1;
      }
      s.geo.attributes.position.needsUpdate = true;
      // Pulse animation for magical glowing effect
      s.mat.opacity = 0.4 + Math.sin(elapsedTime * 2) * 0.4;
    }
  }
}
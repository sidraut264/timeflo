class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.type = 'CLEAR';
    this._system = null; // Lazy-created, null until first use
  }

  // ── Lazy init: only pays cost when weather is actually used ──
  _ensureSystem() {
    if (this._system) return;

    const MAX = 800; // rain uses 800, snow uses 400 (setDrawRange)
    const pos = new Float32Array(MAX * 3);
    const vel = new Float32Array(MAX);

    for (let i = 0; i < MAX; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 70;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 70;
      vel[i]         = 0.22 + Math.random() * 0.18; // pre-baked, no runtime random needed
    }

    const geo = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(pos, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', attr);

    const rainMat = new THREE.PointsMaterial({
      color: 0x99aacc, size: 0.12,
      transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const snowMat = new THREE.PointsMaterial({
      color: 0xddeeff, size: 0.28,
      transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });

    const mesh = new THREE.Points(geo, rainMat);
    mesh.frustumCulled = false;

    this._system = { geo, attr, pos, vel, mesh, rainMat, snowMat, MAX };
    this.scene.add(mesh);
  }

  // ── Dispose: removes from scene, frees GPU memory ──
  _destroySystem() {
    if (!this._system) return;
    const { geo, mesh, rainMat, snowMat } = this._system;
    this.scene.remove(mesh);
    geo.dispose();
    rainMat.dispose();
    snowMat.dispose();
    this._system = null;
  }

  setWeather(type) {
    this.type = type;
    if (type === 'CLEAR') {
      this._destroySystem(); // Remove from scene entirely
    } else {
      this._ensureSystem();  // Allocate only now
      const s = this._system;
      s.mesh.material = type === 'RAIN' ? s.rainMat : s.snowMat;
      s.geo.setDrawRange(0, type === 'RAIN' ? s.MAX : Math.floor(s.MAX * 0.5));
    }
  }

  toggleWeather() {
    const types = ['CLEAR', 'RAIN', 'SNOW'];
    this.setWeather(types[(types.indexOf(this.type) + 1) % types.length]);
  }

  update(carPos) {
    if (this.type === 'CLEAR' || !this._system) return; // Zero cost when clear

    const s = this._system;
    s.mesh.position.set(carPos.x, 0, carPos.z);

    const pos   = s.pos;
    const vel   = s.vel;
    const count = this.type === 'RAIN' ? s.MAX : Math.floor(s.MAX * 0.5);
    const drift = this.type === 'RAIN' ? 0.14 : 0.03;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3 + 1] -= vel[i]; // fall
      pos[i3 + 2] += drift;  // wind

      if (pos[i3 + 1] < -2) { // recycle: 1 random pair per rare event
        pos[i3]     = (Math.random() - 0.5) * 70;
        pos[i3 + 1] = 40;
        pos[i3 + 2] = (Math.random() - 0.5) * 70;
      }
    }

    s.attr.needsUpdate = true;
  }
}

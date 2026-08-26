class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.type = 'CLEAR';

    // Keep particle count LOW for performance
    this.rainCount = 800;
    this.snowCount = 400;
    this.particleCount = this.rainCount; // max

    // Positions (shared buffer, resized per type)
    this._pos = new Float32Array(this.particleCount * 3);
    // Pre-baked fall speeds — avoids Math.random() every frame
    this._vel = new Float32Array(this.particleCount);

    this._initParticles(this.particleCount);

    // Geometry — single shared, we swap material
    this.geometry = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this._pos, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', this.posAttr);

    this.rainMaterial = new THREE.PointsMaterial({
      color: 0x99aacc,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.snowMaterial = new THREE.PointsMaterial({
      color: 0xddeeff,
      size: 0.25,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particleSystem = new THREE.Points(this.geometry, this.rainMaterial);
    this.particleSystem.visible = false;
    this.particleSystem.frustumCulled = false; // always render, no bounding box check
    this.scene.add(this.particleSystem);
  }

  _initParticles(count) {
    for (let i = 0; i < count; i++) {
      this._pos[i * 3]     = (Math.random() - 0.5) * 80;
      this._pos[i * 3 + 1] = Math.random() * 40;
      this._pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      this._vel[i]         = 0.25 + Math.random() * 0.25; // pre-baked fall speed
    }
  }

  setWeather(type) {
    this.type = type;
    if (type === 'CLEAR') {
      this.particleSystem.visible = false;
    } else if (type === 'RAIN') {
      this.particleSystem.material = this.rainMaterial;
      this.particleSystem.visible = true;
      // Narrow draw range to rain count
      this.geometry.setDrawRange(0, this.rainCount);
    } else if (type === 'SNOW') {
      this.particleSystem.material = this.snowMaterial;
      this.particleSystem.visible = true;
      this.geometry.setDrawRange(0, this.snowCount);
    }
  }

  toggleWeather() {
    const types = ['CLEAR', 'RAIN', 'SNOW'];
    this.setWeather(types[(types.indexOf(this.type) + 1) % types.length]);
  }

  update(carPos, speed) {
    if (this.type === 'CLEAR') return;

    // Snap particle system to player position (no per-particle world coords needed)
    this.particleSystem.position.set(carPos.x, 0, carPos.z);

    const pos   = this._pos;
    const vel   = this._vel;
    const count = this.type === 'RAIN' ? this.rainCount : this.snowCount;
    const isRain = this.type === 'RAIN';
    const wind  = isRain ? 0.15 : 0.04;
    const bound = 40; // half-box size

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3 + 1] -= vel[i];          // fall
      pos[i3 + 2] += wind;            // constant wind drift (pre-baked, no random)

      // Recycle particle back to top when it leaves the box
      if (pos[i3 + 1] < -2) {
        pos[i3]     = (Math.random() - 0.5) * 80; // one random per recycled particle (rare)
        pos[i3 + 1] = 40;
        pos[i3 + 2] = (Math.random() - 0.5) * 80;
      }
    }

    this.posAttr.needsUpdate = true;
  }
}

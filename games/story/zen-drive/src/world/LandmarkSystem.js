/**
 * LandmarkSystem
 * --------------
 * Spawns rare, large off-road structures as the car drives forward.
 * Uses a fixed pool of pre-built meshes — each is repositioned (recycled)
 * when it drifts too far behind the car, so there are never more than
 * POOL_SIZE landmark groups alive in the scene.
 *
 * Landmark types (one per pool slot, cycling):
 *   windmill   — stone tower with spinning wooden blades
 *   ruins      — scattered ancient pillars and rubble
 *   lighthouse — tall striped tower with a rotating beacon light
 *   arch       — stone gateway arch with rubble at the base
 *   obelisk    — stepped base with a tall four-sided monolith
 *   tower      — medieval round tower with merlons and arrow-slits
 */
class LandmarkSystem {
  constructor(scene, roadGenerator, terrainGenerator) {
    this.scene            = scene;
    this.roadGenerator    = roadGenerator;
    this.terrainGenerator = terrainGenerator;

    this.pool          = [];
    this.POOL_SIZE     = 12;          // 2 of each type
    this.nextSpawnZ    = null;        // initialised on first update()
    this.SPAWN_GAP_MIN = 750;
    this.SPAWN_GAP_MAX = 1300;
    this.MIN_OFFSET    = 44;          // min lateral distance from road centre
    this.MAX_OFFSET    = 110;         // max lateral distance

    // ── Shared material palette (never recreated) ───────────────────────
    this.mats = {
      stone:      new THREE.MeshStandardMaterial({ color: 0x9a8e7e, roughness: 0.92, flatShading: true }),
      stoneDark:  new THREE.MeshStandardMaterial({ color: 0x5e5448, roughness: 0.95, flatShading: true }),
      stoneLight: new THREE.MeshStandardMaterial({ color: 0xbab0a0, roughness: 0.85, flatShading: true }),
      wood:       new THREE.MeshStandardMaterial({ color: 0x5a3820, roughness: 0.85 }),
      white:      new THREE.MeshStandardMaterial({ color: 0xeeeee8, roughness: 0.55 }),
      red:        new THREE.MeshStandardMaterial({ color: 0xbb2222, roughness: 0.70 }),
      glass:      new THREE.MeshStandardMaterial({
        color: 0xaaddff, transparent: true, opacity: 0.45,
        roughness: 0.05, metalness: 0.5,
      }),
      lantern: new THREE.MeshStandardMaterial({
        color: 0xffee44, emissive: 0xffaa00, emissiveIntensity: 3.0, roughness: 0.3,
      }),
      blade:   new THREE.MeshStandardMaterial({ color: 0x8c7050, roughness: 0.8, side: THREE.DoubleSide }),
      beam:    new THREE.MeshBasicMaterial({
        color: 0xffee44, transparent: true, opacity: 0.35, side: THREE.DoubleSide,
      }),
    };

    // ── Build the pool ───────────────────────────────────────────────────
    const TYPES = ['windmill', 'ruins', 'lighthouse', 'arch', 'obelisk', 'tower'];
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const type = TYPES[i % TYPES.length];
      const lm   = this._buildLandmark(type);
      lm.visible = false;
      lm.userData.type = type;
      this.scene.add(lm);
      this.pool.push(lm);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Public API
  // ═══════════════════════════════════════════════════════════════════════

  update(carZ, biome, elapsedTime) {
    // Initialise spawn cursor relative to the car's starting position
    if (this.nextSpawnZ === null) this.nextSpawnZ = carZ + 350;

    // Spawn ahead until the horizon is seeded
    while (this.nextSpawnZ < carZ + 800) {
      this._spawnAt(this.nextSpawnZ, biome);
      const gap = this.SPAWN_GAP_MIN
        + Math.random() * (this.SPAWN_GAP_MAX - this.SPAWN_GAP_MIN);
      this.nextSpawnZ += gap;
    }

    // Recycle landmarks that have passed behind the car
    for (const lm of this.pool) {
      if (lm.visible && lm.position.z < carZ - 280) {
        lm.visible = false;
      }
    }

    // Per-frame animation
    this._animate(elapsedTime);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Placement
  // ═══════════════════════════════════════════════════════════════════════

  _spawnAt(targetZ, biome) {
    const slot = this.pool.find(lm => !lm.visible);
    if (!slot) return; // pool exhausted — skip

    const side   = Math.random() > 0.5 ? 1 : -1;
    const offset = this.MIN_OFFSET + Math.random() * (this.MAX_OFFSET - this.MIN_OFFSET);
    const roadInfo = this.roadGenerator.getRoadInfoAtZ(targetZ);
    const x = roadInfo.point.x + side * offset;
    const y = this.terrainGenerator.getTerrainHeight(x, targetZ);

    slot.position.set(x, y, targetZ);
    slot.rotation.y = Math.random() * Math.PI * 2;
    slot.visible    = true;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Animation
  // ═══════════════════════════════════════════════════════════════════════

  _animate(t) {
    for (const lm of this.pool) {
      if (!lm.visible) continue;
      if (lm.userData.blades)  lm.userData.blades.rotation.z  = t * 0.45;
      if (lm.userData.beacon)  lm.userData.beacon.rotation.y  = t * 1.6;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Builders
  // ═══════════════════════════════════════════════════════════════════════

  _buildLandmark(type) {
    switch (type) {
      case 'windmill':   return this._buildWindmill();
      case 'ruins':      return this._buildRuins();
      case 'lighthouse': return this._buildLighthouse();
      case 'arch':       return this._buildArch();
      case 'obelisk':    return this._buildObelisk();
      case 'tower':      return this._buildTower();
      default:           return this._buildRuins();
    }
  }

  // ── Windmill ─────────────────────────────────────────────────────────

  _buildWindmill() {
    const g = new THREE.Group();

    // Wide stone base
    g.add(this._mesh(new THREE.CylinderGeometry(2.0, 2.5, 2, 8), this.mats.stone, 0, 1, 0));

    // Tower body (tapers upward)
    g.add(this._mesh(new THREE.CylinderGeometry(1.1, 2.0, 11, 8), this.mats.stone, 0, 7.5, 0, true));

    // Conical wooden cap
    g.add(this._mesh(new THREE.ConeGeometry(1.3, 2.8, 8), this.mats.wood, 0, 14.4, 0));

    // Blade axle hub
    const hub = this._mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.6, 8), this.mats.wood, 0, 12, 1.15);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);

    // ---- Blade assembly (rotates) ----
    const blades = new THREE.Group();
    blades.position.set(0, 12, 1.25);

    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Group();
      arm.rotation.z = (i / 4) * Math.PI * 2;

      const spar = this._mesh(new THREE.BoxGeometry(0.14, 5.2, 0.06), this.mats.wood, 0, 2.6, 0);
      const sail = this._mesh(new THREE.BoxGeometry(1.1, 4.2, 0.05), this.mats.blade, 0.6, 2.4, 0);
      spar.add(sail);
      arm.add(spar);
      blades.add(arm);
    }
    g.add(blades);
    g.userData.blades = blades;

    // Small wooden door
    g.add(this._mesh(new THREE.BoxGeometry(0.75, 1.3, 0.12), this.mats.wood, 0, 1.65, 2.0));

    return g;
  }

  // ── Ruins ─────────────────────────────────────────────────────────────

  _buildRuins() {
    const g = new THREE.Group();

    // Scatter flat rubble blocks
    const rubblePos = [[-2.5, 1], [2, 0.8], [-0.5, 0.6], [3.5, 0.7], [-3, 0.5], [1, 0.9]];
    for (const [rx, rh] of rubblePos) {
      const w = 0.7 + Math.random() * 0.7;
      const block = this._mesh(
        new THREE.BoxGeometry(w, rh * 0.4, w * 0.9),
        this.mats.stoneDark,
        rx, rh * 0.2, (Math.random() - 0.5) * 4
      );
      block.rotation.y = Math.random() * Math.PI;
      g.add(block);
    }

    // Standing pillars of varying heights
    const pillarDefs = [
      [-3.2, 9, 0.6], [3.0, 5.5, 0.7], [0.2, 12, 0.5], [-1.8, 3.5, 0.6], [4.5, 7, 0.55],
    ];
    for (const [px, ph, pr] of pillarDefs) {
      const pillar = this._mesh(
        new THREE.CylinderGeometry(pr * 0.85, pr, ph, 7),
        this.mats.stone, px, ph / 2, (Math.random() - 0.5) * 4, true
      );
      g.add(pillar);

      // Broken capital on shorter pillars
      if (ph < 8) {
        const frag = this._mesh(
          new THREE.CylinderGeometry(pr, pr * 0.85, 0.5, 7),
          this.mats.stoneLight, px + 0.25, ph + 0.25, 0
        );
        frag.rotation.z = 0.25;
        g.add(frag);
      }
    }

    // One fallen column
    const fallen = this._mesh(new THREE.CylinderGeometry(0.45, 0.45, 5.5, 8), this.mats.stoneLight, 0.5, 0.45, 3.5);
    fallen.rotation.z = Math.PI / 2;
    g.add(fallen);

    return g;
  }

  // ── Lighthouse ────────────────────────────────────────────────────────

  _buildLighthouse() {
    const g = new THREE.Group();

    // Rock base
    g.add(this._mesh(new THREE.CylinderGeometry(3.8, 4.5, 1.5, 10), this.mats.stone, 0, 0.75, 0));

    // White tower
    g.add(this._mesh(new THREE.CylinderGeometry(1.6, 2.2, 15, 10), this.mats.white, 0, 9, 0, true));

    // Red band
    g.add(this._mesh(new THREE.CylinderGeometry(1.62, 1.62, 1.6, 10), this.mats.red, 0, 7.2, 0));

    // Gallery ledge
    g.add(this._mesh(new THREE.CylinderGeometry(2.1, 1.6, 0.4, 10), this.mats.stone, 0, 16.7, 0));

    // Glass lantern room
    g.add(this._mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.4, 8), this.mats.glass, 0, 18.1, 0));

    // Glowing lantern orb
    g.add(this._mesh(new THREE.SphereGeometry(0.55, 8, 6), this.mats.lantern, 0, 18.1, 0));

    // Point light for real illumination
    const light = new THREE.PointLight(0xffdd88, 2.5, 100);
    light.position.set(0, 18.5, 0);
    g.add(light);

    // Red domed cap
    g.add(this._mesh(new THREE.ConeGeometry(1.5, 2.0, 8), this.mats.red, 0, 20.3, 0));

    // Rotating beacon arm (light shaft plane)
    const beacon = new THREE.Group();
    beacon.position.y = 18.1;
    const beamGeo = new THREE.BoxGeometry(0.08, 0.25, 8);
    const beam = new THREE.Mesh(beamGeo, this.mats.beam);
    beam.position.z = 4;
    beacon.add(beam);
    g.add(beacon);
    g.userData.beacon = beacon;

    return g;
  }

  // ── Stone Arch ────────────────────────────────────────────────────────

  _buildArch() {
    const g = new THREE.Group();

    // Two pillars
    for (const sx of [-3.8, 3.8]) {
      g.add(this._mesh(new THREE.CylinderGeometry(0.85, 1.05, 11, 7), this.mats.stone, sx, 5.5, 0, true));
      // Capital
      g.add(this._mesh(new THREE.BoxGeometry(2.2, 0.9, 2.2), this.mats.stoneLight, sx, 11.45, 0));
    }

    // Spanning lintel
    g.add(this._mesh(new THREE.BoxGeometry(9.5, 1.4, 2.0), this.mats.stone, 0, 12.2, 0, true));

    // Keystone accent
    g.add(this._mesh(new THREE.BoxGeometry(1.3, 1.8, 2.1), this.mats.stoneLight, 0, 11.65, 0));

    // Scattered base rubble
    const rubble = [[-4, 0.6], [-2, 0.4], [2.5, 0.5], [4.5, 0.55], [0.5, 0.35], [-1, 0.45]];
    for (const [rx, rs] of rubble) {
      const b = this._mesh(
        new THREE.BoxGeometry(rs * 1.5, rs, rs * 1.2), this.mats.stoneDark,
        rx, rs / 2, (Math.random() - 0.5) * 4
      );
      b.rotation.y = Math.random() * Math.PI;
      g.add(b);
    }

    return g;
  }

  // ── Obelisk ───────────────────────────────────────────────────────────

  _buildObelisk() {
    const g = new THREE.Group();

    // Three stepped base tiers
    for (let t = 0; t < 3; t++) {
      const s = 3.8 - t * 0.7;
      g.add(this._mesh(new THREE.BoxGeometry(s, 0.65, s), this.mats.stone, 0, t * 0.65 + 0.325, 0));
    }

    // Main shaft (slightly tapered)
    g.add(this._mesh(new THREE.BoxGeometry(1.45, 15, 1.45), this.mats.stoneLight, 0, 9.45 + 1.95, 0, true));

    // Pyramidion tip
    const tip = this._mesh(new THREE.ConeGeometry(1.05, 2.8, 4), this.mats.stoneLight, 0, 19.7, 0);
    tip.rotation.y = Math.PI / 4;
    g.add(tip);

    return g;
  }

  // ── Medieval Tower ────────────────────────────────────────────────────

  _buildTower() {
    const g = new THREE.Group();

    // Wider foundation
    g.add(this._mesh(new THREE.CylinderGeometry(3.8, 4.5, 1.2, 8), this.mats.stoneDark, 0, 0.6, 0));

    // Main cylindrical body
    g.add(this._mesh(new THREE.CylinderGeometry(2.8, 3.6, 13, 8), this.mats.stone, 0, 7.6, 0, true));

    // Parapet ring
    g.add(this._mesh(new THREE.CylinderGeometry(3.0, 2.8, 0.9, 8), this.mats.stoneLight, 0, 14.45, 0));

    // Merlons (battlements teeth)
    const MERLONS = 8;
    for (let i = 0; i < MERLONS; i++) {
      const angle = (i / MERLONS) * Math.PI * 2;
      const mx = Math.sin(angle) * 2.8;
      const mz = Math.cos(angle) * 2.8;
      g.add(this._mesh(new THREE.BoxGeometry(0.75, 1.3, 0.75), this.mats.stone, mx, 15.55, mz, true));
    }

    // Arrow-slits (dark inset strips)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const sx = Math.sin(angle) * 2.85;
      const sz = Math.cos(angle) * 2.85;
      const slit = this._mesh(new THREE.BoxGeometry(0.28, 1.4, 0.12), this.mats.stoneDark, sx, 8.5, sz);
      slit.rotation.y = -angle;
      g.add(slit);
    }

    return g;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════════════════

  /** Shorthand: create a Mesh, position it, optionally add shadows. */
  _mesh(geo, mat, x = 0, y = 0, z = 0, shadow = false) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (shadow) { m.castShadow = true; m.receiveShadow = true; }
    return m;
  }

  dispose() {
    for (const lm of this.pool) {
      this.scene.remove(lm);
      lm.traverse(child => { if (child.isMesh) child.geometry.dispose(); });
    }
    for (const mat of Object.values(this.mats)) mat.dispose();
    this.pool = [];
  }
}

/**
 * TerrainGenerator
 * -----------------
 * Procedural, chunk-streamed low-poly terrain with:
 *  - Multi-octave (fractal) noise for natural-looking hills instead of flat bumps
 *  - Smooth, curved blending into the road trench (no hard seams)
 *  - Per-vertex color painting (grass / dirt / rock / snow-cap tint by height & slope)
 *  - Subtle painterly color noise so flat-shaded facets don't look uniform/plastic
 *  - Richer scenery: trees (6 types), boulders, grass tufts, and wildflowers
 *  - Gentle wind-sway animation on trees and grass for a living, breathing world
 *
 * Drop-in compatible with the original API:
 *  new TerrainGenerator(scene, roadGenerator)
 *  .setColor(hex)
 *  .getTerrainHeight(x, z)
 *  .update(carX, carZ, biome)
 *  + new: .animate(elapsedTime)  // call once per frame for wind sway
 */
class TerrainGenerator {
  constructor(scene, roadGenerator) {
    this.scene = scene;
    this.roadGenerator = roadGenerator;

    this.CHUNK_SIZE = 250;
    this.SEGMENTS = 34; // Higher resolution so the fractal detail actually reads
    this.chunks = new Map();

    this.simplex = new SimplexNoise();

    // Base terrain material — flat-shaded low-poly look, but now vertex-colored
    // so a single mesh can show grass, dirt, rock and snow without extra draw calls.
    this.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.02,
      flatShading: true,
    });

    // Palette used to tint terrain — overridden per-biome via setColor()/setPalette()
    this.palette = {
      low: new THREE.Color(0x2f4d1e),   // lush low ground near the road
      mid: new THREE.Color(0x263d18),   // base grass
      high: new THREE.Color(0x5a5347),  // exposed rock on slopes/peaks
      cap: new THREE.Color(0xeef3f7),   // snow/frost cap on the tallest peaks
      dirt: new THREE.Color(0x4a3a24),  // bare shoulder right beside the road
    };

    this.treeGroup = new THREE.Group();
    this.scene.add(this.treeGroup);
    this.trees = [];

    this.propGroup = new THREE.Group();
    this.scene.add(this.propGroup);
    this.props = [];

    this._tmpColor = new THREE.Color();

    // Shared material cache — drastically reduces WebGL state changes and
    // eliminates the per-tree material allocation that was leaking memory.
    this.mats = {
      // Trunks
      woodBrown:  new THREE.MeshStandardMaterial({ color: 0x3e2212, roughness: 0.9 }),
      woodDark:   new THREE.MeshStandardMaterial({ color: 0x221812, roughness: 0.9 }),
      woodLight:  new THREE.MeshStandardMaterial({ color: 0x5a4225, roughness: 0.9 }),
      woodRed:    new THREE.MeshStandardMaterial({ color: 0x34180c, roughness: 0.9 }),
      woodBurnt:  new THREE.MeshStandardMaterial({ color: 0x1a1515, roughness: 0.95 }),
      // Foliage
      pineLeaves: [
        new THREE.MeshStandardMaterial({ color: 0x1a3a16, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ color: 0x1e421a, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ color: 0x224a1e, roughness: 0.8 }),
      ],
      autumnLeaves: [
        new THREE.MeshStandardMaterial({ color: 0xd44a1c, roughness: 0.7, flatShading: true }),
        new THREE.MeshStandardMaterial({ color: 0xe26a1b, roughness: 0.7, flatShading: true }),
        new THREE.MeshStandardMaterial({ color: 0xef9428, roughness: 0.7, flatShading: true }),
        new THREE.MeshStandardMaterial({ color: 0xba3210, roughness: 0.7, flatShading: true }),
      ],
      cactus:       new THREE.MeshStandardMaterial({ color: 0x365e23, roughness: 0.7, flatShading: true }),
      snowPine:     new THREE.MeshStandardMaterial({ color: 0x1b301b, roughness: 0.8 }),
      snowCap:      new THREE.MeshStandardMaterial({ color: 0xedf4fa, roughness: 0.4 }),
      blossom:      new THREE.MeshStandardMaterial({ color: 0xf494b8, roughness: 0.7, flatShading: true }),
      palm:         new THREE.MeshStandardMaterial({ color: 0x22581c, roughness: 0.7, flatShading: true }),
      savannaLeaves:new THREE.MeshStandardMaterial({ color: 0x5c6b30, roughness: 0.8, flatShading: true }),
      swampLeaves:  new THREE.MeshStandardMaterial({ color: 0x2e452a, roughness: 0.9, flatShading: true }),
      // Architecture
      stone:        new THREE.MeshStandardMaterial({ color: 0x9a8e7e, roughness: 0.92, flatShading: true }),
      stoneLight:   new THREE.MeshStandardMaterial({ color: 0xbab0a0, roughness: 0.85, flatShading: true }),
      stoneDark:    new THREE.MeshStandardMaterial({ color: 0x5e5448, roughness: 0.95, flatShading: true }),
      plaster:      new THREE.MeshStandardMaterial({ color: 0xe0d8c8, roughness: 0.9 }),
      roofRed:      new THREE.MeshStandardMaterial({ color: 0xa93226, roughness: 0.8, flatShading: true }),
      roofDark:     new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.8, flatShading: true }),
      // Props
      rock:         new THREE.MeshStandardMaterial({ color: 0x6b675c, roughness: 0.95, flatShading: true }),
      grassTuft:    new THREE.MeshStandardMaterial({ color: 0x3f6b28, roughness: 0.85, flatShading: true, side: THREE.DoubleSide }),
      flowerStem:   new THREE.MeshStandardMaterial({ color: 0x3f6b28 }),
      flowerPetal: [
        new THREE.MeshStandardMaterial({ color: 0xf4d35e, flatShading: true }),
        new THREE.MeshStandardMaterial({ color: 0xee6c4d, flatShading: true }),
        new THREE.MeshStandardMaterial({ color: 0xf2f2f2, flatShading: true }),
        new THREE.MeshStandardMaterial({ color: 0xc86bd6, flatShading: true }),
      ],
    };
  }

  // Kept for backward compatibility — recolors the "mid" grass tone and
  // derives the rest of the palette from it so a single call still works.
  setColor(hexColor) {
    this.palette.mid.setHex(hexColor);
    this.palette.low.copy(this.palette.mid).offsetHSL(0, 0.05, 0.08);
    this.palette.high.copy(this.palette.mid).offsetHSL(-0.02, -0.35, 0.12);
    this.material.needsUpdate = true;
  }

  // Optional richer control: setPalette({ low, mid, high, cap, dirt })
  setPalette(colors = {}) {
    for (const key of ['low', 'mid', 'high', 'cap', 'dirt']) {
      if (colors[key] !== undefined) this.palette[key].set(colors[key]);
    }
    this.material.needsUpdate = true;
  }

  // ---- Fractal Brownian Motion: layers several noise octaves together for
  // detail that reads at both large (hills) and small (bumps, rockiness) scales.
  _fbm(x, z, octaves = 4, baseFreq = 0.003, baseAmp = 22, lacunarity = 2.15, gain = 0.5) {
    let amp = baseAmp;
    let freq = baseFreq;
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += this.simplex.noise2D(x * freq, z * freq) * amp;
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm * baseAmp * octaves * 0.7;
  }

  // Analytical terrain height for ANY (x, z) — used by both mesh generation
  // and scenery placement so trees/rocks always sit exactly on the surface.
  getTerrainHeight(x, z) {
    const roadInfo = this.roadGenerator.getRoadInfoAtZ(z);
    const distToRoad = Math.abs(x - roadInfo.point.x);

    let height = roadInfo.point.y - 0.2; // Sit just below road surface

    if (distToRoad > 11) {
      const rawH = this._fbm(x, z, 4, 0.003, 22) + this._fbm(x, z, 2, 0.02, 4);

      // Smoothstep blend (instead of linear) removes the visible crease
      // where flat shoulder used to meet rolling terrain.
      const t = Math.min(1, Math.max(0, (distToRoad - 11) / 20));
      const blend = t * t * (3 - 2 * t);

      height = Math.max(0, rawH) * blend + (roadInfo.point.y - 0.2) * (1 - blend);
    }

    return height;
  }

  // Slope estimate via finite differences — used to decide grass vs rock tint.
  _getSlope(x, z, h) {
    const e = 1.5;
    const hx = this.getTerrainHeight(x + e, z);
    const hz = this.getTerrainHeight(x, z + e);
    return (Math.abs(hx - h) + Math.abs(hz - h)) / e;
  }

  _colorForVertex(x, z, height, distToRoad, slope) {
    const c = this._tmpColor;

    // Bare dirt shoulder right beside the road
    if (distToRoad < 15) {
      const t = Math.min(1, (distToRoad - 11) / 4);
      c.copy(this.palette.dirt).lerp(this.palette.low, Math.max(0, t));
    } else if (slope > 1.1) {
      // Steep faces read as exposed rock regardless of height
      c.copy(this.palette.high);
    } else {
      // Height-based grass -> rock -> snow gradient
      const lowMid = THREE.MathUtils.smoothstep(height, -2, 8);
      c.copy(this.palette.low).lerp(this.palette.mid, lowMid);
      const midHigh = THREE.MathUtils.smoothstep(height, 14, 24);
      c.lerp(this.palette.high, midHigh);
      const cap = THREE.MathUtils.smoothstep(height, 30, 40);
      c.lerp(this.palette.cap, cap);
    }

    // Small per-vertex noise so flat-shaded facets don't look like uniform
    // plastic tiles — a classic trick for believable low-poly terrain.
    const n = this.simplex.noise2D(x * 0.08, z * 0.08) * 0.06;
    c.offsetHSL(0, 0, n);

    return c;
  }

  update(carX, carZ, biome) {
    const chunkX = Math.floor(carX / this.CHUNK_SIZE);
    const chunkZ = Math.floor(carZ / this.CHUNK_SIZE);

    const activeKeys = new Set();

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 3; dz++) {
        const cx = chunkX + dx;
        const cz = chunkZ + dz;
        const key = `${cx}_${cz}`;
        activeKeys.add(key);

        if (!this.chunks.has(key)) {
          const mesh = this.createTerrainChunk(cx, cz);
          this.scene.add(mesh);
          this.chunks.set(key, { mesh, cx, cz });
        }
      }
    }

    // Clean up distant chunks
    for (const [key, chunk] of this.chunks.entries()) {
      if (!activeKeys.has(key)) {
        this.scene.remove(chunk.mesh);
        chunk.mesh.geometry.dispose();
        this.chunks.delete(key);
      }
    }

    this.updateScenery(carZ, biome);
  }

  createTerrainChunk(cx, cz) {
    const geo = new THREE.PlaneGeometry(this.CHUNK_SIZE, this.CHUNK_SIZE, this.SEGMENTS, this.SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const worldStartX = cx * this.CHUNK_SIZE;
    const worldStartZ = cz * this.CHUNK_SIZE;

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const localX = pos.getX(i);
      const localZ = pos.getZ(i);

      const vx = localX + worldStartX + (this.CHUNK_SIZE / 2);
      const vz = localZ + worldStartZ + (this.CHUNK_SIZE / 2);

      const height = this.getTerrainHeight(vx, vz);
      const roadInfo = this.roadGenerator.getRoadInfoAtZ(vz);
      const distToRoad = Math.abs(vx - roadInfo.point.x);
      const slope = this._getSlope(vx, vz, height);

      pos.setY(i, height);
      pos.setX(i, vx);
      pos.setZ(i, vz);

      const c = this._colorForVertex(vx, vz, height, distToRoad, slope);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    return mesh;
  }

  // ---------------------------------------------------------------------
  // Trees — six styles, each built from a handful of primitives so they
  // stay cheap to instance in bulk while still reading as distinct species.
  // ---------------------------------------------------------------------
  buildTreeMesh(type, h) {
    const g = new THREE.Group();
    g.userData.swayPhase = Math.random() * Math.PI * 2;
    g.userData.swayAmount = 0.02 + Math.random() * 0.02;

    if (type === 'pine') {
      const trunkH = h * 0.22;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, trunkH, 6), this.mats.woodBrown);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      g.add(trunk);

      const crown = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const cH = h * (0.55 - (i/2) * 0.12);
        const cR = h * 0.32 * (1 - (i/2) * 0.42);
        const y  = trunkH + h * 0.24 * i;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(cR, cH, 7), this.mats.pineLeaves[i]);
        cone.position.y = y + cH / 2;
        cone.castShadow = true;
        crown.add(cone);
      }
      g.add(crown);
      g.userData.swayTarget = crown;

    } else if (type === 'autumn') {
      const trunkH = h * 0.38;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, trunkH, 6), this.mats.woodBrown);
      trunk.position.y = trunkH / 2;
      g.add(trunk);

      const col = this.mats.autumnLeaves[Math.floor(Math.random() * this.mats.autumnLeaves.length)];
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(h * 0.32, 1), col);
      foliage.position.y = trunkH + h * 0.25;
      foliage.castShadow = true;
      g.add(foliage);
      g.userData.swayTarget = foliage;

    } else if (type === 'cactus') {
      const main = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, h, 7), this.mats.cactus);
      main.position.y = h / 2;
      main.castShadow = true;
      g.add(main);
      const armCount = Math.random() > 0.4 ? 1 : 2;
      for (let i = 0; i < armCount; i++) {
        const armH = h * (0.3 + Math.random() * 0.2);
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, armH, 6), this.mats.cactus);
        const side = i === 0 ? 1 : -1;
        arm.position.set(side * 0.32, h * (0.45 + Math.random() * 0.2), 0);
        arm.rotation.z = side * 0.9;
        arm.castShadow = true;
        g.add(arm);
      }
      g.userData.swayAmount = 0.005;

    } else if (type === 'snowPine') {
      const trunkH = h * 0.2;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, trunkH, 6), this.mats.woodDark);
      trunk.position.y = trunkH / 2;
      g.add(trunk);

      const crown = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const cH = h * 0.45;
        const cR = h * 0.28 * (1 - i * 0.25);
        const y  = trunkH + h * 0.22 * i;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(cR, cH, 7), this.mats.snowPine);
        cone.position.y = y + cH / 2;
        cone.castShadow = true;
        crown.add(cone);
        const snow = new THREE.Mesh(new THREE.ConeGeometry(cR * 0.92, cH * 0.3, 7), this.mats.snowCap);
        snow.position.y = y + cH * 0.8;
        crown.add(snow);
      }
      g.add(crown);
      g.userData.swayTarget = crown;

    } else if (type === 'blossom') {
      const trunkH = h * 0.35;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, trunkH, 6), this.mats.woodRed);
      trunk.position.y = trunkH / 2;
      g.add(trunk);
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(h * 0.34, 1), this.mats.blossom);
      foliage.position.y = trunkH + h * 0.25;
      foliage.castShadow = true;
      g.add(foliage);
      g.userData.swayTarget = foliage;

    } else if (type === 'savanna') {
      // Acacia: tapered trunk, wide flat canopy
      const trunkH = h * 0.6;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, trunkH, 5), this.mats.woodLight);
      trunk.position.y = trunkH / 2;
      trunk.rotation.z = (Math.random() - 0.5) * 0.1;
      trunk.castShadow = true;
      g.add(trunk);
      const canopyH = h * 0.15;
      const canopy = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.5, h * 0.4, canopyH, 8), this.mats.savannaLeaves);
      canopy.position.y = trunkH + canopyH / 2;
      canopy.castShadow = true;
      g.add(canopy);
      g.userData.swayTarget = canopy;

    } else if (type === 'swamp') {
      // Willow: tall dark trunk, drooping foliage
      const trunkH = h * 0.7;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, trunkH, 6), this.mats.woodDark);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      g.add(trunk);
      const crown = new THREE.Group();
      const core = new THREE.Mesh(new THREE.DodecahedronGeometry(h * 0.25, 0), this.mats.swampLeaves);
      core.position.y = trunkH;
      crown.add(core);
      for (let i = 0; i < 4; i++) {
        const droop = new THREE.Mesh(new THREE.ConeGeometry(0.15, h * 0.4, 5), this.mats.swampLeaves);
        droop.position.set((Math.random() - 0.5) * h * 0.3, trunkH - h * 0.15, (Math.random() - 0.5) * h * 0.3);
        droop.rotation.x = Math.PI;
        crown.add(droop);
      }
      g.add(crown);
      g.userData.swayTarget = crown;
      g.userData.swayAmount = 0.04;

    } else if (type === 'volcanic') {
      // Burnt dead tree: jagged trunk + one branch, no leaves
      const trunkH = h * 0.6;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.25, trunkH, 5), this.mats.woodBurnt);
      trunk.position.y = trunkH / 2;
      trunk.rotation.z = (Math.random() - 0.5) * 0.2;
      trunk.castShadow = true;
      g.add(trunk);
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.1, h * 0.3, 4), this.mats.woodBurnt);
      branch.position.set(0.15, trunkH * 0.7, 0);
      branch.rotation.z = 0.8;
      branch.castShadow = true;
      g.add(branch);
      g.userData.swayAmount = 0.002;

    } else if (type === 'ruin') {
      // Build a random ruin piece (pillar, arch, or rubble)
      const r = Math.random();
      if (r < 0.4) {
        // Pillar
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(h*0.08, h*0.08, h, 6), this.mats.stone);
        pillar.position.y = h/2;
        pillar.castShadow = true;
        g.add(pillar);
        if (Math.random() > 0.5) {
          const broken = new THREE.Mesh(new THREE.CylinderGeometry(h*0.08, h*0.06, h*0.2, 6), this.mats.stoneLight);
          broken.position.set(h*0.1, h + h*0.1, 0);
          broken.rotation.z = Math.PI/2 - 0.2;
          g.add(broken);
        }
      } else if (r < 0.7) {
        // Archway
        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(h*0.08, h*0.08, h, 6), this.mats.stone);
        p1.position.set(-h*0.3, h/2, 0);
        const p2 = new THREE.Mesh(new THREE.CylinderGeometry(h*0.08, h*0.08, h, 6), this.mats.stone);
        p2.position.set(h*0.3, h/2, 0);
        const top = new THREE.Mesh(new THREE.BoxGeometry(h*0.9, h*0.15, h*0.2), this.mats.stoneDark);
        top.position.y = h;
        g.add(p1, p2, top);
      } else {
        // Rubble block
        const block = new THREE.Mesh(new THREE.BoxGeometry(h*0.6, h*0.4, h*0.5), this.mats.stoneDark);
        block.position.y = h*0.2;
        block.rotation.y = Math.random();
        g.add(block);
      }
      g.userData.swayAmount = 0; // Ruins don't sway

    } else if (type === 'house') {
      // Small village house
      const w = h * 0.8 + Math.random() * h * 0.4;
      const d = h * 0.8 + Math.random() * h * 0.4;
      const height = h * 0.6;
      
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), this.mats.plaster);
      body.position.y = height / 2;
      body.castShadow = true;
      g.add(body);
      
      const isRed = Math.random() > 0.5;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.8, height * 0.6, 4), isRed ? this.mats.roofRed : this.mats.roofDark);
      roof.position.y = height + height * 0.3;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      g.add(roof);

      // Window
      const window = new THREE.Mesh(new THREE.PlaneGeometry(h*0.2, h*0.2), this.mats.woodDark);
      window.position.set(0, height/2, d/2 + 0.01);
      g.add(window);
      
      g.userData.swayAmount = 0; // Houses don't sway

    } else {
      // Palm (default)
      const trunkH = h * 0.75;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, trunkH, 6), this.mats.woodLight);
      trunk.position.y = trunkH / 2;
      trunk.rotation.z = (Math.random() - 0.5) * 0.18;
      g.add(trunk);
      const crown = new THREE.Group();
      crown.position.y = trunkH;
      for (let i = 0; i < 6; i++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.6, 5), this.mats.palm);
        frond.rotation.y = (i / 6) * Math.PI * 2;
        frond.rotation.x = Math.PI / 2.6;
        frond.castShadow = true;
        crown.add(frond);
      }
      g.add(crown);
      g.userData.swayTarget = crown;
    }

    return g;
  }

  // ---------------------------------------------------------------------
  // Ground props — low-poly boulders and grass tufts scattered near the
  // roadside for close-up detail where trees alone would look sparse.
  // ---------------------------------------------------------------------
  buildRock() {
    const s = 0.4 + Math.random() * 0.9;
    const geo = new THREE.IcosahedronGeometry(s, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const jitter = 0.85 + Math.random() * 0.3;
      pos.setXYZ(i, pos.getX(i) * jitter, pos.getY(i) * jitter, pos.getZ(i) * jitter);
    }
    geo.computeVertexNormals();
    const rock = new THREE.Mesh(geo, this.mats.rock);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    return rock;
  }

  buildGrassTuft() {
    const g = new THREE.Group();
    const bladeCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < bladeCount; i++) {
      const bh = 0.4 + Math.random() * 0.35;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05, bh, 3), this.mats.grassTuft);
      blade.position.set((Math.random() - 0.5) * 0.25, bh / 2, (Math.random() - 0.5) * 0.25);
      blade.rotation.z = (Math.random() - 0.5) * 0.5;
      g.add(blade);
    }
    g.userData.swayAmount = 0.12;
    g.userData.swayPhase = Math.random() * Math.PI * 2;
    g.userData.swayTarget = g;
    return g;
  }

  buildFlower() {
    const col = this.mats.flowerPetal[Math.floor(Math.random() * this.mats.flowerPetal.length)];
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.3, 4), this.mats.flowerStem);
    stem.position.y = 0.15;
    g.add(stem);
    const bloom = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), col);
    bloom.position.y = 0.32;
    g.add(bloom);
    g.userData.swayAmount = 0.15;
    g.userData.swayPhase = Math.random() * Math.PI * 2;
    g.userData.swayTarget = g;
    return g;
  }

  // Dispose all geometries inside a scene-object group WITHOUT disposing
  // shared materials (they live in this.mats and are reused across all trees).
  _disposeObject(obj) {
    if (!obj) return;
    obj.traverse(child => {
      if (child.isMesh && child.geometry) child.geometry.dispose();
    });
  }

  updateScenery(carZ, biome) {
    if (this.trees.length === 0 || this.currentBiomeId !== biome.id) {
      this.currentBiomeId = biome.id;

      // Properly dispose old geometry before rebuilding
      for (const t of this.trees) { this._disposeObject(t); this.treeGroup.remove(t); }
      this.trees = [];
      for (const p of this.props) { this._disposeObject(p); this.propGroup.remove(p); }
      this.props = [];

      for (let i = 0; i < biome.treeCount; i++) {
        const h = biome.hRange[0] + Math.random() * (biome.hRange[1] - biome.hRange[0]);
        const tree = this.buildTreeMesh(biome.treeType, h);
        this.placeTree(tree, carZ - 50 + Math.random() * 800, biome);
        this.treeGroup.add(tree);
        this.trees.push(tree);
      }

      const propCount = Math.round(biome.treeCount * 1.6);
      for (let i = 0; i < propCount; i++) {
        const roll = Math.random();
        let prop;
        // Skip flowers/grass in volcanic — only dead rocks fit the mood
        if (biome.id === 'volcanic') prop = this.buildRock();
        else if (roll < 0.35) prop = this.buildRock();
        else if (roll < 0.8)  prop = this.buildGrassTuft();
        else                   prop = this.buildFlower();
        this.placeProp(prop, carZ - 50 + Math.random() * 800, biome);
        this.propGroup.add(prop);
        this.props.push(prop);
      }
    }

    // Recycle trees far behind car
    for (const tree of this.trees) {
      if (tree.position.z < carZ - 120) {
        this.placeTree(tree, carZ + 650 + Math.random() * 250, biome);
      }
    }

    // Recycle props far behind car
    for (const prop of this.props) {
      if (prop.position.z < carZ - 120) {
        this.placeProp(prop, carZ + 650 + Math.random() * 250, biome);
      }
    }
  }

  placeTree(tree, targetZ, biome) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const roadInfo = this.roadGenerator.getRoadInfoAtZ(targetZ);

    const offset = 14 + Math.random() * biome.spread;
    tree.position.x = roadInfo.point.x + side * offset;
    tree.position.z = targetZ;
    tree.position.y = this.getTerrainHeight(tree.position.x, tree.position.z);

    tree.rotation.y = Math.random() * Math.PI * 2;
    const s = 0.8 + Math.random() * 0.45;
    tree.scale.set(s, s, s);
  }

  placeProp(prop, targetZ, biome) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const roadInfo = this.roadGenerator.getRoadInfoAtZ(targetZ);

    // Bias props closer to the road than trees so the roadside reads as detailed
    const offset = 11.5 + Math.random() * (biome.spread * 0.6);
    prop.position.x = roadInfo.point.x + side * offset;
    prop.position.z = targetZ;
    prop.position.y = this.getTerrainHeight(prop.position.x, prop.position.z);

    prop.rotation.y = Math.random() * Math.PI * 2;
    const s = 0.7 + Math.random() * 0.7;
    prop.scale.set(s, s, s);
  }

  // Call once per frame with an elapsed-time value (seconds) to give trees
  // and grass a gentle, wind-blown sway. Purely cosmetic — safe to skip.
  animate(elapsedTime) {
    for (const tree of this.trees) {
      const target = tree.userData.swayTarget;
      if (!target) continue;
      const wobble = Math.sin(elapsedTime * 1.1 + tree.userData.swayPhase) * tree.userData.swayAmount;
      target.rotation.z = wobble;
      target.rotation.x = wobble * 0.5;
    }
    for (const prop of this.props) {
      const target = prop.userData.swayTarget;
      if (!target) continue;
      const wobble = Math.sin(elapsedTime * 2.2 + prop.userData.swayPhase) * prop.userData.swayAmount;
      target.rotation.z = wobble;
    }
  }
}
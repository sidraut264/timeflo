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

    this.propGroup = new THREE.Group(); // rocks, grass tufts, flowers
    this.scene.add(this.propGroup);
    this.props = [];

    this._tmpColor = new THREE.Color();
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
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, trunkH, 6), new THREE.MeshStandardMaterial({ color: 0x3e2212, roughness: 0.9 }));
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      g.add(trunk);

      const crown = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const t = i / 2;
        const cH = h * (0.55 - t * 0.12);
        const cR = h * 0.32 * (1 - t * 0.42);
        const y = trunkH + h * 0.24 * i;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(cR, cH, 7), new THREE.MeshStandardMaterial({ color: 0x1a3a16 + i * 0x040804, roughness: 0.8 }));
        cone.position.y = y + cH / 2;
        cone.castShadow = true;
        crown.add(cone);
      }
      g.add(crown);
      g.userData.swayTarget = crown;
    } else if (type === 'autumn') {
      const trunkH = h * 0.38;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, trunkH, 6), new THREE.MeshStandardMaterial({ color: 0x3a1e0d, roughness: 0.9 }));
      trunk.position.y = trunkH / 2;
      g.add(trunk);

      const foliageCols = [0xd44a1c, 0xe26a1b, 0xef9428, 0xba3210];
      const col = foliageCols[Math.floor(Math.random() * foliageCols.length)];
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(h * 0.32, 1), new THREE.MeshStandardMaterial({ color: col, roughness: 0.7, flatShading: true }));
      foliage.position.y = trunkH + h * 0.25;
      foliage.castShadow = true;
      g.add(foliage);
      g.userData.swayTarget = foliage;
    } else if (type === 'cactus') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x365e23, roughness: 0.7, flatShading: true });
      const main = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, h, 7), mat);
      main.position.y = h / 2;
      main.castShadow = true;
      g.add(main);

      // A couple of side arms for silhouette variety
      const armCount = Math.random() > 0.4 ? 1 : 2;
      for (let i = 0; i < armCount; i++) {
        const armH = h * (0.3 + Math.random() * 0.2);
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, armH, 6), mat);
        const side = i === 0 ? 1 : -1;
        arm.position.set(side * 0.32, h * (0.45 + Math.random() * 0.2), 0);
        arm.rotation.z = side * 0.9;
        arm.castShadow = true;
        g.add(arm);
      }
      g.userData.swayAmount = 0.005; // cacti barely move
    } else if (type === 'snowPine') {
      const trunkH = h * 0.2;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, trunkH, 6), new THREE.MeshStandardMaterial({ color: 0x221812, roughness: 0.9 }));
      trunk.position.y = trunkH / 2;
      g.add(trunk);

      const crown = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const cH = h * 0.45;
        const cR = h * 0.28 * (1 - i * 0.25);
        const y = trunkH + h * 0.22 * i;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(cR, cH, 7), new THREE.MeshStandardMaterial({ color: 0x1b301b, roughness: 0.8 }));
        cone.position.y = y + cH / 2;
        cone.castShadow = true;
        crown.add(cone);

        const snow = new THREE.Mesh(new THREE.ConeGeometry(cR * 0.92, cH * 0.3, 7), new THREE.MeshStandardMaterial({ color: 0xedf4fa, roughness: 0.4 }));
        snow.position.y = y + cH * 0.8;
        snow.castShadow = true;
        crown.add(snow);
      }
      g.add(crown);
      g.userData.swayTarget = crown;
    } else if (type === 'blossom') {
      const trunkH = h * 0.35;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, trunkH, 6), new THREE.MeshStandardMaterial({ color: 0x34180c, roughness: 0.9 }));
      trunk.position.y = trunkH / 2;
      g.add(trunk);

      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(h * 0.34, 1), new THREE.MeshStandardMaterial({ color: 0xf494b8, roughness: 0.7, flatShading: true }));
      foliage.position.y = trunkH + h * 0.25;
      foliage.castShadow = true;
      g.add(foliage);
      g.userData.swayTarget = foliage;
    } else { // Palm
      const trunkH = h * 0.75;
      // Slight bend for a more natural palm silhouette
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, trunkH, 6), new THREE.MeshStandardMaterial({ color: 0x5a4225, roughness: 0.9 }));
      trunk.position.y = trunkH / 2;
      trunk.rotation.z = (Math.random() - 0.5) * 0.18;
      g.add(trunk);

      const crown = new THREE.Group();
      crown.position.y = trunkH;
      const frondCount = 6;
      for (let i = 0; i < frondCount; i++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.6, 5), new THREE.MeshStandardMaterial({ color: 0x22581c, roughness: 0.7, flatShading: true }));
        frond.rotation.y = (i / frondCount) * Math.PI * 2;
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
    // Distort vertices slightly for a non-uniform boulder shape
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const jitter = 0.85 + Math.random() * 0.3;
      pos.setXYZ(i, pos.getX(i) * jitter, pos.getY(i) * jitter, pos.getZ(i) * jitter);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x6b675c, roughness: 0.95, flatShading: true });
    const rock = new THREE.Mesh(geo, mat);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    return rock;
  }

  buildGrassTuft() {
    const g = new THREE.Group();
    const bladeCount = 4 + Math.floor(Math.random() * 3);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3f6b28, roughness: 0.85, flatShading: true, side: THREE.DoubleSide });
    for (let i = 0; i < bladeCount; i++) {
      const bh = 0.4 + Math.random() * 0.35;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05, bh, 3), mat);
      blade.position.set((Math.random() - 0.5) * 0.25, bh / 2, (Math.random() - 0.5) * 0.25);
      blade.rotation.z = (Math.random() - 0.5) * 0.5;
      g.add(blade);
    }
    g.userData.swayAmount = 0.12; // grass sways more than trees
    g.userData.swayPhase = Math.random() * Math.PI * 2;
    g.userData.swayTarget = g;
    return g;
  }

  buildFlower() {
    const petalColors = [0xf4d35e, 0xee6c4d, 0xf2f2f2, 0xc86bd6];
    const col = petalColors[Math.floor(Math.random() * petalColors.length)];
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.3, 4), new THREE.MeshStandardMaterial({ color: 0x3f6b28 }));
    stem.position.y = 0.15;
    g.add(stem);
    const bloom = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshStandardMaterial({ color: col, flatShading: true }));
    bloom.position.y = 0.32;
    g.add(bloom);
    g.userData.swayAmount = 0.15;
    g.userData.swayPhase = Math.random() * Math.PI * 2;
    g.userData.swayTarget = g;
    return g;
  }

  updateScenery(carZ, biome) {
    if (this.trees.length === 0 || this.currentBiomeId !== biome.id) {
      this.currentBiomeId = biome.id;
      for (const t of this.trees) this.treeGroup.remove(t);
      this.trees = [];
      for (const p of this.props) this.propGroup.remove(p);
      this.props = [];

      for (let i = 0; i < biome.treeCount; i++) {
        const h = biome.hRange[0] + Math.random() * (biome.hRange[1] - biome.hRange[0]);
        const tree = this.buildTreeMesh(biome.treeType, h);
        this.placeTree(tree, carZ - 50 + Math.random() * 800, biome);
        this.treeGroup.add(tree);
        this.trees.push(tree);
      }

      // Ground clutter — roughly 1.6x the tree count, closer to the road
      const propCount = Math.round(biome.treeCount * 1.6);
      for (let i = 0; i < propCount; i++) {
        const roll = Math.random();
        let prop;
        if (roll < 0.35) prop = this.buildRock();
        else if (roll < 0.8) prop = this.buildGrassTuft();
        else prop = this.buildFlower();
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
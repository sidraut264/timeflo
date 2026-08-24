class TerrainGenerator {
  constructor(scene, roadGenerator) {
    this.scene = scene;
    this.roadGenerator = roadGenerator;
    
    this.CHUNK_SIZE = 250;
    this.SEGMENTS = 25; // Clean low-poly resolution
    this.chunks = new Map();
    
    this.simplex = new SimplexNoise();
    this.material = new THREE.MeshStandardMaterial({ 
      color: 0x263d18,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });

    this.treeGroup = new THREE.Group();
    this.scene.add(this.treeGroup);
    this.trees = [];
  }

  setColor(hexColor) {
    this.material.color.setHex(hexColor);
  }

  // Analytical terrain height calculation for ANY (x, z)
  getTerrainHeight(x, z) {
    const roadInfo = this.roadGenerator.getRoadInfoAtZ(z);
    const distToRoad = Math.abs(x - roadInfo.point.x);

    let height = roadInfo.point.y - 0.2; // Sit just below road surface

    if (distToRoad > 11) { // 11 units flat width around road
      const n1 = this.simplex.noise2D(x * 0.003, z * 0.003) * 22;
      const n2 = this.simplex.noise2D(x * 0.015, z * 0.015) * 6;
      const rawH = n1 + n2;

      // Smooth blend out of road trench
      const blend = Math.min(1.0, (distToRoad - 11) / 18);
      height = Math.max(0, rawH) * blend + (roadInfo.point.y * (1 - blend));
    }

    return height;
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

    // Update trees
    this.updateScenery(carZ, biome);
  }

  createTerrainChunk(cx, cz) {
    const geo = new THREE.PlaneGeometry(this.CHUNK_SIZE, this.CHUNK_SIZE, this.SEGMENTS, this.SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const worldStartX = cx * this.CHUNK_SIZE;
    const worldStartZ = cz * this.CHUNK_SIZE;

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const localX = pos.getX(i);
      const localZ = pos.getZ(i);

      const vx = localX + worldStartX + (this.CHUNK_SIZE / 2);
      const vz = localZ + worldStartZ + (this.CHUNK_SIZE / 2);

      const height = this.getTerrainHeight(vx, vz);

      pos.setY(i, height);
      pos.setX(i, vx);
      pos.setZ(i, vz);
    }

    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.receiveShadow = true;
    return mesh;
  }

  buildTreeMesh(type, h) {
    const g = new THREE.Group();
    
    if (type === 'pine') {
      const trunkH = h * 0.22;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, trunkH, 6), new THREE.MeshStandardMaterial({ color: 0x3e2212, roughness: 0.9 }));
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      g.add(trunk);
      
      for (let i = 0; i < 3; i++) {
        const t = i / 2;
        const cH = h * (0.55 - t * 0.12);
        const cR = h * 0.32 * (1 - t * 0.42);
        const y = trunkH + h * 0.24 * i;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(cR, cH, 7), new THREE.MeshStandardMaterial({ color: 0x1a3a16 + i * 0x040804, roughness: 0.8 }));
        cone.position.y = y + cH / 2;
        cone.castShadow = true;
        g.add(cone);
      }
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
    } else if (type === 'cactus') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x365e23, roughness: 0.7, flatShading: true });
      const main = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, h, 7), mat);
      main.position.y = h / 2;
      main.castShadow = true;
      g.add(main);
    } else if (type === 'snowPine') {
      const trunkH = h * 0.2;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, trunkH, 6), new THREE.MeshStandardMaterial({ color: 0x221812, roughness: 0.9 }));
      trunk.position.y = trunkH / 2;
      g.add(trunk);
      
      for (let i = 0; i < 3; i++) {
        const cH = h * 0.45;
        const cR = h * 0.28 * (1 - i * 0.25);
        const y = trunkH + h * 0.22 * i;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(cR, cH, 7), new THREE.MeshStandardMaterial({ color: 0x1b301b, roughness: 0.8 }));
        cone.position.y = y + cH / 2;
        cone.castShadow = true;
        g.add(cone);

        const snow = new THREE.Mesh(new THREE.ConeGeometry(cR * 0.92, cH * 0.3, 7), new THREE.MeshStandardMaterial({ color: 0xedf4fa, roughness: 0.4 }));
        snow.position.y = y + cH * 0.8;
        snow.castShadow = true;
        g.add(snow);
      }
    } else if (type === 'blossom') {
      const trunkH = h * 0.35;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, trunkH, 6), new THREE.MeshStandardMaterial({ color: 0x34180c, roughness: 0.9 }));
      trunk.position.y = trunkH / 2;
      g.add(trunk);
      
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(h * 0.34, 1), new THREE.MeshStandardMaterial({ color: 0xf494b8, roughness: 0.7, flatShading: true }));
      foliage.position.y = trunkH + h * 0.25;
      foliage.castShadow = true;
      g.add(foliage);
    } else { // Palm
      const trunkH = h * 0.75;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, trunkH, 6), new THREE.MeshStandardMaterial({ color: 0x5a4225, roughness: 0.9 }));
      trunk.position.y = trunkH / 2;
      g.add(trunk);
      
      const crown = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0x22581c, roughness: 0.7, flatShading: true }));
      crown.position.y = trunkH;
      g.add(crown);
    }

    return g;
  }

  updateScenery(carZ, biome) {
    if (this.trees.length === 0 || this.currentBiomeId !== biome.id) {
      this.currentBiomeId = biome.id;
      for (const t of this.trees) this.treeGroup.remove(t);
      this.trees = [];

      for (let i = 0; i < biome.treeCount; i++) {
        const h = biome.hRange[0] + Math.random() * (biome.hRange[1] - biome.hRange[0]);
        const tree = this.buildTreeMesh(biome.treeType, h);
        
        this.placeTree(tree, carZ - 50 + Math.random() * 800, biome);
        this.treeGroup.add(tree);
        this.trees.push(tree);
      }
    }

    // Recycle trees far behind car
    for (const tree of this.trees) {
      if (tree.position.z < carZ - 120) {
        this.placeTree(tree, carZ + 650 + Math.random() * 250, biome);
      }
    }
  }

  placeTree(tree, targetZ, biome) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const roadInfo = this.roadGenerator.getRoadInfoAtZ(targetZ);
    
    const offset = 14 + Math.random() * biome.spread;
    tree.position.x = roadInfo.point.x + side * offset;
    tree.position.z = targetZ;
    
    // Height matching exact terrain formula
    tree.position.y = this.getTerrainHeight(tree.position.x, tree.position.z);
    
    tree.rotation.y = Math.random() * Math.PI * 2;
    const s = 0.8 + Math.random() * 0.45;
    tree.scale.set(s, s, s);
  }
}

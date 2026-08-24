class RoadGenerator {
  constructor(scene) {
    this.scene = scene;
    this.ROAD_WIDTH = 10;
    this.CHUNK_LEN = 200; // Chunk length
    this.VISIBLE_CHUNKS = 6;
    
    this.chunks = [];
    this.currentChunkZ = 0;

    // Materials
    this.roadMat = new THREE.MeshStandardMaterial({ 
      color: 0x242426, 
      roughness: 0.85,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    this.lineMat = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      side: THREE.DoubleSide
    });

    this.dashMat = new THREE.MeshBasicMaterial({ 
      color: 0xf0e6c0,
      side: THREE.DoubleSide
    });

    // Seed initial road chunks
    for (let i = 0; i < this.VISIBLE_CHUNKS; i++) {
      this.buildNextChunk();
    }
  }

  setColors(roadHex, dashHex) {
    this.roadMat.color.setHex(roadHex);
    this.dashMat.color.setHex(dashHex);
  }

  // Analytical 3D Curve Equations - Continuous for all Z!
  getRoadInfoAtZ(z) {
    // Smooth serpentine curves and gentle hills
    const x = Math.sin(z * 0.006) * 32.0 + Math.cos(z * 0.0025) * 18.0;
    const y = Math.sin(z * 0.004) * 3.5;

    // Derivative (Tangent)
    const dx = Math.cos(z * 0.006) * 0.192 - Math.sin(z * 0.0025) * 0.045;
    const dy = Math.cos(z * 0.004) * 0.014;
    const dz = 1.0;

    const tangent = new THREE.Vector3(dx, dy, dz).normalize();
    const point = new THREE.Vector3(x, y, z);

    return { point, tangent };
  }

  buildNextChunk() {
    const startZ = this.currentChunkZ;
    const endZ = startZ + this.CHUNK_LEN;
    this.currentChunkZ = endZ;

    const steps = 40;
    const positions = [];
    const uvs = [];
    const indices = [];

    const UP = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= steps; i++) {
      const z = startZ + (i / steps) * this.CHUNK_LEN;
      const { point, tangent } = this.getRoadInfoAtZ(z);

      // Right vector perpendicular to tangent and UP
      const right = new THREE.Vector3().crossVectors(tangent, UP).normalize();

      const leftVert = point.clone().sub(right.clone().multiplyScalar(this.ROAD_WIDTH * 0.5));
      const rightVert = point.clone().add(right.clone().multiplyScalar(this.ROAD_WIDTH * 0.5));

      // Small elevation offset to prevent z-fighting
      leftVert.y += 0.08;
      rightVert.y += 0.08;

      positions.push(leftVert.x, leftVert.y, leftVert.z);
      positions.push(rightVert.x, rightVert.y, rightVert.z);

      uvs.push(0, (i / steps) * 4);
      uvs.push(1, (i / steps) * 4);

      if (i < steps) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(geo, this.roadMat);
    roadMesh.receiveShadow = true;

    // Center dash marks
    const dashGroup = new THREE.Group();
    const numDashes = 12;
    for (let d = 0; d < numDashes; d++) {
      const zDash = startZ + (d / numDashes) * this.CHUNK_LEN;
      const { point, tangent } = this.getRoadInfoAtZ(zDash);

      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 2.4), this.dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(point.x, point.y + 0.1, point.z);

      const yaw = Math.atan2(tangent.x, tangent.z);
      dash.rotation.z = -yaw;
      dashGroup.add(dash);
    }

    const chunkGroup = new THREE.Group();
    chunkGroup.add(roadMesh);
    chunkGroup.add(dashGroup);

    this.scene.add(chunkGroup);

    this.chunks.push({
      group: chunkGroup,
      geo,
      startZ,
      endZ
    });
  }

  update(carZ) {
    const lastChunk = this.chunks[this.chunks.length - 1];

    // Spawn new chunk when car gets close to the end
    if (carZ + 450 > lastChunk.endZ) {
      this.buildNextChunk();
    }

    // Clean up old chunks far behind
    if (this.chunks.length > 0 && this.chunks[0].endZ < carZ - 200) {
      const old = this.chunks.shift();
      this.scene.remove(old.group);
      old.geo.dispose();
    }
  }
}

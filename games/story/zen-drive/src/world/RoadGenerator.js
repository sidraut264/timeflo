/**
 * RoadGenerator
 * Procedurally streams an endless road along an analytic 3D curve.
 *
 * Perf changes vs. the original version (net effect: fewer draw calls and
 * less per-chunk GC churn, not more):
 *
 *  1. Lane dashes and edge lines were each built as one Mesh+Geometry PER
 *     MARK (up to 12 dash meshes/chunk, no edge lines at all even though
 *     `lineMat` existed unused). They're now each a single merged
 *     BufferGeometry -> 1 draw call apiece. With VISIBLE_CHUNKS = 6 that's
 *     ~18 draw calls total for the whole road system instead of ~78.
 *  2. The hot vertex loops no longer allocate THREE.Vector3 per vertex.
 *     Since world "up" is always (0,1,0), right = normalize(cross(tangent, up))
 *     reduces to the closed form normalize(-tangent.z, 0, tangent.x), so the
 *     geometry builders just work with plain numbers.
 *  3. computeVertexNormals() now only runs on the road surface -- the only
 *     material that's actually lit (MeshStandardMaterial). The marking
 *     meshes use MeshBasicMaterial, which ignores normals entirely, so
 *     computing them for 12+ tiny planes every chunk was wasted work.
 *  4. getRoadInfoAtZ(z) keeps its original public shape (point/tangent as
 *     THREE.Vector3) so any existing car or camera code that calls it keeps
 *     working unchanged. The new zero-allocation math lives in the private
 *     _frameAtZ(z), which the geometry builders use directly.
 *
 * Visual additions:
 *  - Solid edge lines along both road shoulders (the previously unused
 *    `lineMat` now actually gets used).
 *  - Subtle curvature-driven banking (superelevation) on turns, computed
 *    analytically from the curve's second derivative. It's cosmetic only
 *    and computed at chunk-build time, so it costs nothing per frame.
 */
class RoadGenerator {
  constructor(scene, options = {}) {
    this.scene = scene;

    this.ROAD_WIDTH = options.roadWidth ?? 10;
    this.CHUNK_LEN = options.chunkLength ?? 200;
    this.CHUNK_STEPS = options.chunkSteps ?? 40;
    this.VISIBLE_CHUNKS = options.visibleChunks ?? 6;
    this.DASHES_PER_CHUNK = options.dashesPerChunk ?? 12;
    this.DASH_LENGTH = options.dashLength ?? 2.4;
    this.DASH_WIDTH = options.dashWidth ?? 0.2;
    this.EDGE_WIDTH = options.edgeWidth ?? 0.25;
    this.MAX_BANK_ANGLE = options.maxBankAngle ?? 0.15; // ~8.6°, cosmetic cap
    this.BANK_FACTOR = options.bankFactor ?? 60;

    this.chunks = [];
    this.currentChunkZ = 0;

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

    for (let i = 0; i < this.VISIBLE_CHUNKS; i++) {
      this.buildNextChunk();
    }
  }

  setColors(roadHex, dashHex) {
    this.roadMat.color.setHex(roadHex);
    this.dashMat.color.setHex(dashHex);
  }

  /**
   * Zero-allocation frame computation used internally by the geometry
   * builders (called ~40-80 times per chunk build). Returns plain numbers,
   * not Vector3s.
   */
  _frameAtZ(z) {
    // Smooth serpentine curves and gentle hills (unchanged from original).
    const x = Math.sin(z * 0.006) * 32.0 + Math.cos(z * 0.0025) * 18.0;
    const y = Math.sin(z * 0.004) * 3.5;

    const dx = Math.cos(z * 0.006) * 0.192 - Math.sin(z * 0.0025) * 0.045;
    const dy = Math.cos(z * 0.004) * 0.014;
    const dz = 1.0;

    const tLen = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const tx = dx / tLen, ty = dy / tLen, tz = dz / tLen;

    // right = normalize(cross(tangent, (0,1,0))) = normalize(-tz, 0, tx).
    // Valid as long as the road isn't vertical, which it never is here.
    const rLen = Math.sqrt(tz * tz + tx * tx) || 1;
    const rx = -tz / rLen, rz = tx / rLen;

    // Curvature-driven banking: d²x/dz², clamped to a subtle max angle.
    const d2x = -0.001152 * Math.sin(z * 0.006) - 0.0001125 * Math.cos(z * 0.0025);
    let bank = -d2x * this.BANK_FACTOR;
    if (bank > this.MAX_BANK_ANGLE) bank = this.MAX_BANK_ANGLE;
    else if (bank < -this.MAX_BANK_ANGLE) bank = -this.MAX_BANK_ANGLE;

    return { x, y, z, tx, ty, tz, rx, rz, bank };
  }

  /**
   * Public API — same return shape as the original (THREE.Vector3 point
   * and tangent), so existing car-follow / camera-rig code keeps working.
   */
  getRoadInfoAtZ(z) {
    const f = this._frameAtZ(z);
    return {
      point: new THREE.Vector3(f.x, f.y, f.z),
      tangent: new THREE.Vector3(f.tx, f.ty, f.tz)
    };
  }

  buildNextChunk() {
    const startZ = this.currentChunkZ;
    this.currentChunkZ += this.CHUNK_LEN;

    const roadGeo = this._buildRoadSurface(startZ);
    const edgeGeo = this._buildEdgeLines(startZ);
    const dashGeo = this._buildDashes(startZ);

    const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
    roadMesh.receiveShadow = true;
    const edgeMesh = new THREE.Mesh(edgeGeo, this.lineMat);
    const dashMesh = new THREE.Mesh(dashGeo, this.dashMat);

    const chunkGroup = new THREE.Group();
    chunkGroup.add(roadMesh, edgeMesh, dashMesh);
    this.scene.add(chunkGroup);

    this.chunks.push({
      group: chunkGroup,
      geometries: [roadGeo, edgeGeo, dashGeo],
      startZ,
      endZ: startZ + this.CHUNK_LEN
    });
  }

  _buildRoadSurface(startZ) {
    const steps = this.CHUNK_STEPS;
    const halfW = this.ROAD_WIDTH * 0.5;
    const positions = new Float32Array((steps + 1) * 2 * 3);
    const uvs = new Float32Array((steps + 1) * 2 * 2);
    const indices = new Uint32Array(steps * 6);

    let pi = 0, ui = 0, ii = 0;
    for (let i = 0; i <= steps; i++) {
      const z = startZ + (i / steps) * this.CHUNK_LEN;
      const f = this._frameAtZ(z);
      const bankOffset = Math.sin(f.bank) * halfW;

      const lx = f.x - f.rx * halfW, lz = f.z - f.rz * halfW;
      const rx = f.x + f.rx * halfW, rz = f.z + f.rz * halfW;

      positions[pi++] = lx; positions[pi++] = f.y + 0.08 - bankOffset; positions[pi++] = lz;
      positions[pi++] = rx; positions[pi++] = f.y + 0.08 + bankOffset; positions[pi++] = rz;

      const v = (i / steps) * 4;
      uvs[ui++] = 0; uvs[ui++] = v;
      uvs[ui++] = 1; uvs[ui++] = v;

      if (i < steps) {
        const base = i * 2;
        indices[ii++] = base; indices[ii++] = base + 1; indices[ii++] = base + 2;
        indices[ii++] = base + 1; indices[ii++] = base + 3; indices[ii++] = base + 2;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals(); // only the lit surface needs this
    return geo;
  }

  /** Both shoulder lines merged into a single draw call. */
  _buildEdgeLines(startZ) {
    const steps = this.CHUNK_STEPS;
    const halfW = this.ROAD_WIDTH * 0.5;
    const halfEdge = this.EDGE_WIDTH * 0.5;
    const vertsPerSide = (steps + 1) * 2;
    const positions = new Float32Array(vertsPerSide * 2 * 3);
    const uvs = new Float32Array(vertsPerSide * 2 * 2);
    const indices = new Uint32Array(steps * 6 * 2);

    let pi = 0, ui = 0, ii = 0, vBase = 0;

    for (const side of [-1, 1]) {
      const centerOffset = side * (halfW - halfEdge); // flush with the road edge
      for (let i = 0; i <= steps; i++) {
        const z = startZ + (i / steps) * this.CHUNK_LEN;
        const f = this._frameAtZ(z);
        const bankOffset = Math.sin(f.bank) * centerOffset;

        const cx = f.x + f.rx * centerOffset, cz = f.z + f.rz * centerOffset;
        const y = f.y + 0.09 + bankOffset;

        const ax = cx - f.rx * halfEdge, az = cz - f.rz * halfEdge;
        const bx = cx + f.rx * halfEdge, bz = cz + f.rz * halfEdge;

        positions[pi++] = ax; positions[pi++] = y; positions[pi++] = az;
        positions[pi++] = bx; positions[pi++] = y; positions[pi++] = bz;

        const v = (i / steps) * 4;
        uvs[ui++] = 0; uvs[ui++] = v;
        uvs[ui++] = 1; uvs[ui++] = v;

        if (i < steps) {
          const base = vBase + i * 2;
          indices[ii++] = base; indices[ii++] = base + 1; indices[ii++] = base + 2;
          indices[ii++] = base + 1; indices[ii++] = base + 3; indices[ii++] = base + 2;
        }
      }
      vBase += vertsPerSide;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    return geo;
  }

  /** All center dashes in a chunk merged into a single draw call. */
  _buildDashes(startZ) {
    const n = this.DASHES_PER_CHUNK;
    const halfLen = this.DASH_LENGTH * 0.5;
    const halfWidth = this.DASH_WIDTH * 0.5;
    const positions = new Float32Array(n * 4 * 3);
    const uvs = new Float32Array(n * 4 * 2);
    const indices = new Uint32Array(n * 6);

    let pi = 0, ui = 0, ii = 0;
    for (let d = 0; d < n; d++) {
      const z = startZ + (d / n) * this.CHUNK_LEN;
      const f = this._frameAtZ(z);
      const y = f.y + 0.1;

      // Quad extends +/- halfLen along tangent, +/- halfWidth along right.
      const p0x = f.x - f.tx * halfLen - f.rx * halfWidth, p0z = f.z - f.tz * halfLen - f.rz * halfWidth;
      const p1x = f.x - f.tx * halfLen + f.rx * halfWidth, p1z = f.z - f.tz * halfLen + f.rz * halfWidth;
      const p2x = f.x + f.tx * halfLen - f.rx * halfWidth, p2z = f.z + f.tz * halfLen - f.rz * halfWidth;
      const p3x = f.x + f.tx * halfLen + f.rx * halfWidth, p3z = f.z + f.tz * halfLen + f.rz * halfWidth;

      positions[pi++] = p0x; positions[pi++] = y; positions[pi++] = p0z;
      positions[pi++] = p1x; positions[pi++] = y; positions[pi++] = p1z;
      positions[pi++] = p2x; positions[pi++] = y; positions[pi++] = p2z;
      positions[pi++] = p3x; positions[pi++] = y; positions[pi++] = p3z;

      uvs[ui++] = 0; uvs[ui++] = 0;
      uvs[ui++] = 1; uvs[ui++] = 0;
      uvs[ui++] = 0; uvs[ui++] = 1;
      uvs[ui++] = 1; uvs[ui++] = 1;

      const base = d * 4;
      indices[ii++] = base; indices[ii++] = base + 1; indices[ii++] = base + 2;
      indices[ii++] = base + 1; indices[ii++] = base + 3; indices[ii++] = base + 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    return geo;
  }

  update(carZ) {
    const lastChunk = this.chunks[this.chunks.length - 1];

    if (carZ + 450 > lastChunk.endZ) {
      this.buildNextChunk();
    }

    if (this.chunks.length > 0 && this.chunks[0].endZ < carZ - 200) {
      const old = this.chunks.shift();
      this.scene.remove(old.group);
      for (const geo of old.geometries) geo.dispose();
    }
  }

  /** Full teardown, e.g. when leaving the scene / restarting the game. */
  dispose() {
    for (const chunk of this.chunks) {
      this.scene.remove(chunk.group);
      for (const geo of chunk.geometries) geo.dispose();
    }
    this.chunks.length = 0;
    this.roadMat.dispose();
    this.lineMat.dispose();
    this.dashMat.dispose();
  }
}
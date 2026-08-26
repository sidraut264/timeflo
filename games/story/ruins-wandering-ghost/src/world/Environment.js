import { THREE } from "../core/Renderer.js";

// ---------------------------------------------------------------------------
//  1. Shared Height Function (Single Source of Truth)
// ---------------------------------------------------------------------------

// Simple value noise (3D)
function hash3(p) {
    const x = p.x * 127.1 + p.y * 311.7 + p.z * 74.7;
    const y = p.x * 269.5 + p.y * 183.3 + p.z * 246.1;
    const z = p.x * 113.5 + p.y * 271.9 + p.z * 124.6;
    return new THREE.Vector3(
        Math.sin(x) * 43758.5453123 % 1,
        Math.sin(y) * 43758.5453123 % 1,
        Math.sin(z) * 43758.5453123 % 1
    );
}

function smoothNoise(p) {
    const i = new THREE.Vector3(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
    const f = new THREE.Vector3(p.x - i.x, p.y - i.y, p.z - i.z);
    const u = f.clone().multiplyScalar(f.x * (3 - 2 * f.x));
    const c000 = hash3(i);
    const c100 = hash3(i.clone().add(new THREE.Vector3(1, 0, 0)));
    const c010 = hash3(i.clone().add(new THREE.Vector3(0, 1, 0)));
    const c110 = hash3(i.clone().add(new THREE.Vector3(1, 1, 0)));
    const c001 = hash3(i.clone().add(new THREE.Vector3(0, 0, 1)));
    const c101 = hash3(i.clone().add(new THREE.Vector3(1, 0, 1)));
    const c011 = hash3(i.clone().add(new THREE.Vector3(0, 1, 1)));
    const c111 = hash3(i.clone().add(new THREE.Vector3(1, 1, 1)));
    const interp = (a, b, t) => a + (b - a) * t;
    const x1 = interp(c000.x, c100.x, u.x);
    const x2 = interp(c010.x, c110.x, u.x);
    const x3 = interp(c001.x, c101.x, u.x);
    const x4 = interp(c011.x, c111.x, u.x);
    const y1 = interp(x1, x2, u.y);
    const y2 = interp(x3, x4, u.y);
    return interp(y1, y2, u.z);
}

function fbm(p, octaves = 5) {
    let value = 0, amplitude = 0.5, frequency = 1;
    for (let i = 0; i < octaves; i++) {
        value += amplitude * smoothNoise(p.clone().multiplyScalar(frequency));
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// The ONE height function used everywhere
export function getTerrainHeight(x, z) {
    const p = new THREE.Vector3(x * 0.08, 0, z * 0.08);
    const h = fbm(p, 5) * 0.8 + 0.2 * Math.sin(x * 0.05) * Math.cos(z * 0.06);
    return (h - 0.4) * 1.2; // scale to reasonable meters
}

// ---------------------------------------------------------------------------
//  2. Build the full environment (fixed)
// ---------------------------------------------------------------------------
export function buildEnvironment(scene) {
    // 2a. Atmosphere & Fog
    const fogColor = 0x0b0f1a;
    scene.fog = new THREE.FogExp2(fogColor, 0.018);
    scene.background = new THREE.Color(fogColor);

    // 2b. Lighting
    scene.add(new THREE.AmbientLight(0x334066, 0.4));
    scene.add(new THREE.HemisphereLight(0x6b7fa0, 0x2a2f1a, 0.6));

    const moon = new THREE.DirectionalLight(0x9fb3ff, 1.2);
    moon.position.set(-30, 40, -20);
    moon.castShadow = true;
    moon.shadow.mapSize.width = 2048;
    moon.shadow.mapSize.height = 2048;
    moon.shadow.camera.near = 0.5;
    moon.shadow.camera.far = 150;
    moon.shadow.camera.left = -60;
    moon.shadow.camera.right = 60;
    moon.shadow.camera.top = 60;
    moon.shadow.camera.bottom = -60;
    moon.shadow.bias = -0.001;
    scene.add(moon);
    const fillLight = new THREE.DirectionalLight(0x5577aa, 0.3);
    fillLight.position.set(20, 10, 30);
    scene.add(fillLight);

    // Moon mesh
    const moonMesh = new THREE.Mesh(
        new THREE.SphereGeometry(6, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xdfe6ff })
    );
    moonMesh.position.copy(moon.position).multiplyScalar(3);
    scene.add(moonMesh);

    // 2c. Sky dome (quick gradient)
    const skyGeo = new THREE.SphereGeometry(200, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: {
            uColorTop: { value: new THREE.Color(0x0b0f1a) },
            uColorBottom: { value: new THREE.Color(0x1a2030) }
        },
        vertexShader: `
            varying vec3 vWorldPos;
            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColorTop;
            uniform vec3 uColorBottom;
            varying vec3 vWorldPos;
            void main() {
                float h = normalize(vWorldPos).y;
                float t = smoothstep(-0.1, 0.4, h);
                gl_FragColor = vec4(mix(uColorBottom, uColorTop, t), 1.0);
            }
        `,
        side: THREE.BackSide,
        depthWrite: false
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Fog Boundary Ring (visualizes the edge of the map)
    const ringGeo = new THREE.CylinderGeometry(68, 68, 30, 64, 1, true);
    const ringMat = new THREE.ShaderMaterial({
        uniforms: {
            uFogColor: { value: new THREE.Color(fogColor) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uFogColor;
            varying vec2 vUv;
            void main() {
                // Fade out at the top of the cylinder
                float alpha = smoothstep(1.0, 0.0, vUv.y);
                gl_FragColor = vec4(uFogColor, alpha * 0.95);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const fogRing = new THREE.Mesh(ringGeo, ringMat);
    fogRing.position.y = 10;
    scene.add(fogRing);

    // 2d. Stars (twinkling via shader)
    const starCount = 1200;
    const starPos = new Float32Array(starCount * 3);
    const starSize = new Float32Array(starCount);
    const starPhase = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
        const r = 180 + Math.random() * 80;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 0.9);
        starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPos[i * 3 + 1] = r * Math.cos(phi) + 20;
        starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        starSize[i] = 0.3 + Math.random() * 0.9;
        starPhase[i] = Math.random() * Math.PI * 2;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSize, 1));
    starGeo.setAttribute('phase', new THREE.BufferAttribute(starPhase, 1));

    const starMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
            attribute float size;
            attribute float phase;
            uniform float uTime;
            varying float vAlpha;
            void main() {
                vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (120.0 / -mvPos.z);
                gl_Position = projectionMatrix * mvPos;
                vAlpha = 0.6 + 0.4 * sin(uTime * 0.8 + phase);
            }
        `,
        fragmentShader: `
            varying float vAlpha;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                gl_FragColor = vec4(0.9, 0.95, 1.0, smoothstep(0.5, 0.0, d) * vAlpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // -----------------------------------------------------------------------
    //  3. TERRAIN – using getTerrainHeight
    // -----------------------------------------------------------------------
    const groundSize = 140, segments = 80;
    const geo = new THREE.PlaneGeometry(groundSize, groundSize, segments, segments);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = [];
    const colorGrass = new THREE.Color(0x3a4a2a);
    const colorGrassLight = new THREE.Color(0x5a6a3a);
    const colorDirt = new THREE.Color(0x5a4a3a);
    const colorRock = new THREE.Color(0x6a5a4a);

    // First pass: set Y positions
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        pos.setY(i, getTerrainHeight(x, z));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    // Second pass: vertex colours (height + slope)
    const tempVec = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y = pos.getY(i);

        // Sample nearby to get slope
        const dx = getTerrainHeight(x + 0.5, z) - getTerrainHeight(x - 0.5, z);
        const dz = getTerrainHeight(x, z + 0.5) - getTerrainHeight(x, z - 0.5);
        const slope = Math.sqrt(dx * dx + dz * dz);

        // Height factor (0–1)
        const hNorm = (y + 1.2) / 2.4; // assuming height range roughly -1.2 to +1.2

        let col;
        if (hNorm < 0.3) {
            // Low – dirt
            col = colorDirt.clone().lerp(colorGrass, hNorm * 2);
        } else if (hNorm < 0.6) {
            // Mid – grass
            col = colorGrass.clone().lerp(colorGrassLight, (hNorm - 0.3) / 0.3);
        } else {
            // High – rock / light grass
            col = colorGrassLight.clone().lerp(colorRock, (hNorm - 0.6) / 0.4);
        }
        // Steep slopes reveal more dirt/rock
        if (slope > 0.3) {
            col.lerp(colorDirt, Math.min(1, (slope - 0.3) * 0.8));
        }
        // Random mossy patches
        if (Math.random() < 0.04) col.lerp(new THREE.Color(0x4a6a3a), 0.4);
        colors.push(col.r, col.g, col.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.95,
        metalness: 0,
        flatShading: false
    });
    const ground = new THREE.Mesh(geo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    // -----------------------------------------------------------------------
    //  4. GRASS – properly placed using getTerrainHeight
    // -----------------------------------------------------------------------
    const grassCount = 25000;
    const bladeGeo = createGrassBladeGeometry(grassCount, getTerrainHeight);
    const grassMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uWindDir: { value: new THREE.Vector2(0.2, 0.5) }
        },
        vertexShader: `
            attribute float aPhase;
            attribute vec3 aColor;
            attribute vec2 aOffset;
            attribute float aHeight;
            uniform float uTime;
            uniform vec2 uWindDir;
            varying vec3 vColor;
            void main() {
                vColor = aColor;
                float wind = sin(uTime * 1.8 + aPhase + position.y * 0.3) * 0.12;
                vec3 pos = position;
                pos.x += wind * uWindDir.x * position.y;
                pos.z += wind * uWindDir.y * position.y;
                vec3 worldPos = vec3(pos.x + aOffset.x, pos.y, pos.z + aOffset.y);
                vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                gl_FragColor = vec4(vColor, 1.0);
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: true,
        roughness: 0.9
    });
    const grassMesh = new THREE.Mesh(bladeGeo, grassMat);
    grassMesh.frustumCulled = true;
    scene.add(grassMesh);

    // -----------------------------------------------------------------------
    //  5. ROCKS & BOULDERS – placed using getTerrainHeight
    // -----------------------------------------------------------------------
    const rockGroup = new THREE.Group();
    const rockGeos = [
        new THREE.IcosahedronGeometry(0.5, 1),
        new THREE.DodecahedronGeometry(0.5, 1),
        new THREE.OctahedronGeometry(0.5, 1)
    ];
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x5a5a4a, roughness: 0.9, flatShading: true });

    for (let i = 0; i < 120; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 5 + Math.random() * 60;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        if (Math.abs(x) < 3 && Math.abs(z) < 8) continue; // avoid path area

        const geo = rockGeos[Math.floor(Math.random() * rockGeos.length)];
        const mesh = new THREE.Mesh(geo, rockMat);
        const scale = 0.4 + Math.random() * 1.2;
        mesh.scale.set(scale, scale * (0.6 + Math.random() * 0.4), scale);
        const yBase = getTerrainHeight(x, z);
        mesh.position.set(x, yBase + 0.05, z); // just slightly above ground
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rockGroup.add(mesh);
    }

    // Pebbles (instanced)
    const pebbleGeo = new THREE.DodecahedronGeometry(0.12, 0);
    const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.9 });
    const pebbleCount = 600;
    const pebbleMesh = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleCount);
    const dummy = new THREE.Object3D();
    let pebIdx = 0;
    for (let i = 0; i < pebbleCount * 2; i++) { // oversample to skip bad spots
        if (pebIdx >= pebbleCount) break;
        const a = Math.random() * Math.PI * 2;
        const r = 3 + Math.random() * 62;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        if (Math.abs(x) < 2.5 && Math.abs(z) < 7) continue;
        const yBase = getTerrainHeight(x, z);
        dummy.position.set(x, yBase + 0.02, z);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const s = 0.5 + Math.random() * 1.2;
        dummy.scale.set(s, s * 0.6, s);
        dummy.updateMatrix();
        pebbleMesh.setMatrixAt(pebIdx, dummy.matrix);
        pebIdx++;
    }
    pebbleMesh.instanceMatrix.needsUpdate = true;
    rockGroup.add(pebbleMesh);
    scene.add(rockGroup);

    // -----------------------------------------------------------------------
    //  6. FIREFLIES (animated)
    // -----------------------------------------------------------------------
    const fireflyCount = 180;
    const ffGeo = new THREE.BufferGeometry();
    const ffPos = new Float32Array(fireflyCount * 3);
    const ffPhase = new Float32Array(fireflyCount);
    const ffSeed = new Float32Array(fireflyCount * 2);
    for (let i = 0; i < fireflyCount; i++) {
        ffPos[i * 3] = (Math.random() - 0.5) * 80;
        ffPos[i * 3 + 1] = 0.3 + Math.random() * 3.0;
        ffPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
        ffPhase[i] = Math.random() * Math.PI * 2;
        ffSeed[i * 2] = Math.random() * 100;
        ffSeed[i * 2 + 1] = Math.random() * 100;
    }
    ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
    ffGeo.setAttribute('phase', new THREE.BufferAttribute(ffPhase, 1));
    ffGeo.setAttribute('seed', new THREE.BufferAttribute(ffSeed, 2));

    const ffMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
            attribute float phase;
            attribute vec2 seed;
            uniform float uTime;
            varying float vAlpha;
            void main() {
                float t = uTime * 0.4;
                vec3 pos = position;
                pos.x += sin(t + seed.x) * 0.3;
                pos.z += cos(t * 0.7 + seed.y) * 0.3;
                pos.y += sin(t * 0.5 + seed.x + seed.y) * 0.15;
                vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = (5.0 + 2.0 * sin(t + phase)) * (12.0 / -mvPos.z);
                gl_Position = projectionMatrix * mvPos;
                vAlpha = 0.6 + 0.4 * sin(t * 1.5 + phase);
            }
        `,
        fragmentShader: `
            varying float vAlpha;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                float glow = 1.0 - d * 2.0;
                gl_FragColor = vec4(0.8, 1.0, 0.5, vAlpha * glow);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const fireflies = new THREE.Points(ffGeo, ffMat);
    scene.add(fireflies);

    // -----------------------------------------------------------------------
    //  7. Animation update
    // -----------------------------------------------------------------------
    scene.userData.updateEnvironment = (t) => {
        starMat.uniforms.uTime.value = t;
        grassMat.uniforms.uTime.value = t;
        ffMat.uniforms.uTime.value = t;
    };
}

// ---------------------------------------------------------------------------
//  Helper: create grass blade geometry – uses the shared height function
// ---------------------------------------------------------------------------
function createGrassBladeGeometry(count, heightFunc) {
    const bladeWidth = 0.04;
    const bladeHeight = 0.5;
    const vertsPerBlade = 4;
    const totalVerts = count * vertsPerBlade;

    const positions = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    const colors = new Float32Array(totalVerts * 3);
    const phases = new Float32Array(totalVerts);
    const offsets = new Float32Array(totalVerts * 2);
    const heights = new Float32Array(totalVerts);

    const palette = [
        new THREE.Color(0x3a5a2a), new THREE.Color(0x4a6a2a),
        new THREE.Color(0x3a4a2a), new THREE.Color(0x5a6a3a)
    ];

    let idx = 0;
    for (let i = 0; i < count; i++) {
        // Random placement (exclude the central path)
        let x, z, valid;
        let attempts = 0;
        do {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * 62;
            x = Math.cos(a) * r;
            z = Math.sin(a) * r;
            valid = !(Math.abs(x) < 3 && Math.abs(z) < 8);
            attempts++;
        } while (!valid && attempts < 20);

        const phase = Math.random() * Math.PI * 2;
        const heightScale = 0.5 + Math.random() * 0.8;
        const widthScale = 0.7 + Math.random() * 0.6;
        const col = palette[Math.floor(Math.random() * palette.length)].clone();
        col.multiplyScalar(0.8 + Math.random() * 0.4);
        const tipCol = col.clone().lerp(new THREE.Color(0x8a9a6a), 0.3);

        const rot = Math.random() * Math.PI * 2;
        const cosA = Math.cos(rot);
        const sinA = Math.sin(rot);
        const halfW = bladeWidth * widthScale / 2;
        const h = bladeHeight * heightScale;

        const localVerts = [
            [-halfW, 0, 0], [halfW, 0, 0],
            [-halfW, h, 0], [halfW, h, 0]
        ];
        const localUVs = [[0, 0], [1, 0], [0, 1], [1, 1]];

        // Get terrain height ONCE for this blade's base
        const baseY = heightFunc(x, z);

        for (let v = 0; v < vertsPerBlade; v++) {
            const lx = localVerts[v][0];
            const ly = localVerts[v][1];
            const lz = localVerts[v][2];

            const wx = x + lx * cosA - lz * sinA;
            const wz = z + lx * sinA + lz * cosA;
            const wy = ly + baseY;

            positions[idx * 3] = wx;
            positions[idx * 3 + 1] = wy;
            positions[idx * 3 + 2] = wz;

            uvs[idx * 2] = localUVs[v][0];
            uvs[idx * 2 + 1] = localUVs[v][1];

            const t = ly / h;
            const c = col.clone().lerp(tipCol, t);
            colors[idx * 3] = c.r;
            colors[idx * 3 + 1] = c.g;
            colors[idx * 3 + 2] = c.b;

            phases[idx] = phase;
            offsets[idx * 2] = x;
            offsets[idx * 2 + 1] = z;
            heights[idx] = h;
            idx++;
        }
    }

    const indices = new Uint32Array(count * 6); // 2 triangles per blade = 6 indices
    for (let i = 0; i < count; i++) {
        const base = i * vertsPerBlade; // 0, 1, 2, 3 for this blade
        const o = i * 6;
        // triangle 1: bottom-left, bottom-right, top-left
        indices[o] = base + 0;
        indices[o + 1] = base + 1;
        indices[o + 2] = base + 2;
        // triangle 2: top-left, bottom-right, top-right
        indices[o + 3] = base + 2;
        indices[o + 4] = base + 1;
        indices[o + 5] = base + 3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 2));
    geometry.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1)); // <-- the fix
    geometry.computeVertexNormals();
    return geometry;
}
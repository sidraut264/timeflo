import { THREE } from "../core/Renderer.js";
import { getTerrainHeight } from "../world/Environment.js";

export { getTerrainHeight };

import { addInstancedRubble, addInstancedWallBlock, addInstancedFloorSlab } from "./InstancedMeshManager.js";

// ---------------------------------------------------------------------------
// Small utility helpers
// ---------------------------------------------------------------------------
export function rand(min, max) { return min + Math.random() * (max - min); }
export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ---------------------------------------------------------------------------
// jaggedBox: Realistic weathering with coherent noise, edge/corner emphasis,
// and deep localized chips.
// ---------------------------------------------------------------------------
export function jaggedBox(w, h, d, opts = {}) {
    const segments = opts.segments || null;

    // Auto compute segments based on box size if not specified
    const segX = segments || Math.max(4, Math.floor(w * 3));
    const segY = segments || Math.max(4, Math.floor(h * 3));
    const segZ = segments || Math.max(4, Math.floor(d * 3));

    const geo = new THREE.BoxGeometry(w, h, d, segX, segY, segZ);
    return applyWeathering(geo, opts);
}

// ---------------------------------------------------------------------------
// applyWeathering: Applies coherent noise weathering to any geometry
// ---------------------------------------------------------------------------
export function applyWeathering(geo, opts = {}) {
    const {
        intensity = 0.35,
        edgeBias = 0.7,
        chipChance = 0.15,
        chipDepth = 0.25,
        cleanBaseFraction = 0.15,
        noiseScale = 1.5,
        detailScale = 4.0,
        seed = null,
    } = opts;

    let rand;
    if (seed !== undefined && seed !== null) {
        rand = mulberry32(seed);
    } else {
        rand = Math.random;
    }

    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const w = bb.max.x - bb.min.x;
    const h = bb.max.y - bb.min.y;
    const d = bb.max.z - bb.min.z;
    
    const halfW = w / 2;
    const halfH = h / 2;
    const halfD = d / 2;

    const cleanHeight = h * cleanBaseFraction;
    const edgeBoost = 1.0 + edgeBias * 2.0;

    function noise3D(x, y, z) {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const zi = Math.floor(z);
        const xf = x - xi;
        const yf = y - yi;
        const zf = z - zi;

        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);
        const w = zf * zf * (3 - 2 * zf);

        const c000 = hash(xi, yi, zi);
        const c100 = hash(xi + 1, yi, zi);
        const c010 = hash(xi, yi + 1, zi);
        const c110 = hash(xi + 1, yi + 1, zi);
        const c001 = hash(xi, yi, zi + 1);
        const c101 = hash(xi + 1, yi, zi + 1);
        const c011 = hash(xi, yi + 1, zi + 1);
        const c111 = hash(xi + 1, yi + 1, zi + 1);

        const x00 = lerp(c000, c100, u);
        const x10 = lerp(c010, c110, u);
        const x01 = lerp(c001, c101, u);
        const x11 = lerp(c011, c111, u);
        const y0 = lerp(x00, x10, v);
        const y1 = lerp(x01, x11, v);
        return lerp(y0, y1, w);
    }

    function hash(x, y, z) {
        let n = x * 374761393 + y * 668265263 + z * 2147483647;
        n = (n ^ (n >> 13)) * 1274126177;
        n = n ^ (n >> 16);
        return (n & 0x7fffffff) / 0x7fffffff;
    }

    function lerp(a, b, t) {
        return a + t * (b - a);
    }

    function mulberry32(a) {
        return function () {
            a |= 0;
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const ox = pos.getX(i);
        const oy = pos.getY(i);
        const oz = pos.getZ(i);

        const heightT = (oy - bb.min.y) / h;
        if (oy < bb.min.y + cleanHeight) continue;

        const nx = Math.abs(ox) / (halfW || 1); // fallback to 1 to avoid NaN on planes
        const nz = Math.abs(oz) / (halfD || 1);
        const edgeDist = Math.max(nx, nz);

        const edgeFactor = Math.pow(edgeDist, 1.5) * edgeBoost;
        const cornerFactor = Math.max(0, nx - 0.5) * Math.max(0, nz - 0.5) * 4.0;

        let weight = heightT * (1.0 + edgeFactor + cornerFactor);
        weight = Math.min(weight, 3.0);

        const nx1 = ox * noiseScale;
        const ny1 = oy * noiseScale;
        const nz1 = oz * noiseScale;
        const nx2 = ox * detailScale;
        const ny2 = oy * detailScale;
        const nz2 = oz * detailScale;

        const n1 = noise3D(nx1, ny1, nz1);
        const n2 = noise3D(nx2, ny2, nz2);

        const amp = intensity * weight;
        const dx = (n1 - 0.5) * 0.8 * amp + (n2 - 0.5) * 0.2 * amp;
        const dy = (noise3D(nx1 + 100, ny1, nz1) - 0.6) * 1.2 * amp;
        const dz = (noise3D(nx1, ny1, nz1 + 100) - 0.5) * 0.8 * amp + (n2 - 0.5) * 0.2 * amp;

        const chipNoise = noise3D(ox * 2.5, oy * 2.5, oz * 2.5);
        if (chipNoise > 1.0 - chipChance) {
            const chipStrength = (chipNoise - (1.0 - chipChance)) / chipChance;
            const chipAmp = chipDepth * weight * chipStrength;
            
            const absX = nx;
            const absY = Math.abs(oy - (bb.min.y + halfH)) / halfH;
            const absZ = nz;

            if (absY > absX && absY > absZ) {
                pos.setY(i, oy - chipAmp * 2.0);
            } else if (absX > absZ) {
                const dir = ox > 0 ? 1 : -1;
                pos.setX(i, ox - dir * chipAmp);
            } else {
                const dir = oz > 0 ? 1 : -1;
                pos.setZ(i, oz - dir * chipAmp);
            }
        }

        pos.setX(i, ox + dx);
        pos.setY(i, oy + dy);
        pos.setZ(i, oz + dz);
    }

    geo.computeVertexNormals();
    return geo;
}

// ---------------------------------------------------------------------------
// rubblePile: scatters small broken chunks + debris around a point
// ---------------------------------------------------------------------------
export function rubblePile(scene, x, z, radius, count, matSet) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.6) * radius;
        const s = rand(0.15, 0.55);

        let type = 'stone';
        const randMat = Math.random();
        if (randMat < 0.25) type = 'moss';
        else if (randMat >= 0.5) type = 'dark';

        const cx = x + Math.cos(a) * r;
        const cz = z + Math.sin(a) * r;
        const cy = getTerrainHeight(cx, cz) + s * 0.25;

        addInstancedRubble(
            cx, cy, cz,
            Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4,
            s, type
        );
    }
}

// ---------------------------------------------------------------------------
// brokenColumn: plinth base, capital flare, drum scale jitter, fracture lines
// ---------------------------------------------------------------------------
export function brokenColumn(scene, x, z, height, rot, matSet) {
    const g = new THREE.Group();

    const plinthBottomGeo = new THREE.CylinderGeometry(0.85, 0.9, 0.15, 12, 4);
    applyWeathering(plinthBottomGeo, { intensity: 0.15, chipChance: 0.1, edgeBias: 0.8, cleanBaseFraction: 0.0 });
    const plinthBottom = new THREE.Mesh(plinthBottomGeo, matSet.stoneDark);
    plinthBottom.position.y = 0.075;
    g.add(plinthBottom);

    const plinthTopGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.25, 12, 4);
    applyWeathering(plinthTopGeo, { intensity: 0.15, chipChance: 0.1, edgeBias: 0.8, cleanBaseFraction: 0.0 });
    const plinthTop = new THREE.Mesh(plinthTopGeo, matSet.stoneWeathered || matSet.stone);
    plinthTop.position.y = 0.275;
    g.add(plinthTop);

    const torusBaseGeo = new THREE.TorusGeometry(0.58, 0.06, 8, 16);
    applyWeathering(torusBaseGeo, { intensity: 0.1, chipChance: 0.05, cleanBaseFraction: 0.0 });
    const torusBase = new THREE.Mesh(torusBaseGeo, matSet.stone);
    torusBase.rotation.x = Math.PI / 2;
    torusBase.position.y = 0.42;
    g.add(torusBase);

    const drumCount = Math.max(3, Math.round(height * 1.2));
    let y = 0.5;
    const baseR = 0.5;
    const drums = [];

    for (let i = 0; i < drumCount; i++) {
        const wear = 1 - i * 0.02;
        const r = baseR * wear * rand(0.95, 1.02);
        const hDrum = rand(0.7, 0.95);

        const midSection = Math.sin((i / drumCount) * Math.PI);
        const rAdjusted = r * (1 + midSection * 0.03);

        const geo = new THREE.CylinderGeometry(rAdjusted, rAdjusted * 1.03, hDrum, 12, 6);
        applyWeathering(geo, { intensity: 0.2, chipChance: 0.15, edgeBias: 0.9, cleanBaseFraction: 0.0 });

        let material;
        if (i % 4 === 0) {
            material = matSet.moss;
        } else if (i % 3 === 0) {
            material = matSet.stoneWeathered || matSet.stone;
        } else {
            material = matSet.stone;
        }

        const mesh = new THREE.Mesh(geo, material);

        const offsetX = (Math.random() - 0.5) * 0.08;
        const offsetZ = (Math.random() - 0.5) * 0.08;
        mesh.position.set(offsetX, y + hDrum / 2, offsetZ);

        mesh.rotation.y = Math.random() * Math.PI;
        mesh.rotation.x = (Math.random() - 0.5) * 0.04;
        mesh.rotation.z = (Math.random() - 0.5) * 0.04;

        g.add(mesh);
        drums.push(mesh);

        if (Math.random() < 0.4 && i < drumCount - 1) {
            const crack = new THREE.Mesh(
                new THREE.TorusGeometry(rAdjusted * 1.03, 0.02, 4, 8),
                matSet.stoneDark
            );
            crack.rotation.x = Math.PI / 2;
            crack.position.set(offsetX, y + hDrum, offsetZ);
            g.add(crack);
        }

        if (Math.random() < 0.3) {
            const chip = new THREE.Mesh(
                new THREE.BoxGeometry(rand(0.1, 0.25), rand(0.05, 0.15), rand(0.1, 0.2)),
                matSet.stoneDark
            );
            const chipAngle = rand(0, Math.PI * 2);
            chip.position.set(
                offsetX + Math.cos(chipAngle) * rAdjusted * 0.7,
                y + hDrum / 2,
                offsetZ + Math.sin(chipAngle) * rAdjusted * 0.7
            );
            chip.rotation.set(rand(0, 0.5), chipAngle, rand(0, 0.5));
            g.add(chip);
        }

        y += hDrum * 0.95;

        if (Math.random() < 0.15 && i < drumCount - 2) {
            const brokenTop = new THREE.Mesh(
                jaggedBox(rAdjusted * 1.4, 0.3, rAdjusted * 1.4, { chipChance: 0.5 }),
                matSet.stoneDark
            );
            brokenTop.position.set(offsetX, y, offsetZ);
            brokenTop.rotation.y = Math.random() * Math.PI;
            g.add(brokenTop);
            break;
        }
    }

    if (y > 2) {
        const capitalBottom = new THREE.Mesh(
            new THREE.CylinderGeometry(0.48, 0.52, 0.2, 8),
            matSet.stone
        );
        capitalBottom.position.y = y + 0.1;
        g.add(capitalBottom);

        const capitalTop = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.15, 0.8),
            matSet.stoneWeathered || matSet.stone
        );
        capitalTop.position.y = y + 0.275;
        capitalTop.rotation.y = Math.PI / 8;
        g.add(capitalTop);
    }

    const fallenDrumCount = rand(1, 3);
    for (let i = 0; i < fallenDrumCount; i++) {
        const fallenDrum = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.52, rand(0.6, 0.9), 8),
            i % 2 === 0 ? matSet.stone : matSet.moss
        );
        const fallAngle = rand(0, Math.PI * 2);
        const fallDist = rand(0.8, 1.8);
        fallenDrum.position.set(
            Math.cos(fallAngle) * fallDist,
            0.3,
            Math.sin(fallAngle) * fallDist
        );
        fallenDrum.rotation.x = Math.PI / 2 + rand(-0.3, 0.3);
        fallenDrum.rotation.z = rand(0, Math.PI);
        g.add(fallenDrum);

        if (Math.random() < 0.4) {
            fallenDrum.position.y = 0.15;
        }
    }

    g.position.set(x, getTerrainHeight(x, z), z);
    g.rotation.y = rot;
    scene.add(g);

    rubblePile(scene, x, z, rand(1.0, 1.5), rand(3, 6), matSet);

    for (let i = 0; i < 6; i++) {
        const chip = new THREE.Mesh(
            new THREE.BoxGeometry(rand(0.08, 0.2), rand(0.05, 0.1), rand(0.08, 0.15)),
            matSet.stoneDark
        );
        chip.position.set(x + rand(-2, 2), 0.04, z + rand(-2, 2));
        chip.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
        scene.add(chip);
    }

    return g;
}

// ---------------------------------------------------------------------------
// ruinedWall: course-based ruined wall construction
// ---------------------------------------------------------------------------
export function ruinedWall(scene, x, z, w, h, rot, material, matSet) {
    const thickness = 0.6;
    const blockH = 0.35;
    const rows = Math.max(2, Math.round(h / blockH));

    const collapseProfile = (t) => {
        const baseHeight = 0.5 + 0.5 * (1 - Math.abs(t - 0.3) * 1.2);
        return Math.max(0.2, Math.min(1.0, baseHeight + (Math.random() - 0.5) * 0.15));
    };

    let cursor = -w / 2;
    const cols = [];
    while (cursor < w / 2) {
        const bw = 0.4 + Math.random() * 0.6;
        cols.push({ start: cursor, width: Math.min(bw, w / 2 - cursor) });
        cursor += bw + 0.03 + Math.random() * 0.04;
    }

    // Group transformation logic mapped to individual blocks
    const cx = x;
    const cy = getTerrainHeight(x, z);
    const cz = z;

    cols.forEach((col) => {
        const t = (col.start + w / 2) / w;
        const profileMul = collapseProfile(t);
        const colRows = Math.max(1, Math.round(rows * profileMul * (0.85 + Math.random() * 0.15)));

        if (Math.random() < 0.1) return;

        for (let r = 0; r < colRows; r++) {
            const fallChance = 0.03 + (r / colRows) * 0.08;
            if (Math.random() < fallChance) continue;

            const bh = blockH * (0.85 + Math.random() * 0.15);
            const stagger = (r % 2 === 0) ? 0.15 : -0.15;
            const displaced = Math.random() < 0.03 + (r / colRows) * 0.02;

            let type = 'stone';
            if (!material && matSet) {
                const randMat = Math.random();
                if (randMat < 0.15) type = 'moss';
                else if (randMat >= 0.75) type = 'dark';
            } else if (material === matSet?.stoneDark) {
                type = 'dark';
            } else if (material === matSet?.moss) {
                type = 'moss';
            }

            const bx = col.start + col.width / 2 + stagger * 0.1 + (Math.random() - 0.5) * 0.05;
            const by = r * blockH + bh / 2 + (Math.random() - 0.5) * 0.02;
            const bz = displaced ? 0.15 + Math.random() * 0.2 : (Math.random() - 0.5) * 0.05;

            // Apply group rotation (rot around Y axis) and position
            const finalX = cx + bx * Math.cos(rot) + bz * Math.sin(rot);
            const finalZ = cz + bz * Math.cos(rot) - bx * Math.sin(rot);
            const finalY = cy + by;

            const rotY = rot + (Math.random() - 0.5) * 0.08;
            const rotX = displaced ? (Math.random() - 0.5) * 0.15 : (Math.random() - 0.5) * 0.02;
            const rotZ = displaced ? (Math.random() - 0.5) * 0.15 : (Math.random() - 0.5) * 0.02;

            const scaleX = col.width * (0.9 + Math.random() * 0.1);
            const scaleY = bh;
            const scaleZ = thickness * (0.85 + Math.random() * 0.15);

            addInstancedWallBlock(
                finalX, finalY, finalZ,
                rotX, rotY, rotZ,
                scaleX, scaleY, scaleZ, type
            );
        }
    });

    if (matSet) {
        rubblePile(scene,
            x + Math.sin(rot) * (w * 0.25) + (Math.random() - 0.5) * 0.5,
            z + Math.cos(rot) * (w * 0.25) + (Math.random() - 0.5) * 0.5,
            w * 0.3 + Math.random() * 0.15,
            5 + Math.floor(Math.random() * 4),
            matSet
        );

        if (Math.random() < 0.6) {
            rubblePile(scene,
                x - Math.sin(rot) * (w * 0.2) + (Math.random() - 0.5) * 0.4,
                z - Math.cos(rot) * (w * 0.2) + (Math.random() - 0.5) * 0.4,
                w * 0.15 + Math.random() * 0.1,
                3 + Math.floor(Math.random() * 3),
                matSet
            );
        }

        const blockCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < blockCount; i++) {
            const side = Math.random() < 0.5 ? 1 : -1;
            const blockX = (Math.random() - 0.5) * w * 0.6;
            const blockZ = side * (0.4 + Math.random() * 0.5);
            const size = 0.15 + Math.random() * 0.25;

            const fallen = new THREE.Mesh(
                new THREE.BoxGeometry(size, size * (0.4 + Math.random() * 0.3), size),
                Math.random() < 0.2 ? matSet.moss : matSet.stone
            );
            fallen.position.set(
                x + blockX * Math.cos(rot) - blockZ * Math.sin(rot),
                size * 0.15 + Math.random() * 0.05,
                z + blockX * Math.sin(rot) + blockZ * Math.cos(rot)
            );
            fallen.rotation.set(
                Math.random() * 0.3,
                Math.random() * Math.PI * 2,
                Math.random() * 0.3
            );
            scene.add(fallen);
        }
    }

    if (matSet && matSet.moss && Math.random() < 0.3) {
        const vineHeight = h * (0.4 + Math.random() * 0.4);
        const vineX = (Math.random() - 0.5) * w * 0.6;
        const vineZ = (Math.random() - 0.5) * 0.2;
        ivyVine(scene,
            new THREE.Vector3(
                x + vineX * Math.cos(rot) - vineZ * Math.sin(rot),
                0.1,
                z + vineX * Math.sin(rot) + vineZ * Math.cos(rot)
            ),
            vineHeight,
            matSet
        );
    }

    return null;
}

// ---------------------------------------------------------------------------
// archway: stone archway that shifts between ruin and memory
// ---------------------------------------------------------------------------
export function archway(scene, pos, rot, matSet) {
    const g = new THREE.Group();
    const width = 3.2;
    const height = 3.6;
    const pillarRadius = 0.45;
    const archThickness = 0.5;

    const leftPillar = new THREE.Group();

    const baseLGeo = new THREE.CylinderGeometry(pillarRadius * 1.4, pillarRadius * 1.6, 0.3, 12, 4);
    applyWeathering(baseLGeo, { intensity: 0.15, chipChance: 0.1, cleanBaseFraction: 0.0 });
    const baseL = new THREE.Mesh(baseLGeo, matSet.stoneDark);
    baseL.position.y = 0.15;
    leftPillar.add(baseL);

    const drumCount = 6;
    let yPos = 0.3;

    for (let i = 0; i < drumCount; i++) {
        const drumHeight = 0.5;
        const drumRadius = pillarRadius * (1 - i * 0.02);
        const drumGeo = new THREE.CylinderGeometry(drumRadius, drumRadius * 1.01, drumHeight, 12, 6);
        applyWeathering(drumGeo, { intensity: 0.15, chipChance: 0.1, edgeBias: 0.8, cleanBaseFraction: 0.0 });

        const drum = new THREE.Mesh(
            drumGeo,
            i === 0 ? matSet.moss : matSet.stone
        );

        drum.position.set(0, yPos + drumHeight / 2, 0);
        drum.rotation.y = (i * Math.PI) / 4;
        leftPillar.add(drum);
        yPos += drumHeight * 0.98;
    }

    const capLGeo = new THREE.CylinderGeometry(pillarRadius * 1.1, pillarRadius * 0.9, 0.15, 12, 4);
    applyWeathering(capLGeo, { intensity: 0.15, chipChance: 0.1, cleanBaseFraction: 0.0 });
    const capitalL = new THREE.Mesh(capLGeo, matSet.stone);
    capitalL.position.y = yPos + 0.075;
    leftPillar.add(capitalL);

    leftPillar.position.set(-width / 2, 0, 0);
    g.add(leftPillar);

    const rightPillar = new THREE.Group();

    const baseRGeo = new THREE.CylinderGeometry(pillarRadius * 1.3, pillarRadius * 1.5, 0.25, 12, 4);
    applyWeathering(baseRGeo, { intensity: 0.15, chipChance: 0.1, cleanBaseFraction: 0.0 });
    const baseR = new THREE.Mesh(baseRGeo, matSet.stoneDark);
    baseR.position.y = 0.125;
    rightPillar.add(baseR);

    const drumCountR = 3;
    yPos = 0.25;

    for (let i = 0; i < drumCountR; i++) {
        const drumHeight = 0.5;
        const drumRadius = pillarRadius * (1 - i * 0.03);
        const drumGeo = new THREE.CylinderGeometry(drumRadius, drumRadius * 1.02, drumHeight, 12, 6);
        applyWeathering(drumGeo, { intensity: 0.15, chipChance: 0.1, edgeBias: 0.8, cleanBaseFraction: 0.0 });

        const drum = new THREE.Mesh(
            drumGeo,
            i === 0 ? matSet.moss : matSet.stone
        );

        drum.position.set(0.02 * i, yPos + drumHeight / 2, 0.01 * i);
        drum.rotation.y = (i * Math.PI) / 3;
        rightPillar.add(drum);
        yPos += drumHeight * 0.97;
    }

    const brokenTopGeo = new THREE.CylinderGeometry(pillarRadius * 0.9, pillarRadius * 0.95, 0.15, 12, 4);
    applyWeathering(brokenTopGeo, { intensity: 0.25, chipChance: 0.2, cleanBaseFraction: 0.0 });
    const brokenTop = new THREE.Mesh(brokenTopGeo, matSet.stoneDark);
    brokenTop.position.y = yPos + 0.075;
    rightPillar.add(brokenTop);

    rightPillar.position.set(width / 2, 0, 0);
    g.add(rightPillar);

    const archGroup = new THREE.Group();
    const archSegments = 14;
    const archPoints = [];
    const archRadius = width / 2 + 0.3;

    for (let i = 0; i <= archSegments; i++) {
        const t = i / archSegments;
        const angle = -Math.PI / 2 + t * Math.PI * 0.7;
        const x = Math.cos(angle) * archRadius * 0.5;
        const y = height - 0.2 + Math.sin(angle) * archRadius * 0.5;
        archPoints.push(new THREE.Vector3(x, y, 0));
    }

    const archCurve = new THREE.CatmullRomCurve3(archPoints);
    const archTube = new THREE.TubeGeometry(archCurve, 14, 0.3, 12, false);
    applyWeathering(archTube, { intensity: 0.1, chipChance: 0.05, cleanBaseFraction: 0.0 });

    const archMesh = new THREE.Mesh(archTube, matSet.stone);
    archGroup.add(archMesh);

    for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const angle = -Math.PI / 2 + t * Math.PI * 0.6;
        const x = Math.cos(angle) * archRadius * 0.55;
        const y = height + Math.sin(angle) * archRadius * 0.5 - 0.1;

        const voussoirGeo = new THREE.BoxGeometry(0.25, 0.3, archThickness * 0.8, 6, 6, 6);
        applyWeathering(voussoirGeo, { intensity: 0.15, chipChance: 0.05, cleanBaseFraction: 0.0 });
        const voussoir = new THREE.Mesh(voussoirGeo, i === 0 ? matSet.moss : matSet.stone);

        voussoir.position.set(x, y, 0);
        voussoir.rotation.z = -angle * 0.8;

        archGroup.add(voussoir);
    }

    g.add(archGroup);

    const keystoneGhost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, archThickness, 8),
        matSet.stoneDark
    );
    keystoneGhost.position.set(0, height - 0.1, 0);
    keystoneGhost.material = keystoneGhost.material.clone();
    keystoneGhost.material.transparent = true;
    keystoneGhost.material.opacity = 0.3;
    keystoneGhost.rotation.x = Math.PI / 2;
    g.add(keystoneGhost);

    const fallenArchGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12, 4);
    applyWeathering(fallenArchGeo, { intensity: 0.2, chipChance: 0.1, cleanBaseFraction: 0.0 });
    const fallenArch = new THREE.Mesh(fallenArchGeo, matSet.stone);
    fallenArch.position.set(0.5, 0.15, 0);
    fallenArch.rotation.x = Math.PI / 2;
    fallenArch.rotation.z = 0.3;
    g.add(fallenArch);

    const fallenTopGeo = new THREE.BoxGeometry(0.4, 0.2, 0.4, 8, 4, 8);
    applyWeathering(fallenTopGeo, { intensity: 0.2, chipChance: 0.1, cleanBaseFraction: 0.0 });
    const fallenTop = new THREE.Mesh(fallenTopGeo, matSet.stoneDark);
    fallenTop.position.set(1.8, 0.1, -0.5);
    fallenTop.rotation.y = Math.PI / 4;
    fallenTop.rotation.x = 0.2;
    g.add(fallenTop);

    if (matSet.moss) {
        const mossPatch = new THREE.Mesh(
            new THREE.TorusGeometry(pillarRadius * 1.2, 0.05, 4, 8),
            matSet.moss
        );
        mossPatch.rotation.x = Math.PI / 2;
        mossPatch.position.set(-width / 2, 0.05, 0);
        g.add(mossPatch);

        const mossPatchR = new THREE.Mesh(
            new THREE.TorusGeometry(pillarRadius * 1.1, 0.04, 4, 8),
            matSet.moss
        );
        mossPatchR.rotation.x = Math.PI / 2;
        mossPatchR.position.set(width / 2, 0.04, 0);
        g.add(mossPatchR);
    }

    for (let i = 0; i < 5; i++) {
        const size = 0.03 + Math.random() * 0.05;
        const debris = new THREE.Mesh(
            new THREE.DodecahedronGeometry(size),
            matSet.stoneDark
        );
        debris.position.set(
            (Math.random() - 0.5) * width,
            size * 0.2,
            (Math.random() - 0.5) * 1.5
        );
        debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        g.add(debris);
    }

    const foundation = new THREE.Mesh(
        new THREE.BoxGeometry(width + 1, 0.05, 1.5),
        matSet.stoneDark
    );
    foundation.position.y = 0.025;
    foundation.material = foundation.material.clone();
    foundation.material.transparent = true;
    foundation.material.opacity = 0.5;
    g.add(foundation);

    g.position.set(pos.x, getTerrainHeight(pos.x, pos.z), pos.z);
    g.rotation.y = rot;
    scene.add(g);
    return g;
}

// ---------------------------------------------------------------------------
// courseWall: builds wall from individually coursed stone blocks
// ---------------------------------------------------------------------------
export function courseWall(scene, x, z, length, maxHeight, rot, matSet, opts = {}) {
    const { thickness = 0.5, collapseProfile = null, doorway = null } = opts;
    const blockH = 0.32;
    const rows = Math.round(maxHeight / blockH);
    let cursor = -length / 2;
    const cols = [];
    while (cursor < length / 2) {
        const bw = rand(0.5, 0.9);
        cols.push({ start: cursor, width: Math.min(bw, length / 2 - cursor) });
        cursor += bw + rand(0.02, 0.06);
    }

    const cx = x;
    const cy = 0;
    const cz = z;

    cols.forEach((col) => {
        const t = (col.start + length / 2) / length;
        const profileMul = collapseProfile ? collapseProfile(t) : 1;
        const colRows = Math.max(1, Math.round(rows * profileMul * rand(0.85, 1.0)));

        if (doorway && col.start > doorway.from - length / 2 && col.start < doorway.to - length / 2) {
            return;
        }

        for (let r = 0; r < colRows; r++) {
            if (Math.random() < 0.05) continue;

            const bh = blockH * rand(0.85, 1.05);
            const stagger = (r % 2 === 0) ? 0.15 : -0.15;
            const displaced = Math.random() < 0.04;

            let type = 'stone';
            const randMat = Math.random();
            if (randMat < 0.18) type = 'moss';
            else if (randMat >= 0.78) type = 'dark';

            const bx = col.start + col.width / 2 + stagger * 0.1;
            const by = r * blockH + bh / 2;
            const bz = displaced ? rand(0.15, 0.3) : (Math.random() - 0.5) * 0.03;

            const finalX = cx + bx * Math.cos(rot) + bz * Math.sin(rot);
            const finalZ = cz + bz * Math.cos(rot) - bx * Math.sin(rot);
            const finalY = cy + by;

            const rotY = rot + (Math.random() - 0.5) * 0.05;
            const rotZ = displaced ? rand(-0.15, 0.15) : (Math.random() - 0.5) * 0.02;

            const scaleX = col.width;
            const scaleY = bh;
            const scaleZ = thickness * rand(0.9, 1.05);

            addInstancedWallBlock(
                finalX, finalY, finalZ,
                0, rotY, rotZ,
                scaleX, scaleY, scaleZ, type
            );
        }
    });
}

// ---------------------------------------------------------------------------
// foundationFootprint: low ring of half-buried stones marking former walls
// ---------------------------------------------------------------------------
export function foundationFootprint(scene, x, z, w, d, rot, matSet) {
    const perimeter = [];
    for (let i = -w / 2; i <= w / 2; i += rand(0.5, 0.7)) { perimeter.push([i, -d / 2]); perimeter.push([i, d / 2]); }
    for (let j = -d / 2; j <= d / 2; j += rand(0.5, 0.7)) { perimeter.push([-w / 2, j]); perimeter.push([w / 2, j]); }

    const cosR = Math.cos(rot), sinR = Math.sin(rot);
    perimeter.forEach(([px, pz]) => {
        if (Math.random() < 0.25) return;
        const s = rand(0.35, 0.65);
        const type = Math.random() < 0.3 ? 'moss' : 'dark';

        const worldX = x + px * cosR - pz * sinR;
        const worldZ = z + px * sinR + pz * cosR;
        const worldY = getTerrainHeight(worldX, worldZ) + s * 0.15;

        addInstancedRubble(
            worldX, worldY, worldZ,
            0, Math.random() * Math.PI, 0,
            s, type
        );
    });
}

// ---------------------------------------------------------------------------
// floorSlabs: cracked flagstone floor with gaps and uneven settling
// ---------------------------------------------------------------------------
export function floorSlabs(scene, x, z, w, d, rot, matSet) {
    const cosR = Math.cos(rot), sinR = Math.sin(rot);
    for (let ix = -w / 2; ix < w / 2; ix += rand(0.7, 1.0)) {
        for (let iz = -d / 2; iz < d / 2; iz += rand(0.7, 1.0)) {
            if (Math.random() < 0.12) continue;
            const sw = rand(0.55, 0.85), sd = rand(0.55, 0.85);
            const lx = ix + rand(-0.08, 0.08);
            const lz = iz + rand(-0.08, 0.08);
            const wx = x + lx * cosR - lz * sinR;
            const wz = z + lx * sinR + lz * cosR;
            const wy = getTerrainHeight(wx, wz) + rand(-0.02, 0.01);

            addInstancedFloorSlab(
                wx, wy, wz,
                rot + rand(-0.05, 0.05),
                sw, 0.08, sd
            );
        }
    }
}

// ---------------------------------------------------------------------------
// ivyVine: climbing vine up wall/column
// ---------------------------------------------------------------------------
export function ivyVine(scene, base, height, matSet) {
    const pts = [];
    let cur = base.clone();
    const segs = 6;
    for (let i = 0; i <= segs; i++) {
        pts.push(new THREE.Vector3(
            cur.x + Math.sin(i * 1.3) * rand(0.05, 0.25),
            base.y + (height * i) / segs,
            cur.z + Math.cos(i * 1.7) * rand(0.05, 0.2)
        ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 16, 0.025, 4, false);
    const vine = new THREE.Mesh(geo, matSet.moss);
    scene.add(vine);
    return vine;
}

// ---------------------------------------------------------------------------
// windingPath: worn stone/dirt path with gentle wander
// ---------------------------------------------------------------------------
export function windingPath(scene, from, to, matSet, opts = {}) {
    const { spacing = 1.1, wander = 1.4 } = opts;
    const dist = from.distanceTo(to);
    const steps = Math.max(2, Math.round(dist / spacing));
    const dir = to.clone().sub(from).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const wobble = Math.sin(t * Math.PI * rand(1.5, 2.5)) * wander * (1 - Math.abs(t - 0.5) * 0.6);
        const p = from.clone().lerp(to, t).add(perp.clone().multiplyScalar(wobble + rand(-0.3, 0.3)));
        if (Math.random() < 0.35) continue;
        const s = rand(0.35, 0.6);
        const stone = new THREE.Mesh(jaggedBox(s, 0.12, s, { chipChance: 0.1 }), Math.random() < 0.7 ? matSet.stone : matSet.moss);
        const yBase = getTerrainHeight(p.x, p.z);
        stone.position.set(p.x, yBase + rand(-0.02, 0.01), p.z);
        stone.rotation.y = Math.random() * Math.PI;
        scene.add(stone);
    }
}

// ---------------------------------------------------------------------------
// lowWall: short boundary wall
// ---------------------------------------------------------------------------
export function lowWall(scene, x, z, length, rot, matSet) {
    return courseWall(scene, x, z, length, rand(0.5, 0.9), rot, matSet, {
        thickness: 0.28,
        collapseProfile: (t) => 0.5 + 0.5 * Math.sin(t * Math.PI * rand(1, 2))
    });
}

// ---------------------------------------------------------------------------
// emptyPlot: building plot with foundation outline and stub walls
// ---------------------------------------------------------------------------
export function emptyPlot(scene, x, z, w, d, rot, matSet) {
    foundationFootprint(scene, x, z, w, d, rot, matSet);
    if (Math.random() < 0.6) floorSlabs(scene, x, z, w * 0.7, d * 0.7, rot, matSet);
    if (Math.random() < 0.5) rubblePile(scene, x + rand(-w / 4, w / 4), z + rand(-d / 4, d / 4), rand(0.6, 1.2), rand(2, 4), matSet);
    const stubCount = Math.random() < 0.5 ? 1 : 2;
    for (let i = 0; i < stubCount; i++) {
        const corner = pick([[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]);
        const stub = new THREE.Mesh(jaggedBox(0.6, rand(0.4, 1.1), 0.6, { chipChance: 0.2 }), matSet.stoneDark);
        const stubX = x + corner[0], stubZ = z + corner[1];
        const stubH = stub.geometry.parameters.height;
        stub.position.set(stubX, getTerrainHeight(stubX, stubZ) + stubH / 2, stubZ);
        stub.rotation.y = rot + rand(-0.2, 0.2);
        scene.add(stub);
    }
}

// ---------------------------------------------------------------------------
// campfireRing: stone ring with charred log
// ---------------------------------------------------------------------------
export function campfireRing(scene, x, z, matSet) {
    const g = new THREE.Group();
    const r = rand(0.55, 0.75);
    const count = 7 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + rand(-0.1, 0.1);
        const s = rand(0.15, 0.28);
        const stone = new THREE.Mesh(jaggedBox(s, s * 0.8, s, { chipChance: 0.15 }), matSet.stoneDark);
        stone.position.set(Math.cos(a) * r, s * 0.3, Math.sin(a) * r);
        stone.rotation.y = Math.random() * Math.PI;
        g.add(stone);
    }
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, rand(0.8, 1.2), 6), matSet.stoneDark);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = rand(0, Math.PI);
    log.position.y = 0.09;
    g.add(log);
    g.position.set(x, getTerrainHeight(x, z), z);
    scene.add(g);
    return g;
}

// ---------------------------------------------------------------------------
// storageDebris: broken crates and barrels
// ---------------------------------------------------------------------------
export function storageDebris(scene, x, z, matSet) {
    const g = new THREE.Group();
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
        const px = x + rand(-1, 1), pz = z + rand(-1, 1);
        if (Math.random() < 0.5) {
            const crate = new THREE.Mesh(jaggedBox(rand(0.5, 0.7), rand(0.4, 0.6), rand(0.5, 0.7), { chipChance: 0.2 }), matSet.wood);
            crate.position.set(px, 0.25, pz);
            crate.rotation.y = Math.random() * Math.PI;
            crate.rotation.z = Math.random() < 0.3 ? rand(0.3, 0.6) : 0;
            g.add(crate);
        } else {
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, rand(0.5, 0.7), 8), matSet.wood);
            const tipped = Math.random() < 0.4;
            barrel.rotation.z = tipped ? Math.PI / 2 : rand(-0.05, 0.05);
            barrel.position.set(px, tipped ? 0.32 : rand(0.25, 0.35), pz);
            g.add(barrel);
        }
    }
    g.position.set(x, getTerrainHeight(x, z), z);
    scene.add(g);
    return g;
}

// ---------------------------------------------------------------------------
// cartWreck: abandoned handcart
// ---------------------------------------------------------------------------
export function cartWreck(scene, x, z, rot, matSet) {
    const g = new THREE.Group();

    const bedGeo = new THREE.BoxGeometry(1.8, 0.08, 1.2);
    const bed = new THREE.Mesh(bedGeo, matSet.wood);
    bed.position.set(0, 0.35, 0);
    bed.rotation.z = rand(-0.15, 0.15);
    bed.rotation.x = rand(-0.05, 0.05);
    g.add(bed);

    const railGeo = new THREE.BoxGeometry(1.8, 0.2, 0.06);

    const railLeft = new THREE.Mesh(railGeo, matSet.wood);
    railLeft.position.set(0, 0.5, -0.57);
    railLeft.rotation.z = bed.rotation.z;
    g.add(railLeft);

    const railRight = new THREE.Mesh(railGeo, matSet.wood);
    railRight.position.set(0, 0.5, 0.57);
    railRight.rotation.z = bed.rotation.z;
    g.add(railRight);

    const railFront = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.2, 1.1),
        matSet.woodDry || matSet.wood
    );
    railFront.position.set(0.85, 0.5, 0);
    railFront.rotation.x = rand(-0.3, -0.1);
    g.add(railFront);

    for (let i = -1; i <= 1; i += 2) {
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.1, 0.15),
            matSet.wood
        );
        beam.position.set(0, 0.28, i * 0.4);
        beam.rotation.z = bed.rotation.z;
        g.add(beam);
    }

    const axle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 1.4, 8),
        matSet.woodDry || matSet.wood
    );
    axle.rotation.x = Math.PI / 2;
    axle.position.set(-0.2, 0.35, 0);
    g.add(axle);

    const wheelGeo = new THREE.TorusGeometry(0.5, 0.07, 8, 16);

    const wheelAttached = new THREE.Mesh(wheelGeo, matSet.wood);
    wheelAttached.position.set(-0.2, 0.35, -0.7);
    wheelAttached.rotation.y = rand(-0.2, 0.2);
    g.add(wheelAttached);

    for (let i = 0; i < 6; i++) {
        const spoke = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.9, 4),
            matSet.wood
        );
        const angle = (i / 6) * Math.PI * 2;
        spoke.position.set(-0.2, 0.35, -0.7);
        spoke.rotation.x = Math.PI / 2;
        spoke.rotation.z = angle;
        spoke.translateY(Math.sin(angle) * 0.45);
        spoke.translateZ(Math.cos(angle) * 0.45);
        g.add(spoke);
    }

    const hubAttached = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.15, 8),
        matSet.woodDry || matSet.wood
    );
    hubAttached.rotation.x = Math.PI / 2;
    hubAttached.position.set(-0.2, 0.35, -0.7);
    g.add(hubAttached);

    const wheelFallen = new THREE.Mesh(wheelGeo, matSet.wood);
    wheelFallen.position.set(0.9, 0.08, 0.4);
    wheelFallen.rotation.x = Math.PI / 2;
    wheelFallen.rotation.z = rand(-0.3, 0.3);
    g.add(wheelFallen);

    for (let i = 0; i < 3; i++) {
        const brokenSpoke = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.04, rand(0.2, 0.4), 4),
            matSet.woodDry || matSet.wood
        );
        brokenSpoke.position.set(0.9 + rand(-0.2, 0.2), 0.08, 0.4 + rand(-0.2, 0.2));
        brokenSpoke.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
        g.add(brokenSpoke);
    }

    const shaftLeft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.07, 2.2, 6),
        matSet.wood
    );
    shaftLeft.position.set(-1.3, 0.4, -0.4);
    shaftLeft.rotation.z = Math.PI / 2 - 0.3;
    shaftLeft.rotation.y = rand(-0.1, 0.1);
    g.add(shaftLeft);

    const shaftRight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.065, 1.5, 6),
        matSet.woodDry || matSet.wood
    );
    shaftRight.position.set(-0.8, 0.1, 0.4);
    shaftRight.rotation.z = Math.PI / 2 + 0.2;
    shaftRight.rotation.x = rand(-0.2, 0.2);
    g.add(shaftRight);

    const yoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.1, 0.08),
        matSet.wood
    );
    yoke.position.set(-1.2, 0.5, 0);
    yoke.rotation.y = rand(-0.15, 0.15);
    g.add(yoke);

    const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.3, 0.35),
        matSet.wood
    );
    crate.position.set(0.5, 0.2, -0.8);
    crate.rotation.y = rand(0, Math.PI);
    crate.rotation.z = rand(-0.1, 0.1);
    g.add(crate);

    const sack = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 6, 5),
        matSet.cloth || matSet.clothWorn
    );
    sack.position.set(0.7, 0.15, 0.6);
    sack.scale.set(1.2, 0.7, 1);
    sack.rotation.z = rand(-0.3, 0.3);
    g.add(sack);

    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.22, 0.5, 8),
        matSet.woodDry || matSet.wood
    );
    barrel.position.set(-0.4, 0.25, 1.0);
    barrel.rotation.x = Math.PI / 2 + rand(-0.2, 0.2);
    barrel.rotation.z = rand(0, Math.PI);
    g.add(barrel);

    g.position.set(x, getTerrainHeight(x, z), z);
    g.rotation.y = rot;
    scene.add(g);

    rubblePile(scene, x + rand(-0.5, 0.5), z + rand(-0.5, 0.5), rand(0.8, 1.2), rand(4, 6), matSet);

    for (let i = 0; i < 5; i++) {
        const plank = new THREE.Mesh(
            new THREE.BoxGeometry(rand(0.3, 0.7), 0.04, rand(0.1, 0.2)),
            matSet.woodDry || matSet.wood
        );
        plank.position.set(x + rand(-2, 2), 0.03, z + rand(-2, 2));
        plank.rotation.y = rand(0, Math.PI * 2);
        plank.rotation.x = rand(-0.1, 0.1);
        scene.add(plank);
    }

    return g;
}

// ---------------------------------------------------------------------------
// createTree: recursive branching tree
// ---------------------------------------------------------------------------
function addBranch(g, matSet, origin, dir, len, radius, depth) {
    if (depth <= 0 || len < 0.3) return;
    const geo = new THREE.CylinderGeometry(radius * 0.5, radius, len, 5);
    const mesh = new THREE.Mesh(geo, matSet.wood);
    const end = origin.clone().add(dir.clone().multiplyScalar(len));
    const mid = origin.clone().lerp(end, 0.5);
    mesh.position.copy(mid);
    mesh.lookAt(end);
    mesh.rotateX(Math.PI / 2);
    mesh.userData.shadowGroup = 'tree';
    g.add(mesh);

    const branches = depth > 2 ? 2 : Math.random() < 0.7 ? 2 : 1;
    for (let i = 0; i < branches; i++) {
        const spread = rand(0.5, 1.1) * (Math.random() < 0.5 ? 1 : -1);
        const newDir = dir.clone();
        newDir.x += spread * 0.6;
        newDir.y += rand(0.1, 0.4);
        newDir.z += spread * 0.6;
        newDir.normalize();
        addBranch(g, matSet, end, newDir, len * rand(0.55, 0.75), radius * 0.6, depth - 1);
    }
}

export function createTree(scene, pos, matSet) {
    const g = new THREE.Group();
    const lean = new THREE.Vector3(rand(-0.3, 0.3), 1, rand(-0.3, 0.3)).normalize();
    addBranch(g, matSet, new THREE.Vector3(0, 0, 0), lean, rand(3.2, 4.2), 0.35, 4);
    g.position.set(pos.x, getTerrainHeight(pos.x, pos.z), pos.z);
    scene.add(g);
    return g;
}

// ---------------------------------------------------------------------------
// stoneBench: simple bench for communal areas
// ---------------------------------------------------------------------------
export function stoneBench(scene, x, z, rot, matSet) {
    const g = new THREE.Group();
    const slab = new THREE.Mesh(jaggedBox(1.8, 0.2, 0.6, { chipChance: 0.1 }), matSet.stone);
    slab.position.y = 0.45;
    g.add(slab);

    const leg1 = new THREE.Mesh(jaggedBox(0.4, 0.4, 0.5, { chipChance: 0.2 }), matSet.stoneDark);
    leg1.position.set(-0.7, 0.2, 0);
    g.add(leg1);

    const leg2 = new THREE.Mesh(jaggedBox(0.4, 0.4, 0.5, { chipChance: 0.2 }), matSet.stoneDark);
    leg2.position.set(0.7, 0.2, 0);
    g.add(leg2);

    const wy = getTerrainHeight(x, z);
    g.position.set(x, wy, z);
    g.rotation.y = rot;
    scene.add(g);
    return g;
}

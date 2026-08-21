import { THREE } from "../core/Renderer.js";

// ---------------------------------------------------------------------------
// Small utility helpers
// ---------------------------------------------------------------------------
export function rand(min, max) { return min + Math.random() * (max - min); }
export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ---------------------------------------------------------------------------
// jaggedBox: weathering biased toward top and edges/corners with deep chips
// ---------------------------------------------------------------------------
export function jaggedBox(w, h, d, opts = {}) {
    const { chipChance = 0.12, edgeBias = true } = opts;
    const geo = new THREE.BoxGeometry(w, h, d, 3, 5, 3);
    const pos = geo.attributes.position;
    const halfW = w / 2, halfD = d / 2;

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const heightT = (y / h) + 0.5; // 0 at bottom, 1 at top
        if (heightT < 0.15) continue; // keep base clean/solid

        const edgeFactor = edgeBias
            ? (Math.abs(x) / halfW) * 0.5 + (Math.abs(z) / halfD) * 0.5 + 0.5
            : 1;

        const weight = heightT * edgeFactor;
        let dx = (Math.random() - 0.5) * 0.35 * weight;
        let dy = (Math.random() - 0.55) * h * 0.3 * weight;
        let dz = (Math.random() - 0.5) * 0.35 * weight;

        if (Math.random() < chipChance * weight) {
            dx *= 2.4; dy -= h * 0.15; dz *= 2.4;
        }

        pos.setX(i, x + dx);
        pos.setY(i, y + dy);
        pos.setZ(i, z + dz);
    }
    geo.computeVertexNormals();
    return geo;
}

// ---------------------------------------------------------------------------
// rubblePile: scatters small broken chunks + debris around a point
// ---------------------------------------------------------------------------
export function rubblePile(scene, x, z, radius, count, matSet) {
    const g = new THREE.Group();
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.6) * radius;
        const s = rand(0.15, 0.55);
        const chunk = new THREE.Mesh(
            jaggedBox(s, s * rand(0.5, 0.9), s, { chipChance: 0.3 }),
            Math.random() < 0.25 ? matSet.moss : (Math.random() < 0.5 ? matSet.stone : matSet.stoneDark)
        );
        chunk.position.set(x + Math.cos(a) * r, s * 0.25, z + Math.sin(a) * r);
        chunk.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
        g.add(chunk);
    }
    scene.add(g);
    return g;
}

// ---------------------------------------------------------------------------
// brokenColumn: plinth base, capital flare, drum scale jitter, fracture lines
// ---------------------------------------------------------------------------
export function brokenColumn(scene, x, z, height, rot, matSet) {
    const g = new THREE.Group();

    const plinthBottom = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.9, 0.15, 8),
        matSet.stoneDark
    );
    plinthBottom.position.y = 0.075;
    g.add(plinthBottom);

    const plinthTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.8, 0.25, 8),
        matSet.stoneWeathered || matSet.stone
    );
    plinthTop.position.y = 0.275;
    g.add(plinthTop);

    const torusBase = new THREE.Mesh(
        new THREE.TorusGeometry(0.58, 0.06, 6, 8),
        matSet.stone
    );
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

        const geo = new THREE.CylinderGeometry(rAdjusted, rAdjusted * 1.03, hDrum, 8);

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

    g.position.set(x, 0, z);
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
    const group = new THREE.Group();
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

            const block = new THREE.Mesh(
                new THREE.BoxGeometry(
                    col.width * (0.9 + Math.random() * 0.1),
                    bh,
                    thickness * (0.85 + Math.random() * 0.15)
                ),
                material || (Math.random() < 0.15 ? matSet.moss : (Math.random() < 0.6 ? matSet.stone : matSet.stoneDark))
            );

            block.position.set(
                col.start + col.width / 2 + stagger * 0.1 + (Math.random() - 0.5) * 0.05,
                r * blockH + bh / 2 + (Math.random() - 0.5) * 0.02,
                displaced ? 0.15 + Math.random() * 0.2 : (Math.random() - 0.5) * 0.05
            );

            block.rotation.y = (Math.random() - 0.5) * 0.08;
            block.rotation.x = displaced ? (Math.random() - 0.5) * 0.15 : (Math.random() - 0.5) * 0.02;
            block.rotation.z = displaced ? (Math.random() - 0.5) * 0.15 : (Math.random() - 0.5) * 0.02;

            group.add(block);
        }
    });

    group.position.set(x, 0, z);
    group.rotation.y = rot;
    scene.add(group);

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

    return group;
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

    const baseL = new THREE.Mesh(
        new THREE.CylinderGeometry(pillarRadius * 1.4, pillarRadius * 1.6, 0.3, 8),
        matSet.stoneDark
    );
    baseL.position.y = 0.15;
    const baseLPos = baseL.geometry.attributes.position;
    for (let j = 0; j < baseLPos.count; j++) {
        const x = baseLPos.getX(j);
        const y = baseLPos.getY(j);
        const z = baseLPos.getZ(j);
        const dist = Math.sqrt(x * x + z * z);
        if (y > 0.1 && dist > pillarRadius * 1.2) {
            baseLPos.setY(j, y - 0.02);
        }
    }
    baseLPos.needsUpdate = true;
    baseL.geometry.computeVertexNormals();
    leftPillar.add(baseL);

    const drumCount = 6;
    let yPos = 0.3;

    for (let i = 0; i < drumCount; i++) {
        const drumHeight = 0.5;
        const drumRadius = pillarRadius * (1 - i * 0.02);
        const drumGeo = new THREE.CylinderGeometry(drumRadius, drumRadius * 1.01, drumHeight, 10);

        const positions = drumGeo.attributes.position;
        for (let j = 0; j < positions.count; j++) {
            const x = positions.getX(j);
            const y = positions.getY(j);
            const z = positions.getZ(j);
            const dist = Math.sqrt(x * x + z * z);
            if (dist > 0.3 && Math.random() < 0.1) {
                const erosion = 0.98 + Math.random() * 0.01;
                positions.setX(j, x * erosion);
                positions.setZ(j, z * erosion);
            }
        }
        positions.needsUpdate = true;
        drumGeo.computeVertexNormals();

        const drum = new THREE.Mesh(
            drumGeo,
            i === 0 ? matSet.moss : matSet.stone
        );

        drum.position.set(0, yPos + drumHeight / 2, 0);
        drum.rotation.y = (i * Math.PI) / 4;
        leftPillar.add(drum);
        yPos += drumHeight * 0.98;
    }

    const capitalL = new THREE.Mesh(
        new THREE.CylinderGeometry(pillarRadius * 1.1, pillarRadius * 0.9, 0.15, 8),
        matSet.stone
    );
    capitalL.position.y = yPos + 0.075;
    const capLPos = capitalL.geometry.attributes.position;
    for (let j = 0; j < capLPos.count; j++) {
        const y = capLPos.getY(j);
        if (Math.abs(y) > 0.05) {
            capLPos.setY(j, y * 0.9);
        }
    }
    capLPos.needsUpdate = true;
    capitalL.geometry.computeVertexNormals();
    leftPillar.add(capitalL);

    leftPillar.position.set(-width / 2, 0, 0);
    g.add(leftPillar);

    const rightPillar = new THREE.Group();

    const baseR = new THREE.Mesh(
        new THREE.CylinderGeometry(pillarRadius * 1.3, pillarRadius * 1.5, 0.25, 8),
        matSet.stoneDark
    );
    baseR.position.y = 0.125;
    const baseRPos = baseR.geometry.attributes.position;
    for (let j = 0; j < baseRPos.count; j++) {
        const x = baseRPos.getX(j);
        const z = baseRPos.getZ(j);
        const angle = Math.atan2(z, x);
        if (Math.abs(angle) < 0.3) {
            baseRPos.setX(j, x * 0.85);
            baseRPos.setZ(j, z * 0.85);
        }
    }
    baseRPos.needsUpdate = true;
    baseR.geometry.computeVertexNormals();
    rightPillar.add(baseR);

    const drumCountR = 3;
    yPos = 0.25;

    for (let i = 0; i < drumCountR; i++) {
        const drumHeight = 0.5;
        const drumRadius = pillarRadius * (1 - i * 0.03);
        const drumGeo = new THREE.CylinderGeometry(drumRadius, drumRadius * 1.02, drumHeight, 8);

        const positions = drumGeo.attributes.position;
        for (let j = 0; j < positions.count; j++) {
            const x = positions.getX(j);
            const y = positions.getY(j);
            const z = positions.getZ(j);
            if (Math.random() < 0.05) {
                positions.setX(j, x * 0.98);
                positions.setZ(j, z * 0.98);
            }
        }
        positions.needsUpdate = true;
        drumGeo.computeVertexNormals();

        const drum = new THREE.Mesh(
            drumGeo,
            i === 0 ? matSet.moss : matSet.stone
        );

        drum.position.set(0.02 * i, yPos + drumHeight / 2, 0.01 * i);
        drum.rotation.y = (i * Math.PI) / 3;
        rightPillar.add(drum);
        yPos += drumHeight * 0.97;
    }

    const brokenTop = new THREE.Mesh(
        new THREE.CylinderGeometry(pillarRadius * 0.9, pillarRadius * 0.95, 0.15, 8),
        matSet.stoneDark
    );
    brokenTop.position.y = yPos + 0.075;
    const brokenPos = brokenTop.geometry.attributes.position;
    for (let j = 0; j < brokenPos.count; j++) {
        const y = brokenPos.getY(j);
        if (y > 0.05) {
            brokenPos.setY(j, y + (Math.random() - 0.5) * 0.04);
        }
    }
    brokenPos.needsUpdate = true;
    brokenTop.geometry.computeVertexNormals();
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
    const archTube = new THREE.TubeGeometry(archCurve, 14, 0.3, 8, false);

    const archPos = archTube.attributes.position;
    for (let j = 0; j < archPos.count; j++) {
        const x = archPos.getX(j);
        const y = archPos.getY(j);
        const z = archPos.getZ(j);
        const dist = Math.sqrt(x * x + y * y);
        if (dist > 0.2 && Math.random() < 0.08) {
            archPos.setX(j, x * 0.99);
            archPos.setY(j, y * 0.99);
        }
    }
    archPos.needsUpdate = true;
    archTube.computeVertexNormals();

    const archMesh = new THREE.Mesh(archTube, matSet.stone);
    archGroup.add(archMesh);

    for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const angle = -Math.PI / 2 + t * Math.PI * 0.6;
        const x = Math.cos(angle) * archRadius * 0.55;
        const y = height + Math.sin(angle) * archRadius * 0.5 - 0.1;

        const voussoir = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.3, archThickness * 0.8),
            i === 0 ? matSet.moss : matSet.stone
        );

        voussoir.position.set(x, y, 0);
        voussoir.rotation.z = -angle * 0.8;

        const vPos = voussoir.geometry.attributes.position;
        for (let j = 0; j < vPos.count; j++) {
            const vx = vPos.getX(j);
            if (Math.abs(vx) > 0.1) {
                vPos.setX(j, vx * 0.95);
            }
        }
        vPos.needsUpdate = true;
        voussoir.geometry.computeVertexNormals();

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

    const fallenArch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.3, 8),
        matSet.stone
    );
    fallenArch.position.set(0.5, 0.15, 0);
    fallenArch.rotation.x = Math.PI / 2;
    fallenArch.rotation.z = 0.3;
    g.add(fallenArch);

    const fallenTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.2, 0.4),
        matSet.stoneDark
    );
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

    g.position.copy(pos);
    g.rotation.y = rot;
    scene.add(g);
    return g;
}

// ---------------------------------------------------------------------------
// courseWall: builds wall from individually coursed stone blocks
// ---------------------------------------------------------------------------
export function courseWall(scene, x, z, length, maxHeight, rot, matSet, opts = {}) {
    const { thickness = 0.5, collapseProfile = null, doorway = null } = opts;
    const g = new THREE.Group();

    const blockH = 0.32;
    const rows = Math.round(maxHeight / blockH);
    let cursor = -length / 2;
    const cols = [];
    while (cursor < length / 2) {
        const bw = rand(0.5, 0.9);
        cols.push({ start: cursor, width: Math.min(bw, length / 2 - cursor) });
        cursor += bw + rand(0.02, 0.06);
    }

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

            const block = new THREE.Mesh(
                new THREE.BoxGeometry(col.width, bh, thickness * rand(0.9, 1.05)),
                Math.random() < 0.18 ? matSet.moss : (Math.random() < 0.6 ? matSet.stone : matSet.stoneDark)
            );
            block.position.set(
                col.start + col.width / 2 + stagger * 0.1,
                r * blockH + bh / 2,
                displaced ? rand(0.15, 0.3) : (Math.random() - 0.5) * 0.03
            );
            block.rotation.y = (Math.random() - 0.5) * 0.05;
            block.rotation.z = displaced ? rand(-0.15, 0.15) : (Math.random() - 0.5) * 0.02;
            g.add(block);
        }
    });

    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
    return g;
}

// ---------------------------------------------------------------------------
// foundationFootprint: low ring of half-buried stones marking former walls
// ---------------------------------------------------------------------------
export function foundationFootprint(scene, x, z, w, d, rot, matSet) {
    const g = new THREE.Group();
    const perimeter = [];
    for (let i = -w / 2; i <= w / 2; i += rand(0.5, 0.7)) { perimeter.push([i, -d / 2]); perimeter.push([i, d / 2]); }
    for (let j = -d / 2; j <= d / 2; j += rand(0.5, 0.7)) { perimeter.push([-w / 2, j]); perimeter.push([w / 2, j]); }

    perimeter.forEach(([px, pz]) => {
        if (Math.random() < 0.2) return;
        const s = rand(0.3, 0.55);
        const stone = new THREE.Mesh(jaggedBox(s, s * 0.6, s, { chipChance: 0.1 }), matSet.stoneDark);
        stone.position.set(px + rand(-0.1, 0.1), s * 0.15, pz + rand(-0.1, 0.1));
        stone.rotation.y = Math.random() * Math.PI;
        g.add(stone);
    });
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
    return g;
}

// ---------------------------------------------------------------------------
// floorSlabs: cracked flagstone floor with gaps and uneven settling
// ---------------------------------------------------------------------------
export function floorSlabs(scene, x, z, w, d, rot, matSet) {
    const g = new THREE.Group();
    for (let ix = -w / 2; ix < w / 2; ix += rand(0.7, 1.0)) {
        for (let iz = -d / 2; iz < d / 2; iz += rand(0.7, 1.0)) {
            if (Math.random() < 0.12) continue;
            const sw = rand(0.55, 0.85), sd = rand(0.55, 0.85);
            const slab = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.08, sd), Math.random() < 0.15 ? matSet.moss : matSet.stone);
            slab.position.set(ix + rand(-0.08, 0.08), rand(-0.05, 0.02), iz + rand(-0.08, 0.08));
            slab.rotation.y = rand(-0.05, 0.05);
            g.add(slab);
        }
    }
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
    return g;
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
        stone.position.set(p.x, rand(-0.04, 0.01), p.z);
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
        stub.position.set(x + corner[0], stub.geometry.parameters.height / 2, z + corner[1]);
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
    g.position.set(x, 0, z);
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
    g.position.set(0, 0, 0);
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

    g.position.set(x, 0, z);
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
    g.position.copy(pos);
    scene.add(g);
    return g;
}

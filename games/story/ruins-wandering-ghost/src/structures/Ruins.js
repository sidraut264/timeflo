import { THREE } from "../core/Renderer.js";

// Master Positions for the 10-beat narrative path
export const LOCATIONS = {
    ARCHWAY: new THREE.Vector3(2, 0, -1),
    PATH: new THREE.Vector3(2, 0, -15),
    HOUSE: new THREE.Vector3(-10, 0, -18),
    WELL: new THREE.Vector3(-15, 0, -30),
    GARDEN: new THREE.Vector3(5, 0, -30),
    STATUE: new THREE.Vector3(15, 0, -25),
    TOWER: new THREE.Vector3(20, 0, -5),
    BELL: new THREE.Vector3(30, 0, 5),
    ROAD: new THREE.Vector3(20, 0, 20),
    GRAVE: new THREE.Vector3(10, 0, 30)
};

// ---------------------------------------------------------------------------
// Small utility
// ---------------------------------------------------------------------------
function rand(min, max) { return min + Math.random() * (max - min); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ---------------------------------------------------------------------------
// jaggedBox: weathering now biases toward the TOP and toward EDGES/CORNERS,
// with an occasional deep "chip" so damage reads as event-driven rather than
// uniform static. Bottom third stays clean so pieces still look load-bearing.
// ---------------------------------------------------------------------------
export function jaggedBox(w, h, d, opts = {}) {
    const { chipChance = 0.12, edgeBias = true } = opts;
    const geo = new THREE.BoxGeometry(w, h, d, 3, 5, 3);
    const pos = geo.attributes.position;
    const halfW = w / 2, halfD = d / 2;

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const heightT = (y / h) + 0.5; // 0 at bottom, 1 at top
        if (heightT < 0.15) continue; // keep the base clean/solid

        // edge/corner vertices erode more than face-center vertices
        const edgeFactor = edgeBias
            ? (Math.abs(x) / halfW) * 0.5 + (Math.abs(z) / halfD) * 0.5 + 0.5
            : 1;

        const weight = heightT * edgeFactor;
        let dx = (Math.random() - 0.5) * 0.35 * weight;
        let dy = (Math.random() - 0.55) * h * 0.3 * weight; // biased downward (loss of material, not bulging)
        let dz = (Math.random() - 0.5) * 0.35 * weight;

        // occasional deep chip so some corners look genuinely broken off
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
// rubblePile: scatters small broken chunks + dust-fine debris around a point
// so structures look eroded-in-place rather than placed-on-top. This is the
// single biggest cheap win for "crude vs. designed".
// ---------------------------------------------------------------------------
export function rubblePile(scene, x, z, radius, count, matSet) {
    const g = new THREE.Group();
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.6) * radius; // denser near center
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
// brokenColumn: added base plinth + capital flare, per-drum scale jitter,
// and an occasional horizontal fracture crack (dark thin ring) instead of
// just stopping the stack — reads as "broke here" rather than "ran out".
// ---------------------------------------------------------------------------
export function brokenColumn(scene, x, z, height, rot, matSet) {
    const g = new THREE.Group();

    // PLINTH BASE - stepped base for architectural authenticity
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

    // TORUS MOLDING - decorative ring at base of column
    const torusBase = new THREE.Mesh(
        new THREE.TorusGeometry(0.58, 0.06, 6, 8),
        matSet.stone
    );
    torusBase.rotation.x = Math.PI / 2;
    torusBase.position.y = 0.42;
    g.add(torusBase);

    // COLUMN DRUMS - main shaft
    const drumCount = Math.max(3, Math.round(height * 1.2));
    let y = 0.5;
    const baseR = 0.5;
    const drums = [];

    for (let i = 0; i < drumCount; i++) {
        // Gradual taper toward top
        const wear = 1 - i * 0.02;
        const r = baseR * wear * rand(0.95, 1.02);
        const hDrum = rand(0.7, 0.95);

        // Add slight entasis (bulge) in middle drums
        const midSection = Math.sin((i / drumCount) * Math.PI);
        const rAdjusted = r * (1 + midSection * 0.03);

        const geo = new THREE.CylinderGeometry(rAdjusted, rAdjusted * 1.03, hDrum, 8);

        // Material variation based on height and condition
        let material;
        if (i % 4 === 0) {
            material = matSet.moss; // Mossy drums
        } else if (i % 3 === 0) {
            material = matSet.stoneWeathered || matSet.stone; // Weathered drums
        } else {
            material = matSet.stone;
        }

        const mesh = new THREE.Mesh(geo, material);

        // Position with slight misalignment for realistic stacking
        const offsetX = (Math.random() - 0.5) * 0.08;
        const offsetZ = (Math.random() - 0.5) * 0.08;
        mesh.position.set(offsetX, y + hDrum / 2, offsetZ);

        // Subtle rotation for organic feel
        mesh.rotation.y = Math.random() * Math.PI;
        mesh.rotation.x = (Math.random() - 0.5) * 0.04;
        mesh.rotation.z = (Math.random() - 0.5) * 0.04;

        g.add(mesh);
        drums.push(mesh);

        // FRACTURE LINES between drums
        if (Math.random() < 0.4 && i < drumCount - 1) {
            const crack = new THREE.Mesh(
                new THREE.TorusGeometry(rAdjusted * 1.03, 0.02, 4, 8),
                matSet.stoneDark
            );
            crack.rotation.x = Math.PI / 2;
            crack.position.set(offsetX, y + hDrum, offsetZ);
            g.add(crack);
        }

        // CHIPS AND DAMAGE on random drums
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

        // RANDOM BREAK - the column stops here
        if (Math.random() < 0.15 && i < drumCount - 2) {
            // Broken top drum with irregular geometry
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

    // CAPITAL - only if column is tall enough
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

    // FALLEN DRUMS around the base
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

        // Partial burial for some drums
        if (Math.random() < 0.4) {
            fallenDrum.position.y = 0.15;
        }
    }

    // Position and rotate the entire column
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);

    // Rubble pile with more appropriate scale
    rubblePile(scene, x, z, rand(1.0, 1.5), rand(3, 6), matSet);

    // Scattered stone chips
    for (let i = 0; i < 6; i++) {
        const chip = new THREE.Mesh(
            new THREE.BoxGeometry(rand(0.08, 0.2), rand(0.05, 0.1), rand(0.08, 0.15)),
            matSet.stoneDark
        );
        chip.position.set(
            x + rand(-2, 2),
            0.04,
            z + rand(-2, 2)
        );
        chip.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
        scene.add(chip);
    }

    return g;
}

export function ruinedWall(scene, x, z, w, h, rot, material, matSet) {
    // Use course-based construction for more realistic ruined walls
    // This matches the quality of your courseWall function
    const group = new THREE.Group();
    const thickness = 0.6;
    const blockH = 0.35;
    const rows = Math.max(2, Math.round(h / blockH));

    // Collapse profile - wall is taller on one end, crumbled on the other
    const collapseProfile = (t) => {
        // Asymmetric collapse: one side stands taller, the other is more ruined
        const baseHeight = 0.5 + 0.5 * (1 - Math.abs(t - 0.3) * 1.2);
        return Math.max(0.2, Math.min(1.0, baseHeight + (Math.random() - 0.5) * 0.15));
    };

    // Build wall from individual stone courses
    let cursor = -w / 2;
    const cols = [];
    while (cursor < w / 2) {
        const bw = 0.4 + Math.random() * 0.6;
        cols.push({ start: cursor, width: Math.min(bw, w / 2 - cursor) });
        cursor += bw + 0.03 + Math.random() * 0.04;
    }

    cols.forEach((col, ci) => {
        // Column height based on collapse profile
        const t = (col.start + w / 2) / w;
        const profileMul = collapseProfile(t);
        const colRows = Math.max(1, Math.round(rows * profileMul * (0.85 + Math.random() * 0.15)));

        // Skip some columns for gaps (about 10% missing)
        if (Math.random() < 0.1) return;

        for (let r = 0; r < colRows; r++) {
            // Some stones fallen out (more near top)
            const fallChance = 0.03 + (r / colRows) * 0.08;
            if (Math.random() < fallChance) continue;

            const bh = blockH * (0.85 + Math.random() * 0.15);
            const stagger = (r % 2 === 0) ? 0.15 : -0.15;

            // Displaced/bulging stones (about to fall)
            const displaced = Math.random() < 0.03 + (r / colRows) * 0.02;

            const block = new THREE.Mesh(
                new THREE.BoxGeometry(
                    col.width * (0.9 + Math.random() * 0.1),
                    bh,
                    thickness * (0.85 + Math.random() * 0.15)
                ),
                material || (Math.random() < 0.15 ? matSet.moss : (Math.random() < 0.6 ? matSet.stone : matSet.stoneDark))
            );

            // Position with slight randomness
            block.position.set(
                col.start + col.width / 2 + stagger * 0.1 + (Math.random() - 0.5) * 0.05,
                r * blockH + bh / 2 + (Math.random() - 0.5) * 0.02,
                displaced ? 0.15 + Math.random() * 0.2 : (Math.random() - 0.5) * 0.05
            );

            // Rotation for natural look
            block.rotation.y = (Math.random() - 0.5) * 0.08;
            block.rotation.x = displaced ? (Math.random() - 0.5) * 0.15 : (Math.random() - 0.5) * 0.02;
            block.rotation.z = displaced ? (Math.random() - 0.5) * 0.15 : (Math.random() - 0.5) * 0.02;

            group.add(block);
        }
    });

    // Position the wall
    group.position.set(x, 0, z);
    group.rotation.y = rot;
    scene.add(group);

    // Add rubble piles along both sides (matching original function call)
    if (matSet) {
        // Main rubble pile on one side
        rubblePile(scene,
            x + Math.sin(rot) * (w * 0.25) + (Math.random() - 0.5) * 0.5,
            z + Math.cos(rot) * (w * 0.25) + (Math.random() - 0.5) * 0.5,
            w * 0.3 + Math.random() * 0.15,
            5 + Math.floor(Math.random() * 4),
            matSet
        );

        // Secondary rubble on the other side (optional)
        if (Math.random() < 0.6) {
            rubblePile(scene,
                x - Math.sin(rot) * (w * 0.2) + (Math.random() - 0.5) * 0.4,
                z - Math.cos(rot) * (w * 0.2) + (Math.random() - 0.5) * 0.4,
                w * 0.15 + Math.random() * 0.1,
                3 + Math.floor(Math.random() * 3),
                matSet
            );
        }

        // Additional fallen blocks at the base
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

    // Add some ivy if matSet has moss (optional, matches your other structures)
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

    return group; // Return the group for potential further manipulation
}

// ---------------------------------------------------------------------------
// archway: A broken stone archway that shifts between ruin and memory.
// The stones remember being stacked by living hands. The arch remembers
// being complete, sunlight streaming through, people passing beneath.
// ---------------------------------------------------------------------------
export function archway(scene, pos, rot, matSet) {
    const g = new THREE.Group();
    const width = 3.2;
    const height = 3.6;
    const pillarRadius = 0.45;
    const archThickness = 0.5;

    // -------------------------------------------------------------------
    // 1. LEFT PILLAR - stands with quiet dignity, less damaged
    // -------------------------------------------------------------------
    const leftPillar = new THREE.Group();

    // Simple base - worn smooth by time
    const baseL = new THREE.Mesh(
        new THREE.CylinderGeometry(pillarRadius * 1.4, pillarRadius * 1.6, 0.3, 8),
        matSet.stoneDark
    );
    baseL.position.y = 0.15;
    // Rounded edges from centuries of wind
    const baseLPos = baseL.geometry.attributes.position;
    for (let j = 0; j < baseLPos.count; j++) {
        const x = baseLPos.getX(j);
        const y = baseLPos.getY(j);
        const z = baseLPos.getZ(j);
        const dist = Math.sqrt(x * x + z * z);
        // Soften edges
        if (y > 0.1 && dist > pillarRadius * 1.2) {
            baseLPos.setY(j, y - 0.02);
        }
    }
    baseLPos.needsUpdate = true;
    baseL.geometry.computeVertexNormals();
    leftPillar.add(baseL);

    // Smooth, worn drums - stacked by hands that are now dust
    const drumCount = 6;
    let yPos = 0.3;

    for (let i = 0; i < drumCount; i++) {
        const drumHeight = 0.5;
        const drumRadius = pillarRadius * (1 - i * 0.02);

        // Smooth cylinder - these stones have been touched by rain and wind
        const drumGeo = new THREE.CylinderGeometry(drumRadius, drumRadius * 1.01, drumHeight, 10);

        // Gentle weathering - no harsh breaks, just time's soft touch
        const positions = drumGeo.attributes.position;
        for (let j = 0; j < positions.count; j++) {
            const x = positions.getX(j);
            const y = positions.getY(j);
            const z = positions.getZ(j);
            const dist = Math.sqrt(x * x + z * z);
            // Subtle erosion
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
            i === 0 ? matSet.moss : matSet.stone  // moss only at base
        );

        drum.position.set(
            0,
            yPos + drumHeight / 2,
            0
        );
        drum.rotation.y = (i * Math.PI) / 4; // subtle rotation pattern
        leftPillar.add(drum);
        yPos += drumHeight * 0.98;
    }

    // Simple capital - almost worn away
    const capitalL = new THREE.Mesh(
        new THREE.CylinderGeometry(pillarRadius * 1.1, pillarRadius * 0.9, 0.15, 8),
        matSet.stone
    );
    capitalL.position.y = yPos + 0.075;
    // Rounded, weathered edges
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

    // -------------------------------------------------------------------
    // 2. RIGHT PILLAR - broken mid-height, as if time simply stopped
    // -------------------------------------------------------------------
    const rightPillar = new THREE.Group();

    // Base - cracked but still standing
    const baseR = new THREE.Mesh(
        new THREE.CylinderGeometry(pillarRadius * 1.3, pillarRadius * 1.5, 0.25, 8),
        matSet.stoneDark
    );
    baseR.position.y = 0.125;
    // A single significant crack
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

    // Three drums, then a clean break - like the memory cuts off
    const drumCountR = 3;
    yPos = 0.25;

    for (let i = 0; i < drumCountR; i++) {
        const drumHeight = 0.5;
        const drumRadius = pillarRadius * (1 - i * 0.03);

        const drumGeo = new THREE.CylinderGeometry(drumRadius, drumRadius * 1.02, drumHeight, 8);

        // Light weathering
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

        drum.position.set(
            0.02 * i, // slight lean
            yPos + drumHeight / 2,
            0.01 * i
        );
        drum.rotation.y = (i * Math.PI) / 3;
        rightPillar.add(drum);
        yPos += drumHeight * 0.97;
    }

    // Broken top - stones that once continued upward
    const brokenTop = new THREE.Mesh(
        new THREE.CylinderGeometry(pillarRadius * 0.9, pillarRadius * 0.95, 0.15, 8),
        matSet.stoneDark
    );
    brokenTop.position.y = yPos + 0.075;
    // Jagged break edge
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

    // -------------------------------------------------------------------
    // 3. ARCH - incomplete, reaching toward what it once was
    // -------------------------------------------------------------------
    const archGroup = new THREE.Group();

    // Create a partial arch that starts from left pillar but fades out
    const archSegments = 14;
    const archPoints = [];
    const archRadius = width / 2 + 0.3;

    // Only create arch from left side, stopping before the center
    for (let i = 0; i <= archSegments; i++) {
        const t = i / archSegments;
        const angle = -Math.PI / 2 + t * Math.PI * 0.7; // stops before keystone
        const x = Math.cos(angle) * archRadius * 0.5;
        const y = height - 0.2 + Math.sin(angle) * archRadius * 0.5;
        archPoints.push(new THREE.Vector3(x, y, 0));
    }

    // Smooth, worn arch stone
    const archCurve = new THREE.CatmullRomCurve3(archPoints);
    const archTube = new THREE.TubeGeometry(archCurve, 14, 0.3, 8, false);

    // Gentle weathering, no harsh damage
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

    // A few remaining voussoirs, like memories clinging on
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

        // Soft edges
        const vPos = voussoir.geometry.attributes.position;
        for (let j = 0; j < vPos.count; j++) {
            const vx = vPos.getX(j);
            const vy = vPos.getY(j);
            if (Math.abs(vx) > 0.1) {
                vPos.setX(j, vx * 0.95);
            }
        }
        vPos.needsUpdate = true;
        voussoir.geometry.computeVertexNormals();

        archGroup.add(voussoir);
    }

    g.add(archGroup);

    // -------------------------------------------------------------------
    // 4. GHOST OF THE KEYSTONE - a faint impression where it should be
    // -------------------------------------------------------------------
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

    // -------------------------------------------------------------------
    // 5. FALLEN STONES - resting where they fell, not scattered
    // -------------------------------------------------------------------
    // Fallen arch stones near the right pillar
    const fallenArch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.3, 8),
        matSet.stone
    );
    fallenArch.position.set(0.5, 0.15, 0);
    fallenArch.rotation.x = Math.PI / 2;
    fallenArch.rotation.z = 0.3;
    g.add(fallenArch);

    // A stone near the broken top, where it fell
    const fallenTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.2, 0.4),
        matSet.stoneDark
    );
    fallenTop.position.set(1.8, 0.1, -0.5);
    fallenTop.rotation.y = Math.PI / 4;
    fallenTop.rotation.x = 0.2;
    g.add(fallenTop);

    // -------------------------------------------------------------------
    // 6. SUBTLE MOSS - growing where shadow lingers
    // -------------------------------------------------------------------
    if (matSet.moss) {
        // Moss only at the very base, where moisture collects
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

    // -------------------------------------------------------------------
    // 7. SUBTLE DEBRIS - light dusting, not heavy rubble
    // -------------------------------------------------------------------
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

    // -------------------------------------------------------------------
    // 8. FAINT FOUNDATION - barely visible, like a memory
    // -------------------------------------------------------------------
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
// courseWall: builds a wall from individually placed, individually sized
// stone blocks in rows ("courses") instead of one sculpted slab. Height
// varies along the wall's length via a collapse profile so it looks like it
// broke unevenly — taller near one end, ragged/gapped near the other, with
// occasional missing blocks (fell out) and the odd displaced block (bulging,
// about to fall). This single change is what makes a wall look built rather
// than modeled.
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
        cursor += bw + rand(0.02, 0.06); // mortar gap
    }

    cols.forEach((col, ci) => {
        // how tall THIS column of stone stands — the collapse profile lets
        // callers describe "high near the corner, low mid-span" etc.
        const t = (col.start + length / 2) / length;
        const profileMul = collapseProfile ? collapseProfile(t) : 1;
        const colRows = Math.max(1, Math.round(rows * profileMul * rand(0.85, 1.0)));

        // skip a whole column to open a doorway/window gap
        if (doorway && col.start > doorway.from - length / 2 && col.start < doorway.to - length / 2) {
            return;
        }

        for (let r = 0; r < colRows; r++) {
            if (Math.random() < 0.05) continue; // a stone fell out entirely

            const bh = blockH * rand(0.85, 1.05);
            const stagger = (r % 2 === 0) ? 0.15 : -0.15; // running bond
            const displaced = Math.random() < 0.04; // rare bulging/about-to-fall block

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
// foundationFootprint: a low ring of half-buried stones marking where a
// building's walls used to stand, even in sections where the wall itself is
// completely gone. Real ruin sites are mostly this.
// ---------------------------------------------------------------------------
export function foundationFootprint(scene, x, z, w, d, rot, matSet) {
    const g = new THREE.Group();
    const perimeter = [];
    for (let i = -w / 2; i <= w / 2; i += rand(0.5, 0.7)) { perimeter.push([i, -d / 2]); perimeter.push([i, d / 2]); }
    for (let j = -d / 2; j <= d / 2; j += rand(0.5, 0.7)) { perimeter.push([-w / 2, j]); perimeter.push([w / 2, j]); }

    perimeter.forEach(([px, pz]) => {
        if (Math.random() < 0.2) return; // gaps in the footprint too
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
// floorSlabs: cracked flagstone floor with gaps and uneven settling, for
// building interiors and plazas.
// ---------------------------------------------------------------------------
export function floorSlabs(scene, x, z, w, d, rot, matSet) {
    const g = new THREE.Group();
    for (let ix = -w / 2; ix < w / 2; ix += rand(0.7, 1.0)) {
        for (let iz = -d / 2; iz < d / 2; iz += rand(0.7, 1.0)) {
            if (Math.random() < 0.12) continue; // missing slab
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
// ivyVine: a climbing vine up a wall/column using a tube along a wandering
// curve — cheap but reads immediately as "nature reclaiming this place".
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
// windingPath: a worn stone/dirt path connecting two points with gentle
// wander instead of a straight line — this is what turns a set of points
// into a place people actually walked between.
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
        if (Math.random() < 0.35) continue; // path stones are sparse/broken, not continuous paving
        const s = rand(0.35, 0.6);
        const stone = new THREE.Mesh(jaggedBox(s, 0.12, s, { chipChance: 0.1 }), Math.random() < 0.7 ? matSet.stone : matSet.moss);
        stone.position.set(p.x, rand(-0.04, 0.01), p.z);
        stone.rotation.y = Math.random() * Math.PI;
        scene.add(stone);
    }
}

// ---------------------------------------------------------------------------
// lowWall: a short property/boundary wall — same coursing logic as
// courseWall but low and gappy, the kind of thing that used to mark a yard
// or pen rather than hold up a roof.
// ---------------------------------------------------------------------------
export function lowWall(scene, x, z, length, rot, matSet) {
    return courseWall(scene, x, z, length, rand(0.5, 0.9), rot, matSet, {
        thickness: 0.28,
        collapseProfile: (t) => 0.5 + 0.5 * Math.sin(t * Math.PI * rand(1, 2))
    });
}

// ---------------------------------------------------------------------------
// emptyPlot: a building that's gone almost entirely — just a foundation
// outline, a few floor slabs, and ground reclaimed by weeds/a tree. This is
// cheap to place many of, and it's what makes a settlement feel like it had
// more than 10 buildings without hand-detailing 30 ruins.
// ---------------------------------------------------------------------------
export function emptyPlot(scene, x, z, w, d, rot, matSet) {
    foundationFootprint(scene, x, z, w, d, rot, matSet);
    if (Math.random() < 0.6) floorSlabs(scene, x, z, w * 0.7, d * 0.7, rot, matSet);
    if (Math.random() < 0.5) rubblePile(scene, x + rand(-w / 4, w / 4), z + rand(-d / 4, d / 4), rand(0.6, 1.2), rand(2, 4), matSet);
    // one or two corner stubs, just enough to hint a wall used to be there
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
// campfireRing: stones in a ring around a charred, collapsed log — a signal
// that people camped/lived here, not just built and left.
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
// storageDebris: broken crates/barrels — the small clutter that reads as
// "people stored things here" rather than a purely architectural ruin.
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
            crate.rotation.z = Math.random() < 0.3 ? rand(0.3, 0.6) : 0; // some tipped over
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
// cartWreck: an abandoned handcart — broken wheel lying flat, cracked bed,
// one shaft still upright. A strong "someone left mid-task" story beat.
// ---------------------------------------------------------------------------
export function cartWreck(scene, x, z, rot, matSet) {
    const g = new THREE.Group();

    // CART BED - flat rectangular platform with side rails
    const bedGeo = new THREE.BoxGeometry(1.8, 0.08, 1.2);
    const bed = new THREE.Mesh(bedGeo, matSet.wood);
    bed.position.set(0, 0.35, 0);
    bed.rotation.z = rand(-0.15, 0.15);
    bed.rotation.x = rand(-0.05, 0.05);
    g.add(bed);

    // Side rails (the raised edges of the cart)
    const railGeo = new THREE.BoxGeometry(1.8, 0.2, 0.06);

    const railLeft = new THREE.Mesh(railGeo, matSet.wood);
    railLeft.position.set(0, 0.5, -0.57);
    railLeft.rotation.z = bed.rotation.z;
    g.add(railLeft);

    const railRight = new THREE.Mesh(railGeo, matSet.wood);
    railRight.position.set(0, 0.5, 0.57);
    railRight.rotation.z = bed.rotation.z;
    g.add(railRight);

    // Front rail (broken)
    const railFront = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.2, 1.1),
        matSet.woodDry || matSet.wood
    );
    railFront.position.set(0.85, 0.5, 0);
    railFront.rotation.x = rand(-0.3, -0.1);
    g.add(railFront);

    // Support beams under the bed
    for (let i = -1; i <= 1; i += 2) {
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.1, 0.15),
            matSet.wood
        );
        beam.position.set(0, 0.28, i * 0.4);
        beam.rotation.z = bed.rotation.z;
        g.add(beam);
    }

    // AXLE - horizontal bar connecting wheels
    const axle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 1.4, 8),
        matSet.woodDry || matSet.wood
    );
    axle.rotation.x = Math.PI / 2;
    axle.position.set(-0.2, 0.35, 0);
    g.add(axle);

    // WHEELS - large wooden wheels
    const wheelGeo = new THREE.TorusGeometry(0.5, 0.07, 8, 16);

    // Still attached wheel (left side)
    const wheelAttached = new THREE.Mesh(wheelGeo, matSet.wood);
    wheelAttached.position.set(-0.2, 0.35, -0.7);
    wheelAttached.rotation.y = rand(-0.2, 0.2);
    g.add(wheelAttached);

    // Wheel spokes for attached wheel
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

    // Hub for attached wheel
    const hubAttached = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.15, 8),
        matSet.woodDry || matSet.wood
    );
    hubAttached.rotation.x = Math.PI / 2;
    hubAttached.position.set(-0.2, 0.35, -0.7);
    g.add(hubAttached);

    // Fallen wheel (right side) - lying on ground
    const wheelFallen = new THREE.Mesh(wheelGeo, matSet.wood);
    wheelFallen.position.set(0.9, 0.08, 0.4);
    wheelFallen.rotation.x = Math.PI / 2;
    wheelFallen.rotation.z = rand(-0.3, 0.3);
    g.add(wheelFallen);

    // Broken spokes on fallen wheel
    for (let i = 0; i < 3; i++) {
        const brokenSpoke = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.04, rand(0.2, 0.4), 4),
            matSet.woodDry || matSet.wood
        );
        brokenSpoke.position.set(
            0.9 + rand(-0.2, 0.2),
            0.08,
            0.4 + rand(-0.2, 0.2)
        );
        brokenSpoke.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
        g.add(brokenSpoke);
    }

    // SHAFTS - the poles for pulling the cart
    // Left shaft (upright, telling the story)
    const shaftLeft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.07, 2.2, 6),
        matSet.wood
    );
    shaftLeft.position.set(-1.3, 0.4, -0.4);
    shaftLeft.rotation.z = Math.PI / 2 - 0.3;
    shaftLeft.rotation.y = rand(-0.1, 0.1);
    g.add(shaftLeft);

    // Right shaft (broken, on ground)
    const shaftRight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.065, 1.5, 6),
        matSet.woodDry || matSet.wood
    );
    shaftRight.position.set(-0.8, 0.1, 0.4);
    shaftRight.rotation.z = Math.PI / 2 + 0.2;
    shaftRight.rotation.x = rand(-0.2, 0.2);
    g.add(shaftRight);

    // Crossbar between shafts (yoke)
    const yoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.1, 0.08),
        matSet.wood
    );
    yoke.position.set(-1.2, 0.5, 0);
    yoke.rotation.y = rand(-0.15, 0.15);
    g.add(yoke);

    // Scattered cargo
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

    // Scattered items
    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.22, 0.5, 8),
        matSet.woodDry || matSet.wood
    );
    barrel.position.set(-0.4, 0.25, 1.0);
    barrel.rotation.x = Math.PI / 2 + rand(-0.2, 0.2);
    barrel.rotation.z = rand(0, Math.PI);
    g.add(barrel);

    // Position and rotate the entire wreck
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);

    // Add surrounding debris
    rubblePile(scene, x + rand(-0.5, 0.5), z + rand(-0.5, 0.5), rand(0.8, 1.2), rand(4, 6), matSet);

    // Scattered planks and splinters
    for (let i = 0; i < 5; i++) {
        const plank = new THREE.Mesh(
            new THREE.BoxGeometry(rand(0.3, 0.7), 0.04, rand(0.1, 0.2)),
            matSet.woodDry || matSet.wood
        );
        plank.position.set(
            x + rand(-2, 2),
            0.03,
            z + rand(-2, 2)
        );
        plank.rotation.y = rand(0, Math.PI * 2);
        plank.rotation.x = rand(-0.1, 0.1);
        scene.add(plank);
    }

    return g;
}

// ---------------------------------------------------------------------------
// createTree: simple recursion instead of three branches stuck on a trunk
// at the same angle-family — gives varied, less "spider" silhouettes.
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

export function registerRuinsStructures(Game) {
    // 0. Ambient Debris & Scatter Walls — plus settlement-scale filler: empty
    // building plots, extra trees, and small camps between the 10 main beats
    // so the map reads as a place many people lived, not 10 curated exhibits.
    Game.registerStructure((scene, M) => {
        const wallSegs = [
            [-8, -10, 7, 4.2, 0.3], [-1, -13, 6, 3.0, 0.15], [10, -8, 8, 5.0, -0.4],
            [12, 2, 5, 2.6, 1.4], [8, 11, 7, 3.6, 2.1], [-6, 12, 6, 4.6, -2.2], [-13, 4, 6, 3.2, -1.1],
        ];
        wallSegs.forEach(([x, z, w, h, rot], i) => ruinedWall(scene, x, z, w, h, rot, i % 2 ? M.stone : M.stoneDark, M));

        [[-3, -3, 4.5], [4, -4, 3.6], [6, 4, 2.8], [-5, 5, 4.0], [0, 7, 3.2], [-9, -2, 2.4]]
            .forEach(([x, z, h]) => brokenColumn(scene, x, z, h, Math.random() * Math.PI, M));

        // Empty plots — building footprints with nothing left standing.
        // Placed off the main beats so they widen the settlement's footprint
        // without competing with the narrative locations.
        const emptyPlotSpots = [
            [-4, -22, 5, 4], [-18, -12, 4.5, 4.5], [12, -18, 5, 4],
            [24, -18, 4, 5], [26, -2, 5, 4.5], [8, 16, 4.5, 4],
            [-8, 24, 5, 5], [18, 26, 4, 4.5], [-4, 8, 4, 3.5]
        ];
        emptyPlotSpots.forEach(([x, z, w, d]) => emptyPlot(scene, x, z, w, d, Math.random() * Math.PI, M));

        // A couple of small camps scattered between beats — someone stopped
        // here, not just architecture decaying in place.
        [[-6, -25], [22, 12], [-16, 18]].forEach(([x, z]) => {
            campfireRing(scene, x, z, M);
            if (Math.random() < 0.6) storageDebris(scene, x + rand(-1.5, 1.5), z + rand(-1.5, 1.5), M);
        });

        // Extra trees scattered generally — overgrowth reclaiming open ground
        for (let i = 0; i < 10; i++) {
            const x = rand(-28, 32), z = rand(-32, 32);
            // keep clear of the narrative beats themselves
            const tooClose = Object.values(LOCATIONS).some(p => Math.hypot(p.x - x, p.z - z) < 4);
            if (!tooClose) createTree(scene, new THREE.Vector3(x, 0, z), M);
        }

        // Breadcrumbs (Memory Lilies) — slightly irregular clustering instead of a fixed pair
        const lilyGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
        const lilyMat = new THREE.MeshBasicMaterial({ color: 0x8ea0e0, transparent: true, opacity: 0.8 });
        const addLily = (pos) => {
            const lily = new THREE.Mesh(lilyGeo, lilyMat);
            lily.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 2.4, 0.15, (Math.random() - 0.5) * 2.4));
            lily.rotation.set(Math.random() * 0.2, 0, Math.random() * 0.2);
            lily.scale.setScalar(rand(0.7, 1.2));
            scene.add(lily);
        };

        Object.values(LOCATIONS).forEach(pos => {
            const clusterSize = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < clusterSize; i++) {
                addLily(pos.clone().lerp(new THREE.Vector3(0, 0, 0), rand(0.15, 0.6)));
            }
        });
    });

    // 1. Archway
    Game.registerStructure((scene, M) => {
        archway(scene, LOCATIONS.ARCHWAY, 0.5, M);
        ivyVine(scene, LOCATIONS.ARCHWAY.clone().add(new THREE.Vector3(-1.5, 0, 0.3)), 2.8, M);
        foundationFootprint(scene, LOCATIONS.ARCHWAY.x, LOCATIONS.ARCHWAY.z, 4, 2, 0.5, M);
    });

    // 2. The Forgotten Path
    Game.registerStructure((scene, M) => {
        createTree(scene, LOCATIONS.PATH.clone().add(new THREE.Vector3(-2.3, 0, 1.1)), M);
        createTree(scene, LOCATIONS.PATH.clone().add(new THREE.Vector3(1.8, 0, -1.4)), M);
        createTree(scene, LOCATIONS.PATH.clone().add(new THREE.Vector3(-0.6, 0, -2.6)), M);

        const pGeo = new THREE.TetrahedronGeometry(0.2);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0 });
        const pendant = new THREE.Mesh(pGeo, pMat);
        pendant.position.copy(LOCATIONS.PATH).add(new THREE.Vector3(0, 0.2, 0));
        scene.add(pendant);
        Game.registerMemory(pendant);
    });

    // 3. The Empty House — assembled from individual coursed stones, real
    // doorway gap, buried foundation on the missing 4th wall, flagstone
    // floor, and ivy climbing the tallest remaining corner.
    Game.registerStructure((scene, M) => {
        const hx = LOCATIONS.HOUSE.x, hz = LOCATIONS.HOUSE.z;

        floorSlabs(scene, hx, hz, 5.6, 5.6, 0, M);
        foundationFootprint(scene, hx, hz, 6, 6, 0, M); // full footprint, walls only partially standing on it

        // back wall — tallest, near-intact, slight sag mid-span
        courseWall(scene, hx, hz - 3, 6, 3, 0, M, {
            collapseProfile: (t) => 0.85 + 0.15 * Math.abs(t - 0.5) * 2
        });
        // front wall — heavily collapsed, doorway gap left of center
        courseWall(scene, hx, hz + 3, 6, 2.4, Math.PI, M, {
            collapseProfile: (t) => 0.3 + 0.5 * t,
            doorway: { from: 1.2, to: 2.8 }
        });
        // side wall — jagged partial collapse
        courseWall(scene, hx - 3, hz, 6, 3, Math.PI / 2, M, {
            collapseProfile: (t) => 0.5 + 0.4 * Math.sin(t * Math.PI)
        });
        // 4th wall is gone entirely — only the foundation marks it, this is
        // the "missing wall" every real ruin has and games usually skip.

        const fireplace = new THREE.Mesh(jaggedBox(2, 2, 1, { chipChance: 0.15 }), M.stone);
        fireplace.position.set(hx, 1, hz - 2.5);
        scene.add(fireplace);

        // fallen roof beams, resting at angles across the interior
        for (let i = 0; i < 3; i++) {
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, rand(3.5, 5), 6), M.wood);
            beam.position.set(hx + rand(-2, 1.5), rand(0.1, 0.5), hz + rand(-1.5, 2));
            beam.rotation.z = rand(-0.2, 0.2);
            beam.rotation.y = rand(0, Math.PI);
            beam.rotation.x = Math.PI / 2 + rand(-0.15, 0.15);
            scene.add(beam);
        }

        ivyVine(scene, new THREE.Vector3(hx - 2.8, 0.3, hz - 2.9), 2.6, M);
        ivyVine(scene, new THREE.Vector3(hx + 1, 0.3, hz - 3), 2.2, M);

        rubblePile(scene, hx, hz + 3, 2.5, 8, M);
        rubblePile(scene, hx + 3, hz, 1.6, 5, M); // where the missing wall used to be
    });

    // 4. The Well — set in a small paved courtyard with a low boundary wall
    // (once enclosed the well-house), snapped support post, and abandoned
    // buckets/rope debris nearby.
    Game.registerStructure((scene, M) => {
        const wx = LOCATIONS.WELL.x, wz = LOCATIONS.WELL.z;
        const g = new THREE.Group();
        const ringCount = 10;
        for (let i = 0; i < ringCount; i++) {
            const a = (i / ringCount) * Math.PI * 2;
            const settle = rand(-0.05, 0.05);
            const block = new THREE.Mesh(new THREE.BoxGeometry(0.7, rand(0.7, 0.85), 0.5), M.stoneDark);
            block.position.set(Math.cos(a) * (1.3 + settle), 0.4, Math.sin(a) * (1.3 + settle));
            block.rotation.y = -a;
            g.add(block);
        }
        const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6);
        const postL = new THREE.Mesh(postGeo, M.wood); postL.position.set(-1, 1.9, 0);
        g.add(postL);
        // right post snapped off short, beam hangs at an angle instead of level
        const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.6, 6), M.wood);
        postR.position.set(1, 0.7, 0);
        g.add(postR);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.15, 0.15), M.wood);
        beam.position.set(-0.2, 2.6, 0);
        beam.rotation.z = -0.5;
        g.add(beam);

        g.position.copy(LOCATIONS.WELL);
        scene.add(g);

        floorSlabs(scene, wx, wz, 6, 6, 0.3, M);
        lowWall(scene, wx - 3.4, wz, 4, Math.PI / 2, M);
        lowWall(scene, wx, wz - 3.4, 5.5, 0, M);
        ivyVine(scene, new THREE.Vector3(wx - 3.3, 0.1, wz - 1), 1.4, M);
        storageDebris(scene, wx + 2, wz + 1.5, M);
        rubblePile(scene, wx + 1.5, wz, 1, 4, M);
    });

    // 5. The Stone Garden — benches at irregular distances/angles, not a perfect ring
    Game.registerStructure((scene, M) => {
        const g = new THREE.Group();
        const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.1, 0.4, 12), M.stoneDark);
        fountainBase.position.y = 0.2;
        const fountainCore = new THREE.Mesh(jaggedBox(1.0, 1.5, 1.0, { chipChance: 0.15 }), M.stone);
        fountainCore.position.y = 0.75;
        g.add(fountainBase, fountainCore);

        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4 + rand(-0.15, 0.15);
            const dist = rand(3.6, 4.4);
            const bench = new THREE.Mesh(jaggedBox(2, 0.4, 0.6), Math.random() < 0.5 ? M.stone : M.moss);
            bench.position.set(Math.cos(a) * dist, 0.3, Math.sin(a) * dist);
            bench.rotation.y = -a + rand(-0.1, 0.1);
            g.add(bench);
        }

        const fGeo = new THREE.ConeGeometry(0.2, 0.5, 6);
        const fMat = new THREE.MeshBasicMaterial({ color: 0xffaa88, transparent: true, opacity: 0 });
        const memFlower = new THREE.Mesh(fGeo, fMat);
        memFlower.position.set(1.5, 0.25, 0);
        g.add(memFlower);
        Game.registerMemory(memFlower);

        g.position.copy(LOCATIONS.GARDEN);
        scene.add(g);
        floorSlabs(scene, LOCATIONS.GARDEN.x, LOCATIONS.GARDEN.z, 9, 9, 0, M);
        rubblePile(scene, LOCATIONS.GARDEN.x, LOCATIONS.GARDEN.z, 2.3, 6, M);
    });

    // 6. The Statue — more damage, base rubble, off-axis pose, set on a
    // small paved dais with a low surrounding wall (once a shrine/plaza)
    Game.registerStructure((scene, M) => {
        const sx = LOCATIONS.STATUE.x, sz = LOCATIONS.STATUE.z;
        const g = new THREE.Group();
        const base = new THREE.Mesh(jaggedBox(1.6, 0.5, 1.6, { chipChance: 0.15 }), M.stoneDark);
        base.position.y = 0.25;
        const torso = new THREE.Mesh(jaggedBox(1.0, 1.8, 0.8), M.stone);
        torso.position.y = 1.4;
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.6, 6), M.stone); // shorter — the rest broke off
        arm.position.set(0.55, 2.0, 0);
        arm.rotation.z = -0.9;
        g.add(base, torso, arm);
        g.position.copy(LOCATIONS.STATUE);
        g.rotation.y = -0.6;
        scene.add(g);
        rubblePile(scene, sx + 1.1, sz - 0.8, 1.4, 5, M);

        floorSlabs(scene, sx, sz, 5, 5, 0, M);
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + rand(-0.1, 0.1);
            lowWall(scene, sx + Math.cos(a) * 3, sz + Math.sin(a) * 3, 2.2, -a + Math.PI / 2, M);
        }
        ivyVine(scene, new THREE.Vector3(sx - 0.6, 0.5, sz - 0.4), 1.6, M);

        const memGeo = new THREE.CylinderGeometry(0.0, 1.2, 3, 8);
        const memMat = new THREE.MeshBasicMaterial({ color: 0xffaa55, transparent: true, opacity: 0, wireframe: true });
        const memMesh = new THREE.Mesh(memGeo, memMat);
        memMesh.position.copy(LOCATIONS.STATUE).add(new THREE.Vector3(-2.5, 1.5, -2));
        memMesh.visible = false;
        scene.add(memMesh);
        Game.registerMemory(memMesh);
    });

    // 7. The Broken Tower — a real curved section of coursed wall still
    // standing (you can tell it used to be a cylinder), collapsed into a
    // rubble mound on the side it fell toward. Reads as "this fell over" not
    // "cubes were spawned in a circle".
    Game.registerStructure((scene, M) => {
        const tx = LOCATIONS.TOWER.x, tz = LOCATIONS.TOWER.z;
        const radius = 4.2;

        foundationFootprint(scene, tx, tz, radius * 2, radius * 2, 0, M);

        // standing arc — about 40% of the circle survives, tallest at one end
        const archSpan = Math.PI * 0.8;
        const segments = 10;
        for (let i = 0; i <= segments; i++) {
            const a = -archSpan / 2 + (i / segments) * archSpan;
            const heightHere = 5.5 * (0.4 + 0.6 * (i / segments)); // ramps up around the arc
            const px = tx + Math.cos(a) * radius;
            const pz = tz + Math.sin(a) * radius;
            courseWall(scene, px, pz, 1.15, heightHere, -a + Math.PI / 2, M, {
                collapseProfile: (t) => 1 - Math.abs(t - 0.5) * 0.3
            });
        }

        // the rest of the tower collapsed outward on the opposite side
        for (let i = 0; i < 35; i++) {
            const a = Math.PI + rand(-0.9, 0.9);
            const r = Math.pow(Math.random(), 1.3) * radius * 1.6;
            const size = rand(0.5, 1.6) * (1 - r / (radius * 2.2));
            const b = new THREE.Mesh(jaggedBox(size, size, size, { chipChance: 0.25 }), Math.random() < 0.15 ? M.moss : M.stone);
            b.position.set(tx + Math.cos(a) * r, size * 0.3, tz + Math.sin(a) * r);
            b.rotation.set(Math.random() * 0.3, Math.random(), Math.random() * 0.3);
            scene.add(b);
        }

        ivyVine(scene, new THREE.Vector3(tx + Math.cos(0) * radius, 0.2, tz + Math.sin(0) * radius), 3.2, M);
    });

    // 8. The Silent Bell — one support post cracked and leaning, bell tilted,
    // standing on a raised timber-and-stone platform (village gathering
    // point), with a long-cold campfire nearby.
    Game.registerStructure((scene, M) => {
        const bx = LOCATIONS.BELL.x, bz = LOCATIONS.BELL.z;
        const g = new THREE.Group();
        const p1 = new THREE.Mesh(jaggedBox(0.4, 5, 0.4, { chipChance: 0.1 }), M.wood);
        p1.position.set(-2, 2.5, 0);
        p1.rotation.z = 0.03;
        const p2 = new THREE.Mesh(jaggedBox(0.4, 5, 0.4, { chipChance: 0.1 }), M.wood);
        p2.position.set(2.1, 2.4, 0.05);
        p2.rotation.z = -0.06; // leaning
        const beam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 0.4), M.wood);
        beam.position.set(0.1, 4.75, 0);
        beam.rotation.z = -0.04;
        g.add(p1, p2, beam);

        const bellGeo = new THREE.CylinderGeometry(0.4, 1.2, 1.5, 12);
        const bell = new THREE.Mesh(bellGeo, M.stoneDark);
        bell.position.set(0.1, 3.75, 0);
        bell.rotation.z = 0.08;
        g.add(bell);

        const memBell = new THREE.Mesh(bellGeo, new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0, wireframe: true }));
        memBell.position.copy(bell.position);
        memBell.rotation.copy(bell.rotation);
        g.add(memBell);
        Game.registerMemory(memBell);

        g.position.copy(LOCATIONS.BELL);
        scene.add(g);
        floorSlabs(scene, bx, bz, 5, 5, 0, M);
        rubblePile(scene, bx, bz, 1.5, 4, M);
        campfireRing(scene, bx + 2.5, bz - 2, M);
        storageDebris(scene, bx - 2.5, bz + 1.5, M);
    });

    // 9. The Old Road — stones sunken/tilted unevenly, low fences marking
    // where fields ran alongside it, and a cart abandoned mid-journey.
    Game.registerStructure((scene, M) => {
        const g = new THREE.Group();
        for (let i = 0; i < 10; i++) {
            const sunk = rand(0, 0.08);
            const stone = new THREE.Mesh(jaggedBox(rand(0.85, 1.1), 0.2, rand(0.85, 1.1)), M.stone);
            stone.position.set(rand(-0.15, 0.15), 0.1 - sunk, i * 1.5 - 7 + rand(-0.1, 0.1));
            stone.rotation.y = (Math.random() - 0.5) * 0.5;
            stone.rotation.x = rand(-0.03, 0.03);
            g.add(stone);
        }
        const marker = new THREE.Mesh(jaggedBox(0.6, 1.5, 0.4, { chipChance: 0.2 }), M.stoneDark);
        marker.position.set(1.5, 0.7, 0);
        marker.rotation.y = -0.2;
        marker.rotation.z = 0.06; // leaning, not planted perfectly upright
        g.add(marker);

        g.position.copy(LOCATIONS.ROAD);
        g.rotation.y = Math.PI / 4;
        scene.add(g);

        const rx = LOCATIONS.ROAD.x, rz = LOCATIONS.ROAD.z;
        lowWall(scene, rx - 2.2, rz - 4, 5, Math.PI / 4, M);
        lowWall(scene, rx + 2.2, rz + 4, 5, Math.PI / 4, M);
        cartWreck(scene, rx - 3, rz + 2, rand(0, Math.PI * 2), M);
    });

    // 10. The Grave — a small enclosed graveyard: main headstone tilted,
    // several real secondary graves at varied age/wear, low perimeter wall.
    Game.registerStructure((scene, M) => {
        const gx = LOCATIONS.GRAVE.x, gz = LOCATIONS.GRAVE.z;
        const g = new THREE.Group();
        const grave = new THREE.Mesh(jaggedBox(0.7, 1.1, 0.25, { chipChance: 0.15 }), M.stoneDark);
        grave.position.y = 0.3;
        grave.rotation.z = 0.08; // subtly toppling
        g.add(grave);

        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + rand(-0.2, 0.2);
            const dist = rand(1.8, 3.0);
            const h = rand(0.4, 0.9);
            const stone = new THREE.Mesh(jaggedBox(0.4, h, 0.15), M.stone);
            stone.position.set(Math.cos(a) * dist, h / 2, Math.sin(a) * dist);
            stone.rotation.y = Math.random();
            stone.rotation.z = rand(-0.1, 0.1);
            g.add(stone);
        }
        g.position.copy(LOCATIONS.GRAVE);
        scene.add(g);
        rubblePile(scene, gx - 1, gz + 0.5, 0.8, 3, M);

        // a handful of additional, individually placed graves — some fully
        // toppled — plus a low perimeter wall enclosing the plot
        const extraGraves = [[3, 2, 0.1], [-2.5, -1.5, 0.02], [2, -2.5, 0.5], [-1, 3, 0.05]];
        extraGraves.forEach(([ex, ez, tilt]) => {
            const eh = rand(0.5, 0.85);
            const eg = new THREE.Mesh(jaggedBox(0.35, eh, 0.13, { chipChance: 0.1 }), Math.random() < 0.3 ? M.moss : M.stone);
            eg.position.set(gx + ex, tilt > 0.3 ? eh * 0.3 : eh / 2, gz + ez); // fully toppled ones lie low
            eg.rotation.z = tilt > 0.3 ? Math.PI / 2 - rand(0, 0.3) : rand(-0.1, 0.15);
            eg.rotation.y = Math.random() * Math.PI;
            scene.add(eg);
        });

        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 8;
            lowWall(scene, gx + Math.cos(a) * 5, gz + Math.sin(a) * 5, 3.6, -a + Math.PI / 2, M);
        }
        createTree(scene, new THREE.Vector3(gx + 4, 0, gz - 3.5), M);
    });

    // 11. Connective tissue — worn paths linking each beat in narrative
    // order. This is what turns 10 isolated set-pieces into one place that
    // people actually lived in and walked through.
    Game.registerStructure((scene, M) => {
        const order = ["ARCHWAY", "PATH", "HOUSE", "WELL", "GARDEN", "STATUE", "TOWER", "BELL", "ROAD", "GRAVE"];
        for (let i = 0; i < order.length - 1; i++) {
            windingPath(scene, LOCATIONS[order[i]], LOCATIONS[order[i + 1]], M, { spacing: 1.3, wander: 1.8 });
        }
        // a couple of secondary desire-lines between nearby beats, since real
        // settlements have more than one path between things
        windingPath(scene, LOCATIONS.HOUSE, LOCATIONS.WELL, M, { spacing: 1.2, wander: 1.2 });
        windingPath(scene, LOCATIONS.GARDEN, LOCATIONS.STATUE, M, { spacing: 1.4, wander: 1.5 });
    });
}
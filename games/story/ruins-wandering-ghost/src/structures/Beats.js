import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import {
    rand, pick, jaggedBox, rubblePile, brokenColumn, ruinedWall,
    archway, courseWall, foundationFootprint, floorSlabs, ivyVine,
    windingPath, lowWall, emptyPlot, campfireRing, storageDebris,
    cartWreck, createTree
} from "./RuinsUtils.js";

export function registerRuinsStructures(Game) {
    // 0. Ambient Debris & Scatter Walls — plus settlement-scale filler: empty
    // building plots, extra trees, and small camps between the 10 main beats
    Game.registerStructure((scene, M) => {
        const wallSegs = [
            [-8, -10, 7, 4.2, 0.3], [-1, -13, 6, 3.0, 0.15], [10, -8, 8, 5.0, -0.4],
            [12, 2, 5, 2.6, 1.4], [8, 11, 7, 3.6, 2.1], [-6, 12, 6, 4.6, -2.2], [-13, 4, 6, 3.2, -1.1],
        ];
        wallSegs.forEach(([x, z, w, h, rot], i) => ruinedWall(scene, x, z, w, h, rot, i % 2 ? M.stone : M.stoneDark, M));

        [[-3, -3, 4.5], [4, -4, 3.6], [6, 4, 2.8], [-5, 5, 4.0], [0, 7, 3.2], [-9, -2, 2.4]]
            .forEach(([x, z, h]) => brokenColumn(scene, x, z, h, Math.random() * Math.PI, M));

        const emptyPlotSpots = [
            [-4, -22, 5, 4], [-18, -12, 4.5, 4.5], [12, -18, 5, 4],
            [24, -18, 4, 5], [26, -2, 5, 4.5], [8, 16, 4.5, 4],
            [-8, 24, 5, 5], [18, 26, 4, 4.5], [-4, 8, 4, 3.5]
        ];
        emptyPlotSpots.forEach(([x, z, w, d]) => emptyPlot(scene, x, z, w, d, Math.random() * Math.PI, M));

        [[-6, -25], [22, 12], [-16, 18]].forEach(([x, z]) => {
            campfireRing(scene, x, z, M);
            if (Math.random() < 0.6) storageDebris(scene, x + rand(-1.5, 1.5), z + rand(-1.5, 1.5), M);
        });

        for (let i = 0; i < 10; i++) {
            const x = rand(-28, 32), z = rand(-32, 32);
            const tooClose = Object.values(LOCATIONS).some(p => Math.hypot(p.x - x, p.z - z) < 4);
            if (!tooClose) createTree(scene, new THREE.Vector3(x, 0, z), M);
        }

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

    // 3. The Empty House
    Game.registerStructure((scene, M) => {
        const hx = LOCATIONS.HOUSE.x, hz = LOCATIONS.HOUSE.z;

        floorSlabs(scene, hx, hz, 5.6, 5.6, 0, M);
        foundationFootprint(scene, hx, hz, 6, 6, 0, M);

        courseWall(scene, hx, hz - 3, 6, 3, 0, M, {
            collapseProfile: (t) => 0.85 + 0.15 * Math.abs(t - 0.5) * 2
        });
        courseWall(scene, hx, hz + 3, 6, 2.4, Math.PI, M, {
            collapseProfile: (t) => 0.3 + 0.5 * t,
            doorway: { from: 1.2, to: 2.8 }
        });
        courseWall(scene, hx - 3, hz, 6, 3, Math.PI / 2, M, {
            collapseProfile: (t) => 0.5 + 0.4 * Math.sin(t * Math.PI)
        });

        const fireplace = new THREE.Mesh(jaggedBox(2, 2, 1, { chipChance: 0.15 }), M.stone);
        fireplace.position.set(hx, 1, hz - 2.5);
        scene.add(fireplace);

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
        rubblePile(scene, hx + 3, hz, 1.6, 5, M);
    });

    // 4. The Well
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

    // 5. The Stone Garden
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

    // 6. The Statue
    Game.registerStructure((scene, M) => {
        const sx = LOCATIONS.STATUE.x, sz = LOCATIONS.STATUE.z;
        const g = new THREE.Group();
        const base = new THREE.Mesh(jaggedBox(1.6, 0.5, 1.6, { chipChance: 0.15 }), M.stoneDark);
        base.position.y = 0.25;
        const torso = new THREE.Mesh(jaggedBox(1.0, 1.8, 0.8), M.stone);
        torso.position.y = 1.4;
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.6, 6), M.stone);
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

    // 7. The Broken Tower
    Game.registerStructure((scene, M) => {
        const tx = LOCATIONS.TOWER.x, tz = LOCATIONS.TOWER.z;
        const radius = 4.2;

        foundationFootprint(scene, tx, tz, radius * 2, radius * 2, 0, M);

        const archSpan = Math.PI * 0.8;
        const segments = 10;
        for (let i = 0; i <= segments; i++) {
            const a = -archSpan / 2 + (i / segments) * archSpan;
            const heightHere = 5.5 * (0.4 + 0.6 * (i / segments));
            const px = tx + Math.cos(a) * radius;
            const pz = tz + Math.sin(a) * radius;
            courseWall(scene, px, pz, 1.15, heightHere, -a + Math.PI / 2, M, {
                collapseProfile: (t) => 1 - Math.abs(t - 0.5) * 0.3
            });
        }

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

    // 8. The Silent Bell
    Game.registerStructure((scene, M) => {
        const bx = LOCATIONS.BELL.x, bz = LOCATIONS.BELL.z;
        const g = new THREE.Group();
        const p1 = new THREE.Mesh(jaggedBox(0.4, 5, 0.4, { chipChance: 0.1 }), M.wood);
        p1.position.set(-2, 2.5, 0);
        p1.rotation.z = 0.03;
        const p2 = new THREE.Mesh(jaggedBox(0.4, 5, 0.4, { chipChance: 0.1 }), M.wood);
        p2.position.set(2.1, 2.4, 0.05);
        p2.rotation.z = -0.06;
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

    // 9. The Old Road
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
        marker.rotation.z = 0.06;
        g.add(marker);

        g.position.copy(LOCATIONS.ROAD);
        g.rotation.y = Math.PI / 4;
        scene.add(g);

        const rx = LOCATIONS.ROAD.x, rz = LOCATIONS.ROAD.z;
        lowWall(scene, rx - 2.2, rz - 4, 5, Math.PI / 4, M);
        lowWall(scene, rx + 2.2, rz + 4, 5, Math.PI / 4, M);
        cartWreck(scene, rx - 3, rz + 2, rand(0, Math.PI * 2), M);
    });

    // 10. The Grave
    Game.registerStructure((scene, M) => {
        const gx = LOCATIONS.GRAVE.x, gz = LOCATIONS.GRAVE.z;
        const g = new THREE.Group();
        const grave = new THREE.Mesh(jaggedBox(0.7, 1.1, 0.25, { chipChance: 0.15 }), M.stoneDark);
        grave.position.y = 0.3;
        grave.rotation.z = 0.08;
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

        const extraGraves = [[3, 2, 0.1], [-2.5, -1.5, 0.02], [2, -2.5, 0.5], [-1, 3, 0.05]];
        extraGraves.forEach(([ex, ez, tilt]) => {
            const eh = rand(0.5, 0.85);
            const eg = new THREE.Mesh(jaggedBox(0.35, eh, 0.13, { chipChance: 0.1 }), Math.random() < 0.3 ? M.moss : M.stone);
            eg.position.set(gx + ex, tilt > 0.3 ? eh * 0.3 : eh / 2, gz + ez);
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

    // 11. Connective tissue — worn paths linking each beat in narrative order
    Game.registerStructure((scene, M) => {
        const order = ["ARCHWAY", "PATH", "HOUSE", "WELL", "GARDEN", "STATUE", "TOWER", "BELL", "ROAD", "GRAVE"];
        for (let i = 0; i < order.length - 1; i++) {
            windingPath(scene, LOCATIONS[order[i]], LOCATIONS[order[i + 1]], M, { spacing: 1.3, wander: 1.8 });
        }
        windingPath(scene, LOCATIONS.HOUSE, LOCATIONS.WELL, M, { spacing: 1.2, wander: 1.2 });
        windingPath(scene, LOCATIONS.GARDEN, LOCATIONS.STATUE, M, { spacing: 1.4, wander: 1.5 });
    });
}

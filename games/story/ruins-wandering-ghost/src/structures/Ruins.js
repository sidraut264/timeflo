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

export function jaggedBox(w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d, 2, 4, 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y > h * 0.15) {
            pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.4);
            pos.setY(i, y + (Math.random() - 0.3) * h * 0.35);
            pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.4);
        }
    }
    geo.computeVertexNormals();
    return geo;
}

export function brokenColumn(scene, x, z, height, rot, matSet) {
    const g = new THREE.Group();
    const drumCount = Math.max(2, Math.round(height));
    let y = 0;
    for (let i = 0; i < drumCount; i++) {
        const r = 0.55 - i * 0.01;
        const hDrum = 0.9 + Math.random() * 0.15;
        const geo = new THREE.CylinderGeometry(r, r * 1.02, hDrum, 8);
        const mesh = new THREE.Mesh(geo, i % 3 === 0 ? matSet.moss : matSet.stone);
        mesh.position.set((Math.random() - 0.5) * 0.08, y + hDrum / 2, (Math.random() - 0.5) * 0.08);
        mesh.rotation.y = Math.random() * Math.PI;
        g.add(mesh);
        y += hDrum * 0.96;
        if (Math.random() < 0.15 && i < drumCount - 1) break;
    }
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
    return g;
}

export function ruinedWall(scene, x, z, w, h, rot, material) {
    const mesh = new THREE.Mesh(jaggedBox(w, h, 0.6), material);
    mesh.position.set(x, h / 2 - 0.3, z);
    mesh.rotation.y = rot;
    scene.add(mesh);
    return mesh;
}

export function archway(scene, pos, rot, matSet) {
    const g = new THREE.Group();
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.55, 3.4, 8);
    const pillarL = new THREE.Mesh(pillarGeo, matSet.stone);
    pillarL.position.set(-1.6, 1.7, 0);
    const pillarR = new THREE.Mesh(pillarGeo, matSet.stone);
    pillarR.position.set(1.6, 1.7, 0);
    g.add(pillarL, pillarR);
    const lintel = new THREE.Mesh(jaggedBox(3.6, 0.7, 0.9), matSet.stoneDark);
    lintel.position.set(0, 3.5, 0);
    g.add(lintel);
    g.position.copy(pos);
    g.rotation.y = rot;
    scene.add(g);
    return g;
}

export function createTree(scene, pos, matSet) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 4, 5), matSet.wood);
    trunk.position.y = 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.2;
    trunk.rotation.x = (Math.random() - 0.5) * 0.2;
    g.add(trunk);
    
    // Dead branches
    for (let i = 0; i < 3; i++) {
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.15, 2, 4), matSet.wood);
        branch.position.y = 2 + Math.random() * 1.5;
        branch.rotation.z = Math.PI / 3 * (Math.random() > 0.5 ? 1 : -1);
        branch.rotation.x = (Math.random() - 0.5);
        g.add(branch);
    }
    
    g.position.copy(pos);
    scene.add(g);
    return g;
}

export function registerRuinsStructures(Game) {
    Game.registerStructure((scene, M) => {
        // Random scatter walls and debris
        const wallSegs = [
            [-8, -10, 7, 4.2, 0.3], [-1, -13, 6, 3.0, 0.15], [10, -8, 8, 5.0, -0.4],
            [12, 2, 5, 2.6, 1.4], [8, 11, 7, 3.6, 2.1], [-6, 12, 6, 4.6, -2.2], [-13, 4, 6, 3.2, -1.1],
        ];
        wallSegs.forEach(([x, z, w, h, rot], i) => ruinedWall(scene, x, z, w, h, rot, i % 2 ? M.stone : M.stoneDark));
        
        [[-3, -3, 4.5], [4, -4, 3.6], [6, 4, 2.8], [-5, 5, 4.0], [0, 7, 3.2], [-9, -2, 2.4]]
            .forEach(([x, z, h]) => brokenColumn(scene, x, z, h, Math.random() * Math.PI, M));
            
        // Breadcrumbs (Memory Lilies)
        const lilyGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
        const lilyMat = new THREE.MeshBasicMaterial({ color: 0x8ea0e0, transparent: true, opacity: 0.8 });
        const addLily = (pos) => {
            const lily = new THREE.Mesh(lilyGeo, lilyMat);
            lily.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 2, 0.15, (Math.random() - 0.5) * 2));
            lily.rotation.set(Math.random() * 0.2, 0, Math.random() * 0.2);
            scene.add(lily);
        };
        
        Object.values(LOCATIONS).forEach(pos => {
            addLily(pos);
            addLily(pos.clone().lerp(new THREE.Vector3(0,0,0), 0.5)); // Lily halfway to origin (rough spread)
        });
    });

    // 1. Archway
    Game.registerStructure((scene, M) => archway(scene, LOCATIONS.ARCHWAY, 0.5, M));

    // 2. The Forgotten Path
    Game.registerStructure((scene, M) => {
        createTree(scene, LOCATIONS.PATH.clone().add(new THREE.Vector3(-2, 0, 1)), M);
        createTree(scene, LOCATIONS.PATH.clone().add(new THREE.Vector3(2, 0, -1)), M);
        createTree(scene, LOCATIONS.PATH.clone().add(new THREE.Vector3(-1, 0, -2)), M);
        
        // The rusted pendant (Memory Object)
        const pGeo = new THREE.TetrahedronGeometry(0.2);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0 });
        const pendant = new THREE.Mesh(pGeo, pMat);
        pendant.position.copy(LOCATIONS.PATH).add(new THREE.Vector3(0, 0.2, 0));
        scene.add(pendant);
        Game.registerMemory(pendant);
    });

    // 3. The Empty House
    Game.registerStructure((scene, M) => {
        const g = new THREE.Group();
        const wallGeo = jaggedBox(6, 3, 0.5);
        const w1 = new THREE.Mesh(wallGeo, M.stoneDark); w1.position.set(0, 1.5, -3);
        const w2 = new THREE.Mesh(wallGeo, M.stoneDark); w2.position.set(0, 1.5, 3);
        const w3 = new THREE.Mesh(jaggedBox(0.5, 3, 6), M.stoneDark); w3.position.set(-3, 1.5, 0);
        g.add(w1, w2, w3); // Open doorway on the right
        
        const fireplace = new THREE.Mesh(jaggedBox(2, 2, 1), M.stone);
        fireplace.position.set(0, 1, -2.5);
        g.add(fireplace);
        
        g.position.copy(LOCATIONS.HOUSE);
        scene.add(g);
    });

    // 4. The Well
    Game.registerStructure((scene, M) => {
        const g = new THREE.Group();
        const ringCount = 10;
        for (let i = 0; i < ringCount; i++) {
            const a = (i / ringCount) * Math.PI * 2;
            const block = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.5), M.stoneDark);
            block.position.set(Math.cos(a) * 1.3, 0.4, Math.sin(a) * 1.3);
            block.rotation.y = -a;
            g.add(block);
        }
        const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6);
        const postL = new THREE.Mesh(postGeo, M.wood); postL.position.set(-1, 1.9, 0);
        const postR = new THREE.Mesh(postGeo, M.wood); postR.position.set(1, 1.9, 0);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.15, 0.15), M.wood);
        beam.position.set(0, 2.9, 0);
        g.add(postL, postR, beam);
        g.position.copy(LOCATIONS.WELL);
        scene.add(g);
    });

    // 5. The Stone Garden
    Game.registerStructure((scene, M) => {
        const g = new THREE.Group();
        const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.4, 12), M.stoneDark);
        fountainBase.position.y = 0.2;
        const fountainCore = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 1.5, 8), M.stone);
        fountainCore.position.y = 0.75;
        g.add(fountainBase, fountainCore);
        
        // Benches
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const bench = new THREE.Mesh(jaggedBox(2, 0.4, 0.6), M.stone);
            bench.position.set(Math.cos(a) * 4, 0.3, Math.sin(a) * 4);
            bench.rotation.y = -a;
            g.add(bench);
        }
        
        // Memory Flower
        const fGeo = new THREE.ConeGeometry(0.2, 0.5, 6);
        const fMat = new THREE.MeshBasicMaterial({ color: 0xffaa88, transparent: true, opacity: 0 });
        const memFlower = new THREE.Mesh(fGeo, fMat);
        memFlower.position.set(1.5, 0.25, 0);
        g.add(memFlower);
        Game.registerMemory(memFlower);

        g.position.copy(LOCATIONS.GARDEN);
        scene.add(g);
    });

    // 6. The Statue
    Game.registerStructure((scene, M) => {
        const g = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), M.stoneDark);
        base.position.y = 0.25;
        const torso = new THREE.Mesh(jaggedBox(1.0, 1.8, 0.8), M.stone);
        torso.position.y = 1.4;
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 1.1, 6), M.stone);
        arm.position.set(0.7, 1.9, 0);
        arm.rotation.z = -0.7;
        g.add(base, torso, arm);
        g.position.copy(LOCATIONS.STATUE);
        g.rotation.y = -0.6;
        scene.add(g);

        // Memory Object (Echo)
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
        const g = new THREE.Group();
        // Base foundation ring
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 1, 12), M.stoneDark);
        ring.position.y = 0.5;
        g.add(ring);
        // Giant rubble pile
        for (let i = 0; i < 40; i++) {
            const b = new THREE.Mesh(jaggedBox(2, 2, 2), M.stone);
            const r = Math.random() * 5;
            const a = Math.random() * Math.PI * 2;
            b.position.set(Math.cos(a) * r, 1 + Math.random() * 3 - r * 0.4, Math.sin(a) * r);
            b.rotation.set(Math.random(), Math.random(), Math.random());
            g.add(b);
        }
        g.position.copy(LOCATIONS.TOWER);
        scene.add(g);
    });

    // 8. The Silent Bell
    Game.registerStructure((scene, M) => {
        const g = new THREE.Group();
        // Frame
        const pGeo = new THREE.BoxGeometry(0.4, 5, 0.4);
        const p1 = new THREE.Mesh(pGeo, M.wood); p1.position.set(-2, 2.5, 0);
        const p2 = new THREE.Mesh(pGeo, M.wood); p2.position.set(2, 2.5, 0);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 0.4), M.wood);
        beam.position.set(0, 4.8, 0);
        g.add(p1, p2, beam);
        
        // Bell
        const bellGeo = new THREE.CylinderGeometry(0.4, 1.2, 1.5, 12);
        const bell = new THREE.Mesh(bellGeo, M.stoneDark);
        bell.position.set(0, 3.8, 0);
        g.add(bell);

        // Memory Bell (Glows in memory)
        const memBell = new THREE.Mesh(bellGeo, new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0, wireframe: true }));
        memBell.position.set(0, 3.8, 0);
        g.add(memBell);
        Game.registerMemory(memBell);

        g.position.copy(LOCATIONS.BELL);
        scene.add(g);
    });

    // 9. The Old Road
    Game.registerStructure((scene, M) => {
        const g = new THREE.Group();
        for(let i=0; i<10; i++) {
            const stone = new THREE.Mesh(jaggedBox(1, 0.2, 1), M.stone);
            stone.position.set(0, 0.1, i * 1.5 - 7);
            stone.rotation.y = (Math.random() - 0.5) * 0.4;
            g.add(stone);
        }
        // Marker
        const marker = new THREE.Mesh(jaggedBox(0.6, 1.5, 0.4), M.stoneDark);
        marker.position.set(1.5, 0.75, 0);
        marker.rotation.y = -0.2;
        g.add(marker);

        g.position.copy(LOCATIONS.ROAD);
        g.rotation.y = Math.PI / 4;
        scene.add(g);
    });

    // 10. The Grave
    Game.registerStructure((scene, M) => {
        const g = new THREE.Group();
        const grave = new THREE.Mesh(jaggedBox(0.7, 1.1, 0.25), M.stoneDark);
        grave.position.y = 0.3;
        g.add(grave);
        
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            const stone = new THREE.Mesh(jaggedBox(0.4, 0.6 + Math.random() * 0.3, 0.15), M.stone);
            stone.position.set(Math.cos(a) * 2.5, 0.25, Math.sin(a) * 2.5);
            stone.rotation.y = Math.random();
            g.add(stone);
        }
        g.position.copy(LOCATIONS.GRAVE);
        scene.add(g);
    });
}

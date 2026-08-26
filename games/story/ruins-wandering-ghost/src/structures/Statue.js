import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import { rand, jaggedBox, rubblePile, floorSlabs, ivyVine, lowWall, getTerrainHeight } from "./RuinsUtils.js";

export function buildStatue(Game) {
    Game.registerStructure((scene, M) => {
        const sx = LOCATIONS.STATUE.x, sz = LOCATIONS.STATUE.z;
        const g = new THREE.Group();
        const groundY = getTerrainHeight(sx, sz);

        const gold = M.gold || M.stoneWeathered || M.stone;
        const bronze = M.bronze || M.stoneDark;

        // -------------------------------------------------------------------
        // 1. ALTAR BASE - stepped platform for a deity
        // -------------------------------------------------------------------
        const baseBottom = new THREE.Mesh(
            jaggedBox(2.4, 0.4, 2.4, { chipChance: 0.2 }),
            M.stoneDark
        );
        baseBottom.position.y = 0.2;
        g.add(baseBottom);

        const baseMiddle = new THREE.Mesh(
            jaggedBox(2.0, 0.3, 2.0, { chipChance: 0.15 }),
            M.stoneWeathered || M.stoneDark
        );
        baseMiddle.position.y = 0.55;
        g.add(baseMiddle);

        const baseTop = new THREE.Mesh(
            jaggedBox(1.6, 0.25, 1.6, { chipChance: 0.1 }),
            M.stone
        );
        baseTop.position.y = 0.825;
        g.add(baseTop);

        // Decorative carved bands on base (simple lines)
        const band1 = new THREE.Mesh(
            new THREE.BoxGeometry(1.7, 0.08, 1.7),
            M.stoneDark
        );
        band1.position.y = 0.65;
        g.add(band1);

        const band2 = new THREE.Mesh(
            new THREE.BoxGeometry(1.7, 0.08, 1.7),
            M.stoneDark
        );
        band2.position.y = 0.75;
        g.add(band2);

        // Carved relief plaques on the middle tier (four faces)
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const relief = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.18, 0.04),
                M.stoneDark
            );
            relief.position.set(Math.sin(a) * 1.0, 0.55, Math.cos(a) * 1.0);
            relief.rotation.y = a;
            g.add(relief);
        }

        // Corner finials on the lowest tier
        for (let cx = -1; cx <= 1; cx += 2) {
            for (let cz = -1; cz <= 1; cz += 2) {
                const finial = new THREE.Mesh(
                    new THREE.ConeGeometry(0.12, 0.3, 4),
                    M.stoneDark
                );
                finial.position.set(cx * 1.05, 0.55, cz * 1.05);
                finial.rotation.y = rand(0, Math.PI);
                g.add(finial);
            }
        }

        // -------------------------------------------------------------------
        // 2. LOWER BODY - rigid, robed appearance
        // -------------------------------------------------------------------
        // Skirt/kilt - wider block around hips
        const kilt = new THREE.Mesh(
            jaggedBox(0.8, 0.7, 0.7, { chipChance: 0.25 }),
            M.stone
        );
        kilt.position.y = 1.35;
        kilt.rotation.y = 0.05;
        g.add(kilt);

        // Pleats on the kilt - thin vertical ridges
        for (let i = -2; i <= 2; i++) {
            const pleat = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, 0.65, 0.05),
                M.stoneDark
            );
            pleat.position.set(i * 0.14, 1.35, 0.36);
            g.add(pleat);
        }

        // Ceremonial belt with central buckle emblem
        const belt = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.12, 0.75),
            bronze
        );
        belt.position.y = 1.02;
        g.add(belt);

        const buckle = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.13),
            gold
        );
        buckle.position.set(0, 1.02, 0.4);
        g.add(buckle);

        // Legs (only front visible due to kilt)
        const leftLeg = new THREE.Mesh(
            jaggedBox(0.3, 0.6, 0.35, { chipChance: 0.2 }),
            M.stone
        );
        leftLeg.position.set(-0.2, 1.0, 0.0);
        leftLeg.rotation.z = 0.03;
        g.add(leftLeg);

        const rightLeg = new THREE.Mesh(
            jaggedBox(0.3, 0.6, 0.35, { chipChance: 0.3 }),
            M.stoneDark
        );
        rightLeg.position.set(0.2, 1.0, 0.0);
        rightLeg.rotation.z = -0.05;
        g.add(rightLeg);

        // Ankle bands
        for (const lx of [-0.2, 0.2]) {
            const anklet = new THREE.Mesh(
                new THREE.TorusGeometry(0.17, 0.03, 4, 8),
                gold
            );
            anklet.rotation.x = Math.PI / 2;
            anklet.position.set(lx, 0.72, 0.02);
            g.add(anklet);
        }

        // Sandaled feet
        for (const lx of [-0.2, 0.2]) {
            const foot = new THREE.Mesh(
                jaggedBox(0.28, 0.14, 0.42, { chipChance: 0.15 }),
                M.stoneDark
            );
            foot.position.set(lx, 0.68, 0.08);
            g.add(foot);
        }

        // -------------------------------------------------------------------
        // 3. TORSO - formal, symmetrical but damaged
        // -------------------------------------------------------------------
        const torso = new THREE.Mesh(
            jaggedBox(0.85, 1.1, 0.6, { chipChance: 0.2 }),
            M.stone
        );
        torso.position.y = 2.1;
        torso.rotation.y = 0.02;
        g.add(torso);

        // Diagonal ceremonial sash
        const sash = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 1.2, 0.08),
            bronze
        );
        sash.position.set(0.05, 2.1, 0.32);
        sash.rotation.z = 0.55;
        g.add(sash);

        // Layered broad collar / necklace
        const collarSizes = [0.4, 0.34, 0.28];
        collarSizes.forEach((r, i) => {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(r, 0.035, 4, 10),
                i === 1 ? gold : M.stoneDark
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 2.4 - i * 0.06;
            ring.scale.set(1.0, 1.0, 0.5);
            g.add(ring);
        });

        // Pectoral emblem hanging at chest center
        const pectoral = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.12),
            gold
        );
        pectoral.position.set(0, 2.15, 0.33);
        pectoral.rotation.y = Math.PI / 4;
        g.add(pectoral);

        // Upper-arm bracelets (on the visible staff-bearing arm)
        const armlet = new THREE.Mesh(
            new THREE.TorusGeometry(0.15, 0.025, 4, 8),
            gold
        );
        armlet.rotation.z = Math.PI / 2;
        armlet.position.set(-0.55, 2.25, 0);
        g.add(armlet);

        // -------------------------------------------------------------------
        // 4. HEAD - monumental, blocky, weathered divine face
        // -------------------------------------------------------------------
        const head = new THREE.Mesh(
            jaggedBox(0.45, 0.45, 0.45, { chipChance: 0.25 }),
            M.stone
        );
        head.position.y = 2.85;
        g.add(head);

        // Brow ridge
        const brow = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.06, 0.05),
            M.stoneDark
        );
        brow.position.set(0, 2.93, 0.225);
        g.add(brow);

        // Deep-set eyes
        for (const ex of [-0.11, 0.11]) {
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.045, 6, 6),
                M.stoneDark
            );
            eye.position.set(ex, 2.87, 0.22);
            g.add(eye);
        }

        // Nose - simple protruding wedge
        const nose = new THREE.Mesh(
            new THREE.BoxGeometry(0.09, 0.16, 0.1),
            M.stone
        );
        nose.position.set(0, 2.8, 0.24);
        g.add(nose);

        // Mouth line
        const mouth = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.04, 0.03),
            M.stoneDark
        );
        mouth.position.set(0, 2.7, 0.23);
        g.add(mouth);

        // Ears
        for (const ex of [-0.235, 0.235]) {
            const ear = new THREE.Mesh(
                jaggedBox(0.05, 0.14, 0.1, { chipChance: 0.2 }),
                M.stone
            );
            ear.position.set(ex, 2.83, 0);
            g.add(ear);
        }

        // Neck
        const neck = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.18, 0.2, 6),
            M.stone
        );
        neck.position.y = 2.55;
        g.add(neck);

        // -------------------------------------------------------------------
        // 5. CROWN - horned sun-disk headdress
        // -------------------------------------------------------------------
        const crownBand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.32, 0.1, 8),
            gold
        );
        crownBand.position.y = 2.98;
        g.add(crownBand);

        const crown = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.35, 0.5, 8),
            M.stoneWeathered || M.stone
        );
        crown.position.y = 3.15;
        crown.rotation.z = -0.03;
        g.add(crown);

        // Twin curved horns flanking the crown
        for (const hx of [-1, 1]) {
            const horn = new THREE.Mesh(
                new THREE.TorusGeometry(0.22, 0.045, 4, 8, Math.PI * 0.6),
                gold
            );
            horn.position.set(hx * 0.32, 3.25, 0);
            horn.rotation.y = Math.PI / 2;
            horn.rotation.z = hx > 0 ? -0.3 : Math.PI + 0.3;
            g.add(horn);
        }

        // Sun disk atop the crown
        const sunDisk = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 10, 10),
            gold
        );
        sunDisk.position.y = 3.55;
        g.add(sunDisk);

        // Halo / radiant nimbus behind head
        const halo = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 0.05, 12),
            M.stoneDark
        );
        halo.rotation.x = Math.PI / 2;
        halo.rotation.z = 0.1;
        halo.position.y = 2.85;
        halo.position.z = -0.3;
        g.add(halo);

        // Radiating spikes around the halo rim
        for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            const spike = new THREE.Mesh(
                new THREE.ConeGeometry(0.05, 0.18, 4),
                M.stoneDark
            );
            spike.position.set(Math.cos(a) * 0.85, 2.85 + Math.sin(a) * 0.85, -0.3);
            spike.rotation.z = a + Math.PI / 2;
            spike.rotation.x = Math.PI / 2;
            g.add(spike);
        }

        // -------------------------------------------------------------------
        // 6. ARMS - four-armed divine figure, one broken with age
        // -------------------------------------------------------------------
        // Front-left arm holding a staff (staff goes upward)
        const leftUpperArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.14, 0.5, 6),
            M.stone
        );
        leftUpperArm.position.set(-0.55, 2.4, 0);
        leftUpperArm.rotation.z = Math.PI / 2 + 0.1;
        g.add(leftUpperArm);

        const leftForearm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.12, 0.4, 6),
            M.stone
        );
        leftForearm.position.set(-0.75, 2.55, 0);
        leftForearm.rotation.z = Math.PI / 2 - 0.3;
        g.add(leftForearm);

        const leftHand = new THREE.Mesh(
            jaggedBox(0.14, 0.16, 0.14, { chipChance: 0.1 }),
            M.stone
        );
        leftHand.position.set(-0.85, 2.72, 0);
        g.add(leftHand);

        // Staff held in left hand (extends upward)
        const staff = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 1.8, 6),
            M.woodDry || M.stoneDark
        );
        staff.position.set(-0.85, 3.5, 0);
        staff.rotation.z = 0.1;
        g.add(staff);

        // Staff top ornament (small sphere or diamond)
        const staffTop = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.15),
            gold
        );
        staffTop.position.set(-0.85, 4.4, 0);
        g.add(staffTop);

        // Front-right arm missing - broken shoulder, a mark of its age
        const rightShoulder = new THREE.Mesh(
            jaggedBox(0.25, 0.3, 0.3, { chipChance: 0.5 }),
            M.stoneDark
        );
        rightShoulder.position.set(0.55, 2.4, 0);
        rightShoulder.rotation.z = -0.3;
        g.add(rightShoulder);

        // Back-left arm, raised, holding an orb aloft
        const backLeftUpperArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.12, 0.45, 6),
            M.stoneDark
        );
        backLeftUpperArm.position.set(-0.4, 2.65, -0.2);
        backLeftUpperArm.rotation.z = 0.5;
        g.add(backLeftUpperArm);

        const backLeftForearm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 0.4, 6),
            M.stoneDark
        );
        backLeftForearm.position.set(-0.35, 3.05, -0.22);
        backLeftForearm.rotation.z = 0.15;
        g.add(backLeftForearm);

        const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 10, 10),
            gold
        );
        orb.position.set(-0.3, 3.35, -0.22);
        g.add(orb);

        // Back-right arm, holding a ceremonial blade across the chest
        const backRightUpperArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.12, 0.45, 6),
            M.stoneDark
        );
        backRightUpperArm.position.set(0.42, 2.55, -0.2);
        backRightUpperArm.rotation.z = -1.0;
        g.add(backRightUpperArm);

        const backRightForearm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 0.45, 6),
            M.stoneDark
        );
        backRightForearm.position.set(0.05, 2.4, 0.15);
        backRightForearm.rotation.z = -0.4;
        backRightForearm.rotation.y = 0.5;
        g.add(backRightForearm);

        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.55, 0.02),
            bronze
        );
        blade.position.set(-0.15, 2.35, 0.3);
        blade.rotation.z = 1.0;
        g.add(blade);

        // -------------------------------------------------------------------
        // 7. WEATHERING AND DETAILS
        // -------------------------------------------------------------------
        // Crack across torso
        const crack = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.9, 0.02),
            M.stoneDark
        );
        crack.position.set(-0.1, 2.1, 0.3);
        crack.rotation.z = 0.3;
        g.add(crack);

        // Secondary crack down the kilt
        const crack2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.025, 0.55, 0.02),
            M.stoneDark
        );
        crack2.position.set(0.18, 1.3, 0.32);
        crack2.rotation.z = -0.15;
        g.add(crack2);

        // Moss at base and lower kilt
        const mossBase = new THREE.Mesh(
            new THREE.TorusGeometry(1.0, 0.08, 4, 8),
            M.moss
        );
        mossBase.rotation.x = Math.PI / 2;
        mossBase.position.y = 0.85;
        mossBase.scale.set(1.1, 1, 1.1);
        g.add(mossBase);

        // Extra moss patches on shoulder and crown edge
        const mossShoulder = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 6, 6),
            M.moss
        );
        mossShoulder.position.set(0.5, 2.55, -0.05);
        mossShoulder.scale.set(1, 0.6, 1);
        g.add(mossShoulder);

        const mossCrown = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 6, 6),
            M.moss
        );
        mossCrown.position.set(-0.2, 3.35, -0.1);
        mossCrown.scale.set(1, 0.5, 1);
        g.add(mossCrown);

        // -------------------------------------------------------------------
        // 8. POSITION AND SCENE INTEGRATION
        // -------------------------------------------------------------------
        g.position.set(sx, groundY, sz);
        g.rotation.y = -0.6;
        scene.add(g);

        // Rubble near broken arm and staff
        rubblePile(scene, sx + 1.2, sz - 0.5, 1.2, 5, M);
        rubblePile(scene, sx - 0.8, sz + 0.6, 0.8, 3, M);
        rubblePile(scene, sx - 1.0, sz + 1.0, 0.6, 2, M);
        rubblePile(scene, sx + 0.6, sz - 1.1, 0.6, 3, M);

        // Floor slabs and surrounding walls
        floorSlabs(scene, sx, sz, 5, 5, 0, M);
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + rand(-0.1, 0.1);
            lowWall(scene, sx + Math.cos(a) * 3, sz + Math.sin(a) * 3, 2.2, -a + Math.PI / 2, M);
        }

        // Ivy vine climbing up the intact left side and around staff
        ivyVine(scene,
            new THREE.Vector3(sx - 0.6, groundY + 0.5, sz - 0.4),
            2.5,
            M
        );
        ivyVine(scene,
            new THREE.Vector3(sx - 0.85, groundY + 3.5, sz + 0.1),
            1.0,
            M
        );

        // -------------------------------------------------------------------
        // 9. MEMORY EFFECT (unchanged)
        // -------------------------------------------------------------------
        const memGeo = new THREE.CylinderGeometry(0.0, 1.2, 3, 8);
        const memMat = new THREE.MeshBasicMaterial({
            color: 0xffaa55,
            transparent: true,
            opacity: 0,
            wireframe: true
        });
        const memMesh = new THREE.Mesh(memGeo, memMat);
        memMesh.position.set(sx - 2.5, groundY + 1.5, sz - 2);
        memMesh.visible = false;
        scene.add(memMesh);
        Game.registerMemory(memMesh);
    });
}
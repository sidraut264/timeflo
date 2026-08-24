import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import {
    rand, ruinedWall, brokenColumn, emptyPlot, campfireRing,
    storageDebris, createTree, windingPath, getTerrainHeight
} from "./RuinsUtils.js";

export function buildScatterAndPaths(Game) {
    // 0. Ambient Debris & Scatter Walls
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
            const lx = pos.x + (Math.random() - 0.5) * 2.4;
            const lz = pos.z + (Math.random() - 0.5) * 2.4;
            const ly = getTerrainHeight(lx, lz) + 0.15;
            lily.position.set(lx, ly, lz);
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

    // Connective tissue — worn paths linking each beat in narrative order
    Game.registerStructure((scene, M) => {
        const order = ["ARCHWAY", "PATH", "HOUSE", "WELL", "GARDEN", "STATUE", "TOWER", "BELL", "ROAD", "GRAVE"];
        for (let i = 0; i < order.length - 1; i++) {
            windingPath(scene, LOCATIONS[order[i]], LOCATIONS[order[i + 1]], M, { spacing: 1.3, wander: 1.8 });
        }
        windingPath(scene, LOCATIONS.HOUSE, LOCATIONS.WELL, M, { spacing: 1.2, wander: 1.2 });
        windingPath(scene, LOCATIONS.GARDEN, LOCATIONS.STATUE, M, { spacing: 1.4, wander: 1.5 });
    });
}

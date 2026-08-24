import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import { rand, jaggedBox, rubblePile, lowWall, createTree, getTerrainHeight } from "./RuinsUtils.js";

export function buildGrave(Game) {
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
        g.position.set(gx, getTerrainHeight(gx, gz), gz);
        scene.add(g);
        rubblePile(scene, gx - 1, gz + 0.5, 0.8, 3, M);

        const extraGraves = [[3, 2, 0.1], [-2.5, -1.5, 0.02], [2, -2.5, 0.5], [-1, 3, 0.05]];
        extraGraves.forEach(([ex, ez, tilt]) => {
            const eh = rand(0.5, 0.85);
            const eg = new THREE.Mesh(jaggedBox(0.35, eh, 0.13, { chipChance: 0.1 }), Math.random() < 0.3 ? M.moss : M.stone);
            const egx = gx + ex, egz = gz + ez;
            eg.position.set(egx, getTerrainHeight(egx, egz) + (tilt > 0.3 ? eh * 0.3 : eh / 2), egz);
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
}

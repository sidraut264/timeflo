import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import { rand, jaggedBox, rubblePile, floorSlabs, getTerrainHeight } from "./RuinsUtils.js";

export function buildStoneGarden(Game) {
    Game.registerStructure((scene, M) => {
        const gx = LOCATIONS.GARDEN.x, gz = LOCATIONS.GARDEN.z;
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

        g.position.set(gx, getTerrainHeight(gx, gz), gz);
        scene.add(g);
        floorSlabs(scene, gx, gz, 9, 9, 0, M);
        rubblePile(scene, gx, gz, 2.3, 6, M);
    });
}

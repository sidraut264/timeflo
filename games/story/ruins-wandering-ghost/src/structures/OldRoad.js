import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import { rand, jaggedBox, lowWall, cartWreck, getTerrainHeight } from "./RuinsUtils.js";

export function buildOldRoad(Game) {
    Game.registerStructure((scene, M) => {
        const rx = LOCATIONS.ROAD.x, rz = LOCATIONS.ROAD.z;
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

        g.position.set(rx, getTerrainHeight(rx, rz), rz);
        g.rotation.y = Math.PI / 4;
        scene.add(g);
        lowWall(scene, rx - 2.2, rz - 4, 5, Math.PI / 4, M);
        lowWall(scene, rx + 2.2, rz + 4, 5, Math.PI / 4, M);
        cartWreck(scene, rx - 3, rz + 2, rand(0, Math.PI * 2), M);
    });
}

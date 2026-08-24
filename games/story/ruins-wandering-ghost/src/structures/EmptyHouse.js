import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import { rand, jaggedBox, rubblePile, courseWall, foundationFootprint, floorSlabs, ivyVine, getTerrainHeight } from "./RuinsUtils.js";

export function buildEmptyHouse(Game) {
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
        fireplace.position.set(hx, getTerrainHeight(hx, hz - 2.5) + 1, hz - 2.5);
        scene.add(fireplace);

        for (let i = 0; i < 3; i++) {
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, rand(3.5, 5), 6), M.wood);
            const bx = hx + rand(-2, 1.5), bz = hz + rand(-1.5, 2);
            beam.position.set(bx, getTerrainHeight(bx, bz) + rand(0.1, 0.5), bz);
            beam.rotation.z = rand(-0.2, 0.2);
            beam.rotation.y = rand(0, Math.PI);
            beam.rotation.x = Math.PI / 2 + rand(-0.15, 0.15);
            scene.add(beam);
        }

        ivyVine(scene, new THREE.Vector3(hx - 2.8, getTerrainHeight(hx - 2.8, hz - 2.9) + 0.3, hz - 2.9), 2.6, M);
        ivyVine(scene, new THREE.Vector3(hx + 1, getTerrainHeight(hx + 1, hz - 3) + 0.3, hz - 3), 2.2, M);

        rubblePile(scene, hx, hz + 3, 2.5, 8, M);
        rubblePile(scene, hx + 3, hz, 1.6, 5, M);
    });
}

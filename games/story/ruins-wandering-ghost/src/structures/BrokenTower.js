import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import { rand, jaggedBox, courseWall, foundationFootprint, ivyVine, getTerrainHeight } from "./RuinsUtils.js";

export function buildBrokenTower(Game) {
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
            const bx = tx + Math.cos(a) * r, bz = tz + Math.sin(a) * r;
            b.position.set(bx, getTerrainHeight(bx, bz) + size * 0.3, bz);
            b.rotation.set(Math.random() * 0.3, Math.random(), Math.random() * 0.3);
            scene.add(b);
        }

        const ix = tx + Math.cos(0) * radius, iz = tz + Math.sin(0) * radius;
        ivyVine(scene, new THREE.Vector3(ix, getTerrainHeight(ix, iz) + 0.2, iz), 3.2, M);
    });
}

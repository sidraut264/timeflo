import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import { jaggedBox, rubblePile, floorSlabs, campfireRing, storageDebris, getTerrainHeight } from "./RuinsUtils.js";

export function buildSilentBell(Game) {
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

        g.position.set(bx, getTerrainHeight(bx, bz), bz);
        scene.add(g);
        floorSlabs(scene, bx, bz, 5, 5, 0, M);
        rubblePile(scene, bx, bz, 1.5, 4, M);
        campfireRing(scene, bx + 2.5, bz - 2, M);
        storageDebris(scene, bx - 2.5, bz + 1.5, M);
    });
}

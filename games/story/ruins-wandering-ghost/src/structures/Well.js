import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import { rand, rubblePile, floorSlabs, ivyVine, lowWall, storageDebris, getTerrainHeight } from "./RuinsUtils.js";

export function buildWell(Game) {
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

        g.position.set(wx, getTerrainHeight(wx, wz), wz);
        scene.add(g);

        floorSlabs(scene, wx, wz, 6, 6, 0.3, M);
        lowWall(scene, wx - 3.4, wz, 4, Math.PI / 2, M);
        lowWall(scene, wx, wz - 3.4, 5.5, 0, M);
        ivyVine(scene, new THREE.Vector3(wx - 3.3, getTerrainHeight(wx - 3.3, wz - 1) + 0.1, wz - 1), 1.4, M);
        storageDebris(scene, wx + 2, wz + 1.5, M);
        rubblePile(scene, wx + 1.5, wz, 1, 4, M);
    });
}

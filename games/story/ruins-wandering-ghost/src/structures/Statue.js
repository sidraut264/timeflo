import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import { rand, jaggedBox, rubblePile, floorSlabs, ivyVine, lowWall, getTerrainHeight } from "./RuinsUtils.js";

export function buildStatue(Game) {
    Game.registerStructure((scene, M) => {
        const sx = LOCATIONS.STATUE.x, sz = LOCATIONS.STATUE.z;
        const g = new THREE.Group();
        const base = new THREE.Mesh(jaggedBox(1.6, 0.5, 1.6, { chipChance: 0.15 }), M.stoneDark);
        base.position.y = 0.25;
        const torso = new THREE.Mesh(jaggedBox(1.0, 1.8, 0.8), M.stone);
        torso.position.y = 1.4;
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.6, 6), M.stone);
        arm.position.set(0.55, 2.0, 0);
        arm.rotation.z = -0.9;
        g.add(base, torso, arm);
        g.position.set(sx, getTerrainHeight(sx, sz), sz);
        g.rotation.y = -0.6;
        scene.add(g);
        rubblePile(scene, sx + 1.1, sz - 0.8, 1.4, 5, M);

        floorSlabs(scene, sx, sz, 5, 5, 0, M);
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + rand(-0.1, 0.1);
            lowWall(scene, sx + Math.cos(a) * 3, sz + Math.sin(a) * 3, 2.2, -a + Math.PI / 2, M);
        }
        ivyVine(scene, new THREE.Vector3(sx - 0.6, getTerrainHeight(sx - 0.6, sz - 0.4) + 0.5, sz - 0.4), 1.6, M);

        const memGeo = new THREE.CylinderGeometry(0.0, 1.2, 3, 8);
        const memMat = new THREE.MeshBasicMaterial({ color: 0xffaa55, transparent: true, opacity: 0, wireframe: true });
        const memMesh = new THREE.Mesh(memGeo, memMat);
        memMesh.position.set(sx - 2.5, getTerrainHeight(sx - 2.5, sz - 2) + 1.5, sz - 2);
        memMesh.visible = false;
        scene.add(memMesh);
        Game.registerMemory(memMesh);
    });
}

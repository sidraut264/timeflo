import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import { createTree } from "./RuinsUtils.js";

export function buildForgottenPath(Game) {
    Game.registerStructure((scene, M) => {
        createTree(scene, LOCATIONS.PATH.clone().add(new THREE.Vector3(-2.3, 0, 1.1)), M);
        createTree(scene, LOCATIONS.PATH.clone().add(new THREE.Vector3(1.8, 0, -1.4)), M);
        createTree(scene, LOCATIONS.PATH.clone().add(new THREE.Vector3(-0.6, 0, -2.6)), M);

        const pGeo = new THREE.TetrahedronGeometry(0.2);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0 });
        const pendant = new THREE.Mesh(pGeo, pMat);
        pendant.position.copy(LOCATIONS.PATH).add(new THREE.Vector3(0, 0.2, 0));
        scene.add(pendant);
        Game.registerMemory(pendant);
    });
}

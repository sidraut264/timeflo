import { THREE } from "../core/Renderer.js";
import { LOCATIONS } from "./Locations.js";
import { archway, ivyVine, foundationFootprint } from "./RuinsUtils.js";

export function buildArchway(Game) {
    Game.registerStructure((scene, M) => {
        archway(scene, LOCATIONS.ARCHWAY, 0.5, M);
        ivyVine(scene, LOCATIONS.ARCHWAY.clone().add(new THREE.Vector3(-1.5, 0, 0.3)), 2.8, M);
        foundationFootprint(scene, LOCATIONS.ARCHWAY.x, LOCATIONS.ARCHWAY.z, 4, 2, 0.5, M);
    });
}

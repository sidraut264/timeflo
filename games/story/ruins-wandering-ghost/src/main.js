import Game from "./core/Game.js";
import { THREE, scene, camera, renderer } from "./core/Renderer.js";
import M from "./world/Materials.js";
import { buildEnvironment } from "./world/Environment.js";
import { createGhost } from "./player/Ghost.js";
import { setupInput, getRawInput } from "./systems/Input.js";
import { setupCameraControls, updateCamera, getCamYaw } from "./systems/CameraControls.js";
import { startQuestRunner } from "./ui/QuestUI.js";
import { registerRuinsStructures, LOCATIONS } from "./structures/Ruins.js";
import { registerChapter1Quests } from "./story/Chapter1.js";
import { initInteractionUI, updateInteractions } from "./systems/Interaction.js";
import { initMemorySense } from "./systems/MemorySense.js";

console.log("Ruins & the Wandering Ghost — booting procedural engine...");

// 1. Build Environment & Shared Systems
buildEnvironment(scene);
setupInput();
setupCameraControls(renderer.domElement);

// 2. Instantiate Player (Ghost)
const ghost = createGhost(scene);

// 3. Register World Structures & Story Quests
registerRuinsStructures(Game);
registerChapter1Quests(Game, LOCATIONS);

function bootGame() {
    // 4. Build Registered Structures in Scene
    Game.structures.forEach(fn => fn(scene, M));
    startQuestRunner(Game);

    // Initialize Systems
    initInteractionUI();
    initMemorySense();
    
    // Start Game Loop
    animate();
}

// Main Game Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.getElapsedTime();

    // Calculate movement vector relative to camera rotation
    const { ix, iz } = getRawInput();
    const camYaw = getCamYaw();
    const sinY = Math.sin(camYaw);
    const cosY = Math.cos(camYaw);

    const forward = { x: -sinY, z: -cosY };
    const right = { x: cosY, z: -sinY };
    const finalMove = {
        x: forward.x * (-iz) + right.x * ix,
        z: forward.z * (-iz) + right.z * ix
    };

    // Update Player & Systems
    ghost.update(dt, t, finalMove);
    updateInteractions(ghost.position);
    Game.updaters.forEach(fn => fn(dt, t));
    
    if (scene.userData.updateEnvironment) {
        scene.userData.updateEnvironment(t);
    }

    // Update Camera position to follow player
    updateCamera(camera, ghost.position);

    // Render Scene
    renderer.render(scene, camera);
}
bootGame();

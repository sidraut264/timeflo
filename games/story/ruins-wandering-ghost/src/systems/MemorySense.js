import Game from "../core/Game.js";
import { THREE, scene } from "../core/Renderer.js";

// Save original fog color
const REALITY_FOG_COLOR = new THREE.Color(0x0b0f1a);
const MEMORY_FOG_COLOR = new THREE.Color(0x1a120b); // Warmer, slightly reddish/orange
const REALITY_AMBIENT = new THREE.Color(0x334066);
const MEMORY_AMBIENT = new THREE.Color(0x664033);

let ambientLight = null;
let beacon = null;

export function initMemorySense() {
    window.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'q' && !Game.state.memorySenseActive) {
            activateMemorySense();
        }
    });

    // Find ambient light in scene
    scene.children.forEach(c => {
        if (c instanceof THREE.AmbientLight) ambientLight = c;
    });

    // Create the Memory Beacon (pillar of light)
    const beaconGeo = new THREE.CylinderGeometry(0.8, 0.8, 60, 16);
    // Shift geometry up so the origin is at the base
    beaconGeo.translate(0, 30, 0); 
    const beaconMat = new THREE.MeshBasicMaterial({ 
        color: 0xffd080, 
        transparent: true, 
        opacity: 0, 
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.visible = false;
    scene.add(beacon);

    // Register updater to handle fade
    Game.registerUpdate((dt) => {
        updateMemorySense(dt);
    });
}

function activateMemorySense() {
    Game.state.memorySenseActive = true;
    Game.state.memorySenseTimer = Game.state.memorySenseDuration;
    
    // Position beacon at the current quest target
    const currentQuest = Game.quests[Game.questIndex];
    if (currentQuest && currentQuest.target) {
        beacon.position.copy(currentQuest.target);
    }
}

function updateMemorySense(dt) {
    let targetFog, targetAmbient, targetOpacity;

    if (Game.state.memorySenseActive) {
        Game.state.memorySenseTimer -= dt;
        if (Game.state.memorySenseTimer <= 0) {
            Game.state.memorySenseActive = false; // Fade out
        }
        targetFog = MEMORY_FOG_COLOR;
        targetAmbient = MEMORY_AMBIENT;
        targetOpacity = 1.0;
    } else {
        targetFog = REALITY_FOG_COLOR;
        targetAmbient = REALITY_AMBIENT;
        targetOpacity = 0.0;
    }

    // Smoothly interpolate colors
    if (scene.fog) scene.fog.color.lerp(targetFog, dt * 2.0);
    if (scene.background) scene.background.lerp(targetFog, dt * 2.0);
    if (ambientLight) ambientLight.color.lerp(targetAmbient, dt * 2.0);

    // Fade beacon
    if (beacon) {
        const currentOp = beacon.material.opacity;
        beacon.material.opacity = currentOp + ((targetOpacity * 0.4) - currentOp) * (dt * 2.0);
        beacon.visible = beacon.material.opacity > 0.01;
    }

    // Smoothly interpolate memory objects opacity
    for (const memObj of Game.memories) {
        if (memObj.material) {
            if (!memObj.material.transparent) memObj.material.transparent = true;
            const currentOp = memObj.material.opacity !== undefined ? memObj.material.opacity : 0;
            memObj.material.opacity = currentOp + (targetOpacity - currentOp) * (dt * 2.0);
            memObj.visible = memObj.material.opacity > 0.01;
        }
    }
}

import * as THREE from "three";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});

document.body.appendChild(renderer.domElement);

export {
    THREE,
    scene,
    camera,
    renderer,
    applyQualitySettings
};

let currentShadowsEnabled = true;

function applyQualitySettings(config, scene) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.pixelRatio));
    
    // Toggle global shadows
    if (currentShadowsEnabled !== config.shadowsEnabled) {
        renderer.shadowMap.enabled = config.shadowsEnabled;
        currentShadowsEnabled = config.shadowsEnabled;
        
        // Force recompile of materials if shadow state changes
        scene.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.needsUpdate = true;
            }
        });
    }

    if (config.shadowsEnabled) {
        // We could theoretically change shadowMap size dynamically here,
        // but Three.js requires re-creating the map or calling dispose on lights.
        // We'll leave the map size fixed or let it be scaled naturally, 
        // turning shadows off entirely for low quality is enough.
    }

    // Traverse and adjust specific elements
    scene.traverse(child => {
        // Adjust InstancedMesh Rubble Count
        if (child.isInstancedMesh && child.userData.type === 'rubble') {
            child.count = Math.floor(child.userData.maxCount * config.rubbleScale);
        }

        // Adjust Tree Shadows
        if (child.userData.shadowGroup === 'tree') {
            child.castShadow = config.treeShadows;
        }

        // Adjust Main Structure Shadows
        if (child.userData.shadowGroup === 'structure') {
            child.castShadow = config.structureShadows;
        }
    });
}

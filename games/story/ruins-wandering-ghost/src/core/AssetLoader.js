import * as THREE from "three";
import { GLTFLoader } from "https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const models = {};
const fallbacks = {};

// Register a fallback function that generates a procedural mesh if the .glb fails
export function registerFallback(name, fallbackFn) {
    fallbacks[name] = fallbackFn;
}

export async function loadModel(name, url, materialSet) {
    return new Promise((resolve) => {
        loader.load(url, (gltf) => {
            models[name] = gltf.scene;
            resolve(gltf.scene.clone());
        }, undefined, (error) => {
            console.warn(`[AssetLoader] Could not load ${url}. Using procedural fallback for '${name}'.`);
            if (fallbacks[name]) {
                const fallbackMesh = fallbacks[name](materialSet);
                models[name] = fallbackMesh;
                resolve(fallbackMesh.clone());
            } else {
                resolve(new THREE.Group()); // Empty group if no fallback
            }
        });
    });
}

export function getModel(name) {
    if (!models[name]) return null;
    return models[name].clone();
}

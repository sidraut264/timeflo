import { THREE } from "../core/Renderer.js";

const M = {
    // Stone materials - improved with subtle color variation and better light response
    stone: new THREE.MeshStandardMaterial({
        color: 0x9a948a,
        flatShading: true,
        roughness: 0.92,
        metalness: 0.05,
        envMapIntensity: 0.3
    }),
    stoneDark: new THREE.MeshStandardMaterial({
        color: 0x6b655c,
        flatShading: true,
        roughness: 0.96,
        metalness: 0.02,
        envMapIntensity: 0.2
    }),
    // Add weathered stone for variety
    stoneWeathered: new THREE.MeshStandardMaterial({
        color: 0x7a756c,
        flatShading: true,
        roughness: 0.98,
        metalness: 0.01,
        envMapIntensity: 0.15
    }),

    // Moss - more organic and vibrant
    moss: new THREE.MeshStandardMaterial({
        color: 0x5a6b3c,
        flatShading: true,
        roughness: 0.85,
        metalness: 0.0,
        envMapIntensity: 0.4
    }),
    // Add darker moss for depth
    mossDark: new THREE.MeshStandardMaterial({
        color: 0x3f4e2a,
        flatShading: true,
        roughness: 0.9,
        metalness: 0.0,
        envMapIntensity: 0.3
    }),

    // Wood - warmer and more natural
    wood: new THREE.MeshStandardMaterial({
        color: 0x4a3525,
        flatShading: true,
        roughness: 0.88,
        metalness: 0.03,
        envMapIntensity: 0.25
    }),
    // Add aged/dry wood
    woodDry: new THREE.MeshStandardMaterial({
        color: 0x5c4430,
        flatShading: true,
        roughness: 0.95,
        metalness: 0.01,
        envMapIntensity: 0.2
    }),

    // Cloth - richer color with better fabric feel
    cloth: new THREE.MeshStandardMaterial({
        color: 0x7a3232,
        flatShading: true,
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide,
        envMapIntensity: 0.2
    }),
    // Add weathered cloth
    clothWorn: new THREE.MeshStandardMaterial({
        color: 0x5c3a2e,
        flatShading: true,
        roughness: 0.95,
        metalness: 0.0,
        side: THREE.DoubleSide,
        envMapIntensity: 0.15
    }),

    // Ember materials - improved glow effect
    emberOff: new THREE.MeshStandardMaterial({
        color: 0x2e1f18,
        flatShading: true,
        roughness: 0.9,
        metalness: 0.1,
        envMapIntensity: 0.2
    }),
    emberOn: new THREE.MeshStandardMaterial({
        color: 0xff9a4d,
        emissive: 0xff6600,
        emissiveIntensity: 2.0,
        flatShading: true,
        roughness: 0.7,
        metalness: 0.0,
        envMapIntensity: 0.5
    }),
    // Add glowing ember core
    emberCore: new THREE.MeshStandardMaterial({
        color: 0xffcc88,
        emissive: 0xff8800,
        emissiveIntensity: 3.0,
        flatShading: true,
        roughness: 0.5,
        metalness: 0.0,
        envMapIntensity: 0.8
    }),

    // Additional useful materials
    metal: new THREE.MeshStandardMaterial({
        color: 0x8a8a8a,
        flatShading: true,
        roughness: 0.4,
        metalness: 0.85,
        envMapIntensity: 1.0
    }),
    metalRusty: new THREE.MeshStandardMaterial({
        color: 0x6b5a4a,
        flatShading: true,
        roughness: 0.7,
        metalness: 0.5,
        envMapIntensity: 0.6
    }),
    bone: new THREE.MeshStandardMaterial({
        color: 0xd4c9a8,
        flatShading: true,
        roughness: 0.7,
        metalness: 0.02,
        envMapIntensity: 0.3
    }),

    // Atmospheric ground materials
    dirt: new THREE.MeshStandardMaterial({
        color: 0x5a4a3a,
        flatShading: true,
        roughness: 1.0,
        metalness: 0.0,
        envMapIntensity: 0.1
    }),
    dirtDark: new THREE.MeshStandardMaterial({
        color: 0x3d3228,
        flatShading: true,
        roughness: 1.0,
        metalness: 0.0,
        envMapIntensity: 0.1
    }),
};

export default M;

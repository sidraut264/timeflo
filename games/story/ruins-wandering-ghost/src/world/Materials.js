import { THREE } from "../core/Renderer.js";

const M = {
    stone: new THREE.MeshStandardMaterial({ color: 0x8a8478, flatShading: true, roughness: 0.95 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: 0x5f5b53, flatShading: true, roughness: 1 }),
    moss: new THREE.MeshStandardMaterial({ color: 0x4d5a3c, flatShading: true, roughness: 1 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x3a2a1e, flatShading: true, roughness: 1 }),
    cloth: new THREE.MeshStandardMaterial({ color: 0x6b2c2c, flatShading: true, roughness: 1, side: THREE.DoubleSide }),
    emberOff: new THREE.MeshStandardMaterial({ color: 0x2a1c14, flatShading: true }),
    emberOn: new THREE.MeshStandardMaterial({ color: 0xff8a3d, emissive: 0xff5500, emissiveIntensity: 1.2, flatShading: true }),
};

export default M;

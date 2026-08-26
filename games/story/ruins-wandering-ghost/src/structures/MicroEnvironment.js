import { THREE } from "../core/Renderer.js";
import { getTerrainHeight } from "../world/Environment.js";
import { dominantDistrict, minPathDistance, checkLandmarkClearance } from "./DistrictGenerator.js";
import { LOCATION_DATA, getAllLocations } from "../world/locations/locations.js";

// ---------------------------------------------------------------------------
// DETERMINISTIC RANDOM
// ---------------------------------------------------------------------------
function seededRandom(x, z) {
    const dot = x * 12.9898 + z * 78.233;
    const sin = Math.sin(dot) * 43758.5453123;
    return sin - Math.floor(sin);
}

function sRand(x, z, min, max) {
    return min + seededRandom(x, z) * (max - min);
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function getSlope(px, pz) {
    const h = getTerrainHeight(px, pz);
    const hx = getTerrainHeight(px + 0.5, pz);
    const hz = getTerrainHeight(px, pz + 0.5);
    const dx = Math.abs(hx - h);
    const dz = Math.abs(hz - h);
    return Math.max(dx, dz) * 2.0; // rough slope estimate
}

function minLandmarkDistance(px, pz) {
    const locs = getAllLocations();
    let minD = Infinity;
    for (const loc of locs) {
        const d = Math.hypot(px - loc.position.x, pz - loc.position.z);
        if (d < minD) minD = d;
    }
    return minD;
}

// ---------------------------------------------------------------------------
// MICRO-ENVIRONMENT GENERATOR
// ---------------------------------------------------------------------------
export function buildMicroEnvironment(Game) {
    Game.registerStructure((scene, M) => {
        const dummy = new THREE.Object3D();

        // 1. Setup Instanced Meshes
        // Dirt/Erosion patches
        const dirtGeo = new THREE.CircleGeometry(0.8, 6);
        dirtGeo.rotateX(-Math.PI / 2);
        const dirtMat = new THREE.MeshBasicMaterial({ color: 0x3d3c35, transparent: true, opacity: 0.7, depthWrite: false });
        const dirtMesh = new THREE.InstancedMesh(dirtGeo, dirtMat, 4000);
        let dirtCount = 0;

        // Weeds / Reclaimed growth (Small clusters)
        const weedGeo = new THREE.PlaneGeometry(0.4, 0.6);
        weedGeo.translate(0, 0.3, 0);
        const weedMat = new THREE.MeshBasicMaterial({ color: 0x4a5d3f, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
        const weedMesh = new THREE.InstancedMesh(weedGeo, weedMat, 6000);
        let weedCount = 0;

        // Twigs / Branches
        const twigGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.8, 4);
        twigGeo.rotateX(Math.PI / 2);
        const twigMat = M.wood ? M.wood : new THREE.MeshBasicMaterial({ color: 0x40362b });
        const twigMesh = new THREE.InstancedMesh(twigGeo, twigMat, 3000);
        let twigCount = 0;

        // Micro Pebbles (Path edges)
        const pebbleGeo = new THREE.DodecahedronGeometry(0.06, 0);
        const pebbleMesh = new THREE.InstancedMesh(pebbleGeo, M.stoneDark, 5000);
        let pebbleCount = 0;

        // 2. Grid Traversal
        const gridMin = -45;
        const gridMax = 45;
        const step = 1.2;

        for (let x = gridMin; x <= gridMax; x += step) {
            for (let z = gridMin; z <= gridMax; z += step) {
                // Apply jitter
                const px = x + sRand(x, z, -0.4, 0.4);
                const pz = z + sRand(z, x, -0.4, 0.4);
                
                // Clearance for Tier 1
                if (!checkLandmarkClearance(px, pz, true)) {
                    // Allowed small details, but skip dense overgrowth
                }

                const dPath = minPathDistance(px, pz);
                const { district, strength } = dominantDistrict(px, pz);
                const slope = getSlope(px, pz);
                const dLandmark = minLandmarkDistance(px, pz);
                const h = getTerrainHeight(px, pz);

                dummy.position.set(px, h, pz);

                // PATH ECOLOGY
                if (dPath < 0.8) {
                    // Center of path: almost bare, occasional dirt patch or tiny pebble
                    if (sRand(px, pz, 0, 1) < 0.1 && dirtCount < 4000) {
                        dummy.scale.setScalar(sRand(px, pz, 0.4, 1.2));
                        dummy.rotation.set(0, sRand(px, pz, 0, Math.PI), 0);
                        dummy.position.y = h + 0.02;
                        dummy.updateMatrix();
                        dirtMesh.setMatrixAt(dirtCount++, dummy.matrix);
                    }
                    continue; // Suppress normal vegetation
                } else if (dPath >= 0.8 && dPath < 2.5) {
                    // Path Edge: Wear, small pebbles, dirt, weeds
                    if (sRand(px, pz, 0, 1) < 0.25 && dirtCount < 4000) {
                        dummy.scale.setScalar(sRand(px, pz, 0.5, 1.5));
                        dummy.rotation.set(0, sRand(px, pz, 0, Math.PI), 0);
                        dummy.position.y = h + 0.02;
                        dummy.updateMatrix();
                        dirtMesh.setMatrixAt(dirtCount++, dummy.matrix);
                    }
                    if (sRand(px, pz, 0, 1) < 0.3 && pebbleCount < 5000) {
                        dummy.scale.setScalar(sRand(px, pz, 0.5, 1.5));
                        dummy.rotation.set(sRand(px, pz, 0, Math.PI), sRand(px, pz, 0, Math.PI), 0);
                        dummy.position.y = h + 0.03;
                        dummy.updateMatrix();
                        pebbleMesh.setMatrixAt(pebbleCount++, dummy.matrix);
                    }
                }

                // SLOPE RESPONSE
                if (slope > 0.4) {
                    // Erosion patches on steep slopes
                    if (sRand(px, pz, 0, 1) < 0.3 && dirtCount < 4000) {
                        dummy.scale.set(sRand(px, pz, 0.8, 2.0), sRand(px, pz, 0.4, 1.0), 1);
                        dummy.rotation.set(0, sRand(px, pz, 0, Math.PI), 0);
                        dummy.position.y = h + 0.02;
                        dummy.updateMatrix();
                        dirtMesh.setMatrixAt(dirtCount++, dummy.matrix);
                    }
                    // Rarely spawn vegetation on high slopes
                    if (sRand(px, pz, 0, 1) > 0.15) continue;
                }

                // DISTRICT & RECLAMATION LOGIC
                let weedProb = 0.05;
                let dirtProb = 0.05;
                let twigProb = 0.01;

                if (district === "ENTRANCE") {
                    dirtProb = 0.2;
                    weedProb = 0.05;
                } else if (district === "RESIDENTIAL") {
                    weedProb = 0.15;
                    dirtProb = 0.1;
                    twigProb = 0.03;
                    // Vegetation responding to structures (foundations usually near locs or just high structural density areas)
                    // We simulate this by checking distance to landmarks. Very close = weathering/reclamation.
                    if (dLandmark < 6.0 && dLandmark > 2.0) {
                        weedProb += 0.2; // Weeds collect around walls/edges
                    }
                } else if (district === "COMMUNAL") {
                    weedProb = 0.05; // Cleaner
                    dirtProb = 0.02;
                } else if (district === "DEFENSIVE") {
                    weedProb = 0.1;
                    dirtProb = 0.15;
                    // Grass/Weeds in crevices
                    if (dLandmark < 5.0) weedProb += 0.15;
                } else if (district === "OUTSKIRTS" || district === "MEMORIAL") {
                    weedProb = 0.25;
                    twigProb = 0.1; // More fallen branches
                    dirtProb = 0.01;
                }

                // Spawn based on probabilities
                if (sRand(px, pz, 0, 1) < weedProb && weedCount < 6000) {
                    const clumpSize = Math.floor(sRand(px, pz, 1, 4));
                    for(let c=0; c<clumpSize; c++) {
                        if (weedCount >= 6000) break;
                        const wx = px + sRand(px+c, pz, -0.3, 0.3);
                        const wz = pz + sRand(pz+c, px, -0.3, 0.3);
                        dummy.position.set(wx, getTerrainHeight(wx, wz), wz);
                        dummy.scale.setScalar(sRand(wx, wz, 0.6, 1.3));
                        dummy.rotation.set(0, sRand(wx, wz, 0, Math.PI*2), 0);
                        dummy.updateMatrix();
                        weedMesh.setMatrixAt(weedCount++, dummy.matrix);
                    }
                }

                if (sRand(px, pz, 0, 1) < dirtProb && dirtCount < 4000) {
                    dummy.position.set(px, h + 0.02, pz);
                    dummy.scale.setScalar(sRand(px, pz, 0.5, 1.8));
                    dummy.rotation.set(0, sRand(px, pz, 0, Math.PI), 0);
                    dummy.updateMatrix();
                    dirtMesh.setMatrixAt(dirtCount++, dummy.matrix);
                }

                if (sRand(px, pz, 0, 1) < twigProb && twigCount < 3000) {
                    dummy.position.set(px, h + 0.03, pz);
                    dummy.scale.setScalar(sRand(px, pz, 0.8, 2.0));
                    dummy.rotation.set(sRand(px, pz, 0, 0.4), sRand(px, pz, 0, Math.PI*2), sRand(px, pz, 0, 0.4));
                    dummy.updateMatrix();
                    twigMesh.setMatrixAt(twigCount++, dummy.matrix);
                }
            }
        }

        dirtMesh.count = dirtCount;
        weedMesh.count = weedCount;
        twigMesh.count = twigCount;
        pebbleMesh.count = pebbleCount;

        scene.add(dirtMesh);
        scene.add(weedMesh);
        scene.add(twigMesh);
        scene.add(pebbleMesh);
    });
}

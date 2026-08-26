import { THREE } from "../core/Renderer.js";
import { LOCATION_DATA, LOCATIONS } from "../world/locations/locations.js";
import {
    rand, ruinedWall, brokenColumn, emptyPlot, campfireRing,
    storageDebris, createTree, getTerrainHeight,
    foundationFootprint, floorSlabs, rubblePile, stoneBench, cartWreck
} from "./RuinsUtils.js";

// ---------------------------------------------------------------------------
// LANDMARK HIERARCHY & SIGHTLINES
// ---------------------------------------------------------------------------
const TIER_1 = ["LOC_001_ARCHWAY", "LOC_007_BROKEN_TOWER", "LOC_008_SILENT_BELL"];
const TIER_2 = ["LOC_003_EMPTY_HOUSE", "LOC_004_WELL", "LOC_005_STONE_GARDEN", "LOC_006_STATUE", "LOC_009_OLD_ROAD"];

let _sightlineCorridors = null;
function buildSightlines() {
    if (_sightlineCorridors) return _sightlineCorridors;
    _sightlineCorridors = [
        [LOCATIONS.ARCHWAY, LOCATIONS.PATH], // Corridor A (Approach)
        [LOCATIONS.HOUSE, LOCATIONS.TOWER],  // Corridor B (Glimpse)
        [LOCATIONS.STATUE, LOCATIONS.TOWER], // Corridor C (Reveal)
        [LOCATIONS.STATUE, LOCATIONS.BELL],  // Corridor D (Secondary)
        [LOCATIONS.WELL, LOCATIONS.GARDEN]   // Corridor E (Communal)
    ];
    return _sightlineCorridors;
}

export function checkLandmarkClearance(px, pz, isTallObject) {
    if (!isTallObject) return true; // Small scatter is always allowed

    // 1. Tier 1 Clearance (Large breathing room)
    for (const t1 of TIER_1) {
        const loc = LOCATION_DATA[t1].position;
        if (Math.hypot(px - loc.x, pz - loc.z) < 8.0) return false;
    }

    // 2. Tier 2 Clearance (Moderate breathing room)
    for (const t2 of TIER_2) {
        const loc = LOCATION_DATA[t2].position;
        if (Math.hypot(px - loc.x, pz - loc.z) < 4.5) return false;
    }

    // 3. Sightline Corridors (Do not block the view)
    const sightlines = buildSightlines();
    for (const [a, b] of sightlines) {
        if (distToSegment2D(px, pz, a.x, a.z, b.x, b.z) < 3.0) return false;
    }

    return true; // Valid placement
}


// ---------------------------------------------------------------------------
// SMOOTHSTEP
// ---------------------------------------------------------------------------
function smoothstep(centerR, edgeR, dist) {
    if (dist <= centerR) return 1.0;
    if (dist >= edgeR) return 0.0;
    const t = (dist - centerR) / (edgeR - centerR);
    return 1.0 - (t * t * (3 - 2 * t));
}

// ---------------------------------------------------------------------------
// DISTRICT WEIGHTS
// ---------------------------------------------------------------------------
function districtWeightAt(px, pz) {
    const allLocs = Object.values(LOCATION_DATA);
    const weights = allLocs.map(loc => {
        const dist = Math.hypot(px - loc.position.x, pz - loc.position.z);
        return { loc, w: smoothstep(15, 55, dist) };  // expanded from 8,20 to reach the whole village
    });
    const totalW = weights.reduce((s, e) => s + e.w, 0);
    if (totalW === 0) return weights; 
    return weights.map(e => ({ loc: e.loc, w: e.w / totalW }));
}

export function dominantDistrict(px, pz) {
    const weights = districtWeightAt(px, pz);
    let best = { district: "WILDERNESS", strength: 0 };
    for (const { loc, w } of weights) {
        if (w > best.strength) best = { district: loc.district, strength: w };
    }
    return best;
}

function neighborInfluence(px, pz, ownDistrict) {
    const allLocs = Object.values(LOCATION_DATA);
    let maxForeignWeight = 0;
    for (const loc of allLocs) {
        if (loc.district === ownDistrict) continue;
        const dist = Math.hypot(px - loc.position.x, pz - loc.position.z);
        const w = smoothstep(12, 30, dist);  // expanded from 6,14
        if (w > maxForeignWeight) maxForeignWeight = w;
    }
    return maxForeignWeight;
}

// ---------------------------------------------------------------------------
// PATH CORRIDORS
// ---------------------------------------------------------------------------
const PATH_ORDER_KEYS = ["ARCHWAY", "PATH", "HOUSE", "WELL", "GARDEN", "STATUE", "TOWER", "BELL", "ROAD", "GRAVE"];
let _pathSegments = null;
function buildPathSegments() {
    if (_pathSegments) return _pathSegments;
    const pts = PATH_ORDER_KEYS.map(k => LOCATIONS[k]);
    _pathSegments = [];
    for (let i = 0; i < pts.length - 1; i++) {
        _pathSegments.push([pts[i], pts[i + 1]]);
    }
    _pathSegments.push([LOCATIONS.HOUSE, LOCATIONS.WELL]);
    _pathSegments.push([LOCATIONS.GARDEN, LOCATIONS.STATUE]);
    return _pathSegments;
}

function distToSegment2D(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az;
    const lenSq = dx * dx + dz * dz;
    if (lenSq === 0) return Math.hypot(px - ax, pz - az);
    let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

export function minPathDistance(px, pz) {
    const segs = buildPathSegments();
    let minD = Infinity;
    for (const [a, b] of segs) {
        const d = distToSegment2D(px, pz, a.x, a.z, b.x, b.z);
        if (d < minD) minD = d;
    }
    return minD;
}

// ---------------------------------------------------------------------------
// SPATIAL REJECTION & FOOTPRINTS
// ---------------------------------------------------------------------------
const _largeFootprints = [];

export function tooCloseToExisting(x, z, minDist) {
    for (const [fx, fz] of _largeFootprints) {
        if (Math.hypot(x - fx, z - fz) < minDist) return true;
    }
    return false;
}

export function registerFootprint(x, z) {
    _largeFootprints.push([x, z]);
}

function findPlacement(cx, cz, radiusMin, radiusMax, minSep, pathClearance, maxTries = 8, isTallObject = true) {
    for (let t = 0; t < maxTries; t++) {
        const angle = Math.random() * Math.PI * 2;
        const r = rand(radiusMin, radiusMax);
        const px = cx + Math.cos(angle) * r;
        const pz = cz + Math.sin(angle) * r;
        if (minPathDistance(px, pz) < pathClearance) continue;
        if (minSep > 0 && tooCloseToExisting(px, pz, minSep)) continue;
        if (!checkLandmarkClearance(px, pz, isTallObject)) continue; // VISUAL HIERARCHY CHECK
        return [px, pz];
    }
    return null;
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function addLily(scene, px, pz) {
    const lilyGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
    const lilyMat = new THREE.MeshBasicMaterial({ color: 0x8ea0e0, transparent: true, opacity: 0.8 });
    const lily = new THREE.Mesh(lilyGeo, lilyMat);
    const lx = px + (Math.random() - 0.5) * 2.4;
    const lz = pz + (Math.random() - 0.5) * 2.4;
    lily.position.set(lx, getTerrainHeight(lx, lz) + 0.15, lz);
    lily.rotation.set(Math.random() * 0.2, 0, Math.random() * 0.2);
    lily.scale.setScalar(rand(0.7, 1.2));
    scene.add(lily);
}

function neutralScatter(scene, px, pz, strength, M) {
    if (Math.random() < strength * 0.5) {
        const s = rand(0.25, 0.55);
        const geo = new THREE.DodecahedronGeometry(s, 0);
        const stone = new THREE.Mesh(geo, M.stoneDark);
        stone.position.set(px, getTerrainHeight(px, pz) + s * 0.3, pz);
        stone.rotation.set(rand(0, 0.4), rand(0, Math.PI), rand(0, 0.4));
        scene.add(stone);
    }
    if (Math.random() < strength * 0.2) {
        const bGeo = new THREE.CylinderGeometry(0.04, 0.07, rand(0.6, 1.4), 4);
        const branch = new THREE.Mesh(bGeo, M.stoneDark);
        branch.position.set(px, getTerrainHeight(px, pz) + 0.4, pz);
        branch.rotation.set(rand(0.4, 1.0), rand(0, Math.PI), rand(-0.5, 0.5));
        scene.add(branch);
    }
}

// ---------------------------------------------------------------------------
// PATH HISTORY (Wear & usage bias)
// ---------------------------------------------------------------------------
function scatterPathHistory(scene, cx, cz, localStrength, M) {
    for (let i = 0; i < 15; i++) {
        const r = rand(2, 16);
        const angle = Math.random() * Math.PI * 2;
        const px = cx + Math.cos(angle) * r;
        const pz = cz + Math.sin(angle) * r;
        
        const pathDist = minPathDistance(px, pz);
        
        if (pathDist > 0.8 && pathDist < 2.5) {
            if (Math.random() < localStrength * 0.4) {
                neutralScatter(scene, px, pz, 0.6, M);
            }
            if (Math.random() < localStrength * 0.05) {
                // Not tall, don't reject carts
                if(checkLandmarkClearance(px, pz, false)) { 
                    cartWreck(scene, px, pz, rand(0, Math.PI), M);
                }
            }
        }
    }
}


// ---------------------------------------------------------------------------
// MAIN GENERATOR
// ---------------------------------------------------------------------------
export function buildDistricts(Game) {
    _largeFootprints.length = 0;

    Game.registerStructure((scene, M) => {
        const allLocs = Object.values(LOCATION_DATA);

        allLocs.forEach(loc => {
            const cx = loc.position.x;
            const cz = loc.position.z;
            const district = loc.district;

            const ni = neighborInfluence(cx, cz, district);
            const localStrength = 1.0 - ni * 0.55;

            if (district === "RESIDENTIAL" || district === "ENTRANCE") {
                scatterPathHistory(scene, cx, cz, localStrength, M);
            }

            // ----------------------------------------------------------------
            // RESIDENTIAL
            // ----------------------------------------------------------------
            if (district === "RESIDENTIAL") {
                const totalStructures = Math.round(rand(3, 6) * localStrength);
                
                for (let i = 0; i < totalStructures; i++) {
                    const isFoundation = Math.random() > 0.5;
                    const pos = findPlacement(cx, cz, 2, 14, 5.5, 2.5, 8, true);
                    if (!pos) continue;
                    const [px, pz] = pos;
                    const fw = smoothstep(4, 14, Math.hypot(px - cx, pz - cz));
                    if (Math.random() > fw * localStrength + 0.15) continue;
                    
                    const rot = rand(0, Math.PI);
                    
                    if (isFoundation) {
                        foundationFootprint(scene, px, pz, rand(4, 6), rand(4, 6), rot, M);
                    } else {
                        emptyPlot(scene, px, pz, rand(4, 5.5), rand(4, 5.5), rot, M);
                    }
                    registerFootprint(px, pz);

                    if (Math.random() < 0.6) {
                        const edgeR = rand(2.5, 3.5);
                        const edgeAngle = Math.random() * Math.PI * 2;
                        const tx = px + Math.cos(edgeAngle) * edgeR;
                        const tz = pz + Math.sin(edgeAngle) * edgeR;
                        if(checkLandmarkClearance(tx, tz, false)) storageDebris(scene, tx, tz, M);
                    }

                    if (Math.random() < 0.4) {
                        const edgeR = rand(3.0, 4.0);
                        const edgeAngle = Math.random() * Math.PI * 2;
                        const tx = px + Math.cos(edgeAngle) * edgeR;
                        const tz = pz + Math.sin(edgeAngle) * edgeR;
                        if(checkLandmarkClearance(tx, tz, false)) campfireRing(scene, tx, tz, M);
                    }
                    
                    if (Math.random() < 0.5) {
                        const edgeR = rand(1.5, 3.5);
                        const edgeAngle = Math.random() * Math.PI * 2;
                        const tx = px + Math.cos(edgeAngle) * edgeR;
                        const tz = pz + Math.sin(edgeAngle) * edgeR;
                        if(checkLandmarkClearance(tx, tz, false)) rubblePile(scene, tx, tz, rand(0.5, 1.2), rand(2, 4), M);
                    }

                    if (Math.random() < 0.5) {
                        const treeR = rand(1.0, 4.0);
                        const treeAngle = Math.random() * Math.PI * 2;
                        const tx = px + Math.cos(treeAngle) * treeR;
                        const tz = pz + Math.sin(treeAngle) * treeR;
                        if(checkLandmarkClearance(tx, tz, true)) createTree(scene, new THREE.Vector3(tx, 0, tz), M);
                    }
                }

                const treeCount = Math.round(rand(1, 3));
                for (let i = 0; i < treeCount; i++) {
                    const pos = findPlacement(cx, cz, 4, 14, 0, 2.0, 8, true);
                    if (pos) createTree(scene, new THREE.Vector3(pos[0], 0, pos[1]), M);
                }

                if (localStrength > 0.55 && Math.random() < 0.7) {
                    const pos = findPlacement(cx, cz, 2, 9, 4.5, 2.5, 8, false); // floorSlabs not tall
                    if (pos) {
                        floorSlabs(scene, pos[0], pos[1], rand(3, 4.5), rand(3, 4.5), rand(0, Math.PI), M);
                        registerFootprint(pos[0], pos[1]);
                        
                        if (Math.random() < 0.8) campfireRing(scene, pos[0] + rand(-1.5, 1.5), pos[1] + rand(-1.5, 1.5), M);
                    }
                }

                for (let i = 0; i < 6; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = rand(10, 18);
                    const px = cx + Math.cos(angle) * r;
                    const pz = cz + Math.sin(angle) * r;
                    const { district: dom } = dominantDistrict(px, pz);
                    if (dom !== "RESIDENTIAL") continue;
                    const edgeFw = 1 - smoothstep(9, 18, r);
                    neutralScatter(scene, px, pz, edgeFw, M);
                }
            }

            // ----------------------------------------------------------------
            // COMMUNAL
            // ----------------------------------------------------------------
            else if (district === "COMMUNAL") {
                if (localStrength > 0.4) {
                    const pos = findPlacement(cx, cz, 1, 7, 4.0, 3.5, 8, false); // floorSlabs not tall
                    if (pos) {
                        const rot = rand(0, Math.PI);
                        const [px, pz] = pos;
                        floorSlabs(scene, px, pz, rand(5, 7), rand(5, 7), rot, M);
                        registerFootprint(px, pz);
                        
                        // ==========================================
                        // ORGANIZED SEATING RELATIONSHIP
                        // ==========================================
                        const localBenches = rand(1, 3);
                        for(let b=0; b<localBenches; b++) {
                            const bAngle = Math.random() * Math.PI * 2;
                            const bR = rand(3.5, 4.5);
                            stoneBench(scene, px + Math.cos(bAngle)*bR, pz + Math.sin(bAngle)*bR, rot + rand(-0.2, 0.2), M);
                        }
                        
                        const localLilies = rand(3, 6);
                        for(let l=0; l<localLilies; l++) {
                            addLily(scene, px + rand(-4, 4), pz + rand(-4, 4));
                        }
                    }
                }

                const benchCount = Math.round(rand(1, 2) * localStrength);
                for (let i = 0; i < benchCount; i++) {
                    const pos = findPlacement(cx, cz, 5, 12, 0, 2.0, 8, false);
                    if (pos) stoneBench(scene, pos[0], pos[1], rand(0, Math.PI), M);
                }

                const lilyCount = Math.round(rand(4, 7) * localStrength);
                for (let i = 0; i < lilyCount; i++) {
                    const px = cx + rand(-9, 9);
                    const pz = cz + rand(-9, 9);
                    addLily(scene, px, pz);
                }

                for (let i = 0; i < 5; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = rand(11, 18);
                    const px = cx + Math.cos(angle) * r;
                    const pz = cz + Math.sin(angle) * r;
                    const { district: dom } = dominantDistrict(px, pz);
                    if (dom !== "COMMUNAL") continue;
                    const edgeFw = 1 - smoothstep(10, 18, r);
                    neutralScatter(scene, px, pz, edgeFw, M);
                    if (Math.random() < edgeFw * 0.25) {
                        if(checkLandmarkClearance(px, pz, true)) createTree(scene, new THREE.Vector3(px, 0, pz), M);
                    }
                }
            }

            // ----------------------------------------------------------------
            // DEFENSIVE
            // ----------------------------------------------------------------
            else if (district === "DEFENSIVE") {
                const wallCount = Math.round(rand(2, 4) * localStrength);
                for (let i = 0; i < wallCount; i++) {
                    const pos = findPlacement(cx, cz, 3, 12, 4.5, 3.5, 8, true);
                    if (!pos) continue;
                    const fw = smoothstep(4, 12, Math.hypot(pos[0] - cx, pos[1] - cz));
                    if (Math.random() > fw * localStrength + 0.1) continue;
                    
                    const rot = rand(0, Math.PI);
                    const [px, pz] = pos;
                    ruinedWall(scene, px, pz, rand(4, 7), rand(3, 5), rot, M.stone, M);
                    registerFootprint(px, pz);

                    const normalAngle = rot + (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2) + rand(-0.2, 0.2);
                    const dropDist = rand(1.5, 3.5);
                    const rx = px + Math.cos(normalAngle)*dropDist;
                    const rz = pz + Math.sin(normalAngle)*dropDist;
                    if(checkLandmarkClearance(rx, rz, false)) rubblePile(scene, rx, rz, rand(1.5, 3.5), rand(5, 12), M);

                    if(Math.random() < 0.4) {
                        const colAngle = rot + rand(-Math.PI/4, Math.PI/4);
                        const cx2 = px + Math.cos(colAngle)*3;
                        const cz2 = pz + Math.sin(colAngle)*3;
                        if(checkLandmarkClearance(cx2, cz2, true)) brokenColumn(scene, cx2, cz2, rand(3, 5.5), rand(0, Math.PI), M);
                    }

                    if(Math.random() < 0.3) {
                        const tx = px + rand(-3,3);
                        const tz = pz + rand(-3,3);
                        if(checkLandmarkClearance(tx, tz, true)) createTree(scene, new THREE.Vector3(tx, 0, tz), M);
                    }
                }

                for (let i = 0; i < 5; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = rand(11, 18);
                    const px = cx + Math.cos(angle) * r;
                    const pz = cz + Math.sin(angle) * r;
                    const { district: dom } = dominantDistrict(px, pz);
                    if (dom !== "DEFENSIVE") continue;
                    const edgeFw = 1 - smoothstep(10, 18, r);
                    if (Math.random() < edgeFw * 0.35) {
                        if(checkLandmarkClearance(px, pz, false)) rubblePile(scene, px, pz, rand(0.8, 1.8), rand(2, 5), M);
                    }
                    neutralScatter(scene, px, pz, edgeFw, M);
                }
            }

            // ----------------------------------------------------------------
            // ENTRANCE
            // ----------------------------------------------------------------
            else if (district === "ENTRANCE") {
                const colCount = Math.round(rand(1, 3) * localStrength);
                for (let i = 0; i < colCount; i++) {
                    const pos = findPlacement(cx, cz, 2, 7, 0, 2.0, 8, true);
                    if (pos) brokenColumn(scene, pos[0], pos[1], rand(1.5, 3.5), rand(0, Math.PI), M);
                }

                for (let i = 0; i < 4; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = rand(8, 16);
                    const px = cx + Math.cos(angle) * r;
                    const pz = cz + Math.sin(angle) * r;
                    const { district: dom, strength } = dominantDistrict(px, pz);
                    if (dom !== "ENTRANCE" && dom !== "RESIDENTIAL") continue;
                    const transitionW = dom === "RESIDENTIAL" ? strength : 1 - smoothstep(7, 16, r);
                    if (Math.random() < transitionW * 0.3) {
                        if(checkLandmarkClearance(px, pz, false)) rubblePile(scene, px, pz, rand(0.5, 1.2), rand(1, 3), M);
                    }
                    neutralScatter(scene, px, pz, transitionW * 0.5, M);
                }

                const treeCount = Math.round(rand(2, 4));
                for (let i = 0; i < treeCount; i++) {
                    const pos = findPlacement(cx, cz, 3, 14, 0, 2.0, 8, true);
                    if (pos) createTree(scene, new THREE.Vector3(pos[0], 0, pos[1]), M);
                }
            }

            // ----------------------------------------------------------------
            // OUTSKIRTS
            // ----------------------------------------------------------------
            else if (district === "OUTSKIRTS") {
                const treeCount = Math.round(rand(4, 7));
                for (let i = 0; i < treeCount; i++) {
                    const pos = findPlacement(cx, cz, 2, 15, 0, 2.0, 8, true);
                    if (pos) createTree(scene, new THREE.Vector3(pos[0], 0, pos[1]), M);
                }

                scatterPathHistory(scene, cx, cz, localStrength * 0.5, M);

                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = rand(9, 16);
                    const px = cx + Math.cos(angle) * r;
                    const pz = cz + Math.sin(angle) * r;
                    const { district: dom } = dominantDistrict(px, pz);
                    if (dom === "DEFENSIVE") {
                        if(checkLandmarkClearance(px, pz, false)) rubblePile(scene, px, pz, rand(0.8, 1.5), rand(2, 5), M);
                    } else if (dom === "OUTSKIRTS") {
                        neutralScatter(scene, px, pz, 0.4, M);
                    }
                }
            }

            // ----------------------------------------------------------------
            // MEMORIAL
            // ----------------------------------------------------------------
            else if (district === "MEMORIAL") {
                const treeCount = Math.round(rand(3, 5));
                for (let i = 0; i < treeCount; i++) {
                    // Trees deliberately ignore clearance to maintain occlusion
                    const pos = findPlacement(cx, cz, 2, 9, 0, 2.0, 8, false);
                    if (pos) createTree(scene, new THREE.Vector3(pos[0], 0, pos[1]), M);
                }
                
                for (let i = 0; i < Math.round(rand(2, 4)); i++) {
                    addLily(scene, cx + rand(-5, 5), cz + rand(-5, 5));
                }
            }
        });
    });
}

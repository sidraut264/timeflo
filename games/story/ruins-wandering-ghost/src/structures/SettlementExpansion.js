import { THREE } from "../core/Renderer.js";
import { getTerrainHeight } from "./RuinsUtils.js";
import { windingPath } from "./RuinsUtils.js";
import { dominantDistrict, minPathDistance, checkLandmarkClearance, tooCloseToExisting, registerFootprint } from "./DistrictGenerator.js";
import { buildResidentialProperty, buildWorkshopProperty, buildStorageProperty, buildAgriculturalProperty, determineOrientation } from "./PropertyGenerator.js";
import { buildCommunalWell, buildGatheringSquare } from "./InfrastructureGenerator.js";
import { flushInstances } from "./InstancedMeshManager.js";

// ---------------------------------------------------------------------------
// DETERMINISTIC SEEDED RANDOM
// ---------------------------------------------------------------------------
function seededRandom(x, z) {
    const dot = x * 12.9898 + z * 78.233;
    const sin = Math.sin(dot) * 43758.5453123;
    return sin - Math.floor(sin);
}

function sRand(x, z, min, max) {
    return min + seededRandom(x, z) * (max - min);
}

function pickS(x, z, arr) {
    return arr[Math.floor(seededRandom(x, z) * arr.length)];
}

// ---------------------------------------------------------------------------
// ZONING & DENSITY
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// SUBURB CLUSTER ANCHORS — hand-placed off-center density seeds
// ---------------------------------------------------------------------------
const SUBURB_ANCHORS = [
    { x: -55, z: -45, radius: 35, density: 0.70 }, // Near Empty House (LOC_003)
    { x: -80, z: -15, radius: 32, density: 0.65 }, // Near Well (LOC_004)
    { x: -50, z:  40, radius: 30, density: 0.60 }, // Near Stone Garden (LOC_005)
    { x:  10, z:  65, radius: 30, density: 0.60 }, // Near Statue (LOC_006)
    { x:  70, z:  30, radius: 28, density: 0.55 }, // Near Broken Tower (LOC_007)
    { x:  90, z: -30, radius: 26, density: 0.55 }, // Near Silent Bell (LOC_008)
    { x:  40, z: -80, radius: 24, density: 0.40 }, // Near Old Road (LOC_009)
];

// Calculates continuous settlement pressure
function settlementFootprintAt(px, pz) {
    const distFromCenter = Math.hypot(px - 10, pz - 10);
    const { district, strength } = dominantDistrict(px, pz);

    // PRIMARY ZONE — concentric rings from the settlement core
    let zoneDensity = 0;
    if      (distFromCenter <  20) zoneDensity = 0.92;  // Core
    else if (distFromCenter <  45) zoneDensity = 0.78;  // Inner residential
    else if (distFromCenter <  75) zoneDensity = 0.58;  // Outer residential
    else if (distFromCenter < 105) zoneDensity = 0.35;  // Peripheral
    else if (distFromCenter < 135) zoneDensity = 0.18;  // Abandoned fringe
    else if (distFromCenter < 155) zoneDensity = 0.07;  // Wilderness edge

    // SUBURB BOOST — blend extra density from off-center hamlet anchors
    for (const anchor of SUBURB_ANCHORS) {
        const dAnchor = Math.hypot(px - anchor.x, pz - anchor.z);
        if (dAnchor < anchor.radius) {
            // Smooth falloff from anchor centre
            const t = dAnchor / anchor.radius;
            const boost = anchor.density * (1 - t * t * (3 - 2 * t));
            zoneDensity = Math.max(zoneDensity, boost);
        }
    }

    // District modifiers
    if      (district === "RESIDENTIAL") zoneDensity *= 1.25;
    else if (district === "COMMUNAL")    zoneDensity *= 0.80;
    else if (district === "DEFENSIVE")   zoneDensity *= 0.65;
    else if (district === "OUTSKIRTS")   zoneDensity *= 0.50;
    else if (district === "MEMORIAL")    zoneDensity *= 0.04;

    return Math.min(1.0, zoneDensity * strength);
}

// ---------------------------------------------------------------------------
// MAIN SETTLEMENT ORCHESTRATION
// ---------------------------------------------------------------------------
export function buildSettlementExpansion(Game) {
    Game.registerStructure((scene, M) => {
        // Grid kept at ±100 / 8m to avoid main-thread hang (~625 cells).
        // Suburb anchors around the spread-out landmarks fill the gaps.
        const gridMin = -100;
        const gridMax = 100;
        const step = 8.0;

        for (let x = gridMin; x <= gridMax; x += step) {
            for (let z = gridMin; z <= gridMax; z += step) {
                // Jitter
                const px = x + sRand(x, z, -2.5, 2.5);
                const pz = z + sRand(z, x, -2.5, 2.5);

                const density = settlementFootprintAt(px, pz);

                // Roll against density
                if (sRand(px, pz, 0, 1) > density) continue;

                // Rejections
                if (!checkLandmarkClearance(px, pz, true)) continue;
                if (minPathDistance(px, pz) < 3.0) continue;
                if (tooCloseToExisting(px, pz, 5.0)) continue;

                const { district } = dominantDistrict(px, pz);
                
                // Property Orientation
                const rot = determineOrientation(px, pz);

                // Collapse state based heavily on distance/density
                const decayRoll = sRand(px, pz, 0, 1);
                let collapseState = "INTACT_FOUNDATION";
                if (decayRoll > density + 0.3) collapseState = "NEARLY_ERASED";
                else if (decayRoll > density) collapseState = "HEAVILY_COLLAPSED";
                else if (decayRoll > density - 0.2) collapseState = "PARTIAL_WALLS";

                registerFootprint(px, pz);

                // Functional Property Selection
                if (district === "RESIDENTIAL" || district === "ENTRANCE") {
                    const propType = pickS(px, pz, ["RESIDENTIAL", "RESIDENTIAL", "RESIDENTIAL", "WORKSHOP", "STORAGE"]);
                    
                    if (propType === "WORKSHOP") {
                        buildWorkshopProperty(scene, px, pz, rot, collapseState, M);
                    } else if (propType === "STORAGE") {
                        buildStorageProperty(scene, px, pz, rot, collapseState, M);
                    } else {
                        const size = sRand(px, pz, 0, 1) < density ? "LARGE" : "SMALL";
                        buildResidentialProperty(scene, px, pz, rot, collapseState, size, M);
                    }
                } 
                else if (district === "COMMUNAL") {
                    // Less dense buildings, more infrastructure
                    const propType = pickS(px, pz, ["WELL", "SQUARE", "WORKSHOP"]);
                    if (propType === "WELL") {
                        buildCommunalWell(scene, px, pz, M);
                    } else if (propType === "SQUARE") {
                        buildGatheringSquare(scene, px, pz, collapseState, M);
                    } else {
                        buildWorkshopProperty(scene, px, pz, rot, collapseState, M);
                    }
                }
                else if (district === "OUTSKIRTS") {
                    // Agricultural transition
                    buildAgriculturalProperty(scene, px, pz, rot, collapseState, M);
                }
                else if (district === "DEFENSIVE") {
                    // Storage and strong houses
                    if (sRand(px, pz, 0, 1) < 0.5) buildStorageProperty(scene, px, pz, rot, collapseState, M);
                    else buildResidentialProperty(scene, px, pz, rot, collapseState, "LARGE", M);
                }
                else {
                    // Default fallback
                    buildResidentialProperty(scene, px, pz, rot, collapseState, "SMALL", M);
                }

                // Secondary/Tertiary Path Connectivity
                // Faint dirt paths between back lots
                if (sRand(px, pz, 5, 6) < (density * 0.4)) {
                    // Project a path toward the nearest main thoroughfare
                    const alleyDir = rot; 
                    const alleyEnd = new THREE.Vector3(px + Math.cos(alleyDir) * 12, 0, pz + Math.sin(alleyDir) * 12);
                    windingPath(scene, new THREE.Vector3(px, 0, pz), alleyEnd, M, { spacing: 2.0, wander: 1.5 });
                }
            }
        }
    });
}

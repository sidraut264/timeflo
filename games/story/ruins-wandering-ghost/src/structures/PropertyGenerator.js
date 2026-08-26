import { THREE } from "../core/Renderer.js";
import { getTerrainHeight, rand } from "./RuinsUtils.js";
import { 
    foundationFootprint, floorSlabs, courseWall, ruinedWall, rubblePile, 
    campfireRing, storageDebris, lowWall, emptyPlot 
} from "./RuinsUtils.js";
import { minPathDistance, checkLandmarkClearance, tooCloseToExisting, registerFootprint } from "./DistrictGenerator.js";

// Deterministic helpers
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

// Helper to find orientation towards nearest theoretical path
export function determineOrientation(px, pz) {
    // For now, we sample in 4 cardinal directions and pick the one with lowest minPathDistance
    const dirs = [
        { angle: 0, dx: 4, dz: 0 },
        { angle: Math.PI / 2, dx: 0, dz: 4 },
        { angle: Math.PI, dx: -4, dz: 0 },
        { angle: -Math.PI / 2, dx: 0, dz: -4 }
    ];
    let bestAngle = 0;
    let minDist = Infinity;
    for (const d of dirs) {
        const dist = minPathDistance(px + d.dx, pz + d.dz);
        if (dist < minDist) {
            minDist = dist;
            bestAngle = d.angle;
        }
    }
    return bestAngle;
}

// ---------------------------------------------------------------------------
// CORE BUILDING COMPONENT
// ---------------------------------------------------------------------------
function buildHouseComponent(scene, cx, cz, rot, width, depth, collapseState, M) {
    if (collapseState === "INTACT_FOUNDATION" || collapseState === "PARTIAL_WALLS") {
        floorSlabs(scene, cx, cz, width - 0.5, depth - 0.5, rot, M);
    }
    
    foundationFootprint(scene, cx, cz, width, depth, rot, M);

    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    // Front
    if (collapseState !== "NEARLY_ERASED" && sRand(cx, cz, 0, 1) < (collapseState === "INTACT_FOUNDATION" ? 0.9 : 0.5)) {
        const h = collapseState === "INTACT_FOUNDATION" ? 1.5 : 0.8;
        ruinedWall(scene, cx + (depth / 2) * sin, cz - (depth / 2) * cos, width, h, rot, M.stone, M);
    }
    // Back
    if (collapseState !== "NEARLY_ERASED" && sRand(cx, cz, 1, 2) < (collapseState === "INTACT_FOUNDATION" ? 0.8 : 0.4)) {
        const h = collapseState === "INTACT_FOUNDATION" ? 1.2 : 0.6;
        ruinedWall(scene, cx - (depth / 2) * sin, cz + (depth / 2) * cos, width, h, rot, M.stone, M);
    }
    // Left
    if (collapseState === "INTACT_FOUNDATION" || (collapseState === "PARTIAL_WALLS" && sRand(cx, cz, 2, 3) < 0.6)) {
        const h = collapseState === "INTACT_FOUNDATION" ? 1.8 : 0.7;
        ruinedWall(scene, cx - (width / 2) * cos, cz - (width / 2) * sin, depth, h, rot + Math.PI/2, M.stone, M);
    }
    // Right
    if (collapseState === "INTACT_FOUNDATION" || (collapseState === "PARTIAL_WALLS" && sRand(cx, cz, 3, 4) < 0.5)) {
        const h = collapseState === "INTACT_FOUNDATION" ? 1.5 : 0.7;
        ruinedWall(scene, cx + (width / 2) * cos, cz + (width / 2) * sin, depth, h, rot + Math.PI/2, M.stone, M);
    }

    if (collapseState === "HEAVILY_COLLAPSED" || collapseState === "PARTIAL_WALLS") {
        const cDir = sRand(cx, cz, 0, Math.PI * 2);
        const rx = cx + Math.cos(cDir) * (width * 0.4);
        const rz = cz + Math.sin(cDir) * (depth * 0.4);
        rubblePile(scene, rx, rz, width * 0.4, Math.floor(width * depth * 0.3), M);
    }
}

// ---------------------------------------------------------------------------
// PROPERTY TYPE GENERATORS
// ---------------------------------------------------------------------------
export function buildResidentialProperty(scene, cx, cz, rot, collapseState, size, M) {
    const w = size === 'LARGE' ? sRand(cx, cz, 7, 9) : sRand(cx, cz, 4, 6);
    const d = size === 'LARGE' ? sRand(cx, cz, 8, 11) : sRand(cx, cz, 5, 7);
    
    buildHouseComponent(scene, cx, cz, rot, w, d, collapseState, M);
    
    // Front threshold logic
    if (collapseState !== "NEARLY_ERASED" && collapseState !== "HEAVILY_COLLAPSED") {
        const tx = cx + (d/2) * Math.sin(rot);
        const tz = cz - (d/2) * Math.cos(rot);
        floorSlabs(scene, tx, tz, 2, 1, rot, M);
    }

    // Secondary structures / Courtyard
    if (size === 'LARGE' || sRand(cx, cz, 0, 1) < 0.6) {
        const cw = sRand(cx, cz, 4, 7);
        const cd = sRand(cx, cz, 4, 7);
        // Place courtyard to the side or back
        const sideOffset = sRand(cx, cz, 1, 2) < 0.5 ? 1 : -1;
        const ctx = cx + sideOffset * ((w/2) + (cw/2)) * Math.cos(rot);
        const ctz = cz + sideOffset * ((w/2) + (cw/2)) * Math.sin(rot);

        if (checkLandmarkClearance(ctx, ctz, false) && !tooCloseToExisting(ctx, ctz, 3.0)) {
            if (collapseState !== "NEARLY_ERASED") {
                const wh = collapseState === "HEAVILY_COLLAPSED" ? 0.3 : 0.6;
                if (sRand(ctx, ctz, 0, 1) < 0.7) ruinedWall(scene, ctx + (cw/2)*Math.cos(rot), ctz + (cw/2)*Math.sin(rot), cd, wh, rot + Math.PI/2, M.stone, M);
                if (sRand(ctx, ctz, 1, 2) < 0.7) ruinedWall(scene, ctx, ctz + (cd/2)*Math.cos(rot), cw, wh, rot, M.stone, M);
            }

            const contents = sRand(ctx, ctz, 2, 3);
            if (contents < 0.3 && collapseState !== "HEAVILY_COLLAPSED") storageDebris(scene, ctx, ctz, M);
            else if (contents < 0.6) campfireRing(scene, ctx, ctz, M);
            else if (collapseState === "NEARLY_ERASED") rubblePile(scene, ctx, ctz, 1.5, 3, M);
            
            // Register courtyard footprint
            registerFootprint(ctx, ctz);
        }
    }
}

export function buildWorkshopProperty(scene, cx, cz, rot, collapseState, M) {
    const w = sRand(cx, cz, 5, 7);
    const d = sRand(cx, cz, 6, 8);
    
    // Main building structure
    buildHouseComponent(scene, cx, cz, rot, w, d, collapseState, M);

    // Workshop yard in front/side
    const yx = cx - (d/2 + 2) * Math.sin(rot);
    const yz = cz + (d/2 + 2) * Math.cos(rot);
    
    if (checkLandmarkClearance(yx, yz, false) && !tooCloseToExisting(yx, yz, 3.0)) {
        if (collapseState !== "NEARLY_ERASED") {
            // Workbench / furnace remains
            floorSlabs(scene, yx, yz, 3, 2, rot, M);
            if (collapseState !== "HEAVILY_COLLAPSED") ruinedWall(scene, yx, yz, 2, 1.0, rot, M.stoneDark, M); // Kiln/furnace stub
        }
        // Heavy debris
        rubblePile(scene, yx + 1, yz + 1, 1.5, 8, M);
        rubblePile(scene, yx - 1, yz - 1, 1.0, 5, M);
        
        // Tool/storage debris
        if (collapseState !== "HEAVILY_COLLAPSED") storageDebris(scene, yx, yz, M);
        registerFootprint(yx, yz);
    }
}

export function buildStorageProperty(scene, cx, cz, rot, collapseState, M) {
    // A long shed
    const w = sRand(cx, cz, 4, 5);
    const d = sRand(cx, cz, 8, 12);
    
    buildHouseComponent(scene, cx, cz, rot, w, d, collapseState, M);
    
    // Add extra debris piles inside
    if (collapseState !== "NEARLY_ERASED") {
        for (let i = 0; i < 3; i++) {
            const dx = cx + (Math.random() - 0.5) * w * 0.6;
            const dz = cz + (Math.random() - 0.5) * d * 0.6;
            storageDebris(scene, dx, dz, M);
        }
    } else {
        rubblePile(scene, cx, cz, w*0.4, 15, M);
    }
}

export function buildAgriculturalProperty(scene, cx, cz, rot, collapseState, M) {
    // Small shed + large enclosed plot
    const w = sRand(cx, cz, 3, 4);
    const d = sRand(cx, cz, 3, 4);
    buildHouseComponent(scene, cx, cz, rot, w, d, collapseState, M);

    const px = cx + (w/2 + 4) * Math.cos(rot);
    const pz = cz + (w/2 + 4) * Math.sin(rot);

    if (checkLandmarkClearance(px, pz, false) && !tooCloseToExisting(px, pz, 4.0)) {
        // Field perimeter
        const fw = sRand(cx, cz, 6, 10);
        const fd = sRand(cx, cz, 6, 10);
        
        if (collapseState !== "NEARLY_ERASED") {
            // Broken fences (using low ruined walls for now)
            if (sRand(px, pz, 0, 1) < 0.5) ruinedWall(scene, px, pz - fd/2, fw, 0.4, rot, M.stone, M);
            if (sRand(px, pz, 1, 2) < 0.5) ruinedWall(scene, px - fw/2, pz, fd, 0.4, rot + Math.PI/2, M.stone, M);
        }
        
        // Field debris
        if (sRand(px, pz, 2, 3) < 0.6) {
            rubblePile(scene, px, pz, 2.0, 4, M);
        }
        
        registerFootprint(px, pz);
    }
}

import { THREE } from "../core/Renderer.js";
import { rand } from "./RuinsUtils.js";
import { 
    floorSlabs, ruinedWall, rubblePile, 
    campfireRing, emptyPlot, courseWall
} from "./RuinsUtils.js";
import { registerFootprint } from "./DistrictGenerator.js";

function seededRandom(x, z) {
    const dot = x * 12.9898 + z * 78.233;
    const sin = Math.sin(dot) * 43758.5453123;
    return sin - Math.floor(sin);
}

function sRand(x, z, min, max) {
    return min + seededRandom(x, z) * (max - min);
}

export function buildCommunalWell(scene, cx, cz, M) {
    const rot = sRand(cx, cz, 0, Math.PI);
    
    // Paved circular-ish base
    floorSlabs(scene, cx, cz, 5, 5, rot, M);
    
    // The well structure
    const wellRad = 1.2;
    const segments = 8;
    for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        const wx = cx + Math.cos(a) * wellRad;
        const wz = cz + Math.sin(a) * wellRad;
        if (sRand(cx, cz, i, i+1) < 0.8) { // sometimes broken
            ruinedWall(scene, wx, wz, 1.0, 0.8, a + Math.PI/2, M.stoneDark, M);
        } else {
            rubblePile(scene, wx, wz, 0.6, 2, M);
        }
    }
    
    registerFootprint(cx, cz);
}

export function buildGatheringSquare(scene, cx, cz, collapseState, M) {
    const rot = sRand(cx, cz, 0, Math.PI);
    const w = sRand(cx, cz, 8, 12);
    const d = sRand(cx, cz, 8, 12);
    
    floorSlabs(scene, cx, cz, w, d, rot, M);

    // Low seating walls around the perimeter
    if (collapseState !== "NEARLY_ERASED") {
        if (sRand(cx, cz, 0, 1) < 0.7) courseWall(scene, cx, cz - d/2, w*0.6, 0.4, rot, M);
        if (sRand(cx, cz, 1, 2) < 0.7) courseWall(scene, cx, cz + d/2, w*0.6, 0.4, rot, M);
        if (sRand(cx, cz, 2, 3) < 0.7) courseWall(scene, cx - w/2, cz, d*0.6, 0.4, rot + Math.PI/2, M);
        if (sRand(cx, cz, 3, 4) < 0.7) courseWall(scene, cx + w/2, cz, d*0.6, 0.4, rot + Math.PI/2, M);
        
        // Central feature
        if (sRand(cx, cz, 4, 5) < 0.5) {
            campfireRing(scene, cx, cz, M);
        } else {
            rubblePile(scene, cx, cz, 2, 5, M);
        }
    } else {
        rubblePile(scene, cx, cz, 3, 8, M);
    }

    registerFootprint(cx, cz);
}

import { THREE } from "../core/Renderer.js";
import { jaggedBox } from "./RuinsUtils.js";

// We'll store matrices for the most common procedural elements to drastically reduce draw calls
const VARIATIONS = 3;

const _instanceData = {
    rubble_stone: Array.from({ length: VARIATIONS }, () => []),
    rubble_dark: Array.from({ length: VARIATIONS }, () => []),
    rubble_moss: Array.from({ length: VARIATIONS }, () => []),
    wall_stone: Array.from({ length: VARIATIONS }, () => []),
    wall_dark: Array.from({ length: VARIATIONS }, () => []),
    wall_moss: Array.from({ length: VARIATIONS }, () => []),
    floor_slab: Array.from({ length: VARIATIONS }, () => [])
};

// Base geometries for the instances
let _baseGeos = null;
const _dummy = new THREE.Object3D();

export function addInstancedRubble(x, y, z, rotX, rotY, rotZ, scale, type) {
    _dummy.position.set(x, y, z);
    _dummy.rotation.set(rotX, rotY, rotZ);
    _dummy.scale.setScalar(scale);
    _dummy.updateMatrix();
    if (_instanceData['rubble_' + type]) {
        const v = Math.floor(Math.random() * VARIATIONS);
        _instanceData['rubble_' + type][v].push(_dummy.matrix.clone());
    }
}

export function addInstancedWallBlock(x, y, z, rotX, rotY, rotZ, sx, sy, sz, type) {
    _dummy.position.set(x, y, z);
    _dummy.rotation.set(rotX, rotY, rotZ);
    _dummy.scale.set(sx, sy, sz);
    _dummy.updateMatrix();
    if (_instanceData['wall_' + type]) {
        const v = Math.floor(Math.random() * VARIATIONS);
        _instanceData['wall_' + type][v].push(_dummy.matrix.clone());
    }
}

export function addInstancedFloorSlab(x, y, z, rotY, sx, sy, sz) {
    _dummy.position.set(x, y, z);
    _dummy.rotation.set(0, rotY, 0);
    _dummy.scale.set(sx, sy, sz);
    _dummy.updateMatrix();
    const v = Math.floor(Math.random() * VARIATIONS);
    _instanceData.floor_slab[v].push(_dummy.matrix.clone());
}

export function flushInstances(scene, matSet) {
    if (!_baseGeos) {
        const rubbleOpts = {
            segments: 8,
            intensity: 0.45,
            chipChance: 0.4,
            chipDepth: 0.3,
            cleanBaseFraction: 0.0,
            noiseScale: 2.0
        };
        const wallOpts = {
            segments: 8,
            intensity: 0.12,
            edgeBias: 0.6,
            chipChance: 0.05,
            chipDepth: 0.1,
            cleanBaseFraction: 0.3,
            detailScale: 4.0
        };
        const floorOpts = {
            segments: 6,
            intensity: 0.08,
            edgeBias: 0.7,
            chipChance: 0.05,
            cleanBaseFraction: 0.6,
            noiseScale: 2.0
        };

        _baseGeos = {
            rubble: Array.from({ length: VARIATIONS }, (_, i) => jaggedBox(1, 1, 1, { ...rubbleOpts, seed: i * 10 + 1 })),
            wall: Array.from({ length: VARIATIONS }, (_, i) => jaggedBox(1, 1, 1, { ...wallOpts, seed: i * 10 + 2 })),
            floor: Array.from({ length: VARIATIONS }, (_, i) => jaggedBox(1, 1, 1, { ...floorOpts, seed: i * 10 + 3 }))
        };
    }

    const buildMesh = (key, geos, mat, castShadow, receiveShadow, typeStr) => {
        const matrixArrays = _instanceData[key];
        for (let v = 0; v < VARIATIONS; v++) {
            const matrices = matrixArrays[v];
            if (matrices && matrices.length > 0) {
                const iMesh = new THREE.InstancedMesh(geos[v], mat, matrices.length);
                for (let i = 0; i < matrices.length; i++) {
                    iMesh.setMatrixAt(i, matrices[i]);
                }
                iMesh.instanceMatrix.needsUpdate = true;
                iMesh.castShadow = castShadow;
                iMesh.receiveShadow = receiveShadow;
                iMesh.userData = {
                    type: typeStr,
                    maxCount: matrices.length
                };
                // Clear arrays after flushing
                matrixArrays[v] = [];
                scene.add(iMesh);
            }
        }
    };

    // Rubble doesn't cast or receive shadows to save performance
    buildMesh('rubble_stone', _baseGeos.rubble, matSet.stone, false, false, 'rubble');
    buildMesh('rubble_dark', _baseGeos.rubble, matSet.stoneDark, false, false, 'rubble');
    buildMesh('rubble_moss', _baseGeos.rubble, matSet.moss, false, false, 'rubble');

    // Walls cast and receive shadows
    buildMesh('wall_stone', _baseGeos.wall, matSet.stone, true, true, 'wall');
    buildMesh('wall_dark', _baseGeos.wall, matSet.stoneDark, true, true, 'wall');
    buildMesh('wall_moss', _baseGeos.wall, matSet.moss, true, true, 'wall');

    // Floors only receive shadows
    buildMesh('floor_slab', _baseGeos.floor, matSet.stone, false, true, 'floor');
}

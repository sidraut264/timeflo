import { THREE } from "../core/Renderer.js";

export function buildEnvironment(scene) {
    const fogColor = 0x0b0f1a;
    scene.fog = new THREE.FogExp2(fogColor, 0.022);
    scene.background = new THREE.Color(fogColor);

    scene.add(new THREE.AmbientLight(0x334066, 0.55));
    const moon = new THREE.DirectionalLight(0x9fb3ff, 0.9);
    moon.position.set(-30, 40, -20);
    scene.add(moon);

    const moonMesh = new THREE.Mesh(
        new THREE.SphereGeometry(6, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xdfe6ff })
    );
    moonMesh.position.copy(moon.position).multiplyScalar(3);
    scene.add(moonMesh);

    buildStars(scene);
    buildGround(scene);
}

function buildStars(scene) {
    const count = 800;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = 180 + Math.random() * 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 0.9);
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.cos(phi) + 10;
        pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xaab4ff, size: 0.6 })));
}

function buildGround(scene) {
    const size = 140, seg = 60;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = [];
    const base = new THREE.Color(0x2a3324), variant = new THREE.Color(0x3c4a2e);
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        pos.setY(i, Math.sin(x * 0.15) * Math.cos(z * 0.17) * 0.15 + (Math.random() - 0.5) * 0.1);
        const c = base.clone().lerp(variant, Math.random() * 0.6 + Math.max(0, 1 - (x * x + z * z) / 2500));
        colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));

    const rubbleGeo = new THREE.IcosahedronGeometry(0.3, 0);
    const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x5c5850, flatShading: true, roughness: 1 });
    const rubble = new THREE.InstancedMesh(rubbleGeo, rubbleMat, 90);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 90; i++) {
        const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 55;
        dummy.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const s = 0.4 + Math.random() * 1.1;
        dummy.scale.set(s, s * 0.6, s);
        dummy.updateMatrix();
        rubble.setMatrixAt(i, dummy.matrix);
    }
    scene.add(rubble);

    // Procedural Grass using InstancedMesh
    const grassCount = 10000;
    const grassGeo = new THREE.PlaneGeometry(0.15, 0.6);
    grassGeo.translate(0, 0.3, 0); // pivot at bottom
    
    // Custom shader for waving grass
    const grassMat = new THREE.MeshStandardMaterial({ 
        color: 0x3c4a2e,
        side: THREE.DoubleSide,
        roughness: 0.8
    });
    
    grassMat.onBeforeCompile = (shader) => {
        shader.uniforms.time = { value: 0 };
        shader.vertexShader = `
            uniform float time;
            ${shader.vertexShader}
        `.replace(
            `#include <begin_vertex>`,
            `
            vec3 transformed = vec3( position );
            // Wave based on height and world position
            float wave = sin(time * 2.0 + instanceMatrix[3][0] * 0.5 + instanceMatrix[3][2] * 0.5) * 0.15;
            transformed.x += wave * position.y;
            `
        );
        grassMat.userData.shader = shader;
    };

    const grass = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
    for (let i = 0; i < grassCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 60;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        // Don't place grass perfectly on paths
        if (Math.abs(x) < 2 && z < 10 && z > -15) continue;
        
        dummy.position.set(x, 0, z);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        const s = 0.5 + Math.random() * 0.8;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        grass.setMatrixAt(i, dummy.matrix);
    }
    scene.add(grass);

    // Fireflies
    const fireflyCount = 150;
    const fireflyGeo = new THREE.BufferGeometry();
    const fireflyPos = new Float32Array(fireflyCount * 3);
    const fireflyPhase = new Float32Array(fireflyCount);
    
    for(let i=0; i<fireflyCount; i++) {
        fireflyPos[i*3] = (Math.random() - 0.5) * 80;
        fireflyPos[i*3+1] = 0.5 + Math.random() * 3;
        fireflyPos[i*3+2] = (Math.random() - 0.5) * 80;
        fireflyPhase[i] = Math.random() * Math.PI * 2;
    }
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
    fireflyGeo.setAttribute('phase', new THREE.BufferAttribute(fireflyPhase, 1));
    
    const fireflyMat = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
            attribute float phase;
            varying float vPhase;
            void main() {
                vPhase = phase;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = 4.0 * (10.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float time;
            varying float vPhase;
            void main() {
                float alpha = (sin(time * 1.5 + vPhase) + 1.0) * 0.5;
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                gl_FragColor = vec4(0.8, 1.0, 0.5, alpha * (1.0 - dist * 2.0));
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    
    const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
    scene.add(fireflies);

    // Expose update function for animated environment features
    scene.userData.updateEnvironment = (t) => {
        if (grassMat.userData.shader) {
            grassMat.userData.shader.uniforms.time.value = t;
        }
        fireflies.material.uniforms.time.value = t;
    };
}

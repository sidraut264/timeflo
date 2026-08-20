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
}

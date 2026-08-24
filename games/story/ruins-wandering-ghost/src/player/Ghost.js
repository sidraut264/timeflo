import { THREE } from "../core/Renderer.js";
import { getTerrainHeight } from "../world/Environment.js";

export function createGhost(scene) {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({
        color: 0xcfe0ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65), mat);
    head.position.y = 0.9;
    group.add(head);

    const wisps = [];
    for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const s = 0.5 * (1 - t * 0.75);
        const m = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 10), mat.clone());
        m.material.opacity = 0.45 * (1 - t * 0.8);
        m.position.set(0, 0.7 - t * 1.0, 0);
        group.add(m);
        wisps.push(m);
    }

    const light = new THREE.PointLight(0xaac4ff, 1.4, 8, 2);
    light.position.y = 1.0;
    group.add(light);

    const moteGeo = new THREE.BufferGeometry();
    const moteCount = 50;
    const motePos = new Float32Array(moteCount * 3);
    const moteSeed = [];
    for (let i = 0; i < moteCount; i++) {
        motePos[i * 3] = (Math.random() - 0.5) * 4;
        motePos[i * 3 + 1] = Math.random() * 3;
        motePos[i * 3 + 2] = (Math.random() - 0.5) * 4;
        moteSeed.push(Math.random() * Math.PI * 2);
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
        color: 0xbfd4ff,
        size: 0.05,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    }));
    group.add(motes);

    group.position.set(0, getTerrainHeight(0, 6) + 1.1, 6);
    scene.add(group);

    const velocity = new THREE.Vector3();
    const heading = new THREE.Vector3(0, 0, -1);

    function update(dt, t, moveVec) {
        const speed = 4.2;
        const targetVel = new THREE.Vector3(moveVec.x, 0, moveVec.z);
        if (targetVel.lengthSq() > 0.0001) targetVel.normalize().multiplyScalar(speed);
        velocity.lerp(targetVel, 1 - Math.pow(0.001, dt));
        group.position.x += velocity.x * dt;
        group.position.z += velocity.z * dt;
        const groundY = getTerrainHeight(group.position.x, group.position.z);
        group.position.y = groundY + 1.1 + Math.sin(t * 1.3) * 0.15;

        if (velocity.lengthSq() > 0.05) {
            heading.set(velocity.x, 0, velocity.z).normalize();
            const targetAngle = Math.atan2(heading.x, heading.z);
            const diff = ((targetAngle - group.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
            group.rotation.y += diff * Math.min(1, dt * 6);
        }

        wisps.forEach((w, i) => {
            w.position.x = Math.sin(t * 2 + i) * 0.1;
            w.position.z = Math.cos(t * 1.7 + i) * 0.1;
        });
        light.intensity = 1.1 + Math.sin(t * 3) * 0.3;

        const arr = moteGeo.attributes.position.array;
        for (let i = 0; i < moteCount; i++) arr[i * 3 + 1] = (t * 0.3 + moteSeed[i]) % 3;
        moteGeo.attributes.position.needsUpdate = true;
    }

    return {
        group,
        update,
        get position() { return group.position; }
    };
}

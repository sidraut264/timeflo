let camDist = 12, camYaw = 0.6, camPitch = 0.5;
let dragging = false, lastX = 0, lastY = 0;

export function setupCameraControls(domElement) {
    domElement.addEventListener('pointerdown', e => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });

    window.addEventListener('pointerup', () => dragging = false);

    window.addEventListener('pointermove', e => {
        if (!dragging) return;
        camYaw -= (e.clientX - lastX) * 0.006;
        camPitch = Math.min(1.3, Math.max(0.15, camPitch - (e.clientY - lastY) * 0.006));
        lastX = e.clientX;
        lastY = e.clientY;
    });

    domElement.addEventListener('wheel', e => {
        camDist = Math.min(40, Math.max(5, camDist + e.deltaY * 0.02));
    }, { passive: true });
}

export function updateCamera(camera, targetPos) {
    camera.position.set(
        targetPos.x + camDist * Math.sin(camYaw) * Math.cos(camPitch),
        targetPos.y + camDist * Math.sin(camPitch) + 1.5,
        targetPos.z + camDist * Math.cos(camYaw) * Math.cos(camPitch)
    );
    camera.lookAt(targetPos.x, targetPos.y + 0.8, targetPos.z);
}

export function getCamYaw() {
    return camYaw;
}

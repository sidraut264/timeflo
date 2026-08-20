import Game from "../core/Game.js";

let joyVec = { x: 0, y: 0 };

export function setupInput() {
    window.addEventListener('keydown', e => Game.keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', e => Game.keys[e.key.toLowerCase()] = false);

    const joystickEl = document.getElementById('joystick');
    const knobEl = document.getElementById('joystickKnob');

    if ('ontouchstart' in window) {
        if (joystickEl) joystickEl.style.display = 'block';
        
        const btnInteract = document.getElementById('btnInteract');
        const btnMemorySense = document.getElementById('btnMemorySense');
        if (btnInteract) {
            btnInteract.style.display = 'flex';
            btnInteract.style.opacity = '0.5'; // dimmed until interaction is available
        }
        if (btnMemorySense) {
            btnMemorySense.style.display = 'flex';
            btnMemorySense.addEventListener('pointerdown', () => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' }));
            });
        }

        let active = false, originX = 0, originY = 0;

        if (joystickEl) {
            joystickEl.addEventListener('pointerdown', e => {
                active = true;
                const r = joystickEl.getBoundingClientRect();
                originX = r.left + r.width / 2;
                originY = r.top + r.height / 2;
            });
        }

        window.addEventListener('pointermove', e => {
            if (!active) return;
            let dx = e.clientX - originX, dy = e.clientY - originY;
            const max = 40, len = Math.hypot(dx, dy);
            if (len > max) { dx = dx / len * max; dy = dy / len * max; }
            if (knobEl) {
                knobEl.style.left = (28 + dx) + 'px';
                knobEl.style.top = (28 + dy) + 'px';
            }
            joyVec = { x: dx / max, y: dy / max };
        });

        window.addEventListener('pointerup', () => {
            active = false;
            joyVec = { x: 0, y: 0 };
            if (knobEl) {
                knobEl.style.left = '28px';
                knobEl.style.top = '28px';
            }
        });
    }
}

export function getRawInput() {
    let ix = (Game.keys['d'] || Game.keys['arrowright'] ? 1 : 0) - (Game.keys['a'] || Game.keys['arrowleft'] ? 1 : 0);
    let iz = (Game.keys['s'] || Game.keys['arrowdown'] ? 1 : 0) - (Game.keys['w'] || Game.keys['arrowup'] ? 1 : 0);
    ix += joyVec.x;
    iz += joyVec.y;
    return { ix, iz };
}

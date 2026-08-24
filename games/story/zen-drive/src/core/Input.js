class InputManager {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      drift: false,
      shift: false,
      switchMode: false,
      switchAvatar: false
    };

    // Keyboard Listeners
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Initialize Touch Joystick & Buttons
    this.initTouchControls();
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW': this.keys.up = true; break;
      case 'ArrowDown':
      case 'KeyS': this.keys.down = true; break;
      case 'ArrowLeft':
      case 'KeyA': this.keys.left = true; break;
      case 'ArrowRight':
      case 'KeyD': this.keys.right = true; break;
      case 'Space': this.keys.drift = true; break;
      case 'ShiftLeft':
      case 'ShiftRight': this.keys.shift = true; break;
      case 'KeyV': this.keys.switchMode = true; break;
      case 'KeyX': this.keys.switchAvatar = true; break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW': this.keys.up = false; break;
      case 'ArrowDown':
      case 'KeyS': this.keys.down = false; break;
      case 'ArrowLeft':
      case 'KeyA': this.keys.left = false; break;
      case 'ArrowRight':
      case 'KeyD': this.keys.right = false; break;
      case 'Space': this.keys.drift = false; break;
      case 'ShiftLeft':
      case 'ShiftRight': this.keys.shift = false; break;
      case 'KeyV': this.keys.switchMode = false; break;
      case 'KeyX': this.keys.switchAvatar = false; break;
    }
  }

  initTouchControls() {
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    const actionBtn = document.getElementById('btn-touch-action');

    if (!base || !knob) return;

    let activeTouchId = null;
    let baseRect = null;

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      activeTouchId = touch.identifier;
      baseRect = base.getBoundingClientRect();
      this.updateJoystick(touch.clientX, touch.clientY, baseRect, knob);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId && baseRect) {
          this.updateJoystick(touch.clientX, touch.clientY, baseRect, knob);
        }
      }
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          activeTouchId = null;
          knob.style.transform = 'translate(-50%, -50%)';
          this.keys.up = false;
          this.keys.down = false;
          this.keys.left = false;
          this.keys.right = false;
        }
      }
    };

    base.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Touch Action Button (Drift / Sprint)
    if (actionBtn) {
      const setAction = (active) => {
        this.keys.drift = active;
        this.keys.shift = active;
      };

      actionBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setAction(true); actionBtn.classList.add('active'); }, { passive: false });
      actionBtn.addEventListener('touchend', (e) => { e.preventDefault(); setAction(false); actionBtn.classList.remove('active'); }, { passive: false });
      actionBtn.addEventListener('mousedown', (e) => { setAction(true); actionBtn.classList.add('active'); });
      actionBtn.addEventListener('mouseup', (e) => { setAction(false); actionBtn.classList.remove('active'); });
    }
  }

  updateJoystick(clientX, clientY, rect, knob) {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    const radius = rect.width / 2;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, radius);

    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

    const deadZone = radius * 0.25;
    this.keys.right = dx > deadZone;
    this.keys.left = dx < -deadZone;
    this.keys.down = dy > deadZone;
    this.keys.up = dy < -deadZone;
  }
}

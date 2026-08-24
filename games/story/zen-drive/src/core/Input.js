class InputManager {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      drift: false
    };

    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
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
    }
  }
}

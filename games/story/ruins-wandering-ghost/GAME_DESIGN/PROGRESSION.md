# Player Progression & Abilities

> **Game**: *Ruins & the Wandering Ghost*  
> **Module**: `src/player/Ghost.js` & `src/core/Game.js`  

---

## Player Character: Wandering Ghost

### Ghost Movement Capabilities
- **Controls**: WASD / Arrow Keys / Touch Analog Joystick
- **Base Speed**: `6.0` m/s
- **Rotation**: Dynamic smooth yaw facing movement vector relative to camera angle.
- **Floating Physics**: Sinusoidal hover displacement `y = sin(t * 2.0) * 0.15 + 1.2`.

---

## Ability Unlocks & World Gating

| Ability | Unlocked In | Function |
| :--- | :--- | :--- |
| **Float & Walk** | Prologue | Navigate the 3D world with camera orbit control |
| **Inspect & Interact** | `QST_001_ARCHWAY` | Trigger interactive nodes and read inscriptions |
| **Memory Sense (Q)** | `QST_005_STONE_GARDEN` | Reveal hidden memory echoes and spectral objects |
| **Spectral Passage** | Chapter 2 *(Future)* | Pass through ancient locked iron gates |

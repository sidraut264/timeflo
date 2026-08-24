# World Regions Documentation

> **Game**: *Ruins & the Wandering Ghost*  
> **Module**: `src/world/locations/regions.js`  

---

## Region Catalog

### `REG_001_FORGOTTEN_SETTLEMENT`
- **Name**: The Sunken Settlement
- **Chapter**: 1
- **Description**: An ancient, abandoned village swallowed by moss, creeping ivy, and time.
- **Boundaries**: `X: [-35.0, 35.0]`, `Z: [-35.0, 35.0]`

#### Environmental & Atmospheric Profile
- **Fog Density**: `0.025` (Exponential fog)
- **Fog Color**: `#1a2238` (Deep nocturnal slate blue)
- **Lighting Preset**: `COLD_BLUE`
  - Directional Light: `#5577aa` (Intensity `0.3`)
  - Hemisphere Light: `#6b7fa0` / `#2a2f1a` (Intensity `0.6`)
- **Ambient Audio Profile**: `WIND_WHISPER` (Subtle low-frequency wind and rustling leaves)
- **Particle System**: Ground fireflies (`#8ea0e0`, `count: 60`, drifting upwards)
- **Vegetation**: Dark mossy grass blades, dead branching trees, scattered memory lilies

---

## Future Region Stubs

### `REG_002_SUNKEN_SANCTUARY` *(Chapter 2)*
- **Name**: The Sunken Sanctuary
- **Description**: Submerged stone halls and flooded colonnades beneath the ancient lake.
- **Lighting Preset**: `DEEP_TEAL`

### `REG_003_CELESTIAL_SPIRE` *(Chapter 3)*
- **Name**: The Celestial Spire
- **Description**: High altitude mountain ridge overlooking the forgotten valley under glowing aurora stars.
- **Lighting Preset**: `AURORA_GOLD`

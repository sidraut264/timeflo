# LLM & Developer Implementation Guide

> **Game**: *Ruins & the Wandering Ghost*  
> **Master Reference**: [`MASTER_WORLD_MAP.md`](file:///home/qtech/Downloads/timeflo/games/story/ruins-wandering-ghost/GAME_DESIGN/MASTER_WORLD_MAP.md)  

---

## 1. Core Architectural Principles

When extending or modifying this game, AI agents and developers **MUST** follow these strict rules:

### A. ID Naming Conventions
All entities **MUST** use explicit, deterministic canonical IDs:
- **Regions**: `REG_001_REGION_NAME`
- **Locations**: `LOC_001_LOCATION_NAME`
- **Memories**: `MEM_001_MEMORY_NAME`
- **Characters/NPCs**: `CHAR_001_CHARACTER_NAME`, `NPC_001_NPC_NAME`
- **Quests**: `QST_001_QUEST_NAME`
- **Events**: `EVT_001_EVENT_NAME`

### B. Modular File Structure
Do NOT create monolithic files. Respect the clean module architecture:

```text
src/
├── world/
│   └── locations/
│       ├── locations.js     (Master Location Entity Registry)
│       ├── regions.js       (Region Definitions & Atmosphere)
│       └── connections.js   (Spatial & Path Graph Connections)
├── structures/
│   ├── RuinsUtils.js        (Procedural Geometry Primitives)
│   ├── Archway.js           (Individual Location Builder)
│   ├── EmptyHouse.js        (Individual Location Builder)
│   └── ...                  (One JS file per location builder)
└── story/
    ├── chapters/            (Declarative chapter quest objects)
    ├── memories/            (Declarative memory lore registries)
    ├── characters/          (Declarative NPC & character profiles)
    ├── events/              (Data-driven event handlers)
    └── StoryRunner.js       (Generic executor engine)
```

---

## 2. Step-by-Step Guide: Adding a New Location

To add a new location (e.g. `LOC_011_SUNKEN_GATE`):

1. **Add Master Entity to [`src/world/locations/locations.js`](file:///home/qtech/Downloads/timeflo/games/story/ruins-wandering-ghost/src/world/locations/locations.js)**:
   ```javascript
   LOC_011_SUNKEN_GATE: {
       id: "LOC_011_SUNKEN_GATE",
       name: "The Sunken Gate",
       region: "REG_001_FORGOTTEN_SETTLEMENT",
       position: new THREE.Vector3(15, 0, 45),
       connections: ["LOC_010_GRAVE"],
       chapter: 1,
       memories: ["MEM_011_GATE"],
       interactions: ["INT_011_GATE"],
       secrets: [],
       atmosphere: { fog: "heavy", lighting: "cold_blue", ambient: "wind_whisper" }
   }
   ```

2. **Add Connections to [`src/world/locations/connections.js`](file:///home/qtech/Downloads/timeflo/games/story/ruins-wandering-ghost/src/world/locations/connections.js)**:
   ```javascript
   { from: "LOC_010_GRAVE", to: "LOC_011_SUNKEN_GATE", type: "PRIMARY_PATH" }
   ```

3. **Create Location Builder in `src/structures/SunkenGate.js`**:
   ```javascript
   import { LOCATIONS } from "./Locations.js";
   import { courseWall } from "./RuinsUtils.js";

   export function buildSunkenGate(Game) {
       Game.registerStructure((scene, M) => {
           courseWall(scene, LOCATIONS.LOC_011_SUNKEN_GATE.x, LOCATIONS.LOC_011_SUNKEN_GATE.z, 6, 3, 0, M);
       });
   }
   ```

4. **Register in [`src/structures/Ruins.js`](file:///home/qtech/Downloads/timeflo/games/story/ruins-wandering-ghost/src/structures/Ruins.js)**:
   Import `buildSunkenGate` and invoke inside `registerRuinsStructures(Game)`.

5. **Update Game Design Docs in [`GAME_DESIGN/`](file:///home/qtech/Downloads/timeflo/games/story/ruins-wandering-ghost/GAME_DESIGN/)**:
   Update `MASTER_WORLD_MAP.md`, `LOCATIONS.md`, and `QUESTS.md`.

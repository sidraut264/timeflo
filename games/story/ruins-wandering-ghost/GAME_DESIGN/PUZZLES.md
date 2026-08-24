# Puzzles & Mechanics Design

> **Game**: *Ruins & the Wandering Ghost*  
> **Module**: `src/systems/MemorySense.js` & `src/systems/Interaction.js`  

---

## Core Mechanics

### 1. Spatial Proximity Interaction
- **Key**: `[E]` / On-Screen Tap Button
- **Radius**: `3.5` meters
- **Behavior**: Detects closest interactive target when player is within radius. Prompts UI button `[E]` and fires interaction callback when triggered.

### 2. Memory Sense (Spectral Realm View)
- **Key**: `[Q]` / On-Screen Tap Button
- **Behavior**: Toggles the ghost's spectral vision.
  - Reveals hidden memory objects, spectral echoes, and hidden inscriptions.
  - Alters world post-processing / particle intensity.
  - Certain interactions (e.g. `QST_006_STATUE`, `QST_008_BELL`) strictly require `memorySenseActive === true` to trigger.

---

## Secret Discoveries & Puzzles

### `SEC_001_WALL_NICHE`
- **Location**: `LOC_003_EMPTY_HOUSE`
- **Trigger**: Inspecting the hidden niche behind the stone fireplace while Memory Sense is active.

### `SEC_002_CARVED_SLATE`
- **Location**: `LOC_005_STONE_GARDEN`
- **Trigger**: Following the lily breadcrumbs to the hidden bench corner.

### `SEC_003_FOUNDATION_VAULT`
- **Location**: `LOC_007_BROKEN_TOWER`
- **Trigger**: Circling the collapsed tower base from the south.

### `SEC_004_INSCRIPTION`
- **Location**: `LOC_010_GRAVE`
- **Trigger**: Reading the back of the solitary gravestone.

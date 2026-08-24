# Quests Flow & Objectives

> **Game**: *Ruins & the Wandering Ghost*  
> **Module**: `src/story/chapters/Chapter1.js` & `src/story/StoryRunner.js`  

---

## Chapter 1 Quest Progression

### `QST_001_ARCHWAY`
- **Location**: `LOC_001_ARCHWAY`
- **Objective**: Inspect the Archway to awaken your memory.
- **Prompt**: `[E] Inspect Archway`
- **Memory Sense Required**: `false`
- **Completion Event**: `EVT_001_ARCHWAY` *(Spawns glowing magenta point light)*

---

### `QST_002_PATH`
- **Location**: `LOC_002_FORGOTTEN_PATH`
- **Objective**: Dig through the leaves along the forgotten path.
- **Prompt**: `[E] Dig in the dirt`
- **Completion Event**: `EVT_002_PATH` *(Spawns toast: "Holding it produces a strange warmth.")*

---

### `QST_003_HOUSE`
- **Location**: `LOC_003_EMPTY_HOUSE`
- **Objective**: Read the scratched markings on the hearthstone.
- **Prompt**: `[E] Read markings on wall`
- **Completion Event**: `EVT_003_HOUSE`

---

### `QST_004_WELL`
- **Location**: `LOC_004_WELL`
- **Objective**: Look down into the pitch-black water of the ancient well.
- **Prompt**: `[E] Look into the water`
- **Completion Event**: `EVT_004_WELL` *(Spawns blue point light & toast)*

---

### `QST_005_GARDEN`
- **Location**: `LOC_005_STONE_GARDEN`
- **Objective**: Pick up the carved stone flower from the fountain bench.
- **Prompt**: `[E] Pick up stone flower`
- **Completion Event**: `EVT_005_GARDEN`

---

### `QST_006_STATUE`
- **Location**: `LOC_006_STATUE`
- **Objective**: Activate **Memory Sense (Q)** and touch the spectral echo near the statue.
- **Prompt**: `[E] Touch Echo`
- **Memory Sense Required**: `true`
- **Completion Event**: `EVT_006_STATUE`

---

### `QST_007_TOWER`
- **Location**: `LOC_007_BROKEN_TOWER`
- **Objective**: Inspect the carved rubble at the base of the collapsed tower.
- **Prompt**: `[E] Inspect Rubble`
- **Completion Event**: `EVT_007_TOWER`

---

### `QST_008_BELL`
- **Location**: `LOC_008_SILENT_BELL`
- **Objective**: Activate **Memory Sense (Q)** to ring the spectral bell.
- **Prompt**: `[E] Ring the Bell`
- **Memory Sense Required**: `true`
- **Completion Event**: `EVT_008_BELL`

---

### `QST_009_ROAD`
- **Location**: `LOC_009_OLD_ROAD`
- **Objective**: Read the old stone road marker.
- **Prompt**: `[E] Read Marker`
- **Completion Event**: `EVT_009_ROAD`

---

### `QST_010_GRAVE`
- **Location**: `LOC_010_GRAVE`
- **Objective**: Stand at the solitary grave and read the headstone.
- **Prompt**: `[E] Read Gravestone`
- **Completion Event**: `EVT_010_GRAVE` *(Spawns blue light & Chapter 1 completion toast)*

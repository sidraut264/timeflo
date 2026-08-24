# Locations Entity Catalog

> **Game**: *Ruins & the Wandering Ghost*  
> **Module**: `src/world/locations/locations.js`  

---

## Master Location Catalog

### `LOC_001_ARCHWAY`
- **Name**: The Archway
- **Region**: `REG_001_FORGOTTEN_SETTLEMENT`
- **Position**: `(2.0, 0.0, -1.0)`
- **Connections**: `["LOC_002_FORGOTTEN_PATH"]`
- **Memory**: `MEM_001_ARCHWAY`
- **Quest**: `QST_001_ARCHWAY`
- **Event**: `EVT_001_ARCHWAY`
- **Atmosphere**: Heavy fog, cold blue lighting, wind whisper

---

### `LOC_002_FORGOTTEN_PATH`
- **Name**: The Forgotten Path
- **Region**: `REG_001_FORGOTTEN_SETTLEMENT`
- **Position**: `(2.0, 0.0, -15.0)`
- **Connections**: `["LOC_001_ARCHWAY", "LOC_003_EMPTY_HOUSE"]`
- **Memory**: `MEM_002_PATH`
- **Quest**: `QST_002_PATH`
- **Event**: `EVT_002_PATH`
- **Atmosphere**: Medium fog, rustling leaves

---

### `LOC_003_EMPTY_HOUSE`
- **Name**: The Empty House
- **Region**: `REG_001_FORGOTTEN_SETTLEMENT`
- **Position**: `(-10.0, 0.0, -18.0)`
- **Connections**: `["LOC_002_FORGOTTEN_PATH", "LOC_004_WELL"]`
- **Memory**: `MEM_003_HOUSE`
- **Quest**: `QST_003_HOUSE`
- **Event**: `EVT_003_HOUSE`
- **Secrets**: `["SEC_001_WALL_NICHE"]`
- **Atmosphere**: Light fog, warm ember hearth glow

---

### `LOC_004_WELL`
- **Name**: The Old Well
- **Region**: `REG_001_FORGOTTEN_SETTLEMENT`
- **Position**: `(-15.0, 0.0, -30.0)`
- **Connections**: `["LOC_003_EMPTY_HOUSE", "LOC_005_STONE_GARDEN"]`
- **Memory**: `MEM_004_WELL`
- **Quest**: `QST_004_WELL`
- **Event**: `EVT_004_WELL`
- **Atmosphere**: Dense fog, deep teal lighting, dripping water

---

### `LOC_005_STONE_GARDEN`
- **Name**: The Stone Garden
- **Region**: `REG_001_FORGOTTEN_SETTLEMENT`
- **Position**: `(5.0, 0.0, -30.0)`
- **Connections**: `["LOC_004_WELL", "LOC_006_STATUE"]`
- **Memory**: `MEM_005_GARDEN`
- **Quest**: `QST_005_GARDEN`
- **Event**: `EVT_005_GARDEN`
- **Secrets**: `["SEC_002_CARVED_SLATE"]`
- **Atmosphere**: Light fog, pale violet lighting, wind chimes

---

### `LOC_006_STATUE`
- **Name**: The Weathered Statue
- **Region**: `REG_001_FORGOTTEN_SETTLEMENT`
- **Position**: `(15.0, 0.0, -25.0)`
- **Connections**: `["LOC_005_STONE_GARDEN", "LOC_007_BROKEN_TOWER"]`
- **Memory**: `MEM_006_STATUE`
- **Quest**: `QST_006_STATUE` *(Requires Memory Sense Q)*
- **Event**: `EVT_006_STATUE`
- **Atmosphere**: Medium fog, cold blue lighting, resonant hum

---

### `LOC_007_BROKEN_TOWER`
- **Name**: The Broken Tower
- **Region**: `REG_001_FORGOTTEN_SETTLEMENT`
- **Position**: `(20.0, 0.0, -5.0)`
- **Connections**: `["LOC_006_STATUE", "LOC_008_SILENT_BELL"]`
- **Memory**: `MEM_007_TOWER`
- **Quest**: `QST_007_TOWER`
- **Event**: `EVT_007_TOWER`
- **Secrets**: `["SEC_003_FOUNDATION_VAULT"]`
- **Atmosphere**: Heavy fog, storm grey lighting, howling wind

---

### `LOC_008_SILENT_BELL`
- **Name**: The Silent Bell
- **Region**: `REG_001_FORGOTTEN_SETTLEMENT`
- **Position**: `(30.0, 0.0, 5.0)`
- **Connections**: `["LOC_007_BROKEN_TOWER", "LOC_009_OLD_ROAD"]`
- **Memory**: `MEM_008_BELL`
- **Quest**: `QST_008_BELL` *(Requires Memory Sense Q)*
- **Event**: `EVT_008_BELL`
- **Atmosphere**: Medium fog, golden dusk lighting, distant chime

---

### `LOC_009_OLD_ROAD`
- **Name**: The Old Road
- **Region**: `REG_001_FORGOTTEN_SETTLEMENT`
- **Position**: `(20.0, 0.0, 20.0)`
- **Connections**: `["LOC_008_SILENT_BELL", "LOC_010_GRAVE"]`
- **Memory**: `MEM_009_ROAD`
- **Quest**: `QST_009_ROAD`
- **Event**: `EVT_009_ROAD`
- **Atmosphere**: Light fog, pale moon lighting, dust whispers

---

### `LOC_010_GRAVE`
- **Name**: The Forgotten Grave
- **Region**: `REG_001_FORGOTTEN_SETTLEMENT`
- **Position**: `(10.0, 0.0, 30.0)`
- **Connections**: `["LOC_009_OLD_ROAD"]`
- **Memory**: `MEM_010_GRAVE`
- **Quest**: `QST_010_GRAVE`
- **Event**: `EVT_010_GRAVE`
- **Secrets**: `["SEC_004_INSCRIPTION"]`
- **Atmosphere**: Dense fog, midnight indigo lighting, absolute silence

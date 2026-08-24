import { THREE } from "../../core/Renderer.js";
import { getTerrainHeight } from "../Environment.js";

export const LOCATION_DATA = {
    LOC_001_ARCHWAY: {
        id: "LOC_001_ARCHWAY",
        name: "The Archway",
        region: "REG_001_FORGOTTEN_SETTLEMENT",
        district: "ENTRANCE",
        position: new THREE.Vector3(2, getTerrainHeight(2, -1), -1),
        connections: ["LOC_002_FORGOTTEN_PATH"],
        chapter: 1,
        memories: ["MEM_001_ARCHWAY"],
        interactions: ["INT_001_ARCHWAY"],
        secrets: [],
        atmosphere: {
            fog: "heavy",
            lighting: "cold_blue",
            ambient: "wind_whisper"
        }
    },
    LOC_002_FORGOTTEN_PATH: {
        id: "LOC_002_FORGOTTEN_PATH",
        name: "The Forgotten Path",
        region: "REG_001_FORGOTTEN_SETTLEMENT",
        district: "ENTRANCE",
        position: new THREE.Vector3(2, getTerrainHeight(2, -15), -15),
        connections: ["LOC_001_ARCHWAY", "LOC_003_EMPTY_HOUSE"],
        chapter: 1,
        memories: ["MEM_002_PATH"],
        interactions: ["INT_002_PATH"],
        secrets: [],
        atmosphere: {
            fog: "medium",
            lighting: "cold_blue",
            ambient: "rustling_leaves"
        }
    },
    LOC_003_EMPTY_HOUSE: {
        id: "LOC_003_EMPTY_HOUSE",
        name: "The Empty House",
        region: "REG_001_FORGOTTEN_SETTLEMENT",
        district: "RESIDENTIAL",
        position: new THREE.Vector3(-10, getTerrainHeight(-10, -18), -18),
        connections: ["LOC_002_FORGOTTEN_PATH", "LOC_004_WELL"],
        chapter: 1,
        memories: ["MEM_003_HOUSE"],
        interactions: ["INT_003_HOUSE"],
        secrets: ["SEC_001_WALL_NICHE"],
        atmosphere: {
            fog: "light",
            lighting: "warm_ember",
            ambient: "settling_stone"
        }
    },
    LOC_004_WELL: {
        id: "LOC_004_WELL",
        name: "The Old Well",
        region: "REG_001_FORGOTTEN_SETTLEMENT",
        district: "RESIDENTIAL",
        position: new THREE.Vector3(-15, getTerrainHeight(-15, -30), -30),
        connections: ["LOC_003_EMPTY_HOUSE", "LOC_005_STONE_GARDEN"],
        chapter: 1,
        memories: ["MEM_004_WELL"],
        interactions: ["INT_004_WELL"],
        secrets: [],
        atmosphere: {
            fog: "dense",
            lighting: "deep_teal",
            ambient: "water_drips"
        }
    },
    LOC_005_STONE_GARDEN: {
        id: "LOC_005_STONE_GARDEN",
        name: "The Stone Garden",
        region: "REG_001_FORGOTTEN_SETTLEMENT",
        district: "COMMUNAL",
        position: new THREE.Vector3(5, getTerrainHeight(5, -30), -30),
        connections: ["LOC_004_WELL", "LOC_006_STATUE"],
        chapter: 1,
        memories: ["MEM_005_GARDEN"],
        interactions: ["INT_005_GARDEN"],
        secrets: ["SEC_002_CARVED_SLATE"],
        atmosphere: {
            fog: "light",
            lighting: "pale_violet",
            ambient: "chime_wind"
        }
    },
    LOC_006_STATUE: {
        id: "LOC_006_STATUE",
        name: "The Weathered Statue",
        region: "REG_001_FORGOTTEN_SETTLEMENT",
        district: "COMMUNAL",
        position: new THREE.Vector3(15, getTerrainHeight(15, -25), -25),
        connections: ["LOC_005_STONE_GARDEN", "LOC_007_BROKEN_TOWER"],
        chapter: 1,
        memories: ["MEM_006_STATUE"],
        interactions: ["INT_006_STATUE"],
        secrets: [],
        atmosphere: {
            fog: "medium",
            lighting: "cold_blue",
            ambient: "resonant_hum"
        }
    },
    LOC_007_BROKEN_TOWER: {
        id: "LOC_007_BROKEN_TOWER",
        name: "The Broken Tower",
        region: "REG_001_FORGOTTEN_SETTLEMENT",
        district: "DEFENSIVE",
        position: new THREE.Vector3(20, getTerrainHeight(20, -5), -5),
        connections: ["LOC_006_STATUE", "LOC_008_SILENT_BELL"],
        chapter: 1,
        memories: ["MEM_007_TOWER"],
        interactions: ["INT_007_TOWER"],
        secrets: ["SEC_003_FOUNDATION_VAULT"],
        atmosphere: {
            fog: "heavy",
            lighting: "storm_grey",
            ambient: "howling_wind"
        }
    },
    LOC_008_SILENT_BELL: {
        id: "LOC_008_SILENT_BELL",
        name: "The Silent Bell",
        region: "REG_001_FORGOTTEN_SETTLEMENT",
        district: "DEFENSIVE",
        position: new THREE.Vector3(30, getTerrainHeight(30, 5), 5),
        connections: ["LOC_007_BROKEN_TOWER", "LOC_009_OLD_ROAD"],
        chapter: 1,
        memories: ["MEM_008_BELL"],
        interactions: ["INT_008_BELL"],
        secrets: [],
        atmosphere: {
            fog: "medium",
            lighting: "golden_dusk",
            ambient: "distant_chime"
        }
    },
    LOC_009_OLD_ROAD: {
        id: "LOC_009_OLD_ROAD",
        name: "The Old Road",
        region: "REG_001_FORGOTTEN_SETTLEMENT",
        district: "OUTSKIRTS",
        position: new THREE.Vector3(20, getTerrainHeight(20, 20), 20),
        connections: ["LOC_008_SILENT_BELL", "LOC_010_GRAVE"],
        chapter: 1,
        memories: ["MEM_009_ROAD"],
        interactions: ["INT_009_ROAD"],
        secrets: [],
        atmosphere: {
            fog: "light",
            lighting: "pale_moon",
            ambient: "dust_whisper"
        }
    },
    LOC_010_GRAVE: {
        id: "LOC_010_GRAVE",
        name: "The Forgotten Grave",
        region: "REG_001_FORGOTTEN_SETTLEMENT",
        district: "MEMORIAL",
        position: new THREE.Vector3(10, getTerrainHeight(10, 30), 30),
        connections: ["LOC_009_OLD_ROAD"],
        chapter: 1,
        memories: ["MEM_010_GRAVE"],
        interactions: ["INT_010_GRAVE"],
        secrets: ["SEC_004_INSCRIPTION"],
        atmosphere: {
            fog: "dense",
            lighting: "midnight_indigo",
            ambient: "absolute_silence"
        }
    }
};

// Accessor Helper Functions
export function getLocation(id) {
    return LOCATION_DATA[id] || Object.values(LOCATION_DATA).find(loc => loc.id === id) || null;
}

export function getAllLocations() {
    return Object.values(LOCATION_DATA);
}

export function getLocationsByRegion(regionId) {
    return Object.values(LOCATION_DATA).filter(loc => loc.region === regionId);
}

// Backward-compatible position map dictionary
export const LOCATIONS = {
    ARCHWAY: LOCATION_DATA.LOC_001_ARCHWAY.position,
    PATH: LOCATION_DATA.LOC_002_FORGOTTEN_PATH.position,
    HOUSE: LOCATION_DATA.LOC_003_EMPTY_HOUSE.position,
    WELL: LOCATION_DATA.LOC_004_WELL.position,
    GARDEN: LOCATION_DATA.LOC_005_STONE_GARDEN.position,
    STATUE: LOCATION_DATA.LOC_006_STATUE.position,
    TOWER: LOCATION_DATA.LOC_007_BROKEN_TOWER.position,
    BELL: LOCATION_DATA.LOC_008_SILENT_BELL.position,
    ROAD: LOCATION_DATA.LOC_009_OLD_ROAD.position,
    GRAVE: LOCATION_DATA.LOC_010_GRAVE.position,

    // Canonical ID keys
    LOC_001_ARCHWAY: LOCATION_DATA.LOC_001_ARCHWAY.position,
    LOC_002_FORGOTTEN_PATH: LOCATION_DATA.LOC_002_FORGOTTEN_PATH.position,
    LOC_003_EMPTY_HOUSE: LOCATION_DATA.LOC_003_EMPTY_HOUSE.position,
    LOC_004_WELL: LOCATION_DATA.LOC_004_WELL.position,
    LOC_005_STONE_GARDEN: LOCATION_DATA.LOC_005_STONE_GARDEN.position,
    LOC_006_STATUE: LOCATION_DATA.LOC_006_STATUE.position,
    LOC_007_BROKEN_TOWER: LOCATION_DATA.LOC_007_BROKEN_TOWER.position,
    LOC_008_SILENT_BELL: LOCATION_DATA.LOC_008_SILENT_BELL.position,
    LOC_009_OLD_ROAD: LOCATION_DATA.LOC_009_OLD_ROAD.position,
    LOC_010_GRAVE: LOCATION_DATA.LOC_010_GRAVE.position
};

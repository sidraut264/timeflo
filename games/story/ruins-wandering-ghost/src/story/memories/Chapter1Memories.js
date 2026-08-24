export const CHAPTER_1_MEMORIES = {
    MEM_001_ARCHWAY: {
        id: "MEM_001_ARCHWAY",
        title: "The Threshold",
        locationId: "LOC_001_ARCHWAY",
        narrative: "Cold stone under an unfamiliar sky. A broken archway feels like a doorway home."
    },
    MEM_002_PATH: {
        id: "MEM_002_PATH",
        title: "The Rusted Pendant",
        locationId: "LOC_002_FORGOTTEN_PATH",
        narrative: "A small metal pendant buried under dead leaves. Holding it produces a strange warmth."
    },
    MEM_003_HOUSE: {
        id: "MEM_003_HOUSE",
        title: "Scratched Stone",
        locationId: "LOC_003_EMPTY_HOUSE",
        narrative: "A name carved into the hearthstone. The letters feel familiar, but the memory slips away."
    },
    MEM_004_WELL: {
        id: "MEM_004_WELL",
        title: "Pitch-Black Depths",
        locationId: "LOC_004_WELL",
        narrative: "Looking down into the ancient well. The water turns pitch-black and a bucket falls."
    },
    MEM_005_GARDEN: {
        id: "MEM_005_GARDEN",
        title: "Stone Flower",
        locationId: "LOC_005_STONE_GARDEN",
        narrative: "A single stone blossom left on a bench. Someone familiar was here once."
    },
    MEM_006_STATUE: {
        id: "MEM_006_STATUE",
        title: "Whispering Echo",
        locationId: "LOC_006_STATUE",
        narrative: "An echo of a figure gazing east. They whispered the same name scratched in the house."
    },
    MEM_007_TOWER: {
        id: "MEM_007_TOWER",
        title: "The Fall",
        locationId: "LOC_007_BROKEN_TOWER",
        narrative: "Carved warning on fallen rubble: 'Don't let them reach the well.' Your name is among the chaos."
    },
    MEM_008_BELL: {
        id: "MEM_008_BELL",
        title: "Silent Warning",
        locationId: "LOC_008_SILENT_BELL",
        narrative: "A bell that makes no sound in reality. When activated in memory, it tolls on its own."
    },
    MEM_009_ROAD: {
        id: "MEM_009_ROAD",
        title: "The Departure",
        locationId: "LOC_009_OLD_ROAD",
        narrative: "A road marker reading: 'Those who leave may return.' Something pulls you toward the grave."
    },
    MEM_010_GRAVE: {
        id: "MEM_010_GRAVE",
        title: "The Solitary Grave",
        locationId: "LOC_010_GRAVE",
        narrative: "A lone gravestone under overgrown grass. You returned to discover why you left."
    }
};

export function getMemory(id) {
    return CHAPTER_1_MEMORIES[id] || Object.values(CHAPTER_1_MEMORIES).find(m => m.id === id) || null;
}

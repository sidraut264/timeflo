export const CHAPTER_1_DATA = {
    id: "CHAPTER_1",
    title: "Awaken",
    description: "Cold stone. A sky full of unfamiliar stars.",
    quests: [
        {
            index: 0,
            id: "QST_001_ARCHWAY",
            title: "Awaken",
            locationId: "LOC_001_ARCHWAY",
            memoryId: "MEM_001_ARCHWAY",
            text: "Cold stone. A sky full of unfamiliar stars. Something ahead — a broken archway — feels like it should mean something to you.",
            prompt: "[E] Inspect Archway",
            completeMsg: "A memory stirs...",
            eventId: "EVT_001_ARCHWAY",
            memorySenseOnly: false
        },
        {
            index: 1,
            id: "QST_002_PATH",
            title: "The Forgotten Path",
            locationId: "LOC_002_FORGOTTEN_PATH",
            memoryId: "MEM_002_PATH",
            text: "A faint memory of a voice calls from the north, where water used to flow. Dead trees mark an old path.",
            prompt: "[E] Dig in the dirt",
            completeMsg: "You found a rusted pendant.",
            eventId: "EVT_002_PATH",
            memorySenseOnly: false
        },
        {
            index: 2,
            id: "QST_003_HOUSE",
            title: "The Empty House",
            locationId: "LOC_003_EMPTY_HOUSE",
            memoryId: "MEM_003_HOUSE",
            text: "Nearby stands the remains of a small stone house. Only the walls and fireplace remain.",
            prompt: "[E] Read markings on wall",
            completeMsg: "A name scratched into the stone.",
            eventId: "EVT_003_HOUSE",
            memorySenseOnly: false
        },
        {
            index: 3,
            id: "QST_004_WELL",
            title: "The Well",
            locationId: "LOC_004_WELL",
            memoryId: "MEM_004_WELL",
            text: "The voice leads you to an ancient well. The water inside is pitch-black and impossibly deep.",
            prompt: "[E] Look into the water",
            completeMsg: "The water turns black...",
            eventId: "EVT_004_WELL",
            memorySenseOnly: false
        },
        {
            index: 4,
            id: "QST_005_GARDEN",
            title: "The Stone Garden",
            locationId: "LOC_005_STONE_GARDEN",
            memoryId: "MEM_005_GARDEN",
            text: "East of the well, broken stone benches surround the remains of what was once a fountain.",
            prompt: "[E] Pick up stone flower",
            completeMsg: "A single stone flower remains.",
            eventId: "EVT_005_GARDEN",
            memorySenseOnly: false
        },
        {
            index: 5,
            id: "QST_006_STATUE",
            title: "The Statue",
            locationId: "LOC_006_STATUE",
            memoryId: "MEM_006_STATUE",
            text: "A face carved in stone, arm raised toward the east. You must use your Memory Sense (Q) to see who was here.",
            prompt: "[E] Touch Echo",
            completeMsg: "The statue's gaze softens.",
            eventId: "EVT_006_STATUE",
            memorySenseOnly: true
        },
        {
            index: 6,
            id: "QST_007_TOWER",
            title: "The Broken Tower",
            locationId: "LOC_007_BROKEN_TOWER",
            memoryId: "MEM_007_TOWER",
            text: "South, a large tower has collapsed. Strange markings are carved into the rubble.",
            prompt: "[E] Inspect Rubble",
            completeMsg: "\"Don't let them reach the well.\"",
            eventId: "EVT_007_TOWER",
            memorySenseOnly: false
        },
        {
            index: 7,
            id: "QST_008_BELL",
            title: "The Silent Bell",
            locationId: "LOC_008_SILENT_BELL",
            memoryId: "MEM_008_BELL",
            text: "Beyond the tower stands a small bell. It makes no sound in Reality. Use Memory Sense (Q).",
            prompt: "[E] Ring the Bell",
            completeMsg: "A warning. Or a gathering.",
            eventId: "EVT_008_BELL",
            memorySenseOnly: true
        },
        {
            index: 8,
            id: "QST_009_ROAD",
            title: "The Old Road",
            locationId: "LOC_009_OLD_ROAD",
            memoryId: "MEM_009_ROAD",
            text: "A narrow road leads away from the settlement. A broken stone marker sits where the road splits.",
            prompt: "[E] Read Marker",
            completeMsg: "\"Those who leave may return.\"",
            eventId: "EVT_009_ROAD",
            memorySenseOnly: false
        },
        {
            index: 9,
            id: "QST_010_GRAVE",
            title: "The Grave",
            locationId: "LOC_010_GRAVE",
            memoryId: "MEM_010_GRAVE",
            text: "A solitary grave. No flowers. No offerings. Only a weathered gravestone surrounded by overgrown grass.",
            prompt: "[E] Read Gravestone",
            completeMsg: "Chapter One complete · to be continued...",
            eventId: "EVT_010_GRAVE",
            memorySenseOnly: false
        }
    ]
};

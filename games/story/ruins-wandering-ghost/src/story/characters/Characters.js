export const CHARACTERS = {
    CHAR_001_GHOST: {
        id: "CHAR_001_GHOST",
        name: "Wandering Ghost",
        title: "The Lost Wanderer",
        description: "A spirit with forgotten memories searching through ancient ruins."
    },
    NPC_001_CHILD: {
        id: "NPC_001_CHILD",
        name: "Lost Child",
        title: "Ghostly Reflection",
        description: "A small spirit laughing near the stone garden fountain."
    },
    NPC_002_WOMAN: {
        id: "NPC_002_WOMAN",
        name: "Weaving Woman",
        title: "Kinswoman",
        description: "A memory figure sitting outside the empty house."
    },
    NPC_003_WANDERER: {
        id: "NPC_003_WANDERER",
        name: "The Stranger",
        title: "Wayfarer",
        description: "A traveler who left markings on the old road marker."
    }
};

export function getCharacter(id) {
    return CHARACTERS[id] || Object.values(CHARACTERS).find(c => c.id === id) || null;
}

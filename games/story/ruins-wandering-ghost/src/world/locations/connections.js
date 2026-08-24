export const CONNECTIONS = [
    { from: "LOC_001_ARCHWAY", to: "LOC_002_FORGOTTEN_PATH", type: "PRIMARY_PATH" },
    { from: "LOC_002_FORGOTTEN_PATH", to: "LOC_003_EMPTY_HOUSE", type: "PRIMARY_PATH" },
    { from: "LOC_003_EMPTY_HOUSE", to: "LOC_004_WELL", type: "PRIMARY_PATH" },
    { from: "LOC_004_WELL", to: "LOC_005_STONE_GARDEN", type: "PRIMARY_PATH" },
    { from: "LOC_005_STONE_GARDEN", to: "LOC_006_STATUE", type: "PRIMARY_PATH" },
    { from: "LOC_006_STATUE", to: "LOC_007_BROKEN_TOWER", type: "PRIMARY_PATH" },
    { from: "LOC_007_BROKEN_TOWER", to: "LOC_008_SILENT_BELL", type: "PRIMARY_PATH" },
    { from: "LOC_008_SILENT_BELL", to: "LOC_009_OLD_ROAD", type: "PRIMARY_PATH" },
    { from: "LOC_009_OLD_ROAD", to: "LOC_010_GRAVE", type: "PRIMARY_PATH" },
    
    // Desire lines & shortcuts
    { from: "LOC_003_EMPTY_HOUSE", to: "LOC_004_WELL", type: "DESIRE_LINE" },
    { from: "LOC_005_STONE_GARDEN", to: "LOC_006_STATUE", type: "DESIRE_LINE" }
];

export function getConnectionsFor(locationId) {
    return CONNECTIONS.filter(c => c.from === locationId || c.to === locationId);
}

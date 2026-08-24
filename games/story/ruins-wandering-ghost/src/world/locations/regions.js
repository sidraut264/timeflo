export const REGIONS = {
    FORGOTTEN_SETTLEMENT: {
        id: "REG_001_FORGOTTEN_SETTLEMENT",
        name: "The Sunken Settlement",
        description: "An ancient forgotten village swallowed by quiet moss and time.",
        chapter: 1,
        defaultAtmosphere: {
            fog: "heavy",
            lighting: "cold_blue",
            ambient: "wind_whisper"
        }
    }
};

export function getRegion(id) {
    return Object.values(REGIONS).find(r => r.id === id) || null;
}

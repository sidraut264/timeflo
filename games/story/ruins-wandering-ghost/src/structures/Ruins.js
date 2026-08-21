/**
 * Ruins.js - Aggregator & public entrypoint for world structure generation.
 * Re-exports locations, procedural builders, and the structure registration pipeline.
 */

export { LOCATIONS } from "./Locations.js";
export {
    rand, pick, jaggedBox, rubblePile, brokenColumn, ruinedWall,
    archway, courseWall, foundationFootprint, floorSlabs, ivyVine,
    windingPath, lowWall, emptyPlot, campfireRing, storageDebris,
    cartWreck, createTree
} from "./RuinsUtils.js";
export { registerRuinsStructures } from "./Beats.js";
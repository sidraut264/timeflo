/**
 * Ruins.js - Aggregator & public entrypoint for world structure generation.
 * Re-exports locations, procedural builders, and orchestrates structure registration across individual location modules.
 */

import { buildArchway } from "./Archway.js";
import { buildForgottenPath } from "./ForgottenPath.js";
import { buildEmptyHouse } from "./EmptyHouse.js";
import { buildWell } from "./Well.js";
import { buildStoneGarden } from "./StoneGarden.js";
import { buildStatue } from "./Statue.js";
import { buildBrokenTower } from "./BrokenTower.js";
import { buildSilentBell } from "./SilentBell.js";
import { buildOldRoad } from "./OldRoad.js";
import { buildGrave } from "./Grave.js";
import { buildScatterAndPaths } from "./Scatter.js";
import { buildMicroEnvironment } from "./MicroEnvironment.js";
import { buildSettlementExpansion } from "./SettlementExpansion.js";

export { LOCATIONS } from "./Locations.js";
export {
    rand, pick, jaggedBox, rubblePile, brokenColumn, ruinedWall,
    archway, courseWall, foundationFootprint, floorSlabs, ivyVine,
    windingPath, lowWall, emptyPlot, campfireRing, storageDebris,
    cartWreck, createTree
} from "./RuinsUtils.js";

export function registerRuinsStructures(Game) {
    buildScatterAndPaths(Game);
    buildSettlementExpansion(Game);
    buildArchway(Game);
    buildForgottenPath(Game);
    buildEmptyHouse(Game);
    buildWell(Game);
    buildStoneGarden(Game);
    buildStatue(Game);
    buildBrokenTower(Game);
    buildSilentBell(Game);
    buildOldRoad(Game);
    buildGrave(Game);
    buildMicroEnvironment(Game);

    Game.registerStructure((scene, M) => {
        import("./InstancedMeshManager.js").then(({ flushInstances }) => {
            flushInstances(scene, M);
        });
    });
}
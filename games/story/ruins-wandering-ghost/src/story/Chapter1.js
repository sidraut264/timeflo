/**
 * Chapter1.js - Public entrypoint for Chapter 1.
 * Delegates declarative quest registration to StoryRunner.
 */

import { CHAPTER_1_DATA } from "./chapters/Chapter1.js";
import { loadChapter } from "./StoryRunner.js";

export { CHAPTER_1_DATA };

export function registerChapter1Quests(Game) {
    loadChapter(Game, CHAPTER_1_DATA);
}

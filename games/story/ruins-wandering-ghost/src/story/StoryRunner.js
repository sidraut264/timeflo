import { getLocation } from "../world/locations/locations.js";
import { advanceQuest } from "../ui/QuestUI.js";
import { triggerStoryEvent } from "./events/StoryEvents.js";

export function loadChapter(Game, chapterData) {
    chapterData.quests.forEach((q) => {
        const locationObj = getLocation(q.locationId);
        const targetPos = locationObj ? locationObj.position : q.target;

        // Register Quest Data
        Game.registerQuest({
            title: q.title,
            text: q.text,
            target: targetPos,
            completeMsg: q.completeMsg,
            onComplete: () => {
                if (q.eventId) {
                    triggerStoryEvent(q.eventId, targetPos);
                }
            }
        });

        // Register Interaction Handler
        Game.registerInteraction({
            target: targetPos,
            radius: 3.5,
            prompt: q.prompt,
            condition: () => {
                if (Game.questIndex !== q.index) return false;
                if (q.memorySenseOnly && !Game.state.memorySenseActive) return false;
                return true;
            },
            onInteract: () => advanceQuest(Game)
        });
    });
}

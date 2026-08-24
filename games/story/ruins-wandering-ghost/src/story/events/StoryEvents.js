import { THREE, scene } from "../../core/Renderer.js";
import { showToast } from "../../ui/QuestUI.js";

export const STORY_EVENTS = {
    EVT_001_ARCHWAY: (pos) => {
        const glow = new THREE.PointLight(0xffaadd, 1.0, 5, 2);
        glow.position.copy(pos).add(new THREE.Vector3(0, 2, 0));
        scene.add(glow);
    },
    EVT_002_PATH: () => {
        showToast("Holding it produces a strange warmth.");
    },
    EVT_003_HOUSE: () => {
        showToast("The name feels familiar, but you cannot remember why.");
    },
    EVT_004_WELL: (pos) => {
        const glow = new THREE.PointLight(0x6fa8ff, 1.2, 6, 2);
        glow.position.copy(pos).add(new THREE.Vector3(0, 2, 0));
        scene.add(glow);
        showToast("The memory cuts to darkness. A bucket falls.");
    },
    EVT_005_GARDEN: () => {
        showToast("Someone familiar was here once.");
    },
    EVT_006_STATUE: () => {
        showToast("They whispered the same name scratched in the house.");
    },
    EVT_007_TOWER: () => {
        showToast("Your name is carved among the chaos.");
    },
    EVT_008_BELL: () => {
        showToast("The bell swings once more on its own.");
    },
    EVT_009_ROAD: () => {
        showToast("Something pulls you toward the grave.");
    },
    EVT_010_GRAVE: (pos) => {
        const glow = new THREE.PointLight(0xaac4ff, 1.6, 7, 2);
        glow.position.copy(pos).add(new THREE.Vector3(0, 1.5, 0));
        scene.add(glow);
        setTimeout(() => {
            showToast("It may be about discovering why you returned.");
        }, 3000);
    }
};

export function triggerStoryEvent(eventId, param) {
    if (STORY_EVENTS[eventId]) {
        STORY_EVENTS[eventId](param);
    }
}

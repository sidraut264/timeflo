import { THREE, scene } from "../core/Renderer.js";
import { advanceQuest, showToast } from "../ui/QuestUI.js";

export function registerChapter1Quests(Game, LOCATIONS) {

    // Helper to register quest + interaction together
    const addQuest = (index, title, text, target, prompt, completeMsg, onComplete, memorySenseOnly = false) => {
        Game.registerQuest({
            title, text, target, completeMsg, onComplete
        });
        Game.registerInteraction({
            target,
            radius: 3.5,
            prompt,
            condition: () => {
                if (Game.questIndex !== index) return false;
                if (memorySenseOnly && !Game.state.memorySenseActive) return false;
                return true;
            },
            onInteract: () => advanceQuest(Game)
        });
    };

    // 1. The Archway
    addQuest(
        0, 
        'Awaken', 
        'Cold stone. A sky full of unfamiliar stars. Something ahead — a broken archway — feels like it should mean something to you.',
        LOCATIONS.ARCHWAY,
        '[E] Inspect Archway',
        'A memory stirs...',
        () => {
            const glow = new THREE.PointLight(0xffaadd, 1.0, 5, 2);
            glow.position.copy(LOCATIONS.ARCHWAY).add(new THREE.Vector3(0, 2, 0));
            scene.add(glow);
        }
    );

    // 2. The Forgotten Path
    addQuest(
        1,
        'The Forgotten Path',
        'A faint memory of a voice calls from the north, where water used to flow. Dead trees mark an old path.',
        LOCATIONS.PATH,
        '[E] Dig in the dirt',
        'You found a rusted pendant.',
        () => {
            // Remove pendant from memory objects if needed, or just let it stay
            showToast("Holding it produces a strange warmth.");
        }
    );

    // 3. The Empty House
    addQuest(
        2,
        'The Empty House',
        'Nearby stands the remains of a small stone house. Only the walls and fireplace remain.',
        LOCATIONS.HOUSE,
        '[E] Read markings on wall',
        'A name scratched into the stone.',
        () => {
            showToast("The name feels familiar, but you cannot remember why.");
        }
    );

    // 4. The Well
    addQuest(
        3,
        'The Well',
        'The voice leads you to an ancient well. The water inside is pitch-black and impossibly deep.',
        LOCATIONS.WELL,
        '[E] Look into the water',
        'The water turns black...',
        () => {
            const glow = new THREE.PointLight(0x6fa8ff, 1.2, 6, 2);
            glow.position.copy(LOCATIONS.WELL).add(new THREE.Vector3(0, 2, 0));
            scene.add(glow);
            showToast("The memory cuts to darkness. A bucket falls.");
        }
    );

    // 5. The Stone Garden
    addQuest(
        4,
        'The Stone Garden',
        'East of the well, broken stone benches surround the remains of what was once a fountain.',
        LOCATIONS.GARDEN,
        '[E] Pick up stone flower',
        'A single stone flower remains.',
        () => {
            showToast("Someone familiar was here once.");
        }
    );

    // 6. The Statue
    addQuest(
        5,
        'The Statue',
        'A face carved in stone, arm raised toward the east. You must use your Memory Sense (Q) to see who was here.',
        LOCATIONS.STATUE,
        '[E] Touch Echo',
        'The statue\'s gaze softens.',
        () => {
            showToast("They whispered the same name scratched in the house.");
        },
        true // Requires Memory Sense active
    );

    // 7. The Broken Tower
    addQuest(
        6,
        'The Broken Tower',
        'South, a large tower has collapsed. Strange markings are carved into the rubble.',
        LOCATIONS.TOWER,
        '[E] Inspect Rubble',
        '"Don\'t let them reach the well."',
        () => {
            showToast("Your name is carved among the chaos.");
        }
    );

    // 8. The Silent Bell
    addQuest(
        7,
        'The Silent Bell',
        'Beyond the tower stands a small bell. It makes no sound in Reality. Use Memory Sense (Q).',
        LOCATIONS.BELL,
        '[E] Ring the Bell',
        'A warning. Or a gathering.',
        () => {
            showToast("The bell swings once more on its own.");
        },
        true // Requires Memory Sense active
    );

    // 9. The Old Road
    addQuest(
        8,
        'The Old Road',
        'A narrow road leads away from the settlement. A broken stone marker sits where the road splits.',
        LOCATIONS.ROAD,
        '[E] Read Marker',
        '"Those who leave may return."',
        () => {
            showToast("Something pulls you toward the grave.");
        }
    );

    // 10. The Grave
    addQuest(
        9,
        'The Grave',
        'A solitary grave. No flowers. No offerings. Only a weathered gravestone surrounded by overgrown grass.',
        LOCATIONS.GRAVE,
        '[E] Read Gravestone',
        'Chapter One complete \u00b7 to be continued...',
        () => {
            const glow = new THREE.PointLight(0xaac4ff, 1.6, 7, 2);
            glow.position.copy(LOCATIONS.GRAVE).add(new THREE.Vector3(0, 1.5, 0));
            scene.add(glow);
            setTimeout(() => {
                showToast("It may be about discovering why you returned.");
            }, 3000);
        }
    );
}

let questTitleEl = null;
let questTextEl = null;
let toastEl = null;
let toastTimer = null;

export function initQuestUI() {
    questTitleEl = document.getElementById('questTitle');
    questTextEl = document.getElementById('questText');
    toastEl = document.getElementById('toast');
}

export function showQuest(q) {
    if (!questTitleEl || !questTextEl) initQuestUI();
    if (questTitleEl) questTitleEl.textContent = q.title;
    if (questTextEl) questTextEl.textContent = q.text;
}

export function showToast(msg) {
    if (!toastEl) initQuestUI();
    if (toastEl) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3800);
    }
}

export function startQuestRunner(Game) {
    if (Game.quests.length) showQuest(Game.quests[0]);
}

export function advanceQuest(Game) {
    const q = Game.quests[Game.questIndex];
    if (!q) return;
    
    if (q.onComplete) q.onComplete();
    Game.questIndex++;
    
    const next = Game.quests[Game.questIndex];
    showToast(q.completeMsg || '\u2726');
    
    if (next) {
        setTimeout(() => showQuest(next), 900);
    } else {
        setTimeout(() => {
            if (questTitleEl) questTitleEl.textContent = "To Be Continued...";
            if (questTextEl) questTextEl.textContent = "You have completed this chapter's current content.";
        }, 900);
    }
}

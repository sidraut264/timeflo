import Game from "../core/Game.js";

let interactPromptEl = null;
let currentInteraction = null;

export function initInteractionUI() {
    interactPromptEl = document.getElementById('interactPrompt');
    
    // Add event listener for E key
    window.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'e' && currentInteraction) {
            triggerInteraction();
        }
    });

    // Add event listener for mobile interact button
    const btnInteract = document.getElementById('btnInteract');
    if (btnInteract) {
        btnInteract.addEventListener('pointerdown', () => {
            if (currentInteraction) triggerInteraction();
        });
    }
}

function triggerInteraction() {
    if (currentInteraction && currentInteraction.onInteract) {
        currentInteraction.onInteract();
    }
}

export function updateInteractions(ghostPosition) {
    if (!interactPromptEl) initInteractionUI();

    let closestInteraction = null;
    let minDistance = Infinity;

    for (const interaction of Game.interactions) {
        if (interaction.condition && !interaction.condition()) continue;

        const d = ghostPosition.distanceTo(interaction.target);
        if (d < (interaction.radius || 3.0)) {
            if (d < minDistance) {
                minDistance = d;
                closestInteraction = interaction;
            }
        }
    }

    if (closestInteraction !== currentInteraction) {
        currentInteraction = closestInteraction;
        if (currentInteraction) {
            interactPromptEl.textContent = currentInteraction.prompt || '[E] Inspect';
            interactPromptEl.classList.add('show');
            const btnInteract = document.getElementById('btnInteract');
            if (btnInteract) {
                btnInteract.style.opacity = '1';
                btnInteract.style.pointerEvents = 'auto';
            }
        } else {
            interactPromptEl.classList.remove('show');
            const btnInteract = document.getElementById('btnInteract');
            if (btnInteract) {
                btnInteract.style.opacity = '0.5';
                btnInteract.style.pointerEvents = 'none';
            }
        }
    }
}

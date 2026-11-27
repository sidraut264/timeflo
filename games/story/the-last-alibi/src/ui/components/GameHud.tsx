import React from 'react';
import { LOCATIONS } from '../../data/locations/locations';
import { soundEngine } from '../../game/audio/SoundEngine';
import { gameStore } from '../../state/gameStore';
import { useGameState } from '../../state/useGameState';

export const GameHud: React.FC = () => {
  const state = useGameState();
  const loc = LOCATIONS[state.currentLocation];
  const hasMurderDiscovered = state.flags.includes('murder_discovered');

  return (
    <>
      {/* Top Vintage Strip */}
      <header className="hud-top">
        <div className="hud-location-box">
          <div className="hud-loc-name">{loc.name}</div>
          <div className="hud-loc-sub">{loc.subtitle}</div>
        </div>

        <div className="hud-exits" aria-label="Room Exits">
          {loc.exits
            .filter((ex) => {
              if (
                (state.currentLocation === 'study' && ex.locationId === 'basement') ||
                (state.currentLocation === 'basement' && ex.locationId === 'study')
              ) {
                return state.flags.includes('secret_passage_found');
              }
              return true;
            })
            .map((ex) => (
              <button
                key={ex.locationId}
                className="hud-exit-btn"
                onClick={() => {
                  soundEngine.playSfx('click');
                  gameStore.moveToLocation(ex.locationId);
                }}
                title={`Go to ${ex.label}`}
              >
                {ex.direction === 'up'
                  ? '▲ '
                  : ex.direction === 'down'
                  ? '▼ '
                  : ex.direction === 'left'
                  ? '◀ '
                  : ex.direction === 'right'
                  ? '▶ '
                  : '• '}
                {ex.label}
              </button>
            ))}
        </div>

        <div className="hud-actions">
          <button
            className="hud-tool-btn"
            onClick={() => {
              soundEngine.playSfx('click');
              gameStore.setModal(state.openModal === 'inventory' ? 'none' : 'inventory');
            }}
            title="Inventory (I)"
          >
            Evidence ({state.inventory.length})
          </button>
          <button
            className="hud-tool-btn"
            onClick={() => {
              soundEngine.playSfx('click');
              gameStore.setModal(state.openModal === 'journal' ? 'none' : 'journal');
            }}
            title="Detective Journal (J)"
          >
            Journal ({state.journal.length})
          </button>
          <button
            className="hud-tool-btn"
            onClick={() => {
              soundEngine.playSfx('click');
              gameStore.setModal(state.openModal === 'evidence_board' ? 'none' : 'evidence_board');
            }}
            title="Evidence Board (E)"
          >
            Board ({state.discoveredLinks.length}/7)
          </button>
          {hasMurderDiscovered && (
            <button
              className="hud-tool-btn accuse-btn"
              onClick={() => {
                soundEngine.playSfx('click');
                gameStore.setModal('deduction');
              }}
              title="Final Deduction & Accusation"
            >
              Accuse
            </button>
          )}
          <button
            className="hud-tool-btn icon-only"
            onClick={() => gameStore.saveGame(false)}
            title="Save Case"
          >
            Save
          </button>
          <button
            className="hud-tool-btn icon-only"
            onClick={() => gameStore.setModal('settings')}
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </header>

      {/* Bottom Hover Label & Pan Hint */}
      <footer className="hud-bottom">
        <div className="hud-ambient-line">{loc.ambientDesc}</div>
        {state.hoverHint ? (
          <div className="hud-hover-pill">
            <span className="hover-verb">{state.hoverHint.actionType}</span>
            <span className="hover-label">{state.hoverHint.label}</span>
          </div>
        ) : (
          <div className="hud-pan-hint">
            Swipe or pan edges (A / D) • Tap glowing pins to inspect
          </div>
        )}
      </footer>

      {/* Toast Notification */}
      {state.toast && (
        <div className="retro-toast" role="status">
          <div className="toast-title">{state.toast.title}</div>
          <div className="toast-body">{state.toast.body}</div>
        </div>
      )}
    </>
  );
};

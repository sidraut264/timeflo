import React from 'react';
import { CLUES } from '../../data/clues/clues';
import { soundEngine } from '../../game/audio/SoundEngine';
import { gameStore } from '../../state/gameStore';
import { useGameState } from '../../state/useGameState';
import { ClueIllustration } from '../components/RetroArt';

export const InventoryModal: React.FC = () => {
  const state = useGameState();
  if (state.openModal !== 'inventory') return null;

  const selectedId =
    state.selectedInventoryClueId && state.inventory.includes(state.selectedInventoryClueId)
      ? state.selectedInventoryClueId
      : state.inventory[0] || null;
  const selectedClue = selectedId ? CLUES[selectedId] : null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Evidence Inventory">
      <div className="retro-panel modal-wide">
        <div className="panel-header">
          <h2>Detective Evidence Satchel ({state.inventory.length} Exhibits)</h2>
          <button className="close-x" onClick={() => gameStore.setModal('none')}>
            ✕
          </button>
        </div>

        <div className="inventory-layout">
          <div className="inventory-grid">
            {state.inventory.map((id) => {
              const item = CLUES[id];
              if (!item) return null;
              const isSelected = id === selectedId;
              return (
                <button
                  key={id}
                  className={`inventory-slot ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    soundEngine.playSfx('click');
                    gameStore.selectInventoryClue(id);
                  }}
                >
                  <ClueIllustration clueId={id} size={64} />
                  <span className="slot-name">{item.name}</span>
                  <span className="slot-cat">{item.category}</span>
                </button>
              );
            })}
          </div>

          <div className="inventory-detail">
            {selectedClue ? (
              <>
                <div className="detail-top">
                  <ClueIllustration clueId={selectedClue.id} size={96} />
                  <div>
                    <div className="detail-category">{selectedClue.category.toUpperCase()}</div>
                    <h3>{selectedClue.name}</h3>
                    <div className="detail-found">Found at: {selectedClue.collectedAtLabel}</div>
                  </div>
                </div>
                <p className="detail-desc">{selectedClue.description}</p>
                <div className="detail-relevance">
                  <strong>Case Significance:</strong> {selectedClue.relevance}
                </div>
                <button
                  className="retro-btn"
                  onClick={() => {
                    soundEngine.playSfx('click');
                    gameStore.setModal('evidence_board');
                  }}
                >
                  Open on Evidence Board
                </button>
              </>
            ) : (
              <p>No items collected yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

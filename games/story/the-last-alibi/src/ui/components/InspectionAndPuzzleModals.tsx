import React, { useState } from 'react';
import { soundEngine } from '../../game/audio/SoundEngine';
import { gameStore } from '../../state/gameStore';
import { useGameState } from '../../state/useGameState';
import { ClueIllustration } from './RetroArt';

export const InspectionModal: React.FC = () => {
  const { activeInspection } = useGameState();
  if (!activeInspection) return null;

  return (
    <div className="modal-backdrop subtle" onClick={() => gameStore.closeInspection()}>
      <div
        className={`retro-panel inspection-card ${
          activeInspection.isDiscoveryCutscene ? 'dramatic-cutscene' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="panel-header">
          <h2>{activeInspection.title}</h2>
          <button
            className="close-x"
            onClick={() => gameStore.closeInspection()}
            aria-label="Close inspection"
          >
            ✕
          </button>
        </div>
        <div className="inspection-body">
          {activeInspection.clueId && (
            <div className="inspection-art">
              <ClueIllustration clueId={activeInspection.clueId} size={96} />
            </div>
          )}
          <p>{activeInspection.body}</p>
        </div>
        <div className="panel-footer">
          <button
            className="retro-btn primary"
            onClick={() => {
              soundEngine.playSfx('click');
              gameStore.closeInspection();
            }}
          >
            Continue Investigation
          </button>
        </div>
      </div>
    </div>
  );
};

export const PuzzleModal: React.FC = () => {
  const state = useGameState();
  const [safeDigits, setSafeDigits] = useState(['00', '00', '00']);
  const [errorMsg, setErrorMsg] = useState('');

  if (!state.activePuzzle) return null;

  const hasPoker = state.inventory.includes('iron_poker');
  const hasApothecaryKey = state.inventory.includes('apothecary_key');
  const hasBlueprint = state.inventory.includes('servant_passage_blueprint');

  const adjustDial = (idx: number, delta: number) => {
    soundEngine.playSfx('click');
    setErrorMsg('');
    setSafeDigits((prev) =>
      prev.map((val, i) => {
        if (i !== idx) return val;
        const next = (Number(val) + delta + 100) % 100;
        return String(next).padStart(2, '0');
      })
    );
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="retro-panel modal-narrow">
        <div className="panel-header">
          <h2>
            {state.activePuzzle === 'force_study_door' && "Edward's Locked Study Door"}
            {state.activePuzzle === 'study_safe' && 'Concealed Brass Dial Safe'}
            {state.activePuzzle === 'medical_bag' && "Dr. Reed's Gladstone Bag"}
            {state.activePuzzle === 'wine_lever' && 'Basement Wine Rack Mechanism'}
          </h2>
          <button className="close-x" onClick={() => gameStore.closePuzzle()}>
            ✕
          </button>
        </div>

        {state.activePuzzle === 'force_study_door' && (
          <div className="puzzle-body">
            <p>
              The heavy oak study door is bolted shut. Thomas Blackwood’s voice trembles beside you:
              <em> “He hasn’t answered since quarter past eleven, Hayes. Help me break it!”</em>
            </p>
            {hasPoker ? (
              <button
                className="retro-btn primary"
                onClick={() => {
                  soundEngine.playSfx('door');
                  soundEngine.playThunder();
                  gameStore.solveForceStudyDoor();
                }}
              >
                Wedge Heavy Iron Poker &amp; Force Door
              </button>
            ) : (
              <div className="puzzle-hint-box">
                The solid oak latch won’t budge by shoulder alone. Search the{' '}
                <strong>Main Hall fireplace</strong> for a heavy iron tool to pry the frame.
              </div>
            )}
          </div>
        )}

        {state.activePuzzle === 'study_safe' && (
          <div className="puzzle-body">
            <p>
              Three brass dial rings guard Edward’s wall safe. Check his{' '}
              <strong>Desk Blotter</strong> inside the Study for the three underlined numbers from
              the 1992 case date.
            </p>
            <div className="safe-dial-row">
              {safeDigits.map((val, idx) => (
                <div key={idx} className="safe-dial">
                  <button className="dial-step" onClick={() => adjustDial(idx, 1)}>
                    ▲
                  </button>
                  <div className="dial-value">{val}</div>
                  <button className="dial-step" onClick={() => adjustDial(idx, -1)}>
                    ▼
                  </button>
                </div>
              ))}
            </div>
            <div className="safe-quick-input">
              <label>
                Or enter 6 digits directly:{' '}
                <input
                  type="text"
                  maxLength={6}
                  placeholder="DDMMYY"
                  value={safeDigits.join('')}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, '').padEnd(6, '0');
                    setSafeDigits([digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)]);
                    setErrorMsg('');
                  }}
                />
              </label>
            </div>
            {errorMsg && <div className="puzzle-error">{errorMsg}</div>}
            <button
              className="retro-btn primary"
              onClick={() => {
                const ok = gameStore.solveStudySafe(safeDigits.join(''));
                if (ok) {
                  soundEngine.playSfx('unlock');
                } else {
                  soundEngine.playSfx('error');
                  setErrorMsg('The brass tumblers jam—check the date underlined on Edward’s desk blotter.');
                }
              }}
            >
              Turn Safe Handle
            </button>
          </div>
        )}

        {state.activePuzzle === 'medical_bag' && (
          <div className="puzzle-body">
            <p>
              Dr. Samuel Reed’s oxblood leather medical bag is clasped shut with a miniature nickel
              lock.
            </p>
            {hasApothecaryKey ? (
              <button
                className="retro-btn primary"
                onClick={() => {
                  soundEngine.playSfx('unlock');
                  gameStore.unlockMedicalBag();
                }}
              >
                Unlock with Miniature Apothecary Key
              </button>
            ) : (
              <div className="puzzle-hint-box">
                You need a miniature key. Inspect the <strong>Nightstand &amp; Travel Clock</strong>{' '}
                here in the Guest Bedroom carefully.
              </div>
            )}
          </div>
        )}

        {state.activePuzzle === 'wine_lever' && (
          <div className="puzzle-body">
            <p>
              A rusted wrought-iron sconce protrudes awkwardly beside an empty 1920 burgundy bin.
              Faint scrape marks arc across the damp flagstones beneath the timber rack.
            </p>
            {hasBlueprint ? (
              <button
                className="retro-btn primary"
                onClick={() => {
                  soundEngine.playSfx('door');
                  gameStore.pullWineRackLever();
                }}
              >
                Pull Hidden Iron Sconce Counterweight
              </button>
            ) : (
              <div className="puzzle-hint-box">
                This rack looks oddly heavy, yet you aren’t sure what sits behind the masonry.
                Check the <strong>Library Map Cabinet</strong> for old manor blueprints first.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

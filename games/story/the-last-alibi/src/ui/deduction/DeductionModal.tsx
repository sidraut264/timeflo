import React, { useState } from 'react';
import { CHARACTER_LIST } from '../../data/characters/characters';
import { CLUES } from '../../data/clues/clues';
import { ALIBI_TRICK_OPTIONS, METHOD_OPTIONS, MOTIVE_OPTIONS } from '../../data/story/mystery';
import { soundEngine } from '../../game/audio/SoundEngine';
import { gameStore } from '../../state/gameStore';
import { useGameState } from '../../state/useGameState';
import { CharacterId } from '../../types/game';
import { CharacterPortrait } from '../components/RetroArt';

export const DeductionModal: React.FC = () => {
  const state = useGameState();
  const [culprit, setCulprit] = useState<CharacterId | ''>('');
  const [motive, setMotive] = useState('');
  const [method, setMethod] = useState('');
  const [alibiTrick, setAlibiTrick] = useState('');
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  if (state.openModal !== 'deduction') return null;

  const toggleEvidence = (id: string) => {
    soundEngine.playSfx('click');
    setEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!culprit || !motive || !method || !alibiTrick || evidenceIds.length < 2) {
      soundEngine.playSfx('error');
      setErrorMsg(
        'Complete all five pillars of your indictment—and select at least 2 proving exhibits.'
      );
      return;
    }
    soundEngine.playSfx('door');
    soundEngine.playThunder();
    gameStore.submitAccusation({
      culprit,
      motive,
      method,
      evidenceIds,
      alibiTrick
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Final Deduction">
      <div className="retro-panel modal-xl">
        <div className="panel-header">
          <h2>Final Reconstruction — Gather the Household in the Main Hall</h2>
          <button className="close-x" onClick={() => gameStore.setModal('none')}>
            ✕
          </button>
        </div>

        <div className="deduction-scroll">
          <p className="deduction-intro">
            State your complete case before the six occupants of Blackwood Manor. Your accusation
            will be judged on the facts, the physical exhibits in your satchel, and how the locked
            room was staged.
          </p>

          <section className="deduction-section">
            <h3>1. Who murdered Edward Blackwood?</h3>
            <div className="culprit-pick-grid">
              {CHARACTER_LIST.map((c) => (
                <button
                  key={c.id}
                  className={`culprit-pick ${culprit === c.id ? 'selected' : ''}`}
                  onClick={() => {
                    soundEngine.playSfx('click');
                    setCulprit(c.id);
                    setErrorMsg('');
                  }}
                >
                  <CharacterPortrait characterId={c.id} className="pick-portrait" />
                  <span>{c.name}</span>
                  <small>{c.role}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="deduction-section">
            <h3>2. What was the true motive?</h3>
            <div className="radio-stack">
              {MOTIVE_OPTIONS.map((opt) => (
                <label key={opt.id} className={`radio-card ${motive === opt.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="motive"
                    checked={motive === opt.id}
                    onChange={() => {
                      soundEngine.playSfx('click');
                      setMotive(opt.id);
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="deduction-section">
            <h3>3. How and when was the murder committed?</h3>
            <div className="radio-stack">
              {METHOD_OPTIONS.map((opt) => (
                <label key={opt.id} className={`radio-card ${method === opt.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="method"
                    checked={method === opt.id}
                    onChange={() => {
                      soundEngine.playSfx('click');
                      setMethod(opt.id);
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="deduction-section">
            <h3>4. How was the culprit’s alibi &amp; locked study fabricated?</h3>
            <div className="radio-stack">
              {ALIBI_TRICK_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`radio-card ${alibiTrick === opt.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="trick"
                    checked={alibiTrick === opt.id}
                    onChange={() => {
                      soundEngine.playSfx('click');
                      setAlibiTrick(opt.id);
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="deduction-section">
            <h3>5. Select the physical exhibits that prove your case:</h3>
            <div className="evidence-check-grid">
              {state.inventory.map((id) => {
                const clue = CLUES[id];
                if (!clue) return null;
                const checked = evidenceIds.includes(id);
                return (
                  <button
                    key={id}
                    className={`evidence-toggle ${checked ? 'selected' : ''}`}
                    onClick={() => toggleEvidence(id)}
                  >
                    <span>{checked ? '☑' : '☐'}</span>
                    <span>{clue.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {errorMsg && <div className="puzzle-error">{errorMsg}</div>}

          <div className="deduction-submit-row">
            <button className="retro-btn" onClick={() => gameStore.setModal('none')}>
              Keep Investigating
            </button>
            <button className="retro-btn primary" onClick={handleSubmit}>
              Deliver Final Accusation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

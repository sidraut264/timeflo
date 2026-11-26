import React, { useState } from 'react';
import { CHARACTER_LIST } from '../../data/characters/characters';
import { gameStore } from '../../state/gameStore';
import { useGameState } from '../../state/useGameState';
import { CharacterPortrait } from '../components/RetroArt';
import { getAssetManifestSync } from '../../game/systems/AssetManifestLoader';

type JournalTab = 'all' | 'clue' | 'suspects' | 'timeline' | 'deduction';

export const JournalModal: React.FC = () => {
  const state = useGameState();
  const [tab, setTab] = useState<JournalTab>('all');
  const [portraitFailed, setPortraitFailed] = useState(false);
  const arthurPortrait = getAssetManifestSync().portraits.arthur;

  if (state.openModal !== 'journal') return null;

  const filtered = state.journal.filter((entry) => {
    if (tab === 'all') return true;
    if (tab === 'deduction') return entry.category === 'deduction' || entry.category === 'question';
    if (tab === 'clue') return entry.category === 'clue' || entry.category === 'conversation';
    return entry.category === tab;
  });

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Detective Journal">
      <div className="retro-panel modal-wide journal-leather">
        <div className="panel-header">
          <div className="journal-owner">
            {arthurPortrait && !portraitFailed && (
              <img src={arthurPortrait} width={48} height={60} decoding="async" alt="Detective Arthur Hayes" onError={() => setPortraitFailed(true)} />
            )}
            <h2>Detective Arthur Hayes — Case Notebook</h2>
          </div>
          <button className="close-x" onClick={() => gameStore.setModal('none')}>
            ✕
          </button>
        </div>

        <div className="journal-tabs">
          <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>
            All Notes ({state.journal.length})
          </button>
          <button className={tab === 'clue' ? 'active' : ''} onClick={() => setTab('clue')}>
            Clues &amp; Interviews
          </button>
          <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>
            Timeline
          </button>
          <button
            className={tab === 'deduction' ? 'active' : ''}
            onClick={() => setTab('deduction')}
          >
            Deductions &amp; Questions
          </button>
          <button
            className={tab === 'suspects' ? 'active' : ''}
            onClick={() => setTab('suspects')}
          >
            Suspect Dossiers (6)
          </button>
        </div>

        {tab === 'suspects' ? (
          <div className="suspects-grid">
            {CHARACTER_LIST.map((c) => {
              const spoken = state.talkedCharacters.includes(c.id);
              return (
                <div key={c.id} className="suspect-dossier-card">
                  <div className="suspect-card-head">
                    <CharacterPortrait characterId={c.id} className="mini-portrait" />
                    <div>
                      <h3>{c.name}</h3>
                      <div className="suspect-role">
                        {c.role} • Age {c.age}
                      </div>
                      <div className="suspect-status">
                        {spoken ? 'Interviewed' : 'Not yet questioned'}
                      </div>
                    </div>
                  </div>
                  <p>
                    <strong>Temperament:</strong> {c.personality}
                  </p>
                  <p>
                    <strong>Claimed Alibi:</strong> {c.claimedAlibi}
                  </p>
                  <p>
                    <strong>Background:</strong> {c.history}
                  </p>
                  <p className="muted-note">
                    <strong>Relations:</strong> {c.relationships}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="journal-entries">
            {filtered.map((entry) => (
              <div key={entry.id} className={`journal-entry cat-${entry.category}`}>
                <div className="entry-meta">
                  <span className="entry-cat">{entry.category.toUpperCase()}</span>
                  <span className="entry-time">{entry.timestamp}</span>
                </div>
                <h3>{entry.title}</h3>
                <p>{entry.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

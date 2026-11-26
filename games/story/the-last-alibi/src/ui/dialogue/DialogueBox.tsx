import React, { useEffect, useState } from 'react';
import { CHARACTERS } from '../../data/characters/characters';
import { CLUES } from '../../data/clues/clues';
import { soundEngine } from '../../game/audio/SoundEngine';
import { gameStore } from '../../state/gameStore';
import { useGameState } from '../../state/useGameState';
import { CharacterPortrait, ClueIllustration } from '../components/RetroArt';

export const DialogueBox: React.FC = () => {
  const state = useGameState();
  const [showPresentTray, setShowPresentTray] = useState(false);
  const [visibleChars, setVisibleChars] = useState(0);

  const dlg = state.activeDialogue;
  const char = dlg ? CHARACTERS[dlg.characterId] : null;
  const node = dlg && char ? char.nodes[dlg.nodeId] : null;
  const fullText = dlg?.customResponseText || node?.text || '';

  useEffect(() => {
    setVisibleChars(0);
    if (!fullText) return;
    const timer = window.setInterval(() => {
      setVisibleChars((c) => {
        if (c >= fullText.length) {
          window.clearInterval(timer);
          return c;
        }
        return c + 4;
      });
    }, 16);
    return () => window.clearInterval(timer);
  }, [fullText]);

  if (!dlg || !char || !node) return null;

  const visibleChoices = node.choices.filter((c) => {
    if (c.requiredClueId && !state.inventory.includes(c.requiredClueId)) return false;
    if (c.requiredFlag && !state.flags.includes(c.requiredFlag)) return false;
    if (c.requiredLinkId && !state.discoveredLinks.includes(c.requiredLinkId)) return false;
    if (c.hideIfFlag && state.flags.includes(c.hideIfFlag)) return false;
    return true;
  });

  const shownText = fullText.slice(0, visibleChars);

  return (
    <div className="dialogue-overlay" role="dialog" aria-modal="true" aria-label={`Dialogue with ${char.name}`}>
      <div className="dialogue-frame">
        <div className="dialogue-portrait-col">
          <CharacterPortrait characterId={char.id} mood={node.portraitMood} />
          <div className="dialogue-role-badge">{char.role}</div>
        </div>

        <div className="dialogue-main-col">
          <div className="dialogue-header-row">
            <div>
              <span className="dialogue-speaker">{node.speaker}</span>
              <span className="dialogue-alibi-tag">Alibi: {char.claimedAlibi}</span>
            </div>
            <div className="dialogue-header-actions">
              <button
                className={`retro-mini-btn ${showPresentTray ? 'active' : ''}`}
                onClick={() => {
                  soundEngine.playSfx('click');
                  setShowPresentTray((v) => !v);
                }}
              >
                {showPresentTray ? 'Hide Evidence' : 'Present Evidence'}
              </button>
              <button
                className="close-x"
                onClick={() => {
                  setShowPresentTray(false);
                  gameStore.closeDialogue();
                }}
                aria-label="End conversation"
              >
                ✕
              </button>
            </div>
          </div>

          <div
            className="dialogue-text-box"
            onClick={() => setVisibleChars(fullText.length)}
            title="Click to reveal full line"
          >
            {shownText}
            {visibleChars < fullText.length && <span className="caret">▌</span>}
          </div>

          {showPresentTray ? (
            <div className="present-tray">
              <div className="present-tray-title">Select an exhibit to confront {char.name}:</div>
              <div className="present-tray-grid">
                {state.inventory.map((id) => {
                  const clue = CLUES[id];
                  if (!clue) return null;
                  return (
                    <button
                      key={id}
                      className="present-chip"
                      onClick={() => {
                        soundEngine.playSfx('pickup');
                        gameStore.presentEvidenceInDialogue(id);
                        setShowPresentTray(false);
                      }}
                    >
                      <ClueIllustration clueId={id} size={30} />
                      <span>{clue.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="dialogue-choices">
              {visibleChoices.map((choice) => (
                <button
                  key={choice.id}
                  className={`dialogue-choice-btn tone-${choice.tone || 'neutral'}`}
                  onClick={() => {
                    soundEngine.playSfx('click');
                    gameStore.chooseDialogueOption(choice.id);
                  }}
                >
                  ▸ {choice.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

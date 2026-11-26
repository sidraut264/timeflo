import React from 'react';
import { soundEngine } from '../../game/audio/SoundEngine';
import { gameStore } from '../../state/gameStore';
import { useGameState } from '../../state/useGameState';

export const EndingScreen: React.FC = () => {
  const { endingResult, discoveredLinks, inventory } = useGameState();
  if (!endingResult) return null;

  return (
    <div className="ending-screen">
      <div className="retro-panel modal-wide ending-panel">
        <div className={`ending-badge outcome-${endingResult.outcome}`}>
          FINAL CASE REPORT • SCORE {endingResult.score}/100
        </div>
        <h1 className="ending-title">{endingResult.title}</h1>
        <p className="ending-epilogue">{endingResult.epilogue}</p>

        <div className="ending-stats">
          <span>Exhibits Collected: {inventory.length}</span>
          <span>Deductions Linked: {discoveredLinks.length} / 7</span>
        </div>

        <div className="ending-breakdown">
          {endingResult.breakdown.map((row) => (
            <div key={row.label} className={`breakdown-row ${row.correct ? 'ok' : 'miss'}`}>
              <div className="breakdown-head">
                <span>{row.correct ? '✓' : '✕'} {row.label}</span>
              </div>
              <p>{row.detail}</p>
            </div>
          ))}
        </div>

        <div className="ending-actions">
          <button
            className="retro-btn"
            onClick={() => {
              soundEngine.playSfx('click');
              gameStore.continueGame();
            }}
          >
            Rewind Before Accusation
          </button>
          <button
            className="retro-btn primary"
            onClick={() => {
              soundEngine.playSfx('door');
              gameStore.startNewGame();
            }}
          >
            Begin New Investigation
          </button>
          <button
            className="retro-btn"
            onClick={() => {
              soundEngine.playSfx('click');
              gameStore.returnToMainMenu();
            }}
          >
            Return to Title
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { soundEngine } from '../../game/audio/SoundEngine';
import { gameStore } from '../../state/gameStore';
import { useGameState } from '../../state/useGameState';

interface ModalCloseProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<ModalCloseProps> = ({ onClose }) => {
  const { audioSettings, screen } = useGameState();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="retro-panel modal-narrow">
        <div className="panel-header">
          <h2>Audio &amp; Display Settings</h2>
          <button className="close-x" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="settings-list">
          <label className="setting-row">
            <span>Mute All Audio</span>
            <input
              type="checkbox"
              checked={audioSettings.muted}
              onChange={(e) => {
                gameStore.updateAudioSettings({ muted: e.target.checked });
                soundEngine.applySettings(gameStore.getState().audioSettings);
              }}
            />
          </label>

          <label className="setting-row">
            <span>Master Volume ({Math.round(audioSettings.masterVolume * 100)}%)</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audioSettings.masterVolume}
              onChange={(e) => {
                gameStore.updateAudioSettings({ masterVolume: Number(e.target.value) });
                soundEngine.applySettings(gameStore.getState().audioSettings);
              }}
            />
          </label>

          <label className="setting-row">
            <span>Atmospheric Score ({Math.round(audioSettings.musicVolume * 100)}%)</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audioSettings.musicVolume}
              onChange={(e) => {
                gameStore.updateAudioSettings({ musicVolume: Number(e.target.value) });
                soundEngine.applySettings(gameStore.getState().audioSettings);
              }}
            />
          </label>

          <label className="setting-row">
            <span>Rain &amp; Sound Effects ({Math.round(audioSettings.sfxVolume * 100)}%)</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audioSettings.sfxVolume}
              onChange={(e) => {
                gameStore.updateAudioSettings({ sfxVolume: Number(e.target.value) });
                soundEngine.applySettings(gameStore.getState().audioSettings);
              }}
            />
          </label>

          <div className="setting-actions">
            <button className="retro-btn" onClick={toggleFullscreen}>
              Toggle Fullscreen
            </button>
            {screen === 'playing' && (
              <button
                className="retro-btn danger"
                onClick={() => {
                  onClose();
                  gameStore.returnToMainMenu();
                }}
              >
                Save &amp; Return to Title
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CreditsModal: React.FC<ModalCloseProps> = ({ onClose }) => (
  <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Credits">
    <div className="retro-panel modal-narrow">
      <div className="panel-header">
        <h2>Credits &amp; Dossier Notes</h2>
        <button className="close-x" onClick={onClose} aria-label="Close credits">
          ✕
        </button>
      </div>
      <div className="credits-body">
        <p>
          <strong>THE LAST ALIBI</strong> is a retro 2.5D parallax murder mystery adventure set in
          November 1997, inspired by late-1990s illustrated PC detective classics.
        </p>
        <p>
          <strong>Controls:</strong> Move your cursor toward the left or right edge (or press{' '}
          <code>A / D</code> or <code>Arrow Left / Right</code>) to pan the 2.5D parallax camera
          across each room. Click highlighted objects, doors, and suspects to investigate.
        </p>
        <p>
          <strong>Shortcuts:</strong> <code>I</code> Inventory • <code>J</code> Journal •{' '}
          <code>E</code> Evidence Board • <code>Esc</code> Close Panel.
        </p>
        <p className="muted-note">
          Built with Phaser 3, React, TypeScript, and procedural Web Audio &amp; layered gouache
          canvas rendering. Drop custom artwork into <code>assets/</code> per{' '}
          <code>ASSET_GENERATION.md</code>.
        </p>
      </div>
    </div>
  </div>
);

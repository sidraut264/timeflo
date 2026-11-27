import React from 'react';
import { useGameState } from '../../state/useGameState';

export const LoadingScreen: React.FC = () => {
  const { loadingProgress } = useGameState();
  const total = Math.max(1, loadingProgress.total);
  const pct = Math.min(100, Math.round((loadingProgress.loaded / total) * 100));

  return (
    <div className="loading-screen" role="status" aria-live="polite" aria-label="Loading Blackwood Manor">
      <div className="loading-card">
        <div className="loading-eyebrow">CASE FILE NO. 1997-11 • BLACKWOOD MANOR</div>
        <h1 className="loading-title">APPROACHING THE MANOR</h1>
        <p className="loading-status">{loadingProgress.label}</p>

        <div className="loading-bar-track" aria-hidden="true">
          <div className="loading-bar-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="loading-meta">
          <span>
            {loadingProgress.loaded} / {loadingProgress.total} Assets Prepared
          </span>
          <span>{pct}%</span>
        </div>
      </div>
    </div>
  );
};

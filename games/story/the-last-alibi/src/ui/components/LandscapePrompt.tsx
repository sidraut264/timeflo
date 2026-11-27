import React, { useEffect, useState } from 'react';

function checkShouldPromptLandscape(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isPortrait = h > w;
  const isMobileSized = Math.min(w, h) < 820;
  return isPortrait && isMobileSized;
}

export const LandscapePrompt: React.FC = () => {
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(() =>
    checkShouldPromptLandscape()
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const syncOrientation = () => {
      const shouldPrompt = checkShouldPromptLandscape();
      setIsPortraitMobile(shouldPrompt);
      if (!shouldPrompt) {
        setDismissed(false);
      }
    };

    window.addEventListener('resize', syncOrientation);
    window.addEventListener('orientationchange', syncOrientation);
    return () => {
      window.removeEventListener('resize', syncOrientation);
      window.removeEventListener('orientationchange', syncOrientation);
    };
  }, []);

  if (!isPortraitMobile || dismissed) return null;

  const handleLockLandscape = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Fullscreen may be blocked outside supported browsers
    }
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (mode: 'landscape' | 'portrait') => Promise<void>;
      };
      await orientation?.lock?.('landscape');
    } catch {
      // Orientation lock is only supported on some mobile browsers after fullscreen
    }
  };

  return (
    <div
      className="landscape-prompt-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Rotate Device to Landscape"
    >
      <div className="landscape-prompt-card">
        <div className="rotate-device-icon" aria-hidden="true">
          <svg viewBox="0 0 80 80" width="68" height="68">
            <rect
              x="24"
              y="12"
              width="32"
              height="56"
              rx="4"
              fill="#19130e"
              stroke="#d9b166"
              strokeWidth="2.4"
            />
            <circle cx="40" cy="60" r="2.2" fill="#d9b166" />
            <path
              d="M 12 36 A 28 28 0 0 1 32 10"
              fill="none"
              stroke="#b88c44"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
            <polygon points="34,7 27,13 33,15" fill="#d9b166" />
          </svg>
        </div>

        <div className="landscape-eyebrow">BLACKWOOD MANOR • MOBILE VIEW</div>
        <h2>Rotate to Landscape Mode</h2>
        <p>
          The 2.5D parallax rooms, interrogations, and evidence board are best experienced in{' '}
          <strong>landscape orientation</strong>.
        </p>

        <div className="landscape-actions">
          <button className="retro-btn primary" onClick={() => void handleLockLandscape()}>
            Rotate &amp; Fullscreen
          </button>
          <button className="retro-btn" onClick={() => setDismissed(true)}>
            Continue in Portrait
          </button>
        </div>
      </div>
    </div>
  );
};

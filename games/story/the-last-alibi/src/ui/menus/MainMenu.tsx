import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../../game/audio/SoundEngine';
import { gameStore } from '../../state/gameStore';

interface MainMenuProps {
  onOpenSettings: () => void;
  onOpenCredits: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onOpenSettings, onOpenCredits }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    setHasSave(gameStore.hasSavedGame());
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const drops = Array.from({ length: 140 }, () => ({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      len: 14 + Math.random() * 22,
      speed: 480 + Math.random() * 340
    }));

    let lightning = 0;
    let nextFlash = performance.now() + 3500;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (now > nextFlash) {
        lightning = 0.85;
        nextFlash = now + 5200 + Math.random() * 7000;
      } else {
        lightning = Math.max(0, lightning - dt * 2.4);
      }

      const W = canvas.width;
      const H = canvas.height;

      // Storm sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, lightning > 0.2 ? '#263850' : '#080e16');
      sky.addColorStop(0.55, lightning > 0.2 ? '#364d68' : '#152232');
      sky.addColorStop(1, '#090b0d');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Distant jagged lightning bolt
      if (lightning > 0.45) {
        ctx.strokeStyle = `rgba(220, 236, 255, ${lightning * 0.7})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(940, 0);
        ctx.lineTo(918, 95);
        ctx.lineTo(936, 132);
        ctx.lineTo(895, 255);
        ctx.stroke();
      }

      // Moorland hills
      ctx.fillStyle = '#0c1117';
      ctx.beginPath();
      ctx.moveTo(0, 520);
      ctx.quadraticCurveTo(310, 445, 650, 490);
      ctx.quadraticCurveTo(980, 430, W, 510);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();

      // Blackwood Manor Silhouette
      ctx.fillStyle = '#07080a';
      ctx.fillRect(540, 290, 440, 210);
      // Gabled wings & chimney towers
      ctx.beginPath();
      ctx.moveTo(525, 290);
      ctx.lineTo(620, 210);
      ctx.lineTo(715, 290);
      ctx.moveTo(745, 290);
      ctx.lineTo(760, 175);
      ctx.lineTo(800, 175);
      ctx.lineTo(815, 290);
      ctx.moveTo(835, 290);
      ctx.lineTo(915, 220);
      ctx.lineTo(995, 290);
      ctx.fill();
      // Chimneys
      ctx.fillRect(575, 185, 22, 65);
      ctx.fillRect(920, 175, 24, 70);

      // Glowing tungsten windows (including upper study window!)
      const windows = [
        { x: 605, y: 335, w: 22, h: 36, glow: 0.75 },
        { x: 655, y: 335, w: 22, h: 36, glow: 0.45 },
        { x: 765, y: 325, w: 28, h: 42, glow: 0.92 }, // Edward's Study window
        { x: 880, y: 335, w: 22, h: 36, glow: 0.65 },
        { x: 620, y: 410, w: 24, h: 42, glow: 0.85 },
        { x: 758, y: 405, w: 42, h: 65, glow: 0.55 },
        { x: 895, y: 410, w: 24, h: 42, glow: 0.5 }
      ];
      windows.forEach((win) => {
        const flicker = win.glow + Math.sin(now * 0.004 + win.x) * 0.06;
        ctx.fillStyle = `rgba(218, 162, 72, ${flicker})`;
        ctx.fillRect(win.x, win.y, win.w, win.h);
        const rad = ctx.createRadialGradient(
          win.x + win.w / 2,
          win.y + win.h / 2,
          2,
          win.x + win.w / 2,
          win.y + win.h / 2,
          52
        );
        rad.addColorStop(0, 'rgba(218, 162, 72, 0.25)');
        rad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rad;
        ctx.fillRect(win.x - 45, win.y - 45, win.w + 90, win.h + 90);
      });

      // Rain
      ctx.strokeStyle = 'rgba(176, 198, 224, 0.25)';
      ctx.lineWidth = 1.2;
      for (const d of drops) {
        d.y += d.speed * dt;
        d.x -= 95 * dt;
        if (d.y > H) {
          d.y = -20;
          d.x = Math.random() * (W + 120);
        }
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 4, d.y + d.len);
        ctx.stroke();
      }

      // Vignette
      const vig = ctx.createRadialGradient(W * 0.5, H * 0.5, 200, W * 0.5, H * 0.5, W * 0.72);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(4,5,7,0.82)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="main-menu-screen">
      <canvas ref={canvasRef} width={1280} height={720} className="menu-bg-canvas" />
      <div className="menu-content">
        <div className="menu-eyebrow">BLACKWOOD MANOR • NOVEMBER 17, 1997</div>
        <h1 className="menu-title">THE LAST ALIBI</h1>
        <p className="menu-subtitle">
          Six suspects. One bolted study. Telephone lines severed by the storm.
          <br />
          And a telegram addressed to Detective Arthur Hayes.
        </p>

        <nav className="menu-buttons" aria-label="Main Menu">
          <button
            className="retro-btn primary"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playSfx('door');
              gameStore.startNewGame();
            }}
          >
            New Investigation
          </button>
          <button
            className="retro-btn"
            disabled={!hasSave}
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playSfx('click');
              gameStore.continueGame();
            }}
          >
            Continue Case {hasSave ? '' : '(No Saved File)'}
          </button>
          <button
            className="retro-btn"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playSfx('click');
              onOpenSettings();
            }}
          >
            Audio &amp; Display Settings
          </button>
          <button
            className="retro-btn"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playSfx('click');
              onOpenCredits();
            }}
          >
            Credits &amp; Case Notes
          </button>
        </nav>
      </div>
    </div>
  );
};

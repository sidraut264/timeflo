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
    const bgImg = new Image();
    let bgLoaded = false;
    bgImg.onload = () => {
      bgLoaded = true;
    };
    bgImg.src = './assets/optimized/environments/mansion/menu_manor.webp';

    const drops = Array.from({ length: 165 }, () => ({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      len: 16 + Math.random() * 24,
      speed: 520 + Math.random() * 340
    }));

    const mist = Array.from({ length: 6 }, (_, i) => ({
      x: i * 260,
      y: 520 + (i % 3) * 55,
      r: 220 + (i % 2) * 80,
      speed: 12 + (i % 3) * 5
    }));

    let lightning = 0;
    let nextFlash = performance.now() + 4200;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (now > nextFlash) {
        lightning = 0.78;
        nextFlash = now + 5600 + Math.random() * 7500;
      } else {
        lightning = Math.max(0, lightning - dt * 2.5);
      }

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (bgLoaded) {
        // Subtle atmospheric camera drift over the painted manor exterior
        const driftX = Math.sin(now * 0.00018) * 14;
        const driftY = Math.cos(now * 0.00014) * 6;
        const scale = 1.035;
        const drawW = W * scale;
        const drawH = H * scale;
        ctx.drawImage(bgImg, -(drawW - W) / 2 + driftX, -(drawH - H) / 2 + driftY, drawW, drawH);

        // Lightning sky illumination pulse
        if (lightning > 0.02) {
          ctx.fillStyle = `rgba(195, 220, 250, ${lightning * 0.22})`;
          ctx.fillRect(0, 0, W, H);
        }

        // Subtle warm flicker over the upper study window & doorway
        const flicker = 0.06 + Math.sin(now * 0.005) * 0.03;
        const winGlow = ctx.createRadialGradient(W * 0.72, H * 0.38, 10, W * 0.72, H * 0.38, 170);
        winGlow.addColorStop(0, `rgba(235, 170, 72, ${flicker})`);
        winGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = winGlow;
        ctx.fillRect(W * 0.5, H * 0.1, W * 0.45, H * 0.6);
      } else {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#080e16');
        sky.addColorStop(1, '#152232');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);
      }

      // Drifting low moorland mist
      for (const m of mist) {
        m.x += m.speed * dt;
        if (m.x - m.r > W) m.x = -m.r;
        const g = ctx.createRadialGradient(m.x, m.y, 10, m.x, m.y, m.r);
        g.addColorStop(0, 'rgba(135, 155, 175, 0.06)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Animated rain streaks
      ctx.strokeStyle = 'rgba(184, 206, 232, 0.24)';
      ctx.lineWidth = 1.25;
      for (const d of drops) {
        d.y += d.speed * dt;
        d.x -= 110 * dt;
        if (d.y > H) {
          d.y = -20;
          d.x = Math.random() * (W + 140);
        }
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 4.5, d.y + d.len);
        ctx.stroke();
      }

      // Left-side readability gradient & deep atmospheric edge vignette
      const leftShade = ctx.createLinearGradient(0, 0, W * 0.62, 0);
      leftShade.addColorStop(0, 'rgba(6, 7, 10, 0.62)');
      leftShade.addColorStop(0.65, 'rgba(6, 7, 10, 0.25)');
      leftShade.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = leftShade;
      ctx.fillRect(0, 0, W * 0.65, H);

      const vig = ctx.createRadialGradient(W * 0.6, H * 0.48, 220, W * 0.5, H * 0.5, W * 0.72);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(4,5,7,0.72)');
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

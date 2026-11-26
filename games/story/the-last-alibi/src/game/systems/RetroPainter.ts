import Phaser from 'phaser';
import { CharacterDefinition, LocationDefinition } from '../../types/game';

function drawCanvasGrain(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.045) {
  ctx.save();
  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const v = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

function drawWoodPaneling(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  base: string,
  trim: string
) {
  ctx.save();
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = trim;
  ctx.lineWidth = 3;
  const cols = Math.max(2, Math.floor(w / 110));
  const cw = w / cols;
  for (let i = 0; i < cols; i++) {
    const px = x + i * cw + 10;
    const py = y + 14;
    const pw = cw - 20;
    const ph = h - 28;
    ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(px + 4, py + 4, pw - 8, ph - 8);
  }
  ctx.restore();
}

function drawGothicWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  skyAlpha = 0.72
) {
  ctx.save();
  // Cut-out glow / night glass
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, `rgba(26, 44, 66, ${skyAlpha})`);
  grad.addColorStop(1, `rgba(11, 20, 32, ${skyAlpha + 0.12})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + w * 0.48);
  ctx.quadraticCurveTo(x + w * 0.5, y - w * 0.2, x + w, y + w * 0.48);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();

  // Rain streaks inside pane
  ctx.strokeStyle = 'rgba(180, 208, 232, 0.16)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 22; i++) {
    const rx = x + 12 + ((i * 37) % (w - 24));
    const ry = y + 25 + ((i * 53) % (h - 55));
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 5, ry + 26);
    ctx.stroke();
  }

  // Mullions
  ctx.strokeStyle = '#14100d';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + 6);
  ctx.lineTo(x + w * 0.5, y + h);
  ctx.moveTo(x, y + h * 0.48);
  ctx.lineTo(x + w, y + h * 0.48);
  ctx.moveTo(x, y + h * 0.75);
  ctx.lineTo(x + w, y + h * 0.75);
  ctx.stroke();
  ctx.restore();
}

function drawWarmLamp(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string) {
  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
  grad.addColorStop(0, 'rgba(255, 222, 146, 0.58)');
  grad.addColorStop(0.28, color + '55');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  kind: string,
  trim: string
) {
  ctx.save();
  ctx.fillStyle = '#0e0a08';
  ctx.fillRect(x - 6, y - 6, w + 12, h + 6);

  if (kind === 'baize_door') {
    ctx.fillStyle = '#1f3228';
  } else if (kind === 'cellar_door') {
    ctx.fillStyle = '#1d1c1a';
  } else {
    ctx.fillStyle = '#2d1c13';
  }

  if (kind === 'arch_door') {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + 40);
    ctx.quadraticCurveTo(x + w / 2, y - 16, x + w, y + 40);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = trim;
    ctx.lineWidth = 5;
    ctx.stroke();
  } else {
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = trim;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
  }

  // Door inset panels
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 14, y + 36, w - 28, h * 0.36);
  ctx.strokeRect(x + 14, y + h * 0.52, w - 28, h * 0.38);

  // Brass knob
  ctx.fillStyle = '#b98f46';
  ctx.beginPath();
  ctx.arc(x + w - 18, y + h * 0.54, 5, 0, Math.PI * 2);
  ctx.fill();

  if (kind === 'locked_study_door') {
    // Splintered bolt warning shimmer & keyhole
    ctx.fillStyle = '#090706';
    ctx.fillRect(x + w - 21, y + h * 0.58, 6, 14);
  }
  ctx.restore();
}

function drawHotspotProp(
  ctx: CanvasRenderingContext2D,
  visualKind: string,
  cx: number,
  cy: number,
  w: number,
  h: number,
  trim: string,
  accent: string
) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  ctx.save();

  switch (visualKind) {
    case 'arch_door':
    case 'paneled_door':
    case 'baize_door':
    case 'cellar_door':
    case 'locked_study_door':
      drawDoor(ctx, x, y, w, h, visualKind, trim);
      break;

    case 'grandfather_clock': {
      ctx.fillStyle = '#24160e';
      ctx.fillRect(x + 10, y, w - 20, h);
      ctx.strokeStyle = trim;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 10, y, w - 20, h);
      // Dial
      ctx.fillStyle = '#d4c39b';
      ctx.beginPath();
      ctx.arc(cx, y + 48, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1c140e';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Hands near 11:47
      ctx.beginPath();
      ctx.moveTo(cx, y + 48);
      ctx.lineTo(cx - 8, y + 34);
      ctx.moveTo(cx, y + 48);
      ctx.lineTo(cx - 14, y + 60);
      ctx.stroke();
      // Pendulum glass
      ctx.fillStyle = '#120d0a';
      ctx.fillRect(cx - 16, y + 92, 32, h - 135);
      ctx.fillStyle = '#b98f46';
      ctx.beginPath();
      ctx.arc(cx, y + h - 60, 9, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'fireplace': {
      ctx.fillStyle = '#2a2724';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#47413a';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#0d0908';
      ctx.fillRect(x + 22, y + 42, w - 44, h - 46);
      // Embers
      const em = ctx.createRadialGradient(cx, y + h - 22, 4, cx, y + h - 22, 42);
      em.addColorStop(0, 'rgba(235, 118, 36, 0.85)');
      em.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = em;
      ctx.fillRect(x + 24, y + h - 68, w - 48, 64);
      // Mantel shelf
      ctx.fillStyle = '#3b281c';
      ctx.fillRect(x - 10, y - 10, w + 20, 18);
      break;
    }

    case 'staircase': {
      ctx.fillStyle = '#1b120d';
      ctx.fillRect(x, y, w, h);
      const steps = 11;
      for (let i = 0; i < steps; i++) {
        const sy = y + (i * h) / steps;
        const inset = (steps - i) * 3;
        ctx.fillStyle = i % 2 === 0 ? '#2f2016' : '#241810';
        ctx.fillRect(x + inset, sy, w - inset * 2, h / steps - 2);
        // Burgundy runner
        ctx.fillStyle = accent;
        ctx.fillRect(cx - w * 0.22, sy, w * 0.44, h / steps - 2);
      }
      ctx.strokeStyle = trim;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, w, h);
      break;
    }

    case 'telephone': {
      ctx.fillStyle = '#312016';
      ctx.fillRect(x + 12, y + 36, w - 24, h - 36);
      ctx.fillStyle = '#111214';
      ctx.fillRect(cx - 22, y + 16, 44, 24);
      ctx.fillRect(cx - 28, y + 6, 56, 10);
      break;
    }

    case 'window':
    case 'terrace_doors': {
      drawGothicWindow(ctx, x, y, w, h, 0.8);
      break;
    }

    case 'victim_desk': {
      // Mahogany desk
      ctx.fillStyle = '#321e13';
      ctx.fillRect(x - 28, y + 40, w + 56, h - 40);
      ctx.fillStyle = '#24140c';
      ctx.fillRect(x - 36, y + 30, w + 72, 16);
      // Green banker lamp
      ctx.fillStyle = '#1f5a38';
      ctx.fillRect(x + w - 24, y - 6, 36, 18);
      ctx.fillStyle = '#b98f46';
      ctx.fillRect(x + w - 10, y + 12, 8, 22);
      // Slumped silhouette of Edward Blackwood
      ctx.fillStyle = '#141114';
      ctx.beginPath();
      ctx.ellipse(cx - 10, y + 22, 44, 24, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 26, y + 26, 16, 0, Math.PI * 2);
      ctx.fill();
      // Subtle crimson blotter accent
      ctx.fillStyle = 'rgba(110, 18, 24, 0.65)';
      ctx.fillRect(cx - 32, y + 26, 54, 10);
      break;
    }

    case 'wall_safe':
    case 'painting': {
      ctx.fillStyle = '#4a3520';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#1b2621';
      ctx.fillRect(x + 12, y + 12, w - 24, h - 24);
      // Painted moor hill silhouette inside frame
      ctx.fillStyle = '#0f1615';
      ctx.beginPath();
      ctx.moveTo(x + 12, y + h - 12);
      ctx.lineTo(x + w * 0.45, y + h * 0.46);
      ctx.lineTo(x + w - 12, y + h - 12);
      ctx.fill();
      if (visualKind === 'wall_safe') {
        ctx.fillStyle = '#b98f46';
        ctx.beginPath();
        ctx.arc(x + w - 20, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'bookcase':
    case 'bookshelf': {
      ctx.fillStyle = '#241710';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = trim;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, w, h);
      for (let row = 0; row < 5; row++) {
        const sy = y + 16 + row * ((h - 28) / 5);
        ctx.fillStyle = '#140c08';
        ctx.fillRect(x + 8, sy + 28, w - 16, 6);
        for (let b = 0; b < 9; b++) {
          const bx = x + 12 + b * ((w - 24) / 9);
          const tones = ['#4a1b20', '#213429', '#3f301b', '#222b38', '#4f3a24'];
          ctx.fillStyle = tones[(row + b) % tones.length];
          ctx.fillRect(bx, sy + 2, (w - 30) / 9 - 2, 26);
        }
      }
      break;
    }

    case 'billiard_table': {
      ctx.fillStyle = '#332014';
      ctx.fillRect(x, y + 26, w, h - 26);
      ctx.fillStyle = '#1d4a31';
      ctx.fillRect(x + 14, y + 12, w - 28, 30);
      ctx.strokeStyle = '#4f3320';
      ctx.lineWidth = 6;
      ctx.strokeRect(x + 14, y + 12, w - 28, 30);
      // Triangle rack
      ctx.fillStyle = '#b82e2e';
      ctx.beginPath();
      ctx.arc(cx + 40, y + 26, 4, 0, Math.PI * 2);
      ctx.arc(cx + 48, y + 23, 4, 0, Math.PI * 2);
      ctx.arc(cx + 48, y + 29, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'dining_table': {
      ctx.fillStyle = '#301b12';
      ctx.fillRect(x, y + 32, w, 24);
      ctx.fillRect(x + 28, y + 56, 18, h - 56);
      ctx.fillRect(x + w - 46, y + 56, 18, h - 56);
      // Candelabras & plates
      ctx.fillStyle = '#a89f8d';
      ctx.fillRect(cx - 4, y + 4, 8, 28);
      ctx.fillStyle = '#e5be6a';
      ctx.beginPath();
      ctx.arc(cx, y + 2, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'map_chest':
    case 'nightstand':
    case 'briefcase':
    case 'medical_bag': {
      ctx.fillStyle = visualKind === 'medical_bag' ? '#4a1b1f' : '#352216';
      ctx.fillRect(x + 10, y + 16, w - 20, h - 20);
      ctx.strokeStyle = trim;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 10, y + 16, w - 20, h - 20);
      ctx.fillStyle = '#c49b4a';
      ctx.fillRect(cx - 10, cy - 2, 20, 8);
      break;
    }

    case 'bed': {
      ctx.fillStyle = '#291a12';
      ctx.fillRect(x, y, 16, h);
      ctx.fillRect(x + w - 16, y + 24, 16, h - 24);
      ctx.fillStyle = '#2b3930';
      ctx.fillRect(x + 16, y + h * 0.45, w - 32, h * 0.42);
      ctx.fillStyle = '#c7beac';
      ctx.fillRect(x + 22, y + h * 0.38, 44, 18);
      break;
    }

    case 'stove':
    case 'furnace': {
      ctx.fillStyle = '#181a1c';
      ctx.fillRect(x + 10, y + 10, w - 20, h - 10);
      ctx.strokeStyle = '#383d42';
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 10, y + 10, w - 20, h - 10);
      ctx.fillStyle = '#0c0d0e';
      ctx.fillRect(cx - 28, cy + 12, 56, 44);
      // Chimney pipe
      ctx.fillStyle = '#1e2124';
      ctx.fillRect(cx - 18, 0, 36, y + 14);
      break;
    }

    case 'sink': {
      ctx.fillStyle = '#3a3731';
      ctx.fillRect(x + 12, y + 52, w - 24, h - 52);
      ctx.fillStyle = '#cfc8b8';
      ctx.fillRect(x + 16, y + 32, w - 32, 24);
      ctx.fillStyle = '#7c766a';
      ctx.fillRect(cx - 4, y + 12, 8, 22);
      break;
    }

    case 'wine_rack': {
      ctx.fillStyle = '#2a1d14';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#473324';
      ctx.lineWidth = 3;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 4; c++) {
          ctx.strokeRect(x + 14 + c * 36, y + 18 + r * 42, 28, 32);
          if ((r + c) % 2 === 0) {
            ctx.fillStyle = '#1f2e24';
            ctx.beginPath();
            ctx.arc(x + 28 + c * 36, y + 34 + r * 42, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      break;
    }

    case 'secret_stair': {
      ctx.fillStyle = '#090b0f';
      ctx.fillRect(x, y, w, h);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = '#2a2d33';
        ctx.fillRect(x + 10, y + 30 + i * 28, w - 20, 12);
      }
      break;
    }

    case 'coat_rack': {
      ctx.fillStyle = '#2f1e14';
      ctx.fillRect(cx - 5, y + 10, 10, h - 14);
      ctx.fillStyle = '#222830';
      ctx.fillRect(cx - 28, y + 34, 56, 118);
      break;
    }

    default: {
      // Subtle floor / desk / hearth item accent
      ctx.fillStyle = 'rgba(210, 174, 100, 0.34)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(14, w * 0.28), Math.max(10, h * 0.25), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d4aa57';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

export function buildRoomLayerTextures(scene: Phaser.Scene, loc: LocationDefinition): string[] {
  const keys = [
    `room_${loc.id}_sky`,
    `room_${loc.id}_far`,
    `room_${loc.id}_mid`,
    `room_${loc.id}_fore`,
    `room_${loc.id}_light`
  ];
  const W = loc.worldWidth;
  const H = loc.worldHeight;

  // 0: Sky / distant moorland
  if (!scene.textures.exists(keys[0])) {
    const tex = scene.textures.createCanvas(keys[0], W, H);
    if (tex) {
      const ctx = tex.getContext();
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, loc.palette.skyTop);
      sky.addColorStop(0.6, loc.palette.skyBottom);
      sky.addColorStop(1, '#090b0f');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Storm cloud bands
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = 'rgba(130, 155, 185, 0.06)';
        ctx.beginPath();
        ctx.ellipse(180 + i * 210, 130 + (i % 3) * 35, 220, 48, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Distant moor silhouettes
      ctx.fillStyle = '#090e14';
      ctx.beginPath();
      ctx.moveTo(0, H * 0.58);
      ctx.lineTo(320, H * 0.49);
      ctx.lineTo(780, H * 0.55);
      ctx.lineTo(1220, H * 0.46);
      ctx.lineTo(W, H * 0.56);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      drawCanvasGrain(ctx, W, H, 0.03);
      tex.refresh();
    }
  }

  // 1: Far architecture (transparent window cutouts!)
  if (!scene.textures.exists(keys[1])) {
    const tex = scene.textures.createCanvas(keys[1], W, H);
    if (tex) {
      const ctx = tex.getContext();
      ctx.fillStyle = loc.palette.farWall;
      ctx.fillRect(0, 0, W, H * 0.72);
      // Cut out gothic windows if not basement
      if (loc.id !== 'basement') {
        const winPositions = [340, 800, 1260];
        winPositions.forEach((wx) => {
          ctx.clearRect(wx - 70, 130, 140, 260);
          drawGothicWindow(ctx, wx - 70, 130, 140, 260, 0.28);
        });
      }
      // Moulding line
      ctx.fillStyle = loc.palette.trim;
      ctx.fillRect(0, 88, W, 14);
      drawCanvasGrain(ctx, W, H, 0.035);
      tex.refresh();
    }
  }

  // 2: Midground walls, floor, wainscoting & props
  if (!scene.textures.exists(keys[2])) {
    const tex = scene.textures.createCanvas(keys[2], W, H);
    if (tex) {
      const ctx = tex.getContext();
      // Rich opaque wallpaper / plaster wall above wainscoting
      const wallGrad = ctx.createLinearGradient(0, 60, 0, H * 0.56);
      wallGrad.addColorStop(0, '#120e0b');
      wallGrad.addColorStop(0.5, loc.palette.midWall);
      wallGrad.addColorStop(1, '#1a130f');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 82, W, H * 0.56 - 82);

      // Subtle vertical damask / painterly wallpaper stripes
      ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
      for (let sx = 0; sx < W; sx += 44) {
        ctx.fillRect(sx, 88, 16, H * 0.56 - 88);
      }

      // Cut out transparent gothic window apertures so storm sky & rain show strictly outside
      if (loc.id !== 'basement') {
        [340, 800, 1260].forEach((wx) => {
          ctx.clearRect(wx - 66, 135, 132, 245);
          // Interior window sill shadow & velvet side drapes
          ctx.fillStyle = '#241416';
          ctx.fillRect(wx - 78, 128, 16, 260);
          ctx.fillRect(wx + 62, 128, 16, 260);
          ctx.fillStyle = loc.palette.trim;
          ctx.fillRect(wx - 76, 378, 152, 10);
        });
      }

      // Dado rail & dark oak wainscoting grounded at y = 536
      ctx.fillStyle = loc.palette.trim;
      ctx.fillRect(0, H * 0.555, W, 9);
      drawWoodPaneling(ctx, 0, H * 0.565, W, H * 0.18, loc.palette.midWall, loc.palette.trim);

      // Perspective plank/flagstone floor from y = 536 to 720
      const floorGrad = ctx.createLinearGradient(0, H * 0.745, 0, H);
      floorGrad.addColorStop(0, loc.palette.floor);
      floorGrad.addColorStop(1, '#070605');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, H * 0.745, W, H * 0.255);

      // Baseboard trim
      ctx.fillStyle = '#0e0a07';
      ctx.fillRect(0, H * 0.735, W, 10);

      // Floorboard perspective lines
      ctx.strokeStyle = 'rgba(0,0,0,0.52)';
      ctx.lineWidth = 2;
      for (let i = -8; i <= 18; i++) {
        ctx.beginPath();
        ctx.moveTo(W * 0.5 + i * 75, H * 0.745);
        ctx.lineTo(W * 0.5 + i * 165, H);
        ctx.stroke();
      }

      // Rug in hall/study/library/corridor
      if (loc.id !== 'basement' && loc.id !== 'kitchen') {
        ctx.fillStyle = loc.palette.accent + 'cc';
        ctx.beginPath();
        ctx.moveTo(280, H * 0.785);
        ctx.lineTo(W - 280, H * 0.785);
        ctx.lineTo(W - 150, H * 0.96);
        ctx.lineTo(150, H * 0.96);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(195, 152, 74, 0.42)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Render static visuals for every room hotspot, grounded nicely on the baseboard
      loc.hotspots.forEach((hp) => {
        if (hp.visualKind) {
          const isArchitectural = [
            'arch_door',
            'paneled_door',
            'baize_door',
            'cellar_door',
            'locked_study_door',
            'fireplace',
            'grandfather_clock',
            'staircase',
            'bookcase',
            'bookshelf',
            'map_chest',
            'wine_rack',
            'furnace',
            'stove',
            'secret_stair',
            'coat_rack'
          ].includes(hp.visualKind);
          const groundedCy = isArchitectural ? Math.max(hp.y, 536 - hp.height / 2) : hp.y;
          drawHotspotProp(
            ctx,
            hp.visualKind,
            hp.x,
            groundedCy,
            hp.width,
            hp.height,
            loc.palette.trim,
            loc.palette.accent
          );
        }
      });

      drawCanvasGrain(ctx, W, H, 0.045);
      tex.refresh();
    }
  }

  // 3: Foreground framing pillars, ceiling beams & chandelier silhouette (1820px wide for 0.85x parallax)
  if (!scene.textures.exists(keys[3])) {
    const FW = 1820;
    const tex = scene.textures.createCanvas(keys[3], FW, H);
    if (tex) {
      const ctx = tex.getContext();
      // Left & right carved pillars
      ctx.fillStyle = '#0d0907';
      ctx.fillRect(0, 0, 48, H);
      ctx.fillRect(FW - 48, 0, 48, H);
      ctx.fillStyle = loc.palette.trim + '88';
      ctx.fillRect(44, 0, 6, H);
      ctx.fillRect(FW - 50, 0, 6, H);

      // Top timber soffit
      ctx.fillStyle = '#090706';
      ctx.fillRect(0, 0, FW, 38);

      // Hanging wrought-iron chandelier silhouette near center
      ctx.strokeStyle = '#14100d';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(FW * 0.5, 0);
      ctx.lineTo(FW * 0.5, 118);
      ctx.moveTo(FW * 0.5 - 88, 118);
      ctx.lineTo(FW * 0.5 + 88, 118);
      ctx.stroke();

      [-78, -32, 32, 78].forEach((dx) => {
        ctx.fillStyle = '#d9ac56';
        ctx.beginPath();
        ctx.arc(FW * 0.5 + dx, 108, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });

      tex.refresh();
    }
  }

  // 4: Atmospheric lighting cones + vignette
  if (!scene.textures.exists(keys[4])) {
    const tex = scene.textures.createCanvas(keys[4], W, H);
    if (tex) {
      const ctx = tex.getContext();
      drawWarmLamp(ctx, W * 0.28, 260, 260, loc.palette.lampGlow);
      drawWarmLamp(ctx, W * 0.5, 160, 320, loc.palette.lampGlow);
      drawWarmLamp(ctx, W * 0.74, 270, 260, loc.palette.lampGlow);

      const vig = ctx.createRadialGradient(W * 0.5, H * 0.48, 220, W * 0.5, H * 0.5, W * 0.62);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(4,5,8,0.68)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
      tex.refresh();
    }
  }

  return keys;
}

export function buildCharacterSpriteTexture(scene: Phaser.Scene, char: CharacterDefinition): string {
  const key = `char_sprite_${char.id}`;
  if (scene.textures.exists(key)) return key;

  const W = 130;
  const H = 260;
  const tex = scene.textures.createCanvas(key, W, H);
  if (!tex) return key;
  const ctx = tex.getContext();

  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(W * 0.5, H - 10, 38, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Coat / dress silhouette with shoulder shading & folded waist
  const coatGrad = ctx.createLinearGradient(0, 76, W, H - 18);
  coatGrad.addColorStop(0, char.coatColor);
  coatGrad.addColorStop(1, '#0d0a09');
  ctx.fillStyle = coatGrad;
  ctx.beginPath();
  ctx.moveTo(W * 0.24, H - 16);
  ctx.lineTo(W * 0.3, 88);
  ctx.quadraticCurveTo(W * 0.5, 72, W * 0.7, 88);
  ctx.lineTo(W * 0.76, H - 16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#090706';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Arms & hands
  ctx.fillStyle = char.skinTone;
  ctx.beginPath();
  ctx.arc(W * 0.31, 152, 5.5, 0, Math.PI * 2);
  ctx.arc(W * 0.69, 152, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Lapels / collar accent
  ctx.fillStyle = char.accentColor;
  ctx.beginPath();
  ctx.moveTo(W * 0.43, 82);
  ctx.lineTo(W * 0.5, 134);
  ctx.lineTo(W * 0.57, 82);
  ctx.closePath();
  ctx.fill();

  // Neck
  ctx.fillStyle = char.skinTone;
  ctx.fillRect(W * 0.44, 68, 16, 16);

  // Head
  ctx.fillStyle = char.skinTone;
  ctx.beginPath();
  ctx.ellipse(W * 0.5, 51, 17, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chiaroscuro cheek shadow
  ctx.fillStyle = 'rgba(18, 10, 8, 0.28)';
  ctx.beginPath();
  ctx.ellipse(W * 0.56, 52, 9, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Facial features (brows, eyes, nose, mouth)
  ctx.fillStyle = '#1b1411';
  ctx.fillRect(W * 0.41, 46, 5, 2.5);
  ctx.fillRect(W * 0.54, 46, 5, 2.5);
  ctx.strokeStyle = 'rgba(42, 22, 16, 0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(W * 0.5, 48);
  ctx.lineTo(W * 0.49, 57);
  ctx.moveTo(W * 0.45, 63);
  ctx.lineTo(W * 0.55, 63);
  ctx.stroke();

  // Hair
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  ctx.ellipse(W * 0.5, 36, 19, 13, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  if (char.id === 'eleanor' || char.id === 'margaret' || char.id === 'clara') {
    ctx.beginPath();
    ctx.arc(W * 0.5, 25, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Spectacles for Dr. Reed
  if (char.id === 'reed') {
    ctx.strokeStyle = '#d4b878';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(W * 0.44, 52, 5, 0, Math.PI * 2);
    ctx.arc(W * 0.56, 52, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Rim light along right edge
  ctx.strokeStyle = 'rgba(218, 182, 108, 0.38)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.67, 86);
  ctx.lineTo(W * 0.74, H - 20);
  ctx.stroke();

  tex.refresh();
  return key;
}

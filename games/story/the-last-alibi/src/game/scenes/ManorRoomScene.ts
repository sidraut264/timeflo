import Phaser from 'phaser';
import { CHARACTER_LIST } from '../../data/characters/characters';
import { LOCATIONS } from '../../data/locations/locations';
import { gameStore } from '../../state/gameStore';
import { HotspotDefinition, LocationId } from '../../types/game';
import { soundEngine } from '../audio/SoundEngine';
import { getAssetManifestSync, loadAssetManifest } from '../systems/AssetManifestLoader';
import { buildCharacterSpriteTexture, buildRoomLayerTextures } from '../systems/RetroPainter';

interface ActiveHotspotObj {
  def: HotspotDefinition;
  zone: Phaser.GameObjects.Zone;
  badge: Phaser.GameObjects.Container;
}

export class ManorRoomScene extends Phaser.Scene {
  private currentLocationId: LocationId = 'main_hall';
  private roomObjects: Phaser.GameObjects.GameObject[] = [];
  private hotspotObjs: ActiveHotspotObj[] = [];
  private rainGraphics!: Phaser.GameObjects.Graphics;
  private lightningOverlay!: Phaser.GameObjects.Rectangle;
  private transitionOverlay!: Phaser.GameObjects.Rectangle;
  private dustParticles: Array<{ g: Phaser.GameObjects.Arc; vx: number; vy: number; baseAlpha: number }> = [];
  private rainDrops: Array<{ x: number; y: number; len: number; speed: number }> = [];

  private targetScrollX = 160;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private unsubscribeStore?: () => void;
  private lastFlagsKey = '';
  private lastInventoryKey = '';
  private nextLightningAt = 0;
  private loadSeq = 0;
  private isDragging = false;
  private hasDragged = false;
  private dragStartX = 0;
  private dragStartScrollX = 0;

  constructor() {
    super('ManorRoomScene');
  }

  create() {
    this.cameras.main.setBounds(0, 0, 1862, 720);
    this.cameras.main.setBackgroundColor('#07090d');

    // Rain graphics (behind windows / far wall at 0.18x parallax)
    this.rainGraphics = this.add.graphics();
    this.rainGraphics.setScrollFactor(0.18, 0);
    this.rainGraphics.setDepth(5);

    for (let i = 0; i < 65; i++) {
      this.rainDrops.push({
        x: Math.random() * 1600,
        y: Math.random() * 720,
        len: 16 + Math.random() * 24,
        speed: 520 + Math.random() * 280
      });
    }

    // Lightning overlay (screen-fixed)
    this.lightningOverlay = this.add.rectangle(640, 360, 1280, 720, 0xcbdcf5, 0);
    this.lightningOverlay.setScrollFactor(0, 0);
    this.lightningOverlay.setDepth(95);

    // Room transition fade overlay (screen-fixed)
    this.transitionOverlay = this.add.rectangle(640, 360, 1280, 720, 0x050609, 0);
    this.transitionOverlay.setScrollFactor(0, 0);
    this.transitionOverlay.setDepth(99);

    // Floating dust motes in tungsten light
    for (let i = 0; i < 24; i++) {
      const arc = this.add.circle(
        180 + Math.random() * 1240,
        150 + Math.random() * 440,
        1 + Math.random() * 1.8,
        0xe8c782,
        0.12
      );
      arc.setScrollFactor(0.65, 0);
      arc.setDepth(58);
      this.dustParticles.push({
        g: arc,
        vx: (Math.random() - 0.5) * 12,
        vy: -4 - Math.random() * 8,
        baseAlpha: 0.08 + Math.random() * 0.14
      });
    }

    // Keyboard controls for camera pan
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    // Unlock audio and track touch/mouse drag panning
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      soundEngine.unlock();
      if (this.isUiBlocking()) return;
      this.isDragging = true;
      this.hasDragged = false;
      this.dragStartX = pointer.x;
      this.dragStartScrollX = this.targetScrollX;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !pointer.isDown || this.isUiBlocking()) return;
      const dx = pointer.x - this.dragStartX;
      if (Math.abs(dx) > 12) {
        this.hasDragged = true;
        this.targetScrollX = Phaser.Math.Clamp(this.dragStartScrollX - dx * 1.45, 0, 582);
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
      window.setTimeout(() => {
        this.hasDragged = false;
      }, 0);
    });

    const st = gameStore.getState();
    this.lastFlagsKey = st.flags.join(',');
    this.lastInventoryKey = st.inventory.join(',');
    void loadAssetManifest().then(() => {
      this.loadRoom(gameStore.getState().currentLocation, false);
    });

    this.unsubscribeStore = gameStore.subscribe(() => {
      const next = gameStore.getState();
      soundEngine.applySettings(next.audioSettings);

      if (next.currentLocation !== this.currentLocationId) {
        this.loadRoom(next.currentLocation, true);
      } else {
        const fk = next.flags.join(',');
        const ik = next.inventory.join(',');
        if (fk !== this.lastFlagsKey || ik !== this.lastInventoryKey) {
          this.lastFlagsKey = fk;
          this.lastInventoryKey = ik;
          this.rebuildHotspots();
        }
      }
    });

    this.nextLightningAt = this.time.now + 7000;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeStore?.();
    });
  }

  private isUiBlocking(): boolean {
    const s = gameStore.getState();
    return Boolean(
      s.screen !== 'playing' ||
        s.openModal !== 'none' ||
        s.activeDialogue ||
        s.activeInspection ||
        s.activePuzzle
    );
  }

  private loadImageToTexture(key: string, url: string): Promise<boolean> {
    if (this.textures.exists(key)) return Promise.resolve(true);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!this.textures.exists(key)) {
          this.textures.addImage(key, img);
        }
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  private loadRoom(locationId: LocationId, fade: boolean) {
    const loc = LOCATIONS[locationId];
    if (!loc) return;

    this.currentLocationId = locationId;
    const seq = ++this.loadSeq;

    const performLoad = () => {
      if (seq !== this.loadSeq) return;
      this.roomObjects.forEach((obj) => obj.destroy());
      this.roomObjects = [];
      this.hotspotObjs.forEach((h) => {
        h.zone.destroy();
        h.badge.destroy();
      });
      this.hotspotObjs = [];

      const fallbackKeys = buildRoomLayerTextures(this, loc);
      const manifest = getAssetManifestSync();
      const envManifest = manifest.environments[loc.id] || {};
      const slotNames: Array<'sky' | 'far' | 'mid' | 'fore' | 'light'> = [
        'sky',
        'far',
        'mid',
        'fore',
        'light'
      ];
      const scrollFactors = [0.1, 0.25, 0.55, 0.85, 0.55];
      const depths = [1, 10, 20, 60, 70];

      const layerSprites: Phaser.GameObjects.Image[] = [];
      slotNames.forEach((slot, idx) => {
        const customKey = `custom_${loc.id}_${slot}`;
        const key = this.textures.exists(customKey) ? customKey : fallbackKeys[idx];
        const img = this.add.image(0, 0, key).setOrigin(0, 0);
        img.setDisplaySize(slot === 'fore' ? 1820 : loc.worldWidth, loc.worldHeight);
        img.setScrollFactor(scrollFactors[idx], 0);
        img.setDepth(depths[idx]);
        this.roomObjects.push(img);
        layerSprites.push(img);

        const relPath = envManifest[slot];
        if (relPath && !this.textures.exists(customKey)) {
          void this.loadImageToTexture(customKey, relPath).then((ok) => {
            if (ok && seq === this.loadSeq && img.scene) {
              img.setTexture(customKey);
              img.setDisplaySize(slot === 'fore' ? 1820 : loc.worldWidth, loc.worldHeight);
            }
          });
        }
      });

      // Render suspects stationed in this room immediately with fallback or custom sprite, then hot-swap when loaded
      CHARACTER_LIST.filter((c) => c.locationId === locationId).forEach((char) => {
        const customKey = `custom_character_${char.id}`;
        const spriteKey = this.textures.exists(customKey)
          ? customKey
          : buildCharacterSpriteTexture(this, char);

        const spr = this.add.image(char.spriteX, char.spriteY + 225, spriteKey).setOrigin(0.5, 1);
        spr.setScale(char.spriteHeight / spr.height);
        spr.setScrollFactor(0.55, 0);
        spr.setDepth(28);
        this.roomObjects.push(spr);

        const startBreathe = () => {
          this.tweens.killTweensOf(spr);
          const restingScaleY = spr.scaleY;
          this.tweens.add({
            targets: spr,
            scaleY: restingScaleY * 1.012,
            duration: 2100 + Math.random() * 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        };
        startBreathe();

        const url = manifest.sprites[char.id];
        if (url && !this.textures.exists(customKey)) {
          void this.loadImageToTexture(customKey, url).then((ok) => {
            if (ok && seq === this.loadSeq && spr.scene) {
              spr.setTexture(customKey);
              spr.setScale(char.spriteHeight / spr.height);
              startBreathe();
            }
          });
        }
      });

      this.rebuildHotspots();
      this.targetScrollX = 220;
      this.cameras.main.scrollX = 220;

      soundEngine.applyProfile(loc.audio);
      if (fade) {
        this.tweens.killTweensOf(this.transitionOverlay);
        this.transitionOverlay.setAlpha(1);
        this.tweens.add({
          targets: this.transitionOverlay,
          alpha: 0,
          duration: 220,
          ease: 'Quad.easeOut'
        });
      } else {
        this.transitionOverlay.setAlpha(0);
      }
    };

    this.tweens.killTweensOf(this.transitionOverlay);
    if (fade) {
      soundEngine.playSfx('door');
      this.tweens.add({
        targets: this.transitionOverlay,
        alpha: 1,
        duration: 140,
        ease: 'Quad.easeIn',
        onComplete: performLoad
      });
    } else {
      performLoad();
    }
  }

  private rebuildHotspots() {
    this.hotspotObjs.forEach((h) => {
      h.zone.destroy();
      h.badge.destroy();
    });
    this.hotspotObjs = [];

    const state = gameStore.getState();
    const loc = LOCATIONS[this.currentLocationId];

    loc.hotspots.forEach((hp) => {
      if (hp.requiredFlag && !state.flags.includes(hp.requiredFlag)) return;
      if (hp.hiddenIfFlag && state.flags.includes(hp.hiddenIfFlag)) return;

      const scrollFactor = hp.depthLayer === 'foreground' ? 0.55 : 0.55;
      const depth = hp.depthLayer === 'foreground' ? 45 : 35;

      // Match conversation targets to the visible character, not the old placeholder.
      const character = hp.type === 'talk'
        ? CHARACTER_LIST.find((c) => c.id === hp.characterId)
        : undefined;
      const zoneHeight = character?.spriteHeight ?? hp.height;
      const zoneWidth = character ? character.spriteHeight * 0.4 : hp.width;
      const zoneX = character?.spriteX ?? hp.x;
      const zoneY = character ? character.spriteY + 225 - zoneHeight / 2 : hp.y;

      const zone = this.add
        .zone(zoneX, zoneY, zoneWidth, zoneHeight)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(scrollFactor, 0)
        .setDepth(depth + 2);

      const isCollected = hp.collectClueId && state.inventory.includes(hp.collectClueId);
      const isExamined = state.examinedHotspots.includes(hp.id);

      // Subtle pin indicator so players can find interactive objects effortlessly
      const pin = this.add.circle(0, 0, 5, isCollected ? 0x6c7369 : 0xd8a852, isCollected ? 0.35 : 0.8);
      const ring = this.add.circle(0, 0, 9, 0xd8a852, 0).setStrokeStyle(1.4, 0xd8a852, isCollected ? 0.2 : 0.55);
      const badgeY = character ? zoneY - zoneHeight * 0.56 : zoneY - zoneHeight * 0.32;
      const badge = this.add.container(zoneX, badgeY, [ring, pin]);
      badge.setScrollFactor(scrollFactor, 0);
      badge.setDepth(depth + 3);
      if (isExamined && hp.type === 'examine') {
        pin.setAlpha(0.42);
        ring.setAlpha(0.25);
      }

      const restingPinAlpha = pin.alpha;
      const restingRingAlpha = ring.alpha;
      const resetMarker = () => {
        badge.setScale(1);
        pin.setAlpha(restingPinAlpha);
        ring.setAlpha(restingRingAlpha);
        ring.setStrokeStyle(1.4, 0xd8a852, isCollected ? 0.2 : 0.55);
      };

      zone.on('pointerover', () => {
        if (this.isUiBlocking()) return;
        // Emphasize only the small marker; hit areas remain invisible.
        badge.setScale(1.3);
        pin.setAlpha(1);
        ring.setAlpha(1).setStrokeStyle(1.8, hp.type === 'move' ? 0x7eb2c9 : 0xe0ba63, 0.95);
        gameStore.setHoverHint({
          label: hp.label,
          actionType: hp.type.toUpperCase()
        });
      });

      zone.on('pointerout', () => {
        resetMarker();
        gameStore.setHoverHint(null);
      });

      zone.on('pointerup', () => {
        if (this.isUiBlocking() || this.hasDragged) return;
        resetMarker();
        soundEngine.playSfx(hp.type === 'collect' ? 'pickup' : 'click');
        gameStore.setHoverHint(null);
        gameStore.handleHotspotInteraction(hp.id);
      });

      this.hotspotObjs.push({ def: hp, zone, badge });
    });
  }

  update(time: number, delta: number) {
    const dt = delta / 1000;
    const loc = LOCATIONS[this.currentLocationId];
    const blocking = this.isUiBlocking();

    // Update rain streaks
    this.rainGraphics.clear();
    if (loc && loc.audio.rainIntensity > 0.15) {
      this.rainGraphics.lineStyle(1.3, 0xa8c2dc, 0.22 * loc.audio.rainIntensity);
      for (const drop of this.rainDrops) {
        drop.y += drop.speed * dt;
        drop.x -= 95 * dt;
        if (drop.y > 740) {
          drop.y = -20;
          drop.x = Math.random() * 1650;
        }
        if (drop.x < -30) drop.x += 1650;
        this.rainGraphics.lineBetween(drop.x, drop.y, drop.x - 4, drop.y + drop.len);
      }
    }

    // Update floating dust motes
    for (const p of this.dustParticles) {
      p.g.x += p.vx * dt;
      p.g.y += p.vy * dt;
      if (p.g.y < 120) p.g.y = 600;
      if (p.g.x < 100) p.g.x = 1480;
      if (p.g.x > 1480) p.g.x = 100;
      p.g.setAlpha(p.baseAlpha + Math.sin(time * 0.002 + p.g.x) * 0.05);
    }

    // Occasional lightning flash
    if (loc && loc.audio.thunderChance > 0.2 && time > this.nextLightningAt) {
      this.nextLightningAt = time + 11000 + Math.random() * 14000;
      this.tweens.add({
        targets: this.lightningOverlay,
        alpha: { from: 0.28, to: 0 },
        duration: 420,
        ease: 'Quad.easeOut'
      });
      if (Math.random() < 0.7) {
        soundEngine.playThunder();
      }
    }

    // Smooth camera panning via desktop edge-hover, touch drag, or keyboard
    if (!blocking) {
      const pointer = this.input.activePointer;
      if (
        !pointer.wasTouch &&
        !this.isDragging &&
        pointer.x >= 0 &&
        pointer.x <= 1280 &&
        pointer.y >= 0 &&
        pointer.y <= 720
      ) {
        const normX = Phaser.Math.Clamp(pointer.x / 1280, 0, 1);
        // Deadzone in center [0.35..0.65], pan smoothly outside
        if (normX < 0.36) {
          this.targetScrollX -= (0.36 - normX) * 820 * dt;
        } else if (normX > 0.64) {
          this.targetScrollX += (normX - 0.64) * 820 * dt;
        }
      }

      if (this.cursors?.left.isDown || this.keyA?.isDown) {
        this.targetScrollX -= 440 * dt;
      }
      if (this.cursors?.right.isDown || this.keyD?.isDown) {
        this.targetScrollX += 440 * dt;
      }
    }

    this.targetScrollX = Phaser.Math.Clamp(this.targetScrollX, 0, 582);
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, this.targetScrollX, 0.11);
  }
}

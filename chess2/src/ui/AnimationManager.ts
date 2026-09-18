import { GameState } from '../game/GameState';
import { Player } from '../game/Player';
import { ShieldSystem, RelativeDirection } from '../game/ShieldSystem';
import type { ShieldInfo } from '../game/ShieldSystem';
import { EffectsManager } from './EffectsManager';

/**
 * AnimationManager — handles:
 *   1. Piece movement fly animations (overlay element, does NOT mutate GameState)
 *   2. Shield overlay rendering (reads ShieldSystem.getShieldInfo — no rules duplicated)
 *   3. Input lock during animations (max 300ms safety cap)
 */
export class AnimationManager {
  private animating = false;
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly MOVE_DURATION = 180; // ms

  // ── Animating lock ─────────────────────────────────────────────────────────
  public isAnimating(): boolean {
    return this.animating;
  }

  private lock(): void {
    this.animating = true;
    // Safety cap: always release within 300ms
    if (this.safetyTimer) clearTimeout(this.safetyTimer);
    this.safetyTimer = setTimeout(() => { this.animating = false; }, 300);
  }

  private unlock(): void {
    this.animating = false;
    if (this.safetyTimer) clearTimeout(this.safetyTimer);
  }

  // ── Move animation ─────────────────────────────────────────────────────────
  /**
   * Animates a piece flying from fromEl to toEl over the board.
   * The overlay element is created, animated via CSS transform, then removed.
   * onComplete fires when done (BoardRenderer calls render() there).
   */
  public animateMove(
    fromEl: HTMLElement,
    toEl: HTMLElement,
    pieceSymbol: string,
    pieceClass: string,
    onComplete: () => void
  ): void {
    if (EffectsManager.isReducedMotion()) {
      // Instant — just call onComplete immediately
      this.lock();
      requestAnimationFrame(() => { this.unlock(); onComplete(); });
      return;
    }

    this.lock();

    const fromRect = fromEl.getBoundingClientRect();
    const toRect   = toEl.getBoundingClientRect();

    // Create flying piece element
    const fly = document.createElement('span');
    fly.className = `piece ${pieceClass} flying-piece`;
    fly.textContent = pieceSymbol;
    fly.style.cssText = `
      position: fixed;
      left: ${fromRect.left + fromRect.width / 2}px;
      top:  ${fromRect.top  + fromRect.height / 2}px;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 9999;
      transition: left ${this.MOVE_DURATION}ms cubic-bezier(0.25,0.1,0.25,1),
                  top  ${this.MOVE_DURATION}ms cubic-bezier(0.25,0.1,0.25,1);
      will-change: left, top;
    `;
    document.body.appendChild(fly);

    // Trigger transition on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fly.style.left = `${toRect.left + toRect.width / 2}px`;
        fly.style.top  = `${toRect.top  + toRect.height / 2}px`;
      });
    });

    setTimeout(() => {
      fly.remove();
      this.unlock();
      onComplete();
    }, this.MOVE_DURATION + 20);
  }

  // ── Shield overlay rendering ───────────────────────────────────────────────
  /**
   * Renders directional shield arc overlays on the board.
   * Reads ShieldSystem.getShieldInfo() — no rule logic duplicated here.
   *
   * @param container   The board-container element
   * @param gameState   Current game state (read-only)
   * @param squareFn    Function to find a square element by file/rank
   * @param playtestMode Whether to show stronger debug shield indicators
   */
  public renderShieldOverlays(
    container: HTMLElement,
    gameState: GameState,
    squareFn: (file: number, rank: number) => HTMLElement | null,
    playtestMode: boolean
  ): void {
    // Remove existing shield overlays
    container.querySelectorAll('.shield-overlay, .shield-glow').forEach(el => el.remove());

    // Collect shield info from engine for both players
    const allInfo: ShieldInfo[] = [
      ...ShieldSystem.getShieldInfo(gameState, Player.White),
      ...ShieldSystem.getShieldInfo(gameState, Player.Black)
    ];

    for (const info of allInfo) {
      const ownerClass = info.guardOwner === Player.White ? 'shield-white' : 'shield-black';

      for (const target of info.targets) {
        const sq = squareFn(target.targetPos.file, target.targetPos.rank);
        if (!sq) continue;

        // Glow outline on protected piece
        const glowEl = document.createElement('div');
        glowEl.className = `shield-glow ${ownerClass}`;
        sq.appendChild(glowEl);

        // Directional shield arcs for each protected direction
        for (const dir of target.protectedDirections) {
          const arcEl = document.createElement('div');
          const dirClass = AnimationManager.dirToClass(dir, info.guardOwner);
          arcEl.className = `shield-overlay ${ownerClass} ${dirClass}`;
          if (playtestMode) arcEl.classList.add('shield-debug');
          sq.appendChild(arcEl);
        }
      }
    }
  }

  // Maps a RelativeDirection to a CSS class name for its directional arc
  private static dirToClass(dir: RelativeDirection, owner: Player): string {
    // "Front" is owner-relative. For White, Front = up (high rank) → CSS class indicates screen direction.
    const isWhite = owner === Player.White;
    switch (dir) {
      case RelativeDirection.Front:     return isWhite ? 'sd-top'    : 'sd-bottom';
      case RelativeDirection.FrontLeft: return isWhite ? 'sd-topleft' : 'sd-bottomright';
      case RelativeDirection.FrontRight:return isWhite ? 'sd-topright': 'sd-bottomleft';
      case RelativeDirection.Back:      return isWhite ? 'sd-bottom'  : 'sd-top';
      case RelativeDirection.Left:      return isWhite ? 'sd-left'    : 'sd-right';
      case RelativeDirection.Right:     return isWhite ? 'sd-right'   : 'sd-left';
      default: return 'sd-unknown';
    }
  }
}

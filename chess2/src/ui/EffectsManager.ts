/**
 * EffectsManager — one-shot visual effect triggers.
 *
 * This class applies CSS animation classes to DOM elements based on
 * ENGINE-REPORTED events (captured from MoveRecord or GameStatus).
 * It never calculates game rules.
 */
export class EffectsManager {
  private static readonly ANIM_DURATION = 600; // ms

  // ── Check pulse ────────────────────────────────────────────────────────────
  /**
   * Triggers a red pulse ring around a King's square when it newly enters check.
   * Called by BoardRenderer after detecting check changed from false → true.
   */
  public static triggerCheckPulse(squareEl: HTMLElement): void {
    if (EffectsManager.isReducedMotion()) {
      squareEl.classList.add('check-highlight-static');
      return;
    }
    EffectsManager.oneShot(squareEl, 'check-pulse-anim', 800);
  }

  // ── Checkmate ──────────────────────────────────────────────────────────────
  /**
   * Applies a persistent checkmate glow on the losing King's square.
   * Stays until clearEffects() is called.
   */
  public static triggerCheckmateEffect(squareEl: HTMLElement): void {
    squareEl.classList.add('checkmate-fx');
  }

  // ── Center Victory ─────────────────────────────────────────────────────────
  /**
   * Triggers a radial ripple on e5 and outward through the central zone.
   * Called only when engine reports GameStatus.CenterVictory.
   */
  public static triggerCenterVictory(
    e5El: HTMLElement,
    centralEls: HTMLElement[]
  ): void {
    if (EffectsManager.isReducedMotion()) {
      e5El.classList.add('center-victory-static');
      return;
    }
    EffectsManager.oneShot(e5El, 'center-victory-burst', 1200);
    // Stagger the surrounding central squares
    centralEls.forEach((el, idx) => {
      setTimeout(() => {
        EffectsManager.oneShot(el, 'center-ripple-anim', 800);
      }, idx * 60);
    });
  }

  // ── Minister conversion ────────────────────────────────────────────────────
  /**
   * Flashes the intermediate (converted Pawn) square.
   * MUST ONLY be called when engine MoveRecord.ministerConversionOccurred === true.
   */
  public static triggerMinisterConversion(intermediateEl: HTMLElement): void {
    if (EffectsManager.isReducedMotion()) {
      EffectsManager.oneShot(intermediateEl, 'convert-highlight-static', 800);
      return;
    }
    EffectsManager.oneShot(intermediateEl, 'minister-convert-anim', 900);
  }

  // ── Capture ────────────────────────────────────────────────────────────────
  /**
   * Briefly flashes a capture impact on the destination square.
   */
  public static triggerCapture(destEl: HTMLElement): void {
    if (EffectsManager.isReducedMotion()) return;
    EffectsManager.oneShot(destEl, 'capture-impact-anim', 350);
  }

  // ── Promotion ──────────────────────────────────────────────────────────────
  /**
   * Glows the promotion square after the new piece appears.
   */
  public static triggerPromotion(squareEl: HTMLElement): void {
    if (EffectsManager.isReducedMotion()) {
      EffectsManager.oneShot(squareEl, 'promote-highlight-static', 600);
      return;
    }
    EffectsManager.oneShot(squareEl, 'promotion-appear-anim', 600);
  }

  // ── Invalid move ───────────────────────────────────────────────────────────
  /**
   * Short shake/flash on an invalid click target.
   */
  public static triggerInvalid(squareEl: HTMLElement): void {
    if (EffectsManager.isReducedMotion()) return;
    EffectsManager.oneShot(squareEl, 'flash-invalid', 400);
  }

  // ── Clear all persistent effects ──────────────────────────────────────────
  public static clearEffects(container: HTMLElement): void {
    const classes = [
      'check-pulse-anim', 'check-highlight-static',
      'checkmate-fx', 'center-victory-burst', 'center-victory-static',
      'center-ripple-anim', 'minister-convert-anim', 'convert-highlight-static',
      'capture-impact-anim', 'promotion-appear-anim', 'promote-highlight-static',
      'flash-invalid'
    ];
    container.querySelectorAll(`.${classes.join(', .')}`).forEach(el => {
      classes.forEach(c => el.classList.remove(c));
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private static oneShot(el: HTMLElement, cls: string, durationMs: number): void {
    el.classList.remove(cls);
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), durationMs);
  }

  public static isReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

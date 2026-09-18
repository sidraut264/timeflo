import { GameState, GameStatus } from '../game/GameState';
import { Board, LegalMove } from '../game/Board';
import type { Position } from '../game/Board';
import { PieceType } from '../game/Piece';
import { Player } from '../game/Player';
import { EffectsManager } from './EffectsManager';
import { AnimationManager } from './AnimationManager';

// Piece symbols using Unicode chess pieces for visual richness
const PIECE_SYMBOLS: Record<string, Record<string, string>> = {
  white: {
    [PieceType.King]:       'K',
    [PieceType.Queen]:      'Q',
    [PieceType.Rook]:       'R',
    [PieceType.Bishop]:     'B',
    [PieceType.Knight]:     'N',
    [PieceType.Pawn]:       'P',
    [PieceType.Minister]:   'M',
    [PieceType.RoyalGuard]: 'G',
  },
  black: {
    [PieceType.King]:       'K',
    [PieceType.Queen]:      'Q',
    [PieceType.Rook]:       'R',
    [PieceType.Bishop]:     'B',
    [PieceType.Knight]:     'N',
    [PieceType.Pawn]:       'P',
    [PieceType.Minister]:   'M',
    [PieceType.RoyalGuard]: 'G',
  },
};

const TYPE_NAMES: Record<string, string> = {
  [PieceType.King]:       'King',
  [PieceType.Queen]:      'Queen',
  [PieceType.Rook]:       'Rook',
  [PieceType.Bishop]:     'Bishop',
  [PieceType.Knight]:     'Knight',
  [PieceType.Pawn]:       'Pawn',
  [PieceType.Minister]:   'Minister',
  [PieceType.RoyalGuard]: 'Guard',
  [PieceType.Diplomat]:   'Diplomat',
};

// Central 3×3 zone: files 3–5 (d–f), ranks 3–5 (4–6)
const CENTRAL_ZONE = new Set<string>();
for (let f = 3; f <= 5; f++) for (let r = 3; r <= 5; r++) CENTRAL_ZONE.add(`${f},${r}`);

function coordStr(pos: Position): string {
  return String.fromCharCode('a'.charCodeAt(0) + pos.file) + (pos.rank + 1);
}

export class BoardRenderer {
  private container: HTMLElement;
  private gameState: GameState;

  // UI-only state
  private selectedSquare: Position | null = null;
  private currentLegalMoves: LegalMove[] = [];

  // Pending promotion info
  private pendingPromoFrom: Position | null = null;
  private pendingPromoTo: Position | null = null;

  // Playtest editor hook
  private playtestInterceptor: ((file: number, rank: number) => boolean) | null = null;
  private isPlaytestActive = false;

  // Effect / animation managers
  private readonly effects = new (class {
    triggerCheckPulse = EffectsManager.triggerCheckPulse.bind(EffectsManager);
    triggerCheckmateEffect = EffectsManager.triggerCheckmateEffect.bind(EffectsManager);
    triggerCenterVictory = EffectsManager.triggerCenterVictory.bind(EffectsManager);
    triggerMinisterConversion = EffectsManager.triggerMinisterConversion.bind(EffectsManager);
    triggerCapture = EffectsManager.triggerCapture.bind(EffectsManager);
    triggerPromotion = EffectsManager.triggerPromotion.bind(EffectsManager);
    triggerInvalid = EffectsManager.triggerInvalid.bind(EffectsManager);
    clearEffects = EffectsManager.clearEffects.bind(EffectsManager);
    isReducedMotion = EffectsManager.isReducedMotion.bind(EffectsManager);
  })();
  private readonly anim = new AnimationManager();

  // Check state tracking (only pulse on newly entering check)
  private prevWhiteInCheck = false;
  private prevBlackInCheck = false;

  constructor(containerId: string, gameState: GameState) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.gameState = gameState;

    this.bindStaticControls();
    this.bindPromotionModal();
    this.bindGameoverReset();
  }

  // ── Accessors and Hooks ─────────────────────────────────────────────────
  public setGameState(newState: GameState): void {
    this.gameState = newState;
    this.selectedSquare = null;
    this.currentLegalMoves = [];
    this.pendingPromoFrom = null;
    this.pendingPromoTo = null;
    // Reset check tracking so effects fire fresh after scenario load
    this.prevWhiteInCheck = false;
    this.prevBlackInCheck = false;
    EffectsManager.clearEffects(this.container);
  }

  public getSelectedSquare(): Position | null {
    return this.selectedSquare;
  }

  public setPlaytestInterceptor(interceptor: (file: number, rank: number) => boolean): void {
    this.playtestInterceptor = interceptor;
  }

  public setPlaytestActive(active: boolean): void {
    this.isPlaytestActive = active;
  }

  // ── Static element bindings ─────────────────────────────────────────────
  private bindStaticControls(): void {
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleReset());
    }
  }

  private bindPromotionModal(): void {
    const modal = document.getElementById('promotion-modal');
    const cancelBtn = document.getElementById('promotion-cancel');
    const choices = document.querySelectorAll<HTMLButtonElement>('.promotion-btn');

    choices.forEach(btn => {
      btn.addEventListener('click', () => {
        const typeName = btn.dataset.type;
        if (!typeName) return;

        const typeMap: Record<string, PieceType> = {
          Queen: PieceType.Queen, Rook: PieceType.Rook,
          Bishop: PieceType.Bishop, Knight: PieceType.Knight,
        };
        const chosenType = typeMap[typeName];
        if (!chosenType) return;

        this.hidePromotionModal();
        if (this.pendingPromoFrom && this.pendingPromoTo) {
          const toPos = this.pendingPromoTo;
          const success = this.gameState.makeMove(this.pendingPromoFrom, toPos, chosenType);
          this.pendingPromoFrom = null;
          this.pendingPromoTo = null;
          this.selectedSquare = null;
          this.currentLegalMoves = [];
          if (success) {
            this.render();
            // Trigger promotion glow after render
            requestAnimationFrame(() => {
              const sq = this.getSquareEl(toPos.file, toPos.rank);
              if (sq) EffectsManager.triggerPromotion(sq);
            });
          }
        }
      });
    });

    cancelBtn?.addEventListener('click', () => {
      this.hidePromotionModal();
      this.pendingPromoFrom = null;
      this.pendingPromoTo = null;
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modal && !modal.hidden) {
          this.hidePromotionModal();
          this.pendingPromoFrom = null;
          this.pendingPromoTo = null;
        }
      }
    });

    modal?.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusable = Array.from(
          modal.querySelectorAll<HTMLElement>('button:not([disabled])')
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  private bindGameoverReset(): void {
    document.getElementById('gameover-reset')?.addEventListener('click', () => this.handleReset());
  }

  // ── Reset ────────────────────────────────────────────────────────────────
  private handleReset(): void {
    this.gameState.reset();
    this.selectedSquare = null;
    this.currentLegalMoves = [];
    this.pendingPromoFrom = null;
    this.pendingPromoTo = null;
    this.prevWhiteInCheck = false;
    this.prevBlackInCheck = false;
    EffectsManager.clearEffects(this.container);
    this.hidePromotionModal();
    this.hideGameoverOverlay();
    this.clearMessage();
    this.render();
  }

  // ── Main render ──────────────────────────────────────────────────────────
  public render(): void {
    this.renderBoard();
    this.renderShields();
    this.renderStatusPanel();
    this.renderMoveHistory();
    this.dispatchEffects();

    if (this.gameState.isGameOver()) {
      this.showGameoverOverlay();
    }
  }

  // ── Board rendering ──────────────────────────────────────────────────────
  private renderBoard(): void {
    this.container.innerHTML = '';

    const centerHoldPlayer = this.gameState.centerHold?.player ?? null;

    for (let rank = Board.RANKS - 1; rank >= 0; rank--) {
      for (let file = 0; file < Board.FILES; file++) {
        const sq = this.createSquare(file, rank, centerHoldPlayer);
        this.container.appendChild(sq);
      }
    }
  }

  private createSquare(file: number, rank: number, centerHoldPlayer: Player | null): HTMLElement {
    const sq = document.createElement('div');
    sq.className = 'square';
    sq.setAttribute('role', 'gridcell');
    sq.dataset.file = String(file);
    sq.dataset.rank = String(rank);

    const isLight = (file + rank) % 2 !== 0;
    sq.classList.add(isLight ? 'light' : 'dark');

    // Central 3×3 zone
    const isCentral = CENTRAL_ZONE.has(`${file},${rank}`);
    if (isCentral) sq.classList.add('central-zone');

    // Center square e5
    const isCenter = file === 4 && rank === 4;
    if (isCenter) {
      if (centerHoldPlayer !== null) {
        sq.classList.add('center-hold');
      } else {
        sq.classList.add('center-sq');
      }
    }

    // Selected
    if (this.selectedSquare?.file === file && this.selectedSquare?.rank === rank) {
      sq.classList.add('selected');
    }

    // Legal move / capture / promote highlights
    const matchingMoves = this.currentLegalMoves.filter(m => m.file === file && m.rank === rank);
    if (matchingMoves.length > 0) {
      const piece = this.gameState.board.getPiece({ file, rank });
      if (matchingMoves.some(m => m.promotionType !== undefined)) {
        sq.classList.add('can-promote');
        sq.setAttribute('aria-label', `Promotion destination ${coordStr({ file, rank })}`);
      } else if (piece && piece.type !== PieceType.Diplomat) {
        sq.classList.add('can-capture');
        sq.setAttribute('aria-label', `Capture ${coordStr({ file, rank })}`);
      } else {
        sq.classList.add('can-move');
        sq.setAttribute('aria-label', `Move to ${coordStr({ file, rank })}`);
      }
    }

    // Piece
    const piece = this.gameState.board.getPiece({ file, rank });
    if (piece) {
      const pieceEl = document.createElement('span');
      pieceEl.className = 'piece';

      if (piece.type === PieceType.Diplomat) {
        pieceEl.classList.add('diplomat-piece');
        pieceEl.textContent = 'D';
        sq.setAttribute('aria-label', `Diplomat at ${coordStr({ file, rank })} (neutral)`);
      } else {
        const owner = piece.owner === Player.White ? 'white' : 'black';
        pieceEl.classList.add(`${owner}-piece`);
        pieceEl.textContent = PIECE_SYMBOLS[owner]?.[piece.type] ?? '?';

        const playerName = owner.charAt(0).toUpperCase() + owner.slice(1);
        sq.setAttribute('aria-label',
          `${playerName} ${TYPE_NAMES[piece.type] ?? piece.type} at ${coordStr({ file, rank })}`
        );

        // Check indicator (persistent visual — separate from the pulse animation)
        if (piece.type === PieceType.King && this.gameState.isKingInCheck(piece.owner)) {
          sq.classList.add('in-check');
          sq.setAttribute('aria-label', sq.getAttribute('aria-label') + ' (in CHECK)');
        }
      }
      sq.appendChild(pieceEl);
    } else {
      sq.setAttribute('aria-label', `Empty ${coordStr({ file, rank })}`);
    }

    // Click handler
    sq.addEventListener('click', () => this.handleSquareClick(file, rank));

    return sq;
  }

  // ── Shield overlay rendering ─────────────────────────────────────────────
  private renderShields(): void {
    this.anim.renderShieldOverlays(
      this.container,
      this.gameState,
      (file, rank) => this.getSquareEl(file, rank),
      this.isPlaytestActive
    );
  }

  // ── Effect dispatcher ────────────────────────────────────────────────────
  /**
   * Reads engine state and last MoveRecord to dispatch one-shot visual effects.
   * Does NOT calculate any game rules.
   */
  private dispatchEffects(): void {
    // Check/checkmate effects
    const whiteInCheck = this.gameState.isKingInCheck(Player.White);
    const blackInCheck = this.gameState.isKingInCheck(Player.Black);

    if (this.gameState.gameStatus === GameStatus.Finished) {
      // Checkmate — find losing king and apply checkmate glow
      const losingPlayer = this.gameState.winner === Player.White ? Player.Black : Player.White;
      const losingKingPos = this.findKing(losingPlayer);
      if (losingKingPos) {
        const sq = this.getSquareEl(losingKingPos.file, losingKingPos.rank);
        if (sq) EffectsManager.triggerCheckmateEffect(sq);
      }
    } else {
      // Check pulse — only fire when newly entering check
      if (whiteInCheck && !this.prevWhiteInCheck) {
        const kingPos = this.findKing(Player.White);
        if (kingPos) {
          const sq = this.getSquareEl(kingPos.file, kingPos.rank);
          if (sq) EffectsManager.triggerCheckPulse(sq);
        }
      }
      if (blackInCheck && !this.prevBlackInCheck) {
        const kingPos = this.findKing(Player.Black);
        if (kingPos) {
          const sq = this.getSquareEl(kingPos.file, kingPos.rank);
          if (sq) EffectsManager.triggerCheckPulse(sq);
        }
      }
    }

    // Center victory
    if (this.gameState.gameStatus === GameStatus.CenterVictory) {
      const e5Sq = this.getSquareEl(4, 4);
      const centralSqs: HTMLElement[] = [];
      CENTRAL_ZONE.forEach(key => {
        const [f, r] = key.split(',').map(Number);
        if (f !== 4 || r !== 4) {
          const sq = this.getSquareEl(f, r);
          if (sq) centralSqs.push(sq);
        }
      });
      if (e5Sq) EffectsManager.triggerCenterVictory(e5Sq, centralSqs);
    }

    // Minister conversion and capture — read from last MoveRecord
    const history = this.gameState.moveHistory;
    const lastMove = history[history.length - 1];
    if (lastMove) {
      if (lastMove.ministerConversionOccurred) {
        // Intermediate square is midpoint of from→to
        const midFile = (lastMove.from.file + lastMove.to.file) / 2;
        const midRank = (lastMove.from.rank + lastMove.to.rank) / 2;
        if (Number.isInteger(midFile) && Number.isInteger(midRank)) {
          const midSq = this.getSquareEl(midFile, midRank);
          if (midSq) {
            // Small delay so render settles first
            setTimeout(() => EffectsManager.triggerMinisterConversion(midSq), 80);
          }
        }
      }
      if (lastMove.capturedPieceType) {
        const destSq = this.getSquareEl(lastMove.to.file, lastMove.to.rank);
        if (destSq) EffectsManager.triggerCapture(destSq);
      }
    }

    // Update check tracking
    this.prevWhiteInCheck = whiteInCheck;
    this.prevBlackInCheck = blackInCheck;
  }

  // ── Status panel ─────────────────────────────────────────────────────────
  private renderStatusPanel(): void {
    const turnPlayerEl = document.getElementById('turn-player');
    if (turnPlayerEl) {
      if (this.gameState.isGameOver()) {
        turnPlayerEl.textContent = '—';
        turnPlayerEl.className = 'turn-player';
      } else {
        const isWhite = this.gameState.currentPlayer === Player.White;
        turnPlayerEl.textContent = isWhite ? 'White' : 'Black';
        turnPlayerEl.className = 'turn-player ' + (isWhite ? 'white-text' : 'black-text');
      }
    }

    if (!this.gameState.isGameOver()) {
      const inCheck = this.gameState.isKingInCheck(this.gameState.currentPlayer);
      const hasHold = this.gameState.centerHold !== null;

      if (inCheck) {
        const p = this.gameState.currentPlayer === Player.White ? 'White' : 'Black';
        this.setMessage(`⚠ ${p} King is in CHECK!`, 'msg-check');
      } else if (hasHold) {
        const h = this.gameState.centerHold!.player === Player.White ? 'White' : 'Black';
        this.setMessage(`★ ${h} King is holding the center!`, 'msg-center');
      } else {
        this.clearMessage();
      }
    }
  }

  // ── Move history ─────────────────────────────────────────────────────────
  private renderMoveHistory(): void {
    const list = document.getElementById('move-history-list');
    if (!list) return;

    list.innerHTML = '';
    const records = this.gameState.moveHistory;

    records.forEach((rec, idx) => {
      const li = document.createElement('li');
      li.className = rec.player === Player.White ? 'mv-white' : 'mv-black';

      const num = document.createElement('span');
      num.className = 'mv-num';
      num.textContent = `${idx + 1}.`;

      const playerStr = rec.player === Player.White ? 'W' : 'B';
      const pieceStr = TYPE_NAMES[rec.movedPieceType]?.[0] ?? '?';
      const fromStr = coordStr(rec.from);
      const toStr = coordStr(rec.to);

      const main = document.createElement('span');
      main.textContent = `${playerStr}: ${pieceStr} ${fromStr} → ${toStr}`;

      li.appendChild(num);
      li.appendChild(main);

      if (rec.capturedPieceType) {
        li.appendChild(this.makeTag('✕ capture', 'capture'));
      }
      if (rec.promotedPieceType) {
        const pname = TYPE_NAMES[rec.promotedPieceType] ?? rec.promotedPieceType;
        li.appendChild(this.makeTag(`⇑ ${pname}`, 'promote'));
      }
      if (rec.ministerConversionOccurred) {
        li.appendChild(this.makeTag('⤷ converted', 'convert'));
      }
      if (rec.centerHoldStarted) {
        li.appendChild(this.makeTag('★ center', 'center'));
      }
      if (rec.resultingGameStatus === GameStatus.Finished ||
          rec.resultingGameStatus === GameStatus.CenterVictory) {
        li.appendChild(this.makeTag('✓ end', 'check'));
      }

      list.appendChild(li);
    });

    list.scrollTop = list.scrollHeight;
  }

  private makeTag(text: string, cls: string): HTMLElement {
    const tag = document.createElement('span');
    tag.className = `mv-tag ${cls}`;
    tag.textContent = text;
    return tag;
  }

  // ── Square click handler ─────────────────────────────────────────────────
  private handleSquareClick(file: number, rank: number): void {
    // Playtest editor intercept
    if (this.playtestInterceptor && this.playtestInterceptor(file, rank)) {
      return;
    }

    // Block input during movement animation
    if (this.anim.isAnimating()) return;

    if (this.gameState.isGameOver()) return;

    const clickedPos = { file, rank };
    const matchingMoves = this.currentLegalMoves.filter(m => m.file === file && m.rank === rank);

    if (this.selectedSquare && matchingMoves.length > 0) {
      const needsPromotion = matchingMoves.some(m => m.promotionType !== undefined);

      if (needsPromotion) {
        this.pendingPromoFrom = this.selectedSquare;
        this.pendingPromoTo = clickedPos;
        this.showPromotionModal();
        return;
      }

      // Animated normal move
      const fromPos = this.selectedSquare;
      const fromEl  = this.getSquareEl(fromPos.file, fromPos.rank);
      const toEl    = this.getSquareEl(file, rank);
      const movingPiece = this.gameState.board.getPiece(fromPos);

      if (fromEl && toEl && movingPiece && !EffectsManager.isReducedMotion()) {
        const owner = movingPiece.owner === Player.White ? 'white' : 'black';
        const symbol = PIECE_SYMBOLS[owner]?.[movingPiece.type] ?? '?';
        const pieceClass = `${owner}-piece`;

        const success = this.gameState.makeMove(fromPos, clickedPos);
        if (success) {
          this.selectedSquare = null;
          this.currentLegalMoves = [];
          // Animate then render
          this.anim.animateMove(fromEl, toEl, symbol, pieceClass, () => {
            this.render();
          });
        }
        return;
      }

      // Fallback: instant move (reduced-motion or no elements found)
      const success = this.gameState.makeMove(fromPos, clickedPos);
      if (success) {
        this.selectedSquare = null;
        this.currentLegalMoves = [];
        this.render();
        return;
      }
    }

    // Try selecting a piece
    const piece = this.gameState.board.getPiece(clickedPos);
    if (piece && piece.owner === this.gameState.currentPlayer) {
      this.selectedSquare = clickedPos;
      this.currentLegalMoves = this.gameState.getLegalMoves(clickedPos);
      this.render();
    } else {
      if (this.selectedSquare) {
        this.selectedSquare = null;
        this.currentLegalMoves = [];
        this.render();
      } else if (piece && piece.owner !== this.gameState.currentPlayer
                 && piece.type !== PieceType.Diplomat) {
        const sq = this.getSquareEl(file, rank);
        if (sq) EffectsManager.triggerInvalid(sq);
        this.flashMessage('Not your turn!', 'msg-invalid');
      }
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  private getSquareEl(file: number, rank: number): HTMLElement | null {
    return this.container.querySelector<HTMLElement>(
      `[data-file="${file}"][data-rank="${rank}"]`
    );
  }

  private findKing(player: Player): Position | null {
    for (let r = 0; r < Board.RANKS; r++) {
      for (let f = 0; f < Board.FILES; f++) {
        const p = this.gameState.board.getPiece({ file: f, rank: r });
        if (p?.type === PieceType.King && p.owner === player) return { file: f, rank: r };
      }
    }
    return null;
  }

  // ── Promotion modal ──────────────────────────────────────────────────────
  private showPromotionModal(): void {
    const modal = document.getElementById('promotion-modal');
    const subtitle = document.getElementById('promotion-subtitle');
    if (!modal) return;

    const playerName = this.gameState.currentPlayer === Player.White ? 'White' : 'Black';
    if (subtitle) subtitle.textContent = `${playerName}'s pawn is promoting. Choose a piece:`;

    modal.hidden = false;

    const firstBtn = modal.querySelector<HTMLButtonElement>('.promotion-btn');
    firstBtn?.focus();
  }

  private hidePromotionModal(): void {
    const modal = document.getElementById('promotion-modal');
    if (modal) modal.hidden = true;
  }

  // ── Game-over overlay ────────────────────────────────────────────────────
  private showGameoverOverlay(): void {
    const overlay = document.getElementById('gameover-overlay');
    const titleEl = document.getElementById('gameover-title');
    const subtitleEl = document.getElementById('gameover-subtitle');
    const iconEl = document.getElementById('gameover-icon');
    if (!overlay) return;

    const winnerName = this.gameState.winner === Player.White ? 'White' : 'Black';

    if (this.gameState.gameStatus === GameStatus.Finished) {
      if (titleEl) titleEl.textContent = 'CHECKMATE!';
      if (subtitleEl) subtitleEl.textContent = `${winnerName} wins the game!`;
      if (iconEl) iconEl.textContent = '♚';
    } else if (this.gameState.gameStatus === GameStatus.CenterVictory) {
      if (titleEl) titleEl.textContent = 'CENTER VICTORY!';
      if (subtitleEl) subtitleEl.textContent = `${winnerName} held e5 and wins!`;
      if (iconEl) iconEl.textContent = '★';
    }

    overlay.hidden = false;
    document.getElementById('gameover-reset')?.focus();
  }

  private hideGameoverOverlay(): void {
    const overlay = document.getElementById('gameover-overlay');
    if (overlay) overlay.hidden = true;
  }

  // ── Message helpers ──────────────────────────────────────────────────────
  private setMessage(text: string, cls: string): void {
    const el = document.getElementById('game-message');
    if (!el) return;
    el.textContent = text;
    el.className = `game-message ${cls}`;
  }

  private clearMessage(): void {
    const el = document.getElementById('game-message');
    if (!el) return;
    el.textContent = '';
    el.className = 'game-message';
  }

  private flashMessage(text: string, cls: string): void {
    this.setMessage(text, cls);
    setTimeout(() => this.clearMessage(), 2000);
  }
}

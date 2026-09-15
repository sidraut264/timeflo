import { GameState, GameStatus } from '../game/GameState';
import { Board, LegalMove } from '../game/Board';
import type { Position } from '../game/Board';
import { PieceType } from '../game/Piece';
import { Player } from '../game/Player';

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

  constructor(containerId: string, gameState: GameState) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.gameState = gameState;

    this.bindStaticControls();
    this.bindPromotionModal();
    this.bindGameoverReset();
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
          const success = this.gameState.makeMove(this.pendingPromoFrom, this.pendingPromoTo, chosenType);
          this.pendingPromoFrom = null;
          this.pendingPromoTo = null;
          this.selectedSquare = null;
          this.currentLegalMoves = [];
          if (success) {
            this.render();
          }
        }
      });
    });

    cancelBtn?.addEventListener('click', () => {
      this.hidePromotionModal();
      this.pendingPromoFrom = null;
      this.pendingPromoTo = null;
    });

    // Keyboard: Escape closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modal && !modal.hidden) {
          this.hidePromotionModal();
          this.pendingPromoFrom = null;
          this.pendingPromoTo = null;
        }
      }
    });

    // Trap focus in modal while open
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
    this.hidePromotionModal();
    this.hideGameoverOverlay();
    this.clearMessage();
    this.render();
  }

  // ── Main render ──────────────────────────────────────────────────────────
  public render(): void {
    this.renderBoard();
    this.renderStatusPanel();
    this.renderMoveHistory();

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

    const isLight = (file + rank) % 2 !== 0;
    sq.classList.add(isLight ? 'light' : 'dark');

    // Center square
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

        // Check indicator
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

    // Persistent (non-flash) messages
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

      // Tags
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

    // Scroll to bottom
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
    if (this.gameState.isGameOver()) return;

    const clickedPos = { file, rank };
    const matchingMoves = this.currentLegalMoves.filter(m => m.file === file && m.rank === rank);

    if (this.selectedSquare && matchingMoves.length > 0) {
      const needsPromotion = matchingMoves.some(m => m.promotionType !== undefined);

      if (needsPromotion) {
        // Store pending move and open modal
        this.pendingPromoFrom = this.selectedSquare;
        this.pendingPromoTo = clickedPos;
        this.showPromotionModal();
        return;
      }

      // Normal move
      const success = this.gameState.makeMove(this.selectedSquare, clickedPos);
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
      // Invalid selection or deselect
      if (this.selectedSquare) {
        // They clicked empty/enemy with a selection active but not a legal destination
        this.selectedSquare = null;
        this.currentLegalMoves = [];
        this.render();
      } else if (piece && piece.owner !== this.gameState.currentPlayer
                 && piece.type !== PieceType.Diplomat) {
        // Clicking an enemy piece when it's not your turn
        this.flashMessage('Not your turn!', 'msg-invalid');
        this.flashSquare(file, rank);
      }
    }
  }

  // ── Promotion modal ──────────────────────────────────────────────────────
  private showPromotionModal(): void {
    const modal = document.getElementById('promotion-modal');
    const subtitle = document.getElementById('promotion-subtitle');
    if (!modal) return;

    const playerName = this.gameState.currentPlayer === Player.White ? 'White' : 'Black';
    if (subtitle) subtitle.textContent = `${playerName}'s pawn is promoting. Choose a piece:`;

    modal.hidden = false;

    // Focus first button
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

  // ── Visual flash for invalid square ─────────────────────────────────────
  private flashSquare(file: number, rank: number): void {
    // Re-render first so we can find the square
    this.render();
    const squares = this.container.querySelectorAll<HTMLElement>('.square');
    const idx = (Board.RANKS - 1 - rank) * Board.FILES + file;
    const sq = squares[idx];
    if (!sq) return;

    sq.classList.add('flash-invalid');
    setTimeout(() => sq.classList.remove('flash-invalid'), 500);
  }
}

import { Board, LegalMove } from './Board';
import type { Position } from './Board';
import { Player } from './Player';
import { Pawn, Rook, Bishop, Knight, Queen, King, RoyalGuard, Minister, Diplomat, PieceType } from './Piece';
import { MovementRules } from './MovementRules';
import { MoveRecord } from './MoveHistory';

export enum GameStatus {
  Playing = 'PLAYING',
  Finished = 'FINISHED',
  CenterVictory = 'CENTER_VICTORY'
}

export class GameState {
  public board: Board;
  public currentPlayer: Player;
  public gameStatus: GameStatus;
  public winner: Player | null;
  public centerHold: { player: Player } | null;
  public moveHistory: MoveRecord[];

  constructor(skipInit = false) {
    this.board = new Board();
    this.currentPlayer = Player.White;
    this.gameStatus = GameStatus.Playing;
    this.winner = null;
    this.centerHold = null;
    this.moveHistory = [];
    
    if (!skipInit) {
      this.initializeBoard();
    }
  }

  public reset(): void {
    this.board = new Board();
    this.currentPlayer = Player.White;
    this.gameStatus = GameStatus.Playing;
    this.winner = null;
    this.centerHold = null;
    this.moveHistory = [];
    this.initializeBoard();
  }

  public clone(): GameState {
    const cloned = new GameState(true);
    cloned.board = this.board.clone();
    cloned.currentPlayer = this.currentPlayer;
    cloned.gameStatus = this.gameStatus;
    cloned.winner = this.winner;
    cloned.centerHold = this.centerHold ? { ...this.centerHold } : null;
    cloned.moveHistory = [...this.moveHistory]; // Shallow copy of history is fine for simulations since they shouldn't mutate it
    return cloned;
  }

  private initializeBoard(): void {
    // White Pieces
    this.setupRank(Player.White, 0, [Rook, Bishop, Knight, Queen, King, Minister, Knight, Bishop, Rook]);
    this.setupRank(Player.White, 1, [Pawn, Pawn, Pawn, Pawn, RoyalGuard, Pawn, Pawn, Pawn, Pawn]);

    // Black Pieces
    this.setupRank(Player.Black, 8, [Rook, Bishop, Knight, Queen, King, Minister, Knight, Bishop, Rook]);
    this.setupRank(Player.Black, 7, [Pawn, Pawn, Pawn, Pawn, RoyalGuard, Pawn, Pawn, Pawn, Pawn]);

    // Diplomats (Static, Permanent, center area)
    const diplomatCoords = ['d4', 'f4', 'd6', 'f6'];
    diplomatCoords.forEach(coord => {
      this.board.setPiece(Board.parseCoordinate(coord), new Diplomat());
    });
  }

  private setupRank(player: Player, rank: number, pieceClasses: any[]): void {
    pieceClasses.forEach((PieceClass, file) => {
      this.board.setPiece({ file, rank }, new PieceClass(player));
    });
  }

  public isSquareAttacked(position: Position, attackerPlayer: Player): boolean {
    for (let r = 0; r < Board.RANKS; r++) {
      for (let f = 0; f < Board.FILES; f++) {
        const piece = this.board.getPiece({ file: f, rank: r });
        if (piece && piece.owner === attackerPlayer) {
          const enemyMoves = MovementRules.getLegalMoves(this, { file: f, rank: r });
          if (enemyMoves.some(m => m.file === position.file && m.rank === position.rank)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public isKingInCheck(player: Player): boolean {
    let kingPos: Position | null = null;
    for (let r = 0; r < Board.RANKS; r++) {
      for (let f = 0; f < Board.FILES; f++) {
        const piece = this.board.getPiece({ file: f, rank: r });
        if (piece && piece.type === PieceType.King && piece.owner === player) {
          kingPos = { file: f, rank: r };
          break;
        }
      }
      if (kingPos) break;
    }
    if (!kingPos) return false;

    const opponent = player === Player.White ? Player.Black : Player.White;
    return this.isSquareAttacked(kingPos, opponent);
  }

  public isKingOnSquare(player: Player, position: Position): boolean {
    const piece = this.board.getPiece(position);
    return piece !== null && piece.type === PieceType.King && piece.owner === player;
  }

  public isCheckmate(player: Player): boolean {
    return this.isKingInCheck(player) && !this.hasAnyLegalMove(player);
  }

  public hasAnyLegalMove(player: Player): boolean {
    for (let r = 0; r < Board.RANKS; r++) {
      for (let f = 0; f < Board.FILES; f++) {
        const piece = this.board.getPiece({ file: f, rank: r });
        if (piece && piece.owner === player) {
          const moves = this.getLegalMoves({ file: f, rank: r });
          if (moves.length > 0) return true;
        }
      }
    }
    return false;
  }

  public isGameOver(): boolean {
    return this.gameStatus !== GameStatus.Playing;
  }

  public executeMoveSimulation(from: Position, to: Position, promotionType?: PieceType): void {
    const piece = this.board.getPiece(from);
    if (!piece) return;

    if (promotionType && piece.type === PieceType.Pawn) {
      let PromotedClass: any;
      switch (promotionType) {
        case PieceType.Queen: PromotedClass = Queen; break;
        case PieceType.Rook: PromotedClass = Rook; break;
        case PieceType.Bishop: PromotedClass = Bishop; break;
        case PieceType.Knight: PromotedClass = Knight; break;
        default: break;
      }
      if (PromotedClass) {
        this.board.setPiece(to, new PromotedClass(piece.owner));
      } else {
        this.board.setPiece(to, piece);
      }
    } else {
      this.board.setPiece(to, piece);
    }
    
    this.board.removePiece(from);
  }

  public getLegalMoves(position: Position): LegalMove[] {
    const piece = this.board.getPiece(position);
    if (!piece) return [];
    
    const pseudoMoves = MovementRules.getLegalMoves(this, position);
    
    // Filter out moves that leave the King in check or capture the opponent's King
    return pseudoMoves.filter(to => {
      const target = this.board.getPiece(to);
      if (target && target.type === PieceType.King) return false;

      const clonedState = this.clone();
      clonedState.executeMoveSimulation(position, to, to.promotionType);
      return !clonedState.isKingInCheck(piece.owner);
    });
  }

  public makeMove(from: Position, to: Position, promotionType?: PieceType): boolean {
    if (this.isGameOver()) return false;

    const piece = this.board.getPiece(from);
    if (!piece) return false;
    if (piece.owner !== this.currentPlayer) return false;

    const legalMoves = this.getLegalMoves(from);
    
    // Check if the move is legal, taking promotionType into account
    // If it's a promotion move, promotionType must match a valid legal move's promotionType
    // If it's a normal move, promotionType should be undefined and it should match a normal legal move
    const isLegal = legalMoves.some(m => {
      if (m.file !== to.file || m.rank !== to.rank) return false;
      if (m.promotionType !== undefined) {
        return m.promotionType === promotionType;
      }
      return promotionType === undefined;
    });

    if (!isLegal) return false;

    const capturedPiece = this.board.getPiece(to);
    
    // Perform purely geometric move (includes promotion logic inside executeMoveSimulation)
    this.executeMoveSimulation(from, to, promotionType);
    
    // Process Minister conversion specifically as a committed side-effect
    let ministerConversionOccurred = false;
    if (piece.type === PieceType.Minister) {
      const dFile = to.file - from.file;
      const dRank = to.rank - from.rank;
      if (Math.abs(dFile) === 2 || Math.abs(dRank) === 2) {
        const midFile = from.file + dFile / 2;
        const midRank = from.rank + dRank / 2;
        const intermediatePos = { file: midFile, rank: midRank };
        const intermediatePiece = this.board.getPiece(intermediatePos);
        if (intermediatePiece && intermediatePiece.type === PieceType.Pawn && intermediatePiece.owner !== piece.owner) {
          intermediatePiece.owner = piece.owner;
          ministerConversionOccurred = true;
        }
      }
    }
    
    let centerHoldStarted = false;
    const onSquare = this.isKingOnSquare(this.currentPlayer, Board.CENTER_SQUARE);
    
    if (onSquare) {
      if (!this.centerHold || this.centerHold.player !== this.currentPlayer) {
        this.centerHold = { player: this.currentPlayer };
        centerHoldStarted = true;
      }
    } else {
      if (this.centerHold && this.centerHold.player === this.currentPlayer) {
        this.centerHold = null; // King left the center
      }
    }

    this.currentPlayer = this.currentPlayer === Player.White ? Player.Black : Player.White;
    
    if (!this.hasAnyLegalMove(this.currentPlayer)) {
      if (this.isKingInCheck(this.currentPlayer)) {
        this.gameStatus = GameStatus.Finished;
        this.winner = piece.owner;
      }
    }

    if (this.gameStatus === GameStatus.Playing) {
      if (this.centerHold && this.centerHold.player === this.currentPlayer) {
        if (this.isKingOnSquare(this.currentPlayer, Board.CENTER_SQUARE)) {
          this.gameStatus = GameStatus.CenterVictory;
          this.winner = this.currentPlayer;
        } else {
          this.centerHold = null;
        }
      }
    }

    const moveRecord: MoveRecord = {
      player: piece.owner,
      from: { ...from },
      to: { ...to },
      movedPieceType: piece.type,
      promotedPieceType: promotionType,
      capturedPieceType: capturedPiece ? capturedPiece.type : undefined,
      ministerConversionOccurred,
      centerHoldStarted,
      resultingGameStatus: this.gameStatus
    };
    this.moveHistory.push(moveRecord);
    
    return true;
  }
  
  // Backwards compatibility for tests that haven't been updated yet
  public movePiece(from: Position, to: Position, promotionType?: PieceType): boolean {
    return this.makeMove(from, to, promotionType);
  }
}

import { Piece, PieceType } from './Piece';

export interface Position {
  file: number; // 0 to 8 (a to i)
  rank: number; // 0 to 8 (1 to 9)
}

export interface LegalMove extends Position {
  promotionType?: PieceType;
}

export class Board {
  public static readonly FILES = 9;
  public static readonly RANKS = 9;
  public static readonly CENTER_SQUARE: Position = { file: 4, rank: 4 }; // e5
  
  // grid[file][rank]
  private grid: (Piece | null)[][];

  constructor() {
    this.grid = Array(Board.FILES).fill(null).map(() => Array(Board.RANKS).fill(null));
  }

  public getPiece(pos: Position): Piece | null {
    if (!this.isValidPosition(pos)) return null;
    return this.grid[pos.file][pos.rank];
  }

  public setPiece(pos: Position, piece: Piece | null): void {
    if (!this.isValidPosition(pos)) {
      throw new Error(`Invalid position: file ${pos.file}, rank ${pos.rank}`);
    }
    this.grid[pos.file][pos.rank] = piece;
  }

  public removePiece(pos: Position): Piece | null {
    const piece = this.getPiece(pos);
    if (this.isValidPosition(pos)) {
      this.grid[pos.file][pos.rank] = null;
    }
    return piece;
  }

  public isValidPosition(pos: Position): boolean {
    return pos.file >= 0 && pos.file < Board.FILES && pos.rank >= 0 && pos.rank < Board.RANKS;
  }

  // Utility to convert standard coordinate strings (e.g. 'e5') to internal Position
  public static parseCoordinate(coord: string): Position {
    if (coord.length !== 2) throw new Error("Invalid coordinate");
    const file = coord.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(coord[1], 10) - 1;
    return { file, rank };
  }

  public clone(): Board {
    const clonedBoard = new Board();
    for (let f = 0; f < Board.FILES; f++) {
      for (let r = 0; r < Board.RANKS; r++) {
        const piece = this.grid[f][r];
        if (piece) {
          clonedBoard.grid[f][r] = piece.clone();
        }
      }
    }
    return clonedBoard;
  }
}

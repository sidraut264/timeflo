import { GameState } from './GameState';
import { LegalMove } from './Board';
import type { Position } from './Board';
import { PieceType, Piece } from './Piece';
import { Player } from './Player';
import { ShieldSystem, RelativeDirection } from './ShieldSystem';

export class MovementRules {
  public static getLegalMoves(gameState: GameState, position: Position): LegalMove[] {
    const piece = gameState.board.getPiece(position);
    if (!piece) return [];

    switch (piece.type) {
      case PieceType.Rook:
        return this.getRookMoves(gameState, position, piece);
      case PieceType.Bishop:
        return this.getBishopMoves(gameState, position, piece);
      case PieceType.Queen:
        return this.getQueenMoves(gameState, position, piece);
      case PieceType.Knight:
        return this.getKnightMoves(gameState, position, piece);
      case PieceType.King:
        return this.getKingMoves(gameState, position, piece);
      case PieceType.Pawn:
        return this.getPawnMoves(gameState, position, piece);
      case PieceType.RoyalGuard:
        return this.getRoyalGuardMoves(gameState, position, piece);
      case PieceType.Minister:
        return this.getMinisterMoves(gameState, position, piece);
      default:
        return []; // Other pieces not yet implemented
    }
  }

  private static getSlidingMoves(gameState: GameState, start: Position, piece: Piece, directions: number[][]): LegalMove[] {
    const moves: Position[] = [];
    const board = gameState.board;

    for (const [dFile, dRank] of directions) {
      let currentFile = start.file + dFile;
      let currentRank = start.rank + dRank;

      while (board.isValidPosition({ file: currentFile, rank: currentRank })) {
        const targetPos = { file: currentFile, rank: currentRank };
        const targetPiece = board.getPiece(targetPos);

        if (targetPiece) {
          if (targetPiece.type === PieceType.Diplomat) {
            // Blocked by Diplomat, cannot capture
            break;
          }
          if (targetPiece.owner !== piece.owner) {
            // Check if protected by shield
            if (!ShieldSystem.isProtected(gameState, targetPos, start, targetPiece.owner)) {
              moves.push(targetPos);
            }
          }
          // Blocked by any piece (friendly or enemy)
          break;
        }

        moves.push(targetPos);
        currentFile += dFile;
        currentRank += dRank;
      }
    }

    return moves;
  }

  private static getRookMoves(gameState: GameState, start: Position, piece: Piece): LegalMove[] {
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    return this.getSlidingMoves(gameState, start, piece, directions);
  }

  private static getBishopMoves(gameState: GameState, start: Position, piece: Piece): LegalMove[] {
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    return this.getSlidingMoves(gameState, start, piece, directions);
  }

  private static getQueenMoves(gameState: GameState, start: Position, piece: Piece): LegalMove[] {
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    return this.getSlidingMoves(gameState, start, piece, directions);
  }

  private static getKnightMoves(gameState: GameState, start: Position, piece: Piece): LegalMove[] {
    const moves: Position[] = [];
    const board = gameState.board;
    const jumps = [
      [1, 2], [2, 1], [2, -1], [1, -2],
      [-1, -2], [-2, -1], [-2, 1], [-1, 2]
    ];

    for (const [dFile, dRank] of jumps) {
      const targetPos = { file: start.file + dFile, rank: start.rank + dRank };
      if (board.isValidPosition(targetPos)) {
        const targetPiece = board.getPiece(targetPos);
        if (!targetPiece) {
          moves.push(targetPos);
        } else if (targetPiece.type !== PieceType.Diplomat && targetPiece.owner !== piece.owner) {
          if (!ShieldSystem.isProtected(gameState, targetPos, start, targetPiece.owner)) {
            moves.push(targetPos);
          }
        }
      }
    }
    return moves;
  }

  private static getKingMoves(gameState: GameState, start: Position, piece: Piece): LegalMove[] {
    const moves: Position[] = [];
    const board = gameState.board;
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];

    for (const [dFile, dRank] of directions) {
      const targetPos = { file: start.file + dFile, rank: start.rank + dRank };
      if (board.isValidPosition(targetPos)) {
        const targetPiece = board.getPiece(targetPos);
        if (!targetPiece) {
          moves.push(targetPos);
        } else if (targetPiece.type !== PieceType.Diplomat && targetPiece.owner !== piece.owner) {
          if (!ShieldSystem.isProtected(gameState, targetPos, start, targetPiece.owner)) {
            moves.push(targetPos);
          }
        }
      }
    }
    return moves;
  }

  private static getPawnMoves(gameState: GameState, start: Position, piece: Piece): LegalMove[] {
    const moves: LegalMove[] = [];
    const board = gameState.board;
    
    // Determine forward direction based on player
    const forwardDirection = piece.owner === Player.White ? 1 : -1;
    const startingRank = piece.owner === Player.White ? 1 : 7; // Rank 2 for White (index 1), Rank 8 for Black (index 7)
    const promotionRank = piece.owner === Player.White ? 8 : 0;

    const addPawnMove = (targetPos: Position) => {
      if (targetPos.rank === promotionRank) {
        moves.push({ ...targetPos, promotionType: PieceType.Queen });
        moves.push({ ...targetPos, promotionType: PieceType.Rook });
        moves.push({ ...targetPos, promotionType: PieceType.Bishop });
        moves.push({ ...targetPos, promotionType: PieceType.Knight });
      } else {
        moves.push(targetPos);
      }
    };

    // Forward 1
    const forward1 = { file: start.file, rank: start.rank + forwardDirection };
    if (board.isValidPosition(forward1)) {
      if (!board.getPiece(forward1)) {
        addPawnMove(forward1);
        
        // Forward 2 (initial move only)
        if (start.rank === startingRank) {
          const forward2 = { file: start.file, rank: start.rank + 2 * forwardDirection };
          if (board.isValidPosition(forward2) && !board.getPiece(forward2)) {
            addPawnMove(forward2);
          }
        }
      }
    }

    // Captures (Diagonal)
    const captureOffsets = [-1, 1]; // Left and Right file offsets
    for (const fileOffset of captureOffsets) {
      const cap = { file: start.file + fileOffset, rank: start.rank + forwardDirection };
      if (board.isValidPosition(cap)) {
        const targetPiece = board.getPiece(cap);
        if (targetPiece && targetPiece.type !== PieceType.Diplomat && targetPiece.owner !== piece.owner) {
          if (!ShieldSystem.isProtected(gameState, cap, start, targetPiece.owner)) {
            addPawnMove(cap);
          }
        }
      }
    }

    return moves;
  }

  private static getRoyalGuardMoves(gameState: GameState, start: Position, piece: Piece): LegalMove[] {
    const moves: Position[] = [];
    const board = gameState.board;
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // Orthogonal only

    for (const [dFile, dRank] of directions) {
      const targetPos = { file: start.file + dFile, rank: start.rank + dRank };
      if (board.isValidPosition(targetPos)) {
        const targetPiece = board.getPiece(targetPos);
        if (!targetPiece) {
          moves.push(targetPos); // Move to empty square
        } else if (targetPiece.type !== PieceType.Diplomat && targetPiece.owner !== piece.owner) {
          // Can capture if enemy is NOT forward, AND if target is not shielded
          const dirOfTarget = ShieldSystem.getRelativeDirection(start, targetPos, piece.owner);
          
          if (dirOfTarget === RelativeDirection.Back || 
              dirOfTarget === RelativeDirection.Left || 
              dirOfTarget === RelativeDirection.Right) {
              
            if (!ShieldSystem.isProtected(gameState, targetPos, start, targetPiece.owner)) {
              moves.push(targetPos);
            }
          }
        }
      }
    }
    return moves;
  }

  private static getMinisterMoves(gameState: GameState, start: Position, piece: Piece): LegalMove[] {
    const moves: Position[] = [];
    const board = gameState.board;
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];

    for (const [dFile, dRank] of directions) {
      // 1-square jump
      const pos1 = { file: start.file + dFile, rank: start.rank + dRank };
      if (board.isValidPosition(pos1)) {
        const targetPiece1 = board.getPiece(pos1);
        if (!targetPiece1) {
          moves.push(pos1);
        } else if (targetPiece1.type !== PieceType.Diplomat && targetPiece1.owner !== piece.owner) {
          if (!ShieldSystem.isProtected(gameState, pos1, start, targetPiece1.owner)) {
            moves.push(pos1);
          }
        }
      }

      // 2-square jump
      const pos2 = { file: start.file + dFile * 2, rank: start.rank + dRank * 2 };
      if (board.isValidPosition(pos2)) {
        const targetPiece2 = board.getPiece(pos2);
        if (!targetPiece2) {
          moves.push(pos2);
        } else if (targetPiece2.type !== PieceType.Diplomat && targetPiece2.owner !== piece.owner) {
          if (!ShieldSystem.isProtected(gameState, pos2, start, targetPiece2.owner)) {
            moves.push(pos2);
          }
        }
      }
    }

    return moves;
  }
}

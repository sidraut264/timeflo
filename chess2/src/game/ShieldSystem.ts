import { GameState } from './GameState';
import type { Position } from './Board';
import { Player } from './Player';
import { PieceType } from './Piece';

export enum RelativeDirection {
  Front,
  Back,
  Left,
  Right,
  FrontLeft,
  FrontRight,
  BackLeft,
  BackRight,
  Unknown
}

export class ShieldSystem {
  /**
   * Evaluates if a given target position is protected by a Royal Guard's shield
   * from an attack originating at attackerPos.
   *
   * @param gameState The current game state
   * @param targetPos The position being attacked
   * @param attackerPos The position of the attacking piece
   * @param targetOwner The owner of the piece at targetPos
   */
  public static isProtected(
    gameState: GameState,
    targetPos: Position,
    attackerPos: Position,
    targetOwner: Player
  ): boolean {
    const board = gameState.board;
    let isProtected = false;

    // Find all Royal Guards belonging to the target's owner
    for (let rank = 0; rank < 9; rank++) {
      for (let file = 0; file < 9; file++) {
        const pos = { file, rank };
        const piece = board.getPiece(pos);

        if (piece && piece.type === PieceType.RoyalGuard && piece.owner === targetOwner) {
          // Check if this Guard protects the target
          if (this.doesGuardProtectTarget(gameState, pos, targetPos, attackerPos, targetOwner)) {
            isProtected = true;
            // Note: We don't break early, though technically one guard is enough,
            // Chess 2 only has 1 Royal Guard per player anyway.
          }
        }
      }
    }

    return isProtected;
  }

  private static doesGuardProtectTarget(
    gameState: GameState,
    guardPos: Position,
    targetPos: Position,
    attackerPos: Position,
    owner: Player
  ): boolean {
    const isGuardItself = targetPos.file === guardPos.file && targetPos.rank === guardPos.rank;
    
    // Check if target is immediately left or right of the guard
    const leftPos = this.getOffsetPosition(guardPos, RelativeDirection.Left, owner);
    const rightPos = this.getOffsetPosition(guardPos, RelativeDirection.Right, owner);
    
    const isLeftPiece = targetPos.file === leftPos.file && targetPos.rank === leftPos.rank;
    const isRightPiece = targetPos.file === rightPos.file && targetPos.rank === rightPos.rank;

    if (!isGuardItself && !isLeftPiece && !isRightPiece) {
      return false; // Target is neither the Guard nor immediately Left/Right
    }

    // Target must be a friendly piece. (This is already guaranteed by the outer loop 
    // matching targetOwner, but we rely on this assumption).

    let activeShields: RelativeDirection[] = [];

    if (isGuardItself) {
      activeShields = [RelativeDirection.Front];
    } else if (isLeftPiece) {
      // Left piece: Guard is to the RIGHT, so the diagonal toward Guard is FrontRight
      activeShields = [RelativeDirection.Front, RelativeDirection.FrontRight];
    } else if (isRightPiece) {
      // Right piece: Guard is to the LEFT, so the diagonal toward Guard is FrontLeft
      activeShields = [RelativeDirection.Front, RelativeDirection.FrontLeft];
    }

    // Determine direction of attack
    const attackDir = this.getRelativeDirection(targetPos, attackerPos, owner);

    // Is the attack direction blocked by the shield?
    return activeShields.includes(attackDir);
  }

  private static getOffsetPosition(pos: Position, dir: RelativeDirection, owner: Player): Position {
    // White: Front = +rank, Left = -file, Right = +file
    // Black: Front = -rank, Left = +file, Right = -file
    
    let dFile = 0;
    let dRank = 0;

    switch (dir) {
      case RelativeDirection.Front: dRank = 1; break;
      case RelativeDirection.Back: dRank = -1; break;
      case RelativeDirection.Left: dFile = -1; break;
      case RelativeDirection.Right: dFile = 1; break;
      case RelativeDirection.FrontLeft: dRank = 1; dFile = -1; break;
      case RelativeDirection.FrontRight: dRank = 1; dFile = 1; break;
      case RelativeDirection.BackLeft: dRank = -1; dFile = -1; break;
      case RelativeDirection.BackRight: dRank = -1; dFile = 1; break;
    }

    if (owner === Player.Black) {
      dRank = -dRank;
      dFile = -dFile; // Invert file because Black faces down, so their left is increasing file
    }

    return { file: pos.file + dFile, rank: pos.rank + dRank };
  }

  public static getRelativeDirection(
    targetPos: Position,
    attackerPos: Position,
    targetOwner: Player
  ): RelativeDirection {
    const dFile = attackerPos.file - targetPos.file;
    const dRank = attackerPos.rank - targetPos.rank;

    // Normalize orientation for White (so we just evaluate signs)
    const normalizedDFile = targetOwner === Player.White ? dFile : -dFile;
    const normalizedDRank = targetOwner === Player.White ? dRank : -dRank;

    if (normalizedDRank > 0 && normalizedDFile === 0) return RelativeDirection.Front;
    if (normalizedDRank < 0 && normalizedDFile === 0) return RelativeDirection.Back;
    if (normalizedDRank === 0 && normalizedDFile < 0) return RelativeDirection.Left;
    if (normalizedDRank === 0 && normalizedDFile > 0) return RelativeDirection.Right;
    
    if (normalizedDRank > 0 && normalizedDFile < 0) return RelativeDirection.FrontLeft;
    if (normalizedDRank > 0 && normalizedDFile > 0) return RelativeDirection.FrontRight;
    if (normalizedDRank < 0 && normalizedDFile < 0) return RelativeDirection.BackLeft;
    if (normalizedDRank < 0 && normalizedDFile > 0) return RelativeDirection.BackRight;

    return RelativeDirection.Unknown;
  }

  /**
   * Read-only visualization query.
   * Returns the shield geometry for all Royal Guards belonging to `owner`.
   * The UI reads this to render directional shield overlays — no rule logic lives in the UI.
   */
  public static getShieldInfo(
    gameState: GameState,
    owner: Player
  ): ShieldInfo[] {
    const board = gameState.board;
    const result: ShieldInfo[] = [];

    for (let rank = 0; rank < 9; rank++) {
      for (let file = 0; file < 9; file++) {
        const pos = { file, rank };
        const piece = board.getPiece(pos);
        if (!piece || piece.type !== PieceType.RoyalGuard || piece.owner !== owner) continue;

        const guardPos = pos;

        // Guard itself: Front only
        const guardShield: ShieldTarget = {
          targetPos: { ...guardPos },
          isGuard: true,
          protectedDirections: [RelativeDirection.Front]
        };

        const leftPos  = this.getOffsetPosition(guardPos, RelativeDirection.Left,  owner);
        const rightPos = this.getOffsetPosition(guardPos, RelativeDirection.Right, owner);

        const leftPiece  = board.isValidPosition(leftPos)  ? board.getPiece(leftPos)  : null;
        const rightPiece = board.isValidPosition(rightPos) ? board.getPiece(rightPos) : null;

        const targets: ShieldTarget[] = [guardShield];

        // Left piece: Guard is to the RIGHT → FrontRight protected
        if (leftPiece && leftPiece.owner === owner) {
          targets.push({
            targetPos: { ...leftPos },
            isGuard: false,
            protectedDirections: [RelativeDirection.Front, RelativeDirection.FrontRight]
          });
        }

        // Right piece: Guard is to the LEFT → FrontLeft protected
        if (rightPiece && rightPiece.owner === owner) {
          targets.push({
            targetPos: { ...rightPos },
            isGuard: false,
            protectedDirections: [RelativeDirection.Front, RelativeDirection.FrontLeft]
          });
        }

        result.push({ guardPos, guardOwner: owner, targets });
      }
    }

    return result;
  }
}

// ── Visualization types (read-only, for UI use only) ─────────────────────────
export interface ShieldTarget {
  targetPos: { file: number; rank: number };
  isGuard: boolean;
  protectedDirections: RelativeDirection[];
}

export interface ShieldInfo {
  guardPos: { file: number; rank: number };
  guardOwner: Player;
  targets: ShieldTarget[];
}

import { GameState, GameStatus } from '../GameState';
import { Board } from '../Board';
import { Player } from '../Player';
import { PieceType, Piece, Pawn, Rook, Knight, Bishop, Queen, King, Minister, RoyalGuard, Diplomat } from '../Piece';
import type { ScenarioDefinition, PieceDef } from './ScenarioDefinition';

export class ScenarioLoader {
  /**
   * Validates and loads a ScenarioDefinition into a fresh GameState.
   * Throws an Error if the scenario definition is invalid.
   */
  public static loadScenario(scenario: ScenarioDefinition): GameState {
    const gameState = new GameState(true); // skipInit = true to get an empty board
    const board = gameState.board;

    let whiteKingCount = 0;
    let blackKingCount = 0;

    // A set to track occupied squares for detecting overlaps
    const occupiedSquares = new Set<string>();

    for (const pieceDef of scenario.pieces) {
      if (!pieceDef.position || pieceDef.position.length !== 2) {
        throw new Error(`Invalid position format: ${pieceDef.position}`);
      }

      if (occupiedSquares.has(pieceDef.position)) {
        throw new Error(`Multiple pieces placed on the same square: ${pieceDef.position}`);
      }
      occupiedSquares.add(pieceDef.position);

      const pos = Board.parseCoordinate(pieceDef.position);
      if (!board.isValidPosition(pos)) {
        throw new Error(`Invalid board square: ${pieceDef.position}`);
      }

      const isDiplomat = pieceDef.type === PieceType.Diplomat;
      
      if (isDiplomat) {
        const allowed = ['d4', 'f4', 'd6', 'f6'];
        if (!allowed.includes(pieceDef.position)) {
          throw new Error(`Invalid Diplomat placement: ${pieceDef.position}. Must be on d4, f4, d6, or f6.`);
        }
      }

      const player = pieceDef.player === 'Black' ? Player.Black : Player.White;
      
      const piece = this.createPiece(pieceDef.type, player);
      
      if (piece.type === PieceType.King) {
        if (piece.owner === Player.White) whiteKingCount++;
        if (piece.owner === Player.Black) blackKingCount++;
      }

      board.setPiece(pos, piece);
    }

    if (whiteKingCount !== 1) {
      throw new Error(`Invalid position: White must have exactly one King (found ${whiteKingCount}).`);
    }
    if (blackKingCount !== 1) {
      throw new Error(`Invalid position: Black must have exactly one King (found ${blackKingCount}).`);
    }

    // Set currentPlayer
    gameState.currentPlayer = scenario.currentPlayer === 'Black' ? Player.Black : Player.White;
    gameState.gameStatus = GameStatus.Playing;

    // Handle Center Hold
    if (scenario.centerHold) {
      const holdPlayer = scenario.centerHold === 'Black' ? Player.Black : Player.White;
      
      // Verify the player's King is actually on e5
      if (!gameState.isKingOnSquare(holdPlayer, Board.CENTER_SQUARE)) {
        throw new Error(`Invalid centerHold: ${scenario.centerHold} King is not on e5.`);
      }

      gameState.centerHold = { player: holdPlayer };
    } else {
      gameState.centerHold = null;
    }

    return gameState;
  }

  private static createPiece(typeStr: string, player: Player): Piece {
    switch (typeStr as PieceType) {
      case PieceType.Pawn: return new Pawn(player);
      case PieceType.Rook: return new Rook(player);
      case PieceType.Knight: return new Knight(player);
      case PieceType.Bishop: return new Bishop(player);
      case PieceType.Queen: return new Queen(player);
      case PieceType.King: return new King(player);
      case PieceType.Minister: return new Minister(player);
      case PieceType.RoyalGuard: return new RoyalGuard(player);
      case PieceType.Diplomat: return new Diplomat();
      default:
        throw new Error(`Unknown piece type: ${typeStr}`);
    }
  }

  /**
   * Serializes the current GameState into a ScenarioDefinition JSON object.
   */
  public static exportScenario(gameState: GameState, name = 'Exported Position', description = ''): ScenarioDefinition {
    const pieces: PieceDef[] = [];
    const board = gameState.board;

    for (let r = 0; r < Board.RANKS; r++) {
      for (let f = 0; f < Board.FILES; f++) {
        const piece = board.getPiece({ file: f, rank: r });
        if (piece) {
          const coord = String.fromCharCode('a'.charCodeAt(0) + f) + (r + 1);
          const def: PieceDef = {
            type: piece.type,
            position: coord
          };
          if (piece.type !== PieceType.Diplomat) {
            def.player = piece.owner === Player.White ? 'White' : 'Black';
          }
          pieces.push(def);
        }
      }
    }

    return {
      name,
      description,
      currentPlayer: gameState.currentPlayer === Player.White ? 'White' : 'Black',
      centerHold: gameState.centerHold ? (gameState.centerHold.player === Player.White ? 'White' : 'Black') : undefined,
      pieces
    };
  }
}

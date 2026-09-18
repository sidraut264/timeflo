import { GameState, GameStatus } from '../GameState';
import { Player } from '../Player';
import { Board } from '../Board';
import { AIConfig } from './AIConfig';

export class MoveEvaluator {
  /**
   * Evaluates the current state from the perspective of `maximizingPlayer`.
   * Positive scores favor maximizingPlayer, negative scores favor the opponent.
   */
  static evaluate(state: GameState, maximizingPlayer: Player): number {
    if (state.gameStatus !== GameStatus.Playing) {
      if (state.winner === maximizingPlayer) return Infinity;
      if (state.winner && state.winner !== maximizingPlayer) return -Infinity;
      return 0; // Draw (if draws exist in the future)
    }

    let score = 0;
    const opponent = maximizingPlayer === Player.White ? Player.Black : Player.White;

    // 1. Material Evaluation & Position-based heuristics
    for (let rank = 0; rank < Board.RANKS; rank++) {
      for (let file = 0; file < Board.FILES; file++) {
        const piece = state.board.getPiece({ file, rank });
        if (!piece) continue;

        const value = AIConfig.PIECE_VALUES[piece.type] || 0;
        const multiplier = piece.owner === maximizingPlayer ? 1 : -1;
        score += value * multiplier;

        // Center control (distance to e5) for Kings
        if (piece.type === 'King') {
          const centerFile = Board.CENTER_SQUARE.file;
          const centerRank = Board.CENTER_SQUARE.rank;
          const distanceToCenter = Math.max(Math.abs(file - centerFile), Math.abs(rank - centerRank));
          const centerBonus = Math.max(0, AIConfig.CENTER_CONTROL_BONUS - distanceToCenter * 5);
          score += centerBonus * multiplier;
        }
      }
    }

    // 2. Center Hold
    if (state.centerHold) {
      if (state.centerHold.player === maximizingPlayer) {
        score += AIConfig.CENTER_HOLD_BONUS;
      } else {
        score -= AIConfig.CENTER_HOLD_BONUS;
      }
    }

    return score;
  }
}

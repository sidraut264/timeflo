import { GameState } from '../GameState';
import { Player } from '../Player';
import { PieceType } from '../Piece';
import type { Position } from '../Board';
import { Board } from '../Board';
import { AIConfig } from './AIConfig';
import { MoveEvaluator } from './MoveEvaluator';

export interface AIMove {
  from: Position;
  to: Position;
  promotionType?: PieceType;
}

export class ComputerPlayer {
  /**
   * Main entry point to get the best move for the AI.
   * Never mutates the original GameState.
   */
  static chooseMove(state: GameState, aiPlayer: Player): AIMove | null {
    if (state.isGameOver()) return null;

    let bestScore = -Infinity;
    let bestMoves: AIMove[] = [];

    const allMoves = this.getAllLegalMoves(state, aiPlayer);
    if (allMoves.length === 0) return null;

    for (const move of allMoves) {
      // 1. Clone state and apply the candidate move
      const clonedState = state.clone();
      const success = clonedState.makeMove(move.from, move.to, move.promotionType);
      
      if (!success) continue; // Should always be true if generated via getLegalMoves

      // 2. Evaluate resulting state
      let score = 0;
      if (AIConfig.SEARCH_DEPTH > 1 && !clonedState.isGameOver()) {
        score = this.evaluateMin(clonedState, aiPlayer, AIConfig.SEARCH_DEPTH - 1);
      } else {
        score = MoveEvaluator.evaluate(clonedState, aiPlayer);
      }

      // 3. Track best move
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }

    // Deterministic tie-breaking (e.g. string comparison of coordinates)
    if (bestMoves.length > 0) {
      bestMoves.sort((a, b) => {
        const strA = `${a.from.file},${a.from.rank}->${a.to.file},${a.to.rank}${a.promotionType || ''}`;
        const strB = `${b.from.file},${b.from.rank}->${b.to.file},${b.to.rank}${b.promotionType || ''}`;
        return strA.localeCompare(strB);
      });
      return bestMoves[0];
    }

    return null;
  }

  /**
   * Helper function for the "Min" step of minimax.
   * Assumes it is the opponent's turn. Returns the minimum score possible for the maximizing player.
   */
  private static evaluateMin(state: GameState, maximizingPlayer: Player, depth: number): number {
    if (depth === 0 || state.isGameOver()) {
      return MoveEvaluator.evaluate(state, maximizingPlayer);
    }

    const opponent = maximizingPlayer === Player.White ? Player.Black : Player.White;
    const opponentMoves = this.getAllLegalMoves(state, opponent);
    
    // If the opponent has no moves (e.g. checkmate or stalemate), evaluate directly
    if (opponentMoves.length === 0) {
      return MoveEvaluator.evaluate(state, maximizingPlayer);
    }

    let minScore = Infinity;

    // Preserve the tactical bonus if our previous move put the opponent in check
    let checkBonus = 0;
    if (state.isKingInCheck(opponent)) {
      checkBonus = AIConfig.CHECK_BONUS;
    }

    for (const move of opponentMoves) {
      const clonedState = state.clone();
      clonedState.makeMove(move.from, move.to, move.promotionType);
      
      let score = 0;
      if (depth > 1) {
         // evaluateMax if we went deeper than depth 2
         // For a simple depth-2 search, depth is 1 here, so we evaluate.
         score = MoveEvaluator.evaluate(clonedState, maximizingPlayer);
      } else {
         score = MoveEvaluator.evaluate(clonedState, maximizingPlayer);
      }
      
      score += checkBonus;

      if (score < minScore) {
        minScore = score;
      }
    }

    return minScore;
  }

  /**
   * Gathers all legal moves for a given player into a flat array.
   * Defaults promotion to Queen.
   */
  private static getAllLegalMoves(state: GameState, player: Player): AIMove[] {
    const allMoves: AIMove[] = [];

    for (let r = 0; r < Board.RANKS; r++) {
      for (let f = 0; f < Board.FILES; f++) {
        const piece = state.board.getPiece({ file: f, rank: r });
        if (piece && piece.owner === player) {
          const pos = { file: f, rank: r };
          const moves = state.getLegalMoves(pos);
          
          for (const m of moves) {
            // For AI version 1, only promote to Queen
            if (m.promotionType !== undefined) {
              if (m.promotionType === PieceType.Queen) {
                allMoves.push({ from: pos, to: { file: m.file, rank: m.rank }, promotionType: m.promotionType });
              }
            } else {
              allMoves.push({ from: pos, to: { file: m.file, rank: m.rank } });
            }
          }
        }
      }
    }

    return allMoves;
  }
}

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

    const depth = AIConfig.getSearchDepth();

    for (const move of allMoves) {
      // 1. Clone state and apply the candidate move
      const clonedState = state.clone();
      const success = clonedState.makeMove(move.from, move.to, move.promotionType);
      
      if (!success) continue;

      // 2. Evaluate resulting state using Alpha-Beta Pruning
      let score = 0;
      if (depth > 1 && !clonedState.isGameOver()) {
        score = this.alphaBeta(clonedState, depth - 1, -Infinity, Infinity, false, aiPlayer);
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
   * Minimax with Alpha-Beta Pruning.
   */
  private static alphaBeta(
    state: GameState,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizingPlayer: boolean,
    maximizingPlayer: Player
  ): number {
    if (depth === 0 || state.isGameOver()) {
      return MoveEvaluator.evaluate(state, maximizingPlayer);
    }

    const currentPlayer = isMaximizingPlayer ? maximizingPlayer : (maximizingPlayer === Player.White ? Player.Black : Player.White);
    const moves = this.getAllLegalMoves(state, currentPlayer);

    if (moves.length === 0) {
      return MoveEvaluator.evaluate(state, maximizingPlayer);
    }

    if (isMaximizingPlayer) {
      let maxScore = -Infinity;
      for (const move of moves) {
        const clonedState = state.clone();
        clonedState.makeMove(move.from, move.to, move.promotionType);
        
        let score = this.alphaBeta(clonedState, depth - 1, alpha, beta, false, maximizingPlayer);
        
        if (score > maxScore) {
          maxScore = score;
        }
        if (maxScore > alpha) {
          alpha = maxScore;
        }
        if (beta <= alpha) {
          break; // Beta cut-off
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      
      // Preserve the tactical bonus if the maximizing player's previous move put the opponent in check
      let checkBonus = 0;
      if (state.isKingInCheck(currentPlayer)) {
        checkBonus = AIConfig.CHECK_BONUS;
      }

      for (const move of moves) {
        const clonedState = state.clone();
        clonedState.makeMove(move.from, move.to, move.promotionType);
        
        let score = this.alphaBeta(clonedState, depth - 1, alpha, beta, true, maximizingPlayer);
        score += checkBonus;
        
        if (score < minScore) {
          minScore = score;
        }
        if (minScore < beta) {
          beta = minScore;
        }
        if (beta <= alpha) {
          break; // Alpha cut-off
        }
      }
      return minScore;
    }
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

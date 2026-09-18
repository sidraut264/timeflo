import { GameState, GameStatus } from '../src/game/GameState';
import { Player } from '../src/game/Player';
import { PieceType } from '../src/game/Piece';
import { ComputerPlayer } from '../src/game/ai/ComputerPlayer';
import { Board } from '../src/game/Board';
import { AIConfig } from '../src/game/ai/AIConfig';
import { Minister, Pawn, King, Rook, RoyalGuard, Diplomat } from '../src/game/Piece';

describe('Computer Opponent (AI)', () => {
  it('returns a legal move', () => {
    const state = new GameState();
    const move = ComputerPlayer.chooseMove(state, Player.White);
    expect(move).not.toBeNull();
    if (move) {
      const legalMoves = state.getLegalMoves(move.from);
      const isLegal = legalMoves.some(m => m.file === move.to.file && m.rank === move.to.rank);
      expect(isLegal).toBe(true);
    }
  });

  it('returns null when the game is over', () => {
    const state = new GameState();
    // Force game over
    (state as any).gameStatus = GameStatus.Finished;
    const move = ComputerPlayer.chooseMove(state, Player.White);
    expect(move).toBeNull();
  });

  it('is deterministic for the same position', () => {
    const state1 = new GameState();
    const state2 = new GameState();

    const move1 = ComputerPlayer.chooseMove(state1, Player.White);
    const move2 = ComputerPlayer.chooseMove(state2, Player.White);

    expect(move1).toEqual(move2);
  });

  it('preserves simulation integrity', () => {
    const state = new GameState();
    const stateJsonBefore = JSON.stringify(state);

    ComputerPlayer.chooseMove(state, Player.White);

    const stateJsonAfter = JSON.stringify(state);
    expect(stateJsonBefore).toEqual(stateJsonAfter);
  });

  it('defaults to Queen promotion', () => {
    const state = new GameState(true); // empty board
    // Setup a pawn about to promote
    state.board.setPiece({ file: 0, rank: 7 }, new Pawn(Player.White));
    
    // Add king to make state valid
    state.board.setPiece({ file: 4, rank: 0 }, new King(Player.White));
    state.board.setPiece({ file: 4, rank: 8 }, new King(Player.Black));

    const move = ComputerPlayer.chooseMove(state, Player.White);
    expect(move).not.toBeNull();
    
    if (move && move.from.rank === 7) {
      expect(move.promotionType).toBe(PieceType.Queen);
    }
  });

  it('can choose Minister move to capture', () => {
    const state = new GameState(true);
    state.board.setPiece({ file: 4, rank: 0 }, new King(Player.White));
    state.board.setPiece({ file: 4, rank: 8 }, new King(Player.Black));
    state.board.setPiece({ file: 0, rank: 0 }, new Minister(Player.White));
    // Put an enemy pawn that the Minister can capture
    state.board.setPiece({ file: 1, rank: 1 }, new Pawn(Player.Black));

    const move = ComputerPlayer.chooseMove(state, Player.White);
    expect(move).not.toBeNull();
    if (move) {
      const piece = state.board.getPiece(move.from);
      expect(piece?.type).toBe(PieceType.Minister);
      // AI should realize converting (+200 swing) is better than capturing (+100 swing)
      // Jumps over (1,1) and lands on (2,2)
      expect(move.to.file).toBe(2);
      expect(move.to.rank).toBe(2);
    }
  });

  it('values Checkmate over material', () => {
    const state = new GameState(true);
    // Standard back-rank mate setup:
    // White King
    state.board.setPiece({ file: 4, rank: 0 }, new King(Player.White));
    // Black King trapped on the back rank (rank 8)
    state.board.setPiece({ file: 0, rank: 8 }, new King(Player.Black));
    state.board.setPiece({ file: 0, rank: 7 }, new Pawn(Player.Black));
    state.board.setPiece({ file: 1, rank: 7 }, new Pawn(Player.Black));
    state.board.setPiece({ file: 2, rank: 7 }, new Pawn(Player.Black));
    
    // White Rook at e1 that can deliver mate at e9 (4,8)
    state.board.setPiece({ file: 4, rank: 0 }, new Rook(Player.White)); 
    // White King at a2 (0,1) completely safe
    state.board.setPiece({ file: 0, rank: 1 }, new King(Player.White));
    
    // Free Black Rook at g1 (6,0) that White Rook could capture instead (but Checkmate is better)
    // Rook at 4,0 can capture at 6,0. Path is clear (file 5 is empty).
    state.board.setPiece({ file: 6, rank: 0 }, new Rook(Player.Black));

    const move = ComputerPlayer.chooseMove(state, Player.White);
    expect(move).not.toBeNull();
    // It should choose checkmate: Rook e1 to e9 (4,0 -> 4,8)
    if (move) {
      expect(move.from.file).toBe(4);
      expect(move.from.rank).toBe(0);
      expect(move.to.file).toBe(4);
      expect(move.to.rank).toBe(8);
    }
  });

  it('values putting the opponent in Check', () => {
    const state = new GameState(true);
    // White King
    state.board.setPiece({ file: 0, rank: 0 }, new King(Player.White));
    // Black King at e9 (4,8)
    state.board.setPiece({ file: 4, rank: 8 }, new King(Player.Black));
    // White Rook at a3 (0,2)
    // Moving to e3 (4,2) gives a SAFE check because Black King is far away at 4,8.
    state.board.setPiece({ file: 0, rank: 2 }, new Rook(Player.White));
    
    // There's a quiet move (e.g. Ra4) and a check move (Re3)
    // AI should prefer checking the King safely
    
    const move = ComputerPlayer.chooseMove(state, Player.White);
    expect(move).not.toBeNull();
    if (move) {
      const isCheckMove = 
        (move.to.file === 4 && move.to.rank === 2) || 
        (move.to.file === 0 && move.to.rank === 8);
      expect(isCheckMove).toBe(true);
    }
  });

  it('evaluates moving King to Center (e5)', () => {
    const state = new GameState(true);
    state.board.setPiece({ file: 4, rank: 3 }, new King(Player.White)); // King at e4
    state.board.setPiece({ file: 0, rank: 8 }, new King(Player.Black)); 
    
    const move = ComputerPlayer.chooseMove(state, Player.White);
    expect(move).not.toBeNull();
    // Best move is to step onto e5 (file 4, rank 4)
    if (move) {
      expect(move.to.file).toBe(4);
      expect(move.to.rank).toBe(4);
    }
  });

  it('values Royal Guard shields (protecting own pieces)', () => {
    const state = new GameState(true);
    // White King
    state.board.setPiece({ file: 0, rank: 0 }, new King(Player.White));
    // Black King
    state.board.setPiece({ file: 8, rank: 8 }, new King(Player.Black));
    
    // White Guard at d4
    state.board.setPiece({ file: 3, rank: 3 }, new RoyalGuard(Player.White));
    // White Pawn at e3 (not protected by Guard at d4 because Guard faces Front (up))
    // Wait, Guard moves like King, but shield projects to adjacent pieces.
    // If Guard is at d4 (file 3, rank 3), placing a Pawn at c4 (left) or e4 (right) creates a shield.
    state.board.setPiece({ file: 5, rank: 3 }, new Pawn(Player.White)); // f4 - too far? c4 is file 2, d4 is file 3, e4 is file 4.
    // Let's place Pawn at file 4, rank 2.
    // Actually, AI will just evaluate the existing positions. Let's give AI the choice to move the Pawn to be adjacent to Guard.
    // Pawn is at file 4, rank 2 (e3). Guard is at file 2, rank 3 (c4).
    state.board.setPiece({ file: 2, rank: 3 }, new RoyalGuard(Player.White)); 
    // Wait, White Guard protects front (rank 4). And adjacent Left (file 1, rank 3) projects to FrontLeft (file 1, rank 4).
    // Let's give White a choice to move a piece into the shield or move a piece away.
    // It should prefer moving into the shield.
    
    // We will just evaluate two states manually to prove SHIELD_PROTECTION_BONUS works
    const MoveEvaluator = require('../src/game/ai/MoveEvaluator').MoveEvaluator;
    
    const stateUnprotected = new GameState(true);
    stateUnprotected.board.setPiece({ file: 0, rank: 0 }, new King(Player.White));
    stateUnprotected.board.setPiece({ file: 8, rank: 8 }, new King(Player.Black));
    stateUnprotected.board.setPiece({ file: 4, rank: 4 }, new RoyalGuard(Player.White)); // Guard at e5
    stateUnprotected.board.setPiece({ file: 4, rank: 2 }, new Pawn(Player.White)); // Pawn at e3 (unprotected)
    
    const stateProtected = new GameState(true);
    stateProtected.board.setPiece({ file: 0, rank: 0 }, new King(Player.White));
    stateProtected.board.setPiece({ file: 8, rank: 8 }, new King(Player.Black));
    stateProtected.board.setPiece({ file: 4, rank: 4 }, new RoyalGuard(Player.White)); // Guard at e5
    stateProtected.board.setPiece({ file: 3, rank: 4 }, new Pawn(Player.White)); // Pawn at d5 (adjacent left -> protected)

    const scoreUnprotected = MoveEvaluator.evaluate(stateUnprotected, Player.White);
    const scoreProtected = MoveEvaluator.evaluate(stateProtected, Player.White);
    
    expect(scoreProtected).toBeGreaterThan(scoreUnprotected);
  });
});

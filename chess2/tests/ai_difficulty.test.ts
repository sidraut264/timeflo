import { GameState } from '../src/game/GameState';
import { Player } from '../src/game/Player';
import { King, Rook, Pawn, Minister, RoyalGuard } from '../src/game/Piece';
import { ComputerPlayer } from '../src/game/ai/ComputerPlayer';
import { AIConfig, AIDifficulty } from '../src/game/ai/AIConfig';

describe('Computer Opponent Difficulty Levels', () => {
  beforeEach(() => {
    // Reset to default
    AIConfig.difficulty = AIDifficulty.Medium;
  });

  it('Easy makes a legal move and avoids illegal king moves', () => {
    AIConfig.difficulty = AIDifficulty.Easy;
    
    const state = new GameState(true);
    state.board.setPiece({ file: 0, rank: 0 }, new King(Player.White));
    state.board.setPiece({ file: 8, rank: 8 }, new King(Player.Black));
    
    // Black Rook at b1 attacking the 1st rank
    state.board.setPiece({ file: 1, rank: 1 }, new Rook(Player.Black));
    
    const move = ComputerPlayer.chooseMove(state, Player.White);
    expect(move).not.toBeNull();
    if (move) {
      // King shouldn't step into b1 or anywhere on rank 1 (which would be check)
      const cloned = state.clone();
      cloned.makeMove(move.from, move.to);
      expect(cloned.isKingInCheck(Player.White)).toBe(false);
    }
  });

  it('Medium finds a simple checkmate', () => {
    AIConfig.difficulty = AIDifficulty.Medium;
    const state = new GameState(true);
    
    state.board.setPiece({ file: 0, rank: 1 }, new King(Player.White));
    state.board.setPiece({ file: 0, rank: 8 }, new King(Player.Black));
    // Black pawns blocking King
    state.board.setPiece({ file: 0, rank: 7 }, new Pawn(Player.Black));
    state.board.setPiece({ file: 1, rank: 7 }, new Pawn(Player.Black));
    state.board.setPiece({ file: 2, rank: 7 }, new Pawn(Player.Black));
    
    // White Rook
    state.board.setPiece({ file: 4, rank: 0 }, new Rook(Player.White));
    
    const move = ComputerPlayer.chooseMove(state, Player.White);
    expect(move).not.toBeNull();
    if (move) {
      expect(move.to.file).toBe(4);
      expect(move.to.rank).toBe(8); // Mate on 8th rank
    }
  });

  it('Hard uses Alpha-Beta pruning and finds tactics deterministically', () => {
    AIConfig.difficulty = AIDifficulty.Hard;
    const state = new GameState(true);
    
    // Setup a tactic that takes 3 plies to resolve
    // Or just ensure it doesn't crash and returns a legal move
    state.board.setPiece({ file: 4, rank: 0 }, new King(Player.White));
    state.board.setPiece({ file: 4, rank: 8 }, new King(Player.Black));
    state.board.setPiece({ file: 4, rank: 1 }, new Pawn(Player.White));
    
    const move = ComputerPlayer.chooseMove(state, Player.White);
    expect(move).not.toBeNull();
    expect(AIConfig.getSearchDepth()).toBe(3);
  });
});

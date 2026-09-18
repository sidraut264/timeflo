import { GameState, GameStatus } from '../src/game/GameState';
import { Player } from '../src/game/Player';
import { ComputerPlayer } from '../src/game/ai/ComputerPlayer';

describe('Computer Flow & Hardening', () => {
  it('Computer White makes the first move', () => {
    const state = new GameState();
    expect(state.currentPlayer).toBe(Player.White);

    // AI is White, should make move immediately
    const move = ComputerPlayer.chooseMove(state, Player.White);
    expect(move).not.toBeNull();
    if (move) {
      const success = state.makeMove(move.from, move.to, move.promotionType);
      expect(success).toBe(true);
      expect(state.currentPlayer).toBe(Player.Black);
    }
  });

  it('Computer Black responds after Human White move', () => {
    const state = new GameState();
    
    // Human White moves
    const success = state.makeMove({ file: 4, rank: 1 }, { file: 4, rank: 2 });
    expect(success).toBe(true);
    expect(state.currentPlayer).toBe(Player.Black);

    // Computer Black responds
    const aiMove = ComputerPlayer.chooseMove(state, Player.Black);
    expect(aiMove).not.toBeNull();
    if (aiMove) {
      const aiSuccess = state.makeMove(aiMove.from, aiMove.to, aiMove.promotionType);
      expect(aiSuccess).toBe(true);
      expect(state.currentPlayer).toBe(Player.White);
    }
  });

  it('Invalid human move does not advance turn for AI', () => {
    const state = new GameState();
    expect(state.currentPlayer).toBe(Player.White);

    // Human makes invalid move (e.g. moving a piece that doesn't exist or illegal path)
    const success = state.makeMove({ file: 4, rank: 3 }, { file: 4, rank: 4 });
    expect(success).toBe(false);

    // Turn is still White, AI Black should NOT move
    expect(state.currentPlayer).toBe(Player.White);
  });

  it('AI does not move after Checkmate', () => {
    const state = new GameState();
    // Simulate game over
    (state as any).gameStatus = GameStatus.Finished;
    (state as any).winner = Player.White;

    const move = ComputerPlayer.chooseMove(state, Player.Black);
    expect(move).toBeNull(); // AI must return null if game is over
  });

  it('AI does not move after Center Victory', () => {
    const state = new GameState();
    // Simulate center victory
    (state as any).gameStatus = GameStatus.CenterVictory;
    (state as any).winner = Player.White;

    const move = ComputerPlayer.chooseMove(state, Player.Black);
    expect(move).toBeNull();
  });

  it('AI handles being in Check (must resolve Check)', () => {
    const state = new GameState(true);
    // Setup a check scenario
    // Black King at e8
    state.board.setPiece({ file: 4, rank: 7 }, new (jest.requireActual('../src/game/Piece').King)(Player.Black));
    // White Rook at e1
    state.board.setPiece({ file: 4, rank: 0 }, new (jest.requireActual('../src/game/Piece').Rook)(Player.White));
    // White King at a1
    state.board.setPiece({ file: 0, rank: 0 }, new (jest.requireActual('../src/game/Piece').King)(Player.White));
    
    // It's Black's turn
    (state as any).currentPlayer = Player.Black;

    expect(state.isKingInCheck(Player.Black)).toBe(true);

    const move = ComputerPlayer.chooseMove(state, Player.Black);
    expect(move).not.toBeNull();
    if (move) {
      const success = state.makeMove(move.from, move.to, move.promotionType);
      expect(success).toBe(true);
      // King should no longer be in check
      expect(state.isKingInCheck(Player.Black)).toBe(false);
    }
  });
});

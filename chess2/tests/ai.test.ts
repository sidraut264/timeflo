import { GameState, GameStatus } from '../src/game/GameState';
import { Player } from '../src/game/Player';
import { PieceType } from '../src/game/Piece';
import { ComputerPlayer } from '../src/game/ai/ComputerPlayer';
import { Board } from '../src/game/Board';
import { AIConfig } from '../src/game/ai/AIConfig';
import { Minister, Pawn, King } from '../src/game/Piece';

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

  it('can choose Minister move', () => {
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
    }
  });
});

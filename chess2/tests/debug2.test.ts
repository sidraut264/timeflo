import { GameState, GameStatus } from '../src/game/GameState';
import { Player } from '../src/game/Player';
import { ComputerPlayer } from '../src/game/ai/ComputerPlayer';
import { King, Rook } from '../src/game/Piece';
import { MoveEvaluator } from '../src/game/ai/MoveEvaluator';

test('debug2', () => {
  const state = new GameState(true);
  state.board.setPiece({ file: 0, rank: 0 }, new King(Player.White));
  state.board.setPiece({ file: 4, rank: 8 }, new King(Player.Black));
  state.board.setPiece({ file: 0, rank: 2 }, new Rook(Player.White));

  const move = ComputerPlayer.chooseMove(state, Player.White);
  console.log("Chosen move:", move);

  // Evaluate manually
  const stateCheck = state.clone();
  stateCheck.makeMove({file:0,rank:2}, {file:4,rank:2}); // White plays Re3
  console.log("After Re3, Black in check?", stateCheck.isKingInCheck(Player.Black));
  
  // What is minScore for Re3?
  const ComputerPlayerClass = (ComputerPlayer as any);
  const minScore = ComputerPlayerClass.evaluateMin(stateCheck, Player.White, 1);
  console.log("MinScore for Re3:", minScore);

  const stateQuiet = state.clone();
  stateQuiet.makeMove({file:0,rank:0}, {file:0,rank:1}); // White plays Ka2
  console.log("After Ka2, Black in check?", stateQuiet.isKingInCheck(Player.Black));
  const minScoreQuiet = ComputerPlayerClass.evaluateMin(stateQuiet, Player.White, 1);
  console.log("MinScore for Ka2:", minScoreQuiet);
});

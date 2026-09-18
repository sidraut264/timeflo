import { GameState, GameStatus } from './src/game/GameState';
import { Player } from './src/game/Player';
import { ComputerPlayer } from './src/game/ai/ComputerPlayer';
import { King, Rook, Pawn } from './src/game/Piece';

const state = new GameState(true);
state.board.setPiece({ file: 0, rank: 0 }, new King(Player.White));
state.board.setPiece({ file: 0, rank: 8 }, new King(Player.Black));
state.board.setPiece({ file: 0, rank: 7 }, new Pawn(Player.Black));
state.board.setPiece({ file: 1, rank: 7 }, new Pawn(Player.Black));
state.board.setPiece({ file: 2, rank: 7 }, new Pawn(Player.Black));
state.board.setPiece({ file: 4, rank: 0 }, new Rook(Player.White));
state.board.setPiece({ file: 6, rank: 0 }, new Rook(Player.Black));

const moves = state.getLegalMoves({ file: 4, rank: 0 });
console.log("Legal moves for Rook:", moves);

const clonedState = state.clone();
const success = clonedState.makeMove({file:4,rank:0}, {file:4,rank:8});
console.log("Make move success:", success);
console.log("Game over?", clonedState.isGameOver());
console.log("Status:", clonedState.gameStatus);

const move = ComputerPlayer.chooseMove(state, Player.White);
console.log("Chosen move:", move);

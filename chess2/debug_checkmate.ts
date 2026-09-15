import { GameState } from './src/game/GameState';
import { Board } from './src/game/Board';
import { Player } from './src/game/Player';
import { Pawn, Rook, King } from './src/game/Piece';

const gameState = new GameState(true);
const board = gameState.board;

board.setPiece(Board.parseCoordinate('a1'), new King(Player.White));
board.setPiece(Board.parseCoordinate('c2'), new Rook(Player.Black));
board.setPiece(Board.parseCoordinate('c1'), new Rook(Player.Black));

console.log("Is White King in check? " + gameState.isKingInCheck(Player.White));

const moves = gameState.getLegalMoves(Board.parseCoordinate('a1'));
console.log("Legal moves for King at a1:", moves.map(m => `${String.fromCharCode('a'.charCodeAt(0) + m.file)}${m.rank + 1}`));

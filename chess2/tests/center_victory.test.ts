import { GameState, GameStatus } from '../src/game/GameState';
import { Board } from '../src/game/Board';
import { Player } from '../src/game/Player';
import { Pawn, Rook, King } from '../src/game/Piece';

describe('Center Victory Condition', () => {
  let gameState: GameState;
  let board: Board;

  beforeEach(() => {
    gameState = new GameState(true);
    board = gameState.board;
    gameState.currentPlayer = Player.White;
  });

  test('Basic White Center Victory', () => {
    // White King one square away from center
    board.setPiece(Board.parseCoordinate('e4'), new King(Player.White));
    // Black King somewhere safe
    board.setPiece(Board.parseCoordinate('e9'), new King(Player.Black));
    // Black piece to make a move
    board.setPiece(Board.parseCoordinate('a9'), new Rook(Player.Black));

    gameState.currentPlayer = Player.White;
    
    // 1. White King moves to e5
    expect(gameState.movePiece(Board.parseCoordinate('e4'), Board.parseCoordinate('e5'))).toBe(true);
    expect(gameState.centerHold?.player).toBe(Player.White);
    expect(gameState.gameStatus).toBe(GameStatus.Playing);
    
    // 2. Turn changes to Black. Black makes a legal move.
    expect(gameState.currentPlayer).toBe(Player.Black);
    expect(gameState.movePiece(Board.parseCoordinate('a9'), Board.parseCoordinate('b9'))).toBe(true);

    // 3. Black's turn completes. White King is still on e5. White should win!
    expect(gameState.gameStatus).toBe(GameStatus.CenterVictory);
    expect(gameState.winner).toBe(Player.White);
  });

  test('Leaving center cancels hold', () => {
    board.setPiece(Board.parseCoordinate('e5'), new King(Player.White));
    board.setPiece(Board.parseCoordinate('e9'), new King(Player.Black));
    board.setPiece(Board.parseCoordinate('a9'), new Rook(Player.Black));
    board.setPiece(Board.parseCoordinate('a1'), new Rook(Player.White));

    // Force hold to be active for White as if they just arrived
    gameState.currentPlayer = Player.White;
    gameState.centerHold = { player: Player.White };

    // 1. White decides to move the King away from the center to e4
    expect(gameState.movePiece(Board.parseCoordinate('e5'), Board.parseCoordinate('e4'))).toBe(true);
    
    // Hold should be cancelled
    expect(gameState.centerHold).toBeNull();
    expect(gameState.gameStatus).toBe(GameStatus.Playing);

    // 2. Black moves
    expect(gameState.movePiece(Board.parseCoordinate('a9'), Board.parseCoordinate('b9'))).toBe(true);

    // White should NOT win
    expect(gameState.gameStatus).toBe(GameStatus.Playing);
  });

  test('Checkmate overrides center hold', () => {
    board.setPiece(Board.parseCoordinate('e5'), new King(Player.White));
    // Black setup to checkmate White King on e5
    board.setPiece(Board.parseCoordinate('a9'), new Rook(Player.Black)); 
    board.setPiece(Board.parseCoordinate('e9'), new Rook(Player.Black));
    
    // White Pawns blocking the White King's escape on e4, d5, f5
    board.setPiece(Board.parseCoordinate('e4'), new Pawn(Player.White));
    board.setPiece(Board.parseCoordinate('d5'), new Pawn(Player.White));
    board.setPiece(Board.parseCoordinate('f5'), new Pawn(Player.White));
    
    // It is White's turn, but they are already holding center
    gameState.centerHold = { player: Player.White };
    gameState.currentPlayer = Player.Black;

    // Black moves Rook to e9 to checkmate White King on e5
    // Wait, the test setup says: Black moves Rook to checkmate White.
    // Let's place Black Rook on d9, and Black moves it to e9.
    board.removePiece(Board.parseCoordinate('e9'));
    board.setPiece(Board.parseCoordinate('d9'), new Rook(Player.Black));
    // Add Black King so game doesn't crash
    board.setPiece(Board.parseCoordinate('a8'), new King(Player.Black));

    // Black moves d9 to e9. This attacks the e-file (e5 King is checked).
    // King is blocked from moving left/right/down by friendly pawns.
    // Wait, King could move diagonally (d4, f4, d6, f6, e6).
    // Let's just surround it completely for a true mate.
    const surrounding = ['d4', 'e4', 'f4', 'd5', 'f5', 'd6', 'e6', 'f6'];
    surrounding.forEach(coord => {
      if (coord !== 'e6') { // leave e6 empty so the rook attack goes through
        board.setPiece(Board.parseCoordinate(coord), new Pawn(Player.White));
      }
    });

    // Now move Black Rook
    expect(gameState.movePiece(Board.parseCoordinate('d9'), Board.parseCoordinate('e9'))).toBe(true);

    // It should be Checkmate for Black!
    expect(gameState.gameStatus).toBe(GameStatus.Finished); // Checkmate
    expect(gameState.winner).toBe(Player.Black);
  });

  test('Simulated moves do not trigger center victory', () => {
    board.setPiece(Board.parseCoordinate('e5'), new King(Player.White));
    board.setPiece(Board.parseCoordinate('e9'), new King(Player.Black));
    board.setPiece(Board.parseCoordinate('a9'), new Rook(Player.Black));
    
    gameState.currentPlayer = Player.White;
    gameState.centerHold = { player: Player.White };

    // During getLegalMoves, it creates clones and simulates moves.
    const moves = gameState.getLegalMoves(Board.parseCoordinate('e5'));
    
    // The real GameState should NOT be affected
    expect(gameState.gameStatus).toBe(GameStatus.Playing);
    expect(gameState.centerHold.player).toBe(Player.White);
  });
});

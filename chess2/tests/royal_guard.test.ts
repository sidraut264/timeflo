import { GameState } from '../src/game/GameState';
import { Board, Position } from '../src/game/Board';
import { PieceType, RoyalGuard, Pawn, Rook, Bishop, Knight, Diplomat } from '../src/game/Piece';
import { Player } from '../src/game/Player';
import { ShieldSystem, RelativeDirection } from '../src/game/ShieldSystem';

describe('Royal Guard Mechanics', () => {
  let gameState: GameState;
  let board: Board;

  beforeEach(() => {
    gameState = new GameState();
    board = gameState.board;
    // Clear the board for isolated testing
    for (let r = 0; r < 9; r++) {
      for (let f = 0; f < 9; f++) {
        board.removePiece({ file: f, rank: r });
      }
    }
    // Re-add diplomats since they are permanent
    board.setPiece({ file: 3, rank: 3 }, new Diplomat());
    board.setPiece({ file: 5, rank: 3 }, new Diplomat());
    board.setPiece({ file: 3, rank: 5 }, new Diplomat());
    board.setPiece({ file: 5, rank: 5 }, new Diplomat());
  });

  const getMoves = (pos: string) => {
    return gameState.getLegalMoves(Board.parseCoordinate(pos)).map(p => 
      `${String.fromCharCode('a'.charCodeAt(0) + p.file)}${p.rank + 1}`
    );
  };

  describe('Movement and Capture', () => {
    test('Guard moves 1 square orthogonally, captures left/right/back but not forward', () => {
      board.setPiece(Board.parseCoordinate('e2'), new RoyalGuard(Player.White));
      
      // Empty squares around
      let moves = getMoves('e2');
      expect(moves.length).toBe(4);
      expect(moves).toContain('e3'); // Forward
      expect(moves).toContain('e1'); // Back
      expect(moves).toContain('d2'); // Left
      expect(moves).toContain('f2'); // Right

      // Add enemy pieces
      board.setPiece(Board.parseCoordinate('e3'), new Pawn(Player.Black)); // Forward
      board.setPiece(Board.parseCoordinate('e1'), new Pawn(Player.Black)); // Back
      board.setPiece(Board.parseCoordinate('d2'), new Pawn(Player.Black)); // Left
      board.setPiece(Board.parseCoordinate('f2'), new Pawn(Player.Black)); // Right

      moves = getMoves('e2');
      // Cannot capture forward (e3)
      expect(moves).not.toContain('e3');
      expect(moves).toContain('e1');
      expect(moves).toContain('d2');
      expect(moves).toContain('f2');
      expect(moves.length).toBe(3);
    });

    test('Guard cannot capture Diplomats', () => {
      board.setPiece(Board.parseCoordinate('c4'), new RoyalGuard(Player.White));
      // Diplomat is at d4 (right)
      const moves = getMoves('c4');
      expect(moves).not.toContain('d4');
      expect(moves).toContain('b4'); // left
      expect(moves).toContain('c5'); // forward empty
      expect(moves).toContain('c3'); // backward empty
    });
  });

  describe('Shield System - Correct Rule', () => {
    test('Guard Alone', () => {
      board.setPiece(Board.parseCoordinate('e2'), new RoyalGuard(Player.White));
      
      // Guard front is protected
      board.setPiece(Board.parseCoordinate('e7'), new Rook(Player.Black));
      expect(getMoves('e7')).not.toContain('e2');

      // Guard side is not protected
      board.setPiece(Board.parseCoordinate('a2'), new Rook(Player.Black));
      expect(getMoves('a2')).toContain('e2');

      // Guard diagonal is not protected (e.g. from c4, which is Front-Left)
      board.setPiece(Board.parseCoordinate('c4'), new Bishop(Player.Black));
      expect(getMoves('c4')).toContain('e2');
    });

    test('Left-side piece', () => {
      board.setPiece(Board.parseCoordinate('e2'), new RoyalGuard(Player.White));
      board.setPiece(Board.parseCoordinate('d2'), new Pawn(Player.White)); // Left piece (P)
      
      // P front is protected (attack from d7)
      board.setPiece(Board.parseCoordinate('d7'), new Rook(Player.Black));
      expect(getMoves('d7')).not.toContain('d2');

      // P front-left diagonal is protected (attack from a5 to d2)
      board.setPiece(Board.parseCoordinate('a5'), new Bishop(Player.Black));
      expect(getMoves('a5')).not.toContain('d2');

      // P front-right diagonal is NOT protected (attack from e4 to d2 with Knight)
      board.setPiece(Board.parseCoordinate('e4'), new Knight(Player.Black));
      expect(getMoves('e4')).toContain('d2');

      // P rear diagonals are NOT protected (attack from c1 to d2)
      board.setPiece(Board.parseCoordinate('c1'), new Bishop(Player.Black));
      expect(getMoves('c1')).toContain('d2');
    });

    test('Right-side piece', () => {
      board.setPiece(Board.parseCoordinate('e2'), new RoyalGuard(Player.White));
      board.setPiece(Board.parseCoordinate('f2'), new Pawn(Player.White)); // Right piece (P)
      
      // P front is protected (attack from f7)
      board.setPiece(Board.parseCoordinate('f7'), new Rook(Player.Black));
      expect(getMoves('f7')).not.toContain('f2');

      // P front-right diagonal is protected (attack from i5 to f2)
      board.setPiece(Board.parseCoordinate('i5'), new Bishop(Player.Black));
      expect(getMoves('i5')).not.toContain('f2');

      // P front-left diagonal is NOT protected (attack from e4 to f2 with Knight)
      board.setPiece(Board.parseCoordinate('e4'), new Knight(Player.Black));
      expect(getMoves('e4')).toContain('f2');

      // P rear diagonals are NOT protected (attack from g1 to f2)
      board.setPiece(Board.parseCoordinate('g1'), new Bishop(Player.Black));
      expect(getMoves('g1')).toContain('f2');
    });

    test('Both sides', () => {
      board.setPiece(Board.parseCoordinate('e2'), new RoyalGuard(Player.White));
      board.setPiece(Board.parseCoordinate('d2'), new Pawn(Player.White)); // Left P
      board.setPiece(Board.parseCoordinate('f2'), new Pawn(Player.White)); // Right P
      
      // Guard front is protected
      board.setPiece(Board.parseCoordinate('e7'), new Rook(Player.Black));
      expect(getMoves('e7')).not.toContain('e2');

      // Left P: front + front-left protected
      board.setPiece(Board.parseCoordinate('d7'), new Rook(Player.Black));
      expect(getMoves('d7')).not.toContain('d2'); // front
      board.setPiece(Board.parseCoordinate('a5'), new Bishop(Player.Black));
      expect(getMoves('a5')).not.toContain('d2'); // front-left

      // Left P: front-right NOT protected (from e4 Knight)
      board.setPiece(Board.parseCoordinate('e4'), new Knight(Player.Black));
      expect(getMoves('e4')).toContain('d2');

      // Right P: front + front-right protected
      board.setPiece(Board.parseCoordinate('f7'), new Rook(Player.Black));
      expect(getMoves('f7')).not.toContain('f2'); // front
      board.setPiece(Board.parseCoordinate('i5'), new Bishop(Player.Black));
      expect(getMoves('i5')).not.toContain('f2'); // front-right

      // Right P: front-left NOT protected (from e4 Knight)
      // Already set e4 knight above
      expect(getMoves('e4')).toContain('f2');
    });

    test('Black Guard Orientation (Mirror Test)', () => {
      // Black Guard at e8 (facing down, decreasing rank)
      board.setPiece(Board.parseCoordinate('e8'), new RoyalGuard(Player.Black));
      
      // Black's Left is increasing file (f8). Black's Right is decreasing file (d8).
      board.setPiece(Board.parseCoordinate('f8'), new Pawn(Player.Black)); // Left P
      board.setPiece(Board.parseCoordinate('d8'), new Pawn(Player.Black)); // Right P

      // Guard front is protected (attack from e2 going up to e8)
      board.setPiece(Board.parseCoordinate('e2'), new Rook(Player.White));
      expect(getMoves('e2')).not.toContain('e8');

      // Left P (f8): front + front-left protected
      board.setPiece(Board.parseCoordinate('f2'), new Rook(Player.White));
      expect(getMoves('f2')).not.toContain('f8');
      board.setPiece(Board.parseCoordinate('i5'), new Bishop(Player.White));
      expect(getMoves('i5')).not.toContain('f8'); // front-left protected

      // Left P (f8): front-right NOT protected (use Knight at e6)
      board.setPiece(Board.parseCoordinate('e6'), new Knight(Player.White));
      expect(getMoves('e6')).toContain('f8');

      // Right P (d8): front + front-right protected
      board.setPiece(Board.parseCoordinate('d2'), new Rook(Player.White));
      expect(getMoves('d2')).not.toContain('d8');
      board.setPiece(Board.parseCoordinate('a5'), new Bishop(Player.White));
      expect(getMoves('a5')).not.toContain('d8');

      // Right P (d8): front-left NOT protected (use Knight at e6)
      // e6 Knight already set
      expect(getMoves('e6')).toContain('d8');
    });
  });
});

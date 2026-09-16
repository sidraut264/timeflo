import { GameState } from '../src/game/GameState';
import { Board } from '../src/game/Board';
import { PieceType, RoyalGuard, Pawn, Rook, Bishop, Knight, Diplomat } from '../src/game/Piece';
import { Player } from '../src/game/Player';

describe('Royal Guard Mechanics', () => {
  let gameState: GameState;
  let board: Board;

  beforeEach(() => {
    gameState = new GameState(true);
    board = gameState.board;
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
    test('Guard moves 1 square orthogonally', () => {
      board.setPiece(Board.parseCoordinate('e2'), new RoyalGuard(Player.White));
      gameState.currentPlayer = Player.White;

      const moves = getMoves('e2');
      expect(moves).toContain('e3'); // Forward
      expect(moves).toContain('e1'); // Back
      expect(moves).toContain('d2'); // Left
      expect(moves).toContain('f2'); // Right
    });

    test('Guard cannot capture forward enemy, can capture L/R/Back enemies', () => {
      board.setPiece(Board.parseCoordinate('e2'), new RoyalGuard(Player.White));
      board.setPiece(Board.parseCoordinate('e3'), new Pawn(Player.Black)); // Forward
      board.setPiece(Board.parseCoordinate('e1'), new Pawn(Player.Black)); // Back
      board.setPiece(Board.parseCoordinate('d2'), new Pawn(Player.Black)); // Left
      board.setPiece(Board.parseCoordinate('f2'), new Pawn(Player.Black)); // Right
      gameState.currentPlayer = Player.White;

      const moves = getMoves('e2');
      expect(moves).not.toContain('e3'); // Cannot capture forward
      expect(moves).toContain('e1');
      expect(moves).toContain('d2');
      expect(moves).toContain('f2');
    });

    test('Guard cannot capture Diplomats', () => {
      board.setPiece(Board.parseCoordinate('c4'), new RoyalGuard(Player.White));
      gameState.currentPlayer = Player.White;
      // Diplomat is at d4 (right)
      const moves = getMoves('c4');
      expect(moves).not.toContain('d4');
      expect(moves).toContain('b4'); // left
      expect(moves).toContain('c5'); // forward
      expect(moves).toContain('c3'); // backward
    });
  });

  describe('Shield System — White', () => {
    test('Guard Alone: protected only from Front, NOT from sides or diagonals', () => {
      board.setPiece(Board.parseCoordinate('e2'), new RoyalGuard(Player.White));

      // Front attack blocked
      board.setPiece(Board.parseCoordinate('e7'), new Rook(Player.Black));
      expect(getMoves('e7')).not.toContain('e2');

      // Side attack NOT blocked
      board.setPiece(Board.parseCoordinate('a2'), new Rook(Player.Black));
      expect(getMoves('a2')).toContain('e2');

      // FrontLeft diagonal NOT blocked (Bishop at c4)
      board.setPiece(Board.parseCoordinate('c4'), new Bishop(Player.Black));
      expect(getMoves('c4')).toContain('e2');

      // FrontRight diagonal NOT blocked (Bishop at g4)
      board.setPiece(Board.parseCoordinate('g4'), new Bishop(Player.Black));
      expect(getMoves('g4')).toContain('e2');
    });

    // Formation: P G (White)
    // White's left = decreasing file → Pawn at d2, Guard at e2
    // Guard is to the RIGHT of the Pawn → protected diagonal = FrontRight
    test('White P G: left piece protected from Front + FrontRight (toward Guard)', () => {
      board.setPiece(Board.parseCoordinate('e2'), new RoyalGuard(Player.White));
      board.setPiece(Board.parseCoordinate('d2'), new Pawn(Player.White)); // Left piece

      // Front (d7 → d2 Rook) — BLOCKED
      board.setPiece(Board.parseCoordinate('d7'), new Rook(Player.Black));
      expect(getMoves('d7')).not.toContain('d2');

      // FrontRight diagonal (e3 → d2 via Bishop, or e4→d2 direction) = TOWARD Guard → BLOCKED
      // Bishop at e3 attacks d2 from FrontRight of d2 (from d2's perspective, e3 is right+front)
      board.setPiece(Board.parseCoordinate('e3'), new Bishop(Player.Black));
      expect(getMoves('e3')).not.toContain('d2');

      // FrontLeft diagonal (c3 → d2) = AWAY from Guard → NOT BLOCKED
      board.setPiece(Board.parseCoordinate('c3'), new Bishop(Player.Black));
      expect(getMoves('c3')).toContain('d2');

      // Knight at e4 → d2 (attacks from FrontRight area) — BLOCKED
      board.setPiece(Board.parseCoordinate('e4'), new Knight(Player.Black));
      expect(getMoves('e4')).not.toContain('d2');

      // Rear diagonals NOT protected — Bishop from c1 → d2
      board.setPiece(Board.parseCoordinate('c1'), new Bishop(Player.Black));
      expect(getMoves('c1')).toContain('d2');
    });

    // Formation: G P (White)
    // White's right = increasing file → Pawn at f2, Guard at e2
    // Guard is to the LEFT of the Pawn → protected diagonal = FrontLeft
    test('White G P: right piece protected from Front + FrontLeft (toward Guard)', () => {
      board.setPiece(Board.parseCoordinate('e2'), new RoyalGuard(Player.White));
      board.setPiece(Board.parseCoordinate('f2'), new Pawn(Player.White)); // Right piece

      // Front (f7 → f2 Rook) — BLOCKED
      board.setPiece(Board.parseCoordinate('f7'), new Rook(Player.Black));
      expect(getMoves('f7')).not.toContain('f2');

      // FrontLeft diagonal (e3 → f2) = TOWARD Guard → BLOCKED
      board.setPiece(Board.parseCoordinate('e3'), new Bishop(Player.Black));
      expect(getMoves('e3')).not.toContain('f2');

      // FrontRight diagonal (g3 → f2) = AWAY from Guard → NOT BLOCKED
      board.setPiece(Board.parseCoordinate('g3'), new Bishop(Player.Black));
      expect(getMoves('g3')).toContain('f2');

      // Knight at e4 → f2 (FrontLeft direction) — BLOCKED
      board.setPiece(Board.parseCoordinate('e4'), new Knight(Player.Black));
      expect(getMoves('e4')).not.toContain('f2');

      // Rear diagonal NOT protected — Bishop from g1 → f2
      board.setPiece(Board.parseCoordinate('g1'), new Bishop(Player.Black));
      expect(getMoves('g1')).toContain('f2');
    });

    // Formation: P G P (White)
    test('White P G P: each piece protected from Front + diagonal toward Guard', () => {
      board.setPiece(Board.parseCoordinate('e2'), new RoyalGuard(Player.White));
      board.setPiece(Board.parseCoordinate('d2'), new Pawn(Player.White)); // Left
      board.setPiece(Board.parseCoordinate('f2'), new Pawn(Player.White)); // Right

      // Guard front protected
      board.setPiece(Board.parseCoordinate('e7'), new Rook(Player.Black));
      expect(getMoves('e7')).not.toContain('e2');

      // Left P: Front blocked
      board.setPiece(Board.parseCoordinate('d7'), new Rook(Player.Black));
      expect(getMoves('d7')).not.toContain('d2');

      // Left P: FrontRight (toward Guard) blocked — Bishop e3 → d2
      board.setPiece(Board.parseCoordinate('e3'), new Bishop(Player.Black));
      expect(getMoves('e3')).not.toContain('d2');

      // Left P: FrontLeft (away from Guard) NOT blocked — Bishop c3 → d2
      board.setPiece(Board.parseCoordinate('c3'), new Bishop(Player.Black));
      expect(getMoves('c3')).toContain('d2');

      // Right P: Front blocked
      board.setPiece(Board.parseCoordinate('f7'), new Rook(Player.Black));
      expect(getMoves('f7')).not.toContain('f2');

      // Right P: FrontLeft (toward Guard) blocked — Bishop e3 → f2
      // e3 attacks f2 from its FrontLeft perspective
      expect(getMoves('e3')).not.toContain('f2');

      // Right P: FrontRight (away from Guard) NOT blocked — Bishop g3 → f2
      board.setPiece(Board.parseCoordinate('g3'), new Bishop(Player.Black));
      expect(getMoves('g3')).toContain('f2');
    });
  });

  describe('Shield System — Black', () => {
    // Black faces decreasing ranks. Black's left = increasing file, Black's right = decreasing file.
    // Black Guard at e8.
    //
    // Black "P G" (Black's left has Pawn f8, Guard at e8):
    //   From Black's perspective, Guard is to the RIGHT of f8
    //   Black's "front" = decreasing rank
    //   FrontRight for Black's f8 = toward decreasing rank AND decreasing file (toward e8 direction in absolute coords)
    //   = absolute diagonal: f8 → e7, i.e. attack from e7 on f8 is FrontRight for Black piece

    test('Black Guard alone: protected only from Front', () => {
      board.setPiece(Board.parseCoordinate('e8'), new RoyalGuard(Player.Black));

      // Front for Black = decreasing rank → Rook at e2 attacks from front → BLOCKED
      board.setPiece(Board.parseCoordinate('e2'), new Rook(Player.White));
      expect(getMoves('e2')).not.toContain('e8');

      // Side NOT protected — Rook at a8
      board.setPiece(Board.parseCoordinate('a8'), new Rook(Player.White));
      expect(getMoves('a8')).toContain('e8');

      // FrontLeft diagonal NOT blocked (from Black's FrontLeft = decreasing rank + increasing file)
      // That's g6 → e8 direction. Bishop at g6.
      board.setPiece(Board.parseCoordinate('g6'), new Bishop(Player.White));
      expect(getMoves('g6')).toContain('e8');
    });

    // Black P G formation: Black's left piece is at f8 (increasing file), Guard at e8
    // Guard is to the RIGHT of f8 (in Black orientation)
    // Protected diagonal for f8 = FrontRight (toward Guard) = absolute: decreasing rank + decreasing file = e7 direction
    test('Black P G: left piece (f8) protected from Front + FrontRight (toward Guard at e8)', () => {
      board.setPiece(Board.parseCoordinate('e8'), new RoyalGuard(Player.Black));
      board.setPiece(Board.parseCoordinate('f8'), new Pawn(Player.Black)); // Black's left piece

      // Front of f8 (Black) = decreasing rank → Rook at f2 → BLOCKED
      board.setPiece(Board.parseCoordinate('f2'), new Rook(Player.White));
      expect(getMoves('f2')).not.toContain('f8');

      // FrontRight of f8 in Black orientation = decreasing rank + decreasing file = e7 → f8 diagonal
      // Bishop at e7 attacks f8 — BLOCKED (toward Guard)
      board.setPiece(Board.parseCoordinate('e7'), new Bishop(Player.White));
      expect(getMoves('e7')).not.toContain('f8');

      // FrontLeft of f8 in Black orientation = decreasing rank + increasing file = g7 → f8 diagonal  
      // Bishop at g7 attacks f8 — NOT BLOCKED (away from Guard)
      board.setPiece(Board.parseCoordinate('g7'), new Bishop(Player.White));
      expect(getMoves('g7')).toContain('f8');

      // Rear diagonal NOT protected — Bishop at g9 → f8
      board.setPiece(Board.parseCoordinate('g9'), new Bishop(Player.White));
      expect(getMoves('g9')).toContain('f8');
    });

    // Black G P formation: Black's right piece is at d8 (decreasing file), Guard at e8
    // Guard is to the LEFT of d8 (in Black orientation)
    // Protected diagonal for d8 = FrontLeft (toward Guard) = absolute: decreasing rank + increasing file = e7 direction
    test('Black G P: right piece (d8) protected from Front + FrontLeft (toward Guard at e8)', () => {
      board.setPiece(Board.parseCoordinate('e8'), new RoyalGuard(Player.Black));
      board.setPiece(Board.parseCoordinate('d8'), new Pawn(Player.Black)); // Black's right piece

      // Front of d8 (Black) = decreasing rank → Rook at d2 → BLOCKED
      board.setPiece(Board.parseCoordinate('d2'), new Rook(Player.White));
      expect(getMoves('d2')).not.toContain('d8');

      // FrontLeft of d8 in Black orientation = decreasing rank + increasing file = e7 → d8 diagonal
      // Bishop at e7 attacks d8 — BLOCKED (toward Guard)
      board.setPiece(Board.parseCoordinate('e7'), new Bishop(Player.White));
      expect(getMoves('e7')).not.toContain('d8');

      // FrontRight of d8 in Black orientation = decreasing rank + decreasing file = c7 → d8 diagonal
      // Bishop at c7 attacks d8 — NOT BLOCKED (away from Guard)
      board.setPiece(Board.parseCoordinate('c7'), new Bishop(Player.White));
      expect(getMoves('c7')).toContain('d8');

      // Rear diagonal NOT protected — Bishop at c9 → d8
      board.setPiece(Board.parseCoordinate('c9'), new Bishop(Player.White));
      expect(getMoves('c9')).toContain('d8');
    });

    // Black P G P: f8 (left) and d8 (right) with Guard at e8
    test('Black P G P: each piece protected from Front + diagonal toward Guard', () => {
      board.setPiece(Board.parseCoordinate('e8'), new RoyalGuard(Player.Black));
      board.setPiece(Board.parseCoordinate('f8'), new Pawn(Player.Black)); // Left
      board.setPiece(Board.parseCoordinate('d8'), new Pawn(Player.Black)); // Right

      // Guard front (e2 → e8) — BLOCKED
      board.setPiece(Board.parseCoordinate('e2'), new Rook(Player.White));
      expect(getMoves('e2')).not.toContain('e8');

      // Left f8: Front (f2→f8) blocked
      board.setPiece(Board.parseCoordinate('f2'), new Rook(Player.White));
      expect(getMoves('f2')).not.toContain('f8');

      // Left f8: FrontRight toward Guard (e7→f8) blocked
      board.setPiece(Board.parseCoordinate('e7'), new Bishop(Player.White));
      expect(getMoves('e7')).not.toContain('f8');

      // Left f8: FrontLeft away from Guard (g7→f8) NOT blocked
      board.setPiece(Board.parseCoordinate('g7'), new Bishop(Player.White));
      expect(getMoves('g7')).toContain('f8');

      // Right d8: Front (d2→d8) blocked
      board.setPiece(Board.parseCoordinate('d2'), new Rook(Player.White));
      expect(getMoves('d2')).not.toContain('d8');

      // Right d8: FrontLeft toward Guard (e7→d8) blocked
      expect(getMoves('e7')).not.toContain('d8');

      // Right d8: FrontRight away from Guard (c7→d8) NOT blocked
      board.setPiece(Board.parseCoordinate('c7'), new Bishop(Player.White));
      expect(getMoves('c7')).toContain('d8');
    });
  });
});

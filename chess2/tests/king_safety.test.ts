import { GameState } from '../src/game/GameState';
import { Board, Position } from '../src/game/Board';
import { Player } from '../src/game/Player';
import { Pawn, Rook, Bishop, Knight, Queen, King, Minister, RoyalGuard, Diplomat } from '../src/game/Piece';

describe('King Safety & Check System', () => {
  let gameState: GameState;
  let board: Board;

  beforeEach(() => {
    // skipInit = true to start with empty board
    gameState = new GameState(true);
    board = gameState.board;
    gameState.currentPlayer = Player.White;
  });

  const getLegalMoves = (pos: string) => {
    return gameState.getLegalMoves(Board.parseCoordinate(pos)).map(p => 
      `${String.fromCharCode('a'.charCodeAt(0) + p.file)}${p.rank + 1}`
    );
  };

  describe('Basic Check Detection', () => {
    test('King in check by Rook', () => {
      board.setPiece(Board.parseCoordinate('e2'), new King(Player.White));
      board.setPiece(Board.parseCoordinate('e8'), new Rook(Player.Black));
      expect(gameState.isKingInCheck(Player.White)).toBe(true);
    });

    test('King NOT in check if blocked', () => {
      board.setPiece(Board.parseCoordinate('e2'), new King(Player.White));
      board.setPiece(Board.parseCoordinate('e8'), new Rook(Player.Black));
      board.setPiece(Board.parseCoordinate('e5'), new Pawn(Player.White)); // blocking piece
      expect(gameState.isKingInCheck(Player.White)).toBe(false);
    });

    test('Pawn checking King uses diagonal attacks, NOT forward movement', () => {
      board.setPiece(Board.parseCoordinate('e2'), new King(Player.White));
      
      // Black pawn at e3 facing down (front is e2). Forward move is NOT an attack.
      board.setPiece(Board.parseCoordinate('e3'), new Pawn(Player.Black));
      expect(gameState.isKingInCheck(Player.White)).toBe(false);

      // Black pawn at f3 facing down. Diagonal attack is e2.
      board.setPiece(Board.parseCoordinate('f3'), new Pawn(Player.Black));
      expect(gameState.isKingInCheck(Player.White)).toBe(true);
    });

    test('Diplomat does not check King', () => {
      board.setPiece(Board.parseCoordinate('e2'), new King(Player.White));
      // Even if adjacent, Diplomat can't attack
      board.setPiece(Board.parseCoordinate('e3'), new Diplomat());
      expect(gameState.isKingInCheck(Player.White)).toBe(false);
    });
  });

  describe('King Movement Restrictions', () => {
    test('King cannot move into check', () => {
      board.setPiece(Board.parseCoordinate('e2'), new King(Player.White));
      board.setPiece(Board.parseCoordinate('h3'), new Rook(Player.Black)); // attacks rank 3

      const moves = getLegalMoves('e2');
      // e2 king can normally move to rank 1, 2, 3.
      // e3, d3, f3 are on rank 3, so they should be filtered out!
      expect(moves).not.toContain('e3');
      expect(moves).not.toContain('d3');
      expect(moves).not.toContain('f3');
      
      // Safe squares
      expect(moves).toContain('e1');
      expect(moves).toContain('d2');
    });

    test('King can capture attacking piece if the resulting square is safe', () => {
      board.setPiece(Board.parseCoordinate('e2'), new King(Player.White));
      board.setPiece(Board.parseCoordinate('e3'), new Rook(Player.Black)); 
      
      // King can capture e3
      expect(getLegalMoves('e2')).toContain('e3');
      
      // Now protect the Rook with a Bishop
      board.setPiece(Board.parseCoordinate('h6'), new Bishop(Player.Black)); // h6 to e3 is a diagonal
      // e3 is now protected. King should NOT be able to capture.
      expect(getLegalMoves('e2')).not.toContain('e3');
    });
  });

  describe('Check Resolution for Other Pieces', () => {
    test('Unrelated piece cannot move while King is in check', () => {
      board.setPiece(Board.parseCoordinate('e2'), new King(Player.White));
      board.setPiece(Board.parseCoordinate('e8'), new Rook(Player.Black)); // check
      
      board.setPiece(Board.parseCoordinate('a2'), new Pawn(Player.White));
      
      // Moving pawn does not resolve check, so it has 0 legal moves
      expect(getLegalMoves('a2')).toHaveLength(0);
    });

    test('Piece can move to block check', () => {
      board.setPiece(Board.parseCoordinate('e2'), new King(Player.White));
      board.setPiece(Board.parseCoordinate('e8'), new Rook(Player.Black)); // check
      
      board.setPiece(Board.parseCoordinate('a5'), new Rook(Player.White));
      
      // White rook can move to e5 to block the check
      const moves = getLegalMoves('a5');
      expect(moves).toContain('e5');
      // It cannot move to b5 because that doesn't block the check
      expect(moves).not.toContain('b5');
    });

    test('Piece can capture the attacker to resolve check', () => {
      board.setPiece(Board.parseCoordinate('e2'), new King(Player.White));
      board.setPiece(Board.parseCoordinate('e8'), new Rook(Player.Black)); // check
      
      board.setPiece(Board.parseCoordinate('h8'), new Rook(Player.White));
      
      // White rook can capture on e8
      const moves = getLegalMoves('h8');
      expect(moves).toContain('e8');
      expect(moves).not.toContain('h7');
    });
  });

  describe('Minister Interactions', () => {
    test('Minister can check from 2 squares away', () => {
      board.setPiece(Board.parseCoordinate('e2'), new King(Player.White));
      board.setPiece(Board.parseCoordinate('e4'), new Minister(Player.Black));
      expect(gameState.isKingInCheck(Player.White)).toBe(true);
    });

    test('Minister pawn conversion during simulation does not mutate real board', () => {
      board.setPiece(Board.parseCoordinate('e1'), new King(Player.White));
      board.setPiece(Board.parseCoordinate('e2'), new Pawn(Player.Black));
      board.setPiece(Board.parseCoordinate('e3'), new Minister(Player.White));
      
      // Black's turn, Black Rook checks White King
      board.setPiece(Board.parseCoordinate('a1'), new Rook(Player.Black)); 
      
      // Get legal moves for White Minister. It can jump to e1 (blocked by King), e5, c3, g3.
      // Jump to e1 would convert the e2 pawn.
      // Jump to c1/g1 are diagonal... wait, Minister moves 1 or 2 squares in any direction.
      // Is jumping to e1 valid? No, friendly king is there.
      // But during getLegalMoves, it simulates ALL possible moves to see if they resolve check.
      const ministerMoves = getLegalMoves('e3');
      
      // None of the Minister's moves can block the a1-e1 rook attack because Minister jumping to e1 is blocked,
      // and moving to c1 or g1 doesn't block (wait, c1 is rank 1 file 2. from e3 to c1 is 2-sq diagonal).
      // If Minister moves to c1, does it block? Yes!
      expect(ministerMoves).toContain('c1');
      
      // The real board should NOT have converted the pawn because getLegalMoves is side-effect-free
      const pawn = board.getPiece(Board.parseCoordinate('e2'));
      expect(pawn?.owner).toBe(Player.Black);
    });
  });

  describe('Checkmate', () => {
    test('isCheckmate returns true when no legal moves resolve check', () => {
      // Setup a basic checkmate: King on edge, surrounded
      board.setPiece(Board.parseCoordinate('a1'), new King(Player.White));
      board.setPiece(Board.parseCoordinate('c2'), new Rook(Player.Black)); // covers rank 2 (a2, b2)
      board.setPiece(Board.parseCoordinate('c1'), new Rook(Player.Black)); // checks a1 and covers b1
      
      const moves = getLegalMoves('a1');
      console.log('King moves:', moves);
      
      expect(gameState.isKingInCheck(Player.White)).toBe(true);
      expect(gameState.isCheckmate(Player.White)).toBe(true);
    });

    test('isCheckmate returns false when check can be blocked', () => {
      board.setPiece(Board.parseCoordinate('a1'), new King(Player.White));
      board.setPiece(Board.parseCoordinate('b3'), new Rook(Player.Black)); 
      board.setPiece(Board.parseCoordinate('c1'), new Rook(Player.Black)); // checks a1
      
      // Add a white bishop that can block on b1
      board.setPiece(Board.parseCoordinate('c2'), new Bishop(Player.White));
      
      expect(gameState.isCheckmate(Player.White)).toBe(false);
    });

    test('gameStatus updates to Finished after checkmating move', () => {
      // Setup Scholar's mate style or simple back rank
      board.setPiece(Board.parseCoordinate('e9'), new King(Player.Black));
      board.setPiece(Board.parseCoordinate('d8'), new Pawn(Player.Black));
      board.setPiece(Board.parseCoordinate('e8'), new Pawn(Player.Black));
      board.setPiece(Board.parseCoordinate('f8'), new Pawn(Player.Black));
      
      // White rook ready to mate on rank 9
      board.setPiece(Board.parseCoordinate('h1'), new Rook(Player.White));
      
      gameState.currentPlayer = Player.White;
      
      const success = gameState.movePiece(Board.parseCoordinate('h1'), Board.parseCoordinate('h9'));
      
      expect(success).toBe(true);
      expect(gameState.isCheckmate(Player.Black)).toBe(true);
      // Wait, let's verify if movePiece actually updated the gameStatus!
      // In movePiece, we checked `if (!this.hasAnyLegalMove(this.currentPlayer))` AFTER toggling turns.
      // So currentPlayer is now Black. hasAnyLegalMove(Black) === false.
      // isKingInCheck(Black) === true.
      // gameStatus = Finished.
      expect(gameState.gameStatus).toBe('FINISHED'); // GameStatus.Finished
      expect(gameState.winner).toBe(Player.White);
    });
  });
});

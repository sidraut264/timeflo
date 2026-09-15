import { GameState } from '../src/game/GameState';
import { Board, Position } from '../src/game/Board';
import { PieceType, Minister, Pawn, Rook, Bishop, Knight, Diplomat, RoyalGuard } from '../src/game/Piece';
import { Player } from '../src/game/Player';

describe('Minister Mechanics', () => {
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
    // Set active player to White
    gameState.currentPlayer = Player.White;
    
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

  describe('Movement', () => {
    test('Minister moves 1 or 2 squares in any direction', () => {
      board.setPiece(Board.parseCoordinate('e2'), new Minister(Player.White));
      
      const moves = getMoves('e2');
      // 1 square: e3, e1, d2, f2, d3, f3, d1, f1 (8 moves)
      // 2 squares: e4, e0(invalid), c2, g2, c4, g4, c0(invalid), g0(invalid) (5 valid moves on board)
      // Wait, rank 0 is 1. so rank -1 is invalid.
      // e2 is file 4, rank 1.
      // 1-square:
      // f: 4, r: 1 -> (4,2)=e3, (4,0)=e1, (3,1)=d2, (5,1)=f2, (3,2)=d3, (5,2)=f3, (3,0)=d1, (5,0)=f1 -> 8 moves
      // 2-square:
      // f: 4, r: 1 -> (4,3)=e4, (4,-1)=invalid, (2,1)=c2, (6,1)=g2, (2,3)=c4, (6,3)=g4, (2,-1)=invalid, (6,-1)=invalid -> 5 moves
      // Total 13 valid moves
      expect(moves.length).toBe(13);
      
      expect(moves).toContain('e3');
      expect(moves).toContain('e4');
      expect(moves).toContain('c2');
      expect(moves).toContain('g4');
      expect(moves).toContain('e1');
      expect(moves).toContain('d1');
    });

    test('Minister jumps over pieces without being blocked', () => {
      board.setPiece(Board.parseCoordinate('e2'), new Minister(Player.White));
      // Put pieces 1 square away to block standard sliding
      board.setPiece(Board.parseCoordinate('e3'), new Pawn(Player.White)); // front
      board.setPiece(Board.parseCoordinate('d2'), new Pawn(Player.Black)); // left
      board.setPiece(Board.parseCoordinate('d3'), new Diplomat()); // front-left (d3 is 3,2)
      
      const moves = getMoves('e2');
      // Cannot land on e3 (friendly)
      expect(moves).not.toContain('e3');
      // CAN jump to e4
      expect(moves).toContain('e4');
      
      // Can capture d2
      expect(moves).toContain('d2');
      // CAN jump to c2
      expect(moves).toContain('c2');
      
      // Cannot capture Diplomat on d3
      expect(moves).not.toContain('d3');
      // CAN jump to c4 over Diplomat
      expect(moves).toContain('c4');
    });
  });

  describe('Pawn Conversion', () => {
    test('Minister jumping over ENEMY Pawn converts it', () => {
      board.setPiece(Board.parseCoordinate('e2'), new Minister(Player.White));
      const blackPawn = new Pawn(Player.Black);
      board.setPiece(Board.parseCoordinate('e3'), blackPawn);
      
      // Move Minister 2 squares to e4
      const moved = gameState.movePiece(Board.parseCoordinate('e2'), Board.parseCoordinate('e4'));
      expect(moved).toBe(true);
      
      // Minister is at e4
      const minister = board.getPiece(Board.parseCoordinate('e4'));
      expect(minister?.type).toBe(PieceType.Minister);
      expect(minister?.owner).toBe(Player.White); // Owner unchanged
      
      // Intermediate Pawn is converted to White
      const pawn = board.getPiece(Board.parseCoordinate('e3'));
      expect(pawn?.type).toBe(PieceType.Pawn);
      expect(pawn?.owner).toBe(Player.White);
    });

    test('Minister jumping over FRIENDLY Pawn does NOT convert it (stays friendly)', () => {
      board.setPiece(Board.parseCoordinate('e2'), new Minister(Player.Black));
      gameState.currentPlayer = Player.Black; // set turn

      const blackPawn = new Pawn(Player.Black);
      board.setPiece(Board.parseCoordinate('e3'), blackPawn);
      
      gameState.movePiece(Board.parseCoordinate('e2'), Board.parseCoordinate('e4'));
      
      const pawn = board.getPiece(Board.parseCoordinate('e3'));
      expect(pawn?.owner).toBe(Player.Black); // Remains black
    });

    test('Minister moving 1 square to capture enemy Pawn does NOT convert it', () => {
      board.setPiece(Board.parseCoordinate('e2'), new Minister(Player.White));
      const blackPawn = new Pawn(Player.Black);
      board.setPiece(Board.parseCoordinate('e3'), blackPawn);
      
      // Move Minister 1 square to e3 (capturing)
      const moved = gameState.movePiece(Board.parseCoordinate('e2'), Board.parseCoordinate('e3'));
      expect(moved).toBe(true);
      
      // e3 now contains Minister
      const pieceAtE3 = board.getPiece(Board.parseCoordinate('e3'));
      expect(pieceAtE3?.type).toBe(PieceType.Minister);
      expect(pieceAtE3?.owner).toBe(Player.White);
    });

    test('Minister jumping over enemy NON-PAWN does NOT convert it', () => {
      board.setPiece(Board.parseCoordinate('e2'), new Minister(Player.White));
      const blackRook = new Rook(Player.Black);
      board.setPiece(Board.parseCoordinate('e3'), blackRook);
      
      gameState.movePiece(Board.parseCoordinate('e2'), Board.parseCoordinate('e4'));
      
      const pieceAtE3 = board.getPiece(Board.parseCoordinate('e3'));
      expect(pieceAtE3?.type).toBe(PieceType.Rook);
      expect(pieceAtE3?.owner).toBe(Player.Black); // Unchanged
    });

    test('Minister jumping over Diplomat does NOT convert it', () => {
      board.setPiece(Board.parseCoordinate('c3'), new Minister(Player.White));
      // Diplomat is at d4 (3,3)
      // Jump to e5 (4,4)
      gameState.movePiece(Board.parseCoordinate('c3'), Board.parseCoordinate('e5'));
      
      const pieceAtD4 = board.getPiece(Board.parseCoordinate('d4'));
      expect(pieceAtD4?.type).toBe(PieceType.Diplomat);
      expect(pieceAtD4?.owner).toBe(Player.White); // Default diplomat owner, unchanged
    });
  });
});

import { GameState } from '../src/game/GameState';
import { Board, Position } from '../src/game/Board';
import { Player } from '../src/game/Player';
import { Rook, Bishop, Queen, Knight, King, Pawn, Diplomat, PieceType } from '../src/game/Piece';

describe('Movement Rules', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    // Clear the board for isolated tests
    for (let r = 0; r < Board.RANKS; r++) {
      for (let f = 0; f < Board.FILES; f++) {
        gameState.board.removePiece({ file: f, rank: r });
      }
    }
    // Set up diplomats as per rules
    const diplomatCoords = ['d4', 'f4', 'd6', 'f6'];
    diplomatCoords.forEach(coord => {
      gameState.board.setPiece(Board.parseCoordinate(coord), new Diplomat());
    });
  });

  const place = (piece: any, coord: string) => {
    const pos = Board.parseCoordinate(coord);
    gameState.board.setPiece(pos, piece);
    return pos;
  };

  const getMoves = (coord: string) => {
    const moves = gameState.getLegalMoves(Board.parseCoordinate(coord));
    return moves.map(m => {
      const fileChar = String.fromCharCode('a'.charCodeAt(0) + m.file);
      const rankChar = (m.rank + 1).toString();
      return `${fileChar}${rankChar}`;
    });
  };

  test('Rook moves horizontally and vertically, blocked by friendly, captures enemy, blocked by Diplomat', () => {
    place(new Rook(Player.White), 'e5');
    // e5 is center. Unblocked, it can move to e1-e4, e6-e9 (vertical) and a5-i5 (horizontal)
    
    // Add friendly block at e7
    place(new Pawn(Player.White), 'e7');
    // Add enemy at b5
    place(new Pawn(Player.Black), 'b5');
    // Diplomat is at d6, f6, d4, f4 (not on e5's path)
    
    const moves = getMoves('e5');
    
    // Horizontal: a5 blocked by b5. So c5, d5, f5, g5, h5, i5. Plus b5 (capture)
    expect(moves).toContain('b5'); // capture
    expect(moves).toContain('c5');
    expect(moves).toContain('i5');
    expect(moves).not.toContain('a5'); // behind enemy
    
    // Vertical: e1, e2, e3, e4, e6. e7 is friendly, e8, e9 blocked.
    expect(moves).toContain('e6');
    expect(moves).not.toContain('e7');
    expect(moves).not.toContain('e8');
  });

  test('Bishop moves diagonally, blocked by Diplomat', () => {
    place(new Bishop(Player.White), 'e5');
    // Diagonals: d6, f6, d4, f4 - wait, these are EXACTLY the Diplomat squares!
    // So Bishop at e5 cannot move AT ALL.
    const moves = getMoves('e5');
    expect(moves.length).toBe(0);
    
    // Move bishop to c3
    place(new Bishop(Player.White), 'c3');
    const movesC3 = getMoves('c3');
    // d4 is Diplomat. So it can't go to e5.
    expect(movesC3).not.toContain('e5');
    // Can go to b2, a1, b4, a5, d2, e1
    expect(movesC3).toContain('b2');
    expect(movesC3).toContain('b4');
  });

  test('Queen combines Rook and Bishop', () => {
    place(new Queen(Player.White), 'e5');
    const moves = getMoves('e5');
    
    // Diagonals blocked by diplomats at d4, f4, d6, f6
    // Horizontals and verticals open
    expect(moves).toContain('e9');
    expect(moves).toContain('a5');
    expect(moves).not.toContain('c7'); // Blocked by d6 diplomat
  });

  test('Knight jumps over pieces, cannot capture Diplomat', () => {
    place(new Knight(Player.White), 'e5');
    place(new Pawn(Player.White), 'f7'); // block one jump
    
    const moves = getMoves('e5');
    // Possible jumps from e5: d7, f7, c6, g6, c4, g4, d3, f3
    expect(moves).toContain('d7');
    expect(moves).not.toContain('f7'); // friendly
    expect(moves).toContain('g4');
  });

  test('King moves one square in any direction', () => {
    place(new King(Player.White), 'e5');
    const moves = getMoves('e5');
    // d6, f6, d4, f4 are diplomats.
    // e6, e4, d5, f5 are open.
    expect(moves).toContain('e6');
    expect(moves).toContain('d5');
    expect(moves).not.toContain('d6'); // diplomat
    expect(moves.length).toBe(4);
  });

  test('Pawn forward movement and capture', () => {
    // White pawn on initial rank (2nd rank -> y=1 -> '2')
    place(new Pawn(Player.White), 'a2');
    const movesWhite = getMoves('a2');
    expect(movesWhite).toContain('a3'); // forward 1
    expect(movesWhite).toContain('a4'); // forward 2
    
    // Black pawn on initial rank (8th rank -> y=7 -> '8')
    place(new Pawn(Player.Black), 'h8');
    const movesBlack = getMoves('h8');
    expect(movesBlack).toContain('h7'); // forward 1
    expect(movesBlack).toContain('h6'); // forward 2
    
    // Blocked pawn
    place(new Pawn(Player.Black), 'a3'); // blocks white pawn at a2
    const blockedMoves = getMoves('a2');
    expect(blockedMoves).not.toContain('a3');
    expect(blockedMoves).not.toContain('a4'); // blocked
    
    // Diagonal capture
    place(new Pawn(Player.White), 'e4');
    place(new Pawn(Player.Black), 'd5'); // enemy diagonally
    place(new Pawn(Player.White), 'f5'); // friendly diagonally
    
    const captureMoves = getMoves('e4');
    expect(captureMoves).toContain('e5'); // forward 1
    expect(captureMoves).toContain('d5'); // enemy capture
    expect(captureMoves).not.toContain('f5'); // friendly
  });

  test('movePiece execution', () => {
    place(new Rook(Player.White), 'a1');
    place(new Pawn(Player.Black), 'a7');
    
    // currentPlayer is White by default
    const success = gameState.movePiece(Board.parseCoordinate('a1'), Board.parseCoordinate('a7'));
    expect(success).toBe(true);
    
    const destPiece = gameState.board.getPiece(Board.parseCoordinate('a7'));
    expect(destPiece?.type).toBe(PieceType.Rook);
    expect(destPiece?.owner).toBe(Player.White);
    
    const srcPiece = gameState.board.getPiece(Board.parseCoordinate('a1'));
    expect(srcPiece).toBeNull();
  });
});

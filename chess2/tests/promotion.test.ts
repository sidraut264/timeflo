import { GameState, GameStatus } from '../src/game/GameState';
import { Board } from '../src/game/Board';
import { Player } from '../src/game/Player';
import { Pawn, Rook, Bishop, Queen, Knight, King, PieceType, Diplomat, Minister, RoyalGuard } from '../src/game/Piece';

describe('Pawn Promotion', () => {
  let gameState: GameState;
  let board: Board;

  beforeEach(() => {
    gameState = new GameState(true);
    board = gameState.board;
  });

  const getLegalMovesStrings = (coord: string) => {
    const moves = gameState.getLegalMoves(Board.parseCoordinate(coord));
    return moves.map(m => {
      const fileChar = String.fromCharCode('a'.charCodeAt(0) + m.file);
      const rankChar = (m.rank + 1).toString();
      return m.promotionType ? `${fileChar}${rankChar}=${m.promotionType}` : `${fileChar}${rankChar}`;
    });
  };

  test('White Pawn reaching rank 9 generates 4 promotion choices', () => {
    board.setPiece(Board.parseCoordinate('a8'), new Pawn(Player.White));
    gameState.currentPlayer = Player.White;

    const moves = getLegalMovesStrings('a8');
    expect(moves).toContain(`a9=${PieceType.Queen}`);
    expect(moves).toContain(`a9=${PieceType.Rook}`);
    expect(moves).toContain(`a9=${PieceType.Bishop}`);
    expect(moves).toContain(`a9=${PieceType.Knight}`);
    expect(moves).not.toContain(`a9=${PieceType.Pawn}`);
    expect(moves).not.toContain(`a9=${PieceType.King}`);
    expect(moves).not.toContain('a9'); // Should not contain non-promoted move
  });

  test('Black Pawn reaching rank 1 generates 4 promotion choices', () => {
    board.setPiece(Board.parseCoordinate('a2'), new Pawn(Player.Black));
    gameState.currentPlayer = Player.Black;

    const moves = getLegalMovesStrings('a2');
    expect(moves).toContain(`a1=${PieceType.Queen}`);
    expect(moves).toContain(`a1=${PieceType.Rook}`);
    expect(moves).toContain(`a1=${PieceType.Bishop}`);
    expect(moves).toContain(`a1=${PieceType.Knight}`);
  });

  test('Promotion applies to board and turn switches correctly', () => {
    board.setPiece(Board.parseCoordinate('a8'), new Pawn(Player.White));
    gameState.currentPlayer = Player.White;

    const success = gameState.makeMove(Board.parseCoordinate('a8'), Board.parseCoordinate('a9'), PieceType.Queen);
    expect(success).toBe(true);

    const destPiece = board.getPiece(Board.parseCoordinate('a9'));
    expect(destPiece?.type).toBe(PieceType.Queen);
    expect(destPiece?.owner).toBe(Player.White);

    expect(board.getPiece(Board.parseCoordinate('a8'))).toBeNull();
    expect(gameState.currentPlayer).toBe(Player.Black);
  });

  test('Promotion requires promotionType; invalid ones are rejected', () => {
    board.setPiece(Board.parseCoordinate('a8'), new Pawn(Player.White));
    gameState.currentPlayer = Player.White;

    // No promotion type
    let success = gameState.makeMove(Board.parseCoordinate('a8'), Board.parseCoordinate('a9'));
    expect(success).toBe(false);
    
    // Invalid piece type
    success = gameState.makeMove(Board.parseCoordinate('a8'), Board.parseCoordinate('a9'), PieceType.King);
    expect(success).toBe(false);

    success = gameState.makeMove(Board.parseCoordinate('a8'), Board.parseCoordinate('a9'), PieceType.Minister);
    expect(success).toBe(false);
    
    // State should remain unchanged
    expect(gameState.currentPlayer).toBe(Player.White);
    expect(board.getPiece(Board.parseCoordinate('a8'))?.type).toBe(PieceType.Pawn);
  });

  test('Capture on promotion rank triggers promotion', () => {
    board.setPiece(Board.parseCoordinate('e8'), new Pawn(Player.White));
    board.setPiece(Board.parseCoordinate('d9'), new Rook(Player.Black));
    gameState.currentPlayer = Player.White;

    const moves = getLegalMovesStrings('e8');
    expect(moves).toContain(`d9=${PieceType.Knight}`);

    const success = gameState.makeMove(Board.parseCoordinate('e8'), Board.parseCoordinate('d9'), PieceType.Knight);
    expect(success).toBe(true);

    const destPiece = board.getPiece(Board.parseCoordinate('d9'));
    expect(destPiece?.type).toBe(PieceType.Knight);
    expect(destPiece?.owner).toBe(Player.White);
  });

  test('Promotion is recorded in MoveHistory', () => {
    board.setPiece(Board.parseCoordinate('g8'), new Pawn(Player.White));
    board.setPiece(Board.parseCoordinate('h9'), new Bishop(Player.Black));
    gameState.currentPlayer = Player.White;

    // Capture and promote diagonally (g8 to h9)
    gameState.makeMove(Board.parseCoordinate('g8'), Board.parseCoordinate('h9'), PieceType.Rook);

    const history = gameState.moveHistory;
    expect(history.length).toBe(1);
    expect(history[0].movedPieceType).toBe(PieceType.Pawn);
    expect(history[0].promotedPieceType).toBe(PieceType.Rook);
    expect(history[0].capturedPieceType).toBe(PieceType.Bishop);
  });

  test('Promotion does not bypass King safety', () => {
    board.setPiece(Board.parseCoordinate('e8'), new Pawn(Player.White));
    board.setPiece(Board.parseCoordinate('e1'), new King(Player.White));
    board.setPiece(Board.parseCoordinate('a1'), new Rook(Player.Black)); // White King is in check

    gameState.currentPlayer = Player.White;

    // Pawn cannot promote because it must block or resolve check!
    const moves = getLegalMovesStrings('e8');
    expect(moves.length).toBe(0);
  });

  test('Promoted piece check geometry applies instantly', () => {
    board.setPiece(Board.parseCoordinate('e8'), new Pawn(Player.White));
    board.setPiece(Board.parseCoordinate('a9'), new King(Player.Black)); // Enemy king at a9
    gameState.currentPlayer = Player.White;

    // Promote to Rook (attacks rank 9)
    gameState.makeMove(Board.parseCoordinate('e8'), Board.parseCoordinate('e9'), PieceType.Rook);

    // Black's turn now, is Black in check?
    expect(gameState.isKingInCheck(Player.Black)).toBe(true);
  });

  test('Reset removes all promoted pieces', () => {
    board.removePiece(Board.parseCoordinate('e9')); // Clear e9 for test
    board.setPiece(Board.parseCoordinate('e8'), new Pawn(Player.White));
    gameState.currentPlayer = Player.White;
    gameState.makeMove(Board.parseCoordinate('e8'), Board.parseCoordinate('e9'), PieceType.Queen);

    expect(board.getPiece(Board.parseCoordinate('e9'))?.type).toBe(PieceType.Queen);

    gameState.reset();

    // After reset, e9 should have the Black King (standard initial state)
    expect(gameState.board.getPiece(Board.parseCoordinate('e9'))?.type).toBe(PieceType.King);
    expect(gameState.board.getPiece(Board.parseCoordinate('e9'))?.owner).toBe(Player.Black);
  });
});

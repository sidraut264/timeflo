import { Position } from './Board';
import { Player } from './Player';
import { PieceType } from './Piece';
import { GameStatus } from './GameState';

export interface MoveRecord {
  player: Player;
  from: Position;
  to: Position;
  movedPieceType: PieceType;
  capturedPieceType?: PieceType;
  promotedPieceType?: PieceType;
  ministerConversionOccurred: boolean;
  centerHoldStarted: boolean;
  resultingGameStatus: GameStatus;
}

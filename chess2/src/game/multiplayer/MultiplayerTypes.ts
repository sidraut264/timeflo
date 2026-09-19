import { Position } from '../Board';
import { PieceType } from '../Piece';
import { Player } from '../Player';

export enum RoomState {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface NetworkMove {
  type: 'move';
  moveId: string;
  from: Position;
  to: Position;
  promotionType?: PieceType;
}

export interface PlayerJoined {
  type: 'player_joined';
  player: Player;
}

export interface PlayerLeft {
  type: 'player_left';
  player: Player;
}

export interface GameOver {
  type: 'game_over';
  winner: Player | null;
}

export type NetworkMessage = NetworkMove | PlayerJoined | PlayerLeft | GameOver;

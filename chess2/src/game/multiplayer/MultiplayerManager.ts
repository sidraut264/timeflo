import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { NetworkMessage, RoomState, NetworkMove } from './MultiplayerTypes';
import { Player } from '../Player';

import { getSupabaseConfig } from './config';

export class MultiplayerManager {
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private processedMoveIds: Set<string> = new Set();
  
  public roomCode: string | null = null;
  public localPlayer: Player | null = null;
  public roomState: RoomState = RoomState.WAITING;
  public opponentConnected: boolean = false;
  
  // Callbacks
  public onStateChange?: () => void;
  public onMoveReceived?: (move: NetworkMove) => void;
  public onError?: (error: string) => void;

  constructor() {
    const { url, key } = getSupabaseConfig();
    
    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  public get isConnected(): boolean {
    return this.channel !== null;
  }

  public createRoom(roomCode: string): void {
    if (!this.supabase) {
      this.onError?.('Supabase is not configured.');
      return;
    }

    this.roomCode = roomCode;
    this.localPlayer = Player.White; // Creator is White
    this.roomState = RoomState.WAITING;
    this.opponentConnected = false;
    
    this.joinChannel(roomCode, true);
  }

  public joinRoom(roomCode: string): void {
    if (!this.supabase) {
      this.onError?.('Supabase is not configured.');
      return;
    }

    this.roomCode = roomCode;
    this.localPlayer = Player.Black; // Joiner is Black
    this.roomState = RoomState.WAITING;
    this.opponentConnected = false;

    this.joinChannel(roomCode, false);
  }

  private joinChannel(roomCode: string, isCreator: boolean): void {
    if (this.channel) {
      this.leaveRoom();
    }

    this.channel = this.supabase!.channel(`chess2-room-${roomCode}`, {
      config: {
        presence: {
          key: this.localPlayer === Player.White ? 'white' : 'black',
        },
      },
    });

    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel!.presenceState();
        const playersCount = Object.keys(state).length;
        
        if (!isCreator && playersCount > 2) {
            // MVP: Prevent 3rd player
            this.onError?.('Room is full.');
            this.leaveRoom();
            return;
        }

        const opponentKey = this.localPlayer === Player.White ? 'black' : 'white';
        const hasOpponent = state[opponentKey] !== undefined;

        if (hasOpponent !== this.opponentConnected) {
          this.opponentConnected = hasOpponent;
          
          if (this.opponentConnected && this.roomState === RoomState.WAITING) {
            this.roomState = RoomState.PLAYING;
          }
          
          this.onStateChange?.();
        }
      })
      .on('broadcast', { event: 'game_message' }, ({ payload }) => {
        this.handleMessage(payload as NetworkMessage);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel!.track({ online_at: new Date().toISOString() });
          this.onStateChange?.();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.onError?.('Lost connection to multiplayer room.');
        }
      });
  }

  public leaveRoom(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.roomCode = null;
    this.localPlayer = null;
    this.roomState = RoomState.WAITING;
    this.opponentConnected = false;
    this.processedMoveIds.clear();
    this.onStateChange?.();
  }

  public broadcastMove(move: Omit<NetworkMove, 'type' | 'moveId'>): void {
    if (!this.channel || this.roomState !== RoomState.PLAYING) return;
    
    const moveId = crypto.randomUUID();
    this.processedMoveIds.add(moveId); // Don't process our own move if it bounces back
    
    const payload: NetworkMove = {
      type: 'move',
      moveId,
      ...move
    };

    this.channel.send({
      type: 'broadcast',
      event: 'game_message',
      payload
    });
  }

  private handleMessage(message: NetworkMessage): void {
    if (message.type === 'move') {
      if (this.processedMoveIds.has(message.moveId)) {
        return; // Ignore duplicates
      }
      this.processedMoveIds.add(message.moveId);
      this.onMoveReceived?.(message);
    }
  }
}

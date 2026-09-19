import { MultiplayerManager } from '../src/game/multiplayer/MultiplayerManager';
import { RoomState } from '../src/game/multiplayer/MultiplayerTypes';
import { Player } from '../src/game/Player';
import { GameState } from '../src/game/GameState';
import { Position } from '../src/game/Board';

// Mock Vite env
(global as any).import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'http://mock',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'mock'
    }
  }
};

// Mock Supabase
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        send: jest.fn(),
        track: jest.fn(),
        presenceState: jest.fn().mockReturnValue({})
      };
      return {
        channel: jest.fn().mockReturnValue(mockChannel)
      };
    }
  };
});

describe('MultiplayerManager', () => {
  let manager: MultiplayerManager;

  beforeEach(() => {
    manager = new MultiplayerManager();
  });

  test('Creates a room and assigns White to creator', () => {
    manager.createRoom('ABCDE');
    expect(manager.roomCode).toBe('ABCDE');
    expect(manager.localPlayer).toBe(Player.White);
    expect(manager.roomState).toBe(RoomState.WAITING);
    expect(manager.isConnected).toBe(true);
  });

  test('Joins a room and assigns Black to joiner', () => {
    manager.joinRoom('12345');
    expect(manager.roomCode).toBe('12345');
    expect(manager.localPlayer).toBe(Player.Black);
    expect(manager.roomState).toBe(RoomState.WAITING);
  });

  test('Leaves room and resets state', () => {
    manager.createRoom('TEST');
    manager.leaveRoom();
    expect(manager.roomCode).toBeNull();
    expect(manager.localPlayer).toBeNull();
    expect(manager.roomState).toBe(RoomState.WAITING);
    expect(manager.isConnected).toBe(false);
  });
  
  test('Prevents moves when not playing', () => {
    manager.createRoom('TEST');
    // Not playing yet
    const spy = jest.spyOn((manager as any).channel, 'send');
    manager.broadcastMove({ from: {file: 0, rank: 1}, to: {file: 0, rank: 3} });
    expect(spy).not.toHaveBeenCalled();
  });
});

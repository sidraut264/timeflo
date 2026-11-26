import { useSyncExternalStore } from 'react';
import { gameStore, GameRuntimeState } from './gameStore';

export function useGameState(): GameRuntimeState {
  return useSyncExternalStore(gameStore.subscribe, gameStore.getState);
}

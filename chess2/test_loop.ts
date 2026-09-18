import { GameState } from './src/game/GameState.js';
import { Player } from './src/game/Player.js';
import { ComputerPlayer } from './src/game/ai/ComputerPlayer.js';
import { AIConfig, AIDifficulty } from './src/game/ai/AIConfig.js';

AIConfig.difficulty = AIDifficulty.Easy;
let state = new GameState();

for (let i = 0; i < 6; i++) {
  const move = ComputerPlayer.chooseMove(state, state.currentPlayer);
  if (!move) break;
  console.log(`${state.currentPlayer === Player.White ? 'W' : 'B'}: ${move.from.file},${move.from.rank} -> ${move.to.file},${move.to.rank}`);
  state.makeMove(move.from, move.to, move.promotionType);
}

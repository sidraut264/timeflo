import './styles/main.css';
import { GameState } from './game/GameState';
import { BoardRenderer } from './ui/BoardRenderer';
import { PlaytestUI } from './ui/PlaytestUI';

// 1. Initialize Game Engine (Strictly decoupled from UI)
let gameState = new GameState();

// 2. Initialize UI Renderer (Reads from GameState)
const boardRenderer = new BoardRenderer('board-container', gameState);

// 3. Initialize Playtest UI Hooks
const playtestUI = new PlaytestUI(
  () => gameState,
  (newState: GameState) => {
    gameState = newState;
    boardRenderer.setGameState(gameState);
    boardRenderer.render();
  },
  boardRenderer
);

// 4. Render the initial board
boardRenderer.render();

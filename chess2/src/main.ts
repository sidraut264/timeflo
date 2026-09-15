import './styles/main.css';
import { GameState } from './game/GameState';
import { BoardRenderer } from './ui/BoardRenderer';

// 1. Initialize Game Engine (Strictly decoupled from UI)
const gameState = new GameState();

// 2. Initialize UI Renderer (Reads from GameState)
const boardRenderer = new BoardRenderer('board-container', gameState);

// 3. Render the initial board
boardRenderer.render();

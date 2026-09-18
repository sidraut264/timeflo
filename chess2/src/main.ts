import './styles/main.css';
import { GameState } from './game/GameState';
import { Player } from './game/Player';
import { BoardRenderer } from './ui/BoardRenderer';
import { PlaytestUI } from './ui/PlaytestUI';
import { ComputerPlayer } from './game/ai/ComputerPlayer';
import { AIConfig } from './game/ai/AIConfig';

// 1. Initialize Game Engine (Strictly decoupled from UI)
let gameState = new GameState();

// 2. Game Mode State
type GameMode = 'Local' | 'Computer';
let currentGameMode: GameMode = 'Local';
let computerSide: Player | null = null;
let aiThinkTimer: number | null = null;

// 3. Initialize UI Renderer (Reads from GameState)
const boardRenderer = new BoardRenderer('board-container', gameState);

// 4. Orchestrate turns
boardRenderer.onMoveMade = () => {
  checkComputerTurn();
};

function checkComputerTurn() {
  if (currentGameMode !== 'Computer' || !computerSide) return;
  if (gameState.isGameOver()) return;

  if (gameState.currentPlayer === computerSide) {
    if (aiThinkTimer !== null) return; // Prevent duplicate timers

    // Block human input
    boardRenderer.inputBlocked = true;

    // Show indicator
    const statusId = computerSide === Player.White ? 'status-white' : 'status-black';
    const statusEl = document.getElementById(statusId);
    let originalText = 'ACTIVE';
    if (statusEl) {
      const textSpan = statusEl.querySelector('.status-text');
      if (textSpan) {
        originalText = textSpan.textContent || 'ACTIVE';
        textSpan.textContent = 'THINKING...';
        statusEl.classList.add('thinking-pulse');
      }
    }

    // Delay slightly for UX, then calculate move
    aiThinkTimer = window.setTimeout(() => {
      aiThinkTimer = null; // Clear timer reference
      if (gameState.isGameOver() || currentGameMode !== 'Computer') return; // Guard against resets

      const move = ComputerPlayer.chooseMove(gameState, computerSide!);
      
      if (move) {
        gameState.makeMove(move.from, move.to, move.promotionType);
      }
      
      // Cleanup UI
      boardRenderer.inputBlocked = false;
      if (statusEl) {
        const textSpan = statusEl.querySelector('.status-text');
        if (textSpan) textSpan.textContent = 'ACTIVE'; // Will be instantly overridden by BoardRenderer.render() if turn passes
        statusEl.classList.remove('thinking-pulse');
      }
      
      boardRenderer.render();
      
      // We don't recursively call checkComputerTurn because if it's back to Human, it just waits.
      // If AI plays against AI (not requested, but possible), it would trigger onMoveMade if BoardRenderer rendered it,
      // but here we just called render manually. To be safe, if we ever support CPU vs CPU, we'd trigger checkComputerTurn here.
      
    }, AIConfig.MOVE_DELAY_MS);
  } else {
    // Human turn
    boardRenderer.inputBlocked = false;
  }
}

function startNewGame(mode: GameMode, cpuSide: Player | null) {
  if (aiThinkTimer) {
    clearTimeout(aiThinkTimer);
    aiThinkTimer = null;
  }
  
  gameState.reset();
  boardRenderer.setGameState(gameState);
  
  currentGameMode = mode;
  computerSide = cpuSide;
  boardRenderer.inputBlocked = false;
  
  // Cleanup any left-over thinking UI
  document.querySelectorAll('.thinking-pulse').forEach(el => {
    el.classList.remove('thinking-pulse');
    const txt = el.querySelector('.status-text');
    if (txt && txt.textContent === 'THINKING...') txt.textContent = 'WAITING';
  });

  boardRenderer.render();
  checkComputerTurn();
}

// 5. Initialize UI Buttons
document.getElementById('reset-btn')?.addEventListener('click', () => {
  startNewGame('Local', null);
});

document.getElementById('play-computer-white-btn')?.addEventListener('click', () => {
  // Human plays White, Computer plays Black
  startNewGame('Computer', Player.Black);
});

document.getElementById('play-computer-black-btn')?.addEventListener('click', () => {
  // Human plays Black, Computer plays White
  startNewGame('Computer', Player.White);
});

// 6. Initialize Playtest UI Hooks
const playtestUI = new PlaytestUI(
  () => gameState,
  (newState: GameState) => {
    if (aiThinkTimer) {
      clearTimeout(aiThinkTimer);
      aiThinkTimer = null;
    }
    gameState = newState;
    boardRenderer.setGameState(gameState);
    boardRenderer.render();
    checkComputerTurn();
  },
  boardRenderer
);

// 7. Render the initial board
boardRenderer.render();

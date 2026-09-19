import './styles/main.css';
import { GameState } from './game/GameState';
import { Player } from './game/Player';
import { BoardRenderer, BoardOrientation } from './ui/BoardRenderer';
import { PlaytestUI } from './ui/PlaytestUI';
import { ComputerPlayer } from './game/ai/ComputerPlayer';
import { AIConfig } from './game/ai/AIConfig';

import { MultiplayerManager } from './game/multiplayer/MultiplayerManager';
import { RoomCode } from './game/multiplayer/RoomCode';
import { RoomState } from './game/multiplayer/MultiplayerTypes';

// 1. Initialize Game Engine (Strictly decoupled from UI)
let gameState = new GameState();

// 1.5 Initialize Multiplayer Manager
const multiplayerManager = new MultiplayerManager();

// 2. Game Mode State
type GameMode = 'Local' | 'Computer' | 'Online';
let currentGameMode: GameMode = 'Local';
let computerSide: Player | null = null;
let aiThinkTimer: number | null = null;

// 3. Initialize UI Renderer (Reads from GameState)
const boardRenderer = new BoardRenderer('board-container', gameState);

// 4. Orchestrate turns
boardRenderer.onMoveMade = () => {
  if (currentGameMode === 'Online' && multiplayerManager.localPlayer) {
    // If it was the local player's turn that just finished, broadcast the move
    const previousPlayer = gameState.currentPlayer === Player.White ? Player.Black : Player.White;
    if (previousPlayer === multiplayerManager.localPlayer) {
      const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
      if (lastMove) {
        multiplayerManager.broadcastMove({
          from: lastMove.from,
          to: lastMove.to,
          promotionType: lastMove.promotedPieceType
        });
      }
    }
  }
  checkComputerTurn();
  updateOnlineUI();
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

// Multiplayer Event Handlers
multiplayerManager.onStateChange = () => {
  updateOnlineUI();
};

multiplayerManager.onMoveReceived = (move) => {
  if (currentGameMode !== 'Online' || !multiplayerManager.localPlayer) return;
  
  // Verify it's the opponent's turn
  if (gameState.currentPlayer !== multiplayerManager.localPlayer) {
    const success = gameState.makeMove(move.from, move.to, move.promotionType);
    if (success) {
      boardRenderer.render();
      updateOnlineUI();
    } else {
      console.warn("Received invalid remote move:", move);
    }
  }
};

multiplayerManager.onError = (err) => {
  alert(err);
};

function updateOnlineUI() {
  const activeUi = document.getElementById('active-room-ui');
  const codeDisplay = document.getElementById('active-room-code');
  const statusMsg = document.getElementById('room-status-message');
  
  if (currentGameMode === 'Online' && multiplayerManager.roomCode) {
    activeUi!.hidden = false;
    codeDisplay!.textContent = multiplayerManager.roomCode;
    
    if (multiplayerManager.roomState === RoomState.WAITING) {
      statusMsg!.textContent = 'Waiting for opponent...';
      statusMsg!.style.color = '#fcd34d'; // yellow
      boardRenderer.inputBlocked = true; // Block moves while waiting
    } else if (!multiplayerManager.opponentConnected) {
      statusMsg!.textContent = 'Opponent disconnected.';
      statusMsg!.style.color = '#ef4444'; // red
      boardRenderer.inputBlocked = true;
    } else {
      statusMsg!.textContent = 'Match Active';
      statusMsg!.style.color = '#4ade80'; // green
      
      // Block input if it's not the local player's turn
      boardRenderer.inputBlocked = gameState.currentPlayer !== multiplayerManager.localPlayer;
    }
    
    // Update player panels
    const isLocalWhite = multiplayerManager.localPlayer === Player.White;
    
    const wStatus = document.getElementById('status-white');
    const bStatus = document.getElementById('status-black');
    
    if (wStatus) {
      wStatus.querySelector('.status-text')!.textContent = isLocalWhite ? 'YOU' : (multiplayerManager.opponentConnected ? 'OPPONENT' : 'DISCONNECTED');
    }
    if (bStatus) {
      bStatus.querySelector('.status-text')!.textContent = !isLocalWhite ? 'YOU' : (multiplayerManager.opponentConnected ? 'OPPONENT' : 'DISCONNECTED');
    }
    
  } else {
    activeUi!.hidden = true;
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
  // Orientation handling
  if (mode === 'Computer' && cpuSide === Player.White) {
    // Human is Black, orient towards Black
    boardRenderer.orientation = BoardOrientation.Black;
  } else if (mode === 'Online' && multiplayerManager.localPlayer === Player.Black) {
    boardRenderer.orientation = BoardOrientation.Black;
  } else {
    // Default to White orientation (Local or Human is White)
    boardRenderer.orientation = BoardOrientation.White;
  }

  boardRenderer.render();
  checkComputerTurn();
  updateOnlineUI();
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

const diffBtns = [
  document.getElementById('diff-easy-btn'),
  document.getElementById('diff-medium-btn'),
  document.getElementById('diff-hard-btn')
];

diffBtns.forEach(btn => {
  btn?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const diffVal = parseInt(target.getAttribute('data-diff') || '2', 10);
    
    // Update config
    AIConfig.difficulty = diffVal;
    
    // Update UI active state
    diffBtns.forEach(b => b?.classList.remove('active'));
    target.classList.add('active');
    
    // If currently in a computer game, reset it
    if (currentGameMode === 'Computer') {
      startNewGame('Computer', computerSide);
    }
  });
});

document.getElementById('create-game-btn')?.addEventListener('click', () => {
  if (currentGameMode === 'Online') return;
  const code = RoomCode.generate();
  multiplayerManager.createRoom(code);
  startNewGame('Online', null);
  
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('room', code);
  window.history.pushState({}, '', newUrl);
});

document.getElementById('join-game-btn')?.addEventListener('click', () => {
  if (currentGameMode === 'Online') return;
  const input = document.getElementById('join-room-input') as HTMLInputElement;
  const code = input.value.trim().toUpperCase();
  if (code.length >= 5) {
    multiplayerManager.joinRoom(code);
    startNewGame('Online', null);
    
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('room', code);
    window.history.pushState({}, '', newUrl);
  } else {
    alert("Invalid Room Code.");
  }
});

document.getElementById('leave-game-btn')?.addEventListener('click', () => {
  multiplayerManager.leaveRoom();
  window.history.pushState({}, '', window.location.pathname);
  startNewGame('Local', null);
});

document.getElementById('copy-code-btn')?.addEventListener('click', () => {
  if (multiplayerManager.roomCode) {
    navigator.clipboard.writeText(multiplayerManager.roomCode);
    const btn = document.getElementById('copy-code-btn');
    if (btn) {
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy Code', 2000);
    }
  }
});

document.getElementById('copy-link-btn')?.addEventListener('click', () => {
  if (multiplayerManager.roomCode) {
    navigator.clipboard.writeText(window.location.href);
    const btn = document.getElementById('copy-link-btn');
    if (btn) {
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy Link', 2000);
    }
  }
});

// Auto-join from URL
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam && roomParam.length >= 5) {
  const input = document.getElementById('join-room-input') as HTMLInputElement;
  if (input) input.value = roomParam;
}

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

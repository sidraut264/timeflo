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

// 1. Initialize Game Engine
let gameState = new GameState();

// 2. Initialize Multiplayer Manager
const multiplayerManager = new MultiplayerManager();

// 3. Game Mode State
type GameMode = 'Local' | 'Computer' | 'Online';
let currentGameMode: GameMode = 'Local';
let computerSide: Player | null = null;
let computerPlayAs: Player = Player.White; // Human plays as White by default
let aiThinkTimer: number | null = null;

// 4. Initialize UI Renderer
const boardRenderer = new BoardRenderer('board-container', gameState);

// 5. Orchestrate turns — after every human move, check if computer should respond
//    and broadcast if in Online mode
boardRenderer.onMoveMade = () => {
  if (currentGameMode === 'Online' && multiplayerManager.localPlayer) {
    // Broadcast the last committed move
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

// ============================================================
// Computer Logic
// ============================================================

function checkComputerTurn() {
  if (currentGameMode !== 'Computer' || !computerSide) return;
  if (gameState.isGameOver()) return;

  if (gameState.currentPlayer === computerSide) {
    if (aiThinkTimer !== null) return;

    boardRenderer.inputBlocked = true;

    const statusId = computerSide === Player.White ? 'status-white' : 'status-black';
    const statusEl = document.getElementById(statusId);
    if (statusEl) {
      const textSpan = statusEl.querySelector('.status-text');
      if (textSpan) {
        textSpan.textContent = 'THINKING...';
        statusEl.classList.add('thinking-pulse');
      }
    }

    aiThinkTimer = window.setTimeout(() => {
      aiThinkTimer = null;
      if (gameState.isGameOver() || currentGameMode !== 'Computer') return;

      const move = ComputerPlayer.chooseMove(gameState, computerSide!);
      if (move) {
        gameState.makeMove(move.from, move.to, move.promotionType);
      }

      boardRenderer.inputBlocked = false;
      if (statusEl) {
        const textSpan = statusEl.querySelector('.status-text');
        if (textSpan) textSpan.textContent = 'ACTIVE';
        statusEl.classList.remove('thinking-pulse');
      }

      boardRenderer.render();
    }, AIConfig.MOVE_DELAY_MS);
  } else {
    boardRenderer.inputBlocked = false;
  }
}

// ============================================================
// Multiplayer Logic
// ============================================================

multiplayerManager.onStateChange = () => {
  updateOnlineUI();
};

multiplayerManager.onMoveReceived = (move) => {
  if (currentGameMode !== 'Online' || !multiplayerManager.localPlayer) return;

  // Verify it is the opponent's turn
  if (gameState.currentPlayer !== multiplayerManager.localPlayer) {
    const success = gameState.makeMove(move.from, move.to, move.promotionType);
    if (success) {
      boardRenderer.render();
      updateOnlineUI();
    } else {
      console.warn('[Multiplayer] Received invalid remote move:', move);
    }
  }
};

multiplayerManager.onError = (err) => {
  alert(err);
};

function updateOnlineUI() {
  const activeRoomUi = document.getElementById('active-room-ui');
  const pregameUi = document.getElementById('online-pregame');
  const codeDisplay = document.getElementById('active-room-code');
  const statusMsg = document.getElementById('room-status-message');

  if (currentGameMode === 'Online' && multiplayerManager.roomCode) {
    // Show active room, hide pregame
    activeRoomUi!.hidden = false;
    if (pregameUi) pregameUi.hidden = true;
    codeDisplay!.textContent = multiplayerManager.roomCode;

    if (multiplayerManager.roomState === RoomState.WAITING) {
      statusMsg!.textContent = 'Waiting for opponent…';
      statusMsg!.className = 'room-status-msg status-waiting';
      boardRenderer.inputBlocked = true;
    } else if (!multiplayerManager.opponentConnected) {
      statusMsg!.textContent = 'Opponent disconnected';
      statusMsg!.className = 'room-status-msg status-disconnected';
      boardRenderer.inputBlocked = true;
    } else {
      statusMsg!.textContent = 'Match active';
      statusMsg!.className = 'room-status-msg status-playing';
      boardRenderer.inputBlocked = gameState.currentPlayer !== multiplayerManager.localPlayer;
    }

    // Update player panels
    const isLocalWhite = multiplayerManager.localPlayer === Player.White;
    const wStatus = document.getElementById('status-white');
    const bStatus = document.getElementById('status-black');
    if (wStatus) {
      const t = wStatus.querySelector('.status-text');
      if (t) t.textContent = isLocalWhite ? 'YOU' : (multiplayerManager.opponentConnected ? 'OPPONENT' : 'OFFLINE');
    }
    if (bStatus) {
      const t = bStatus.querySelector('.status-text');
      if (t) t.textContent = !isLocalWhite ? 'YOU' : (multiplayerManager.opponentConnected ? 'OPPONENT' : 'OFFLINE');
    }
  } else if (currentGameMode === 'Online') {
    // Online mode but no room yet — show pregame
    activeRoomUi!.hidden = true;
    if (pregameUi) pregameUi.hidden = false;
  }
}

// ============================================================
// Mode Selector
// ============================================================

function setModeUI(mode: GameMode) {
  const modeBtns: Record<GameMode, string> = {
    Local: 'mode-local-btn',
    Computer: 'mode-computer-btn',
    Online: 'mode-online-btn',
  };

  // Update mode button active state
  Object.entries(modeBtns).forEach(([m, id]) => {
    const btn = document.getElementById(id);
    if (btn) {
      const isActive = m === mode;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    }
  });

  // Show/hide sub-panels
  const computerSettings = document.getElementById('computer-settings');
  const onlinePanel = document.getElementById('online-panel');

  if (computerSettings) computerSettings.hidden = mode !== 'Computer';
  if (onlinePanel) onlinePanel.hidden = mode !== 'Online';

  // Reset online UI state when switching to online
  if (mode === 'Online') {
    updateOnlineUI();
  }
}

// ============================================================
// Game Reset
// ============================================================

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

  // Cleanup thinking UI
  document.querySelectorAll('.thinking-pulse').forEach(el => {
    el.classList.remove('thinking-pulse');
    const txt = el.querySelector('.status-text');
    if (txt && txt.textContent === 'THINKING...') txt.textContent = 'WAITING';
  });

  // Orientation: human always at the bottom
  if (mode === 'Computer' && cpuSide === Player.White) {
    boardRenderer.orientation = BoardOrientation.Black;
  } else if (mode === 'Online' && multiplayerManager.localPlayer === Player.Black) {
    boardRenderer.orientation = BoardOrientation.Black;
  } else {
    boardRenderer.orientation = BoardOrientation.White;
  }

  setModeUI(mode);
  boardRenderer.render();
  checkComputerTurn();
  updateOnlineUI();
}

// Update the Computer side selection UI
function setComputerPlayAs(humanSide: Player) {
  computerPlayAs = humanSide;
  const cpuSide = humanSide === Player.White ? Player.Black : Player.White;

  const whitBtn = document.getElementById('play-computer-white-btn');
  const blkBtn = document.getElementById('play-computer-black-btn');
  whitBtn?.classList.toggle('active', humanSide === Player.White);
  whitBtn?.setAttribute('aria-pressed', String(humanSide === Player.White));
  blkBtn?.classList.toggle('active', humanSide === Player.Black);
  blkBtn?.setAttribute('aria-pressed', String(humanSide === Player.Black));

  startNewGame('Computer', cpuSide);
}

// ============================================================
// Button Wiring
// ============================================================

// Mode selector
document.getElementById('mode-local-btn')?.addEventListener('click', () => {
  if (currentGameMode === 'Online') multiplayerManager.leaveRoom();
  startNewGame('Local', null);
});

document.getElementById('mode-computer-btn')?.addEventListener('click', () => {
  if (currentGameMode === 'Online') multiplayerManager.leaveRoom();
  const cpuSide = computerPlayAs === Player.White ? Player.Black : Player.White;
  startNewGame('Computer', cpuSide);
});

document.getElementById('mode-online-btn')?.addEventListener('click', () => {
  if (currentGameMode === 'Computer' && aiThinkTimer) {
    clearTimeout(aiThinkTimer);
    aiThinkTimer = null;
  }
  gameState.reset();
  boardRenderer.setGameState(gameState);
  currentGameMode = 'Online';
  boardRenderer.orientation = BoardOrientation.White;
  boardRenderer.inputBlocked = true;
  boardRenderer.render();
  setModeUI('Online');
  updateOnlineUI();
});

// New Game / Reset button
document.getElementById('reset-btn')?.addEventListener('click', () => {
  if (currentGameMode === 'Online') return; // Disabled during online match
  startNewGame(currentGameMode === 'Computer' ? 'Computer' : 'Local', currentGameMode === 'Computer' ? computerSide : null);
});

// Computer: Play as White / Black
document.getElementById('play-computer-white-btn')?.addEventListener('click', () => {
  setComputerPlayAs(Player.White);
});
document.getElementById('play-computer-black-btn')?.addEventListener('click', () => {
  setComputerPlayAs(Player.Black);
});

// Difficulty buttons
const diffBtns = [
  document.getElementById('diff-easy-btn'),
  document.getElementById('diff-medium-btn'),
  document.getElementById('diff-hard-btn')
];

diffBtns.forEach(btn => {
  btn?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const diffVal = parseInt(target.getAttribute('data-diff') || '2', 10);
    AIConfig.difficulty = diffVal;

    diffBtns.forEach(b => {
      b?.classList.remove('active');
      b?.setAttribute('aria-pressed', 'false');
    });
    target.classList.add('active');
    target.setAttribute('aria-pressed', 'true');

    if (currentGameMode === 'Computer') {
      startNewGame('Computer', computerSide);
    }
  });
});

// Online: Create / Join / Leave
document.getElementById('create-game-btn')?.addEventListener('click', () => {
  if (currentGameMode !== 'Online') return;
  const code = RoomCode.generate();
  multiplayerManager.createRoom(code);
  // Orientation: creator is White → White at bottom
  boardRenderer.orientation = BoardOrientation.White;
  boardRenderer.inputBlocked = true;
  boardRenderer.render();

  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('room', code);
  window.history.pushState({}, '', newUrl);
  updateOnlineUI();
});

document.getElementById('join-game-btn')?.addEventListener('click', () => {
  if (currentGameMode !== 'Online') return;
  const input = document.getElementById('join-room-input') as HTMLInputElement;
  const code = input.value.trim().toUpperCase();
  if (code.length >= 5) {
    multiplayerManager.joinRoom(code);
    // Joiner is Black → Black at bottom
    boardRenderer.orientation = BoardOrientation.Black;
    boardRenderer.inputBlocked = true;
    boardRenderer.render();

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('room', code);
    window.history.pushState({}, '', newUrl);
    updateOnlineUI();
  } else {
    alert('Invalid Room Code. Please enter 5+ characters.');
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
    if (btn) { btn.textContent = '✓'; setTimeout(() => btn.textContent = '⎘', 2000); }
  }
});

document.getElementById('copy-link-btn')?.addEventListener('click', () => {
  if (multiplayerManager.roomCode) {
    navigator.clipboard.writeText(window.location.href);
    const btn = document.getElementById('copy-link-btn');
    if (btn) { btn.textContent = '✓'; setTimeout(() => btn.textContent = '🔗', 2000); }
  }
});

// Auto-fill room code from URL
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam && roomParam.length >= 5) {
  const input = document.getElementById('join-room-input') as HTMLInputElement;
  if (input) input.value = roomParam;
  // Switch to Online mode but don't auto-join
  currentGameMode = 'Online';
  boardRenderer.inputBlocked = true;
  setModeUI('Online');
}

// ============================================================
// Playtest UI
// ============================================================
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

// ============================================================
// Initial Render
// ============================================================
setModeUI('Local');
boardRenderer.render();

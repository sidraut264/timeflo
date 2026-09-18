import { GameState } from '../game/GameState';
import { Board } from '../game/Board';
import type { Position } from '../game/Board';
import { Player } from '../game/Player';
import { PieceType } from '../game/Piece';
import { ScenarioLoader } from '../game/scenarios/ScenarioLoader';
import { SCENARIO_PRESETS } from '../game/scenarios/ScenarioPresets';
import type { ScenarioDefinition } from '../game/scenarios/ScenarioDefinition';
import { BoardRenderer } from './BoardRenderer';

export class PlaytestUI {
  private active: boolean = false;
  private selectedPaletteItem: { type: PieceType | 'Eraser'; player?: Player } | null = null;
  
  constructor(
    private getGameState: () => GameState,
    private setGameState: (newState: GameState) => void,
    private boardRenderer: BoardRenderer
  ) {
    this.bindToggle();
    this.bindPalette();
    this.bindControls();
    this.populatePresets();
    this.bindSettings();
    
    // Inject hook into BoardRenderer
    this.boardRenderer.setPlaytestInterceptor((file: number, rank: number) => {
      if (this.active && this.selectedPaletteItem) {
        this.handleBoardClick(file, rank);
        return true; // Click intercepted
      }
      return false;
    });

    // Run periodic inspector updates when active
    setInterval(() => {
      if (this.active) this.updateInspector();
    }, 200);
  }

  private bindToggle(): void {
    const toggle = document.getElementById('playtest-toggle') as HTMLInputElement;
    if (!toggle) return;
    
    toggle.addEventListener('change', (e) => {
      this.active = (e.target as HTMLInputElement).checked;
      document.getElementById('playtest-editor-panel')!.hidden = !this.active;
      document.getElementById('playtest-inspector-panel')!.hidden = !this.active;
      
      const boardContainer = document.getElementById('board-container');
      if (this.active) {
        boardContainer?.classList.add('board-edit-mode');
        this.boardRenderer.setPlaytestActive(true);
        this.updateInspector();
      } else {
        boardContainer?.classList.remove('board-edit-mode');
        this.boardRenderer.setPlaytestActive(false);
        this.selectedPaletteItem = null;
        this.updatePaletteUI();
      }
    });
  }

  private bindPalette(): void {
    const btns = document.querySelectorAll('.palette-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const type = target.dataset.type as PieceType | 'Eraser';
        const playerStr = target.dataset.player;
        
        let player: Player | undefined;
        if (playerStr === 'White') player = Player.White;
        if (playerStr === 'Black') player = Player.Black;

        if (this.selectedPaletteItem?.type === type && this.selectedPaletteItem?.player === player) {
          // Deselect
          this.selectedPaletteItem = null;
        } else {
          this.selectedPaletteItem = { type, player };
        }
        
        this.updatePaletteUI();
      });
    });
  }

  private updatePaletteUI(): void {
    document.querySelectorAll('.palette-btn').forEach(btn => btn.classList.remove('active'));
    if (!this.selectedPaletteItem) return;
    
    const selector = this.selectedPaletteItem.type === 'Eraser' 
      ? `[data-type="Eraser"]`
      : this.selectedPaletteItem.type === PieceType.Diplomat
        ? `[data-type="Diplomat"]`
        : `[data-type="${this.selectedPaletteItem.type}"][data-player="${this.selectedPaletteItem.player === Player.White ? 'White' : 'Black'}"]`;
        
    document.querySelector(selector)?.classList.add('active');
  }

  private bindControls(): void {
    document.getElementById('pt-reset-btn')?.addEventListener('click', () => {
      const state = new GameState(); // normal init
      this.setGameState(state);
      this.clearError();
    });

    document.getElementById('pt-clear-btn')?.addEventListener('click', () => {
      const state = new GameState(true); // skip init
      this.setGameState(state);
      this.clearError();
    });

    document.getElementById('pt-export-btn')?.addEventListener('click', () => {
      const json = JSON.stringify(ScenarioLoader.exportScenario(this.getGameState()), null, 2);
      navigator.clipboard.writeText(json).then(() => {
        alert('Position exported to clipboard!');
      });
    });

    document.getElementById('pt-import-btn')?.addEventListener('click', () => {
      const input = prompt("Paste Scenario JSON:");
      if (input) {
        try {
          const parsed = JSON.parse(input) as ScenarioDefinition;
          const newState = ScenarioLoader.loadScenario(parsed);
          this.setGameState(newState);
          this.clearError();
          this.syncSettingsToState(newState);
        } catch (e: any) {
          this.showError(e.message);
        }
      }
    });
  }

  private populatePresets(): void {
    const select = document.getElementById('scenario-select') as HTMLSelectElement;
    if (!select) return;

    SCENARIO_PRESETS.forEach((preset, idx) => {
      const opt = document.createElement('option');
      opt.value = idx.toString();
      opt.textContent = preset.name;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      if (select.value === "") return;
      const preset = SCENARIO_PRESETS[parseInt(select.value)];
      try {
        const newState = ScenarioLoader.loadScenario(preset);
        this.setGameState(newState);
        this.clearError();
        this.syncSettingsToState(newState);
      } catch (e: any) {
        this.showError(e.message);
      }
      select.value = ""; // Reset dropdown
    });
  }

  private bindSettings(): void {
    const cpSelect = document.getElementById('pt-current-player') as HTMLSelectElement;
    const holdSelect = document.getElementById('pt-center-hold') as HTMLSelectElement;

    cpSelect.addEventListener('change', () => {
      const state = this.getGameState();
      state.currentPlayer = cpSelect.value === 'White' ? Player.White : Player.Black;
      this.boardRenderer.render();
    });

    holdSelect.addEventListener('change', () => {
      const state = this.getGameState();
      if (holdSelect.value === "") {
        state.centerHold = null;
      } else {
        const p = holdSelect.value === 'White' ? Player.White : Player.Black;
        if (state.isKingOnSquare(p, Board.CENTER_SQUARE)) {
          state.centerHold = { player: p };
          this.clearError();
        } else {
          this.showError(`Cannot hold center: ${holdSelect.value} King is not on e5.`);
          holdSelect.value = state.centerHold ? (state.centerHold.player === Player.White ? 'White' : 'Black') : "";
        }
      }
      this.boardRenderer.render();
    });
  }

  private syncSettingsToState(state: GameState): void {
    const cpSelect = document.getElementById('pt-current-player') as HTMLSelectElement;
    const holdSelect = document.getElementById('pt-center-hold') as HTMLSelectElement;
    if (cpSelect) cpSelect.value = state.currentPlayer === Player.White ? 'White' : 'Black';
    if (holdSelect) holdSelect.value = state.centerHold ? (state.centerHold.player === Player.White ? 'White' : 'Black') : "";
  }

  private handleBoardClick(file: number, rank: number): void {
    if (!this.selectedPaletteItem) return;
    
    // We update the scenario JSON incrementally and try to load it to validate
    const state = this.getGameState();
    const scenario = ScenarioLoader.exportScenario(state);
    const coord = String.fromCharCode('a'.charCodeAt(0) + file) + (rank + 1);

    // Remove existing piece at this pos in scenario
    scenario.pieces = scenario.pieces.filter(p => p.position !== coord);

    if (this.selectedPaletteItem.type !== 'Eraser') {
      scenario.pieces.push({
        type: this.selectedPaletteItem.type,
        player: this.selectedPaletteItem.player === Player.White ? 'White' : 'Black',
        position: coord
      });
    }

    try {
      const newState = ScenarioLoader.loadScenario(scenario);
      // Preserve history if just placing pieces (for simplicity, but usually editor resets)
      newState.moveHistory = state.moveHistory; 
      this.setGameState(newState);
      this.clearError();
    } catch (e: any) {
      this.showError(e.message);
    }
  }

  private updateInspector(): void {
    const state = this.getGameState();
    const set = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    set('insp-status', state.gameStatus);
    set('insp-winner', state.winner === Player.White ? 'White' : state.winner === Player.Black ? 'Black' : 'None');
    set('insp-hold', state.centerHold ? (state.centerHold.player === Player.White ? 'White' : 'Black') : 'None');
    set('insp-w-check', state.isKingInCheck(Player.White) ? 'CHECK' : 'Safe');
    set('insp-b-check', state.isKingInCheck(Player.Black) ? 'CHECK' : 'Safe');

    // Find kings
    let wk = '--', bk = '--';
    for (let r=0; r<9; r++) {
      for (let f=0; f<9; f++) {
        const p = state.board.getPiece({file:f, rank:r});
        if (p?.type === PieceType.King) {
          const coord = String.fromCharCode('a'.charCodeAt(0) + f) + (r + 1);
          if (p.owner === Player.White) wk = coord;
          if (p.owner === Player.Black) bk = coord;
        }
      }
    }
    set('insp-w-king', wk);
    set('insp-b-king', bk);

    // Selected piece
    const selPos = this.boardRenderer.getSelectedSquare();
    if (selPos) {
      const p = state.board.getPiece(selPos);
      if (p) {
        const player = p.owner === Player.White ? 'W' : 'B';
        set('insp-sel-piece', `${player} ${p.type} @ ${String.fromCharCode('a'.charCodeAt(0) + selPos.file)}${selPos.rank + 1}`);
        const moves = state.getLegalMoves(selPos);
        if (moves.length === 0) {
          set('insp-sel-moves', '0');
        } else {
          set('insp-sel-moves', moves.map(m => {
            const coord = String.fromCharCode('a'.charCodeAt(0) + m.file) + (m.rank + 1);
            return m.promotionType ? `${coord}(${m.promotionType[0]})` : coord;
          }).join(', '));
        }
      } else {
        set('insp-sel-piece', 'None');
        set('insp-sel-moves', '--');
      }
    } else {
      set('insp-sel-piece', 'None');
      set('insp-sel-moves', '--');
    }
  }

  private showError(msg: string): void {
    const errEl = document.getElementById('pt-validation-error');
    if (errEl) {
      errEl.textContent = msg;
      errEl.hidden = false;
    }
  }

  private clearError(): void {
    const errEl = document.getElementById('pt-validation-error');
    if (errEl) {
      errEl.textContent = '';
      errEl.hidden = true;
    }
  }
}

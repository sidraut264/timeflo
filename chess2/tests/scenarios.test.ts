import { ScenarioLoader } from '../src/game/scenarios/ScenarioLoader';
import { SCENARIO_PRESETS } from '../src/game/scenarios/ScenarioPresets';
import type { ScenarioDefinition } from '../src/game/scenarios/ScenarioDefinition';
import { GameState } from '../src/game/GameState';
import { Board } from '../src/game/Board';
import { Player } from '../src/game/Player';

describe('Scenario Playground', () => {

  describe('Scenario Validation', () => {
    test('Rejects missing Kings', () => {
      const def: ScenarioDefinition = {
        name: 'Test',
        description: '',
        currentPlayer: 'White',
        pieces: [
          { type: 'King', player: 'White', position: 'a1' } // Missing Black King
        ]
      };
      expect(() => ScenarioLoader.loadScenario(def)).toThrow(/Black must have exactly one King/);
    });

    test('Rejects multiple Kings', () => {
      const def: ScenarioDefinition = {
        name: 'Test',
        description: '',
        currentPlayer: 'White',
        pieces: [
          { type: 'King', player: 'White', position: 'a1' },
          { type: 'King', player: 'White', position: 'a2' },
          { type: 'King', player: 'Black', position: 'a9' }
        ]
      };
      expect(() => ScenarioLoader.loadScenario(def)).toThrow(/White must have exactly one King/);
    });

    test('Rejects overlapping pieces', () => {
      const def: ScenarioDefinition = {
        name: 'Test',
        description: '',
        currentPlayer: 'White',
        pieces: [
          { type: 'King', player: 'White', position: 'a1' },
          { type: 'King', player: 'Black', position: 'a9' },
          { type: 'Pawn', player: 'White', position: 'e5' },
          { type: 'Pawn', player: 'Black', position: 'e5' }
        ]
      };
      expect(() => ScenarioLoader.loadScenario(def)).toThrow(/Multiple pieces placed on the same square: e5/);
    });

    test('Rejects invalid Diplomat placement', () => {
      const def: ScenarioDefinition = {
        name: 'Test',
        description: '',
        currentPlayer: 'White',
        pieces: [
          { type: 'King', player: 'White', position: 'a1' },
          { type: 'King', player: 'Black', position: 'a9' },
          { type: 'Diplomat', position: 'e5' } // Invalid square
        ]
      };
      expect(() => ScenarioLoader.loadScenario(def)).toThrow(/Invalid Diplomat placement/);
    });

    test('Rejects invalid Center Hold', () => {
      const def: ScenarioDefinition = {
        name: 'Test',
        description: '',
        currentPlayer: 'White',
        centerHold: 'White',
        pieces: [
          { type: 'King', player: 'White', position: 'a1' }, // Not on e5
          { type: 'King', player: 'Black', position: 'a9' }
        ]
      };
      expect(() => ScenarioLoader.loadScenario(def)).toThrow(/Invalid centerHold: White King is not on e5/);
    });
  });

  describe('Serialization', () => {
    test('Exporting a board matches the loaded definition', () => {
      const def: ScenarioDefinition = {
        name: 'Test',
        description: '',
        currentPlayer: 'Black',
        centerHold: 'White',
        pieces: [
          { type: 'Rook', player: 'White', position: 'a1' },
          { type: 'King', player: 'White', position: 'e5' },
          { type: 'Diplomat', position: 'f4' },
          { type: 'King', player: 'Black', position: 'i9' }
        ]
      };

      const state = ScenarioLoader.loadScenario(def);
      const exported = ScenarioLoader.exportScenario(state, 'Test', '');

      expect(exported.currentPlayer).toBe('Black');
      expect(exported.centerHold).toBe('White');
      expect(exported.pieces.length).toBe(4);
      
      const p1 = exported.pieces.find(p => p.position === 'a1');
      expect(p1).toEqual({ type: 'Rook', player: 'White', position: 'a1' });
      
      const p2 = exported.pieces.find(p => p.position === 'e5');
      expect(p2).toEqual({ type: 'King', player: 'White', position: 'e5' });
      
      const p3 = exported.pieces.find(p => p.position === 'f4');
      expect(p3).toEqual({ type: 'Diplomat', position: 'f4' });
    });
  });

  describe('Presets', () => {
    test('All 12 presets load successfully without throwing', () => {
      SCENARIO_PRESETS.forEach(preset => {
        expect(() => {
          const state = ScenarioLoader.loadScenario(preset);
          expect(state).toBeInstanceOf(GameState);
        }).not.toThrow();
      });
    });
    
    test('Preset 2 (Center Hold) parses hold correctly', () => {
      const state = ScenarioLoader.loadScenario(SCENARIO_PRESETS[1]);
      expect(state.centerHold?.player).toBe(Player.White);
      expect(state.currentPlayer).toBe(Player.Black);
    });
  });

});

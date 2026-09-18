import type { ScenarioDefinition } from './ScenarioDefinition';

export const SCENARIO_PRESETS: ScenarioDefinition[] = [
  {
    name: '1. Empty Center',
    description: 'Test King movement toward e5 without immediate danger.',
    currentPlayer: 'White',
    pieces: [
      { type: 'King', player: 'White', position: 'e2' },
      { type: 'King', player: 'Black', position: 'e8' },
      { type: 'Diplomat', position: 'd4' },
      { type: 'Diplomat', position: 'f4' },
      { type: 'Diplomat', position: 'd6' },
      { type: 'Diplomat', position: 'f6' },
      { type: 'Pawn', player: 'White', position: 'a2' },
      { type: 'Pawn', player: 'Black', position: 'a8' }
    ]
  },
  {
    name: '2. Center Hold',
    description: 'White King is holding e5. Black has a turn to respond.',
    currentPlayer: 'Black',
    centerHold: 'White',
    pieces: [
      { type: 'King', player: 'White', position: 'e5' },
      { type: 'King', player: 'Black', position: 'e9' },
      { type: 'Rook', player: 'White', position: 'a1' },
      { type: 'Rook', player: 'Black', position: 'a9' },
      { type: 'Diplomat', position: 'd4' },
      { type: 'Diplomat', position: 'f4' },
      { type: 'Diplomat', position: 'd6' },
      { type: 'Diplomat', position: 'f6' }
    ]
  },
  {
    name: '3. Center Under Attack',
    description: 'White King is on e5, but Black can attack the center.',
    currentPlayer: 'Black',
    pieces: [
      { type: 'King', player: 'White', position: 'e5' },
      { type: 'King', player: 'Black', position: 'e9' },
      { type: 'Knight', player: 'Black', position: 'g6' },
      { type: 'Diplomat', position: 'd4' },
      { type: 'Diplomat', position: 'f4' },
      { type: 'Diplomat', position: 'd6' },
      { type: 'Diplomat', position: 'f6' }
    ]
  },
  {
    name: '4. Royal Guard Alone',
    description: 'Isolated White Royal Guard at e4 surrounded by Black attackers.',
    currentPlayer: 'White',
    pieces: [
      { type: 'King', player: 'White', position: 'a1' },
      { type: 'King', player: 'Black', position: 'a9' },
      { type: 'RoyalGuard', player: 'White', position: 'e4' },
      { type: 'Rook', player: 'Black', position: 'e8' }, // Front attack
      { type: 'Bishop', player: 'Black', position: 'c6' }, // Front-Left diagonal
      { type: 'Bishop', player: 'Black', position: 'g6' }, // Front-Right diagonal
      { type: 'Rook', player: 'Black', position: 'a4' }, // Left side
      { type: 'Diplomat', position: 'd4' },
      { type: 'Diplomat', position: 'f4' },
      { type: 'Diplomat', position: 'd6' },
      { type: 'Diplomat', position: 'f6' }
    ]
  },
  {
    name: '5. Royal Guard P G',
    description: 'White P G formation (d3, e3). Verify left piece protection.',
    currentPlayer: 'White',
    pieces: [
      { type: 'King', player: 'White', position: 'a1' },
      { type: 'King', player: 'Black', position: 'a9' },
      { type: 'Pawn', player: 'White', position: 'd3' },
      { type: 'RoyalGuard', player: 'White', position: 'e3' },
      { type: 'Rook', player: 'Black', position: 'd8' }, // Front attack on Pawn
      { type: 'Bishop', player: 'Black', position: 'h7' }, // Attack toward Guard diagonal
      { type: 'Diplomat', position: 'd4' },
      { type: 'Diplomat', position: 'f4' },
      { type: 'Diplomat', position: 'd6' },
      { type: 'Diplomat', position: 'f6' }
    ]
  },
  {
    name: '6. Royal Guard G P',
    description: 'White G P formation (e3, f3). Verify right piece protection.',
    currentPlayer: 'White',
    pieces: [
      { type: 'King', player: 'White', position: 'a1' },
      { type: 'King', player: 'Black', position: 'a9' },
      { type: 'RoyalGuard', player: 'White', position: 'e3' },
      { type: 'Pawn', player: 'White', position: 'f3' },
      { type: 'Rook', player: 'Black', position: 'f8' }, // Front attack on Pawn
      { type: 'Bishop', player: 'Black', position: 'b7' }, // Attack toward Guard diagonal
      { type: 'Diplomat', position: 'd4' },
      { type: 'Diplomat', position: 'f4' },
      { type: 'Diplomat', position: 'd6' },
      { type: 'Diplomat', position: 'f6' }
    ]
  },
  {
    name: '7. Royal Guard P G P',
    description: 'White P G P formation (d3, e3, f3).',
    currentPlayer: 'White',
    pieces: [
      { type: 'King', player: 'White', position: 'a1' },
      { type: 'King', player: 'Black', position: 'a9' },
      { type: 'Pawn', player: 'White', position: 'd3' },
      { type: 'RoyalGuard', player: 'White', position: 'e3' },
      { type: 'Pawn', player: 'White', position: 'f3' },
      { type: 'Diplomat', position: 'd4' },
      { type: 'Diplomat', position: 'f4' },
      { type: 'Diplomat', position: 'd6' },
      { type: 'Diplomat', position: 'f6' }
    ]
  },
  {
    name: '8. Minister Conversion',
    description: 'White Minister can convert the Black Pawn by moving exactly 2 squares over it.',
    currentPlayer: 'White',
    pieces: [
      { type: 'King', player: 'White', position: 'e1' },
      { type: 'King', player: 'Black', position: 'e9' },
      { type: 'Minister', player: 'White', position: 'e2' },
      { type: 'Pawn', player: 'Black', position: 'e3' },
      { type: 'Diplomat', position: 'd4' },
      { type: 'Diplomat', position: 'f4' },
      { type: 'Diplomat', position: 'd6' },
      { type: 'Diplomat', position: 'f6' }
    ]
  },
  {
    name: '9. Minister Jump',
    description: 'Test Minister jumping over friendly, enemy, and Diplomat pieces.',
    currentPlayer: 'White',
    pieces: [
      { type: 'King', player: 'White', position: 'e1' },
      { type: 'King', player: 'Black', position: 'e9' },
      { type: 'Minister', player: 'White', position: 'd2' },
      { type: 'Knight', player: 'White', position: 'd3' }, // friendly
      { type: 'Rook', player: 'Black', position: 'c2' }, // enemy
      { type: 'Diplomat', position: 'd4' },
      { type: 'Diplomat', position: 'f4' },
      { type: 'Diplomat', position: 'd6' },
      { type: 'Diplomat', position: 'f6' }
    ]
  },
  {
    name: '10. Promotion',
    description: 'Pawns near promotion ranks.',
    currentPlayer: 'White',
    pieces: [
      { type: 'King', player: 'White', position: 'e1' },
      { type: 'King', player: 'Black', position: 'e9' },
      { type: 'Pawn', player: 'White', position: 'a8' },
      { type: 'Pawn', player: 'Black', position: 'i2' },
      { type: 'Diplomat', position: 'd4' },
      { type: 'Diplomat', position: 'f4' },
      { type: 'Diplomat', position: 'd6' },
      { type: 'Diplomat', position: 'f6' }
    ]
  },
  {
    name: '11. Check',
    description: 'White King is in check from a Black Rook.',
    currentPlayer: 'White',
    pieces: [
      { type: 'King', player: 'White', position: 'e2' },
      { type: 'King', player: 'Black', position: 'e9' },
      { type: 'Rook', player: 'Black', position: 'a2' },
      { type: 'Rook', player: 'White', position: 'b1' },
      { type: 'Diplomat', position: 'd4' },
      { type: 'Diplomat', position: 'f4' },
      { type: 'Diplomat', position: 'd6' },
      { type: 'Diplomat', position: 'f6' }
    ]
  },
  {
    name: '12. Checkmate',
    description: 'White King is in checkmate on the edge.',
    currentPlayer: 'White',
    pieces: [
      { type: 'King', player: 'White', position: 'a1' },
      { type: 'King', player: 'Black', position: 'c2' },
      { type: 'Queen', player: 'Black', position: 'b1' },
      { type: 'Diplomat', position: 'd4' },
      { type: 'Diplomat', position: 'f4' },
      { type: 'Diplomat', position: 'd6' },
      { type: 'Diplomat', position: 'f6' }
    ]
  }
];

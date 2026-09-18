export interface PieceDef {
  type: string;
  player?: 'White' | 'Black'; // Required for normal pieces, omitted/ignored for Diplomats
  position: string; // e.g. "e5"
}

export interface ScenarioDefinition {
  name: string;
  description: string;
  currentPlayer: 'White' | 'Black';
  centerHold?: 'White' | 'Black';
  pieces: PieceDef[];
}

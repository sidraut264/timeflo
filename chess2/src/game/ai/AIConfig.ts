export enum AIDifficulty {
  Easy = 1,
  Medium = 2,
  Hard = 3
}

export const AIConfig = {
  // Delay for presentation purposes so AI doesn't feel instantaneous
  MOVE_DELAY_MS: 400,
  
  // Current difficulty (Default: Medium)
  difficulty: AIDifficulty.Medium,

  // Helper to get search depth based on difficulty
  getSearchDepth(): number {
    return this.difficulty;
  },

  // Base piece values for heuristic evaluation
  PIECE_VALUES: {
    Pawn: 100,
    Knight: 320,
    Bishop: 330,
    Rook: 500,
    Queen: 900,
    Minister: 450,
    RoyalGuard: 450,
    King: 100000,
    Diplomat: 0 // Diplomats cannot be captured and have no material value
  },

  // Bonus for controlling or moving closer to the center (e5)
  CENTER_CONTROL_BONUS: 30,

  // Bonus for converting a minister (since it steals an enemy pawn)
  MINISTER_CONVERSION_BONUS: 250,

  // Bonus when the center is held
  CENTER_HOLD_BONUS: 2000,

  // Bonus for King explicitly on e5
  KING_ON_CENTER_BONUS: 3000,

  // Check evaluations
  CHECK_BONUS: 500,
  CHECK_PENALTY: 500,

  // Shield protection evaluation (per protected target)
  SHIELD_PROTECTION_BONUS: 50,
};

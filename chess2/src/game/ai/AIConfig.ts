export const AIConfig = {
  // Delay for presentation purposes so AI doesn't feel instantaneous
  MOVE_DELAY_MS: 400,
  
  // The depth of the search tree (1 = evaluate all moves, 2 = evaluate my moves + opponent best reply)
  SEARCH_DEPTH: 2,

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

  // Bonus for being in Center Hold
  CENTER_HOLD_BONUS: 2000, // Very high but less than a checkmate
};

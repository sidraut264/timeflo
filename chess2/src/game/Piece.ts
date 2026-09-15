import { Player } from './Player';

export enum PieceType {
  Pawn = 'Pawn',
  Rook = 'Rook',
  Knight = 'Knight',
  Bishop = 'Bishop',
  Queen = 'Queen',
  King = 'King',
  Diplomat = 'Diplomat',
  RoyalGuard = 'RoyalGuard',
  Minister = 'Minister'
}

export abstract class Piece {
  constructor(public owner: Player, public type: PieceType) {}
  
  public abstract clone(): Piece;
}

export class Pawn extends Piece {
  constructor(owner: Player) { super(owner, PieceType.Pawn); }
  public clone(): Piece { return new Pawn(this.owner); }
}

export class Rook extends Piece {
  constructor(owner: Player) { super(owner, PieceType.Rook); }
  public clone(): Piece { return new Rook(this.owner); }
}

export class Knight extends Piece {
  constructor(owner: Player) { super(owner, PieceType.Knight); }
  public clone(): Piece { return new Knight(this.owner); }
}

export class Bishop extends Piece {
  constructor(owner: Player) { super(owner, PieceType.Bishop); }
  public clone(): Piece { return new Bishop(this.owner); }
}

export class Queen extends Piece {
  constructor(owner: Player) { super(owner, PieceType.Queen); }
  public clone(): Piece { return new Queen(this.owner); }
}

export class King extends Piece {
  constructor(owner: Player) { super(owner, PieceType.King); }
  public clone(): Piece { return new King(this.owner); }
}

export class RoyalGuard extends Piece {
  constructor(owner: Player) { super(owner, PieceType.RoyalGuard); }
  public clone(): Piece { return new RoyalGuard(this.owner); }
}

export class Minister extends Piece {
  constructor(owner: Player) { super(owner, PieceType.Minister); }
  public clone(): Piece { return new Minister(this.owner); }
}

export class Diplomat extends Piece {
  constructor() {
    super(Player.White, PieceType.Diplomat);
  }
  public clone(): Piece { return new Diplomat(); }
}

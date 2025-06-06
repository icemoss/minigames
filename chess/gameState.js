import { INITIAL_BOARD } from "./constants.js";

export class Gamestate {
  constructor() {
    this.player = "white";
    this.boardState = structuredClone(INITIAL_BOARD);
    this.enPassant = null;
    this.castleBlackKingside = true;
    this.castleBlackQueenside = true;
    this.castleWhiteKingside = true;
    this.castleWhiteQueenside = true;

    this.turnsSinceLastEvent = 0;
    this.occurredPositions = {};
    this.occurredPositions[JSON.stringify(this.getPosition())] = 1;
  }

  getPosition() {
    return {
      player: this.player,
      boardState: this.boardState,
      enPassant: this.enPassant,
      castleBlackKingside: this.castleBlackKingside,
      castleBlackQueenside: this.castleBlackQueenside,
      castleWhiteKingside: this.castleWhiteQueenside,
      castleWhiteQueenside: this.castleWhiteQueenside,
    };
  }
}

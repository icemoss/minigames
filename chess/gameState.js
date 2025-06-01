"use strict";

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
    this.occurredPositions[JSON.stringify(this.gameState)] = 1;
  }

  isIdentical(gameState) {
    console.log(this);
    console.log(gameState);
    return JSON.stringify(this) === JSON.stringify(gameState);
  }
}

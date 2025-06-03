import { ChessRules } from "./ChessRules.js";
import { ChessAI } from "./ChessAI.js";
import { ChessUI } from "./ChessUI.js";
import { Gamestate } from "./gameState.js";
import { WHITE_PIECES } from "./constants.js";

export class ChessGame {
  constructor(boardElement, twoPlayer = false) {
    this.ui = new ChessUI(boardElement);
    this.rules = ChessRules;
    this.ai = new ChessAI(this.rules);

    this.twoPlayer = twoPlayer;
    this.active = true;

    // Game state
    this.gameState = new Gamestate();

    // Current move state
    this.selectedPiece = null;
    this.possibleMoves = [];

    this.initialize();
  }

  /**
   * Initialize the game
   */
  initialize() {
    this.ui.addEventListeners((row, col) => this.handleSquareClick(row, col));
    this.ui.renderBoard(this.gameState);
    this.ui.updateTurnIndicator(this.gameState.player);
  }

  /**
   * Handle square click events
   */
  handleSquareClick(row, col) {
    if (!this.active) return;

    const piece = this.getPiece(row, col);
    const pieceColor = this.getColor(piece);

    // If clicking on own piece, select it
    if (piece && pieceColor === this.gameState.player) {
      this.selectPiece(row, col);
    }
    // If a piece is selected, try to move
    else if (this.selectedPiece) {
      this.attemptMove(row, col);
    }
  }

  /**
   * Select a piece and show possible moves
   */
  selectPiece(row, col) {
    this.selectedPiece = { row, col };
    this.possibleMoves = this.rules.getLegalMoves(row, col, this.gameState);

    this.ui.setSelectedPiece(row, col);
    this.ui.renderBoard(this.gameState, this.possibleMoves);
  }

  /**
   * Attempt to move the selected piece
   */
  attemptMove(toRow, toCol) {
    const move = this.possibleMoves.find(
      (m) => m.toRow === toRow && m.toCol === toCol,
    );

    if (move) {
      this.makeMove(move);
    }

    this.clearSelection();
  }

  /**
   * Execute a move
   */
  makeMove(move) {
    // Execute the move
    this.rules.executeMove(move, this.gameState);

    // Update UI
    this.ui.setLastMove(move);
    this.ui.renderBoard(this.gameState);
    this.ui.updateTurnIndicator(this.gameState.player);

    // Check for game end
    this.checkGameEnd();

    // AI move if not two-player mode
    if (!this.twoPlayer && this.gameState.player === "black" && this.active) {
      // Delay to not have unnaturally fast responses.
      setTimeout(() => this.makeAIMove(), 250);
    }
  }

  /**
   * Make an AI move
   */
  makeAIMove() {
    if (!this.active) return;

    const aiMove = this.ai.generateMove(
      this.gameState.player,
      this.gameState,
      (piece) => this.getColor(piece),
      (row, col) => this.getPiece(row, col),
    );

    if (aiMove) {
      this.makeMove(aiMove);
    }
  }

  /**
   * Clear current selection
   */
  clearSelection() {
    this.selectedPiece = null;
    this.possibleMoves = [];
    this.ui.clearSelection();
    this.ui.renderBoard(this.gameState);
  }

  /**
   * Check for game ending conditions
   */
  checkGameEnd() {
    const gameEndResult = this.rules.checkGameEnd(this.gameState);

    if (gameEndResult.gameOver) {
      if (gameEndResult.message) {
        console.log(gameEndResult.message);
        this.ui.showMessage(gameEndResult.message);
      }
      this.active = false;
    }
  }

  /**
   * Reset the game
   */
  reset() {
    this.gameState = new Gamestate();

    this.active = true;

    this.clearSelection();
    this.ui.updateTurnIndicator(this.gameState.player);
  }

  // Utility methods
  getPiece(row, col) {
    return this.gameState.boardState[row]?.[col] || null;
  }

  getColor(piece) {
    if (!piece) return null;
    return WHITE_PIECES.has(piece) ? "white" : "black";
  }

  // Configuration methods
  setTwoPlayerMode(enabled) {
    this.twoPlayer = enabled;
  }

  setAIDifficulty(depth) {
    this.ai.setSearchDepth(depth);
  }
}

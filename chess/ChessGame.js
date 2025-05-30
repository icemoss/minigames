"use strict";

import { Move } from "./move.js";
import { ChessRules } from "./ChessRules.js";
import { ChessAI } from "./ChessAI.js";
import { ChessUI } from "./ChessUI.js";
import {
  INITIAL_BOARD,
  PIECES,
  WHITE_PIECES,
  BLACK_PIECES,
} from "./constants.js";

export class ChessGame {
  constructor(boardElement, twoPlayer = false) {
    this.ui = new ChessUI(boardElement);
    this.rules = ChessRules;
    this.ai = new ChessAI(this.rules);

    this.twoPlayer = twoPlayer;
    this.active = true;

    // Game state
    this.gameState = {
      player: "white",
      boardState: structuredClone(INITIAL_BOARD),
      enPassant: null,
      castleBlackKingside: true,
      castleBlackQueenside: true,
      castleWhiteKingside: true,
      castleWhiteQueenside: true,
    };

    // Game history for draw detection
    this.turnsSinceLastEvent = 0;
    this.occurredPositions = {};
    this.occurredPositions[JSON.stringify(this.gameState)] = 1;

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

    // Update game history
    this.updateGameHistory();

    // Check for game end
    this.checkGameEnd();

    // AI move if not two-player mode
    if (!this.twoPlayer && this.gameState.player === "black" && this.active) {
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
    const currentPlayer = this.gameState.player;

    console.log(`Checking game end for ${currentPlayer}`);

    const isInCheck = this.rules.isInCheck(currentPlayer, this.gameState);
    const allMoves = this.rules.generateAllMoves(currentPlayer, this.gameState);

    console.log(`${currentPlayer} in check: ${isInCheck}`);
    console.log(`${currentPlayer} has ${allMoves.length} legal moves`);

    if (isInCheck && allMoves.length === 0) {
      const winner = currentPlayer === "white" ? "Black" : "White";
      console.log(`Checkmate! ${winner} wins!`);
      this.ui.showMessage(`Checkmate! ${winner} wins!`);
      this.active = false;
    } else if (!isInCheck && allMoves.length === 0) {
      console.log("Stalemate! It's a draw!");
      this.ui.showMessage("Stalemate! It's a draw!");
      this.active = false;
    } else if (this.isDrawByRepetition()) {
      console.log("Draw by repetition!");
      this.ui.showMessage("Draw by repetition!");
      this.active = false;
    } else if (this.is50MoveRule()) {
      console.log("Draw by 50-move rule!");
      this.ui.showMessage("Draw by 50-move rule!");
      this.active = false;
    }

    if (!this.active) {
      console.log("Game ended");
    }
  }
  
  /**
   * Reset the game
   */
  reset() {
    this.gameState = {
      player: "white",
      boardState: structuredClone(INITIAL_BOARD),
      enPassant: null,
      castleBlackKingside: true,
      castleBlackQueenside: true,
      castleWhiteKingside: true,
      castleWhiteQueenside: true,
    };

    this.turnsSinceLastEvent = 0;
    this.occurredPositions = {};
    this.occurredPositions[JSON.stringify(this.gameState)] = 1;
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

  updateGameHistory() {
    // TODO: Implement proper history tracking
    this.turnsSinceLastEvent++;
  }

  isDrawByRepetition() {
    // TODO: Implement repetition detection
    return false;
  }

  is50MoveRule() {
    // TODO: Implement 50-move rule
    return this.turnsSinceLastEvent >= 100; // 50 moves per side
  }

  // Configuration methods
  setTwoPlayerMode(enabled) {
    this.twoPlayer = enabled;
  }

  setAIDifficulty(depth) {
    this.ai.setSearchDepth(depth);
  }
}

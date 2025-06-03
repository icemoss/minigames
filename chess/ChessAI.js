"use strict";

import { ChessEvaluation } from "./ChessEvaluation.js";
import { PIECE_VALUES, PIECES } from "./constants.js";

export class ChessAI {
  constructor(rules) {
    this.rules = rules;
    this.searchDepth = 2; // Current minimax depth
    this.nodesSearched = 0;
  }

  generateMove(color, gameState, getColor, getPiece) {
    console.log(`AI generating move for ${color}`);
    this.nodesSearched = 0;
    const startTime = Date.now();

    const allMoves = this.rules.generateAllMoves(color, gameState);
    console.log(`Found ${allMoves.length} possible moves for ${color}`);

    const bestMove = this.searchBestMove(color, gameState, getColor, getPiece);

    const endTime = Date.now();
    console.log(
      `AI searched ${this.nodesSearched} nodes in ${endTime - startTime}ms, selected move:`,
      bestMove,
    );

    return bestMove;
  }

  /**
   * Current search implementation (will be replaced with alpha-beta)
   * This is a clean interface that makes it easy to swap algorithms
   */
  searchBestMove(color, gameState, getColor, getPiece) {
    if (this.searchDepth <= 2) {
      return this.minimax(color, gameState, getColor, getPiece);
    } else {
      // Future: This is where alpha-beta will go
      return this.alphaBetaSearch(color, gameState, getColor, getPiece);
    }
  }

  /**
   * Current minimax implementation (simplified)
   */
  minimax(color, gameState, getColor, getPiece) {
    const allMoves = this.rules.generateAllMoves(color, gameState);

    if (allMoves.length === 0) return null;

    // Sort moves to prioritize good moves first
    const orderedMoves = this.orderMoves(allMoves, gameState);
    console.log(`Ordered ${orderedMoves.length} moves for evaluation`);

    let bestEvaluation = color === "white" ? -Infinity : Infinity;
    let bestMove = null;
    const opponentColor = color === "white" ? "black" : "white";

    for (const move of orderedMoves) {
      this.nodesSearched++;

      // Make move
      const newGameState = this.rules.makeTemporaryMove(move, gameState);

      // Get opponent's best response
      const opponentMoves = this.rules.generateAllMoves(
        opponentColor,
        newGameState,
      );
      let evaluation;

      if (opponentMoves.length === 0) {
        // No legal moves - checkmate or stalemate
        evaluation = ChessEvaluation.evaluatePosition(
          this.rules,
          newGameState,
          getColor,
          getPiece,
        );
      } else {
        // Find opponent's best move
        let bestOpponentEval = opponentColor === "white" ? -Infinity : Infinity;

        // Also order opponent moves for better play
        const orderedOpponentMoves = this.orderMoves(
          opponentMoves,
          newGameState,
        ).slice(0, 10); // Limit for performance

        for (const opponentMove of orderedOpponentMoves) {
          this.nodesSearched++;
          const afterOpponentMove = this.rules.makeTemporaryMove(
            opponentMove,
            newGameState,
          );
          const currentEval = ChessEvaluation.evaluatePosition(
            this.rules,
            afterOpponentMove,
            getColor,
            getPiece,
          );

          if (
            (opponentColor === "white" && currentEval > bestOpponentEval) ||
            (opponentColor === "black" && currentEval < bestOpponentEval)
          ) {
            bestOpponentEval = currentEval;
          }
        }
        evaluation = bestOpponentEval;
      }

      // Update best move for current player
      if (
        (color === "white" && evaluation > bestEvaluation) ||
        (color === "black" && evaluation < bestEvaluation)
      ) {
        bestEvaluation = evaluation;
        bestMove = move;
      }

      console.log(
        `Move ${move.fromRow},${move.fromCol} -> ${move.toRow},${move.toCol}: ${evaluation}`,
      );
    }

    console.log(`Best move evaluation: ${bestEvaluation}`);
    return bestMove;
  }

  /**
   * Orders moves to prioritize better moves first
   */
  orderMoves(moves, gameState) {
    return moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Prioritize captures
      const capturedPieceA = gameState.boardState[a.toRow][a.toCol];
      const capturedPieceB = gameState.boardState[b.toRow][b.toCol];

      if (capturedPieceA) {
        const capturedValue = PIECE_VALUES[PIECES[capturedPieceA]] || 0;
        const attackerValue = PIECE_VALUES[PIECES[a.piece]] || 0;
        scoreA += capturedValue - attackerValue * 0.1; // MVV-LVA approximation
      }

      if (capturedPieceB) {
        const capturedValue = PIECE_VALUES[PIECES[capturedPieceB]] || 0;
        const attackerValue = PIECE_VALUES[PIECES[b.piece]] || 0;
        scoreB += capturedValue - attackerValue * 0.1;
      }

      // Prioritize center moves for development
      const centerBonusA = this.getCenterBonus(a.toRow, a.toCol);
      const centerBonusB = this.getCenterBonus(b.toRow, b.toCol);
      scoreA += centerBonusA;
      scoreB += centerBonusB;

      // Prioritize piece development
      if (PIECES[a.piece] === "knight" || PIECES[a.piece] === "bishop") {
        if (a.fromRow === 0 || a.fromRow === 7) scoreA += 10; // Development bonus
      }
      if (PIECES[b.piece] === "knight" || PIECES[b.piece] === "bishop") {
        if (b.fromRow === 0 || b.fromRow === 7) scoreB += 10;
      }

      return scoreB - scoreA; // Higher score first
    });
  }

  /**
   * Get bonus for moves toward center
   */
  getCenterBonus(row, col) {
    const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
    return Math.max(0, 7 - centerDistance);
  }
  /**
   * Placeholder for future alpha-beta pruning implementation
   * This clean interface makes it easy to upgrade the search
   */
  alphaBetaSearch(color, gameState, getColor, getPiece) {
    // TODO: Implement alpha-beta pruning here
    // This will replace the current minimax when implemented
    console.log(
      "Alpha-beta search not yet implemented, falling back to minimax",
    );
    return this.minimax(color, gameState, getColor, getPiece);
  }

  /**
   * Sets the search depth for the AI
   */
  setSearchDepth(depth) {
    this.searchDepth = Math.max(1, Math.min(depth, 6)); // Limit to reasonable range
  }

  /**
   * Gets current search statistics
   */
  getStats() {
    return {
      nodesSearched: this.nodesSearched,
      searchDepth: this.searchDepth,
    };
  }
}

/**
 * Future Alpha-Beta Implementation Plan:
 *
 * The alphaBetaSearch method above will be implemented with:
 * 1. Alpha-beta pruning to dramatically reduce search space
 * 2. Move ordering (captures first, then checks, then other moves)
 * 3. Transposition table for caching evaluated positions
 * 4. Iterative deepening for better time management
 * 5. Quiescence search to avoid horizon effect
 *
 * The clean interface design makes this upgrade straightforward:
 * - ChessEvaluation handles all position evaluation
 * - ChessRules handles all move generation and validation
 * - ChessAI focuses purely on search algorithms
 *
 * This separation of concerns will make the alpha-beta implementation
 * much cleaner and easier to debug.
 */

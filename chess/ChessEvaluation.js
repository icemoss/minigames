import {
  CASTLING_BONUS,
  CHECK_PENALTY,
  CHECKMATE_VALUE,
  DOUBLED_PAWN_PENALTY,
  PIECE_SQUARE_TABLES,
  PIECE_VALUES,
  PIECES,
  RANDOMIZATION_FACTOR,
  WHITE_PIECES,
} from "./constants.js";

export class ChessEvaluation {
  static evaluatePosition(rules, gameState) {
    let evaluation = 0;

    // Material and positional evaluation
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.boardState[row][col]; // Use direct access instead of getPiece function
        if (!piece) continue;

        const color = this.getPieceColor(piece);
        const pieceType = PIECES[piece];
        const pieceValue = PIECE_VALUES[pieceType];

        // Positional value
        const positionValue = this.getPositionalValue(
          pieceType,
          row,
          col,
          color,
          gameState,
        );

        // Apply values based on color
        if (color === "white") {
          evaluation += pieceValue + positionValue;
        } else {
          evaluation -= pieceValue + positionValue;
        }
      }
    }

    // Add tactical evaluation
    evaluation += this.evaluateTactics(gameState);

    // Add game state bonuses/penalties
    evaluation += this.evaluateGameState(rules, gameState);

    // Add slight randomization to avoid repetitive play
    evaluation += (Math.random() - 0.5) * RANDOMIZATION_FACTOR;

    return evaluation;
  }

  /**
   * Gets piece color using the constants
   */
  static getPieceColor(piece) {
    return WHITE_PIECES.has(piece) ? "white" : "black";
  }

  /**
   * Gets positional value for a piece based on piece-square tables
   */
  static getPositionalValue(pieceType, row, col, color, gameState) {
    const accessRow = color === "white" ? row : 7 - row;
    const accessCol = color === "white" ? col : 7 - col;

    let positionValue = PIECE_SQUARE_TABLES[pieceType][accessRow][accessCol];

    // Special case: penalize doubled pawns
    if (pieceType === "pawn") {
      positionValue += this.evaluatePawnStructure(row, col, color, gameState);
    }

    return positionValue;
  }

  /**
   * Evaluates pawn structure (doubled pawns, etc.)
   */
  static evaluatePawnStructure(row, col, color, gameState) {
    // Check for doubled pawns on the same file
    for (let checkRow = 0; checkRow < 8; checkRow++) {
      if (checkRow !== row) {
        const piece = gameState.boardState[checkRow][col];
        if (piece && PIECES[piece] === "pawn") {
          const pieceColor = this.getPieceColor(piece);
          if (pieceColor === color) {
            return -DOUBLED_PAWN_PENALTY;
          }
        }
      }
    }
    return 0;
  }

  /**
   * Evaluates tactical factors (piece safety, attacks, etc.)
   */
  static evaluateTactics(gameState) {
    let tacticalScore = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.boardState[row][col];
        if (!piece) continue;

        const color = this.getPieceColor(piece);
        const pieceType = PIECES[piece];
        const pieceValue = PIECE_VALUES[pieceType];

        // Check if piece is under attack
        const isUnderAttack = this.isPieceUnderAttack(
          row,
          col,
          color,
          gameState,
        );
        const isDefended = this.isPieceDefended(row, col, color, gameState);

        if (isUnderAttack && !isDefended) {
          // Undefended piece under attack - major penalty
          const penalty = pieceValue * 0.8;
          if (color === "white") {
            tacticalScore -= penalty;
          } else {
            tacticalScore += penalty;
          }
        } else if (isUnderAttack && isDefended) {
          // Defended piece under attack - smaller penalty
          const penalty = pieceValue * 0.2;
          if (color === "white") {
            tacticalScore -= penalty;
          } else {
            tacticalScore += penalty;
          }
        }
      }
    }

    return tacticalScore;
  }

  /**
   * Check if a piece is under attack by opponent pieces
   */
  static isPieceUnderAttack(row, col, color, gameState) {
    const opponentColor = color === "white" ? "black" : "white";

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = gameState.boardState[r][c];
        if (piece && this.getPieceColor(piece) === opponentColor) {
          if (this.canPieceAttackSquare(r, c, row, col, gameState)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Check if a piece is defended by friendly pieces
   */
  static isPieceDefended(row, col, color, gameState) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r === row && c === col) continue; // Skip the piece itself

        const piece = gameState.boardState[r][c];
        if (piece && this.getPieceColor(piece) === color) {
          if (this.canPieceAttackSquare(r, c, row, col, gameState)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Check if a piece can attack a specific square (simplified)
   */
  static canPieceAttackSquare(fromRow, fromCol, toRow, toCol, gameState) {
    const piece = gameState.boardState[fromRow][fromCol];
    if (!piece) return false;

    const pieceType = PIECES[piece];
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    switch (pieceType) {
      case "pawn": {
        const color = this.getPieceColor(piece);
        const direction = color === "white" ? -1 : 1;
        return rowDiff === direction && Math.abs(colDiff) === 1;
      }
      case "rook":
        return (
          (rowDiff === 0 || colDiff === 0) &&
          this.isPathClear(fromRow, fromCol, toRow, toCol, gameState)
        );
      case "bishop":
        return (
          Math.abs(rowDiff) === Math.abs(colDiff) &&
          this.isPathClear(fromRow, fromCol, toRow, toCol, gameState)
        );
      case "queen":
        return (
          (rowDiff === 0 ||
            colDiff === 0 ||
            Math.abs(rowDiff) === Math.abs(colDiff)) &&
          this.isPathClear(fromRow, fromCol, toRow, toCol, gameState)
        );
      case "knight":
        return (
          (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
          (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2)
        );
      case "king":
        return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
      default:
        return false;
    }
  }

  /**
   * Check if path between two squares is clear
   */
  static isPathClear(fromRow, fromCol, toRow, toCol, gameState) {
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

    let row = fromRow + rowStep;
    let col = fromCol + colStep;

    while (row !== toRow || col !== toCol) {
      if (gameState.boardState[row][col] !== null) {
        return false;
      }
      row += rowStep;
      col += colStep;
    }

    return true;
  }

  /**
   * Evaluates game state factors (checks, castling, etc.)
   */
  static evaluateGameState(rules, gameState) {
    let stateEvaluation = 0;

    // Check penalties
    if (rules.isInCheck("white", gameState)) stateEvaluation -= CHECK_PENALTY;
    if (rules.isInCheck("black", gameState)) stateEvaluation += CHECK_PENALTY;

    // Checkmate/stalemate
    if (rules.isCheckmate("white", gameState))
      stateEvaluation -= CHECKMATE_VALUE;
    if (rules.isCheckmate("black", gameState))
      stateEvaluation += CHECKMATE_VALUE;
    if (
      rules.isStalemate("white", gameState) ||
      rules.isStalemate("black", gameState)
    ) {
      return 0; // Draw
    }

    // Castling bonuses
    if (gameState.castleWhiteKingside || gameState.castleWhiteQueenside) {
      stateEvaluation += CASTLING_BONUS;
    }
    if (gameState.castleBlackKingside || gameState.castleBlackQueenside) {
      stateEvaluation -= CASTLING_BONUS;
    }

    return stateEvaluation;
  }
}

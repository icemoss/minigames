"use strict";

import { Move } from "./move.js";
import { PIECES, WHITE_PIECES, BLACK_PIECES } from "./constants.js";

export class ChessRules {
  /**
   * Generates all legal moves for a piece at the given position
   */
  static getLegalMoves(row, col, gameState) {
    const piece = this.getPiece(row, col, gameState);
    if (!piece) return [];

    const color = this.getColor(piece);
    const pieceType = PIECES[piece];
    let legalMoves = [];

    switch (pieceType) {
      case "pawn":
        legalMoves = this.getPawnMoves(row, col, piece, color, gameState);
        break;
      case "king":
        legalMoves = this.getKingMoves(row, col, piece, color, gameState);
        break;
      case "knight":
        legalMoves = this.getKnightMoves(row, col, piece, color, gameState);
        break;
      case "rook":
        legalMoves = this.getRookMoves(row, col, piece, color, gameState);
        break;
      case "bishop":
        legalMoves = this.getBishopMoves(row, col, piece, color, gameState);
        break;
      case "queen":
        legalMoves = this.getQueenMoves(row, col, piece, color, gameState);
        break;
    }

    // Filter out moves that leave the king in check
    return this.filterMovesInCheck(legalMoves, color, gameState);
  }

  /**
   * Generates all legal moves for a color
   */
  static generateAllMoves(color, gameState) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col, gameState);
        if (piece && this.getColor(piece) === color) {
          moves.push(...this.getLegalMoves(row, col, gameState));
        }
      }
    }
    return moves;
  }

  /**
   * Makes a temporary move for AI evaluation (returns new game state)
   */
  static makeTemporaryMove(move, gameState) {
    const newGameState = structuredClone(gameState);
    this.executeMove(move, newGameState);
    return newGameState;
  }

  /**
   * Executes a move on the game state (modifies the state)
   */
  static executeMove(move, gameState) {
    // Remove piece from original position
    gameState.boardState[move.fromRow][move.fromCol] = null;

    // Place piece at new position (this naturally captures any piece there)
    gameState.boardState[move.toRow][move.toCol] = move.piece;

    // Handle special captures (like en passant where captured piece is elsewhere)
    if (move.capturedRow !== null && move.capturedCol !== null) {
      // Only remove if it's a different square (en passant case)
      if (move.capturedRow !== move.toRow || move.capturedCol !== move.toCol) {
        gameState.boardState[move.capturedRow][move.capturedCol] = null;
      }
    }

    // Handle castling
    if (move.castling) {
      const castle = move.castling;
      gameState.boardState[castle.fromRow][castle.fromCol] = null;
      gameState.boardState[castle.toRow][castle.toCol] = castle.piece;
    }

    // Update castling rights
    this.updateCastlingRights(move, gameState);

    // Update en passant
    gameState.enPassant = move.doublePawnMove || null;

    // Switch turns
    gameState.player = gameState.player === "white" ? "black" : "white";
  }

  /**
   * Get pawn moves
   */
  static getPawnMoves(row, col, piece, color, gameState) {
    const moves = [];
    const offset = color === "white" ? -1 : 1;

    // Promotion piece (simplified - always queen)
    const promotionPiece =
      row + offset === 7 || row + offset === 0
        ? color === "white"
          ? "♕"
          : "♛"
        : piece;

    // Forward move
    if (this.isEmpty(row + offset, col, gameState)) {
      moves.push(new Move(row, col, row + offset, col, promotionPiece));

      // Double move from starting position
      if (
        this.isEmpty(row + offset * 2, col, gameState) &&
        ((color === "white" && row === 6) || (color === "black" && row === 1))
      ) {
        moves.push(
          new Move(row, col, row + offset * 2, col, promotionPiece, {
            doublePawnMove: { row: row + offset * 2, col },
          }),
        );
      }
    }

    // Diagonal captures
    for (const targetCol of [col - 1, col + 1]) {
      if (this.isInbounds(row + offset, targetCol)) {
        const targetPiece = this.getPiece(row + offset, targetCol, gameState);
        if (targetPiece && this.getColor(targetPiece) !== color) {
          moves.push(
            new Move(row, col, row + offset, targetCol, promotionPiece, {
              capturedRow: row + offset,
              capturedCol: targetCol,
            }),
          );
        }
      }
    }

    // En passant
    if (
      gameState.enPassant &&
      gameState.enPassant.row === row &&
      Math.abs(gameState.enPassant.col - col) === 1
    ) {
      moves.push(
        new Move(
          row,
          col,
          row + offset,
          gameState.enPassant.col,
          promotionPiece,
          {
            capturedRow: row,
            capturedCol: gameState.enPassant.col,
          },
        ),
      );
    }

    return moves;
  }

  /**
   * Get king moves (including castling)
   */
  static getKingMoves(row, col, piece, color, gameState) {
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    const moves = this.getLeapingMoves(
      row,
      col,
      piece,
      color,
      directions,
      gameState,
    );

    // Add castling moves
    if (this.canCastle(color, "kingside", gameState)) {
      moves.push(
        new Move(row, col, row, 6, piece, {
          castling: {
            fromRow: row,
            fromCol: 7,
            toRow: row,
            toCol: 5,
            piece: this.getPiece(row, 7, gameState),
          },
        }),
      );
    }

    if (this.canCastle(color, "queenside", gameState)) {
      moves.push(
        new Move(row, col, row, 2, piece, {
          castling: {
            fromRow: row,
            fromCol: 0,
            toRow: row,
            toCol: 3,
            piece: this.getPiece(row, 0, gameState),
          },
        }),
      );
    }

    return moves;
  }

  /**
   * Get knight moves
   */
  static getKnightMoves(row, col, piece, color, gameState) {
    const directions = [
      [-2, -1],
      [-2, 1],
      [2, -1],
      [2, 1],
      [-1, -2],
      [1, -2],
      [-1, 2],
      [1, 2],
    ];
    return this.getLeapingMoves(row, col, piece, color, directions, gameState);
  }

  /**
   * Get rook moves
   */
  static getRookMoves(row, col, piece, color, gameState) {
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    return this.getSlidingMoves(row, col, piece, color, directions, gameState);
  }

  /**
   * Get bishop moves
   */
  static getBishopMoves(row, col, piece, color, gameState) {
    const directions = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    return this.getSlidingMoves(row, col, piece, color, directions, gameState);
  }

  /**
   * Get queen moves
   */
  static getQueenMoves(row, col, piece, color, gameState) {
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    return this.getSlidingMoves(row, col, piece, color, directions, gameState);
  }

  static getLeapingMoves(row, col, piece, color, directions, gameState) {
    const moves = [];
    for (const [drow, dcol] of directions) {
      const newRow = row + drow;
      const newCol = col + dcol;

      if (this.isInbounds(newRow, newCol)) {
        const targetPiece = this.getPiece(newRow, newCol, gameState);
        if (!targetPiece || this.getColor(targetPiece) !== color) {
          // For normal captures, don't set capturedRow/capturedCol
          // The capture happens naturally when we place our piece at the destination
          moves.push(new Move(row, col, newRow, newCol, piece));
        }
      }
    }
    return moves;
  }

  static getSlidingMoves(row, col, piece, color, directions, gameState) {
    const moves = [];
    for (const [drow, dcol] of directions) {
      for (let i = 1; i < 8; i++) {
        const newRow = row + drow * i;
        const newCol = col + dcol * i;

        if (!this.isInbounds(newRow, newCol)) break;

        const targetPiece = this.getPiece(newRow, newCol, gameState);
        if (!targetPiece) {
          moves.push(new Move(row, col, newRow, newCol, piece));
        } else {
          if (this.getColor(targetPiece) !== color) {
            moves.push(new Move(row, col, newRow, newCol, piece));
          }
          break;
        }
      }
    }
    return moves;
  }
  static getPiece(row, col, gameState) {
    return gameState.boardState[row]?.[col] || null;
  }

  static getColor(piece) {
    return WHITE_PIECES.has(piece) ? "white" : "black";
  }

  static isEmpty(row, col, gameState) {
    return !this.getPiece(row, col, gameState);
  }

  static isInbounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  static filterMovesInCheck(moves, color, gameState) {
    // Filter out moves that would leave the king in check
    const legalMoves = [];

    for (const move of moves) {
      // Make a temporary move
      const tempGameState = structuredClone(gameState);
      this.executeMove(move, tempGameState);

      // Check if our king is in check after this move
      // Use the simple check detection to avoid recursion
      if (!this.isKingInCheckSimple(color, tempGameState)) {
        legalMoves.push(move);
      }
    }

    return legalMoves;
  }

  /**
   * Simple check detection that doesn't rely on getLegalMoves to avoid recursion
   */
  static isKingInCheckSimple(color, gameState) {
    const kingPosition = this.findKing(color, gameState);
    if (!kingPosition) return false;

    const opponentColor = color === "white" ? "black" : "white";

    // Check each opponent piece to see if it can attack the king
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col, gameState);
        if (piece && this.getColor(piece) === opponentColor) {
          if (
            this.canPieceAttackSquareSimple(
              row,
              col,
              kingPosition.row,
              kingPosition.col,
              gameState,
            )
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Simple piece attack detection without using move generation
   */
  static canPieceAttackSquareSimple(fromRow, fromCol, toRow, toCol, gameState) {
    const piece = this.getPiece(fromRow, fromCol, gameState);
    if (!piece) return false;

    const pieceType = PIECES[piece];
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    switch (pieceType) {
      case "pawn": {
        const color = this.getColor(piece);
        const direction = color === "white" ? -1 : 1;
        return rowDiff === direction && absColDiff === 1;
      }
      case "rook":
        return (
          (rowDiff === 0 || colDiff === 0) &&
          this.isPathClearSimple(fromRow, fromCol, toRow, toCol, gameState)
        );
      case "bishop":
        return (
          absRowDiff === absColDiff &&
          this.isPathClearSimple(fromRow, fromCol, toRow, toCol, gameState)
        );
      case "queen":
        return (
          (rowDiff === 0 || colDiff === 0 || absRowDiff === absColDiff) &&
          this.isPathClearSimple(fromRow, fromCol, toRow, toCol, gameState)
        );
      case "knight":
        return (
          (absRowDiff === 2 && absColDiff === 1) ||
          (absRowDiff === 1 && absColDiff === 2)
        );
      case "king":
        return absRowDiff <= 1 && absColDiff <= 1;
      default:
        return false;
    }
  }

  /**
   * Check if path between two squares is clear (simple version)
   */
  static isPathClearSimple(fromRow, fromCol, toRow, toCol, gameState) {
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

  static canCastle(color, side, gameState) {
    const row = color === "white" ? 7 : 0;
    const kingCol = 4;
    const king = this.getPiece(row, kingCol, gameState);

    // 1. King must be in starting position and not moved
    if (!king || PIECES[king] !== "king" || this.getColor(king) !== color) {
      return false;
    }

    // 2. Check castling rights (king and rook haven't moved)
    let hasRights = false;
    let rookCol = 0;

    if (side === "kingside") {
      hasRights =
        color === "white"
          ? gameState.castleWhiteKingside
          : gameState.castleBlackKingside;
      rookCol = 7;
    } else {
      hasRights =
        color === "white"
          ? gameState.castleWhiteQueenside
          : gameState.castleBlackQueenside;
      rookCol = 0;
    }

    if (!hasRights) {
      return false;
    }

    // 3. Rook must be in correct position
    const rook = this.getPiece(row, rookCol, gameState);
    if (!rook || PIECES[rook] !== "rook" || this.getColor(rook) !== color) {
      return false;
    }

    // 4. Path between king and rook must be clear
    const startCol = Math.min(kingCol, rookCol);
    const endCol = Math.max(kingCol, rookCol);

    for (let col = startCol + 1; col < endCol; col++) {
      if (this.getPiece(row, col, gameState) !== null) {
        return false; // Path is blocked
      }
    }

    // 5. King must not be in check
    if (this.isKingInCheckSimple(color, gameState)) {
      return false;
    }

    // 6. King must not pass through check or land in check
    const kingPath = side === "kingside" ? [5, 6] : [3, 2];

    for (const col of kingPath) {
      // Create a temporary game state with king moved to this square
      const tempGameState = structuredClone(gameState);
      tempGameState.boardState[row][kingCol] = null; // Remove king from original position
      tempGameState.boardState[row][col] = king; // Place king at new position

      // Check if king would be in check at this position
      if (this.isKingInCheckAtPosition(row, col, color, tempGameState)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if king would be in check at a specific position
   */
  static isKingInCheckAtPosition(kingRow, kingCol, color, gameState) {
    const opponentColor = color === "white" ? "black" : "white";

    // Check each opponent piece to see if it can attack the king position
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col, gameState);
        if (piece && this.getColor(piece) === opponentColor) {
          if (
            this.canPieceAttackSquareSimple(
              row,
              col,
              kingRow,
              kingCol,
              gameState,
            )
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  static updateCastlingRights(move, gameState) {
    // Update castling rights when king or rook moves
    const piece = PIECES[move.piece];

    if (piece === "king") {
      if (this.getColor(move.piece) === "white") {
        gameState.castleWhiteKingside = false;
        gameState.castleWhiteQueenside = false;
      } else {
        gameState.castleBlackKingside = false;
        gameState.castleBlackQueenside = false;
      }
    }

    if (piece === "rook") {
      const color = this.getColor(move.piece);
      if (color === "white") {
        if (move.fromCol === 0) gameState.castleWhiteQueenside = false;
        if (move.fromCol === 7) gameState.castleWhiteKingside = false;
      } else {
        if (move.fromCol === 0) gameState.castleBlackQueenside = false;
        if (move.fromCol === 7) gameState.castleBlackKingside = false;
      }
    }
  }

  static isInCheck(color, gameState) {
    return this.isKingInCheckSimple(color, gameState);
  }

  static findKing(color, gameState) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col, gameState);
        if (
          piece &&
          PIECES[piece] === "king" &&
          this.getColor(piece) === color
        ) {
          return { row, col };
        }
      }
    }
    return null;
  }

  static getLegalMovesWithoutCheckFilter(row, col, gameState) {
    // This generates moves without filtering for check (used internally)
    const piece = this.getPiece(row, col, gameState);
    if (!piece) return [];

    const color = this.getColor(piece);
    const pieceType = PIECES[piece];
    let legalMoves = [];

    switch (pieceType) {
      case "pawn":
        legalMoves = this.getPawnMoves(row, col, piece, color, gameState);
        break;
      case "king":
        // For check detection, don't include castling moves
        const directions = [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1],
        ];
        legalMoves = this.getLeapingMoves(
          row,
          col,
          piece,
          color,
          directions,
          gameState,
        );
        break;
      case "knight":
        legalMoves = this.getKnightMoves(row, col, piece, color, gameState);
        break;
      case "rook":
        legalMoves = this.getRookMoves(row, col, piece, color, gameState);
        break;
      case "bishop":
        legalMoves = this.getBishopMoves(row, col, piece, color, gameState);
        break;
      case "queen":
        legalMoves = this.getQueenMoves(row, col, piece, color, gameState);
        break;
    }

    return legalMoves;
  }

  static isCheckmate(color, gameState) {
    // If not in check, can't be checkmate
    if (!this.isInCheck(color, gameState)) {
      return false;
    }

    // If in check and no legal moves, it's checkmate
    return this.generateAllMoves(color, gameState).length === 0;
  }

  static isStalemate(color, gameState) {
    // If in check, can't be stalemate
    if (this.isInCheck(color, gameState)) {
      return false;
    }

    // If not in check and no legal moves, it's stalemate
    return this.generateAllMoves(color, gameState).length === 0;
  }
}

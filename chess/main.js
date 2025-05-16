"use strict";
import { Move } from "./move.js";

class ChessGame {
  constructor() {
    this.board = document.querySelector("#board");
    this.whitePieces = new Set(["♔", "♕", "♖", "♗", "♘", "♙"]);
    this.blackPieces = new Set(["♚", "♛", "♜", "♝", "♞", "♟"]);
    this.pieces = {
      "♔": "king",
      "♕": "queen",
      "♖": "rook",
      "♗": "bishop",
      "♘": "knight",
      "♙": "pawn",
      "♚": "king",
      "♛": "queen",
      "♜": "rook",
      "♝": "bishop",
      "♞": "knight",
      "♟": "pawn",
    };
    this.selectedPiece = null;
    this.gameState = {
      player: "white",
      boardState: this.createInitialBoardState(), // 2D array [row][col]
      enPassant: null,
      castleBlackKingside: true,
      castleBlackQueenside: true,
      castleWhiteKingside: true,
      castleWhiteQueenside: true,
    };
    this.renderBoard();
    this.addEventListeners();
  }

  createInitialBoardState() {
    return [
      ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"], // black pieces (0-7)
      ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"], // black pawns (8-15)
      [null, null, null, null, null, null, null, null], // (16-23)
      [null, null, null, null, null, null, null, null], // (24-31)
      [null, null, null, null, null, null, null, null], // (32-39)
      [null, null, null, null, null, null, null, null], // (40-47)
      ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"], // white pawns (48-55)
      ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"], // white pieces (56-63)
    ];
  }

  renderBoard() {
    this.board.innerHTML = "";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        square.className = `square s${row}x${col}`; // row1 col4 = s1x4
        square.classList.add(
          "square",
          `s${row}x${col}`,
          (row + col) % 2 === 0 ? "light-square" : "dark-square",
        );
        square.dataset.row = row.toString();
        square.dataset.col = col.toString();
        square.textContent = this.getPiece(row, col) ?? "";
        this.board.append(square);
      }
    }
  }

  addEventListeners() {
    this.board.addEventListener("click", (e) => {
      const square = e.target.closest(".square");
      if (!square) return;
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);
      this.handleClick(row, col);
    });
    document.querySelector("#reset").addEventListener("click", () => {
      this.selectedPiece = null;
      this.gameState = {
        player: "white",
        boardState: this.createInitialBoardState(), // 2D array [row][col]
        enPassant: null,
        castleBlackKingside: true,
        castleBlackQueenside: true,
        castleWhiteKingside: true,
        castleWhiteQueenside: true,
      };
      this.renderBoard();
    });
  }

  handleClick(row, col) {
    const square = document.querySelector(`.s${row}x${col}`);
    if (square.classList.contains("legal-move")) {
      const move = JSON.parse(square.dataset.move);
      this.makeMove(move);
      
      // Set the En Passant flag.
      if (move.doublePawnMove) {
        this.gameState.enPassant = move.doublePawnMove;
      } else {
        this.gameState.enPassant = null;
      }
      this.selectedPiece = null;

      // Switch turns
      if (this.gameState.player === "white") {
        this.gameState.player = "black";
      } else {
        this.gameState.player = "white";
      }
      
      this.renderBoard();
    } else {
      this.deselectAllSquares();
      // Deselect if clicked the same square or a square of a different color
      if (
        (this.selectedPiece?.row === row && this.selectedPiece?.col === col) ||
        this.getColor(square.textContent) !== this.gameState.player
      ) {
        this.selectedPiece = null;
      } else {
        this.selectedPiece = { row, col };
        square.classList.add("selected");

        // Select all legal moves
        const legalMoves = this.getLegalMoves(row, col);
        console.log(legalMoves);
        legalMoves.forEach((move) => {
          const legalSquare = document.querySelector(
            `.s${move.toRow}x${move.toCol}`,
          );
          legalSquare.classList.add("legal-move");
          legalSquare.dataset.move = JSON.stringify(move);
        });
      }
    }
  }

  deselectAllSquares() {
    // Deselect all .selected
    document.querySelectorAll(".selected").forEach((square) => {
      square.classList.remove("selected");
    });
    // Deselect all .legal-move
    document.querySelectorAll(".legal-move").forEach((square) => {
      square.classList.remove("legal-move");
    });
  }

  isEmpty(row, col) {
    // Square is null and inbounds
    return this.isInbounds(row, col) && this.getPiece(row, col) === null;
  }

  isValid(row, col, color) {
    // Square is different color and inbounds
    return (
      this.isInbounds(row, col) &&
      this.getColor(this.getPiece(row, col)) !== color
    );
  }

  isInbounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  makeMove(move) {
    // Clear previous space.
    this.setPiece(move.fromRow, move.fromCol, null);
    // Clear captured piece.
    if (move.capturedRow !== null && move.capturedCol !== null) {
      console.log(
        `${this.getPiece(move.capturedRow, move.capturedCol)} captured`,
      );
      this.setPiece(move.capturedRow, move.capturedCol, null);
    }
    // Set space to the moved piece.
    this.setPiece(move.toRow, move.toCol, move.piece);


    if (move.castling) {
      this.setPiece(move.castling.fromRow, move.castling.fromCol, null);
      this.setPiece(
        move.castling.toRow,
        move.castling.toCol,
        move.castling.piece,
      );
    }
  }

  getLegalMoves(row, col) {
    const piece = this.getPiece(row, col);
    const color = this.getColor(piece);
    let legalMoves = [];
    switch (this.pieces[piece]) {
      case "pawn": {
        // Direction the pawn moves
        const offset = color === "white" ? -1 : 1;
        if (this.isEmpty(row + offset, col)) {
          legalMoves.push(new Move(row, col, row + offset, col, piece));
          // If two squares are empty and the pawn is on the starting row
          if (
            this.isEmpty(row + offset * 2, col) &&
            ((color === "white" && row === 6) ||
              (color === "black" && row === 1))
          ) {
            legalMoves.push(
              new Move(row, col, row + offset * 2, col, piece, {
                doublePawnMove: { row: row + offset * 2, col },
              }),
            );
          }
        }
        // Capturing
        const diagonalColumns = [col - 1, col + 1];
        const opponentColor = color === "white" ? "black" : "white";

        for (const targetCol of diagonalColumns) {
          if (
            this.getColor(this.getPiece(row + offset, targetCol)) ===
            opponentColor
          ) {
            legalMoves.push(
              new Move(row, col, row + offset, targetCol, piece, {
                capturedRow: row + offset,
                capturedCol: targetCol,
              }),
            );
          }
        }

        // If the last move is valid for En passant
        if (this.gameState.enPassant) {
          if (
            this.gameState.enPassant.row === row &&
            Math.abs(this.gameState.enPassant.col - col) === 1
          ) {
            legalMoves.push(
              new Move(
                row,
                col,
                row + offset,
                this.gameState.enPassant.col,
                piece,
                {
                  capturedRow: row,
                  capturedCol: this.gameState.enPassant.col,
                },
              ),
            );
          }
        }

        break;
      }
      case "king": {
        const directions = [
          { drow: -1, dcol: -1 },
          { drow: -1, dcol: 0 },
          { drow: -1, dcol: 1 },
          { drow: 0, dcol: -1 },
          { drow: 0, dcol: 1 },
          { drow: 1, dcol: -1 },
          { drow: 1, dcol: 0 },
          { drow: 1, dcol: 1 },
        ];
        legalMoves = this.getLegalLeapingMoves(
          row,
          col,
          piece,
          color,
          directions,
        );
        if (color === "white") {
          if (
            this.gameState.castleWhiteKingside &&
            this.isEmpty(7, 5) &&
            this.isEmpty(7, 6)
          ) {
            legalMoves.push(
              new Move(row, col, row, 6, piece, {
                castling: {
                  fromRow: row,
                  fromCol: 7,
                  toRow: row,
                  toCol: 5,
                  piece: this.getPiece(row, 7),
                },
              }),
            );
          }
          if (
            this.gameState.castleWhiteQueenside &&
            this.isEmpty(7, 3) &&
            this.isEmpty(7, 2) &&
            this.isEmpty(7, 1)
          ) {
            legalMoves.push(
              new Move(row, col, row, 2, piece, {
                castling: {
                  fromRow: row,
                  fromCol: 0,
                  toRow: row,
                  toCol: 3,
                  piece: this.getPiece(row, 0),
                },
              }),
            );
          }
        } else {
          if (
            this.gameState.castleBlackKingside &&
            this.isEmpty(0, 5) &&
            this.isEmpty(0, 6)
          ) {
            legalMoves.push(
              new Move(row, col, row, 6, piece, {
                castling: {
                  fromRow: row,
                  fromCol: 7,
                  toRow: row,
                  toCol: 5,
                  piece: this.getPiece(row, 7),
                },
              }),
            );
          }
          if (
            this.gameState.castleBlackQueenside &&
            this.isEmpty(0, 3) &&
            this.isEmpty(0, 2) &&
            this.isEmpty(0, 1)
          ) {
            legalMoves.push(
              new Move(row, col, row, 2, piece, {
                castling: {
                  fromRow: row,
                  fromCol: 0,
                  toRow: row,
                  toCol: 3,
                  piece: this.getPiece(row, 3),
                },
              }),
            );
          }
        }
        break;
      }
      case "knight": {
        const directions = [
          { drow: -2, dcol: -1 },
          { drow: -2, dcol: 1 },
          { drow: 2, dcol: -1 },
          { drow: 2, dcol: 1 },
          { drow: -1, dcol: -2 },
          { drow: 1, dcol: -2 },
          { drow: -1, dcol: 2 },
          { drow: 1, dcol: 2 },
        ];
        legalMoves = this.getLegalLeapingMoves(
          row,
          col,
          piece,
          color,
          directions,
        );
        break;
      }
      case "rook": {
        legalMoves = this.getLegalOrthogonalMoves(row, col, piece, color);
        break;
      }
      case "bishop": {
        legalMoves = this.getLegalDiagonalMoves(row, col, piece, color);
        break;
      }
      case "queen": {
        legalMoves = this.getLegalOrthogonalMoves(
          row,
          col,
          piece,
          color,
        ).concat(this.getLegalDiagonalMoves(row, col, piece, color));
        break;
      }
    }
    return legalMoves;
  }

  getLegalOrthogonalMoves(row, col, piece, color) {
    const directions = [
      { drow: 1, dcol: 0 },
      { drow: -1, dcol: 0 },
      { drow: 0, dcol: 1 },
      { drow: 0, dcol: -1 },
    ];
    return this.getLegalDirectionMoves(row, col, piece, color, directions);
  }

  getLegalDiagonalMoves(row, col, piece, color) {
    const directions = [
      { drow: 1, dcol: 1 },
      { drow: 1, dcol: -1 },
      { drow: -1, dcol: 1 },
      { drow: -1, dcol: -1 },
    ];
    return this.getLegalDirectionMoves(row, col, piece, color, directions);
  }

  getLegalDirectionMoves(row, col, piece, color, directions) {
    const legalMoves = [];
    for (const direction of directions) {
      for (
        let toRow = row + direction.drow, toCol = col + direction.dcol;
        this.isValid(toRow, toCol, color) === true;
        toRow += direction.drow, toCol += direction.dcol
      ) {
        const options = {};
        if (!this.isEmpty(toRow, toCol)) {
          options.capturedRow = toRow;
          options.capturedCol = toCol;
        }
        legalMoves.push(new Move(row, col, toRow, toCol, piece, options));
        if (!this.isEmpty(toRow, toCol)) break;
      }
    }
    return legalMoves;
  }

  getLegalLeapingMoves(row, col, piece, color, directions) {
    const legalMoves = [];
    for (const direction of directions) {
      const toRow = row + direction.drow;
      const toCol = col + direction.dcol;
      if (this.isValid(toRow, toCol, color)) {
        const options = {};
        if (!this.isEmpty(toRow, toCol)) {
          options.capturedRow = toRow;
          options.capturedCol = toCol;
        }
        legalMoves.push(new Move(row, col, toRow, toCol, piece, options));
      }
    }
    return legalMoves;
  }

  getColor(piece) {
    if (this.whitePieces.has(piece)) return "white";
    if (this.blackPieces.has(piece)) return "black";
    return null;
  }

  getPiece(row, col) {
    return this.gameState.boardState[row][col];
  }

  setPiece(row, col, piece) {
    this.gameState.boardState[row][col] = piece;
  }
}

let chessGame = new ChessGame();
console.log(chessGame);

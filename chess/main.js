"use strict";
import { Move } from "./move.js";

class ChessGame {
  constructor(twoPlayer) {
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
    this.lastMove = null; // { fromRow, fromCol, toRow, toCol }
    this.twoPlayer = twoPlayer;
    this.active = true;
    this.gameState = {
      player: "white",
      boardState: this.createInitialBoardState(), // 2D array [row][col]
      enPassant: null,
      castleBlackKingside: true,
      castleBlackQueenside: true,
      castleWhiteKingside: true,
      castleWhiteQueenside: true,
    };
    this.turnsSinceLastEvent = 0;
    this.occuredPositions = {};
    this.occuredPositions[JSON.stringify(this.gameState)] = 1;
    this.renderBoard();
    this.addEventListeners();
  }

  createInitialBoardState() {
    // Default board state
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

    // Re-apply selection state if needed
    if (this.selectedPiece) {
      const selectedSquare = document.querySelector(
        `.s${this.selectedPiece.row}x${this.selectedPiece.col}`,
      );
      if (selectedSquare) {
        selectedSquare.classList.add("selected");

        // Re-highlight legal moves
        const legalMoves = this.getLegalMovesWithCheckFilter(
          this.selectedPiece.row,
          this.selectedPiece.col,
        );
        for (const legalMove of legalMoves) {
          const legalSquare = document.querySelector(
            `.s${legalMove.toRow}x${legalMove.toCol}`,
          );
          if (legalSquare) {
            legalSquare.classList.add("legal-move");
            legalSquare.dataset.move = JSON.stringify(legalMove);
          }
        }
      }
    }

    if (this.lastMove) {
      const fromSquare = document.querySelector(
        `.s${this.lastMove.fromRow}x${this.lastMove.fromCol}`,
      );
      if (fromSquare) {
        fromSquare.classList.add("last-move");
      }
      const toSquare = document.querySelector(
        `.s${this.lastMove.toRow}x${this.lastMove.toCol}`,
      );
      if (toSquare) {
        toSquare.classList.add("last-move");
      }
    }
  }

  addEventListeners() {
    this.board.addEventListener("click", (e) => {
      if (this.active) {
        const square = e.target.closest(".square");
        if (!square) return;
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        this.handleClick(row, col);
      }
    });
    document.querySelector("#reset").addEventListener("click", () => {
      this.reset();
    });
    document.querySelector("#two-player").addEventListener("change", (e) => {
      this.twoPlayer = e.target.checked;
      // this.reset();
    });
  }

  reset() {
    this.selectedPiece = null;
    this.lastMove = null; // { fromRow, fromCol, toRow, toCol }
    this.active = true;
    this.gameState = {
      player: "white",
      boardState: this.createInitialBoardState(), // 2D array [row][col]
      enPassant: null,
      castleBlackKingside: true,
      castleBlackQueenside: true,
      castleWhiteKingside: true,
      castleWhiteQueenside: true,
    };
    this.turnsSinceLastEvent = 0;
    this.occuredPositions = {};
    this.occuredPositions[JSON.stringify(this.gameState)] = 1;
    this.renderBoard();
  }

  handleClick(row, col) {
    const square = document.querySelector(`.s${row}x${col}`);
    if (square.classList.contains("legal-move")) {
      // Data for moves are stored in the dataset
      const move = JSON.parse(square.dataset.move);
      this.makeMove(move);
      this.lastMove = {
        fromCol: move.fromCol,
        fromRow: move.fromRow,
        toCol: move.toCol,
        toRow: move.toRow,
      };
      this.selectedPiece = null;

      // Toggle player
      const nextPlayer = this.gameState.player === "white" ? "black" : "white";
      this.gameState.player = nextPlayer;

      this.renderBoard();

      this.checkEnd(nextPlayer, move);

      if (!this.twoPlayer && this.active) {
        const aiMove = this.generateAiMove(nextPlayer);
        this.makeMove(aiMove);
        this.lastMove = {
          fromCol: aiMove.fromCol,
          fromRow: aiMove.fromRow,
          toCol: aiMove.toCol,
          toRow: aiMove.toRow,
        };
        const humanPlayer = nextPlayer === "white" ? "black" : "white";
        this.gameState.player = humanPlayer;

        this.renderBoard();

        this.checkEnd(humanPlayer, aiMove);
      }
    } else {
      // If clicking the same piece that was already selected, deselect it
      if (this.selectedPiece?.row === row && this.selectedPiece?.col === col) {
        this.selectedPiece = null;
      }
      // If clicking a piece of the wrong color, do nothing
      else if (this.getColor(square.textContent) !== this.gameState.player) {
        this.selectedPiece = null;
      }
      // Otherwise, select the new piece
      else {
        this.selectedPiece = { row, col };
      }

      // Re-render the board to show the updated selection state
      this.renderBoard();
    }
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
      this.setPiece(move.capturedRow, move.capturedCol, null);
    }
    // Set space to the moved piece.
    this.setPiece(move.toRow, move.toCol, move.piece);

    // Disqualify castling when king or rook moved.
    if (this.pieces[move.piece] === "king") {
      if (this.getColor(move.piece) === "white") {
        this.gameState.castleWhiteKingside = false;
        this.gameState.castleWhiteQueenside = false;
      } else {
        this.gameState.castleBlackKingside = false;
        this.gameState.castleBlackQueenside = false;
      }
    }
    if (this.pieces[move.piece] === "rook") {
      if (move.fromRow === 0 && move.fromCol === 0) {
        this.gameState.castleBlackQueenside = false;
      } else if (move.fromRow === 0 && move.fromCol === 7) {
        this.gameState.castleBlackKingside = false;
      } else if (move.fromRow === 7 && move.fromCol === 0) {
        this.gameState.castleWhiteQueenside = false;
      } else if (move.fromRow === 7 && move.fromCol === 7) {
        this.gameState.castleWhiteKingside = false;
      }
    }

    // Move the rook if castling
    if (move.castling) {
      this.setPiece(move.castling.fromRow, move.castling.fromCol, null);
      this.setPiece(
        move.castling.toRow,
        move.castling.toCol,
        move.castling.piece,
      );
    }

    // Set the En Passant flag.
    if (move.doublePawnMove) {
      this.gameState.enPassant = move.doublePawnMove;
    } else {
      this.gameState.enPassant = null;
    }
  }

  getLegalMovesWithCheckFilter(row, col) {
    const candidateMoves = this.getLegalMoves(row, col);
    const piece = this.getPiece(row, col);
    const color = this.getColor(piece);

    // Filter only moves that don't end in check.
    return candidateMoves.filter((move) => {
      const tempGameState = structuredClone(this.gameState);
      this.makeMove(move);

      const kingPos = this.findKingPosition(color);
      const wouldBeInCheck = this.isUnderAttack(
        kingPos.row,
        kingPos.col,
        color === "white" ? "black" : "white",
      );

      this.gameState = tempGameState;

      return !wouldBeInCheck;
    });
  }

  getLegalMoves(row, col) {
    const piece = this.getPiece(row, col);
    const color = this.getColor(piece);
    let legalMoves = [];
    switch (this.pieces[piece]) {
      case "pawn": {
        // Direction the pawn moves.
        const offset = color === "white" ? -1 : 1;
        // If moving to rows 7 or 0, become a queen.
        // Could be refactored later to allow selecting a different piece.
        const pawnPiece =
          row + offset === 7 || row + offset === 0
            ? color === "white"
              ? "♕"
              : "♛"
            : piece;
        if (this.isEmpty(row + offset, col)) {
          legalMoves.push(new Move(row, col, row + offset, col, pawnPiece));
          // Move two spaces if on the starting row.
          if (
            this.isEmpty(row + offset * 2, col) &&
            ((color === "white" && row === 6) ||
              (color === "black" && row === 1))
          ) {
            legalMoves.push(
              new Move(row, col, row + offset * 2, col, pawnPiece, {
                doublePawnMove: { row: row + offset * 2, col },
              }),
            );
          }
        }
        // Move diagonally only if capturing.
        const diagonalColumns = [col - 1, col + 1];
        const opponentColor = color === "white" ? "black" : "white";

        for (const targetCol of diagonalColumns) {
          if (
            this.getColor(this.getPiece(row + offset, targetCol)) ===
            opponentColor
          ) {
            legalMoves.push(
              new Move(row, col, row + offset, targetCol, pawnPiece, {
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
                pawnPiece,
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
          if (this.canCastle(color, "kingside")) {
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
          if (this.canCastle(color, "queenside")) {
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
          if (this.canCastle(color, "kingside")) {
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
          if (this.canCastle(color, "queenside")) {
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

  isInCheck(color) {
    const kingPos = this.findKingPosition(color);
    return this.isUnderAttack(
      kingPos.row,
      kingPos.col,
      color === "white" ? "black" : "white",
    );
  }

  isCheckmate(color) {
    // Must be in check to be in checkmate.
    if (!this.isInCheck(color)) return false;
    return !this.areLegalMovesAvailable(color);
  }

  isStalemate(color) {
    // Cannot be stalemate in check.
    if (this.isInCheck(color)) return false;
    return !this.areLegalMovesAvailable(color);
  }

  isDrawByRepetition() {
    const position = JSON.stringify(this.gameState);
    return (
      this.occuredPositions[position] && this.occuredPositions[position] >= 2
    );
  }

  is50MoveRule() {
    return this.turnsSinceLastEvent >= 99;
  }

  checkEnd(nextPlayer, move) {
    if (this.isCheckmate(nextPlayer)) {
      console.log("checkmate");
      this.active = false;
      setTimeout(() => {
        alert(`Checkmate! ${nextPlayer === "white" ? "Black" : "White"} wins!`);
      }, 50);
    } else if (this.isStalemate(nextPlayer)) {
      console.log("stalemate");
      this.active = false;
      setTimeout(() => {
        alert("Stalemate! It is a draw!");
      }, 50);
    } else {
      const isIrreversibleMove =
        this.pieces[move.piece] === "pawn" ||
        (move.capturedRow !== null && move.capturedCol !== null);
      if (isIrreversibleMove) {
        this.turnsSinceLastEvent = 0;
        this.occuredPositions = null;
        this.occuredPositions = {};
      } else {
        this.turnsSinceLastEvent++;
      }

      if (this.isDrawByRepetition()) {
        console.log("repetition");
        this.active = false;
        setTimeout(() => {
          alert("Draw by repetition!");
        }, 50);
      } else if (this.is50MoveRule()) {
        console.log("50 move rule");
        this.active = false;
        setTimeout(() => {
          alert("Draw by 50 move rule!");
        }, 50);
      }
      const position = JSON.stringify(this.gameState);
      this.occuredPositions[position] =
        (this.occuredPositions[position] || 0) + 1;
    }
  }

  areLegalMovesAvailable(color) {
    // Check for any legal moves.
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col);
        if (piece && this.getColor(piece) === color) {
          const legalMoves = this.getLegalMovesWithCheckFilter(row, col);
          // If a legal move is found, return true.
          if (legalMoves.length > 0) return true;
        }
      }
    }

    // If there is no legal moves, return false.
    return false;
  }

  evaluateBoard() {
    const pieceValues = {
      pawn: 100,
      knight: 320,
      bishop: 330,
      rook: 500,
      queen: 900,
      king: 100000,
    };

    const pawnTable = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [80, 80, 80, 80, 80, 80, 80, 80],
      [25, 25, 30, 40, 40, 30, 25, 25],
      [10, 10, 15, 35, 35, 15, 10, 10],
      [5, 5, 10, 25, 25, 10, 5, 5],
      [5, -5, -10, 0, 0, -10, -5, 5],
      [5, 10, 10, -20, -20, 10, 10, 5],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];

    const knightTable = [
      [-50, -40, -30, -30, -30, -30, -40, -50],
      [-40, -20, 0, 5, 5, 0, -20, -40],
      [-30, 5, 15, 20, 20, 15, 5, -30],
      [-30, 10, 20, 30, 30, 20, 10, -30],
      [-30, 5, 20, 25, 25, 20, 5, -30],
      [-30, 5, 15, 20, 20, 15, 5, -30],
      [-40, -20, 0, 5, 5, 0, -20, -40],
      [-50, -40, -30, -30, -30, -30, -40, -50],
    ];

    const bishopTable = [
      [-20, -10, -10, -10, -10, -10, -10, -20],
      [-10, 5, 0, 0, 0, 0, 5, -10],
      [-10, 10, 15, 15, 15, 15, 10, -10],
      [-10, 5, 10, 15, 15, 10, 5, -10],
      [-10, 0, 10, 15, 15, 10, 0, -10],
      [-10, 10, 10, 15, 15, 10, 10, -10],
      [-10, 5, 0, 0, 0, 0, 5, -10],
      [-20, -10, -10, -10, -10, -10, -10, -20],
    ];

    const rookTable = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [25, 25, 25, 25, 25, 25, 25, 25],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [5, 5, 5, 5, 5, 5, 5, 5],
      [10, 10, 10, 15, 15, 10, 10, 10],
    ];

    const queenTable = [
      [-20, -10, -10, -5, -5, -10, -10, -20],
      [-40, -30, -20, -15, -15, -20, -30, -40],
      [-30, -20, -10, -5, -5, -10, -20, -30],
      [-20, -10, 0, 5, 5, 0, -10, -20],
      [-10, -5, 5, 10, 10, 5, -5, -10],
      [-10, 0, 5, 10, 10, 5, 0, -10],
      [-20, -10, 0, 0, 0, 0, -10, -20],
      [-20, -10, -10, -5, -5, -10, -10, -20],
    ];

    const kingTable = [
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-20, -30, -30, -40, -40, -30, -30, -20],
      [-10, -20, -20, -20, -20, -20, -20, -10],
      [50, 50, 15, 5, 5, 15, 50, 50],
      [60, 80, 70, 10, 10, 20, 80, 60],
    ];

    let evaluation = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col);
        if (!piece) continue;
        const color = this.getColor(piece);
        const pieceType = this.pieces[piece];
        const pieceValue = pieceValues[pieceType];
        const legalMovesTotal = this.getLegalMoves(row, col).length;

        const accessRow = color === "white" ? row : 7 - row;
        const accessCol = color === "white" ? col : 7 - col;

        let positionValue = 0;
        if (pieceType === "pawn") {
          positionValue = pawnTable[accessRow][accessCol];
          let samePawnFile = false;
          for (let checkRow = 0; checkRow < 8; checkRow++) {
            if (checkRow !== row) {
              const piece = this.getPiece(checkRow, accessCol);
              if (
                piece &&
                this.pieces[piece] === "pawn" &&
                this.getColor(piece) === color
              ) {
                samePawnFile = true;
                break;
              }
            }
          }
          if (samePawnFile) positionValue -= 40;
        } else if (pieceType === "knight") {
          positionValue = knightTable[accessRow][accessCol];
        } else if (pieceType === "bishop") {
          positionValue = bishopTable[accessRow][accessCol];
        } else if (pieceType === "rook") {
          positionValue = rookTable[accessRow][accessCol];
        } else if (pieceType === "queen") {
          positionValue = queenTable[accessRow][accessCol];
        } else if (pieceType === "king") {
          positionValue = kingTable[accessRow][accessCol];
          if (legalMovesTotal < 3) positionValue += 120;
        }

        let movesValue = 0;
        switch (pieceType) {
          case "pawn":
            movesValue = legalMovesTotal * 8;
            break;
          case "knight":
            movesValue = legalMovesTotal * 15;
            break;
          case "bishop":
            movesValue = legalMovesTotal * 12;
            break;
          case "rook":
            movesValue = legalMovesTotal * 10;
            break;
          case "queen":
            movesValue = legalMovesTotal * 6;
            break;
          case "king":
            movesValue = legalMovesTotal * 25;
            break;
        }

        if (color === "white") {
          evaluation += pieceValue;
          evaluation += positionValue;
          evaluation += movesValue;
          if (
            this.gameState.castleWhiteKingside ||
            this.gameState.castleWhiteQueenside
          )
            evaluation += 50;
        } else {
          evaluation -= pieceValue;
          evaluation -= positionValue;
          evaluation -= movesValue;
          if (
            this.gameState.castleBlackKingside ||
            this.gameState.castleBlackQueenside
          )
            evaluation -= 50;
        }
      }
    }
    if (this.isInCheck("white")) evaluation -= 75;
    if (this.isInCheck("black")) evaluation += 75;
    if (this.isCheckmate("white")) evaluation -= 1000000000;
    if (this.isCheckmate("black")) evaluation += 1000000000;

    if (this.isStalemate("white")) evaluation = 0;
    if (this.isStalemate("black")) evaluation = 0;
    if (this.isDrawByRepetition()) evaluation = 0;
    if (this.is50MoveRule()) evaluation = 0;
    // Slightly randomise evaluation.
    evaluation += Math.random() - 0.5;
    return evaluation;
  }

  generateAiMove(color) {
    return this.findBestMove(color);
  }

  generateAllMoves(color) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col);
        const pieceColor = this.getColor(piece);
        if (pieceColor === color) {
          moves.push(...this.getLegalMovesWithCheckFilter(row, col));
        }
      }
    }
    return moves;
  }

  findBestMove(color) {
    const allPossibleMoves = this.generateAllMoves(color);

    if (allPossibleMoves.length === 0) return null;

    // White optimises for high eval, black for low
    let bestEvaluation = color === "white" ? -Infinity : Infinity;
    let bestMove = null;

    const opponentColor = color === "white" ? "black" : "white";

    for (const move of allPossibleMoves) {
      const tempGameState = structuredClone(this.gameState);
      this.makeMove(move);

      const opponentMoves = this.generateAllMoves(opponentColor);

      if (opponentMoves.length === 0) {
        const evaluation = this.evaluateBoard();
        if (
          (color === "white" && evaluation > bestEvaluation) ||
          (color === "black" && evaluation < bestEvaluation)
        ) {
          bestEvaluation = evaluation;
          bestMove = move;
        }
      } else {
        let bestOpponentEvaluation =
          opponentColor === "white" ? -Infinity : Infinity;

        for (const opponentMove of opponentMoves) {
          const afterAIMoveState = structuredClone(this.gameState);
          this.makeMove(opponentMove);
          const evaluation = this.evaluateBoard();

          if (
            (opponentColor === "white" &&
              evaluation > bestOpponentEvaluation) ||
            (opponentColor === "black" && evaluation < bestOpponentEvaluation)
          ) {
            bestOpponentEvaluation = evaluation;
          }

          this.gameState = afterAIMoveState;
        }

        if (
          (color === "white" && bestOpponentEvaluation > bestEvaluation) ||
          (color === "black" && bestOpponentEvaluation < bestEvaluation)
        ) {
          bestEvaluation = bestOpponentEvaluation;
          bestMove = move;
        }
      }

      this.gameState = tempGameState;
    }
    return bestMove;
  }

  findKingPosition(color) {
    const piece = color === "white" ? "♔" : "♚";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.getPiece(row, col) === piece) {
          return { row, col };
        }
      }
    }
    return null;
  }

  isUnderAttack(targetRow, targetCol, byColor) {
    // Generate all possible moves and see if they can move to the square.
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = this.getPiece(fromRow, fromCol);
        if (piece && this.getColor(piece) === byColor) {
          const moves = this.getLegalMoves(fromRow, fromCol);
          for (const move of moves) {
            if (move.toRow === targetRow && move.toCol === targetCol) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  canCastle(color, side) {
    const row = color === "white" ? 7 : 0;
    const kingCol = 4;

    if (
      this.isSquareAttackedForCastling(
        row,
        kingCol,
        color === "white" ? "black" : "white",
      )
    ) {
      return false;
    }

    if (side === "kingside") {
      if (!this.isEmpty(row, 5) || !this.isEmpty(row, 6)) {
        return false;
      }

      // Check if squares the king passes through are under attack
      if (
        this.isSquareAttackedForCastling(
          row,
          5,
          color === "white" ? "black" : "white",
        ) ||
        this.isSquareAttackedForCastling(
          row,
          6,
          color === "white" ? "black" : "white",
        )
      ) {
        return false;
      }
    } else {
      // queenside
      if (
        !this.isEmpty(row, 3) ||
        !this.isEmpty(row, 2) ||
        !this.isEmpty(row, 1)
      ) {
        return false;
      }

      // Check if squares the king passes through are under attack
      if (
        this.isSquareAttackedForCastling(
          row,
          3,
          color === "white" ? "black" : "white",
        ) ||
        this.isSquareAttackedForCastling(
          row,
          2,
          color === "white" ? "black" : "white",
        )
      ) {
        return false;
      }
    }

    if (
      color === "white" &&
      side === "kingside" &&
      this.gameState.castleWhiteKingside
    ) {
      return true;
    }
    if (
      color === "white" &&
      side === "queenside" &&
      this.gameState.castleWhiteQueenside
    ) {
      return true;
    }
    if (
      color === "black" &&
      side === "kingside" &&
      this.gameState.castleBlackKingside
    ) {
      return true;
    }
    if (
      color === "black" &&
      side === "queenside" &&
      this.gameState.castleBlackQueenside
    ) {
      return true;
    }

    return false;
  }

  isSquareAttackedForCastling(targetRow, targetCol, byColor) {
    // Check attacks from pawns
    const pawnDirection = byColor === "white" ? -1 : 1;
    const pawnAttackCols = [targetCol - 1, targetCol + 1];
    const pawnPiece = byColor === "white" ? "♙" : "♟";

    for (const col of pawnAttackCols) {
      const row = targetRow + pawnDirection;
      if (this.isInbounds(row, col) && this.getPiece(row, col) === pawnPiece) {
        return true;
      }
    }

    // Check attacks from knights
    const knightMoves = [
      { drow: -2, dcol: -1 },
      { drow: -2, dcol: 1 },
      { drow: 2, dcol: -1 },
      { drow: 2, dcol: 1 },
      { drow: -1, dcol: -2 },
      { drow: 1, dcol: -2 },
      { drow: -1, dcol: 2 },
      { drow: 1, dcol: 2 },
    ];

    const knightPiece = byColor === "white" ? "♘" : "♞";
    for (const move of knightMoves) {
      const row = targetRow + move.drow;
      const col = targetCol + move.dcol;
      if (
        this.isInbounds(row, col) &&
        this.getPiece(row, col) === knightPiece
      ) {
        return true;
      }
    }

    // Check attacks from bishops, queens (diagonal)
    const bishopDirections = [
      { drow: 1, dcol: 1 },
      { drow: 1, dcol: -1 },
      { drow: -1, dcol: 1 },
      { drow: -1, dcol: -1 },
    ];

    const bishopPiece = byColor === "white" ? "♗" : "♝";
    const queenPiece = byColor === "white" ? "♕" : "♛";

    for (const dir of bishopDirections) {
      let row = targetRow + dir.drow;
      let col = targetCol + dir.dcol;
      while (this.isInbounds(row, col)) {
        const piece = this.getPiece(row, col);
        if (piece !== null) {
          if (piece === bishopPiece || piece === queenPiece) {
            return true;
          }
          break; // Blocked by another piece
        }
        row += dir.drow;
        col += dir.dcol;
      }
    }

    // Check attacks from rooks, queens (orthogonal)
    const rookDirections = [
      { drow: 0, dcol: 1 },
      { drow: 0, dcol: -1 },
      { drow: 1, dcol: 0 },
      { drow: -1, dcol: 0 },
    ];

    const rookPiece = byColor === "white" ? "♖" : "♜";

    for (const dir of rookDirections) {
      let row = targetRow + dir.drow;
      let col = targetCol + dir.dcol;
      while (this.isInbounds(row, col)) {
        const piece = this.getPiece(row, col);
        if (piece !== null) {
          if (piece === rookPiece || piece === queenPiece) {
            return true;
          }
          break; // Blocked by another piece
        }
        row += dir.drow;
        col += dir.dcol;
      }
    }

    // Check king attacks
    const kingMoves = [
      { drow: -1, dcol: -1 },
      { drow: -1, dcol: 0 },
      { drow: -1, dcol: 1 },
      { drow: 0, dcol: -1 },
      { drow: 0, dcol: 1 },
      { drow: 1, dcol: -1 },
      { drow: 1, dcol: 0 },
      { drow: 1, dcol: 1 },
    ];

    const kingPiece = byColor === "white" ? "♔" : "♚";
    for (const move of kingMoves) {
      const row = targetRow + move.drow;
      const col = targetCol + move.dcol;
      if (this.isInbounds(row, col) && this.getPiece(row, col) === kingPiece) {
        return true;
      }
    }

    return false;
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

let chessGame = new ChessGame(document.querySelector("#two-player").checked);
console.log(chessGame);

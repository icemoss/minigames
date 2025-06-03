export class ChessUI {
  constructor(boardElement) {
    this.board = boardElement;
    this.selectedPiece = null;
    this.lastMove = null;
  }

  /**
   * Renders the chess board
   */
  renderBoard(gameState, highlightedMoves = []) {
    this.board.innerHTML = "";

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = this.createSquare(
          row,
          col,
          gameState.boardState[row][col],
        );

        // Highlight selected piece
        if (
          this.selectedPiece &&
          this.selectedPiece.row === row &&
          this.selectedPiece.col === col
        ) {
          square.classList.add("selected");
        }

        // Highlight last move
        if (
          this.lastMove &&
          ((this.lastMove.fromRow === row && this.lastMove.fromCol === col) ||
            (this.lastMove.toRow === row && this.lastMove.toCol === col))
        ) {
          square.classList.add("last-move");
        }

        // Highlight possible moves
        if (
          highlightedMoves.some(
            (move) => move.toRow === row && move.toCol === col,
          )
        ) {
          square.classList.add("possible-move");
        }

        this.board.appendChild(square);
      }
    }
  }

  /**
   * Creates a single square element
   */
  createSquare(row, col, piece) {
    const square = document.createElement("div");
    square.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}`;
    square.dataset.row = row;
    square.dataset.col = col;

    if (piece) {
      square.textContent = piece;
      square.classList.add("piece");
    }

    return square;
  }

  /**
   * Sets up event listeners for the board
   */
  addEventListeners(onSquareClick) {
    this.board.addEventListener("click", (event) => {
      const square = event.target.closest(".square");
      if (square) {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        onSquareClick(row, col);
      }
    });
  }

  /**
   * Sets the selected piece
   */
  setSelectedPiece(row, col) {
    this.selectedPiece = { row, col };
  }

  /**
   * Clears the selected piece
   */
  clearSelection() {
    this.selectedPiece = null;
  }

  /**
   * Sets the last move for highlighting
   */
  setLastMove(move) {
    this.lastMove = move;
  }

  /**
   * Shows a game message (checkmate, stalemate, etc.)
   */
  showMessage(message) {
    // Simple alert for now - could be enhanced with a modal
    alert(message);
  }

  /**
   * Updates the turn indicator
   */
  updateTurnIndicator(currentPlayer) {
    // Could add a turn indicator element to the UI
    console.log(`Current turn: ${currentPlayer}`);
  }
}

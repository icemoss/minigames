import { ChessGame } from "./ChessGame.js";

// Initialize the game when DOM is loaded
let chessGame;

function initializeGame() {
  const boardElement = document.querySelector("#board");
  const twoPlayerCheckbox = document.querySelector("#two-player");
  const resetButton = document.querySelector("#reset");

  chessGame = new ChessGame(boardElement, twoPlayerCheckbox.checked);

  // Event listeners
  resetButton.addEventListener("click", () => chessGame.reset());
  twoPlayerCheckbox.addEventListener("change", (e) => {
    chessGame.setTwoPlayerMode(e.target.checked);
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeGame);
} else {
  initializeGame();
}

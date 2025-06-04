import { ChessGame } from "./ChessGame.js";

function initializeGame() {
  const boardElement = document.querySelector("#board");
  const twoPlayerCheckbox = document.querySelector("#two-player");
  const resetButton = document.querySelector("#reset");

  let chessGame = new ChessGame(boardElement, twoPlayerCheckbox.checked);

  // Event listeners
  resetButton.addEventListener("click", () => chessGame.reset());
  twoPlayerCheckbox.addEventListener("change", (e) => {
    chessGame.setTwoPlayerMode(e.target.checked);
  });
}

initializeGame();

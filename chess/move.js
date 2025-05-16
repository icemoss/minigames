export class Move {
  constructor(fromRow, fromCol, toRow, toCol, piece, options = {}) {
    this.fromRow = fromRow;
    this.fromCol = fromCol;
    this.toRow = toRow;
    this.toCol = toCol;
    this.piece = piece;
    this.capturedRow = options.capturedRow ?? null;
    this.capturedCol = options.capturedCol ?? null;
    this.doublePawnMove = options.doublePawnMove ?? null;
    this.castling = options.castling ?? null; // { fromRow, fromCol, toRow, toCol, piece }
  }
}

"use strict";

// Piece mappings
export const WHITE_PIECES = new Set(["♔", "♕", "♖", "♗", "♘", "♙"]);
export const BLACK_PIECES = new Set(["♚", "♛", "♜", "♝", "♞", "♟"]);

export const PIECES = {
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

// Initial board setup
export const INITIAL_BOARD = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"], // black pieces
  ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"], // black pawns
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"], // white pawns
  ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"], // white pieces
];

// Piece values for evaluation
export const PIECE_VALUES = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 100000,
};

// Piece-square tables for positional evaluation
export const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [80, 80, 80, 80, 80, 80, 80, 80],
  [25, 25, 30, 40, 40, 30, 25, 25],
  [10, 10, 15, 35, 35, 15, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

export const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 10, 20, 30, 30, 20, 10, -30],
  [-30, 5, 20, 25, 25, 20, 5, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

export const BISHOP_TABLE = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-10, 10, 15, 15, 15, 15, 10, -10],
  [-10, 5, 10, 15, 15, 10, 5, -10],
  [-10, 0, 10, 15, 15, 10, 0, -10],
  [-10, 10, 10, 15, 15, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

export const ROOK_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [25, 25, 25, 25, 25, 25, 25, 25],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 5, 5, 5, 5, 5, 5, 5],
  [10, 10, 10, 15, 15, 10, 10, 10],
];

export const QUEEN_TABLE = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-40, -30, -20, -15, -15, -20, -30, -40],
  [-30, -20, -10, -5, -5, -10, -20, -30],
  [-20, -10, 0, 5, 5, 0, -10, -20],
  [-10, -5, 5, 10, 10, 5, -5, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-20, -10, 0, 0, 0, 0, -10, -20],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

export const KING_TABLE = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [50, 50, 15, 5, 5, 15, 50, 50],
  [60, 80, 70, 10, 10, 20, 80, 60],
];

// Piece-square table lookup
export const PIECE_SQUARE_TABLES = {
  pawn: PAWN_TABLE,
  knight: KNIGHT_TABLE,
  bishop: BISHOP_TABLE,
  rook: ROOK_TABLE,
  queen: QUEEN_TABLE,
  king: KING_TABLE,
};

// Mobility bonuses (points per legal move)
export const MOBILITY_BONUSES = {
  pawn: 8,
  knight: 15,
  bishop: 12,
  rook: 10,
  queen: 6,
  king: 25,
};

// Game constants
export const CHECKMATE_VALUE = 1000000000;
export const CHECK_PENALTY = 75;
export const CASTLING_BONUS = 50;
export const DOUBLED_PAWN_PENALTY = 40;
export const KING_SAFETY_BONUS = 120;
export const RANDOMIZATION_FACTOR = 1;

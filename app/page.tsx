"use client";

import { useMemo, useState } from "react";

type Disc = "B" | "W";
type Cell = Disc | null;
type Position = [number, number];

const BOARD_SIZE = 8;
const DIRECTIONS: Position[] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const initialBoard = (): Cell[][] => {
  const board = Array.from({ length: BOARD_SIZE }, () =>
    Array<Cell>(BOARD_SIZE).fill(null),
  );

  board[3][3] = "W";
  board[3][4] = "B";
  board[4][3] = "B";
  board[4][4] = "W";

  return board;
};

const inBounds = (row: number, col: number) =>
  row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

const oppositeDisc = (disc: Disc): Disc => (disc === "B" ? "W" : "B");

const getFlips = (
  board: Cell[][],
  row: number,
  col: number,
  player: Disc,
): Position[] => {
  if (board[row][col] !== null) {
    return [];
  }

  const opponent = oppositeDisc(player);
  const allFlips: Position[] = [];

  for (const [dr, dc] of DIRECTIONS) {
    let r = row + dr;
    let c = col + dc;
    const flipsInDirection: Position[] = [];

    while (inBounds(r, c) && board[r][c] === opponent) {
      flipsInDirection.push([r, c]);
      r += dr;
      c += dc;
    }

    if (inBounds(r, c) && board[r][c] === player && flipsInDirection.length > 0) {
      allFlips.push(...flipsInDirection);
    }
  }

  return allFlips;
};

const getValidMoves = (board: Cell[][], player: Disc): Position[] => {
  const moves: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (getFlips(board, row, col, player).length > 0) {
        moves.push([row, col]);
      }
    }
  }

  return moves;
};

const applyMove = (board: Cell[][], row: number, col: number, player: Disc): Cell[][] => {
  const flips = getFlips(board, row, col, player);

  if (flips.length === 0) {
    return board;
  }

  const nextBoard = board.map((line) => [...line]);
  nextBoard[row][col] = player;

  for (const [r, c] of flips) {
    nextBoard[r][c] = player;
  }

  return nextBoard;
};

const countDiscs = (board: Cell[][]) => {
  let black = 0;
  let white = 0;

  for (const row of board) {
    for (const cell of row) {
      if (cell === "B") {
        black += 1;
      } else if (cell === "W") {
        white += 1;
      }
    }
  }

  return { black, white };
};

export default function Home() {
  const [board, setBoard] = useState<Cell[][]>(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Disc>("B");
  const [status, setStatus] = useState("黒の手番です");
  const [gameOver, setGameOver] = useState(false);

  const validMoves = useMemo(
    () => new Set(getValidMoves(board, currentPlayer).map(([r, c]) => `${r}-${c}`)),
    [board, currentPlayer],
  );

  const score = useMemo(() => countDiscs(board), [board]);

  const finishGame = (targetBoard: Cell[][], reason: string) => {
    const { black, white } = countDiscs(targetBoard);
    let result = "引き分けです。";

    if (black > white) {
      result = "黒の勝ちです。";
    } else if (white > black) {
      result = "白の勝ちです。";
    }

    setGameOver(true);
    setStatus(`${reason} ${result}`);
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameOver) {
      return;
    }

    const key = `${row}-${col}`;
    if (!validMoves.has(key)) {
      return;
    }

    const placedBoard = applyMove(board, row, col, currentPlayer);
    const nextPlayer = oppositeDisc(currentPlayer);
    const nextMoves = getValidMoves(placedBoard, nextPlayer);

    if (nextMoves.length > 0) {
      setBoard(placedBoard);
      setCurrentPlayer(nextPlayer);
      setStatus(nextPlayer === "B" ? "黒の手番です" : "白の手番です");
      return;
    }

    const currentMovesAfterPass = getValidMoves(placedBoard, currentPlayer);

    if (currentMovesAfterPass.length > 0) {
      setBoard(placedBoard);
      setCurrentPlayer(currentPlayer);
      setStatus(
        `${nextPlayer === "B" ? "黒" : "白"}は置ける場所がないためパス。${
          currentPlayer === "B" ? "黒" : "白"
        }の手番です`,
      );
      return;
    }

    setBoard(placedBoard);
    finishGame(placedBoard, "両者とも置ける場所がありません。");
  };

  const handleReset = () => {
    setBoard(initialBoard());
    setCurrentPlayer("B");
    setStatus("黒の手番です");
    setGameOver(false);
  };

  return (
    <main className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
        <h1 className="text-3xl font-bold">オセロ</h1>
        <p className="text-center text-sm text-slate-200">{status}</p>

        <div className="flex gap-6 text-sm">
          <p>● 黒: {score.black}</p>
          <p>○ 白: {score.white}</p>
        </div>

        <div className="grid grid-cols-8 gap-1 rounded-lg bg-emerald-950 p-2 shadow-lg">
          {board.map((line, row) =>
            line.map((cell, col) => {
              const isValidMove = validMoves.has(`${row}-${col}`);

              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  onClick={() => handleCellClick(row, col)}
                  className="flex h-12 w-12 items-center justify-center bg-emerald-700 transition hover:bg-emerald-600"
                >
                  {cell && (
                    <span
                      className={`h-9 w-9 rounded-full ${
                        cell === "B" ? "bg-black" : "bg-white"
                      }`}
                    />
                  )}
                  {!cell && isValidMove && (
                    <span className="h-3 w-3 rounded-full bg-emerald-200/80" />
                  )}
                </button>
              );
            }),
          )}
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="rounded-md bg-slate-100 px-4 py-2 text-slate-900 transition hover:bg-white"
        >
          リセット
        </button>
      </div>
    </main>
  );
}

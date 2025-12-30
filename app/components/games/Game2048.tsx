"use client";

import { useState, useEffect, useCallback } from "react";

type Grid = (number | null)[][];

const GRID_SIZE = 4;

const getRandomEmptyCell = (grid: Grid): { row: number; col: number } | null => {
  const emptyCells: { row: number; col: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};

const addRandomTile = (grid: Grid): Grid => {
  const newGrid = grid.map(row => [...row]);
  const cell = getRandomEmptyCell(newGrid);
  if (cell) {
    newGrid[cell.row][cell.col] = Math.random() < 0.9 ? 2 : 4;
  }
  return newGrid;
};

const createInitialGrid = (): Grid => {
  let grid: Grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
};

const getTileColor = (value: number | null): string => {
  switch (value) {
    case 2: return "bg-amber-100 text-gray-800";
    case 4: return "bg-amber-200 text-gray-800";
    case 8: return "bg-orange-300 text-white";
    case 16: return "bg-orange-400 text-white";
    case 32: return "bg-orange-500 text-white";
    case 64: return "bg-red-500 text-white";
    case 128: return "bg-yellow-400 text-white";
    case 256: return "bg-yellow-500 text-white";
    case 512: return "bg-yellow-600 text-white";
    case 1024: return "bg-yellow-700 text-white";
    case 2048: return "bg-yellow-300 text-gray-800 animate-pulse";
    default: return value && value > 2048 ? "bg-purple-600 text-white" : "bg-gray-300/20";
  }
};

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>(createInitialGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [moved, setMoved] = useState(false);

  const checkGameOver = useCallback((grid: Grid): boolean => {
    // Check for empty cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === null) return false;
      }
    }
    // Check for possible merges
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = grid[r][c];
        if (r < GRID_SIZE - 1 && grid[r + 1][c] === val) return false;
        if (c < GRID_SIZE - 1 && grid[r][c + 1] === val) return false;
      }
    }
    return true;
  }, []);

  const move = useCallback((direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;

    let newGrid = grid.map(row => [...row]);
    let newScore = score;
    let didMove = false;

    const processLine = (line: (number | null)[]): (number | null)[] => {
      // Remove nulls
      let tiles = line.filter(t => t !== null) as number[];
      // Merge
      const result: (number | null)[] = [];
      let i = 0;
      while (i < tiles.length) {
        if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
          const merged = tiles[i] * 2;
          result.push(merged);
          newScore += merged;
          if (merged === 2048 && !won) setWon(true);
          i += 2;
          didMove = true;
        } else {
          result.push(tiles[i]);
          i += 1;
        }
      }
      // Pad with nulls
      while (result.length < GRID_SIZE) result.push(null);
      return result;
    };

    if (direction === "left") {
      for (let r = 0; r < GRID_SIZE; r++) {
        const original = [...newGrid[r]];
        const processed = processLine(newGrid[r]);
        newGrid[r] = processed;
        if (JSON.stringify(original) !== JSON.stringify(processed)) didMove = true;
      }
    } else if (direction === "right") {
      for (let r = 0; r < GRID_SIZE; r++) {
        const original = [...newGrid[r]];
        const processed = processLine([...newGrid[r]].reverse()).reverse();
        newGrid[r] = processed;
        if (JSON.stringify(original) !== JSON.stringify(processed)) didMove = true;
      }
    } else if (direction === "up") {
      for (let c = 0; c < GRID_SIZE; c++) {
        const column = newGrid.map(row => row[c]);
        const original = [...column];
        const processed = processLine(column);
        for (let r = 0; r < GRID_SIZE; r++) {
          newGrid[r][c] = processed[r];
        }
        if (JSON.stringify(original) !== JSON.stringify(processed)) didMove = true;
      }
    } else if (direction === "down") {
      for (let c = 0; c < GRID_SIZE; c++) {
        const column = newGrid.map(row => row[c]);
        const original = [...column];
        const processed = processLine([...column].reverse()).reverse();
        for (let r = 0; r < GRID_SIZE; r++) {
          newGrid[r][c] = processed[r];
        }
        if (JSON.stringify(original) !== JSON.stringify(processed)) didMove = true;
      }
    }

    if (didMove) {
      newGrid = addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      setBestScore(b => Math.max(b, newScore));
      setMoved(true);
      setTimeout(() => setMoved(false), 100);

      if (checkGameOver(newGrid)) {
        setGameOver(true);
      }
    }
  }, [grid, score, gameOver, won, checkGameOver]);

  const resetGame = () => {
    setGrid(createInitialGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)) {
        e.preventDefault();
        switch (e.key) {
          case "ArrowUp":
          case "w":
            move("up");
            break;
          case "ArrowDown":
          case "s":
            move("down");
            break;
          case "ArrowLeft":
          case "a":
            move("left");
            break;
          case "ArrowRight":
          case "d":
            move("right");
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  // Touch controls
  const touchStartRef = { x: 0, y: 0 };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.x = e.touches[0].clientX;
    touchStartRef.y = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartRef.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.y;
    const minSwipe = 30;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipe) {
        move(dx > 0 ? "right" : "left");
      }
    } else {
      if (Math.abs(dy) > minSwipe) {
        move(dy > 0 ? "down" : "up");
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="flex justify-between items-center w-full max-w-[320px] mb-4">
        <div className="text-4xl font-black text-yellow-400">2048</div>
        <div className="flex gap-2">
          <div className="bg-amber-700 rounded-lg px-3 py-1 text-center">
            <div className="text-xs text-amber-300">SCORE</div>
            <div className="text-lg font-bold text-white">{score}</div>
          </div>
          <div className="bg-amber-700 rounded-lg px-3 py-1 text-center">
            <div className="text-xs text-amber-300">BEST</div>
            <div className="text-lg font-bold text-white">{bestScore}</div>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div
        className={`relative bg-amber-800 rounded-xl p-3 ${moved ? "scale-[1.01]" : ""} transition-transform`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-4 gap-2">
          {grid.flat().map((value, index) => (
            <div
              key={index}
              className={`w-16 h-16 md:w-18 md:h-18 rounded-lg flex items-center justify-center font-bold transition-all duration-100 ${getTileColor(value)}`}
              style={{
                fontSize: value && value >= 1000 ? "1.2rem" : value && value >= 100 ? "1.5rem" : "1.8rem",
              }}
            >
              {value}
            </div>
          ))}
        </div>

        {/* Game Over / Won Overlay */}
        {(gameOver || won) && (
          <div className="absolute inset-0 bg-black/70 rounded-xl flex flex-col items-center justify-center">
            {won && !gameOver ? (
              <>
                <div className="text-5xl mb-2">🎉</div>
                <h2 className="text-2xl font-black text-yellow-400 mb-2">YOU WIN!</h2>
                <p className="text-gray-300 mb-4">You reached 2048!</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-2">😔</div>
                <h2 className="text-2xl font-black text-red-400 mb-2">GAME OVER</h2>
                <p className="text-xl text-white mb-4">Score: {score}</p>
              </>
            )}
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
            >
              🔄 Play Again
            </button>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div className="mt-4 text-center">
        <p className="text-white/60 text-sm mb-2">Use arrow keys or swipe to move tiles</p>
        <button
          onClick={resetGame}
          className="text-amber-400 hover:text-amber-300 text-sm underline"
        >
          New Game
        </button>
      </div>

      {/* Mobile Controls */}
      <div className="mt-4 md:hidden">
        <div className="flex justify-center mb-2">
          <button
            onClick={() => move("up")}
            className="bg-amber-600/50 hover:bg-amber-600/70 text-white text-2xl w-14 h-14 rounded-lg"
          >
            ⬆️
          </button>
        </div>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => move("left")}
            className="bg-amber-600/50 hover:bg-amber-600/70 text-white text-2xl w-14 h-14 rounded-lg"
          >
            ⬅️
          </button>
          <button
            onClick={() => move("down")}
            className="bg-amber-600/50 hover:bg-amber-600/70 text-white text-2xl w-14 h-14 rounded-lg"
          >
            ⬇️
          </button>
          <button
            onClick={() => move("right")}
            className="bg-amber-600/50 hover:bg-amber-600/70 text-white text-2xl w-14 h-14 rounded-lg"
          >
            ➡️
          </button>
        </div>
      </div>
    </div>
  );
}

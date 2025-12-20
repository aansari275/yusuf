"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 15;
const CELL_SIZE = 22;

export default function SnakeGame() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Position>({ x: 10, y: 7 });
  const [direction, setDirection] = useState<Position>({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [speed, setSpeed] = useState(150);
  const directionRef = useRef(direction);
  const gameLoopRef = useRef<NodeJS.Timeout>();

  const spawnFood = useCallback((snakeBody: Position[]) => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakeBody.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  const startGame = () => {
    const initialSnake = [{ x: 7, y: 7 }];
    setSnake(initialSnake);
    setFood(spawnFood(initialSnake));
    setDirection({ x: 1, y: 0 });
    directionRef.current = { x: 1, y: 0 };
    setScore(0);
    setLevel(1);
    setSpeed(150);
    setGameState("playing");
  };

  const changeDirection = useCallback((newDir: Position) => {
    // Prevent reversing
    if (
      (newDir.x !== 0 && newDir.x === -directionRef.current.x) ||
      (newDir.y !== 0 && newDir.y === -directionRef.current.y)
    ) {
      return;
    }
    directionRef.current = newDir;
    setDirection(newDir);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") {
        if (e.key === " ") startGame();
        return;
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
          changeDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
        case "s":
          changeDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
        case "a":
          changeDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
        case "d":
          changeDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, changeDirection]);

  useEffect(() => {
    if (gameState !== "playing") return;

    gameLoopRef.current = setInterval(() => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: (head.x + directionRef.current.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + directionRef.current.y + GRID_SIZE) % GRID_SIZE,
        };

        // Check self collision
        if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
          setGameState("gameover");
          setHighScore(h => Math.max(h, score));
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            if (newScore % 50 === 0) {
              setLevel(l => l + 1);
              setSpeed(sp => Math.max(sp - 10, 80));
            }
            return newScore;
          });
          setFood(spawnFood(newSnake));
          return newSnake;
        }

        // Remove tail
        newSnake.pop();
        return newSnake;
      });
    }, speed);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, food, speed, score, spawnFood]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[350px] mb-4 text-white">
        <div className="text-lg">🏆 Score: <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">⭐ Level: <span className="font-bold text-green-400">{level}</span></div>
        <div className="text-lg">👑 Best: <span className="font-bold text-purple-400">{highScore}</span></div>
      </div>

      <div
        className="relative bg-gray-900 rounded-xl border-4 border-green-500 overflow-hidden"
        style={{
          width: GRID_SIZE * CELL_SIZE + 8,
          height: GRID_SIZE * CELL_SIZE + 8,
        }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-1 grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          }}
        >
          {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => (
            <div
              key={i}
              className="border border-gray-800/30"
            />
          ))}
        </div>

        {/* Snake */}
        {snake.map((segment, index) => (
          <div
            key={index}
            className={`absolute rounded-sm transition-all duration-75 ${
              index === 0
                ? "bg-green-400 z-10"
                : "bg-green-500"
            }`}
            style={{
              left: segment.x * CELL_SIZE + 4,
              top: segment.y * CELL_SIZE + 4,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          >
            {index === 0 && (
              <div className="w-full h-full flex items-center justify-center text-xs">
                {direction.x === 1 ? "👉" : direction.x === -1 ? "👈" : direction.y === -1 ? "👆" : "👇"}
              </div>
            )}
          </div>
        ))}

        {/* Food */}
        <div
          className="absolute text-lg animate-pulse"
          style={{
            left: food.x * CELL_SIZE + 4,
            top: food.y * CELL_SIZE + 2,
            width: CELL_SIZE,
            height: CELL_SIZE,
          }}
        >
          🍎
        </div>

        {/* Menu/Game Over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20">
            {gameState === "menu" ? (
              <>
                <div className="text-5xl mb-4 animate-bounce">🐍</div>
                <h2 className="text-2xl font-black mb-2">SNAKE FEAST</h2>
                <p className="mb-4 text-gray-300 text-sm">Eat apples and grow!</p>
                <p className="text-xs mb-4">Arrow keys or WASD</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">💀</div>
                <h2 className="text-2xl font-black mb-2 text-red-400">GAME OVER</h2>
                <p className="text-xl mb-1">Score: {score}</p>
                <p className="text-sm text-yellow-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
            >
              {gameState === "menu" ? "🐍 PLAY" : "🔄 RETRY"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-4 md:hidden">
        <div className="flex justify-center mb-2">
          <button
            onClick={() => changeDirection({ x: 0, y: -1 })}
            className="bg-green-500/50 hover:bg-green-500/70 text-white text-2xl w-14 h-14 rounded-lg"
          >
            ⬆️
          </button>
        </div>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => changeDirection({ x: -1, y: 0 })}
            className="bg-green-500/50 hover:bg-green-500/70 text-white text-2xl w-14 h-14 rounded-lg"
          >
            ⬅️
          </button>
          <button
            onClick={() => changeDirection({ x: 0, y: 1 })}
            className="bg-green-500/50 hover:bg-green-500/70 text-white text-2xl w-14 h-14 rounded-lg"
          >
            ⬇️
          </button>
          <button
            onClick={() => changeDirection({ x: 1, y: 0 })}
            className="bg-green-500/50 hover:bg-green-500/70 text-white text-2xl w-14 h-14 rounded-lg"
          >
            ➡️
          </button>
        </div>
      </div>
    </div>
  );
}

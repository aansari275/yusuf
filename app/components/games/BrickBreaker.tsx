"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Brick {
  x: number;
  y: number;
  color: string;
  hits: number;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

const COLORS = [
  "from-red-500 to-red-600",
  "from-orange-500 to-orange-600",
  "from-yellow-500 to-yellow-600",
  "from-green-500 to-green-600",
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
];

export default function BrickBreaker() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover" | "victory">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [paddleX, setPaddleX] = useState(140);
  const [ball, setBall] = useState<Ball>({ x: 175, y: 400, dx: 4, dy: -4 });
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [isLaunched, setIsLaunched] = useState(false);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());

  const PADDLE_WIDTH = 70;
  const PADDLE_HEIGHT = 12;
  const BALL_SIZE = 12;
  const BRICK_WIDTH = 55;
  const BRICK_HEIGHT = 20;
  const BRICK_ROWS = 5;
  const BRICK_COLS = 6;

  const createBricks = useCallback((lvl: number) => {
    const newBricks: Brick[] = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: col * (BRICK_WIDTH + 4) + 10,
          y: row * (BRICK_HEIGHT + 4) + 40,
          color: COLORS[row % COLORS.length],
          hits: row < 2 && lvl > 1 ? 2 : 1, // Top rows need 2 hits on higher levels
        });
      }
    }
    return newBricks;
  }, []);

  const startGame = (newGame: boolean = true) => {
    if (newGame) {
      setScore(0);
      setLevel(1);
      setLives(3);
      setBricks(createBricks(1));
    }
    setPaddleX(140);
    setBall({ x: 175, y: 400, dx: 4 * (Math.random() > 0.5 ? 1 : -1), dy: -4 });
    setIsLaunched(false);
    setGameState("playing");
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
    setBricks(createBricks(level + 1));
    setPaddleX(140);
    setBall({ x: 175, y: 400, dx: (4 + level * 0.5) * (Math.random() > 0.5 ? 1 : -1), dy: -(4 + level * 0.5) });
    setIsLaunched(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === " ") {
        if (gameState === "playing" && !isLaunched) {
          setIsLaunched(true);
        } else if (gameState !== "playing") {
          startGame();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, isLaunched]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      // Paddle movement
      if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a")) {
        setPaddleX(x => Math.max(0, x - 10));
      }
      if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) {
        setPaddleX(x => Math.min(350 - PADDLE_WIDTH, x + 10));
      }

      if (!isLaunched) {
        // Ball follows paddle before launch
        setBall(b => ({ ...b, x: paddleX + PADDLE_WIDTH / 2 - BALL_SIZE / 2 }));
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      setBall(prevBall => {
        let { x, y, dx, dy } = prevBall;

        // Move ball
        x += dx;
        y += dy;

        // Wall collisions
        if (x <= 0 || x >= 350 - BALL_SIZE) {
          dx = -dx;
          x = x <= 0 ? 0 : 350 - BALL_SIZE;
        }
        if (y <= 0) {
          dy = -dy;
          y = 0;
        }

        // Paddle collision
        if (
          y + BALL_SIZE >= 420 &&
          y <= 420 + PADDLE_HEIGHT &&
          x + BALL_SIZE >= paddleX &&
          x <= paddleX + PADDLE_WIDTH
        ) {
          dy = -Math.abs(dy);
          // Add angle based on where ball hits paddle
          const hitPos = (x + BALL_SIZE / 2 - paddleX) / PADDLE_WIDTH;
          dx = (hitPos - 0.5) * 10;
          y = 420 - BALL_SIZE;
        }

        // Ball fell
        if (y > 500) {
          setLives(l => {
            if (l <= 1) {
              setGameState("gameover");
              setHighScore(h => Math.max(h, score));
              return 0;
            }
            return l - 1;
          });
          setIsLaunched(false);
          return { x: paddleX + PADDLE_WIDTH / 2, y: 400, dx: 4, dy: -4 };
        }

        // Brick collisions
        setBricks(prevBricks => {
          let bricksHit = false;
          const newBricks = prevBricks.map(brick => {
            if (
              x + BALL_SIZE > brick.x &&
              x < brick.x + BRICK_WIDTH &&
              y + BALL_SIZE > brick.y &&
              y < brick.y + BRICK_HEIGHT
            ) {
              if (!bricksHit) {
                dy = -dy;
                bricksHit = true;
              }
              const newHits = brick.hits - 1;
              if (newHits <= 0) {
                setScore(s => s + 10 * level);
                return null;
              }
              return { ...brick, hits: newHits };
            }
            return brick;
          }).filter((b): b is Brick => b !== null);

          // Check victory
          if (newBricks.length === 0) {
            if (level >= 5) {
              setGameState("victory");
              setHighScore(h => Math.max(h, score + 100));
            } else {
              nextLevel();
            }
          }

          return newBricks;
        });

        return { x, y, dx, dy };
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, paddleX, isLaunched, level, score]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[350px] mb-4 text-white">
        <div className="text-lg">🏆 Score: <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">❤️ Lives: <span className="font-bold text-red-400">{lives}</span></div>
        <div className="text-lg">⭐ Level: <span className="font-bold text-green-400">{level}</span></div>
      </div>

      <div
        className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden border-2 border-cyan-500"
        style={{ width: 350, height: 500 }}
      >
        {/* Bricks */}
        {bricks.map((brick, idx) => (
          <div
            key={idx}
            className={`absolute rounded bg-gradient-to-br ${brick.color} border border-white/20 flex items-center justify-center`}
            style={{
              left: brick.x,
              top: brick.y,
              width: BRICK_WIDTH,
              height: BRICK_HEIGHT,
            }}
          >
            {brick.hits > 1 && (
              <span className="text-white/80 text-xs font-bold">{brick.hits}</span>
            )}
          </div>
        ))}

        {/* Ball */}
        <div
          className="absolute bg-white rounded-full shadow-lg shadow-white/50"
          style={{
            left: ball.x,
            top: ball.y,
            width: BALL_SIZE,
            height: BALL_SIZE,
          }}
        />

        {/* Paddle */}
        <div
          className="absolute bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg"
          style={{
            left: paddleX,
            top: 420,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
          }}
        />

        {/* Launch prompt */}
        {!isLaunched && gameState === "playing" && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white text-center animate-pulse">
            <p className="font-bold">Press SPACE to launch!</p>
          </div>
        )}

        {/* Menu/Game Over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
            {gameState === "menu" && (
              <>
                <div className="text-6xl mb-4">🧱</div>
                <h2 className="text-3xl font-black mb-2">BRICK BREAKER</h2>
                <p className="mb-4 text-gray-300">Break all the bricks!</p>
                <p className="text-sm mb-4">← → to move, SPACE to launch</p>
              </>
            )}
            {gameState === "gameover" && (
              <>
                <div className="text-6xl mb-4">💔</div>
                <h2 className="text-3xl font-black mb-2 text-red-400">GAME OVER</h2>
                <p className="text-2xl mb-2">Score: {score}</p>
                <p className="text-lg text-yellow-400 mb-4">Best: {highScore}</p>
              </>
            )}
            {gameState === "victory" && (
              <>
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-black mb-2 text-yellow-400">YOU WIN!</h2>
                <p className="text-2xl mb-2">Score: {score + 100}</p>
                <p className="text-lg text-green-400 mb-4">All 5 levels complete!</p>
              </>
            )}
            <button
              onClick={() => startGame(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform"
            >
              {gameState === "menu" ? "🎮 PLAY" : "🔄 PLAY AGAIN"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-4 mt-4 md:hidden">
        <button
          onTouchStart={() => keysRef.current.add("ArrowLeft")}
          onTouchEnd={() => keysRef.current.delete("ArrowLeft")}
          className="bg-cyan-500/50 hover:bg-cyan-500/70 text-white text-2xl w-16 h-16 rounded-full"
        >
          ⬅️
        </button>
        <button
          onClick={() => setIsLaunched(true)}
          className="bg-yellow-500/50 hover:bg-yellow-500/70 text-white text-xl px-4 h-16 rounded-full font-bold"
        >
          Launch
        </button>
        <button
          onTouchStart={() => keysRef.current.add("ArrowRight")}
          onTouchEnd={() => keysRef.current.delete("ArrowRight")}
          className="bg-cyan-500/50 hover:bg-cyan-500/70 text-white text-2xl w-16 h-16 rounded-full"
        >
          ➡️
        </button>
      </div>
    </div>
  );
}

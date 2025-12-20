"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Obstacle {
  x: number;
  type: "cactus" | "bird";
  id: number;
}

export default function DinoRunner() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [dinoY, setDinoY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isDucking, setIsDucking] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [speed, setSpeed] = useState(8);
  const gameLoopRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const lastObstacleRef = useRef(0);
  const jumpVelocityRef = useRef(0);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLevel(1);
    setSpeed(8);
    setDinoY(0);
    setIsJumping(false);
    setIsDucking(false);
    setObstacles([]);
    obstacleIdRef.current = 0;
    lastObstacleRef.current = 0;
    jumpVelocityRef.current = 0;
  };

  const jump = useCallback(() => {
    if (gameState !== "playing" || isJumping || isDucking) return;
    setIsJumping(true);
    jumpVelocityRef.current = -18;
  }, [gameState, isJumping, isDucking]);

  const duck = useCallback((ducking: boolean) => {
    if (gameState !== "playing" || isJumping) return;
    setIsDucking(ducking);
  }, [gameState, isJumping]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        if (gameState === "playing") jump();
        else startGame();
      }
      if (e.key === "ArrowDown" || e.key === "s") {
        duck(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "s") {
        duck(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [jump, duck, gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      // Score
      setScore(prev => {
        const newScore = prev + 1;
        if (newScore % 500 === 0) {
          setLevel(l => l + 1);
          setSpeed(s => Math.min(s + 1, 18));
        }
        return newScore;
      });

      // Jump physics
      if (isJumping) {
        jumpVelocityRef.current += 1.2; // gravity
        setDinoY(y => {
          const newY = y + jumpVelocityRef.current;
          if (newY >= 0) {
            setIsJumping(false);
            jumpVelocityRef.current = 0;
            return 0;
          }
          return newY;
        });
      }

      // Spawn obstacles
      lastObstacleRef.current++;
      const spawnRate = Math.max(60 - level * 3, 30);
      if (lastObstacleRef.current > spawnRate + Math.random() * 30) {
        const type = Math.random() > 0.3 ? "cactus" : "bird";
        setObstacles(prev => [...prev, { x: 360, type, id: obstacleIdRef.current++ }]);
        lastObstacleRef.current = 0;
      }

      // Move obstacles and check collisions
      setObstacles(prev => {
        const newObstacles = prev
          .map(o => ({ ...o, x: o.x - speed }))
          .filter(o => o.x > -50);

        // Collision detection
        const dinoX = 50;
        const dinoWidth = 40;
        const dinoHeight = isDucking ? 30 : 60;
        const dinoTop = isDucking ? 30 : dinoY;

        for (const obs of newObstacles) {
          const obsWidth = obs.type === "cactus" ? 30 : 40;
          const obsHeight = obs.type === "cactus" ? 50 : 30;
          const obsY = obs.type === "cactus" ? 0 : -40;

          if (
            obs.x < dinoX + dinoWidth &&
            obs.x + obsWidth > dinoX &&
            dinoTop + dinoY < obsY + obsHeight &&
            dinoTop + dinoY + dinoHeight > obsY
          ) {
            setGameState("gameover");
            setHighScore(h => Math.max(h, score));
          }
        }

        return newObstacles;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, isJumping, isDucking, speed, level, score]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[350px] mb-4 text-white">
        <div className="text-lg">🏆 Score: <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">⭐ Level: <span className="font-bold text-green-400">{level}</span></div>
        <div className="text-lg">👑 Best: <span className="font-bold text-purple-400">{highScore}</span></div>
      </div>

      <div
        className="relative bg-gradient-to-b from-orange-200 via-orange-100 to-amber-200 rounded-xl overflow-hidden cursor-pointer"
        style={{ width: 350, height: 200 }}
        onClick={jump}
      >
        {/* Sun */}
        <div className="absolute top-4 right-8 text-4xl">☀️</div>

        {/* Clouds */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl opacity-60"
            style={{
              top: `${10 + i * 20}%`,
              left: `${(i * 40 + (gameState === "playing" ? Date.now() / 100 : 0)) % 400 - 50}px`,
            }}
          >
            ☁️
          </div>
        ))}

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-amber-600 to-amber-500">
          <div className="absolute top-1 left-0 right-0 h-1 bg-amber-700" />
        </div>

        {/* Ground details */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-2 w-1 h-2 bg-amber-700"
            style={{
              left: `${(i * 20 - (gameState === "playing" ? (Date.now() / 10 * speed / 10) % 400 : 0) + 400) % 400 - 20}px`,
            }}
          />
        ))}

        {/* Obstacles */}
        {obstacles.map(obs => (
          <div
            key={obs.id}
            className="absolute text-4xl"
            style={{
              left: obs.x,
              bottom: obs.type === "cactus" ? 32 : 70,
            }}
          >
            {obs.type === "cactus" ? "🌵" : "🦅"}
          </div>
        ))}

        {/* Dino */}
        <div
          className={`absolute text-5xl transition-transform duration-50 ${isDucking ? "scale-y-50" : ""}`}
          style={{
            left: 50,
            bottom: 32 - dinoY,
            transform: isDucking ? "scaleY(0.6) translateY(10px)" : undefined,
          }}
        >
          🦖
        </div>

        {/* Menu/Game Over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="text-5xl mb-2 animate-bounce">🦖</div>
                <h2 className="text-2xl font-black mb-1">DINO JUMP</h2>
                <p className="text-sm mb-2 text-gray-300">Jump over obstacles!</p>
                <p className="text-xs mb-2">↑ Jump, ↓ Duck</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-2">💥</div>
                <h2 className="text-2xl font-black mb-1 text-red-400">OUCH!</h2>
                <p className="text-lg">Score: {score}</p>
                <p className="text-sm text-yellow-400 mb-2">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
            >
              {gameState === "menu" ? "🏃 RUN!" : "🔄 RETRY"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-4 mt-4 md:hidden">
        <button
          onClick={jump}
          className="bg-green-500/50 hover:bg-green-500/70 text-white text-2xl px-8 py-4 rounded-full font-bold"
        >
          ⬆️ Jump
        </button>
        <button
          onTouchStart={() => duck(true)}
          onTouchEnd={() => duck(false)}
          className="bg-orange-500/50 hover:bg-orange-500/70 text-white text-2xl px-8 py-4 rounded-full font-bold"
        >
          ⬇️ Duck
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Pipe {
  x: number;
  gapY: number;
  id: number;
  passed: boolean;
}

export default function FlappyBird() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [birdY, setBirdY] = useState(200);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [rotation, setRotation] = useState(0);
  const gameLoopRef = useRef<number>();
  const pipeIdRef = useRef(0);
  const lastPipeRef = useRef(0);

  const gravity = 0.6;
  const jumpForce = -10;
  const gapSize = 160 - level * 5;

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLevel(1);
    setBirdY(200);
    setBirdVelocity(0);
    setPipes([]);
    setRotation(0);
    pipeIdRef.current = 0;
    lastPipeRef.current = 0;
  };

  const jump = useCallback(() => {
    if (gameState === "playing") {
      setBirdVelocity(jumpForce);
      setRotation(-20);
    } else {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      // Bird physics
      setBirdVelocity(v => v + gravity);
      setBirdY(y => {
        const newY = y + birdVelocity;
        if (newY > 450 || newY < 0) {
          setGameState("gameover");
          setHighScore(h => Math.max(h, score));
          return y;
        }
        return newY;
      });
      setRotation(r => Math.min(r + 2, 90));

      // Spawn pipes
      lastPipeRef.current++;
      if (lastPipeRef.current > 100) {
        const gapY = Math.random() * 200 + 100;
        setPipes(prev => [...prev, { x: 350, gapY, id: pipeIdRef.current++, passed: false }]);
        lastPipeRef.current = 0;
      }

      // Move pipes
      setPipes(prev => {
        const newPipes = prev
          .map(pipe => ({ ...pipe, x: pipe.x - 4 - level * 0.3 }))
          .filter(pipe => pipe.x > -60);

        // Check collisions and score
        const birdX = 80;
        const birdSize = 35;
        for (const pipe of newPipes) {
          // Score
          if (!pipe.passed && pipe.x < birdX) {
            pipe.passed = true;
            setScore(s => {
              const newScore = s + 1;
              if (newScore % 10 === 0) setLevel(l => Math.min(l + 1, 10));
              return newScore;
            });
          }

          // Collision
          if (pipe.x < birdX + birdSize && pipe.x + 50 > birdX) {
            if (birdY < pipe.gapY - gapSize / 2 || birdY + birdSize > pipe.gapY + gapSize / 2) {
              setGameState("gameover");
              setHighScore(h => Math.max(h, score));
            }
          }
        }

        return newPipes;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, birdVelocity, level, score, gapSize]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[350px] mb-4 text-white">
        <div className="text-lg">🏆 Score: <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">⭐ Level: <span className="font-bold text-green-400">{level}</span></div>
        <div className="text-lg">👑 Best: <span className="font-bold text-purple-400">{highScore}</span></div>
      </div>

      <div
        className="relative bg-gradient-to-b from-cyan-400 via-cyan-300 to-green-400 rounded-xl overflow-hidden cursor-pointer"
        style={{ width: 350, height: 500 }}
        onClick={jump}
      >
        {/* Clouds */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-70"
            style={{
              top: `${20 + i * 15}%`,
              left: `${(i * 30 + (gameState === "playing" ? Date.now() / 50 : 0)) % 400 - 50}px`,
            }}
          >
            ☁️
          </div>
        ))}

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-amber-600 to-green-500" />

        {/* Pipes */}
        {pipes.map(pipe => (
          <div key={pipe.id}>
            {/* Top pipe */}
            <div
              className="absolute bg-gradient-to-r from-green-600 to-green-500 border-4 border-green-700 rounded-b-lg"
              style={{
                left: pipe.x,
                top: 0,
                width: 50,
                height: pipe.gapY - gapSize / 2,
              }}
            />
            <div
              className="absolute bg-gradient-to-r from-green-700 to-green-600 rounded-lg"
              style={{
                left: pipe.x - 5,
                top: pipe.gapY - gapSize / 2 - 20,
                width: 60,
                height: 20,
              }}
            />
            {/* Bottom pipe */}
            <div
              className="absolute bg-gradient-to-r from-green-600 to-green-500 border-4 border-green-700 rounded-t-lg"
              style={{
                left: pipe.x,
                top: pipe.gapY + gapSize / 2,
                width: 50,
                height: 500 - (pipe.gapY + gapSize / 2),
              }}
            />
            <div
              className="absolute bg-gradient-to-r from-green-700 to-green-600 rounded-lg"
              style={{
                left: pipe.x - 5,
                top: pipe.gapY + gapSize / 2,
                width: 60,
                height: 20,
              }}
            />
          </div>
        ))}

        {/* Bird */}
        <div
          className="absolute text-4xl transition-transform"
          style={{
            left: 80,
            top: birdY,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          🐦
        </div>

        {/* Menu/Game Over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="text-6xl mb-4 animate-bounce">🐦</div>
                <h2 className="text-3xl font-black mb-2">FLAPPY YUSUF</h2>
                <p className="mb-4 text-gray-300">Tap or press SPACE to fly!</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">😵</div>
                <h2 className="text-3xl font-black mb-2 text-red-400">BONK!</h2>
                <p className="text-2xl mb-2">Score: {score}</p>
                <p className="text-lg text-yellow-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform"
            >
              {gameState === "menu" ? "🚀 FLY!" : "🔄 AGAIN"}
            </button>
          </div>
        )}
      </div>

      <p className="text-white/60 mt-4 text-center">Tap anywhere or press SPACE to fly!</p>
    </div>
  );
}

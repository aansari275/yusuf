"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Car {
  x: number;
  y: number;
  lane: number;
}

export default function RacingGame() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [playerLane, setPlayerLane] = useState(1);
  const [cars, setCars] = useState<Car[]>([]);
  const [speed, setSpeed] = useState(5);
  const gameLoopRef = useRef<number>();
  const lastCarRef = useRef(0);

  const lanes = [60, 150, 240];
  const carWidth = 50;
  const carHeight = 80;

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLevel(1);
    setSpeed(5);
    setPlayerLane(1);
    setCars([]);
    lastCarRef.current = 0;
  };

  const movePlayer = useCallback((direction: "left" | "right") => {
    if (gameState !== "playing") return;
    setPlayerLane(prev => {
      if (direction === "left" && prev > 0) return prev - 1;
      if (direction === "right" && prev < 2) return prev + 1;
      return prev;
    });
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") movePlayer("left");
      if (e.key === "ArrowRight" || e.key === "d") movePlayer("right");
      if (e.key === " " && gameState !== "playing") startGame();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer, gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      setScore(prev => {
        const newScore = prev + 1;
        if (newScore % 500 === 0) {
          setLevel(l => l + 1);
          setSpeed(s => Math.min(s + 1, 15));
        }
        return newScore;
      });

      // Spawn cars
      lastCarRef.current++;
      if (lastCarRef.current > 60 - level * 3) {
        const lane = Math.floor(Math.random() * 3);
        setCars(prev => [...prev, { x: lanes[lane], y: -carHeight, lane }]);
        lastCarRef.current = 0;
      }

      // Move cars
      setCars(prev => {
        const newCars = prev
          .map(car => ({ ...car, y: car.y + speed }))
          .filter(car => car.y < 500);

        // Collision detection
        const playerX = lanes[playerLane];
        const playerY = 380;
        for (const car of newCars) {
          if (
            car.y + carHeight > playerY &&
            car.y < playerY + carHeight &&
            car.x + carWidth > playerX &&
            car.x < playerX + carWidth
          ) {
            setGameState("gameover");
            setHighScore(h => Math.max(h, score));
            return newCars;
          }
        }
        return newCars;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, playerLane, speed, level, score, lanes]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[350px] mb-4 text-white">
        <div className="text-lg">🏆 Score: <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">⭐ Level: <span className="font-bold text-green-400">{level}</span></div>
      </div>

      <div
        className="relative bg-gray-700 rounded-xl overflow-hidden"
        style={{ width: 350, height: 500 }}
      >
        {/* Road markings */}
        <div className="absolute inset-0 flex justify-around">
          {[0, 1].map(i => (
            <div key={i} className="w-2 h-full bg-yellow-400 opacity-50" style={{ marginLeft: i === 0 ? 110 : 0 }} />
          ))}
        </div>

        {/* Road lines animation */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-4 h-16 bg-white/30 left-1/2 -translate-x-1/2"
              style={{
                top: `${(i * 60 + (gameState === "playing" ? (Date.now() / 10 * speed) % 60 : 0)) % 600 - 60}px`,
              }}
            />
          ))}
        </div>

        {/* Enemy cars */}
        {cars.map((car, i) => (
          <div
            key={i}
            className="absolute flex items-center justify-center"
            style={{
              left: car.x,
              top: car.y,
              width: carWidth,
              height: carHeight,
            }}
          >
            <div className="bg-red-500 rounded-lg w-12 h-16 flex items-center justify-center shadow-lg border-2 border-red-700">
              <span className="text-3xl" style={{ transform: 'rotate(180deg)' }}>🚗</span>
            </div>
          </div>
        ))}

        {/* Player car */}
        <div
          className="absolute flex items-center justify-center transition-all duration-100"
          style={{
            left: lanes[playerLane],
            top: 380,
            width: carWidth,
            height: carHeight,
          }}
        >
          <div className="bg-blue-500 rounded-lg w-12 h-16 flex items-center justify-center shadow-lg border-2 border-blue-700">
            <span className="text-3xl">🏎️</span>
          </div>
        </div>

        {/* Menu/Game Over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="text-6xl mb-4">🏎️</div>
                <h2 className="text-3xl font-black mb-2">SPEED RACER</h2>
                <p className="mb-4 text-gray-300">Dodge the cars!</p>
                <p className="text-sm mb-4">← → or A/D to move</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💥</div>
                <h2 className="text-3xl font-black mb-2 text-red-400">CRASH!</h2>
                <p className="text-2xl mb-2">Score: {score}</p>
                <p className="text-lg text-yellow-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform"
            >
              {gameState === "menu" ? "🚀 START" : "🔄 RETRY"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-4 mt-4 md:hidden">
        <button
          onTouchStart={() => movePlayer("left")}
          className="bg-white/20 hover:bg-white/30 text-white text-3xl w-20 h-20 rounded-full"
        >
          ⬅️
        </button>
        <button
          onTouchStart={() => movePlayer("right")}
          className="bg-white/20 hover:bg-white/30 text-white text-3xl w-20 h-20 rounded-full"
        >
          ➡️
        </button>
      </div>
    </div>
  );
}

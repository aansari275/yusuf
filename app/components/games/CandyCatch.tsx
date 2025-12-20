"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Candy {
  x: number;
  y: number;
  id: number;
  type: string;
  points: number;
  speed: number;
}

const candyTypes = [
  { emoji: "🍬", points: 10 },
  { emoji: "🍭", points: 15 },
  { emoji: "🍫", points: 25 }, // Yusuf's favorite!
  { emoji: "🍪", points: 10 },
  { emoji: "🧁", points: 20 },
  { emoji: "🍩", points: 15 },
  { emoji: "🎂", points: 30 },
];

const badItems = [
  { emoji: "🥦", points: -20 },
  { emoji: "🧅", points: -15 },
  { emoji: "💣", points: -50 },
];

export default function CandyCatch() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [playerX, setPlayerX] = useState(150);
  const [candies, setCandies] = useState<Candy[]>([]);
  const [caughtEffect, setCaughtEffect] = useState<{ x: number; y: number; text: string; good: boolean } | null>(null);
  const gameLoopRef = useRef<number>();
  const candyIdRef = useRef(0);
  const lastCandyRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLevel(1);
    setLives(3);
    setPlayerX(150);
    setCandies([]);
    candyIdRef.current = 0;
    lastCandyRef.current = 0;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === " " && gameState !== "playing") startGame();
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
  }, [gameState]);

  const movePlayer = useCallback((direction: "left" | "right") => {
    setPlayerX(x => {
      if (direction === "left") return Math.max(0, x - 20);
      return Math.min(300, x + 20);
    });
  }, []);

  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      // Player movement
      if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a")) {
        setPlayerX(x => Math.max(0, x - 8));
      }
      if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) {
        setPlayerX(x => Math.min(300, x + 8));
      }

      // Spawn candies
      lastCandyRef.current++;
      const spawnRate = Math.max(40 - level * 3, 15);
      if (lastCandyRef.current > spawnRate) {
        const isBad = Math.random() < 0.15 + level * 0.02;
        const typeList = isBad ? badItems : candyTypes;
        const type = typeList[Math.floor(Math.random() * typeList.length)];
        setCandies(prev => [...prev, {
          x: Math.random() * 310 + 20,
          y: -30,
          id: candyIdRef.current++,
          type: type.emoji,
          points: type.points,
          speed: 2 + Math.random() * 2 + level * 0.3,
        }]);
        lastCandyRef.current = 0;
      }

      // Move candies and check collisions
      setCandies(prev => {
        const basketY = 420;
        const basketWidth = 60;
        const newCandies: Candy[] = [];

        for (const candy of prev) {
          const newY = candy.y + candy.speed;

          // Check if caught
          if (
            newY > basketY - 20 &&
            newY < basketY + 40 &&
            candy.x > playerX - 10 &&
            candy.x < playerX + basketWidth + 10
          ) {
            // Caught!
            setScore(s => {
              const newScore = Math.max(0, s + candy.points);
              if (newScore >= level * 150) setLevel(l => l + 1);
              return newScore;
            });

            if (candy.points < 0) {
              setLives(l => {
                if (l <= 1) {
                  setGameState("gameover");
                  setHighScore(h => Math.max(h, score));
                  return 0;
                }
                return l - 1;
              });
            }

            setCaughtEffect({
              x: candy.x,
              y: basketY - 30,
              text: candy.points > 0 ? `+${candy.points}` : `${candy.points}`,
              good: candy.points > 0,
            });
            setTimeout(() => setCaughtEffect(null), 500);
            continue;
          }

          // Missed good candy
          if (newY > 520 && candy.points > 0) {
            // Lost a good candy
          }

          if (newY < 520) {
            newCandies.push({ ...candy, y: newY });
          }
        }

        return newCandies;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, playerX, level, score]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[350px] mb-4 text-white">
        <div className="text-lg">🏆 Score: <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">❤️ Lives: <span className="font-bold text-red-400">{lives}</span></div>
        <div className="text-lg">⭐ Level: <span className="font-bold text-green-400">{level}</span></div>
      </div>

      <div
        className="relative bg-gradient-to-b from-purple-400 via-pink-300 to-yellow-200 rounded-xl overflow-hidden"
        style={{ width: 350, height: 500 }}
      >
        {/* Decorative elements */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl opacity-30"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          >
            ✨
          </div>
        ))}

        {/* Level indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/50 px-4 py-1 rounded-full">
          <span className="font-bold text-purple-700">Level {level}</span>
        </div>

        {/* White chocolate bonus indicator */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 text-xs text-purple-600">
          🍫 White Chocolate = 25 pts!
        </div>

        {/* Candies */}
        {candies.map(candy => (
          <div
            key={candy.id}
            className="absolute text-3xl"
            style={{ left: candy.x - 15, top: candy.y }}
          >
            {candy.type}
          </div>
        ))}

        {/* Caught effect */}
        {caughtEffect && (
          <div
            className={`absolute font-black text-2xl animate-bounce ${caughtEffect.good ? "text-green-500" : "text-red-500"}`}
            style={{ left: caughtEffect.x - 20, top: caughtEffect.y }}
          >
            {caughtEffect.text}
          </div>
        )}

        {/* Player basket */}
        <div
          className="absolute text-5xl transition-all duration-50"
          style={{ left: playerX, top: 420 }}
        >
          🧺
        </div>

        {/* Menu/Game Over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="text-6xl mb-4 animate-bounce">🍬</div>
                <h2 className="text-3xl font-black mb-2">CANDY CATCH</h2>
                <p className="mb-2 text-gray-300">Catch the yummy candy!</p>
                <p className="text-sm mb-4 text-red-300">Avoid the veggies! 🥦</p>
                <p className="text-sm mb-4">← → or A/D to move</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🍭</div>
                <h2 className="text-3xl font-black mb-2 text-pink-400">GAME OVER</h2>
                <p className="text-2xl mb-2">Score: {score}</p>
                <p className="text-lg text-yellow-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform"
            >
              {gameState === "menu" ? "🍬 CATCH!" : "🔄 PLAY AGAIN"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-4 mt-4 md:hidden">
        <button
          onTouchStart={() => movePlayer("left")}
          className="bg-white/20 hover:bg-white/30 text-white text-3xl w-20 h-16 rounded-full"
        >
          ⬅️
        </button>
        <button
          onTouchStart={() => movePlayer("right")}
          className="bg-white/20 hover:bg-white/30 text-white text-3xl w-20 h-16 rounded-full"
        >
          ➡️
        </button>
      </div>
    </div>
  );
}

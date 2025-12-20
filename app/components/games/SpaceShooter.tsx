"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Bullet {
  x: number;
  y: number;
  id: number;
}

interface Alien {
  x: number;
  y: number;
  id: number;
  type: number;
}

export default function SpaceShooter() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [playerX, setPlayerX] = useState(160);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [aliens, setAliens] = useState<Alien[]>([]);
  const [lives, setLives] = useState(3);
  const gameLoopRef = useRef<number>();
  const bulletIdRef = useRef(0);
  const alienIdRef = useRef(0);
  const lastAlienRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());

  const alienEmojis = ["👾", "👽", "🛸", "🤖", "👹"];

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLevel(1);
    setLives(3);
    setPlayerX(160);
    setBullets([]);
    setAliens([]);
    bulletIdRef.current = 0;
    alienIdRef.current = 0;
    lastAlienRef.current = 0;
  };

  const shoot = useCallback(() => {
    if (gameState !== "playing") return;
    setBullets(prev => [...prev, { x: playerX + 15, y: 420, id: bulletIdRef.current++ }]);
  }, [gameState, playerX]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === " ") {
        e.preventDefault();
        if (gameState === "playing") shoot();
        else startGame();
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
  }, [shoot, gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      // Player movement
      if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a")) {
        setPlayerX(x => Math.max(0, x - 8));
      }
      if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) {
        setPlayerX(x => Math.min(310, x + 8));
      }

      // Spawn aliens
      lastAlienRef.current++;
      if (lastAlienRef.current > 80 - level * 5) {
        const x = Math.random() * 300;
        const type = Math.floor(Math.random() * alienEmojis.length);
        setAliens(prev => [...prev, { x, y: -40, id: alienIdRef.current++, type }]);
        lastAlienRef.current = 0;
      }

      // Move bullets
      setBullets(prev => prev
        .map(b => ({ ...b, y: b.y - 12 }))
        .filter(b => b.y > -20)
      );

      // Move aliens and check collisions
      setAliens(prev => {
        let newAliens = prev.map(a => ({ ...a, y: a.y + 2 + level * 0.5 }));

        // Check bullet collisions
        setBullets(currentBullets => {
          const remainingBullets: Bullet[] = [];
          for (const bullet of currentBullets) {
            let hit = false;
            newAliens = newAliens.filter(alien => {
              if (
                bullet.x > alien.x - 10 &&
                bullet.x < alien.x + 40 &&
                bullet.y > alien.y - 10 &&
                bullet.y < alien.y + 40
              ) {
                hit = true;
                setScore(s => {
                  const newScore = s + 10 * (alien.type + 1);
                  if (newScore % 200 === 0) setLevel(l => l + 1);
                  return newScore;
                });
                return false;
              }
              return true;
            });
            if (!hit) remainingBullets.push(bullet);
          }
          return remainingBullets;
        });

        // Check if aliens reached bottom
        for (const alien of newAliens) {
          if (alien.y > 480) {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameState("gameover");
                setHighScore(h => Math.max(h, score));
              }
              return newLives;
            });
            return newAliens.filter(a => a.id !== alien.id);
          }
        }

        return newAliens;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, level, score]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[350px] mb-4 text-white">
        <div className="text-lg">🏆 Score: <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">❤️ Lives: <span className="font-bold text-red-400">{lives}</span></div>
        <div className="text-lg">⭐ Level: <span className="font-bold text-green-400">{level}</span></div>
      </div>

      <div
        className="relative bg-gradient-to-b from-gray-900 via-purple-900 to-black rounded-xl overflow-hidden"
        style={{ width: 350, height: 500 }}
      >
        {/* Stars */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}

        {/* Bullets */}
        {bullets.map(bullet => (
          <div
            key={bullet.id}
            className="absolute w-2 h-4 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"
            style={{ left: bullet.x, top: bullet.y }}
          />
        ))}

        {/* Aliens */}
        {aliens.map(alien => (
          <div
            key={alien.id}
            className="absolute text-4xl"
            style={{ left: alien.x, top: alien.y }}
          >
            {alienEmojis[alien.type]}
          </div>
        ))}

        {/* Player ship */}
        <div
          className="absolute text-5xl transition-all duration-50"
          style={{ left: playerX, top: 430 }}
        >
          🚀
        </div>

        {/* Menu/Game Over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-3xl font-black mb-2">SPACE BLASTER</h2>
                <p className="mb-4 text-gray-300">Destroy the aliens!</p>
                <p className="text-sm mb-4">← → to move, SPACE to shoot</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-3xl font-black mb-2 text-red-400">GAME OVER</h2>
                <p className="text-2xl mb-2">Score: {score}</p>
                <p className="text-lg text-yellow-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform"
            >
              {gameState === "menu" ? "🎮 PLAY" : "🔄 RETRY"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-4 mt-4 md:hidden">
        <button
          onTouchStart={() => setPlayerX(x => Math.max(0, x - 30))}
          className="bg-white/20 hover:bg-white/30 text-white text-3xl w-16 h-16 rounded-full"
        >
          ⬅️
        </button>
        <button
          onTouchStart={shoot}
          className="bg-red-500/50 hover:bg-red-500/70 text-white text-3xl w-16 h-16 rounded-full"
        >
          🔥
        </button>
        <button
          onTouchStart={() => setPlayerX(x => Math.min(310, x + 30))}
          className="bg-white/20 hover:bg-white/30 text-white text-3xl w-16 h-16 rounded-full"
        >
          ➡️
        </button>
      </div>
    </div>
  );
}

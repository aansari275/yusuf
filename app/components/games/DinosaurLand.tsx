"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Bullet {
  x: number;
  y: number;
  id: number;
  direction: "up" | "down" | "left" | "right";
}

interface Dinosaur {
  x: number;
  y: number;
  id: number;
  type: number;
  speed: number;
}

export default function DinosaurLand() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [playerX, setPlayerX] = useState(160);
  const [playerY, setPlayerY] = useState(400);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [dinosaurs, setDinosaurs] = useState<Dinosaur[]>([]);
  const [lastDirection, setLastDirection] = useState<"up" | "down" | "left" | "right">("up");
  const gameLoopRef = useRef<number>();
  const bulletIdRef = useRef(0);
  const dinoIdRef = useRef(0);
  const lastDinoRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());

  const dinoEmojis = ["🦖", "🦕", "🐊", "🐉"];
  const GAME_WIDTH = 350;
  const GAME_HEIGHT = 500;
  const PLAYER_SIZE = 40;
  const DINO_SIZE = 35;
  const BULLET_SIZE = 8;

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setHealth(100);
    setPlayerX(160);
    setPlayerY(400);
    setBullets([]);
    setDinosaurs([]);
    setLastDirection("up");
    bulletIdRef.current = 0;
    dinoIdRef.current = 0;
    lastDinoRef.current = 0;
  };

  const shoot = useCallback(() => {
    if (gameState !== "playing") return;
    const bulletX = playerX + PLAYER_SIZE / 2 - BULLET_SIZE / 2;
    const bulletY = playerY + PLAYER_SIZE / 2 - BULLET_SIZE / 2;
    setBullets(prev => [...prev, { x: bulletX, y: bulletY, id: bulletIdRef.current++, direction: lastDirection }]);
  }, [gameState, playerX, playerY, lastDirection]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === " ") {
        e.preventDefault();
        if (gameState === "playing") shoot();
        else startGame();
      }
      // Track direction for shooting
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") setLastDirection("up");
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") setLastDirection("down");
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") setLastDirection("left");
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") setLastDirection("right");
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [shoot, gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      // Player movement
      const speed = 6;
      if (keysRef.current.has("arrowleft") || keysRef.current.has("a")) {
        setPlayerX(x => Math.max(0, x - speed));
      }
      if (keysRef.current.has("arrowright") || keysRef.current.has("d")) {
        setPlayerX(x => Math.min(GAME_WIDTH - PLAYER_SIZE, x + speed));
      }
      if (keysRef.current.has("arrowup") || keysRef.current.has("w")) {
        setPlayerY(y => Math.max(0, y - speed));
      }
      if (keysRef.current.has("arrowdown") || keysRef.current.has("s")) {
        setPlayerY(y => Math.min(GAME_HEIGHT - PLAYER_SIZE, y + speed));
      }

      // Spawn dinosaurs from edges
      lastDinoRef.current++;
      if (lastDinoRef.current > 60) {
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;
        if (side === 0) { x = Math.random() * (GAME_WIDTH - DINO_SIZE); y = -DINO_SIZE; }
        else if (side === 1) { x = GAME_WIDTH; y = Math.random() * (GAME_HEIGHT - DINO_SIZE); }
        else if (side === 2) { x = Math.random() * (GAME_WIDTH - DINO_SIZE); y = GAME_HEIGHT; }
        else { x = -DINO_SIZE; y = Math.random() * (GAME_HEIGHT - DINO_SIZE); }

        const type = Math.floor(Math.random() * dinoEmojis.length);
        const dinoSpeed = 1.5 + Math.random() * 1.5;
        setDinosaurs(prev => [...prev, { x, y, id: dinoIdRef.current++, type, speed: dinoSpeed }]);
        lastDinoRef.current = 0;
      }

      // Move bullets
      setBullets(prev => prev
        .map(b => {
          const bulletSpeed = 10;
          if (b.direction === "up") return { ...b, y: b.y - bulletSpeed };
          if (b.direction === "down") return { ...b, y: b.y + bulletSpeed };
          if (b.direction === "left") return { ...b, x: b.x - bulletSpeed };
          return { ...b, x: b.x + bulletSpeed };
        })
        .filter(b => b.y > -20 && b.y < GAME_HEIGHT + 20 && b.x > -20 && b.x < GAME_WIDTH + 20)
      );

      // Move dinosaurs toward player and check collisions
      setDinosaurs(prev => {
        return prev.map(dino => {
          // Get current player position from state
          let targetX = 160;
          let targetY = 400;
          setPlayerX(x => { targetX = x; return x; });
          setPlayerY(y => { targetY = y; return y; });

          const dx = targetX - dino.x;
          const dy = targetY - dino.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            return {
              ...dino,
              x: dino.x + (dx / dist) * dino.speed,
              y: dino.y + (dy / dist) * dino.speed,
            };
          }
          return dino;
        });
      });

      // Check bullet-dinosaur collisions
      setBullets(currentBullets => {
        const remainingBullets: Bullet[] = [];
        for (const bullet of currentBullets) {
          let hit = false;
          setDinosaurs(currentDinos => {
            const remaining = currentDinos.filter(dino => {
              if (
                bullet.x > dino.x - 5 &&
                bullet.x < dino.x + DINO_SIZE + 5 &&
                bullet.y > dino.y - 5 &&
                bullet.y < dino.y + DINO_SIZE + 5
              ) {
                hit = true;
                setScore(s => s + 10);
                return false;
              }
              return true;
            });
            return remaining;
          });
          if (!hit) remainingBullets.push(bullet);
        }
        return remainingBullets;
      });

      // Check dinosaur-player collisions
      setDinosaurs(currentDinos => {
        let playerHit = false;
        const remainingDinos = currentDinos.filter(dino => {
          let currentPlayerX = 160;
          let currentPlayerY = 400;
          setPlayerX(x => { currentPlayerX = x; return x; });
          setPlayerY(y => { currentPlayerY = y; return y; });

          if (
            dino.x < currentPlayerX + PLAYER_SIZE - 10 &&
            dino.x + DINO_SIZE > currentPlayerX + 10 &&
            dino.y < currentPlayerY + PLAYER_SIZE - 10 &&
            dino.y + DINO_SIZE > currentPlayerY + 10
          ) {
            playerHit = true;
            return false; // Remove dinosaur that hit player
          }
          return true;
        });

        if (playerHit) {
          setHealth(h => {
            const newHealth = h - 20;
            if (newHealth <= 0) {
              setGameState("gameover");
              setHighScore(prev => Math.max(prev, score));
            }
            return Math.max(0, newHealth);
          });
        }

        return remainingDinos;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, score]);

  // Mobile movement handlers
  const movePlayer = (dx: number, dy: number) => {
    if (dx < 0) { setPlayerX(x => Math.max(0, x - 25)); setLastDirection("left"); }
    if (dx > 0) { setPlayerX(x => Math.min(GAME_WIDTH - PLAYER_SIZE, x + 25)); setLastDirection("right"); }
    if (dy < 0) { setPlayerY(y => Math.max(0, y - 25)); setLastDirection("up"); }
    if (dy > 0) { setPlayerY(y => Math.min(GAME_HEIGHT - PLAYER_SIZE, y + 25)); setLastDirection("down"); }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Stats Display */}
      <div className="flex justify-between w-full max-w-[350px] mb-4 text-white">
        <div className="text-lg">🏆 Score: <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">❤️ Health: <span className="font-bold text-red-400">{health}</span></div>
        <div className="text-lg">👑 Best: <span className="font-bold text-purple-400">{highScore}</span></div>
      </div>

      {/* Health Bar */}
      <div className="w-full max-w-[350px] mb-4">
        <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-200"
            style={{ width: `${health}%` }}
          />
        </div>
      </div>

      {/* Game Canvas */}
      <div
        className="relative bg-gradient-to-b from-green-600 via-green-500 to-amber-600 rounded-xl overflow-hidden border-4 border-amber-800"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Ground texture elements */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl opacity-30"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          >
            🌿
          </div>
        ))}

        {/* Bullets */}
        {bullets.map(bullet => (
          <div
            key={bullet.id}
            className="absolute w-3 h-3 bg-yellow-300 rounded-full shadow-lg shadow-yellow-400/50 border border-yellow-500"
            style={{ left: bullet.x, top: bullet.y }}
          />
        ))}

        {/* Dinosaurs */}
        {dinosaurs.map(dino => (
          <div
            key={dino.id}
            className="absolute text-4xl"
            style={{ left: dino.x, top: dino.y }}
          >
            {dinoEmojis[dino.type]}
          </div>
        ))}

        {/* Player (hunter) */}
        <div
          className="absolute text-4xl transition-transform duration-75"
          style={{
            left: playerX,
            top: playerY,
            transform: lastDirection === "left" ? "scaleX(-1)" : "scaleX(1)"
          }}
        >
          🤠🔫
        </div>

        {/* Menu/Game Over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="text-6xl mb-4 animate-bounce">🦖</div>
                <h2 className="text-3xl font-black mb-2">DINOSAUR LAND</h2>
                <p className="mb-2 text-gray-300">Survive the dinosaur attack!</p>
                <p className="text-sm mb-4 text-center px-4">
                  Arrow keys or WASD to move<br/>
                  SPACE to shoot
                </p>
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
              className="bg-gradient-to-r from-green-500 to-amber-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg"
            >
              {gameState === "menu" ? "🎮 PLAY" : "🔄 RESTART"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-4 md:hidden">
        {/* Direction pad */}
        <div className="flex flex-col items-center gap-2">
          <button
            onTouchStart={() => movePlayer(0, -1)}
            className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-2xl w-14 h-14 rounded-full shadow-lg"
          >
            ⬆️
          </button>
          <div className="flex gap-2">
            <button
              onTouchStart={() => movePlayer(-1, 0)}
              className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-2xl w-14 h-14 rounded-full shadow-lg"
            >
              ⬅️
            </button>
            <button
              onTouchStart={shoot}
              className="bg-red-500/60 hover:bg-red-500/80 active:bg-red-600 text-white text-2xl w-14 h-14 rounded-full shadow-lg"
            >
              🔥
            </button>
            <button
              onTouchStart={() => movePlayer(1, 0)}
              className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-2xl w-14 h-14 rounded-full shadow-lg"
            >
              ➡️
            </button>
          </div>
          <button
            onTouchStart={() => movePlayer(0, 1)}
            className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-2xl w-14 h-14 rounded-full shadow-lg"
          >
            ⬇️
          </button>
        </div>
      </div>
    </div>
  );
}

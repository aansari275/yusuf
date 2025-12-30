"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Obstacle {
  id: number;
  x: number;
  type: "spike" | "block" | "saw" | "gap";
  width: number;
  height: number;
}

interface Coin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export default function GeometryJump() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [playerY, setPlayerY] = useState(350);
  const [velocity, setVelocity] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coinItems, setCoinItems] = useState<Coin[]>([]);
  const [speed, setSpeed] = useState(6);
  const [groundY] = useState(380);
  const [shake, setShake] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  const gameLoopRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const coinIdRef = useRef(0);
  const lastObstacleRef = useRef(0);

  const GAME_WIDTH = 600;
  const GAME_HEIGHT = 400;
  const PLAYER_SIZE = 30;
  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const PLAYER_X = 80;

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setCoins(0);
    setDistance(0);
    setPlayerY(350);
    setVelocity(0);
    setIsJumping(false);
    setRotation(0);
    setObstacles([]);
    setCoinItems([]);
    setSpeed(6);
    setTrail([]);
    obstacleIdRef.current = 0;
    coinIdRef.current = 0;
    lastObstacleRef.current = 0;
  };

  const jump = useCallback(() => {
    if (gameState === "playing" && !isJumping) {
      setVelocity(JUMP_FORCE);
      setIsJumping(true);
    } else if (gameState !== "playing") {
      startGame();
    }
  }, [gameState, isJumping]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      // Player physics
      setVelocity(v => v + GRAVITY);
      setPlayerY(y => {
        const newY = y + velocity;
        if (newY >= groundY) {
          setIsJumping(false);
          setVelocity(0);
          return groundY;
        }
        return newY;
      });

      // Rotation when jumping
      if (isJumping) {
        setRotation(r => r + 8);
      } else {
        setRotation(r => {
          const target = Math.round(r / 90) * 90;
          return r + (target - r) * 0.3;
        });
      }

      // Update trail
      setTrail(prev => [...prev.slice(-10), { x: PLAYER_X, y: playerY }]);

      // Update distance and score
      setDistance(d => d + speed);
      setScore(s => s + 1);

      // Increase speed over time
      if (distance % 1000 < speed) {
        setSpeed(s => Math.min(s + 0.2, 12));
      }

      // Spawn obstacles
      lastObstacleRef.current += speed;
      if (lastObstacleRef.current > 250 + Math.random() * 150) {
        const types: ("spike" | "block" | "saw" | "gap")[] = ["spike", "block", "saw", "spike"];
        const type = types[Math.floor(Math.random() * types.length)];
        let width = 30;
        let height = 40;

        if (type === "block") {
          width = 40 + Math.random() * 30;
          height = 30 + Math.random() * 40;
        } else if (type === "saw") {
          width = 40;
          height = 40;
        } else if (type === "gap") {
          width = 60 + Math.random() * 40;
          height = 100;
        }

        setObstacles(prev => [...prev, {
          id: obstacleIdRef.current++,
          x: GAME_WIDTH + 50,
          type,
          width,
          height,
        }]);

        // Spawn coin above obstacle sometimes
        if (Math.random() > 0.5) {
          setCoinItems(prev => [...prev, {
            id: coinIdRef.current++,
            x: GAME_WIDTH + 50 + width / 2,
            y: groundY - height - 60 - Math.random() * 40,
            collected: false,
          }]);
        }

        lastObstacleRef.current = 0;
      }

      // Move obstacles
      setObstacles(prev => {
        const newObs = prev.map(obs => ({ ...obs, x: obs.x - speed })).filter(obs => obs.x > -100);

        // Check collisions
        for (const obs of newObs) {
          const obsRight = obs.x + obs.width;
          const obsTop = obs.type === "gap" ? groundY - obs.height : groundY - obs.height;
          const obsBottom = groundY;

          // Player bounds
          const playerLeft = PLAYER_X;
          const playerRight = PLAYER_X + PLAYER_SIZE;
          const playerTop = playerY;
          const playerBottom = playerY + PLAYER_SIZE;

          // Collision check
          if (obs.type !== "gap") {
            if (
              playerRight > obs.x &&
              playerLeft < obsRight &&
              playerBottom > obsTop &&
              playerTop < obsBottom
            ) {
              setGameState("gameover");
              setHighScore(h => Math.max(h, score));
              setShake(true);
              setTimeout(() => setShake(false), 300);
            }
          }
        }

        return newObs;
      });

      // Move and collect coins
      setCoinItems(prev => prev.map(coin => {
        const newCoin = { ...coin, x: coin.x - speed };
        if (!coin.collected) {
          const dx = PLAYER_X + PLAYER_SIZE / 2 - coin.x;
          const dy = playerY + PLAYER_SIZE / 2 - coin.y;
          if (Math.sqrt(dx * dx + dy * dy) < 25) {
            setCoins(c => c + 1);
            return { ...newCoin, collected: true };
          }
        }
        return newCoin;
      }).filter(coin => coin.x > -50));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, velocity, playerY, isJumping, distance, speed, score]);

  const renderObstacle = (obs: Obstacle) => {
    switch (obs.type) {
      case "spike":
        return (
          <div
            key={obs.id}
            className="absolute"
            style={{ left: obs.x, bottom: GAME_HEIGHT - groundY }}
          >
            <div
              className="border-l-[15px] border-r-[15px] border-b-[40px] border-l-transparent border-r-transparent border-b-red-500"
              style={{ filter: "drop-shadow(0 0 5px red)" }}
            />
          </div>
        );
      case "block":
        return (
          <div
            key={obs.id}
            className="absolute bg-gradient-to-t from-gray-700 to-gray-500 border-2 border-gray-400"
            style={{
              left: obs.x,
              bottom: GAME_HEIGHT - groundY,
              width: obs.width,
              height: obs.height,
            }}
          />
        );
      case "saw":
        return (
          <div
            key={obs.id}
            className="absolute text-4xl animate-spin"
            style={{
              left: obs.x,
              bottom: GAME_HEIGHT - groundY,
            }}
          >
            ⚙️
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* HUD */}
      <div className="flex justify-between w-full max-w-[600px] mb-3 text-white">
        <div className="text-lg">🏆 <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">💎 <span className="font-bold text-cyan-400">{coins}</span></div>
        <div className="text-lg">📏 <span className="font-bold text-green-400">{Math.floor(distance / 10)}m</span></div>
        <div className="text-lg">👑 <span className="font-bold text-purple-400">{highScore}</span></div>
      </div>

      {/* Game Area */}
      <div
        className={`relative overflow-hidden rounded-2xl border-4 border-cyan-500 cursor-pointer ${shake ? "animate-pulse" : ""}`}
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onClick={jump}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900" />

        {/* Stars */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${(i * 37 + distance / 2) % GAME_WIDTH}px`,
              top: `${(i * 23) % 150}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}

        {/* Ground */}
        <div
          className="absolute left-0 right-0 bg-gradient-to-t from-cyan-600 to-cyan-500"
          style={{ top: groundY, height: GAME_HEIGHT - groundY }}
        />
        <div
          className="absolute left-0 right-0 h-2 bg-cyan-300"
          style={{ top: groundY }}
        />

        {/* Trail */}
        {trail.map((pos, i) => (
          <div
            key={i}
            className="absolute rounded bg-yellow-400"
            style={{
              left: pos.x + PLAYER_SIZE / 2 - 3,
              top: pos.y + PLAYER_SIZE / 2 - 3,
              width: 6,
              height: 6,
              opacity: i / trail.length * 0.5,
            }}
          />
        ))}

        {/* Player */}
        <div
          className="absolute bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-yellow-300"
          style={{
            left: PLAYER_X,
            top: playerY,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            transform: `rotate(${rotation}deg)`,
            boxShadow: "0 0 20px rgba(255, 200, 0, 0.5)",
          }}
        />

        {/* Obstacles */}
        {obstacles.map(renderObstacle)}

        {/* Coins */}
        {coinItems.filter(c => !c.collected).map(coin => (
          <div
            key={coin.id}
            className="absolute text-2xl animate-bounce"
            style={{ left: coin.x - 12, top: coin.y - 12 }}
          >
            💎
          </div>
        ))}

        {/* Menu / Game Over */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="text-6xl mb-4 animate-bounce">🟨</div>
                <h2 className="text-3xl font-black mb-2 text-yellow-400">GEOMETRY JUMP</h2>
                <p className="text-gray-300 mb-4">Tap to jump over obstacles!</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">💥</div>
                <h2 className="text-3xl font-black mb-2 text-red-400">CRASHED!</h2>
                <p className="text-2xl mb-1">Score: <span className="text-yellow-400">{score}</span></p>
                <p className="text-lg text-cyan-400 mb-1">Coins: {coins}</p>
                <p className="text-lg text-purple-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg"
            >
              {gameState === "menu" ? "▶️ START!" : "🔄 RETRY"}
            </button>
          </div>
        )}
      </div>

      <p className="text-white/60 mt-4 text-center text-sm">
        Tap or press SPACE to jump! Collect 💎 and avoid obstacles!
      </p>
    </div>
  );
}

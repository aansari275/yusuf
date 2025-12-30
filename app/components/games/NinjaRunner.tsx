"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Obstacle {
  id: number;
  x: number;
  type: "shuriken" | "ninja" | "pit" | "wall";
  y: number;
  width: number;
  height: number;
}

interface Coin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

interface Powerup {
  id: number;
  x: number;
  y: number;
  type: "magnet" | "shield" | "speed";
  collected: boolean;
}

export default function NinjaRunner() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [ninjaY, setNinjaY] = useState(300);
  const [ninjaLane, setNinjaLane] = useState(1); // 0, 1, 2 (top, middle, bottom)
  const [velocity, setVelocity] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coinItems, setCoinItems] = useState<Coin[]>([]);
  const [powerups, setPowerups] = useState<Powerup[]>([]);
  const [speed, setSpeed] = useState(8);
  const [hasShield, setHasShield] = useState(false);
  const [shake, setShake] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [ninjaFrame, setNinjaFrame] = useState(0);

  const gameLoopRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const coinIdRef = useRef(0);
  const powerupIdRef = useRef(0);
  const lastObstacleRef = useRef(0);

  const GAME_WIDTH = 600;
  const GAME_HEIGHT = 400;
  const LANE_HEIGHT = 80;
  const LANES = [120, 200, 280]; // Y positions for each lane

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setCoins(0);
    setDistance(0);
    setNinjaY(LANES[1]);
    setNinjaLane(1);
    setVelocity(0);
    setIsSliding(false);
    setObstacles([]);
    setCoinItems([]);
    setPowerups([]);
    setSpeed(8);
    setHasShield(false);
    setMultiplier(1);
    obstacleIdRef.current = 0;
    coinIdRef.current = 0;
    powerupIdRef.current = 0;
    lastObstacleRef.current = 0;
  };

  const changeLane = useCallback((direction: "up" | "down") => {
    if (gameState !== "playing") return;
    setNinjaLane(lane => {
      if (direction === "up" && lane > 0) return lane - 1;
      if (direction === "down" && lane < 2) return lane + 1;
      return lane;
    });
  }, [gameState]);

  const slide = useCallback(() => {
    if (gameState !== "playing" || isSliding) return;
    setIsSliding(true);
    setTimeout(() => setIsSliding(false), 500);
  }, [gameState, isSliding]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") {
        if (e.key === " " || e.key === "Enter") startGame();
        return;
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
          e.preventDefault();
          changeLane("up");
          break;
        case "ArrowDown":
        case "s":
          e.preventDefault();
          changeLane("down");
          break;
        case " ":
        case "ArrowLeft":
          e.preventDefault();
          slide();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, changeLane, slide]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let frameCount = 0;

    const gameLoop = () => {
      frameCount++;

      // Ninja animation
      if (frameCount % 5 === 0) {
        setNinjaFrame(f => (f + 1) % 4);
      }

      // Smooth lane transition
      setNinjaY(y => {
        const targetY = LANES[ninjaLane];
        return y + (targetY - y) * 0.2;
      });

      // Update distance and score
      setDistance(d => d + speed);
      setScore(s => s + Math.floor(multiplier));

      // Increase speed over time
      if (distance % 500 < speed) {
        setSpeed(s => Math.min(s + 0.1, 15));
      }

      // Spawn obstacles
      lastObstacleRef.current += speed;
      if (lastObstacleRef.current > 200 + Math.random() * 100) {
        const types: ("shuriken" | "ninja" | "wall")[] = ["shuriken", "ninja", "wall", "shuriken"];
        const type = types[Math.floor(Math.random() * types.length)];
        const lane = Math.floor(Math.random() * 3);

        let width = 40;
        let height = 40;
        let y = LANES[lane];

        if (type === "wall") {
          height = 60;
          y = LANES[lane] - 10;
        } else if (type === "ninja") {
          width = 50;
          height = 60;
        }

        setObstacles(prev => [...prev, {
          id: obstacleIdRef.current++,
          x: GAME_WIDTH + 50,
          type,
          y,
          width,
          height,
        }]);

        // Spawn coins
        if (Math.random() > 0.3) {
          const coinLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
          for (let i = 0; i < 3; i++) {
            setCoinItems(prev => [...prev, {
              id: coinIdRef.current++,
              x: GAME_WIDTH + 100 + i * 40,
              y: LANES[coinLane] + 10,
              collected: false,
            }]);
          }
        }

        // Spawn powerups occasionally
        if (Math.random() > 0.9) {
          const powerupTypes: ("shield" | "magnet" | "speed")[] = ["shield", "magnet", "speed"];
          setPowerups(prev => [...prev, {
            id: powerupIdRef.current++,
            x: GAME_WIDTH + 150,
            y: LANES[Math.floor(Math.random() * 3)] + 10,
            type: powerupTypes[Math.floor(Math.random() * 3)],
            collected: false,
          }]);
        }

        lastObstacleRef.current = 0;
      }

      // Move and check obstacles
      const ninjaLeft = 80;
      const ninjaRight = 120;
      const ninjaTop = ninjaY - (isSliding ? 15 : 25);
      const ninjaBottom = ninjaY + (isSliding ? 15 : 25);

      setObstacles(prev => {
        return prev.map(obs => ({ ...obs, x: obs.x - speed })).filter(obs => {
          // Collision check
          if (
            ninjaRight > obs.x &&
            ninjaLeft < obs.x + obs.width &&
            ninjaBottom > obs.y - obs.height / 2 &&
            ninjaTop < obs.y + obs.height / 2
          ) {
            if (hasShield) {
              setHasShield(false);
              return false;
            } else {
              setGameState("gameover");
              setHighScore(h => Math.max(h, score));
              setShake(true);
              setTimeout(() => setShake(false), 300);
            }
          }
          return obs.x > -100;
        });
      });

      // Collect coins
      setCoinItems(prev => prev.map(coin => {
        if (coin.collected) return coin;
        const newCoin = { ...coin, x: coin.x - speed };
        const dx = 100 - coin.x;
        const dy = ninjaY - coin.y;
        if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
          setCoins(c => c + 1);
          setScore(s => s + 10 * multiplier);
          return { ...newCoin, collected: true };
        }
        return newCoin;
      }).filter(coin => coin.x > -50));

      // Collect powerups
      setPowerups(prev => prev.map(powerup => {
        if (powerup.collected) return powerup;
        const newPowerup = { ...powerup, x: powerup.x - speed };
        const dx = 100 - powerup.x;
        const dy = ninjaY - powerup.y;
        if (Math.abs(dx) < 35 && Math.abs(dy) < 35) {
          if (powerup.type === "shield") {
            setHasShield(true);
          } else if (powerup.type === "speed") {
            setMultiplier(m => m * 2);
            setTimeout(() => setMultiplier(1), 5000);
          }
          return { ...newPowerup, collected: true };
        }
        return newPowerup;
      }).filter(p => p.x > -50));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, ninjaY, ninjaLane, isSliding, distance, speed, score, hasShield, multiplier]);

  const getNinjaEmoji = () => {
    if (isSliding) return "🏃";
    const frames = ["🥷", "🥷", "🥷", "🥷"];
    return frames[ninjaFrame];
  };

  const getObstacleEmoji = (type: string) => {
    switch (type) {
      case "shuriken": return "⚔️";
      case "ninja": return "👹";
      case "wall": return "🧱";
      default: return "⚠️";
    }
  };

  const getPowerupEmoji = (type: string) => {
    switch (type) {
      case "shield": return "🛡️";
      case "magnet": return "🧲";
      case "speed": return "⚡";
      default: return "✨";
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* HUD */}
      <div className="flex justify-between w-full max-w-[600px] mb-3 text-white">
        <div className="text-lg">🏆 <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">💰 <span className="font-bold text-amber-400">{coins}</span></div>
        <div className="text-lg">📏 <span className="font-bold text-green-400">{Math.floor(distance / 10)}m</span></div>
        {hasShield && <div className="text-lg">🛡️</div>}
        {multiplier > 1 && <div className="text-lg text-yellow-400 animate-pulse">x{multiplier}</div>}
        <div className="text-lg">👑 <span className="font-bold text-purple-400">{highScore}</span></div>
      </div>

      {/* Game Area */}
      <div
        className={`relative overflow-hidden rounded-2xl border-4 border-gray-700 ${shake ? "animate-pulse" : ""}`}
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onClick={() => gameState !== "playing" && startGame()}
      >
        {/* Background - ninja village */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-gray-900" />

        {/* Parallax mountains */}
        <div
          className="absolute bottom-20 left-0 w-[1200px] h-32 opacity-30"
          style={{ transform: `translateX(${-(distance / 5) % 600}px)` }}
        >
          <svg viewBox="0 0 600 100" className="w-full h-full">
            <polygon fill="#1f2937" points="0,100 50,30 100,100" />
            <polygon fill="#374151" points="80,100 150,20 220,100" />
            <polygon fill="#1f2937" points="200,100 280,40 360,100" />
            <polygon fill="#374151" points="340,100 420,25 500,100" />
            <polygon fill="#1f2937" points="480,100 550,50 600,100" />
          </svg>
        </div>

        {/* Lanes */}
        {LANES.map((laneY, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-1 bg-gray-600/50"
            style={{ top: laneY + 25 }}
          />
        ))}

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-800 to-gray-700" />

        {/* Ninja */}
        <div
          className={`absolute text-4xl transition-all duration-100 ${isSliding ? "scale-x-125 scale-y-75" : ""}`}
          style={{
            left: 80,
            top: ninjaY - 20,
            filter: hasShield ? "drop-shadow(0 0 10px cyan)" : undefined,
          }}
        >
          {getNinjaEmoji()}
          {hasShield && (
            <div className="absolute inset-0 text-4xl opacity-50">🛡️</div>
          )}
        </div>

        {/* Obstacles */}
        {obstacles.map(obs => (
          <div
            key={obs.id}
            className={`absolute ${obs.type === "shuriken" ? "animate-spin" : ""}`}
            style={{
              left: obs.x,
              top: obs.y - obs.height / 2,
              fontSize: obs.type === "wall" ? "2.5rem" : "2rem",
            }}
          >
            {getObstacleEmoji(obs.type)}
          </div>
        ))}

        {/* Coins */}
        {coinItems.filter(c => !c.collected).map(coin => (
          <div
            key={coin.id}
            className="absolute text-xl animate-pulse"
            style={{ left: coin.x, top: coin.y }}
          >
            🪙
          </div>
        ))}

        {/* Powerups */}
        {powerups.filter(p => !p.collected).map(powerup => (
          <div
            key={powerup.id}
            className="absolute text-2xl animate-bounce"
            style={{ left: powerup.x, top: powerup.y }}
          >
            {getPowerupEmoji(powerup.type)}
          </div>
        ))}

        {/* Menu / Game Over */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="text-6xl mb-4 animate-bounce">🥷</div>
                <h2 className="text-3xl font-black mb-2 text-purple-400">NINJA RUNNER</h2>
                <p className="text-gray-300 mb-2">Run, dodge, and collect coins!</p>
                <div className="text-sm text-gray-400 mb-4">
                  ⬆️⬇️ Change lanes • SPACE to slide
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">💀</div>
                <h2 className="text-3xl font-black mb-2 text-red-400">GAME OVER</h2>
                <p className="text-2xl mb-1">Score: <span className="text-yellow-400">{score}</span></p>
                <p className="text-lg text-amber-400 mb-1">Coins: {coins}</p>
                <p className="text-lg text-green-400 mb-1">Distance: {Math.floor(distance / 10)}m</p>
                <p className="text-lg text-purple-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg"
            >
              {gameState === "menu" ? "🥷 RUN!" : "🔄 RETRY"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-4 flex gap-4 md:hidden">
        <button
          onClick={() => changeLane("up")}
          className="bg-purple-500/50 hover:bg-purple-500/70 text-white text-2xl w-16 h-16 rounded-lg"
        >
          ⬆️
        </button>
        <button
          onClick={slide}
          className="bg-blue-500/50 hover:bg-blue-500/70 text-white text-2xl w-16 h-16 rounded-lg"
        >
          🏃
        </button>
        <button
          onClick={() => changeLane("down")}
          className="bg-purple-500/50 hover:bg-purple-500/70 text-white text-2xl w-16 h-16 rounded-lg"
        >
          ⬇️
        </button>
      </div>

      <p className="text-white/60 mt-4 text-center text-sm">
        Use ⬆️⬇️ to change lanes, SPACE to slide! Collect 🪙 and powerups!
      </p>
    </div>
  );
}

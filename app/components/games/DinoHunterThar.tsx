"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Dinosaur {
  id: number;
  x: number;
  y: number;
  type: "trex" | "raptor" | "pterodactyl";
  health: number;
  speed: number;
}

interface Volcano {
  id: number;
  x: number;
  y: number;
  erupting: boolean;
  eruptionTime: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  angle: number;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  frame: number;
}

export default function DinoHunterThar() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [health, setHealth] = useState(100);
  const [tharX, setTharX] = useState(50);
  const [tharY, setTharY] = useState(300);
  const [dinosaurs, setDinosaurs] = useState<Dinosaur[]>([]);
  const [volcanoes, setVolcanoes] = useState<Volcano[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [ammo, setAmmo] = useState(30);
  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(false);

  const gameRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotRef = useRef(0);
  const dinoIdRef = useRef(0);
  const volcanoIdRef = useRef(0);
  const bulletIdRef = useRef(0);
  const explosionIdRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const volcanoTimerRef = useRef(0);

  const GAME_WIDTH = 700;
  const GAME_HEIGHT = 450;

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLevel(1);
    setHealth(100);
    setTharX(50);
    setTharY(300);
    setDinosaurs([]);
    setVolcanoes([
      { id: 0, x: 600, y: 80, erupting: false, eruptionTime: 0 },
      { id: 1, x: 500, y: 350, erupting: false, eruptionTime: 0 },
    ]);
    setBullets([]);
    setExplosions([]);
    setAmmo(30);
    setCombo(0);
    dinoIdRef.current = 0;
    volcanoIdRef.current = 2;
    bulletIdRef.current = 0;
    explosionIdRef.current = 0;
    spawnTimerRef.current = 0;
    volcanoTimerRef.current = 0;
  };

  const shoot = useCallback(() => {
    if (ammo <= 0 || gameState !== "playing") return;
    const now = Date.now();
    if (now - lastShotRef.current < 150) return;
    lastShotRef.current = now;

    setAmmo(a => a - 1);
    setBullets(prev => [
      ...prev,
      { id: bulletIdRef.current++, x: tharX + 60, y: tharY + 20, angle: 0 }
    ]);
  }, [ammo, gameState, tharX, tharY]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === " " && gameState === "playing") {
        e.preventDefault();
        shoot();
      }
      if ((e.key === " " || e.key === "Enter") && gameState !== "playing") {
        startGame();
      }
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
  }, [gameState, shoot]);

  // Main game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      // Move Thar
      const speed = 5;
      if (keysRef.current.has("w") || keysRef.current.has("arrowup")) {
        setTharY(y => Math.max(50, y - speed));
      }
      if (keysRef.current.has("s") || keysRef.current.has("arrowdown")) {
        setTharY(y => Math.min(GAME_HEIGHT - 80, y + speed));
      }
      if (keysRef.current.has("a") || keysRef.current.has("arrowleft")) {
        setTharX(x => Math.max(10, x - speed));
      }
      if (keysRef.current.has("d") || keysRef.current.has("arrowright")) {
        setTharX(x => Math.min(250, x + speed));
      }

      // Spawn dinosaurs
      spawnTimerRef.current++;
      if (spawnTimerRef.current > 60 - level * 3) {
        const types: ("trex" | "raptor" | "pterodactyl")[] = ["trex", "raptor", "pterodactyl"];
        const type = types[Math.floor(Math.random() * types.length)];
        const newDino: Dinosaur = {
          id: dinoIdRef.current++,
          x: GAME_WIDTH + 50,
          y: type === "pterodactyl" ? Math.random() * 150 + 50 : Math.random() * 200 + 200,
          type,
          health: type === "trex" ? 3 : type === "raptor" ? 2 : 1,
          speed: type === "raptor" ? 4 + level * 0.3 : type === "pterodactyl" ? 3 + level * 0.2 : 2 + level * 0.2,
        };
        setDinosaurs(prev => [...prev, newDino]);
        spawnTimerRef.current = 0;
      }

      // Move dinosaurs
      setDinosaurs(prev => {
        return prev.map(dino => ({
          ...dino,
          x: dino.x - dino.speed,
          y: dino.type === "pterodactyl" ? dino.y + Math.sin(Date.now() / 200) * 2 : dino.y,
        })).filter(dino => {
          // Check if dino reached the player
          if (dino.x < tharX + 50) {
            setHealth(h => {
              const damage = dino.type === "trex" ? 25 : dino.type === "raptor" ? 15 : 10;
              const newHealth = h - damage;
              if (newHealth <= 0) {
                setGameState("gameover");
                setHighScore(hs => Math.max(hs, score));
              }
              setShake(true);
              setTimeout(() => setShake(false), 200);
              return Math.max(0, newHealth);
            });
            setCombo(0);
            return false;
          }
          return dino.x > -100;
        });
      });

      // Move bullets and check collisions
      setBullets(prev => {
        const newBullets: Bullet[] = [];
        for (const bullet of prev) {
          const newX = bullet.x + 12;
          if (newX > GAME_WIDTH) continue;

          let hit = false;
          setDinosaurs(dinos => {
            return dinos.map(dino => {
              if (hit) return dino;
              // Collision check
              const dinoWidth = dino.type === "trex" ? 70 : dino.type === "raptor" ? 50 : 40;
              const dinoHeight = dino.type === "trex" ? 60 : dino.type === "raptor" ? 40 : 30;
              if (
                newX > dino.x && newX < dino.x + dinoWidth &&
                bullet.y > dino.y && bullet.y < dino.y + dinoHeight
              ) {
                hit = true;
                if (dino.health <= 1) {
                  // Dino killed
                  const points = dino.type === "trex" ? 30 : dino.type === "raptor" ? 20 : 10;
                  setScore(s => {
                    const newScore = s + points * (1 + combo * 0.1);
                    if (Math.floor(newScore / 200) > Math.floor(s / 200)) {
                      setLevel(l => Math.min(l + 1, 15));
                      setAmmo(a => Math.min(a + 10, 50));
                    }
                    return Math.floor(newScore);
                  });
                  setCombo(c => c + 1);
                  setExplosions(exp => [...exp, { id: explosionIdRef.current++, x: dino.x, y: dino.y, frame: 0 }]);
                  return { ...dino, health: 0 };
                }
                return { ...dino, health: dino.health - 1 };
              }
              return dino;
            }).filter(dino => dino.health > 0);
          });

          if (!hit) {
            newBullets.push({ ...bullet, x: newX });
          }
        }
        return newBullets;
      });

      // Volcano eruptions
      volcanoTimerRef.current++;
      if (volcanoTimerRef.current > 180) {
        setVolcanoes(prev => prev.map(v => ({
          ...v,
          erupting: Math.random() > 0.5,
          eruptionTime: 60,
        })));
        volcanoTimerRef.current = 0;
      }

      // Update volcanoes and check lava damage
      setVolcanoes(prev => prev.map(v => {
        if (v.erupting && v.eruptionTime > 0) {
          // Check if Thar is in lava zone
          const lavaX = v.x - 100;
          const lavaWidth = 200;
          if (tharX + 60 > lavaX && tharX < lavaX + lavaWidth && v.eruptionTime > 30) {
            setHealth(h => {
              const newHealth = h - 1;
              if (newHealth <= 0) {
                setGameState("gameover");
                setHighScore(hs => Math.max(hs, score));
              }
              return Math.max(0, newHealth);
            });
          }
          return { ...v, eruptionTime: v.eruptionTime - 1, erupting: v.eruptionTime > 1 };
        }
        return v;
      }));

      // Update explosions
      setExplosions(prev => prev.map(e => ({ ...e, frame: e.frame + 1 })).filter(e => e.frame < 15));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, tharX, tharY, score, combo, level]);

  const getDinoEmoji = (type: string) => {
    switch (type) {
      case "trex": return "🦖";
      case "raptor": return "🦎";
      case "pterodactyl": return "🦅";
      default: return "🦖";
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* HUD */}
      <div className="flex flex-wrap justify-between w-full max-w-[700px] mb-3 text-white gap-2">
        <div className="text-lg">❤️ <span className="font-bold text-red-400">{health}</span></div>
        <div className="text-lg">🏆 <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">🔥 Combo: <span className="font-bold text-orange-400">x{combo}</span></div>
        <div className="text-lg">⭐ Level: <span className="font-bold text-green-400">{level}</span></div>
        <div className="text-lg">🔫 <span className="font-bold text-blue-400">{ammo}</span></div>
        <div className="text-lg">👑 Best: <span className="font-bold text-purple-400">{highScore}</span></div>
      </div>

      {/* Game Area */}
      <div
        ref={gameRef}
        className={`relative overflow-hidden rounded-2xl border-4 border-amber-600 cursor-crosshair ${shake ? "animate-pulse" : ""}`}
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onClick={shoot}
      >
        {/* Background - Prehistoric landscape */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-300 via-amber-200 to-amber-600" />

        {/* Mountains */}
        <div className="absolute bottom-20 left-0 right-0">
          <svg viewBox="0 0 700 150" className="w-full h-32">
            <polygon fill="#8B5A2B" points="0,150 100,50 200,150" />
            <polygon fill="#A0522D" points="150,150 280,30 410,150" />
            <polygon fill="#8B4513" points="350,150 480,60 610,150" />
            <polygon fill="#A0522D" points="550,150 650,70 700,150" />
          </svg>
        </div>

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-800 to-amber-600" />
        <div className="absolute bottom-12 left-0 right-0 h-4 bg-green-700 opacity-50" />

        {/* Volcanoes */}
        {volcanoes.map(volcano => (
          <div key={volcano.id} className="absolute" style={{ left: volcano.x, top: volcano.y }}>
            {/* Volcano */}
            <div className="relative">
              <div className="text-5xl">🌋</div>
              {/* Eruption effect */}
              {volcano.erupting && (
                <>
                  <div className="absolute -top-8 left-3 text-3xl animate-bounce">🔥</div>
                  <div className="absolute -top-4 left-6 text-2xl animate-ping">💥</div>
                  {/* Lava spread */}
                  <div
                    className="absolute top-10 -left-16 w-40 h-8 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-70 animate-pulse"
                    style={{ filter: "blur(4px)" }}
                  />
                  <div className="absolute top-12 -left-12 text-xl">🔥</div>
                  <div className="absolute top-12 left-8 text-xl">🔥</div>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Dinosaurs */}
        {dinosaurs.map(dino => (
          <div
            key={dino.id}
            className="absolute transition-transform"
            style={{
              left: dino.x,
              top: dino.y,
              transform: "scaleX(-1)",
              fontSize: dino.type === "trex" ? "4rem" : dino.type === "raptor" ? "2.5rem" : "2rem",
            }}
          >
            {getDinoEmoji(dino.type)}
            {/* Health bar for T-Rex */}
            {dino.type === "trex" && dino.health < 3 && (
              <div className="absolute -top-2 left-0 w-16 h-2 bg-gray-800 rounded">
                <div
                  className="h-full bg-red-500 rounded"
                  style={{ width: `${(dino.health / 3) * 100}%` }}
                />
              </div>
            )}
          </div>
        ))}

        {/* Mahindra Thar */}
        <div
          className="absolute transition-all duration-75"
          style={{ left: tharX, top: tharY }}
        >
          <div className="relative">
            {/* Car body */}
            <div className="text-5xl">🚙</div>
            {/* Gun */}
            <div className="absolute -top-1 right-0 text-2xl transform rotate-0">🔫</div>
            {/* Driver */}
            <div className="absolute -top-2 left-4 text-lg">🤠</div>
          </div>
        </div>

        {/* Bullets */}
        {bullets.map(bullet => (
          <div
            key={bullet.id}
            className="absolute w-3 h-1 bg-yellow-400 rounded-full shadow-lg shadow-yellow-500"
            style={{ left: bullet.x, top: bullet.y }}
          />
        ))}

        {/* Explosions */}
        {explosions.map(exp => (
          <div
            key={exp.id}
            className="absolute text-4xl"
            style={{
              left: exp.x,
              top: exp.y,
              opacity: 1 - exp.frame / 15,
              transform: `scale(${1 + exp.frame / 10})`,
            }}
          >
            💥
          </div>
        ))}

        {/* Warning for eruption */}
        {volcanoes.some(v => v.erupting) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/80 text-white px-4 py-1 rounded-full font-bold animate-pulse">
            ⚠️ VOLCANIC ERUPTION! ⚠️
          </div>
        )}

        {/* Menu / Game Over */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-20">
            {gameState === "menu" ? (
              <>
                <div className="text-6xl mb-2 animate-bounce">🚙</div>
                <div className="text-4xl mb-4">🦖 VS 🌋</div>
                <h2 className="text-3xl font-black mb-2 text-amber-400">DINO HUNTER THAR</h2>
                <p className="text-gray-300 mb-2">Drive your Mahindra Thar through prehistoric times!</p>
                <p className="text-sm text-gray-400 mb-4">WASD/Arrows to move • SPACE/Click to shoot</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-3xl font-black mb-2 text-red-500">GAME OVER!</h2>
                <p className="text-2xl mb-1">Score: <span className="text-yellow-400">{score}</span></p>
                <p className="text-lg text-purple-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg"
            >
              {gameState === "menu" ? "🚙 START HUNTING!" : "🔄 TRY AGAIN"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-4 flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <button
            onTouchStart={() => keysRef.current.add("w")}
            onTouchEnd={() => keysRef.current.delete("w")}
            onMouseDown={() => keysRef.current.add("w")}
            onMouseUp={() => keysRef.current.delete("w")}
            className="bg-amber-500/60 hover:bg-amber-500/80 text-white text-xl w-12 h-12 rounded-lg"
          >
            ⬆️
          </button>
          <div className="flex gap-1">
            <button
              onTouchStart={() => keysRef.current.add("a")}
              onTouchEnd={() => keysRef.current.delete("a")}
              onMouseDown={() => keysRef.current.add("a")}
              onMouseUp={() => keysRef.current.delete("a")}
              className="bg-amber-500/60 hover:bg-amber-500/80 text-white text-xl w-12 h-12 rounded-lg"
            >
              ⬅️
            </button>
            <button
              onTouchStart={() => keysRef.current.add("s")}
              onTouchEnd={() => keysRef.current.delete("s")}
              onMouseDown={() => keysRef.current.add("s")}
              onMouseUp={() => keysRef.current.delete("s")}
              className="bg-amber-500/60 hover:bg-amber-500/80 text-white text-xl w-12 h-12 rounded-lg"
            >
              ⬇️
            </button>
            <button
              onTouchStart={() => keysRef.current.add("d")}
              onTouchEnd={() => keysRef.current.delete("d")}
              onMouseDown={() => keysRef.current.add("d")}
              onMouseUp={() => keysRef.current.delete("d")}
              className="bg-amber-500/60 hover:bg-amber-500/80 text-white text-xl w-12 h-12 rounded-lg"
            >
              ➡️
            </button>
          </div>
        </div>
        <button
          onClick={shoot}
          className="bg-red-500 hover:bg-red-600 text-white text-2xl w-20 h-20 rounded-full font-bold shadow-lg"
        >
          🔫
        </button>
      </div>

      <p className="text-white/60 mt-3 text-center text-sm">
        Drive with WASD or Arrow keys • Shoot with SPACE or Click!
      </p>
    </div>
  );
}

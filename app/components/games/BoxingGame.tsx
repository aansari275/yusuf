"use client";

import { useState, useEffect, useRef } from "react";

interface Enemy {
  health: number;
  maxHealth: number;
  name: string;
  emoji: string;
  isAttacking: boolean;
  attackTimer: number;
}

const enemies: Omit<Enemy, "isAttacking" | "attackTimer">[] = [
  { health: 50, maxHealth: 50, name: "Rookie Ron", emoji: "🥊" },
  { health: 80, maxHealth: 80, name: "Mean Mike", emoji: "😤" },
  { health: 120, maxHealth: 120, name: "Angry Andy", emoji: "😠" },
  { health: 180, maxHealth: 180, name: "Brutal Bob", emoji: "👿" },
  { health: 250, maxHealth: 250, name: "Champion Carl", emoji: "🏆" },
  { health: 350, maxHealth: 350, name: "Boss Barry", emoji: "👹" },
  { health: 500, maxHealth: 500, name: "Final Fred", emoji: "💀" },
];

export default function BoxingGame() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover" | "victory">("menu");
  const [playerHealth, setPlayerHealth] = useState(100);
  const [maxPlayerHealth, setMaxPlayerHealth] = useState(100);
  const [level, setLevel] = useState(0);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [isPunching, setIsPunching] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [message, setMessage] = useState("");
  const gameLoopRef = useRef<number>();

  const startGame = () => {
    setGameState("playing");
    setPlayerHealth(100);
    setMaxPlayerHealth(100);
    setLevel(0);
    setCombo(0);
    setScore(0);
    setMessage("");
    loadEnemy(0);
  };

  const loadEnemy = (idx: number) => {
    if (idx >= enemies.length) {
      setGameState("victory");
      return;
    }
    const e = enemies[idx];
    setEnemy({
      ...e,
      health: e.maxHealth,
      isAttacking: false,
      attackTimer: 0,
    });
    setMessage(`${e.name} enters the ring!`);
    setTimeout(() => setMessage(""), 2000);
  };

  const punch = () => {
    if (gameState !== "playing" || !enemy || isPunching) return;

    setIsPunching(true);
    setTimeout(() => setIsPunching(false), 150);

    if (enemy.isAttacking && !isBlocking) {
      // Got hit while punching
      return;
    }

    const damage = 10 + Math.floor(combo / 3) * 5 + Math.floor(Math.random() * 10);
    const critical = Math.random() < 0.15;
    const actualDamage = critical ? damage * 2 : damage;

    setEnemy(prev => {
      if (!prev) return prev;
      const newHealth = Math.max(0, prev.health - actualDamage);
      if (newHealth === 0) {
        // Enemy defeated
        setScore(s => s + prev.maxHealth * 10);
        setCombo(0);
        setMaxPlayerHealth(h => h + 10);
        setPlayerHealth(h => Math.min(maxPlayerHealth + 10, h + 30));
        setLevel(l => {
          const newLevel = l + 1;
          setTimeout(() => loadEnemy(newLevel), 1500);
          return newLevel;
        });
        setMessage(`${prev.name} is KO'd! 🎉`);
        return { ...prev, health: 0 };
      }
      return { ...prev, health: newHealth };
    });

    setEnemyHit(true);
    setTimeout(() => setEnemyHit(false), 200);
    setCombo(c => c + 1);
    setMessage(critical ? "💥 CRITICAL HIT!" : `POW! -${actualDamage}`);
    setTimeout(() => setMessage(""), 500);
  };

  const block = (blocking: boolean) => {
    setIsBlocking(blocking);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "z") {
        e.preventDefault();
        if (gameState === "playing") punch();
        else startGame();
      }
      if (e.key === "x" || e.key === "Shift") {
        block(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "x" || e.key === "Shift") {
        block(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, enemy, isPunching, isBlocking]);

  useEffect(() => {
    if (gameState !== "playing" || !enemy || enemy.health === 0) return;

    const gameLoop = () => {
      setEnemy(prev => {
        if (!prev) return prev;
        let newTimer = prev.attackTimer + 1;
        const attackSpeed = 80 - level * 5;

        if (newTimer >= attackSpeed && !prev.isAttacking) {
          // Start attack
          return { ...prev, isAttacking: true, attackTimer: 0 };
        }

        if (prev.isAttacking && newTimer >= 30) {
          // Execute attack
          if (!isBlocking) {
            const damage = 10 + level * 5 + Math.floor(Math.random() * 10);
            setPlayerHealth(h => {
              const newHealth = h - damage;
              if (newHealth <= 0) {
                setGameState("gameover");
                return 0;
              }
              return newHealth;
            });
            setPlayerHit(true);
            setTimeout(() => setPlayerHit(false), 200);
            setCombo(0);
            setMessage(`OOF! -${damage}`);
          } else {
            setMessage("🛡️ BLOCKED!");
          }
          setTimeout(() => setMessage(""), 500);
          return { ...prev, isAttacking: false, attackTimer: 0 };
        }

        return { ...prev, attackTimer: newTimer };
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, enemy?.health, level, isBlocking]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[350px] mb-4 text-white">
        <div className="text-lg">🏆 Score: <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">🔥 Combo: <span className="font-bold text-orange-400">{combo}</span></div>
        <div className="text-lg">⭐ Round: <span className="font-bold text-green-400">{level + 1}</span></div>
      </div>

      <div
        className="relative bg-gradient-to-b from-red-900 via-red-800 to-gray-900 rounded-xl overflow-hidden"
        style={{ width: 350, height: 500 }}
      >
        {/* Boxing ring ropes */}
        <div className="absolute top-20 left-0 right-0 h-2 bg-red-500" />
        <div className="absolute top-40 left-0 right-0 h-2 bg-white" />
        <div className="absolute top-60 left-0 right-0 h-2 bg-blue-500" />

        {/* Enemy Health Bar */}
        {enemy && (
          <div className="absolute top-4 left-4 right-4">
            <div className="flex justify-between mb-1">
              <span className="text-white font-bold">{enemy.name}</span>
              <span className="text-white">{enemy.health}/{enemy.maxHealth}</span>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
                style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Enemy */}
        {enemy && (
          <div className={`absolute top-28 left-1/2 -translate-x-1/2 transition-all duration-100 ${enemyHit ? "scale-90 rotate-12" : ""} ${enemy.isAttacking ? "translate-y-8 scale-110" : ""}`}>
            <div className="text-8xl">{enemy.emoji}</div>
            {enemy.isAttacking && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-4xl animate-pulse">👊</div>
            )}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-black text-yellow-400 animate-bounce drop-shadow-lg">
            {message}
          </div>
        )}

        {/* Player */}
        <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 transition-all duration-100 ${playerHit ? "scale-90 -rotate-12 text-red-400" : ""} ${isPunching ? "-translate-y-4" : ""}`}>
          <div className="text-7xl">{isBlocking ? "🛡️" : "🥊"}</div>
          {isPunching && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl">💥</div>
          )}
        </div>

        {/* Player Health Bar */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex justify-between mb-1">
            <span className="text-white font-bold">YUSUF</span>
            <span className="text-white">{playerHealth}/{maxPlayerHealth}</span>
          </div>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-200"
              style={{ width: `${(playerHealth / maxPlayerHealth) * 100}%` }}
            />
          </div>
        </div>

        {/* Menu/Game Over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
            {gameState === "menu" && (
              <>
                <div className="text-6xl mb-4">🥊</div>
                <h2 className="text-3xl font-black mb-2">PUNCH MASTER</h2>
                <p className="mb-4 text-gray-300">Beat all 7 fighters!</p>
                <p className="text-sm mb-4">SPACE to punch, SHIFT to block</p>
              </>
            )}
            {gameState === "gameover" && (
              <>
                <div className="text-6xl mb-4">😵</div>
                <h2 className="text-3xl font-black mb-2 text-red-400">KNOCKED OUT!</h2>
                <p className="text-2xl mb-2">Score: {score}</p>
                <p className="text-lg text-gray-300 mb-4">Made it to Round {level + 1}</p>
              </>
            )}
            {gameState === "victory" && (
              <>
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-black mb-2 text-yellow-400">CHAMPION!</h2>
                <p className="text-2xl mb-2">Score: {score}</p>
                <p className="text-lg text-green-400 mb-4">You beat everyone!</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-red-500 to-orange-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform"
            >
              {gameState === "menu" ? "🥊 FIGHT!" : "🔄 REMATCH"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-4 mt-4">
        <button
          onTouchStart={() => block(true)}
          onTouchEnd={() => block(false)}
          onMouseDown={() => block(true)}
          onMouseUp={() => block(false)}
          className="bg-blue-500/50 hover:bg-blue-500/70 text-white text-2xl px-6 py-4 rounded-full font-bold"
        >
          🛡️ Block
        </button>
        <button
          onClick={punch}
          className="bg-red-500/50 hover:bg-red-500/70 text-white text-2xl px-6 py-4 rounded-full font-bold"
        >
          👊 Punch!
        </button>
      </div>
    </div>
  );
}

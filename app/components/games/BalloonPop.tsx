"use client";

import { useState, useEffect, useRef } from "react";

interface Balloon {
  x: number;
  y: number;
  id: number;
  color: string;
  speed: number;
  size: number;
  popped: boolean;
}

const colors = ["🎈", "🔴", "🟡", "🟢", "🔵", "🟣", "🟠"];

export default function BalloonPop() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [combo, setCombo] = useState(0);
  const [popEffect, setPopEffect] = useState<{ x: number; y: number } | null>(null);
  const gameLoopRef = useRef<number>();
  const balloonIdRef = useRef(0);
  const lastBalloonRef = useRef(0);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    setBalloons([]);
    setCombo(0);
    balloonIdRef.current = 0;
    lastBalloonRef.current = 0;
  };

  const popBalloon = (id: number, x: number, y: number) => {
    if (gameState !== "playing") return;

    setBalloons(prev => {
      const balloon = prev.find(b => b.id === id);
      if (!balloon || balloon.popped) return prev;

      // Score based on size (smaller = more points)
      const points = Math.floor((60 - balloon.size) / 10) * 10 + 10;
      const comboBonus = combo * 5;
      setScore(s => {
        const newScore = s + points + comboBonus;
        if (newScore >= level * 200) {
          setLevel(l => l + 1);
          setTimeLeft(t => Math.min(t + 10, 60));
        }
        return newScore;
      });
      setCombo(c => c + 1);

      setPopEffect({ x, y });
      setTimeout(() => setPopEffect(null), 300);

      return prev.map(b => b.id === id ? { ...b, popped: true } : b);
    });
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    // Timer
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameState("gameover");
          setHighScore(h => Math.max(h, score));
          return 0;
        }
        return t - 1;
      });
      setCombo(0); // Reset combo every second if not clicking
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, score]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      // Spawn balloons
      lastBalloonRef.current++;
      const spawnRate = Math.max(30 - level * 2, 10);
      if (lastBalloonRef.current > spawnRate) {
        const size = 30 + Math.random() * 30;
        setBalloons(prev => [...prev, {
          x: Math.random() * 300 + 25,
          y: 520,
          id: balloonIdRef.current++,
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: 1 + Math.random() * 2 + level * 0.3,
          size,
          popped: false,
        }]);
        lastBalloonRef.current = 0;
      }

      // Move balloons
      setBalloons(prev => prev
        .map(b => ({ ...b, y: b.popped ? b.y : b.y - b.speed }))
        .filter(b => b.y > -100 && !b.popped)
      );

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, level]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[350px] mb-4 text-white">
        <div className="text-lg">🏆 Score: <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">⏱️ Time: <span className={`font-bold ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span></div>
        <div className="text-lg">🔥 Combo: <span className="font-bold text-orange-400">x{combo}</span></div>
      </div>

      <div
        className="relative bg-gradient-to-b from-blue-400 via-blue-300 to-cyan-200 rounded-xl overflow-hidden"
        style={{ width: 350, height: 500 }}
      >
        {/* Clouds */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-70"
            style={{
              top: `${10 + i * 20}%`,
              left: `${(i * 100 + Date.now() / 100) % 400 - 50}px`,
            }}
          >
            ☁️
          </div>
        ))}

        {/* Level indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/50 px-4 py-1 rounded-full">
          <span className="font-bold text-purple-700">Level {level}</span>
        </div>

        {/* Balloons */}
        {balloons.map(balloon => (
          <div
            key={balloon.id}
            className={`absolute cursor-pointer transform hover:scale-110 transition-transform ${balloon.popped ? "scale-150 opacity-0" : ""}`}
            style={{
              left: balloon.x - balloon.size / 2,
              top: balloon.y - balloon.size / 2,
              fontSize: `${balloon.size}px`,
              transition: balloon.popped ? "all 0.2s" : undefined,
            }}
            onClick={() => popBalloon(balloon.id, balloon.x, balloon.y)}
          >
            {balloon.color}
          </div>
        ))}

        {/* Pop effect */}
        {popEffect && (
          <div
            className="absolute pointer-events-none text-3xl animate-ping"
            style={{ left: popEffect.x - 20, top: popEffect.y - 20 }}
          >
            💥
          </div>
        )}

        {/* Menu/Game Over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="text-6xl mb-4 animate-bounce">🎈</div>
                <h2 className="text-3xl font-black mb-2">BALLOON POP</h2>
                <p className="mb-4 text-gray-300">Pop as many as you can!</p>
                <p className="text-sm mb-4">Smaller = More Points!</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-black mb-2 text-yellow-400">TIME&apos;S UP!</h2>
                <p className="text-2xl mb-2">Score: {score}</p>
                <p className="text-lg text-purple-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform"
            >
              {gameState === "menu" ? "🎈 START" : "🔄 PLAY AGAIN"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

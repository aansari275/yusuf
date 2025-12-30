"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Mole {
  id: number;
  type: "normal" | "golden" | "angry";
  visible: boolean;
  whacked: boolean;
  showTime: number;
}

export default function WhackAMole() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [combo, setCombo] = useState(0);
  const [moles, setMoles] = useState<Mole[]>(
    Array(9).fill(null).map((_, i) => ({
      id: i,
      type: "normal",
      visible: false,
      whacked: false,
      showTime: 0,
    }))
  );
  const [hammer, setHammer] = useState<{ x: number; y: number; hitting: boolean }>({
    x: 0,
    y: 0,
    hitting: false,
  });
  const [hitEffects, setHitEffects] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [misses, setMisses] = useState(0);

  const gameLoopRef = useRef<number>();
  const effectIdRef = useRef(0);
  const comboTimerRef = useRef(0);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setTimeLeft(30);
    setCombo(0);
    setMisses(0);
    setMoles(
      Array(9).fill(null).map((_, i) => ({
        id: i,
        type: "normal",
        visible: false,
        whacked: false,
        showTime: 0,
      }))
    );
    setHitEffects([]);
  };

  const whackMole = useCallback((index: number, e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== "playing") return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    setHammer({ x: clientX, y: clientY, hitting: true });
    setTimeout(() => setHammer(h => ({ ...h, hitting: false })), 100);

    setMoles(prev => prev.map((mole, i) => {
      if (i !== index) return mole;

      if (mole.visible && !mole.whacked) {
        // Hit!
        let points = 10;
        let text = "+10";

        if (mole.type === "golden") {
          points = 50;
          text = "+50 ⭐";
        } else if (mole.type === "angry") {
          points = -20;
          text = "-20 😈";
          setCombo(0);
        }

        if (mole.type !== "angry") {
          points = Math.floor(points * (1 + combo * 0.2));
          text = `+${points}`;
          setCombo(c => c + 1);
          comboTimerRef.current = 0;
        }

        setScore(s => Math.max(0, s + points));

        setHitEffects(prev => [...prev, {
          id: effectIdRef.current++,
          x: rect.left + rect.width / 2,
          y: rect.top,
          text,
        }]);

        return { ...mole, whacked: true };
      } else if (!mole.visible) {
        // Miss!
        setMisses(m => m + 1);
        setCombo(0);
      }
      return mole;
    }));
  }, [gameState, combo]);

  // Game timer
  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameState("gameover");
          setHighScore(h => Math.max(h, score));
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, score]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      // Combo decay
      comboTimerRef.current++;
      if (comboTimerRef.current > 60) {
        setCombo(0);
      }

      // Update moles
      setMoles(prev => prev.map(mole => {
        if (mole.visible) {
          // Count down show time
          if (mole.showTime <= 0 || mole.whacked) {
            return { ...mole, visible: false, whacked: false };
          }
          return { ...mole, showTime: mole.showTime - 1 };
        }

        // Random chance to show
        if (Math.random() < 0.02) {
          const rand = Math.random();
          let type: "normal" | "golden" | "angry" = "normal";
          if (rand < 0.05) type = "golden";
          else if (rand < 0.15) type = "angry";

          return {
            ...mole,
            visible: true,
            whacked: false,
            type,
            showTime: type === "golden" ? 30 : type === "angry" ? 50 : 40,
          };
        }
        return mole;
      }));

      // Fade hit effects
      setHitEffects(prev => prev.filter(e => {
        const age = Date.now() - effectIdRef.current;
        return age < 1000;
      }));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState]);

  // Clean up old effects
  useEffect(() => {
    const cleanup = setInterval(() => {
      setHitEffects(prev => prev.slice(-5));
    }, 500);
    return () => clearInterval(cleanup);
  }, []);

  const getMoleEmoji = (mole: Mole) => {
    if (mole.whacked) return "😵";
    switch (mole.type) {
      case "golden": return "🌟";
      case "angry": return "😈";
      default: return "🐹";
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Custom cursor */}
      {hammer.hitting && (
        <div
          className="fixed pointer-events-none z-50 text-4xl animate-ping"
          style={{ left: hammer.x - 20, top: hammer.y - 40 }}
        >
          🔨
        </div>
      )}

      {/* Hit effects */}
      {hitEffects.map(effect => (
        <div
          key={effect.id}
          className="fixed pointer-events-none z-40 text-2xl font-bold text-yellow-400 animate-bounce"
          style={{
            left: effect.x - 30,
            top: effect.y - 30,
            animation: "floatUp 0.5s ease-out forwards",
          }}
        >
          {effect.text}
        </div>
      ))}

      {/* HUD */}
      <div className="flex justify-between w-full max-w-[350px] mb-4 text-white">
        <div className="text-lg">⏱️ <span className={`font-bold ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span></div>
        <div className="text-lg">🏆 <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">🔥 <span className="font-bold text-orange-400">x{combo}</span></div>
        <div className="text-lg">👑 <span className="font-bold text-purple-400">{highScore}</span></div>
      </div>

      {/* Game Area */}
      <div className="relative bg-gradient-to-b from-green-600 to-green-800 rounded-2xl p-6 border-4 border-amber-700">
        {/* Holes grid */}
        <div className="grid grid-cols-3 gap-4">
          {moles.map((mole, index) => (
            <div
              key={index}
              className="relative cursor-pointer"
              onClick={(e) => whackMole(index, e)}
              onTouchStart={(e) => whackMole(index, e)}
            >
              {/* Hole */}
              <div className="w-20 h-16 bg-gradient-to-b from-amber-900 to-amber-950 rounded-full border-4 border-amber-800 flex items-end justify-center overflow-hidden">
                {/* Mole */}
                <div
                  className={`transition-all duration-100 ${
                    mole.visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                  }`}
                >
                  <span
                    className={`text-4xl ${mole.whacked ? "animate-spin" : mole.visible ? "animate-bounce" : ""}`}
                  >
                    {getMoleEmoji(mole)}
                  </span>
                </div>
              </div>
              {/* Hole front */}
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-amber-950 rounded-b-full" />
            </div>
          ))}
        </div>

        {/* Menu / Game Over */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/80 rounded-2xl flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="text-6xl mb-4 animate-bounce">🐹</div>
                <h2 className="text-3xl font-black mb-2 text-amber-400">WHACK-A-MOLE</h2>
                <p className="text-gray-300 mb-2">Tap the moles before they hide!</p>
                <div className="text-sm mb-4 space-y-1">
                  <p>🐹 Normal = +10 points</p>
                  <p>🌟 Golden = +50 points</p>
                  <p>😈 Angry = -20 points!</p>
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">🏆</div>
                <h2 className="text-3xl font-black mb-2 text-yellow-400">TIME&apos;S UP!</h2>
                <p className="text-2xl mb-2">Score: <span className="text-amber-400">{score}</span></p>
                <p className="text-lg text-purple-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg"
            >
              {gameState === "menu" ? "🔨 START!" : "🔄 PLAY AGAIN"}
            </button>
          </div>
        )}
      </div>

      <p className="text-white/60 mt-4 text-center text-sm">
        Tap or click the moles quickly! Build combos for bonus points! 🔥
      </p>

      <style jsx>{`
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-50px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

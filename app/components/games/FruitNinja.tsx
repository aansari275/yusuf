"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Fruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: string;
  sliced: boolean;
  rotation: number;
}

interface SliceLine {
  id: number;
  points: { x: number; y: number }[];
  opacity: number;
}

interface SlicedPiece {
  id: number;
  x: number;
  y: number;
  emoji: string;
  vx: number;
  vy: number;
  rotation: number;
}

const FRUITS = ["🍎", "🍊", "🍋", "🍇", "🍓", "🍑", "🥝", "🍌", "🍉", "🥭"];
const BOMB = "💣";

export default function FruitNinja() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [sliceLines, setSliceLines] = useState<SliceLine[]>([]);
  const [slicedPieces, setSlicedPieces] = useState<SlicedPiece[]>([]);
  const [isSlicing, setIsSlicing] = useState(false);
  const [currentSlice, setCurrentSlice] = useState<{ x: number; y: number }[]>([]);
  const [shake, setShake] = useState(false);
  const [frenzy, setFrenzy] = useState(false);

  const gameRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();
  const fruitIdRef = useRef(0);
  const pieceIdRef = useRef(0);
  const sliceIdRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const comboTimerRef = useRef(0);

  const GAME_WIDTH = 400;
  const GAME_HEIGHT = 500;

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setFruits([]);
    setSliceLines([]);
    setSlicedPieces([]);
    setFrenzy(false);
    fruitIdRef.current = 0;
    pieceIdRef.current = 0;
    sliceIdRef.current = 0;
    spawnTimerRef.current = 0;
    comboTimerRef.current = 0;
  };

  const spawnFruit = useCallback(() => {
    const isBomb = Math.random() < 0.15; // 15% chance for bomb
    const x = Math.random() * (GAME_WIDTH - 80) + 40;
    const fruit: Fruit = {
      id: fruitIdRef.current++,
      x,
      y: GAME_HEIGHT + 40,
      vx: (Math.random() - 0.5) * 4,
      vy: -(12 + Math.random() * 4),
      type: isBomb ? BOMB : FRUITS[Math.floor(Math.random() * FRUITS.length)],
      sliced: false,
      rotation: 0,
    };
    setFruits(prev => [...prev, fruit]);
  }, []);

  const sliceFruit = useCallback((fruitId: number) => {
    setFruits(prev => prev.map(fruit => {
      if (fruit.id !== fruitId || fruit.sliced) return fruit;

      if (fruit.type === BOMB) {
        // Hit bomb - lose a life
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameState("gameover");
            setHighScore(h => Math.max(h, score));
          }
          return newLives;
        });
        setShake(true);
        setTimeout(() => setShake(false), 300);
        setCombo(0);
        return { ...fruit, sliced: true };
      }

      // Slice fruit!
      const points = frenzy ? 3 : 1;
      setScore(s => s + points * (1 + Math.floor(combo / 3)));
      setCombo(c => {
        const newCombo = c + 1;
        setMaxCombo(m => Math.max(m, newCombo));
        if (newCombo >= 5 && !frenzy) {
          setFrenzy(true);
          setTimeout(() => setFrenzy(false), 3000);
        }
        return newCombo;
      });
      comboTimerRef.current = 0;

      // Create sliced pieces
      setSlicedPieces(pieces => [
        ...pieces,
        {
          id: pieceIdRef.current++,
          x: fruit.x,
          y: fruit.y,
          emoji: fruit.type,
          vx: -3 - Math.random() * 2,
          vy: fruit.vy * 0.5,
          rotation: -180,
        },
        {
          id: pieceIdRef.current++,
          x: fruit.x,
          y: fruit.y,
          emoji: fruit.type,
          vx: 3 + Math.random() * 2,
          vy: fruit.vy * 0.5,
          rotation: 180,
        },
      ]);

      return { ...fruit, sliced: true };
    }));
  }, [combo, frenzy, score]);

  // Mouse/Touch handlers
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = gameRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== "playing") return;
    setIsSlicing(true);
    const pos = getPos(e);
    setCurrentSlice([pos]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSlicing || gameState !== "playing") return;
    const pos = getPos(e);
    setCurrentSlice(prev => [...prev.slice(-10), pos]);

    // Check collision with fruits
    fruits.forEach(fruit => {
      if (fruit.sliced) return;
      const dx = pos.x - fruit.x;
      const dy = pos.y - fruit.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 40) {
        sliceFruit(fruit.id);
      }
    });
  };

  const handleEnd = () => {
    if (currentSlice.length > 1) {
      setSliceLines(prev => [...prev, {
        id: sliceIdRef.current++,
        points: [...currentSlice],
        opacity: 1,
      }]);
    }
    setIsSlicing(false);
    setCurrentSlice([]);
  };

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      // Spawn fruits
      spawnTimerRef.current++;
      if (spawnTimerRef.current > 40) {
        const count = frenzy ? 3 : Math.random() > 0.7 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          setTimeout(() => spawnFruit(), i * 150);
        }
        spawnTimerRef.current = 0;
      }

      // Combo timer
      comboTimerRef.current++;
      if (comboTimerRef.current > 60) {
        setCombo(0);
      }

      // Update fruits
      setFruits(prev => {
        return prev.map(fruit => ({
          ...fruit,
          x: fruit.x + fruit.vx,
          y: fruit.y + fruit.vy,
          vy: fruit.vy + 0.3, // gravity
          rotation: fruit.rotation + 5,
        })).filter(fruit => {
          // Miss penalty for unsliced fruits falling off screen
          if (!fruit.sliced && fruit.y > GAME_HEIGHT + 50 && fruit.type !== BOMB) {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameState("gameover");
                setHighScore(h => Math.max(h, score));
              }
              return newLives;
            });
            setCombo(0);
            return false;
          }
          return fruit.y < GAME_HEIGHT + 100;
        });
      });

      // Update sliced pieces
      setSlicedPieces(prev => prev.map(piece => ({
        ...piece,
        x: piece.x + piece.vx,
        y: piece.y + piece.vy,
        vy: piece.vy + 0.4,
        rotation: piece.rotation + (piece.vx > 0 ? 10 : -10),
      })).filter(piece => piece.y < GAME_HEIGHT + 100));

      // Fade slice lines
      setSliceLines(prev => prev.map(line => ({
        ...line,
        opacity: line.opacity - 0.05,
      })).filter(line => line.opacity > 0));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, frenzy, score, spawnFruit]);

  return (
    <div className="flex flex-col items-center">
      {/* HUD */}
      <div className="flex justify-between w-full max-w-[400px] mb-3 text-white">
        <div className="text-lg">
          ❤️ {[...Array(3)].map((_, i) => (
            <span key={i} className={i < lives ? "opacity-100" : "opacity-30"}>❤️</span>
          ))}
        </div>
        <div className="text-lg">🏆 <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">👑 <span className="font-bold text-purple-400">{highScore}</span></div>
      </div>

      {/* Combo indicator */}
      {combo > 0 && (
        <div className={`mb-2 text-xl font-bold ${frenzy ? "text-yellow-400 animate-pulse" : "text-orange-400"}`}>
          {frenzy ? "🔥 FRENZY MODE! 🔥" : `${combo}x COMBO!`}
        </div>
      )}

      {/* Game Area */}
      <div
        ref={gameRef}
        className={`relative overflow-hidden rounded-2xl border-4 border-amber-700 cursor-crosshair select-none ${shake ? "animate-pulse" : ""}`}
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT, touchAction: "none" }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {/* Background */}
        <div className={`absolute inset-0 transition-colors duration-300 ${
          frenzy
            ? "bg-gradient-to-b from-red-900 via-orange-900 to-yellow-900"
            : "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
        }`} />

        {/* Wood pattern at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-900 to-amber-800 opacity-50" />

        {/* Slice lines */}
        {sliceLines.map(line => (
          <svg
            key={line.id}
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: line.opacity }}
          >
            <polyline
              points={line.points.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 8px white)"
            />
          </svg>
        ))}

        {/* Current slice */}
        {currentSlice.length > 1 && (
          <svg className="absolute inset-0 pointer-events-none">
            <polyline
              points={currentSlice.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 12px white)"
            />
          </svg>
        )}

        {/* Fruits */}
        {fruits.filter(f => !f.sliced).map(fruit => (
          <div
            key={fruit.id}
            className="absolute text-5xl"
            style={{
              left: fruit.x - 25,
              top: fruit.y - 25,
              transform: `rotate(${fruit.rotation}deg)`,
            }}
          >
            {fruit.type}
          </div>
        ))}

        {/* Sliced pieces */}
        {slicedPieces.map(piece => (
          <div
            key={piece.id}
            className="absolute text-4xl opacity-70"
            style={{
              left: piece.x - 20,
              top: piece.y - 20,
              transform: `rotate(${piece.rotation}deg) scale(0.8)`,
            }}
          >
            {piece.emoji}
          </div>
        ))}

        {/* Menu / Game Over */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20">
            {gameState === "menu" ? (
              <>
                <div className="text-6xl mb-2 animate-bounce">🍉</div>
                <div className="text-4xl mb-2">🗡️</div>
                <h2 className="text-3xl font-black mb-2 text-orange-400">FRUIT NINJA</h2>
                <p className="text-gray-300 mb-2">Swipe to slice the fruits!</p>
                <p className="text-sm text-red-400 mb-4">⚠️ Avoid the bombs! 💣</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-black mb-2 text-yellow-400">GAME OVER!</h2>
                <p className="text-2xl mb-1">Score: <span className="text-orange-400">{score}</span></p>
                <p className="text-lg text-cyan-400 mb-1">Max Combo: {maxCombo}x</p>
                <p className="text-lg text-purple-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg"
            >
              {gameState === "menu" ? "🗡️ START SLICING!" : "🔄 PLAY AGAIN"}
            </button>
          </div>
        )}
      </div>

      <p className="text-white/60 mt-4 text-center text-sm">
        Swipe across fruits to slice them! Don&apos;t miss any and avoid bombs! 💣
      </p>
    </div>
  );
}

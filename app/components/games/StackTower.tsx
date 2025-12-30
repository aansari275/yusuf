"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Block {
  id: number;
  x: number;
  width: number;
  y: number;
  color: string;
  falling: boolean;
  cutOff: boolean;
}

const COLORS = [
  "from-red-500 to-red-600",
  "from-orange-500 to-orange-600",
  "from-yellow-500 to-yellow-600",
  "from-green-500 to-green-600",
  "from-cyan-500 to-cyan-600",
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-pink-500 to-pink-600",
];

export default function StackTower() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [direction, setDirection] = useState(1);
  const [speed, setSpeed] = useState(3);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [showPerfect, setShowPerfect] = useState(false);
  const [cameraY, setCameraY] = useState(0);

  const gameLoopRef = useRef<number>();
  const blockIdRef = useRef(0);

  const GAME_WIDTH = 300;
  const GAME_HEIGHT = 500;
  const BLOCK_HEIGHT = 25;
  const INITIAL_WIDTH = 100;

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setPerfectStreak(0);
    setSpeed(3);
    setCameraY(0);
    blockIdRef.current = 0;

    // Base block
    const baseBlock: Block = {
      id: blockIdRef.current++,
      x: GAME_WIDTH / 2 - INITIAL_WIDTH / 2,
      width: INITIAL_WIDTH,
      y: GAME_HEIGHT - BLOCK_HEIGHT - 50,
      color: COLORS[0],
      falling: false,
      cutOff: false,
    };

    setBlocks([baseBlock]);

    // First moving block
    const firstBlock: Block = {
      id: blockIdRef.current++,
      x: 0,
      width: INITIAL_WIDTH,
      y: GAME_HEIGHT - BLOCK_HEIGHT * 2 - 50,
      color: COLORS[1],
      falling: false,
      cutOff: false,
    };
    setCurrentBlock(firstBlock);
    setDirection(1);
  };

  const placeBlock = useCallback(() => {
    if (gameState !== "playing" || !currentBlock) return;

    const lastBlock = blocks[blocks.length - 1];

    // Calculate overlap
    const overlapStart = Math.max(currentBlock.x, lastBlock.x);
    const overlapEnd = Math.min(currentBlock.x + currentBlock.width, lastBlock.x + lastBlock.width);
    const overlapWidth = overlapEnd - overlapStart;

    if (overlapWidth <= 0) {
      // Missed completely - game over
      setCurrentBlock({ ...currentBlock, falling: true });
      setTimeout(() => {
        setGameState("gameover");
        setHighScore(h => Math.max(h, score));
      }, 500);
      return;
    }

    // Calculate if it's a perfect placement
    const isPerfect = Math.abs(currentBlock.x - lastBlock.x) < 5;

    if (isPerfect) {
      setPerfectStreak(p => p + 1);
      setShowPerfect(true);
      setTimeout(() => setShowPerfect(false), 500);
    } else {
      setPerfectStreak(0);
    }

    // Add the placed block
    const newWidth = isPerfect ? currentBlock.width : overlapWidth;
    const newX = isPerfect ? lastBlock.x : overlapStart;

    const placedBlock: Block = {
      ...currentBlock,
      x: newX,
      width: newWidth,
      falling: false,
    };

    // Add cut-off piece if not perfect
    if (!isPerfect && currentBlock.x < lastBlock.x) {
      // Cut off from left
      setBlocks(prev => [...prev, placedBlock, {
        id: blockIdRef.current++,
        x: currentBlock.x,
        width: lastBlock.x - currentBlock.x,
        y: currentBlock.y,
        color: currentBlock.color,
        falling: true,
        cutOff: true,
      }]);
    } else if (!isPerfect) {
      // Cut off from right
      setBlocks(prev => [...prev, placedBlock, {
        id: blockIdRef.current++,
        x: overlapEnd,
        width: (currentBlock.x + currentBlock.width) - overlapEnd,
        y: currentBlock.y,
        color: currentBlock.color,
        falling: true,
        cutOff: true,
      }]);
    } else {
      setBlocks(prev => [...prev, placedBlock]);
    }

    setScore(s => s + 1 + (isPerfect ? perfectStreak : 0));

    // Check for game over (block too small)
    if (newWidth < 10) {
      setGameState("gameover");
      setHighScore(h => Math.max(h, score + 1));
      return;
    }

    // Spawn next block
    const nextY = currentBlock.y - BLOCK_HEIGHT;
    const newBlock: Block = {
      id: blockIdRef.current++,
      x: direction > 0 ? -newWidth : GAME_WIDTH,
      width: newWidth,
      y: nextY,
      color: COLORS[(score + 2) % COLORS.length],
      falling: false,
      cutOff: false,
    };

    setCurrentBlock(newBlock);
    setDirection(d => -d);
    setSpeed(s => Math.min(s + 0.1, 8));

    // Move camera up
    if (score > 5) {
      setCameraY(c => c + BLOCK_HEIGHT);
    }
  }, [gameState, currentBlock, blocks, score, direction, perfectStreak]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        if (gameState === "playing") {
          placeBlock();
        } else {
          startGame();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, placeBlock]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      // Move current block
      if (currentBlock && !currentBlock.falling) {
        setCurrentBlock(prev => {
          if (!prev) return prev;
          let newX = prev.x + speed * direction;

          // Bounce off walls
          if (newX + prev.width > GAME_WIDTH) {
            newX = GAME_WIDTH - prev.width;
            setDirection(-1);
          } else if (newX < 0) {
            newX = 0;
            setDirection(1);
          }

          return { ...prev, x: newX };
        });
      }

      // Animate falling blocks
      setBlocks(prev => prev.map(block => {
        if (block.falling) {
          return { ...block, y: block.y + 8 };
        }
        return block;
      }).filter(block => block.y < GAME_HEIGHT + 100));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, currentBlock, direction, speed]);

  const handleClick = () => {
    if (gameState === "playing") {
      placeBlock();
    } else {
      startGame();
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* HUD */}
      <div className="flex justify-between w-full max-w-[300px] mb-4 text-white">
        <div className="text-lg">🏗️ <span className="font-bold text-yellow-400">{score}</span></div>
        {perfectStreak > 0 && (
          <div className="text-lg text-green-400 font-bold animate-pulse">
            🔥 x{perfectStreak}
          </div>
        )}
        <div className="text-lg">👑 <span className="font-bold text-purple-400">{highScore}</span></div>
      </div>

      {/* Perfect indicator */}
      {showPerfect && (
        <div className="text-2xl font-black text-green-400 animate-bounce mb-2">
          ✨ PERFECT! ✨
        </div>
      )}

      {/* Game Area */}
      <div
        className="relative overflow-hidden rounded-2xl border-4 border-gray-600 cursor-pointer"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onClick={handleClick}
      >
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200" />

        {/* Clouds */}
        <div className="absolute text-4xl opacity-50" style={{ top: 50 + cameraY * 0.2, left: 20 }}>☁️</div>
        <div className="absolute text-3xl opacity-40" style={{ top: 120 + cameraY * 0.3, left: 200 }}>☁️</div>
        <div className="absolute text-5xl opacity-30" style={{ top: 200 + cameraY * 0.4, left: 100 }}>☁️</div>

        {/* Ground */}
        <div
          className="absolute left-0 right-0 bg-gradient-to-t from-green-700 to-green-500"
          style={{ top: GAME_HEIGHT - 50 + cameraY, height: 100 }}
        />

        {/* Placed blocks */}
        {blocks.map(block => (
          <div
            key={block.id}
            className={`absolute bg-gradient-to-r ${block.color} border-2 border-white/30 transition-all ${
              block.falling ? "opacity-70" : ""
            }`}
            style={{
              left: block.x,
              top: block.y + cameraY,
              width: block.width,
              height: BLOCK_HEIGHT,
            }}
          />
        ))}

        {/* Current moving block */}
        {currentBlock && (
          <div
            className={`absolute bg-gradient-to-r ${currentBlock.color} border-2 border-white/30 ${
              currentBlock.falling ? "opacity-70" : ""
            }`}
            style={{
              left: currentBlock.x,
              top: currentBlock.y + cameraY,
              width: currentBlock.width,
              height: BLOCK_HEIGHT,
              boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
            }}
          />
        )}

        {/* Guide line */}
        {gameState === "playing" && blocks.length > 0 && (
          <div
            className="absolute border-l-2 border-dashed border-white/30"
            style={{
              left: blocks[blocks.length - 1].x,
              top: 0,
              height: GAME_HEIGHT,
            }}
          />
        )}

        {/* Menu / Game Over */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="flex flex-col items-center gap-1 mb-4">
                  <div className="w-16 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded" />
                  <div className="w-14 h-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded" />
                  <div className="w-12 h-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded" />
                </div>
                <h2 className="text-3xl font-black mb-2 text-cyan-400">STACK TOWER</h2>
                <p className="text-gray-300 mb-4 text-center text-sm px-4">
                  Tap to stack blocks! Build the tallest tower!
                </p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">🏗️</div>
                <h2 className="text-3xl font-black mb-2 text-yellow-400">TOWER COMPLETE!</h2>
                <p className="text-2xl mb-2">Height: <span className="text-cyan-400">{score}</span></p>
                <p className="text-lg text-purple-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg"
            >
              {gameState === "menu" ? "🏗️ BUILD!" : "🔄 AGAIN"}
            </button>
          </div>
        )}
      </div>

      <p className="text-white/60 mt-4 text-center text-sm">
        Tap or press SPACE to place blocks! Perfect placements = bonus points! 🔥
      </p>
    </div>
  );
}

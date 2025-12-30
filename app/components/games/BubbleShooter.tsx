"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Bubble {
  row: number;
  col: number;
  color: string;
  popping: boolean;
}

interface FlyingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

const BUBBLE_COLORS = ["🔴", "🟢", "🔵", "🟡", "🟣", "🟠"];
const COLORS_HEX = ["#EF4444", "#22C55E", "#3B82F6", "#EAB308", "#A855F7", "#F97316"];

export default function BubbleShooter() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover" | "won">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [bubbles, setBubbles] = useState<(Bubble | null)[][]>([]);
  const [currentBubble, setCurrentBubble] = useState(0);
  const [nextBubble, setNextBubble] = useState(1);
  const [angle, setAngle] = useState(Math.PI / 2);
  const [flyingBubble, setFlyingBubble] = useState<FlyingBubble | null>(null);
  const [poppingBubbles, setPoppingBubbles] = useState<{ x: number; y: number; color: string }[]>([]);

  const gameRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();

  const GAME_WIDTH = 320;
  const GAME_HEIGHT = 450;
  const BUBBLE_SIZE = 32;
  const ROWS = 8;
  const COLS = 10;
  const SHOOTER_Y = GAME_HEIGHT - 50;

  const createInitialBubbles = (): (Bubble | null)[][] => {
    const grid: (Bubble | null)[][] = [];
    for (let row = 0; row < ROWS; row++) {
      const rowBubbles: (Bubble | null)[] = [];
      const offset = row % 2 === 1 ? 0.5 : 0;
      for (let col = 0; col < COLS - (row % 2); col++) {
        if (row < 5) {
          rowBubbles.push({
            row,
            col,
            color: BUBBLE_COLORS[Math.floor(Math.random() * 4)], // Start with fewer colors
            popping: false,
          });
        } else {
          rowBubbles.push(null);
        }
      }
      grid.push(rowBubbles);
    }
    return grid;
  };

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setBubbles(createInitialBubbles());
    setCurrentBubble(Math.floor(Math.random() * 4));
    setNextBubble(Math.floor(Math.random() * 4));
    setFlyingBubble(null);
    setAngle(Math.PI / 2);
  };

  const shoot = useCallback(() => {
    if (gameState !== "playing" || flyingBubble) return;

    const shooterX = GAME_WIDTH / 2;
    const speed = 12;

    setFlyingBubble({
      x: shooterX,
      y: SHOOTER_Y - BUBBLE_SIZE / 2,
      vx: Math.cos(angle) * speed,
      vy: -Math.sin(angle) * speed,
      color: BUBBLE_COLORS[currentBubble],
    });

    setCurrentBubble(nextBubble);
    setNextBubble(Math.floor(Math.random() * BUBBLE_COLORS.length));
  }, [gameState, flyingBubble, angle, currentBubble, nextBubble]);

  const findConnectedBubbles = useCallback((grid: (Bubble | null)[][], row: number, col: number, color: string, visited: Set<string> = new Set()): { row: number; col: number }[] => {
    const key = `${row}-${col}`;
    if (visited.has(key)) return [];
    if (row < 0 || row >= grid.length) return [];
    if (col < 0 || col >= grid[row].length) return [];
    const bubble = grid[row][col];
    if (!bubble || bubble.color !== color) return [];

    visited.add(key);
    const connected = [{ row, col }];

    // Check neighbors (hexagonal grid)
    const isOddRow = row % 2 === 1;
    const neighbors = [
      [row - 1, col - (isOddRow ? 0 : 1)],
      [row - 1, col + (isOddRow ? 1 : 0)],
      [row, col - 1],
      [row, col + 1],
      [row + 1, col - (isOddRow ? 0 : 1)],
      [row + 1, col + (isOddRow ? 1 : 0)],
    ];

    for (const [nRow, nCol] of neighbors) {
      connected.push(...findConnectedBubbles(grid, nRow, nCol, color, visited));
    }

    return connected;
  }, []);

  const removeFloatingBubbles = useCallback((grid: (Bubble | null)[][]): { grid: (Bubble | null)[][]; removed: number } => {
    // Find all bubbles connected to top
    const connected = new Set<string>();

    for (let col = 0; col < grid[0].length; col++) {
      if (grid[0][col]) {
        const stack: { row: number; col: number }[] = [{ row: 0, col }];
        while (stack.length > 0) {
          const { row, col } = stack.pop()!;
          const key = `${row}-${col}`;
          if (connected.has(key)) continue;
          if (row < 0 || row >= grid.length) continue;
          if (col < 0 || col >= grid[row].length) continue;
          if (!grid[row][col]) continue;

          connected.add(key);

          const isOddRow = row % 2 === 1;
          const neighbors = [
            [row - 1, col - (isOddRow ? 0 : 1)],
            [row - 1, col + (isOddRow ? 1 : 0)],
            [row, col - 1],
            [row, col + 1],
            [row + 1, col - (isOddRow ? 0 : 1)],
            [row + 1, col + (isOddRow ? 1 : 0)],
          ];

          for (const [nRow, nCol] of neighbors) {
            stack.push({ row: nRow, col: nCol });
          }
        }
      }
    }

    // Remove floating bubbles
    let removed = 0;
    const newGrid = grid.map((row, rowIndex) =>
      row.map((bubble, colIndex) => {
        if (bubble && !connected.has(`${rowIndex}-${colIndex}`)) {
          removed++;
          return null;
        }
        return bubble;
      })
    );

    return { grid: newGrid, removed };
  }, []);

  // Mouse/Touch controls for aiming
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== "playing" || flyingBubble) return;
    const rect = gameRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left - GAME_WIDTH / 2;
    const y = SHOOTER_Y - (clientY - rect.top);

    const newAngle = Math.atan2(y, x);
    // Clamp angle
    const clampedAngle = Math.max(0.2, Math.min(Math.PI - 0.2, newAngle));
    setAngle(clampedAngle);
  };

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      if (flyingBubble) {
        setFlyingBubble(prev => {
          if (!prev) return null;

          let newX = prev.x + prev.vx;
          let newY = prev.y + prev.vy;
          let newVx = prev.vx;

          // Wall bounce
          if (newX < BUBBLE_SIZE / 2 || newX > GAME_WIDTH - BUBBLE_SIZE / 2) {
            newVx = -newVx;
            newX = Math.max(BUBBLE_SIZE / 2, Math.min(GAME_WIDTH - BUBBLE_SIZE / 2, newX));
          }

          // Check collision with existing bubbles
          for (let row = 0; row < bubbles.length; row++) {
            for (let col = 0; col < bubbles[row].length; col++) {
              const bubble = bubbles[row][col];
              if (!bubble) continue;

              const offset = row % 2 === 1 ? BUBBLE_SIZE / 2 : 0;
              const bubbleX = col * BUBBLE_SIZE + BUBBLE_SIZE / 2 + offset;
              const bubbleY = row * BUBBLE_SIZE * 0.85 + BUBBLE_SIZE / 2;

              const dx = newX - bubbleX;
              const dy = newY - bubbleY;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < BUBBLE_SIZE * 0.9) {
                // Snap to grid
                const snapRow = Math.round((newY - BUBBLE_SIZE / 2) / (BUBBLE_SIZE * 0.85));
                const snapOffset = snapRow % 2 === 1 ? BUBBLE_SIZE / 2 : 0;
                const snapCol = Math.round((newX - BUBBLE_SIZE / 2 - snapOffset) / BUBBLE_SIZE);

                const clampedRow = Math.max(0, Math.min(bubbles.length - 1, snapRow));
                const clampedCol = Math.max(0, Math.min(bubbles[clampedRow].length - 1, snapCol));

                // Add bubble to grid
                setBubbles(grid => {
                  const newGrid = grid.map(r => [...r]);
                  if (!newGrid[clampedRow][clampedCol]) {
                    newGrid[clampedRow][clampedCol] = {
                      row: clampedRow,
                      col: clampedCol,
                      color: prev.color,
                      popping: false,
                    };

                    // Find matches
                    const matches = findConnectedBubbles(newGrid, clampedRow, clampedCol, prev.color);

                    if (matches.length >= 3) {
                      // Pop matched bubbles
                      for (const { row, col } of matches) {
                        if (newGrid[row][col]) {
                          newGrid[row][col] = null;
                        }
                      }
                      setScore(s => s + matches.length * 10);

                      // Remove floating bubbles
                      const { grid: cleanedGrid, removed } = removeFloatingBubbles(newGrid);
                      setScore(s => s + removed * 20);
                      return cleanedGrid;
                    }
                  }

                  // Check win condition
                  const hasNoBubbles = newGrid.every(row => row.every(b => b === null));
                  if (hasNoBubbles) {
                    setGameState("won");
                    setHighScore(h => Math.max(h, score));
                  }

                  // Check lose condition (bubbles too low)
                  for (let r = bubbles.length - 2; r < bubbles.length; r++) {
                    for (const b of newGrid[r]) {
                      if (b) {
                        setGameState("gameover");
                        setHighScore(h => Math.max(h, score));
                        break;
                      }
                    }
                  }

                  return newGrid;
                });

                return null;
              }
            }
          }

          // Top collision
          if (newY < BUBBLE_SIZE / 2) {
            const snapCol = Math.round((newX - BUBBLE_SIZE / 2) / BUBBLE_SIZE);
            const clampedCol = Math.max(0, Math.min(bubbles[0].length - 1, snapCol));

            setBubbles(grid => {
              const newGrid = grid.map(r => [...r]);
              if (!newGrid[0][clampedCol]) {
                newGrid[0][clampedCol] = {
                  row: 0,
                  col: clampedCol,
                  color: prev.color,
                  popping: false,
                };
              }
              return newGrid;
            });
            return null;
          }

          return { ...prev, x: newX, y: newY, vx: newVx };
        });
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, flyingBubble, bubbles, score, findConnectedBubbles, removeFloatingBubbles]);

  return (
    <div className="flex flex-col items-center">
      {/* HUD */}
      <div className="flex justify-between w-full max-w-[320px] mb-3 text-white">
        <div className="text-lg">🏆 <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">👑 <span className="font-bold text-purple-400">{highScore}</span></div>
      </div>

      {/* Game Area */}
      <div
        ref={gameRef}
        className="relative overflow-hidden rounded-2xl border-4 border-blue-600 cursor-crosshair"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onClick={shoot}
        onTouchEnd={shoot}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-blue-900" />

        {/* Grid bubbles */}
        {bubbles.map((row, rowIndex) =>
          row.map((bubble, colIndex) => {
            if (!bubble) return null;
            const offset = rowIndex % 2 === 1 ? BUBBLE_SIZE / 2 : 0;
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="absolute text-2xl transition-all"
                style={{
                  left: colIndex * BUBBLE_SIZE + offset,
                  top: rowIndex * BUBBLE_SIZE * 0.85,
                }}
              >
                {bubble.color}
              </div>
            );
          })
        )}

        {/* Flying bubble */}
        {flyingBubble && (
          <div
            className="absolute text-2xl"
            style={{
              left: flyingBubble.x - BUBBLE_SIZE / 2,
              top: flyingBubble.y - BUBBLE_SIZE / 2,
            }}
          >
            {flyingBubble.color}
          </div>
        )}

        {/* Aim line */}
        {gameState === "playing" && !flyingBubble && (
          <svg className="absolute inset-0 pointer-events-none">
            <line
              x1={GAME_WIDTH / 2}
              y1={SHOOTER_Y}
              x2={GAME_WIDTH / 2 + Math.cos(angle) * 150}
              y2={SHOOTER_Y - Math.sin(angle) * 150}
              stroke="white"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.5"
            />
          </svg>
        )}

        {/* Shooter */}
        <div
          className="absolute flex flex-col items-center"
          style={{ left: GAME_WIDTH / 2 - 40, top: SHOOTER_Y - 20 }}
        >
          {/* Current bubble */}
          <div className="text-3xl" style={{ transform: `rotate(${(Math.PI / 2 - angle) * 180 / Math.PI}deg)` }}>
            {BUBBLE_COLORS[currentBubble]}
          </div>
          {/* Next bubble */}
          <div className="text-xl opacity-50 mt-1">
            Next: {BUBBLE_COLORS[nextBubble]}
          </div>
        </div>

        {/* Menu / Game Over / Won */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="flex gap-1 mb-4">
                  {BUBBLE_COLORS.slice(0, 4).map((color, i) => (
                    <span key={i} className="text-3xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                      {color}
                    </span>
                  ))}
                </div>
                <h2 className="text-3xl font-black mb-2 text-blue-400">BUBBLE SHOOTER</h2>
                <p className="text-gray-300 mb-4 text-center text-sm px-4">
                  Match 3+ same color bubbles to pop them!
                </p>
              </>
            ) : gameState === "won" ? (
              <>
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-3xl font-black mb-2 text-green-400">YOU WIN!</h2>
                <p className="text-2xl mb-4">Score: <span className="text-yellow-400">{score}</span></p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">💥</div>
                <h2 className="text-3xl font-black mb-2 text-red-400">GAME OVER</h2>
                <p className="text-2xl mb-2">Score: <span className="text-yellow-400">{score}</span></p>
                <p className="text-lg text-purple-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg"
            >
              {gameState === "menu" ? "🎯 START!" : "🔄 PLAY AGAIN"}
            </button>
          </div>
        )}
      </div>

      <p className="text-white/60 mt-4 text-center text-sm">
        Aim with mouse/touch, click to shoot! Match 3+ bubbles! 🎯
      </p>
    </div>
  );
}

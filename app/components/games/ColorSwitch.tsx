"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Obstacle {
  id: number;
  y: number;
  type: "ring" | "bars" | "cross";
  rotation: number;
  passed: boolean;
}

interface Star {
  id: number;
  y: number;
  collected: boolean;
}

const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A855F7"];
const COLOR_NAMES = ["red", "cyan", "yellow", "purple"];

export default function ColorSwitch() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [ballY, setBallY] = useState(400);
  const [ballVelocity, setBallVelocity] = useState(0);
  const [ballColor, setBallColor] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [cameraY, setCameraY] = useState(0);

  const gameLoopRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const starIdRef = useRef(0);

  const GAME_WIDTH = 300;
  const GAME_HEIGHT = 500;
  const BALL_SIZE = 20;
  const GRAVITY = 0.4;
  const JUMP_FORCE = -9;

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setBallY(400);
    setBallVelocity(0);
    setBallColor(Math.floor(Math.random() * 4));
    setCameraY(0);
    setObstacles([
      { id: 0, y: 250, type: "ring", rotation: 0, passed: false },
    ]);
    setStars([
      { id: 0, y: 250, collected: false },
    ]);
    obstacleIdRef.current = 1;
    starIdRef.current = 1;
  };

  const jump = useCallback(() => {
    if (gameState === "playing") {
      setBallVelocity(JUMP_FORCE);
    } else {
      startGame();
    }
  }, [gameState]);

  // Keyboard and touch controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
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
      // Ball physics
      setBallVelocity(v => v + GRAVITY);
      setBallY(y => {
        const newY = y + ballVelocity;
        // Update camera to follow ball
        const targetCamera = Math.max(0, 400 - newY);
        setCameraY(cam => cam + (targetCamera - cam) * 0.1);
        return newY;
      });

      // Rotate obstacles
      setObstacles(prev => prev.map(obs => ({
        ...obs,
        rotation: obs.rotation + (obs.type === "cross" ? 3 : 2),
      })));

      // Check star collection
      setStars(prev => prev.map(star => {
        if (star.collected) return star;
        const screenY = star.y + cameraY;
        const ballScreenY = ballY + cameraY;
        if (Math.abs(screenY - ballScreenY) < 30 && Math.abs(GAME_WIDTH / 2 - GAME_WIDTH / 2) < 30) {
          setScore(s => s + 1);
          // Change ball color randomly
          setBallColor(Math.floor(Math.random() * 4));
          // Spawn new obstacle and star
          const lastObs = obstacles[obstacles.length - 1];
          const newY = lastObs ? lastObs.y - 200 : star.y - 200;
          const types: ("ring" | "bars" | "cross")[] = ["ring", "bars", "cross"];
          setObstacles(obs => [...obs, {
            id: obstacleIdRef.current++,
            y: newY,
            type: types[Math.floor(Math.random() * types.length)],
            rotation: 0,
            passed: false,
          }]);
          setStars(s => [...s, {
            id: starIdRef.current++,
            y: newY,
            collected: false,
          }]);
          return { ...star, collected: true };
        }
        return star;
      }));

      // Check collisions with obstacles
      const ballCenterX = GAME_WIDTH / 2;
      const ballCenterY = ballY;

      for (const obs of obstacles) {
        if (obs.passed) continue;
        const obsCenterY = obs.y;

        // Check if ball is in obstacle zone
        if (Math.abs(ballCenterY - obsCenterY) < 60) {
          // Check color collision based on obstacle type and rotation
          const angle = obs.rotation % 360;
          let safeColorIndex = -1;

          if (obs.type === "ring") {
            // Ring has 4 color segments
            const segment = Math.floor(((angle + 45) % 360) / 90);
            safeColorIndex = (segment + 0) % 4; // Simplified - top segment
          } else if (obs.type === "bars") {
            // Bars alternate colors
            const barIndex = Math.floor(((angle + 22.5) % 180) / 45);
            safeColorIndex = barIndex % 4;
          } else if (obs.type === "cross") {
            // Cross has 4 arms
            const arm = Math.floor(((angle + 45) % 360) / 90);
            safeColorIndex = arm;
          }

          // Check if ball is in the gap or wrong color
          const distFromCenter = Math.abs(ballCenterY - obsCenterY);
          if (distFromCenter < 50 && distFromCenter > 30) {
            // Ball is in the obstacle ring area
            // Simplified: check if wrong color (more forgiving for fun)
            if (ballColor !== safeColorIndex && Math.random() > 0.7) {
              setGameState("gameover");
              setHighScore(h => Math.max(h, score));
            }
          }
        }
      }

      // Game over if ball falls too low
      if (ballY > 550 + cameraY) {
        setGameState("gameover");
        setHighScore(h => Math.max(h, score));
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, ballVelocity, ballY, ballColor, cameraY, obstacles, score]);

  const renderRingObstacle = (obs: Obstacle) => {
    const screenY = obs.y + cameraY;
    return (
      <div
        key={obs.id}
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: screenY - 50 }}
      >
        <svg
          width="120"
          height="120"
          style={{ transform: `rotate(${obs.rotation}deg)` }}
        >
          <circle cx="60" cy="60" r="50" fill="none" stroke={COLORS[0]} strokeWidth="10"
            strokeDasharray="78.5 235.5" strokeDashoffset="0" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={COLORS[1]} strokeWidth="10"
            strokeDasharray="78.5 235.5" strokeDashoffset="-78.5" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={COLORS[2]} strokeWidth="10"
            strokeDasharray="78.5 235.5" strokeDashoffset="-157" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={COLORS[3]} strokeWidth="10"
            strokeDasharray="78.5 235.5" strokeDashoffset="-235.5" />
        </svg>
      </div>
    );
  };

  const renderBarsObstacle = (obs: Obstacle) => {
    const screenY = obs.y + cameraY;
    return (
      <div
        key={obs.id}
        className="absolute left-1/2 -translate-x-1/2 flex gap-0"
        style={{ top: screenY - 30, transform: `translateX(-50%) rotate(${obs.rotation}deg)` }}
      >
        {COLORS.map((color, i) => (
          <div
            key={i}
            className="w-8 h-16"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    );
  };

  const renderCrossObstacle = (obs: Obstacle) => {
    const screenY = obs.y + cameraY;
    return (
      <div
        key={obs.id}
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: screenY - 50, transform: `translateX(-50%) rotate(${obs.rotation}deg)` }}
      >
        <svg width="100" height="100">
          <rect x="45" y="0" width="10" height="45" fill={COLORS[0]} />
          <rect x="55" y="45" width="45" height="10" fill={COLORS[1]} />
          <rect x="45" y="55" width="10" height="45" fill={COLORS[2]} />
          <rect x="0" y="45" width="45" height="10" fill={COLORS[3]} />
        </svg>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      {/* HUD */}
      <div className="flex justify-between w-full max-w-[300px] mb-4 text-white">
        <div className="text-lg">⭐ <span className="font-bold text-yellow-400">{score}</span></div>
        <div className="text-lg">👑 <span className="font-bold text-purple-400">{highScore}</span></div>
      </div>

      {/* Game Area */}
      <div
        className="relative overflow-hidden rounded-2xl border-4 border-gray-700 cursor-pointer bg-gray-900"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onClick={jump}
      >
        {/* Obstacles */}
        {obstacles.map(obs => {
          if (obs.type === "ring") return renderRingObstacle(obs);
          if (obs.type === "bars") return renderBarsObstacle(obs);
          if (obs.type === "cross") return renderCrossObstacle(obs);
          return null;
        })}

        {/* Stars */}
        {stars.filter(s => !s.collected).map(star => (
          <div
            key={star.id}
            className="absolute left-1/2 -translate-x-1/2 text-2xl animate-pulse"
            style={{ top: star.y + cameraY }}
          >
            ⭐
          </div>
        ))}

        {/* Ball */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full transition-colors"
          style={{
            width: BALL_SIZE,
            height: BALL_SIZE,
            top: ballY + cameraY,
            backgroundColor: COLORS[ballColor],
            boxShadow: `0 0 20px ${COLORS[ballColor]}`,
          }}
        />

        {/* Menu / Game Over */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
            {gameState === "menu" ? (
              <>
                <div className="flex gap-1 mb-4">
                  {COLORS.map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full animate-bounce"
                      style={{ backgroundColor: color, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <h2 className="text-3xl font-black mb-2 text-cyan-400">COLOR SWITCH</h2>
                <p className="text-gray-300 mb-4 text-center text-sm px-4">
                  Tap to jump! Pass through matching colors only!
                </p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">💫</div>
                <h2 className="text-3xl font-black mb-2 text-red-400">GAME OVER</h2>
                <p className="text-2xl mb-2">Score: <span className="text-yellow-400">{score}</span></p>
                <p className="text-lg text-purple-400 mb-4">Best: {highScore}</p>
              </>
            )}
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg"
            >
              {gameState === "menu" ? "🎮 PLAY!" : "🔄 RETRY"}
            </button>
          </div>
        )}
      </div>

      <p className="text-white/60 mt-4 text-center text-sm">
        Tap to jump! Only pass through your color! ⭐
      </p>
    </div>
  );
}

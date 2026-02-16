"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface EnemyCar {
  x: number;
  y: number;
  speed: number;
  colorIdx: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
}

const CAR_COLORS = ["#e74c3c", "#e67e22", "#9b59b6", "#1abc9c", "#e91e63"];

export default function SteeringRacer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wheelAngle, setWheelAngle] = useState(0);

  const gameRef = useRef({
    playerX: 175,
    speed: 2.5,
    steering: 0,
    cars: [] as EnemyCar[],
    scrollY: 0,
    frame: 0,
    spawnTimer: 0,
    score: 0,
    floatingTexts: [] as FloatingText[],
    trees: [] as { x: number; y: number; type: number }[],
    crashed: false,
  });

  const touchRef = useRef({
    active: false,
    identifier: -1,
    startAngle: 0,
    startWheelAngle: 0,
  });

  const wheelAngleRef = useRef(0);
  const gameStateRef = useRef<"menu" | "playing" | "gameover">("menu");
  const animRef = useRef<number>();
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);

  const W = 350;
  const H = 400;
  const ROAD_LEFT = 55;
  const ROAD_RIGHT = 295;
  const ROAD_W = ROAD_RIGHT - ROAD_LEFT;
  const CAR_W = 36;
  const CAR_H = 56;
  const PLAYER_Y = H - 80;

  // Initialize trees
  useEffect(() => {
    const trees: { x: number; y: number; type: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const side = Math.random() > 0.5 ? "left" : "right";
      trees.push({
        x: side === "left" ? Math.random() * (ROAD_LEFT - 15) : ROAD_RIGHT + 5 + Math.random() * (W - ROAD_RIGHT - 15),
        y: Math.random() * (H + 200),
        type: Math.floor(Math.random() * 3),
      });
    }
    gameRef.current.trees = trees;
  }, []);

  // Get angle from wheel center to a point
  const getAngleFromWheel = useCallback((clientX: number, clientY: number): number => {
    const el = wheelRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }, []);

  // Steering wheel - touch handlers
  const handleWheelTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchRef.current = {
      active: true,
      identifier: touch.identifier,
      startAngle: getAngleFromWheel(touch.clientX, touch.clientY),
      startWheelAngle: wheelAngleRef.current,
    };
  }, [getAngleFromWheel]);

  const handleWheelTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchRef.current.active) return;
    const touch = Array.from(e.touches).find(t => t.identifier === touchRef.current.identifier);
    if (!touch) return;

    const currentAngle = getAngleFromWheel(touch.clientX, touch.clientY);
    let delta = currentAngle - touchRef.current.startAngle;

    // Handle angle wrapping
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    const newAngle = Math.max(-90, Math.min(90, touchRef.current.startWheelAngle + delta));
    wheelAngleRef.current = newAngle;
    setWheelAngle(newAngle);
    gameRef.current.steering = newAngle / 90;
  }, [getAngleFromWheel]);

  const handleWheelTouchEnd = useCallback(() => {
    touchRef.current.active = false;
  }, []);

  // Mouse handlers for desktop
  const mouseActiveRef = useRef(false);
  const mouseStartAngleRef = useRef(0);
  const mouseStartWheelRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseActiveRef.current = true;
    mouseStartAngleRef.current = getAngleFromWheel(e.clientX, e.clientY);
    mouseStartWheelRef.current = wheelAngleRef.current;
  }, [getAngleFromWheel]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseActiveRef.current) return;
      const currentAngle = getAngleFromWheel(e.clientX, e.clientY);
      let delta = currentAngle - mouseStartAngleRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const newAngle = Math.max(-90, Math.min(90, mouseStartWheelRef.current + delta));
      wheelAngleRef.current = newAngle;
      setWheelAngle(newAngle);
      gameRef.current.steering = newAngle / 90;
    };

    const handleMouseUp = () => {
      mouseActiveRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [getAngleFromWheel]);

  // Keyboard controls
  useEffect(() => {
    const keysDown = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown.add(e.key);
      if ((e.key === " " || e.key === "Enter") && gameStateRef.current !== "playing") {
        startGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.key);
    };

    const keyLoop = setInterval(() => {
      if (gameStateRef.current !== "playing") return;

      let target = 0;
      if (keysDown.has("ArrowLeft") || keysDown.has("a")) target = -1;
      if (keysDown.has("ArrowRight") || keysDown.has("d")) target = 1;

      if (target !== 0) {
        const newAngle = Math.max(-90, Math.min(90, wheelAngleRef.current + target * 4));
        wheelAngleRef.current = newAngle;
        setWheelAngle(newAngle);
        gameRef.current.steering = newAngle / 90;
      }
    }, 16);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearInterval(keyLoop);
    };
  }, []);

  // Smoothly return wheel to center when not touching
  useEffect(() => {
    const returnInterval = setInterval(() => {
      if (touchRef.current.active || mouseActiveRef.current) return;
      if (gameStateRef.current !== "playing") return;

      const current = wheelAngleRef.current;
      if (Math.abs(current) < 0.5) {
        wheelAngleRef.current = 0;
        setWheelAngle(0);
        gameRef.current.steering = 0;
        return;
      }
      const newAngle = current * 0.88;
      wheelAngleRef.current = newAngle;
      setWheelAngle(newAngle);
      gameRef.current.steering = newAngle / 90;
    }, 16);
    return () => clearInterval(returnInterval);
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.playerX = W / 2;
    g.speed = 2.5;
    g.steering = 0;
    g.cars = [];
    g.scrollY = 0;
    g.frame = 0;
    g.spawnTimer = 0;
    g.score = 0;
    g.floatingTexts = [];
    g.crashed = false;
    scoreRef.current = 0;
    wheelAngleRef.current = 0;
    setWheelAngle(0);
    setScore(0);
    gameStateRef.current = "playing";
    setGameState("playing");
  }, []);

  // Draw a car on canvas
  const drawCar = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, colorIdx: number, isEnemy: boolean) => {
    ctx.save();
    ctx.translate(x, y);

    if (isEnemy) {
      // Enemy car body
      const color = CAR_COLORS[colorIdx % CAR_COLORS.length];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H, 7);
      ctx.fill();

      // Roof
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.roundRect(-CAR_W / 2 + 5, -CAR_H / 2 + 10, CAR_W - 10, 18, 4);
      ctx.fill();

      // Headlights (facing down toward player)
      ctx.fillStyle = "#ffeaa7";
      ctx.beginPath();
      ctx.arc(-CAR_W / 2 + 7, CAR_H / 2 - 4, 3, 0, Math.PI * 2);
      ctx.arc(CAR_W / 2 - 7, CAR_H / 2 - 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      ctx.fillStyle = "#2d3436";
      ctx.fillRect(-CAR_W / 2 - 3, -CAR_H / 2 + 6, 5, 12);
      ctx.fillRect(CAR_W / 2 - 2, -CAR_H / 2 + 6, 5, 12);
      ctx.fillRect(-CAR_W / 2 - 3, CAR_H / 2 - 18, 5, 12);
      ctx.fillRect(CAR_W / 2 - 2, CAR_H / 2 - 18, 5, 12);
    } else {
      // Player car - draw with steering tilt
      const tilt = gameRef.current.steering * 0.12;
      ctx.rotate(tilt);

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.ellipse(3, 5, CAR_W / 2 + 2, CAR_H / 2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Car body (blue race car)
      const grad = ctx.createLinearGradient(-CAR_W / 2, 0, CAR_W / 2, 0);
      grad.addColorStop(0, "#2471a3");
      grad.addColorStop(0.3, "#2e86c1");
      grad.addColorStop(0.7, "#3498db");
      grad.addColorStop(1, "#2471a3");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H, 8);
      ctx.fill();

      // Racing stripe
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(-3, -CAR_H / 2, 6, CAR_H);

      // Windshield
      ctx.fillStyle = "rgba(174,214,241,0.7)";
      ctx.beginPath();
      ctx.roundRect(-CAR_W / 2 + 5, -CAR_H / 2 + 8, CAR_W - 10, 14, 3);
      ctx.fill();

      // Headlights
      ctx.fillStyle = "#f9e79f";
      ctx.beginPath();
      ctx.arc(-CAR_W / 2 + 6, -CAR_H / 2 + 3, 3, 0, Math.PI * 2);
      ctx.arc(CAR_W / 2 - 6, -CAR_H / 2 + 3, 3, 0, Math.PI * 2);
      ctx.fill();

      // Rear lights
      ctx.fillStyle = "#e74c3c";
      ctx.beginPath();
      ctx.roundRect(-CAR_W / 2 + 3, CAR_H / 2 - 6, 8, 4, 2);
      ctx.roundRect(CAR_W / 2 - 11, CAR_H / 2 - 6, 8, 4, 2);
      ctx.fill();

      // Wheels
      ctx.fillStyle = "#2d3436";
      ctx.fillRect(-CAR_W / 2 - 4, -CAR_H / 2 + 8, 6, 14);
      ctx.fillRect(CAR_W / 2 - 2, -CAR_H / 2 + 8, 6, 14);
      ctx.fillRect(-CAR_W / 2 - 4, CAR_H / 2 - 22, 6, 14);
      ctx.fillRect(CAR_W / 2 - 2, CAR_H / 2 - 22, 6, 14);
    }

    ctx.restore();
  }, []);

  // Main game loop
  useEffect(() => {
    if (gameState !== "playing") {
      // Still render for menu/gameover background
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw static scene
      const g = gameRef.current;
      ctx.clearRect(0, 0, W, H);

      // Grass
      ctx.fillStyle = "#4a8c3f";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#3d7a33";
      for (const tree of g.trees) {
        const ty = tree.y % H;
        if (tree.x < ROAD_LEFT || tree.x > ROAD_RIGHT) {
          ctx.beginPath();
          ctx.arc(tree.x + 5, ty, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Road
      ctx.fillStyle = "#555";
      ctx.fillRect(ROAD_LEFT, 0, ROAD_W, H);
      ctx.fillStyle = "#fff";
      ctx.fillRect(ROAD_LEFT, 0, 3, H);
      ctx.fillRect(ROAD_RIGHT - 3, 0, 3, H);

      // Center dashes
      ctx.fillStyle = "#f1c40f";
      for (let y = 0; y < H; y += 50) {
        ctx.fillRect(W / 2 - 2, y, 4, 30);
      }

      // Player car
      drawCar(ctx, W / 2, PLAYER_Y, 0, false);

      return;
    }

    let running = true;
    let lastTime = performance.now();

    const gameLoop = (now: number) => {
      if (!running) return;
      const dt = Math.min(now - lastTime, 33) / 16.67; // normalize to ~60fps
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) { animRef.current = requestAnimationFrame(gameLoop); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { animRef.current = requestAnimationFrame(gameLoop); return; }

      const g = gameRef.current;
      g.frame++;

      // Update player position based on steering
      g.playerX += g.steering * g.speed * 1.8 * dt;

      // Clamp player to road
      const minX = ROAD_LEFT + CAR_W / 2 + 5;
      const maxX = ROAD_RIGHT - CAR_W / 2 - 5;
      if (g.playerX < minX || g.playerX > maxX) {
        g.playerX = Math.max(minX, Math.min(maxX, g.playerX));
      }

      // Update road scroll
      g.scrollY += g.speed * dt;

      // Increase speed over time
      if (g.frame % 120 === 0) {
        g.speed = Math.min(10, g.speed + 0.08);
      }

      // Update score
      g.score += Math.round(g.speed * dt);
      if (g.frame % 5 === 0) {
        scoreRef.current = g.score;
        setScore(g.score);
      }

      // Spawn enemy cars
      g.spawnTimer += dt;
      const spawnRate = Math.max(35, 80 - g.score / 100);
      if (g.spawnTimer > spawnRate) {
        g.spawnTimer = 0;
        const laneCount = 3;
        const laneWidth = ROAD_W / laneCount;
        const lane = Math.floor(Math.random() * laneCount);
        const laneCenter = ROAD_LEFT + laneWidth * lane + laneWidth / 2;

        g.cars.push({
          x: laneCenter,
          y: -CAR_H,
          speed: g.speed * (0.4 + Math.random() * 0.3),
          colorIdx: Math.floor(Math.random() * CAR_COLORS.length),
        });
      }

      // Update enemy cars
      g.cars = g.cars
        .map(car => ({
          ...car,
          y: car.y + (g.speed - car.speed) * dt,
        }))
        .filter(car => car.y < H + CAR_H);

      // Collision detection
      for (const car of g.cars) {
        const dx = Math.abs(car.x - g.playerX);
        const dy = Math.abs(car.y - PLAYER_Y);
        if (dx < CAR_W - 4 && dy < CAR_H - 4) {
          g.crashed = true;
          const hs = Math.max(highScoreRef.current, g.score);
          highScoreRef.current = hs;
          setHighScore(hs);
          setScore(g.score);
          gameStateRef.current = "gameover";
          setGameState("gameover");
          running = false;
          return;
        }
        // Near miss bonus
        if (dx < CAR_W + 10 && dx >= CAR_W - 4 && dy < CAR_H && car.y > PLAYER_Y) {
          if (!g.floatingTexts.some(ft => Math.abs(ft.y - car.y) < 30)) {
            g.floatingTexts.push({
              x: g.playerX,
              y: PLAYER_Y - 30,
              text: "+50 CLOSE!",
              life: 40,
            });
            g.score += 50;
          }
        }
      }

      // Update floating texts
      g.floatingTexts = g.floatingTexts
        .map(ft => ({ ...ft, y: ft.y - 1.5 * dt, life: ft.life - dt }))
        .filter(ft => ft.life > 0);

      // Update trees (scroll)
      for (const tree of g.trees) {
        tree.y += g.speed * 0.7 * dt;
        if (tree.y > H + 50) {
          tree.y = -50;
          const side = Math.random() > 0.5 ? "left" : "right";
          tree.x = side === "left"
            ? Math.random() * (ROAD_LEFT - 15)
            : ROAD_RIGHT + 5 + Math.random() * (W - ROAD_RIGHT - 15);
        }
      }

      // === RENDER ===
      ctx.clearRect(0, 0, W, H);

      // Grass
      ctx.fillStyle = "#4a8c3f";
      ctx.fillRect(0, 0, W, H);

      // Grass stripes for movement feel
      ctx.fillStyle = "#3f7d35";
      const stripeH = 40;
      const stripeOffset = g.scrollY % (stripeH * 2);
      for (let y = -stripeH * 2 + stripeOffset; y < H + stripeH; y += stripeH * 2) {
        ctx.fillRect(0, y, ROAD_LEFT, stripeH);
        ctx.fillRect(ROAD_RIGHT, y, W - ROAD_RIGHT, stripeH);
      }

      // Trees
      for (const tree of g.trees) {
        if (tree.x < ROAD_LEFT - 2 || tree.x > ROAD_RIGHT + 2) {
          ctx.fillStyle = "#6b4226";
          ctx.fillRect(tree.x + 3, tree.y + 4, 4, 10);
          const colors = ["#27ae60", "#2ecc71", "#1e8449"];
          ctx.fillStyle = colors[tree.type];
          ctx.beginPath();
          ctx.arc(tree.x + 5, tree.y, 9 + tree.type * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Road curb (red/white pattern)
      const curbW = 5;
      const curbSegH = 20;
      const curbOffset = g.scrollY % (curbSegH * 2);
      for (let y = -curbSegH * 2 + curbOffset; y < H + curbSegH; y += curbSegH) {
        const idx = Math.floor((y - curbOffset) / curbSegH);
        ctx.fillStyle = idx % 2 === 0 ? "#e74c3c" : "#ecf0f1";
        ctx.fillRect(ROAD_LEFT - curbW, y, curbW, curbSegH);
        ctx.fillRect(ROAD_RIGHT, y, curbW, curbSegH);
      }

      // Road surface
      ctx.fillStyle = "#555";
      ctx.fillRect(ROAD_LEFT, 0, ROAD_W, H);

      // Road edge lines
      ctx.fillStyle = "#fff";
      ctx.fillRect(ROAD_LEFT + 2, 0, 2, H);
      ctx.fillRect(ROAD_RIGHT - 4, 0, 2, H);

      // Lane dashes (scrolling)
      const dashLen = 28;
      const gapLen = 22;
      const totalDash = dashLen + gapLen;
      const dashOffset = g.scrollY % totalDash;

      // Center line (yellow)
      ctx.fillStyle = "#f1c40f";
      for (let y = -totalDash + dashOffset; y < H; y += totalDash) {
        ctx.fillRect(W / 2 - 2, y, 4, dashLen);
      }

      // Lane lines (white, subtle)
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      const lane1X = ROAD_LEFT + ROAD_W / 3;
      const lane2X = ROAD_LEFT + (ROAD_W * 2) / 3;
      for (let y = -totalDash + dashOffset; y < H; y += totalDash) {
        ctx.fillRect(lane1X - 1, y, 2, dashLen);
        ctx.fillRect(lane2X - 1, y, 2, dashLen);
      }

      // Speed lines effect
      if (g.speed > 4) {
        const alpha = Math.min(0.3, (g.speed - 4) / 15);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < Math.floor(g.speed); i++) {
          const sx = ROAD_LEFT + 10 + ((g.frame * 7 + i * 43) % (ROAD_W - 20));
          const sy = ((g.frame * 3 + i * 67) % H);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx, sy + 8 + g.speed * 2);
          ctx.stroke();
        }
      }

      // Enemy cars
      for (const car of g.cars) {
        drawCar(ctx, car.x, car.y, car.colorIdx, true);
      }

      // Player car
      drawCar(ctx, g.playerX, PLAYER_Y, 0, false);

      // Floating texts
      for (const ft of g.floatingTexts) {
        ctx.save();
        ctx.globalAlpha = ft.life / 40;
        ctx.fillStyle = "#2ecc71";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // HUD
      // Score
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.roundRect(8, 8, 110, 30, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${g.score}`, 18, 28);

      // Speed
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.roundRect(W - 128, 8, 120, 30, 8);
      ctx.fill();
      ctx.fillStyle = "#2ecc71";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${Math.round(g.speed * 25)} km/h`, W - 115, 28);

      animRef.current = requestAnimationFrame(gameLoop);
    };

    animRef.current = requestAnimationFrame(gameLoop);
    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameState, drawCar]);

  return (
    <div className="flex flex-col items-center select-none">
      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-xl border-2 border-gray-600"
          style={{ touchAction: "none" }}
        />

        {/* Menu Overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-black/70 rounded-xl flex flex-col items-center justify-center text-white">
            <div className="text-7xl mb-3 animate-bounce">🏎️</div>
            <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              TURBO RACER
            </h2>
            <p className="text-gray-300 mb-1 text-sm">Dodge the traffic!</p>
            <p className="text-gray-400 text-xs mb-4">Turn the steering wheel to drive!</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <span>Keyboard: Arrow keys or A/D</span>
            </div>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-500 to-emerald-500 px-10 py-3 rounded-full font-black text-xl shadow-lg hover:scale-105 transition-transform active:scale-95"
            >
              START
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-black/75 rounded-xl flex flex-col items-center justify-center text-white">
            <div className="text-6xl mb-2">💥</div>
            <h2 className="text-3xl font-black text-red-400 mb-2">CRASH!</h2>
            <div className="bg-white/10 rounded-xl px-6 py-3 mb-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{score}</p>
              <p className="text-xs text-gray-400">SCORE</p>
            </div>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-300 font-bold text-sm mb-2 animate-pulse">NEW HIGH SCORE!</p>
            )}
            <p className="text-gray-400 text-sm mb-4">
              Best: <span className="text-yellow-400 font-bold">{highScore}</span>
            </p>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-blue-500 to-purple-500 px-10 py-3 rounded-full font-black text-xl shadow-lg hover:scale-105 transition-transform active:scale-95"
            >
              RETRY
            </button>
          </div>
        )}
      </div>

      {/* Steering Wheel Section */}
      <div className="mt-4 mb-2 flex flex-col items-center">
        <p className="text-gray-400 text-xs mb-2">
          {gameState === "playing" ? "Turn the wheel!" : "Grab the wheel to steer"}
        </p>
        <div
          ref={wheelRef}
          className="relative cursor-grab active:cursor-grabbing"
          style={{
            width: 160,
            height: 160,
            transform: `rotate(${wheelAngle}deg)`,
            transition: touchRef.current.active || mouseActiveRef.current ? "none" : "transform 0.1s ease-out",
          }}
          onTouchStart={handleWheelTouchStart}
          onTouchMove={handleWheelTouchMove}
          onTouchEnd={handleWheelTouchEnd}
          onMouseDown={handleMouseDown}
        >
          {/* Outer wheel ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: "14px solid #444",
              boxShadow: "0 0 0 3px #333, inset 0 0 0 3px #555, 0 4px 15px rgba(0,0,0,0.5)",
              background: "radial-gradient(circle, transparent 55%, #3a3a3a 56%, #4a4a4a 100%)",
            }}
          />

          {/* Horizontal spoke */}
          <div
            className="absolute rounded-full"
            style={{
              top: "50%",
              left: "18%",
              right: "18%",
              height: 12,
              marginTop: -6,
              background: "linear-gradient(to bottom, #555, #3a3a3a)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          />

          {/* Vertical spoke (partial - bottom only for racing wheel style) */}
          <div
            className="absolute rounded-full"
            style={{
              left: "50%",
              top: "50%",
              bottom: "18%",
              width: 12,
              marginLeft: -6,
              background: "linear-gradient(to right, #555, #3a3a3a)",
              boxShadow: "1px 0 3px rgba(0,0,0,0.4)",
            }}
          />

          {/* Center hub */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              top: "50%",
              left: "50%",
              width: 48,
              height: 48,
              marginTop: -24,
              marginLeft: -24,
              borderRadius: "50%",
              background: "radial-gradient(circle, #555, #333)",
              border: "2px solid #666",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.1)",
            }}
          >
            <span className="text-xl" style={{ transform: `rotate(${-wheelAngle}deg)` }}>
              🏎️
            </span>
          </div>

          {/* Top indicator mark */}
          <div
            className="absolute"
            style={{
              top: 6,
              left: "50%",
              width: 8,
              height: 8,
              marginLeft: -4,
              borderRadius: "50%",
              background: gameState === "playing" ? "#e74c3c" : "#666",
              boxShadow: gameState === "playing" ? "0 0 6px #e74c3c" : "none",
            }}
          />
        </div>

        {/* Steering direction indicator */}
        <div className="mt-2 flex items-center gap-3">
          <span className={`text-lg transition-opacity ${wheelAngle < -10 ? "opacity-100" : "opacity-30"}`}>
            ◀
          </span>
          <div
            className="h-2 rounded-full bg-gray-700 overflow-hidden"
            style={{ width: 120 }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: 20,
                marginLeft: 50 + (wheelAngle / 90) * 50,
                background: Math.abs(wheelAngle) > 45
                  ? "linear-gradient(to right, #e74c3c, #c0392b)"
                  : "linear-gradient(to right, #3498db, #2980b9)",
              }}
            />
          </div>
          <span className={`text-lg transition-opacity ${wheelAngle > 10 ? "opacity-100" : "opacity-30"}`}>
            ▶
          </span>
        </div>
      </div>
    </div>
  );
}

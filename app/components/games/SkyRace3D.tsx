"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Confetti from "../home/Confetti";
import { TILT_RECENTER, gravityAngle, screenLean, tiltPitch, tiltSteer, wrapAngle } from "../../lib/tiltSteering";
import { createEngine } from "./skyRace3D/engine";
import type { Engine, Hud, InputState, RaceResult } from "./skyRace3D/engine";
import { LEVELS, ordinal, starsForPlace } from "./skyRace3D/world";
import { PLANES } from "./skyRace3D/models";

const STORAGE_KEY = "yusuf:sky-race-3d:stars";
const PLANE_KEY = "yusuf:sky-race-3d:plane";

type Phase = "menu" | "racing" | "results";
type TiltState = "off" | "waiting" | "on" | "unavailable";
type HoldKey = "left" | "right" | "up" | "down";

const EMPTY_HUD: Hud = { place: 1, rings: 0, ringsTotal: 0, racers: [], boost: false };
const MEDALS = ["🥇", "🥈", "🥉", "🏅"];

function loadStars(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(v)) return LEVELS.map((_, i) => Number(v[i]) || 0);
  } catch {
    /* private mode */
  }
  return LEVELS.map(() => 0);
}

export default function SkyRace3D() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const inputRef = useRef<InputState>({
    left: false, right: false, up: false, down: false, tilt: 0, pitch: 0, tiltActive: false,
  });
  const neutralRef = useRef<{ angle: number; lean: number } | null>(null);
  const zSignRef = useRef<1 | -1>(1);
  const tiltSeenRef = useRef(false);
  const tiltWantedRef = useRef(false);
  const tiltOptOutRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("menu");
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [count, setCount] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState<"ring" | "bonk" | null>(null);
  const [stars, setStars] = useState<number[]>(() => LEVELS.map(() => 0));
  const [plane, setPlane] = useState(0);
  const [levelIdx, setLevelIdx] = useState(0);
  const [result, setResult] = useState<RaceResult | null>(null);
  const [tilt, setTilt] = useState<TiltState>("off");
  const [muted, setMuted] = useState(false);
  const [full, setFull] = useState(false);
  const [touch, setTouch] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  const levelRef = useRef(0);
  levelRef.current = levelIdx;

  // ── Engine lifecycle ──
  useEffect(() => {
    setStars(loadStars());
    let savedPlane = 0;
    try {
      savedPlane = Math.min(PLANES.length - 1, Math.max(0, Number(localStorage.getItem(PLANE_KEY)) || 0));
    } catch {
      /* private mode */
    }
    setPlane(savedPlane);
    const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    setTouch(isTouch);

    const mount = mountRef.current;
    if (!mount) return;
    let toastTimer: ReturnType<typeof setTimeout> | undefined;
    let flashTimer: ReturnType<typeof setTimeout> | undefined;
    const pop = (kind: "ring" | "bonk", text: string) => {
      setFlash(kind);
      setToast(text);
      clearTimeout(flashTimer);
      clearTimeout(toastTimer);
      flashTimer = setTimeout(() => setFlash(null), 250);
      toastTimer = setTimeout(() => setToast(null), 900);
    };
    try {
      engineRef.current = createEngine(
        mount,
        inputRef.current,
        {
          onHud: setHud,
          onCount: setCount,
          onRing: () => pop("ring", "Zoom! 🚀"),
          onBonk: () => {
            pop("bonk", "Bonk! 🎈");
            if (navigator.vibrate) navigator.vibrate(120);
          },
          onFinish: (r) => {
            setResult(r);
            setPhase("results");
            setStars((old) => {
              const next = [...old];
              const lv = levelRef.current;
              next[lv] = Math.max(next[lv], starsForPlace(r.place));
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              } catch {
                /* ignore */
              }
              return next;
            });
          },
        },
        isTouch,
      );
      engineRef.current.preview(0, savedPlane);
    } catch {
      setWebglOk(false);
    }
    return () => {
      clearTimeout(toastTimer);
      clearTimeout(flashTimer);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // ── Keyboard ──
  useEffect(() => {
    const map: Record<string, HoldKey> = {
      ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
      ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
    };
    const down = (e: KeyboardEvent) => {
      const k = map[e.code];
      if (!k) return;
      if (phase === "racing") e.preventDefault();
      inputRef.current[k] = true;
    };
    const up = (e: KeyboardEvent) => {
      const k = map[e.code];
      if (k) inputRef.current[k] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase]);

  // ── Phone tilt = steering wheel + up/down ──
  const onMotion = useCallback((e: DeviceMotionEvent) => {
    if (!tiltWantedRef.current) return;
    const g = e.accelerationIncludingGravity;
    const angle = gravityAngle(g?.x, g?.y);
    const lean = screenLean(g?.x, g?.y, g?.z, zSignRef.current);
    if (angle == null || lean == null) return;
    if (neutralRef.current == null || Math.abs(wrapAngle(angle - neutralRef.current.angle)) > TILT_RECENTER) {
      neutralRef.current = { angle, lean };
    }
    inputRef.current.tilt = tiltSteer(angle, neutralRef.current.angle);
    inputRef.current.pitch = tiltPitch(lean, neutralRef.current.lean);
    if (!tiltSeenRef.current) {
      tiltSeenRef.current = true;
      inputRef.current.tiltActive = true;
      setTilt("on");
    }
  }, []);

  useEffect(() => () => window.removeEventListener("devicemotion", onMotion), [onMotion]);

  const enableTilt = useCallback(() => {
    tiltOptOutRef.current = false;
    const attach = () => {
      tiltWantedRef.current = true;
      neutralRef.current = null;
      window.removeEventListener("devicemotion", onMotion);
      window.addEventListener("devicemotion", onMotion);
      if (tiltSeenRef.current) {
        inputRef.current.tiltActive = true;
        setTilt("on");
        return;
      }
      setTilt("waiting");
      setTimeout(() => {
        if (!tiltSeenRef.current) setTilt("unavailable");
      }, 2000);
    };
    const DME = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
    if (!DME) {
      setTilt("unavailable");
      return;
    }
    if (typeof DME.requestPermission === "function") {
      // Only iOS asks — and iOS points every axis the other way round.
      zSignRef.current = -1;
      DME.requestPermission()
        .then((r) => (r === "granted" ? attach() : setTilt("unavailable")))
        .catch(() => setTilt("unavailable"));
    } else attach();
  }, [onMotion]);

  const disableTilt = useCallback(() => {
    tiltOptOutRef.current = true;
    tiltWantedRef.current = false;
    inputRef.current.tiltActive = false;
    inputRef.current.tilt = 0;
    inputRef.current.pitch = 0;
    setTilt("off");
  }, []);

  const recenter = useCallback(() => {
    neutralRef.current = null;
  }, []);

  // ── Full screen (real fullscreen where allowed, otherwise fill the window) ──
  const enterFull = useCallback(() => {
    setFull(true);
    const el = wrapRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    if (!el) return;
    const lock = () => {
      const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      o?.lock?.("landscape").catch(() => {});
    };
    if (el.requestFullscreen) el.requestFullscreen({ navigationUI: "hide" }).then(lock).catch(() => {});
    else el.webkitRequestFullscreen?.();
  }, []);

  const exitFull = useCallback(() => {
    setFull(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFull(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // ── Game flow ──
  const unlocked = (i: number) => i === 0 || stars[i - 1] > 0;

  const pickPlane = (i: number) => {
    setPlane(i);
    try {
      localStorage.setItem(PLANE_KEY, String(i));
    } catch {
      /* ignore */
    }
    engineRef.current?.preview(levelIdx, i);
  };

  const startLevel = (lv: number) => {
    if (!unlocked(lv)) return;
    setLevelIdx(lv);
    levelRef.current = lv;
    if (touch) {
      enterFull();
      if (!tiltOptOutRef.current) enableTilt();
    }
    // Whatever way the phone is held when the countdown starts = flying straight.
    neutralRef.current = null;
    engineRef.current?.start(lv, plane);
    setHud(EMPTY_HUD);
    setResult(null);
    setPhase("racing");
  };

  const backToMenu = () => {
    engineRef.current?.toMenu();
    engineRef.current?.preview(levelIdx, plane);
    setPhase("menu");
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    engineRef.current?.setMuted(m);
  };

  const hold = (key: HoldKey) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      inputRef.current[key] = true;
    },
    onPointerUp: () => {
      inputRef.current[key] = false;
    },
    onPointerCancel: () => {
      inputRef.current[key] = false;
    },
    onLostPointerCapture: () => {
      inputRef.current[key] = false;
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const pill = "font-extrabold text-white bg-black/45 backdrop-blur-sm rounded-full px-3 py-1 text-sm sm:text-base shadow";
  const iconBtn = "font-extrabold text-white bg-black/45 backdrop-blur-sm rounded-full w-10 h-10 shadow flex items-center justify-center text-lg";
  const pad = "select-none touch-none rounded-3xl font-black text-white shadow-lg active:scale-90 transition-transform border-4 border-white/40 w-20 h-20 text-4xl";

  if (!webglOk) {
    return (
      <div className="rounded-3xl bg-ink/90 p-8 text-center font-bold text-white">
        Oh no! This game needs 3D graphics (WebGL), and this browser doesn&apos;t have it turned on. Try Chrome or Safari.
      </div>
    );
  }

  const level = LEVELS[levelIdx];
  const nextLevel = levelIdx + 1 < LEVELS.length ? levelIdx + 1 : null;

  return (
    <div className="flex w-full flex-col items-center">
      <div
        ref={wrapRef}
        className={
          full
            ? "fixed inset-0 z-[100] select-none bg-black"
            : "relative aspect-[4/5] w-full select-none overflow-hidden rounded-3xl bg-black shadow-xl sm:aspect-video"
        }
        style={{ touchAction: "none", WebkitUserSelect: "none" }}
      >
        <div ref={mountRef} className="absolute inset-0" />

        {/* Hit flashes */}
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${flash === "bonk" ? "opacity-100" : "opacity-0"}`}
          style={{ background: "radial-gradient(circle, rgba(255,92,122,0) 35%, rgba(255,92,122,0.5) 100%)" }}
        />
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${flash === "ring" ? "opacity-100" : "opacity-0"}`}
          style={{ background: "radial-gradient(circle, rgba(255,197,61,0) 45%, rgba(255,197,61,0.45) 100%)" }}
        />

        {phase === "racing" && (
          <>
            {/* Race progress: every plane on a line to the finish flag */}
            <div className="pointer-events-none absolute left-1/2 top-3 w-[min(70%,520px)] -translate-x-1/2">
              <div className="relative h-4 rounded-full border-2 border-white/60 bg-black/35">
                {hud.racers.map((r, i) => (
                  <div
                    key={i}
                    className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                      r.me ? "z-10 h-7 w-7 border-white" : "h-4 w-4 border-white/70"
                    }`}
                    style={{ left: `${r.frac * 100}%`, backgroundColor: r.color }}
                  >
                    {r.me && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-sm">✈️</span>}
                  </div>
                ))}
                <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-2xl">🏁</span>
              </div>
            </div>

            {/* Place + rings */}
            <div className="pointer-events-none absolute left-3 top-10 flex flex-col items-start gap-1.5 sm:top-3">
              <div className="rounded-2xl bg-black/50 px-3 py-1 text-center text-white shadow backdrop-blur-sm">
                <div className="text-3xl font-black leading-none sm:text-4xl">
                  {MEDALS[Math.min(3, hud.place - 1)]} {ordinal(hud.place)}
                </div>
              </div>
              <span className={pill}>
                ⭕ {hud.rings}/{hud.ringsTotal}
              </span>
            </div>

            <div className="absolute right-3 top-10 flex flex-col gap-1.5 sm:top-3">
              <button type="button" aria-label={muted ? "Sound on" : "Sound off"} onClick={toggleMute} className={iconBtn}>
                {muted ? "🔇" : "🔊"}
              </button>
              {touch && (
                <button
                  type="button"
                  aria-label={tilt === "on" ? "Use buttons" : "Tilt the phone"}
                  onClick={tilt === "on" ? disableTilt : enableTilt}
                  className={iconBtn}
                >
                  {tilt === "on" ? "📱" : "🎮"}
                </button>
              )}
              {tilt === "on" && (
                <button type="button" aria-label="Fly straight from here" onClick={recenter} className={iconBtn}>
                  🎯
                </button>
              )}
              <button
                type="button"
                aria-label={full ? "Small screen" : "Full screen"}
                onClick={full ? exitFull : enterFull}
                className={iconBtn}
              >
                {full ? "✕" : "⛶"}
              </button>
            </div>

            {hud.boost && (
              <div className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 animate-pulse text-2xl font-black text-sun drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:bottom-6">
                🚀 TURBO!
              </div>
            )}

            {tilt === "waiting" && (
              <div className={`${pill} pointer-events-none absolute left-1/2 top-12 -translate-x-1/2`}>Checking tilt…</div>
            )}

            {/* Big buttons when the phone isn't doing the steering */}
            {touch && tilt !== "on" && (
              <>
                <div className="absolute bottom-4 left-4 flex gap-3">
                  <button type="button" aria-label="Left" {...hold("left")} className={`${pad} bg-sky/70`}>
                    ◀
                  </button>
                  <button type="button" aria-label="Right" {...hold("right")} className={`${pad} bg-sky/70`}>
                    ▶
                  </button>
                </div>
                <div className="absolute bottom-4 right-4 flex flex-col gap-3">
                  <button type="button" aria-label="Up" {...hold("up")} className={`${pad} bg-mint/70`}>
                    ▲
                  </button>
                  <button type="button" aria-label="Down" {...hold("down")} className={`${pad} bg-tangerine/70`}>
                    ▼
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* 3… 2… 1… GO! */}
        {count && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              key={count}
              className={`animate-pop-in font-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${
                count === "GO!" ? "text-8xl text-mint sm:text-9xl" : "text-8xl text-white sm:text-9xl"
              }`}
            >
              {count}
            </div>
          </div>
        )}

        {toast && phase === "racing" && !count && (
          <div
            key={toast + hud.rings}
            className="animate-pop-in pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 whitespace-nowrap text-4xl font-black text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)]"
          >
            {toast}
          </div>
        )}

        {/* Menu: pick a plane, then tap a world to race */}
        {phase === "menu" && (
          <div className="absolute inset-0 overflow-y-auto bg-gradient-to-b from-black/20 via-black/35 to-black/70 p-3 sm:p-5">
            <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center text-center">
              <h2 className="text-4xl font-black text-white drop-shadow-lg sm:text-6xl [@media(max-height:500px)]:text-3xl">
                <span aria-hidden="true">✈️</span> Sky Race 3D
              </h2>
              <p className="mt-1 text-sm font-bold text-white/90 sm:text-lg [@media(max-height:500px)]:hidden">
                Fly through the ⭕ rings to go super fast! Dodge the 🎈 balloons. Be first to the 🏁!
              </p>

              <p className="mt-3 text-sm font-black uppercase tracking-wide text-sun">1. Pick your plane</p>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {PLANES.map((p, i) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => pickPlane(i)}
                    className={`rounded-2xl px-3 py-2 text-sm font-extrabold text-white shadow-lg transition-transform sm:text-base ${
                      plane === i ? "scale-110 ring-4 ring-white" : "opacity-80 hover:scale-105"
                    }`}
                    style={{ backgroundColor: `#${p.body.toString(16).padStart(6, "0")}` }}
                  >
                    <span className="block text-2xl" aria-hidden="true">
                      {p.kind === "jet" ? "🛩️" : "✈️"}
                    </span>
                    {p.name}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-sm font-black uppercase tracking-wide text-sun">2. Tap a world to fly!</p>
              <div className="mt-1 grid w-full grid-cols-3 gap-2 sm:grid-cols-5">
                {LEVELS.map((lv, i) => {
                  const open = unlocked(i);
                  return (
                    <button
                      key={lv.name}
                      type="button"
                      onClick={() => startLevel(i)}
                      disabled={!open}
                      className={`rounded-2xl p-2 font-extrabold shadow-[0_5px_0_rgba(0,0,0,0.35)] transition-transform ${
                        open ? "bg-white text-ink hover:-translate-y-1 active:translate-y-1" : "cursor-not-allowed bg-white/30 text-white/70"
                      }`}
                    >
                      <span className="block text-3xl sm:text-4xl" aria-hidden="true">
                        {open ? lv.emoji : "🔒"}
                      </span>
                      <span className="block text-xs sm:text-sm">
                        {i + 1}. {lv.name}
                      </span>
                      <span className="block text-sm leading-tight" aria-label={`${stars[i]} stars`}>
                        {open ? "⭐".repeat(stars[i]) + "☆".repeat(3 - stars[i]) : " "}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-3 text-xs font-bold text-white/80 sm:text-sm [@media(max-height:500px)]:hidden">
                {touch
                  ? "📱 Hold your phone sideways like a steering wheel. Turn it to go left and right, tip it to go up and down!"
                  : "⬅️ ➡️ to steer · ⬆️ ⬇️ to go up and down"}
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {phase === "results" && result && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-4">
            {result.place === 1 && <Confetti count={50} />}
            <div className="animate-pop-in relative z-30 text-center">
              <div className="text-7xl sm:text-8xl" aria-hidden="true">
                {MEDALS[Math.min(3, result.place - 1)]}
              </div>
              <h2 className="text-4xl font-black text-white sm:text-5xl">
                {result.place === 1 ? "You won! 🎉" : `You came ${ordinal(result.place)}!`}
              </h2>
              <p className="mt-1 text-4xl" aria-label={`${starsForPlace(result.place)} stars`}>
                {"⭐".repeat(starsForPlace(result.place))}
                <span className="opacity-40">{"⭐".repeat(3 - starsForPlace(result.place))}</span>
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <span className={pill}>
                  ⭕ {result.rings}/{result.ringsTotal} rings
                </span>
                <span className={pill}>⏱️ {result.seconds} seconds</span>
              </div>
              {result.place > 1 && (
                <p className="mt-2 text-sm font-bold text-white/85">Tip: fly through more ⭕ rings to go faster!</p>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {nextLevel !== null && unlocked(nextLevel) && (
                  <button type="button" onClick={() => startLevel(nextLevel)} className="toy-button bg-mint text-ink">
                    Next: {LEVELS[nextLevel].emoji} {LEVELS[nextLevel].name} ➡️
                  </button>
                )}
                <button type="button" onClick={() => startLevel(levelIdx)} className="toy-button bg-sun text-ink">
                  Fly again 🔄
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exitFull();
                    backToMenu();
                  }}
                  className="toy-button bg-white text-ink"
                >
                  Menu 🏠
                </button>
              </div>
              {nextLevel === null && result.place === 1 && (
                <p className="mt-3 text-lg font-black text-sun">🏆 You beat every world! Super pilot! 🏆</p>
              )}
            </div>
          </div>
        )}

        {phase !== "menu" && (
          <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/50">
            {level.emoji} {level.name}
          </div>
        )}
      </div>

      <p className="mt-3 max-w-xl text-center text-sm font-semibold text-white/70">
        On a phone: hold it sideways with both hands like a steering wheel. Turn it to steer, tip the top towards you to
        climb and away to dive. Tap 🎯 to fly straight again. On a computer: arrow keys or W A S D.
      </p>
    </div>
  );
}

// The race course and the five worlds. Everything here is plain maths (no
// three.js), so the engine and the menu can both use it.

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Theme = "hills" | "beach" | "desert" | "snow" | "city";

export interface Level {
  name: string;
  emoji: string;
  theme: Theme;
  /** Distance from the start line to the finish line, in metres. */
  length: number;
  /** How fast the other planes are, compared with Yusuf's plane. */
  rivals: [number, number, number];
  /** How many balloons float in the way (per kilometre). */
  balloons: number;
  ground: number;
  ground2: number;
  skyTop: number;
  horizon: number;
  fog: number;
  sun: number;
  night: boolean;
}

export const LEVELS: Level[] = [
  {
    name: "Green Hills", emoji: "🌳", theme: "hills", length: 2400, rivals: [0.86, 0.9, 0.93], balloons: 3,
    ground: 0x62b04a, ground2: 0x8fcf5a, skyTop: 0x3d8ee8, horizon: 0xcfe9ff, fog: 0xcfe9ff, sun: 0xfff3d6, night: false,
  },
  {
    name: "Sunny Beach", emoji: "🏖️", theme: "beach", length: 2800, rivals: [0.88, 0.92, 0.95], balloons: 4,
    ground: 0x1f9fd8, ground2: 0x45c2ea, skyTop: 0x2a86e6, horizon: 0xd8f3ff, fog: 0xd6f1ff, sun: 0xfff6dc, night: false,
  },
  {
    name: "Desert Canyon", emoji: "🏜️", theme: "desert", length: 3200, rivals: [0.9, 0.94, 0.97], balloons: 5,
    ground: 0xe0a85a, ground2: 0xf0c47c, skyTop: 0x4a8fe0, horizon: 0xffe2b8, fog: 0xffe0b5, sun: 0xffe7b0, night: false,
  },
  {
    name: "Snowy Mountains", emoji: "❄️", theme: "snow", length: 3600, rivals: [0.91, 0.95, 0.98], balloons: 5,
    ground: 0xeef4fb, ground2: 0xd5e3f2, skyTop: 0x5f8fd0, horizon: 0xe8f1fb, fog: 0xe6eef8, sun: 0xffffff, night: false,
  },
  {
    name: "Night City", emoji: "🌃", theme: "city", length: 4000, rivals: [0.92, 0.96, 0.99], balloons: 6,
    ground: 0x2c3448, ground2: 0x3a4460, skyTop: 0x070b24, horizon: 0x3b2a6a, fog: 0x2a2350, sun: 0xb9c8ff, night: true,
  },
];

/** Cruising speed of the player's plane (m/s). Rings push it higher for a bit. */
export const CRUISE = 48;
export const BOOST = 74;
/** How far the plane may stray sideways from the middle of the course. */
export const CORRIDOR = 55;
export const MIN_ALT = 10;
export const MAX_ALT = 70;
/** Rings are big so a five-year-old can actually fly through them. */
export const RING_R = 7;

/** Middle of the course, sideways (x), at distance s along it. */
export function courseX(s: number): number {
  return 38 * Math.sin(s / 260) + 18 * Math.sin(s / 113 + 1.3);
}

/** Middle of the course, height (y), at distance s along it. */
export function courseY(s: number): number {
  return 34 + 9 * Math.sin(s / 190 + 0.4) + 4 * Math.sin(s / 71);
}

/** Bumpy ground: flat-ish under the course, mountains further out. */
export function groundH(x: number, s: number, theme: Theme): number {
  const d = Math.abs(x - courseX(s));
  const rolling = 3 * Math.sin(x / 37 + s / 53) + 2.2 * Math.sin(x / 19 - s / 29);
  if (theme === "beach") {
    // Sea in the middle, sandy islands poking up here and there.
    const island = Math.max(0, Math.sin(x / 61) * Math.sin(s / 77) - 0.55) * 22;
    return -1 + island + smoothstep(160, 330, d) * 26;
  }
  if (theme === "city") return 0;
  const far = smoothstep(75, 260, d);
  const peaks = theme === "snow" ? 120 : theme === "desert" ? 60 : 55;
  const bumps = 0.6 + 0.4 * Math.sin(x / 47 + 2) * Math.sin(s / 61 + 1);
  const mesa = theme === "desert" ? Math.min(1, far * 1.6) : far * far;
  return rolling * (1 - far * 0.5) + mesa * peaks * bumps;
}

/** Where along the course each ring sits, plus a small wiggle off the middle. */
export function ringsFor(level: Level, seed: number) {
  const rnd = mulberry32(seed);
  const rings: { s: number; dx: number; dy: number }[] = [];
  for (let s = 160; s < level.length - 80; s += 130 + rnd() * 50) {
    rings.push({ s, dx: (rnd() - 0.5) * 22, dy: (rnd() - 0.5) * 10 });
  }
  return rings;
}

export function ordinal(n: number): string {
  return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
}

/** 1st place = 3 stars, 2nd = 2, anything else = 1 (everyone who finishes gets one!). */
export function starsForPlace(place: number): number {
  return place === 1 ? 3 : place === 2 ? 2 : 1;
}

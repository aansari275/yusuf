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

export type Theme = "hills" | "beach" | "autumn" | "desert" | "snow" | "candy" | "volcano" | "city" | "storm" | "space";

/** Things that move about and bonk you if you fly into them. */
export type Hazard = "none" | "birds" | "fireballs" | "storms" | "asteroids";

export interface Level {
  name: string;
  emoji: string;
  theme: Theme;
  /** Shown during the countdown: what's new in this world. */
  tip: string;
  /** Distance from the start line to the finish line, in metres. */
  length: number;
  /** How fast the other planes are, compared with the player's plane. */
  rivals: [number, number, number];
  /** How many balloons float in the way (per kilometre). */
  balloons: number;
  /** 0 = rings stay still; 1 = rings swoop about a lot. */
  ringMove: number;
  hazard: Hazard;
  /** Moving hazards per kilometre. */
  hazards: number;
  /** Sideways gusts of wind, 0 = calm. */
  wind: number;
  /** Rings needed for this world's 🏆 Ring Challenge trophy. */
  goal: number;
  ground: number;
  ground2: number;
  skyTop: number;
  horizon: number;
  fog: number;
  sun: number;
  night: boolean;
}

type Look = Pick<Level, "ground" | "ground2" | "skyTop" | "horizon" | "fog" | "sun" | "night">;
const day = (ground: number, ground2: number, skyTop: number, horizon: number, sun = 0xfff3d6): Look =>
  ({ ground, ground2, skyTop, horizon, fog: horizon, sun, night: false });

// Each world adds one new thing, so there is always something to look forward to.
export const LEVELS: Level[] = [
  {
    name: "Green Hills", emoji: "🌳", theme: "hills", tip: "Fly through the gold rings for TURBO! 🚀",
    length: 2400, rivals: [0.86, 0.9, 0.93], balloons: 3, ringMove: 0, hazard: "none", hazards: 0, wind: 0, goal: 8,
    ...day(0x62b04a, 0x8fcf5a, 0x3d8ee8, 0xcfe9ff),
  },
  {
    name: "Sunny Beach", emoji: "🏖️", theme: "beach", tip: "Rainbow rings give MEGA turbo! 🌈",
    length: 2800, rivals: [0.88, 0.92, 0.95], balloons: 4, ringMove: 0, hazard: "none", hazards: 0, wind: 0, goal: 10,
    ...day(0x1f9fd8, 0x45c2ea, 0x2a86e6, 0xd8f3ff, 0xfff6dc),
  },
  {
    name: "Autumn Forest", emoji: "🍂", theme: "autumn", tip: "Watch out — the rings start to move! 👀",
    length: 3000, rivals: [0.89, 0.93, 0.96], balloons: 4, ringMove: 0.35, hazard: "none", hazards: 0, wind: 0, goal: 10,
    ...day(0xb98a3a, 0xd6a24a, 0x4a8fe0, 0xffe6c4, 0xffe2b0),
  },
  {
    name: "Desert Canyon", emoji: "🏜️", theme: "desert", tip: "Birds are flying across — dodge them! 🐦",
    length: 3200, rivals: [0.9, 0.94, 0.97], balloons: 3, ringMove: 0.45, hazard: "birds", hazards: 3, wind: 0, goal: 11,
    ...day(0xe0a85a, 0xf0c47c, 0x4a8fe0, 0xffe2b8, 0xffe7b0),
  },
  {
    name: "Snowy Mountains", emoji: "❄️", theme: "snow", tip: "Windy up here! Hold steady! 💨",
    length: 3400, rivals: [0.91, 0.95, 0.98], balloons: 3, ringMove: 0.5, hazard: "birds", hazards: 3, wind: 0.5, goal: 12,
    ...day(0xeef4fb, 0xd5e3f2, 0x5f8fd0, 0xe8f1fb, 0xffffff),
  },
  {
    name: "Candy Clouds", emoji: "🍭", theme: "candy", tip: "Super swoopy rings in candy land! 🍬",
    length: 3500, rivals: [0.92, 0.96, 0.99], balloons: 5, ringMove: 0.8, hazard: "birds", hazards: 4, wind: 0, goal: 12,
    ...day(0xf25fa8, 0xff86c2, 0x8f7bff, 0xffe0f4, 0xfff0f8),
  },
  {
    name: "Volcano Island", emoji: "🌋", theme: "volcano", tip: "Fireballs shoot up from the lava! 🔥",
    length: 3600, rivals: [0.93, 0.97, 1.0], balloons: 2, ringMove: 0.6, hazard: "fireballs", hazards: 6, wind: 0, goal: 13,
    ...day(0x3b2c2c, 0x553a30, 0x7a3a3a, 0xffa36b, 0xffc08a),
  },
  {
    name: "Night City", emoji: "🌃", theme: "city", tip: "Race through the city lights at night! ✨",
    length: 3800, rivals: [0.94, 0.98, 1.01], balloons: 5, ringMove: 0.7, hazard: "birds", hazards: 4, wind: 0.3, goal: 14,
    ground: 0x2c3448, ground2: 0x3a4460, skyTop: 0x070b24, horizon: 0x3b2a6a, fog: 0x2a2350, sun: 0xb9c8ff, night: true,
  },
  {
    name: "Thunder Storm", emoji: "⛈️", theme: "storm", tip: "Big wind and thunder clouds — fly around them! ⚡",
    length: 4000, rivals: [0.95, 0.99, 1.02], balloons: 2, ringMove: 0.7, hazard: "storms", hazards: 5, wind: 1, goal: 14,
    ground: 0x3d5a3a, ground2: 0x4d6a45, skyTop: 0x2b3340, horizon: 0x6b7686, fog: 0x5d6878, sun: 0xc8d2e0, night: false,
  },
  {
    name: "Outer Space", emoji: "🚀", theme: "space", tip: "The final race! Dodge the space rocks! ☄️",
    length: 4400, rivals: [0.96, 1.0, 1.03], balloons: 0, ringMove: 1, hazard: "asteroids", hazards: 8, wind: 0, goal: 16,
    ground: 0x6d6a78, ground2: 0x8a8796, skyTop: 0x02030a, horizon: 0x1a1240, fog: 0x0b0820, sun: 0xffffff, night: true,
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
  if (theme === "space") {
    // Moon dust with round craters
    const crater = Math.sin(x / 29) * Math.sin(s / 31);
    return 2 * rolling * 0.5 + (crater > 0.7 ? -6 * (crater - 0.7) / 0.3 : 0) + smoothstep(150, 380, d) * 40;
  }
  if (theme === "candy") return rolling * 1.6 + smoothstep(90, 300, d) * 30 * (0.6 + 0.4 * Math.sin(x / 33));
  const far = smoothstep(75, 260, d);
  const peaks = theme === "snow" ? 120 : theme === "volcano" ? 90 : theme === "desert" ? 60 : 55;
  const bumps = 0.6 + 0.4 * Math.sin(x / 47 + 2) * Math.sin(s / 61 + 1);
  const mesa = theme === "desert" ? Math.min(1, far * 1.6) : far * far;
  return rolling * (1 - far * 0.5) + mesa * peaks * bumps;
}

/** Where along the course each ring sits, plus a small wiggle off the middle. */
export function ringsFor(level: Level, seed: number) {
  const rnd = mulberry32(seed);
  const rings: { s: number; dx: number; dy: number; phase: number; rainbow: boolean }[] = [];
  let k = 0;
  for (let s = 160; s < level.length - 80; s += 130 + rnd() * 50) {
    // From the beach onwards, every fifth ring is a rainbow MEGA-turbo ring.
    const rainbow = level.theme !== "hills" && k % 5 === 4;
    rings.push({ s, dx: (rnd() - 0.5) * 22, dy: (rnd() - 0.5) * 10, phase: rnd() * Math.PI * 2, rainbow });
    k++;
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

import * as THREE from "three";
import {
  BOOST, CORRIDOR, CRUISE, LEVELS, Level, MAX_ALT, MIN_ALT, RING_R,
  clamp, courseX, courseY, groundH, lerp, mulberry32, ringsFor, smoothstep,
} from "./world";
import {
  GEO, HazardModel, Lists, PLANES, PlaneModel, Rnd,
  asteroid, autumnTree, balloon, birdFlock, boat, building, cactus, cloud, fireball, gumdrop, house, lavaPool,
  lollipop, makePlane, merge, moonRock, palm, pine, planet, pumpkin, pyramid, rock, rocket, snowman, stormCloud,
  tree, volcano,
} from "./models";

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  /** -1 … 1 from the phone's tilt. */
  tilt: number;
  pitch: number;
  tiltActive: boolean;
}

export interface Racer {
  frac: number;
  color: string;
  me: boolean;
}

export interface Hud {
  place: number;
  rings: number;
  ringsTotal: number;
  racers: Racer[];
  boost: boolean;
  /** Which way the wind is pushing right now: -1 (left) … 1 (right), 0 = calm. */
  wind: number;
}

export interface RaceResult {
  place: number;
  rings: number;
  ringsTotal: number;
  seconds: number;
  /** Rings needed for this world's 🏆 Ring Challenge. */
  goal: number;
}

export interface EngineCallbacks {
  onHud: (h: Hud) => void;
  /** "3", "2", "1", "GO!" — then null to clear it. */
  onCount: (label: string | null) => void;
  /** `mega` = a rainbow ring (extra-long turbo). */
  onRing: (mega: boolean) => void;
  /** A lightning flash in the thunder storm. */
  onLightning: () => void;
  onBonk: () => void;
  onFinish: (r: RaceResult) => void;
}

export interface Engine {
  start: (level: number, plane: number) => void;
  /** Shows the chosen plane and world flying behind the menu. */
  preview: (level: number, plane: number) => void;
  toMenu: () => void;
  setMuted: (m: boolean) => void;
  dispose: () => void;
}

type Phase = "menu" | "countdown" | "racing" | "done";

const CHUNK = 300;
const COLS = [-700, -520, -400, -310, -240, -185, -145, -112, -86, -66, -50, -36, -24, -12, 0,
  12, 24, 36, 50, 66, 86, 112, 145, 185, 240, 310, 400, 520, 700];
const COUNTDOWN = 3;
const AFTER_FINISH = 2.6;

// ── Sky ────────────────────────────────────────────────────────────────────

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const SKY_FRAG = /* glsl */ `
uniform vec3 top;
uniform vec3 horizon;
uniform vec3 sunDir;
uniform vec3 sunColor;
uniform float night;
varying vec3 vDir;
float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(horizon, top, pow(smoothstep(-0.05, 0.5, h), 0.7));
  float sd = max(dot(d, normalize(sunDir)), 0.0);
  col += sunColor * (pow(sd, 900.0) * 5.0 + pow(sd, 16.0) * 0.3);
  float star = step(0.998, hash(floor(d * 300.0))) * night * smoothstep(0.05, 0.3, h);
  col += vec3(star);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function checkerTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 16; x++) {
      g.fillStyle = (x + y) % 2 ? "#111" : "#fff";
      g.fillRect(x * 16, y * 16, 16, 16);
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function hex(n: number) {
  return `#${n.toString(16).padStart(6, "0")}`;
}

// ── Engine ─────────────────────────────────────────────────────────────────

interface Ring {
  s: number;
  x: number;
  y: number;
  /** Where the ring sits when it isn't swooping about. */
  bx: number;
  by: number;
  phase: number;
  rainbow: boolean;
  mesh: THREE.Mesh;
  done: boolean;
}
interface Hazard { s: number; x: number; y: number; bx: number; by: number; phase: number; model: HazardModel }
interface Balloon { s: number; x: number; y: number }
interface Rival {
  model: PlaneModel;
  color: string;
  s: number;
  x: number;
  y: number;
  factor: number;
  wob: number;
  lane: number;
  yaw: number;
  bank: number;
  finishedAt: number;
}

export function createEngine(mount: HTMLElement, input: InputState, cb: EngineCallbacks, mobile: boolean): Engine {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0xcfe9ff, 160, 850);
  scene.fog = fog;

  const camera = new THREE.PerspectiveCamera(68, 16 / 9, 0.5, 2600);
  scene.add(camera);

  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x5a7a3a, 1.3);
  scene.add(hemi);
  let hemiBase = 1.3;
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.castShadow = true;
  const shadowSize = mobile ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  const sc = sun.shadow.camera;
  sc.left = -60; sc.right = 60; sc.top = 60; sc.bottom = -60; sc.near = 1; sc.far = 400;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.08;
  scene.add(sun, sun.target);
  const sunDir = new THREE.Vector3(0.45, 0.75, -0.5).normalize();

  const skyUniforms = {
    top: { value: new THREE.Color() },
    horizon: { value: new THREE.Color() },
    sunDir: { value: sunDir.clone() },
    sunColor: { value: new THREE.Color() },
    night: { value: 0 },
  };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const skyGeo = new THREE.SphereGeometry(2000, 32, 16);
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  scene.add(sky);

  const groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true });
  const propMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true });
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffc531, emissive: 0xff9a00, emissiveIntensity: 0.55, metalness: 0.6, roughness: 0.25,
  });
  const ringDoneMat = new THREE.MeshBasicMaterial({ color: 0x5dff9a, transparent: true, opacity: 0.5, toneMapped: false });
  const ringGeo = new THREE.TorusGeometry(RING_R, 0.75, 10, 36);
  const rainbowMat = new THREE.MeshBasicMaterial({ color: 0xff5c7a, toneMapped: false });
  const rainbowGeo = new THREE.TorusGeometry(RING_R * 1.2, 1.1, 10, 40);
  const checker = checkerTexture();
  const checkerMat = new THREE.MeshStandardMaterial({ map: checker, roughness: 0.6 });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xff5c7a, roughness: 0.5 });
  const startMat = new THREE.MeshStandardMaterial({ color: 0x41b6ff, roughness: 0.5 });

  // Falling snow (snowy world) or rain (thunder storm).
  const SNOW_N = mobile ? 700 : 1400;
  const snowGeo = new THREE.BufferGeometry();
  const snowPos = new Float32Array(SNOW_N * 3);
  for (let k = 0; k < SNOW_N; k++) {
    snowPos[k * 3] = (Math.random() - 0.5) * 120;
    snowPos[k * 3 + 1] = (Math.random() - 0.5) * 60;
    snowPos[k * 3 + 2] = (Math.random() - 0.5) * 120;
  }
  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  const snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.9, depthWrite: false });
  const snow = new THREE.Points(snowGeo, snowMat);
  snow.frustumCulled = false;
  snow.visible = false;
  scene.add(snow);

  // Wind streaks while boosting
  const STREAK_N = 60;
  const streakGeo = new THREE.BufferGeometry();
  const streakPos = new Float32Array(STREAK_N * 6);
  streakGeo.setAttribute("position", new THREE.BufferAttribute(streakPos, 3));
  const streakMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const streaks = new THREE.LineSegments(streakGeo, streakMat);
  streaks.frustumCulled = false;
  scene.add(streaks);
  const streakSeed = Array.from({ length: STREAK_N }, () => ({
    x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 24, z: Math.random() * 80,
  }));

  const disposables: { dispose: () => void }[] = [
    skyGeo, skyMat, groundMat, propMat, glowMat, ringMat, ringDoneMat, ringGeo, rainbowMat, rainbowGeo, checker, checkerMat,
    pillarMat, startMat, snowGeo, snowMat, streakGeo, streakMat,
  ];

  // ── Level building ──
  let level: Level = LEVELS[0];
  let levelIdx = -1;
  let world = new THREE.Group();
  scene.add(world);
  let worldGeos: THREE.BufferGeometry[] = [];
  let rings: Ring[] = [];
  let balloons: Balloon[] = [];
  let hazards: Hazard[] = [];

  const cA = new THREE.Color();
  const cB = new THREE.Color();
  const cT = new THREE.Color();
  /** Scratch colour for groundColor — must not be the colour it writes into. */
  const cD = new THREE.Color();

  function groundColor(x: number, s: number, h: number, out: THREE.Color) {
    const n = 0.5 + 0.5 * Math.sin(x / 23 + s / 31) * Math.sin(x / 41 - s / 17);
    out.copy(cA.set(level.ground)).lerp(cB.set(level.ground2), n);
    switch (level.theme) {
      case "hills":
        if (h > 26) out.lerp(cD.set(0x8a8f7a), smoothstep(26, 36, h));
        if (h > 40) out.lerp(cD.set(0xffffff), smoothstep(40, 48, h));
        break;
      case "beach":
        if (h > 0.2) out.copy(cD.set(0xf3dc9a));
        if (h > 3) out.copy(cD.set(0x5fb54a)).lerp(cA.set(0x7fcf5a), n);
        break;
      case "desert":
        if (h > 10) out.copy(cD.set(Math.floor(h / 7) % 2 ? 0xc9773f : 0xd98f4f));
        break;
      case "snow":
        if (h > 25 && h < 80) out.lerp(cD.set(0x9aa8b8), 0.35 * n);
        break;
      case "autumn":
        if (h > 26) out.lerp(cD.set(0x8a7a6a), smoothstep(26, 40, h));
        break;
      case "candy":
        // Pink candy ground with minty stripes and icing-white hilltops
        out.lerp(cD.set(0x7fe0c8), 0.7 * smoothstep(0.8, 0.95, Math.sin(x / 40 + s / 70)));
        if (h > 22) out.lerp(cD.set(0xffffff), smoothstep(22, 30, h));
        break;
      case "volcano":
        if (h < -2.5) out.set(0xff6a1a); // lava!
        else if (h > 20) out.lerp(cD.set(0x241a1a), smoothstep(20, 40, h));
        break;
      case "storm":
        if (h > 30) out.lerp(cD.set(0x5a6058), smoothstep(30, 45, h));
        break;
      case "space":
        if (h < -1) out.lerp(cD.set(0x4a4856), smoothstep(-1, -4, h));
        break;
      case "city":
        // Bright street lines in a grid
        if (Math.abs(((x + 1000) % 60) - 30) < 2.5 || Math.abs(((s + 1000) % 60) - 30) < 2.5) out.set(0x51597a);
        break;
    }
  }

  function buildTerrain(s0: number) {
    const rows = CHUNK / 10 + 1;
    const cols = COLS.length;
    const pos = new Float32Array(rows * cols * 3);
    const col = new Float32Array(rows * cols * 3);
    let p = 0;
    for (let r = 0; r < rows; r++) {
      const s = s0 + r * 10;
      const c = courseX(s);
      for (const u of COLS) {
        const x = c + u;
        const y = groundH(x, s, level.theme);
        pos[p * 3] = x;
        pos[p * 3 + 1] = y;
        pos[p * 3 + 2] = -s;
        groundColor(x, s, y, cT);
        col[p * 3] = cT.r;
        col[p * 3 + 1] = cT.g;
        col[p * 3 + 2] = cT.b;
        p++;
      }
    }
    const idx: number[] = [];
    for (let r = 0; r < rows - 1; r++)
      for (let k = 0; k < cols - 1; k++) {
        const a = r * cols + k;
        const b = a + 1;
        const c2 = a + cols;
        const d = c2 + 1;
        idx.push(a, b, c2, b, d, c2);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function scatter(L: Lists, s0: number, rnd: Rnd) {
    const t = level.theme;
    if (t === "city") {
      for (const side of [-1, 1])
        for (let s = s0; s < s0 + CHUNK; s += 24 + rnd() * 10) {
          for (let row = 0; row < 3; row++) {
            const d = 80 + row * 55 + rnd() * 20;
            const x = courseX(s) + side * d;
            const h = 18 + rnd() * 30 + row * 18;
            building(L, x, -s, 10 + rnd() * 10, h, 10 + rnd() * 8, rnd);
          }
        }
      return;
    }
    const n = mobile ? 55 : 85;
    for (let k = 0; k < n; k++) {
      const s = s0 + rnd() * CHUNK;
      const side = rnd() < 0.5 ? -1 : 1;
      const d = 22 + Math.pow(rnd(), 1.4) * 420;
      const x = courseX(s) + side * d;
      const y = groundH(x, s, t);
      const z = -s;
      const k2 = 0.9 + rnd() * 0.8;
      const r = rnd();
      if (t === "hills") {
        if (r < 0.6) tree(L, x, y, z, k2, rnd);
        else if (r < 0.8) house(L, x, y, z, k2, rnd);
        else rock(L, x, y, z, 2 + rnd() * 3, rnd, 0x8f9488);
      } else if (t === "beach") {
        if (y < 0.2) {
          if (r < 0.25) boat(L, x, -1, z, 1.2, rnd);
        } else if (r < 0.75) palm(L, x, y, z, k2, rnd);
        else house(L, x, y, z, k2 * 0.8, rnd);
      } else if (t === "desert") {
        if (r < 0.55) cactus(L, x, y, z, k2, rnd);
        else if (r < 0.65 && d > 120) pyramid(L, x, y, z, 1 + rnd());
        else rock(L, x, y, z, 2 + rnd() * 4, rnd, 0xc2733c);
      } else if (t === "snow") {
        if (r < 0.75) pine(L, x, y, z, k2, rnd, true);
        else if (r < 0.85) snowman(L, x, y, z, k2);
        else rock(L, x, y, z, 2 + rnd() * 3, rnd, 0x9aa8b8);
      } else if (t === "autumn") {
        if (r < 0.65) autumnTree(L, x, y, z, k2, rnd);
        else if (r < 0.8) house(L, x, y, z, k2, rnd);
        else if (r < 0.92) pumpkin(L, x, y, z, k2 * 1.4);
        else rock(L, x, y, z, 2 + rnd() * 3, rnd, 0x8f8478);
      } else if (t === "candy") {
        if (r < 0.45) lollipop(L, x, y, z, k2, rnd);
        else if (r < 0.8) gumdrop(L, x, y, z, k2 * 1.3, rnd);
        else tree(L, x, y, z, k2, rnd, 0xff9ccf, 0xffd1ea);
      } else if (t === "volcano") {
        if (r < 0.08 && d > 160) volcano(L, x, y, z, 1 + rnd() * 0.8);
        else if (r < 0.5) rock(L, x, y, z, 2 + rnd() * 4, rnd, 0x3a2c2a);
        else if (r < 0.7 && d < 200) lavaPool(L, x, y, z, 1 + rnd());
        else tree(L, x, y, z, k2, rnd, 0x3a3a2a, 0x2f5a30);
      } else if (t === "storm") {
        if (r < 0.6) pine(L, x, y, z, k2, rnd, false);
        else if (r < 0.75) house(L, x, y, z, k2, rnd);
        else tree(L, x, y, z, k2, rnd, 0x2f5a30, 0x3c6a38);
      } else if (t === "space") {
        if (r < 0.06 && d > 90) rocket(L, x, y, z, 1 + rnd() * 0.5);
        else moonRock(L, x, y, z, 1.5 + rnd() * 3, rnd);
      }
    }
    if (t === "space") {
      // Giant planets hanging in the black sky
      if (rnd() < 0.45) {
        const side = rnd() < 0.5 ? -1 : 1;
        const colors = [0xff9b5c, 0x7fb8ff, 0xc89bff, 0x7fe0b0];
        planet(L, courseX(s0) + side * (450 + rnd() * 300), 140 + rnd() * 200, -s0 - 500,
          50 + rnd() * 70, colors[Math.floor(rnd() * colors.length)], rnd() < 0.5);
      }
      return;
    }
    // Fluffy clouds — high up over the course, lower out to the sides.
    const cloudColor = t === "storm" ? 0x7a8290 : t === "candy" ? 0xfff0fa : t === "volcano" ? 0x8a7f7a : 0xffffff;
    for (let k = 0; k < (t === "candy" || t === "storm" ? 9 : 5); k++) {
      const s = s0 + rnd() * CHUNK;
      const side = rnd() < 0.5 ? -1 : 1;
      const d = rnd() * 450;
      const y = d < 70 ? 85 + rnd() * 40 : 45 + rnd() * 70;
      cloud(L, courseX(s) + side * d, y, -s, 1 + rnd() * 1.5, rnd, cloudColor);
    }
  }

  function arch(s: number, mat: THREE.Material, top: THREE.Material) {
    const cx = courseX(s);
    const h = Math.max(courseY(s) + 30, 60);
    const w = CORRIDOR * 2 + 16;
    const pillarGeo = new THREE.CylinderGeometry(3, 3.6, h, 16);
    const barGeo = new THREE.BoxGeometry(w, 8, 3);
    worldGeos.push(pillarGeo, barGeo);
    for (const side of [-1, 1]) {
      const m = new THREE.Mesh(pillarGeo, mat);
      m.position.set(cx + side * (w / 2), h / 2, -s);
      m.castShadow = true;
      world.add(m);
    }
    const bar = new THREE.Mesh(barGeo, top);
    bar.position.set(cx, h, -s);
    world.add(bar);
    (top as THREE.MeshStandardMaterial).map?.repeat.set(w / 16, 1);
  }

  function buildLevel(idx: number) {
    if (idx === levelIdx) return;
    clearLevel();
    levelIdx = idx;
    level = LEVELS[idx];
    const rnd = mulberry32(1000 + idx * 77);

    for (let s0 = -300; s0 < level.length + 700; s0 += CHUNK) {
      const tg = buildTerrain(s0);
      worldGeos.push(tg);
      const tm = new THREE.Mesh(tg, groundMat);
      tm.receiveShadow = true;
      world.add(tm);
      const L: Lists = { props: [], glow: [] };
      scatter(L, s0, rnd);
      const pg = merge(L.props);
      if (pg) {
        worldGeos.push(pg);
        const pm = new THREE.Mesh(pg, propMat);
        pm.receiveShadow = true;
        world.add(pm);
      }
      const gg = merge(L.glow);
      if (gg) {
        worldGeos.push(gg);
        world.add(new THREE.Mesh(gg, glowMat));
      }
    }

    // Rings to fly through
    rings = ringsFor(level, 31 + idx).map((r) => {
      const x = courseX(r.s) + r.dx;
      const y = courseY(r.s) + r.dy;
      const mesh = new THREE.Mesh(r.rainbow ? rainbowGeo : ringGeo, r.rainbow ? rainbowMat : ringMat);
      mesh.position.set(x, y, -r.s);
      mesh.rotation.y = -Math.atan((courseX(r.s + 1) - courseX(r.s - 1)) / 2);
      world.add(mesh);
      return { s: r.s, x, y, bx: x, by: y, phase: r.phase, rainbow: r.rainbow, mesh, done: false };
    });

    // Hot-air balloons to dodge, kept away from the rings
    balloons = [];
    const BL: Lists = { props: [], glow: [] };
    const count = Math.round((level.length / 1000) * level.balloons);
    for (let k = 0; k < count; k++) {
      const s = 300 + ((k + 0.5) / count) * (level.length - 450) + (rnd() - 0.5) * 60;
      if (rings.some((r) => Math.abs(r.s - s) < 45)) continue;
      const x = courseX(s) + (rnd() - 0.5) * 50;
      const y = courseY(s) + (rnd() - 0.5) * 12;
      balloon(BL, x, y, -s, rnd);
      balloons.push({ s, x, y });
    }
    // Extra balloons out of the way, just for looks
    for (let k = 0; k < (level.theme === "space" ? 0 : 16); k++) {
      const s = rnd() * level.length;
      const side = rnd() < 0.5 ? -1 : 1;
      balloon(BL, courseX(s) + side * (90 + rnd() * 200), 40 + rnd() * 50, -s, rnd);
    }
    const bg = merge(BL.props);
    if (bg) {
      worldGeos.push(bg);
      const bm = new THREE.Mesh(bg, propMat);
      bm.castShadow = true;
      world.add(bm);
    }

    // Moving hazards: birds, fireballs, thunder clouds or space rocks
    hazards = [];
    const hz = Math.round((level.length / 1000) * level.hazards);
    for (let k = 0; k < hz && level.hazard !== "none"; k++) {
      const s = 350 + ((k + 0.5) / hz) * (level.length - 500) + (rnd() - 0.5) * 40;
      if (rings.some((r) => Math.abs(r.s - s) < 35)) continue;
      const model =
        level.hazard === "birds" ? birdFlock(propMat)
        : level.hazard === "fireballs" ? fireball(glowMat)
        : level.hazard === "storms" ? stormCloud(propMat, rnd)
        : asteroid(propMat, rnd);
      const bx = courseX(s) + (rnd() - 0.5) * 40;
      const by = level.hazard === "storms" ? courseY(s) + 6 + rnd() * 6 : courseY(s) + (rnd() - 0.5) * 10;
      model.mesh.position.set(bx, by, -s);
      world.add(model.mesh);
      hazards.push({ s, x: bx, y: by, bx, by, phase: rnd() * Math.PI * 2, model });
    }

    arch(0, startMat, startMat);
    arch(level.length, pillarMat, checkerMat);

    // Sky, light and fog for this world
    skyUniforms.top.value.set(level.skyTop);
    skyUniforms.horizon.value.set(level.horizon);
    skyUniforms.sunColor.value.set(level.sun);
    skyUniforms.night.value = level.night ? 1 : 0;
    fog.color.set(level.fog);
    const space = level.theme === "space";
    const storm = level.theme === "storm";
    fog.near = space ? 400 : level.night ? 120 : storm ? 110 : 160;
    fog.far = space ? 1800 : level.night ? 700 : storm ? 620 : 850;
    hemi.color.set(space ? 0x9aa4c8 : level.night ? 0x5a63a8 : storm ? 0x9aa6b8 : 0xcfe6ff);
    const groundTint: Partial<Record<Level["theme"], number>> = {
      snow: 0xa0b4cc, candy: 0xffb0d8, volcano: 0x80402a, space: 0x30303c, storm: 0x3a4a3a, autumn: 0x8a6a3a,
    };
    hemi.groundColor.set(level.night && !space ? 0x1a1a30 : groundTint[level.theme] ?? 0x5a7a3a);
    hemiBase = space ? 1.2 : level.night ? 1.1 : storm ? 1.0 : 1.3;
    hemi.intensity = hemiBase;
    sun.color.set(level.sun);
    sun.intensity = space ? 2.2 : level.night ? 0.8 : storm ? 1.1 : 2.6;
    snow.visible = level.theme === "snow" || storm;
    snowMat.color.set(storm ? 0xaab8d0 : 0xffffff);
    snowMat.size = storm ? 0.22 : 0.35;
  }

  function clearLevel() {
    for (const h of hazards) h.model.dispose();
    hazards = [];
    scene.remove(world);
    for (const g of worldGeos) g.dispose();
    worldGeos = [];
    world = new THREE.Group();
    scene.add(world);
    rings = [];
    balloons = [];
  }

  // ── Planes ──
  let playerLook = 0;
  let player = makePlane(PLANES[0]);
  scene.add(player.group);
  const rivals: Rival[] = [];

  function setupRivals() {
    for (const r of rivals) {
      scene.remove(r.model.group);
      r.model.dispose();
    }
    rivals.length = 0;
    const others = PLANES.map((_, i) => i).filter((i) => i !== playerLook);
    others.forEach((li, k) => {
      const model = makePlane(PLANES[li]);
      scene.add(model.group);
      rivals.push({
        model, color: hex(PLANES[li].body), s: 0, x: 0, y: 0,
        factor: level.rivals[k], wob: k * 2.1 + 0.7, lane: [-16, 16, 30][k], yaw: 0, bank: 0, finishedAt: 0,
      });
    });
  }

  function setPlayerLook(i: number) {
    if (i === playerLook && rivals.length) return;
    scene.remove(player.group);
    player.dispose();
    playerLook = i;
    player = makePlane(PLANES[i]);
    scene.add(player.group);
    setupRivals();
  }

  // ── Audio ──
  let actx: AudioContext | null = null;
  let master: GainNode | null = null;
  let engGain: GainNode | null = null;
  let osc1: OscillatorNode | null = null;
  let osc2: OscillatorNode | null = null;
  let muted = false;

  function initAudio() {
    if (actx) {
      void actx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    master = actx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(actx.destination);
    const filter = actx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520;
    engGain = actx.createGain();
    engGain.gain.value = 0;
    osc1 = actx.createOscillator();
    osc1.type = "sawtooth";
    osc2 = actx.createOscillator();
    osc2.type = "square";
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(engGain);
    engGain.connect(master);
    osc1.start();
    osc2.start();
  }

  function tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) {
    if (!actx || !master) return;
    const t = actx.currentTime + delay;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  const ringSound = () => {
    tone("triangle", 880, 880, 0.12, 0.2);
    tone("triangle", 1318, 1318, 0.25, 0.2, 0.09);
  };
  const megaSound = () => [784, 988, 1175, 1568].forEach((f, k) => tone("triangle", f, f, 0.18, 0.2, k * 0.07));
  const bonkSound = () => tone("sine", 320, 110, 0.4, 0.4);
  function thunder() {
    if (!actx || !master) return;
    const len = Math.floor(actx.sampleRate * 1.6);
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const data = buf.getChannelData(0);
    for (let k = 0; k < len; k++) data[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 1.6);
    const src = actx.createBufferSource();
    src.buffer = buf;
    const f = actx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 260;
    const g = actx.createGain();
    g.gain.value = 0.9;
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(actx.currentTime + 0.25);
  }
  const beep = (go: boolean) => tone("square", go ? 880 : 440, go ? 880 : 440, go ? 0.5 : 0.18, 0.12);
  function fanfare(win: boolean) {
    const notes = win ? [523, 659, 784, 1046] : [523, 659, 784];
    notes.forEach((f, k) => tone("triangle", f, f, k === notes.length - 1 ? 0.6 : 0.16, 0.22, k * 0.15));
  }

  function updateEngineSound(v: number, on: boolean) {
    if (!actx || !engGain || !osc1 || !osc2) return;
    const t = actx.currentTime;
    const f = 70 + v * 1.4;
    osc1.frequency.setTargetAtTime(f, t, 0.08);
    osc2.frequency.setTargetAtTime(f * 0.502, t, 0.08);
    engGain.gain.setTargetAtTime(on ? 0.045 : 0, t, 0.15);
  }

  // ── Player state ──
  const P = { s: 0, x: 0, y: 30, v: 0, vx: 0, vy: 0, yaw: 0, pitch: 0, bank: 0, boost: 0, invuln: 0, rings: 0, wobble: 0 };
  let phase: Phase = "menu";
  let phaseT = 0;
  let raceT = 0;
  let countShown = "";
  let finishPlace = 0;
  let hudTimer = 0;
  let time = 0;
  /** Current sideways push from the wind (-1 … 1). */
  let gust = 0;
  let lightningT = 5;
  let flashT = 0;
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();

  function placeOnGrid() {
    P.s = 0;
    P.x = courseX(0);
    P.y = courseY(0);
    P.v = 0;
    P.vx = P.vy = 0;
    P.yaw = P.pitch = P.bank = 0;
    P.boost = P.invuln = P.wobble = 0;
    P.rings = 0;
    for (const r of rivals) {
      r.s = -14;
      r.x = courseX(0) + r.lane;
      r.y = courseY(0) + (r.lane > 20 ? 6 : 0);
      r.finishedAt = 0;
      r.yaw = r.bank = 0;
    }
    for (const r of rings) {
      r.done = false;
      r.mesh.material = r.rainbow ? rainbowMat : ringMat;
      r.mesh.scale.setScalar(1);
    }
    snapCamera();
  }

  function snapCamera() {
    camPos.set(P.x, P.y + 7, -P.s + 20);
    camLook.set(P.x, P.y + 2, -P.s - 30);
  }

  function place() {
    let ahead = 0;
    for (const r of rivals) if (r.s > P.s) ahead++;
    return ahead + 1;
  }

  const hud = (): Hud => ({
    place: phase === "done" ? finishPlace : place(),
    rings: P.rings,
    ringsTotal: rings.length,
    boost: P.boost > 0,
    wind: Math.abs(gust) > 0.25 ? gust : 0,
    racers: [
      ...rivals.map((r) => ({ frac: clamp(r.s / level.length, 0, 1), color: r.color, me: false })),
      { frac: clamp(P.s / level.length, 0, 1), color: hex(PLANES[playerLook].body), me: true },
    ],
  });

  // ── Update ──
  function updatePlayer(dt: number, flying: boolean, auto: boolean) {
    let steer = 0;
    let climb = 0;
    if (auto) {
      // Autopilot (menu flyby and after the finish line): follow the course.
      steer = clamp((courseX(P.s + 60) - P.x) / 25, -1, 1);
      climb = clamp((courseY(P.s + 60) - P.y) / 12, -1, 1);
    } else if (flying) {
      steer = input.tiltActive ? input.tilt : 0;
      climb = input.tiltActive ? input.pitch : 0;
      steer = clamp(steer + (input.right ? 1 : 0) - (input.left ? 1 : 0), -1, 1);
      climb = clamp(climb + (input.up ? 1 : 0) - (input.down ? 1 : 0), -1, 1);
    }

    const target = !flying ? 0 : P.boost > 0 ? BOOST : CRUISE;
    P.v = lerp(P.v, target, 1 - Math.exp(-dt * (P.v < target ? 1.3 : 0.8)));
    P.boost = Math.max(0, P.boost - dt);
    P.invuln = Math.max(0, P.invuln - dt);
    P.wobble = Math.max(0, P.wobble - dt);

    const k = 1 - Math.exp(-dt * 4);
    P.vx = lerp(P.vx, steer * 28, k);
    P.vy = lerp(P.vy, climb * 16, k);
    // Helping hand: with no up/down input, drift gently back to the height of the rings.
    if (flying && !auto && Math.abs(climb) < 0.1) P.vy += (courseY(P.s + 40) - P.y) * 0.5 * dt;

    P.s += P.v * dt;
    P.x += P.vx * dt;
    // Gusts of wind push the plane sideways — steer against them!
    if (flying && !auto) P.x += gust * 11 * dt;
    P.y += P.vy * dt;

    // Soft invisible walls at the edge of the course.
    const dx = P.x - courseX(P.s);
    if (Math.abs(dx) > CORRIDOR) {
      P.x = courseX(P.s) + Math.sign(dx) * CORRIDOR;
      P.vx *= 0.3;
    }
    const floor = Math.max(MIN_ALT, groundH(P.x, P.s, level.theme) + 12);
    if (P.y < floor) {
      P.y = floor;
      P.vy = Math.max(0, P.vy);
    }
    if (P.y > MAX_ALT) {
      P.y = MAX_ALT;
      P.vy = Math.min(0, P.vy);
    }

    const sp = Math.max(P.v, 8);
    const curve = (courseX(P.s + 1) - courseX(P.s - 1)) / 2;
    P.yaw = lerp(P.yaw, Math.atan2(P.vx + curve * sp * 0.3, sp), k);
    P.pitch = lerp(P.pitch, Math.atan2(P.vy, sp), k);
    P.bank = lerp(P.bank, -P.vx / 28 * 0.75, k);
  }

  function updateRivals(dt: number, racing: boolean, idle: boolean) {
    for (const r of rivals) {
      let v = 0;
      if (idle) v = P.v;
      else if (racing || r.finishedAt === 0 || phase === "done") {
        v = CRUISE * r.factor * (1 + 0.05 * Math.sin(time * 0.4 + r.wob));
        // Rivals shoot off the line quickly, so there are planes ahead to chase…
        v *= 1 + 0.2 * (1 - smoothstep(0, level.length * 0.3, r.s));
        // …and the race stays close and friendly: nobody gets too far ahead or behind.
        const gap = r.s - P.s;
        if (gap > 70) v *= 0.85;
        else if (gap < -160) v *= 1.15;
      }
      if (phase === "countdown") v = 0;
      const prevX = r.x;
      r.s += v * dt;
      const tx = courseX(r.s) + r.lane * 0.6 + 12 * Math.sin(r.s / 95 + r.wob);
      const ty = courseY(r.s) + 4 * Math.sin(r.s / 70 + r.wob);
      r.x = lerp(r.x, tx, 1 - Math.exp(-dt * 2));
      r.y = lerp(r.y, ty, 1 - Math.exp(-dt * 2));
      const vx = dt > 0 ? (r.x - prevX) / dt : 0;
      r.yaw = lerp(r.yaw, Math.atan2(vx, Math.max(v, 8)), 1 - Math.exp(-dt * 4));
      r.bank = lerp(r.bank, clamp(-vx / 28, -1, 1) * 0.75, 1 - Math.exp(-dt * 4));
      if (racing && r.finishedAt === 0 && r.s >= level.length) r.finishedAt = raceT;
      posePlane(r.model, r.x, r.y, r.s, r.yaw, 0, r.bank, v);
    }
  }

  function posePlane(m: PlaneModel, x: number, y: number, s: number, yaw: number, pitch: number, bank: number, v: number) {
    m.group.position.set(x, y + Math.sin(time * 2 + s * 0.01) * 0.25, -s);
    m.group.rotation.set(pitch, -yaw, bank, "YXZ");
    if (m.kind === "prop") m.spinner.rotation.z += dt0 * (20 + v);
    else m.spinner.scale.set(1, 1, 0.7 + Math.random() * 0.5 + v / 120);
  }
  let dt0 = 0;

  function checkRingsAndBalloons(prevS: number) {
    for (const r of rings) {
      if (r.done || r.s > P.s || r.s <= prevS - 1) continue;
      r.done = true;
      if (Math.hypot(P.x - r.x, P.y - r.y) < (r.rainbow ? RING_R * 1.2 : RING_R) + 2) {
        P.rings++;
        P.boost = r.rainbow ? 3.5 : 1.8;
        r.mesh.material = ringDoneMat;
        r.mesh.scale.setScalar(1.3);
        if (r.rainbow) megaSound();
        else ringSound();
        cb.onRing(r.rainbow);
      }
    }
    if (P.invuln > 0) return;
    for (const b of balloons) {
      if (Math.abs(b.s - P.s) > 8) continue;
      if (Math.hypot(P.x - b.x, P.y - b.y) < 7.5) {
        bonk(b.x);
        return;
      }
    }
    for (const h of hazards) {
      const rad = h.model.radius;
      if (Math.abs(h.s - P.s) > rad) continue;
      if (Math.hypot(P.x - h.x, P.y - h.y) < rad) {
        bonk(h.x);
        return;
      }
    }
  }

  function bonk(fromX: number) {
    P.v = 24;
    P.boost = 0;
    P.invuln = 1.5;
    P.wobble = 0.8;
    P.vx = Math.sign(P.x - fromX || 1) * 18;
    bonkSound();
    cb.onBonk();
  }

  /** Swooping rings, flying birds, leaping fireballs, drifting clouds and rocks. */
  function animateWorld(dt: number) {
    const mv = level.ringMove;
    for (const r of rings) {
      if (mv > 0 && !r.done) {
        r.x = r.bx + mv * 14 * Math.sin(time * 0.7 + r.phase);
        r.y = r.by + mv * 6 * Math.sin(time * 0.9 + r.phase * 1.3);
        r.mesh.position.x = r.x;
        r.mesh.position.y = r.y;
      }
      if (!r.done) r.mesh.rotation.z += dt * (r.rainbow ? 2 : 0.8);
    }
    rainbowMat.color.setHSL((time * 0.35) % 1, 0.9, 0.6);

    for (const h of hazards) {
      const m = h.model.mesh;
      const t = time + h.phase;
      switch (level.hazard) {
        case "birds": {
          const sx = Math.sin(t * 0.45);
          h.x = courseX(h.s) + 42 * sx;
          h.y = h.by + 2 * Math.sin(t * 2.2);
          m.rotation.set(0, Math.cos(t * 0.45) > 0 ? -Math.PI / 2 : Math.PI / 2, Math.sin(t * 9) * 0.25);
          break;
        }
        case "fireballs": {
          const ground = groundH(h.bx, h.s, level.theme);
          h.x = h.bx;
          h.y = ground + 2 + 60 * Math.abs(Math.sin(t * 0.55));
          m.rotation.y += dt * 3;
          // Point the flame trail the way it's falling
          m.rotation.x = Math.cos(t * 0.55) * Math.sign(Math.sin(t * 0.55)) > 0 ? 0 : Math.PI;
          break;
        }
        case "storms":
          h.x = h.bx + 20 * Math.sin(t * 0.22);
          h.y = h.by;
          break;
        case "asteroids":
          h.x = h.bx + 22 * Math.sin(t * 0.3);
          h.y = h.by + 9 * Math.cos(t * 0.4);
          m.rotation.x += dt * 0.7;
          m.rotation.y += dt * 0.5;
          break;
      }
      m.position.set(h.x, h.y, -h.s);
    }

    // Wind: slow gusts that change direction
    gust = level.wind * (0.75 * Math.sin(time * 0.33) + 0.25 * Math.sin(time * 1.1 + 1));

    // Lightning in the thunder storm
    if (level.theme === "storm") {
      lightningT -= dt;
      if (lightningT <= 0) {
        lightningT = 4 + Math.random() * 5;
        flashT = 0.35;
        thunder();
        if (phase === "racing") cb.onLightning();
      }
    }
    flashT = Math.max(0, flashT - dt);
    hemi.intensity = hemiBase + (flashT > 0 ? 5 * (Math.floor(flashT * 20) % 2) : 0);
  }

  function update(dt: number) {
    time += dt;
    phaseT += dt;
    dt0 = dt;

    if (phase === "menu") {
      updatePlayer(dt, true, true);
      updateRivals(dt, false, true);
      // Loop the flyby before the finish line.
      if (P.s > level.length - 300) placeOnGrid();
    } else if (phase === "countdown") {
      const left = COUNTDOWN - phaseT;
      const label = left > 2 ? "3" : left > 1 ? "2" : left > 0 ? "1" : "GO!";
      if (label !== countShown) {
        countShown = label;
        cb.onCount(label);
        beep(label === "GO!");
      }
      updatePlayer(dt, false, false);
      updateRivals(dt, false, false);
      if (left <= 0) {
        phase = "racing";
        phaseT = 0;
        raceT = 0;
        P.v = CRUISE * 0.6;
        setTimeout(() => cb.onCount(null), 700);
      }
    } else if (phase === "racing") {
      raceT += dt;
      const prevS = P.s;
      updatePlayer(dt, true, false);
      updateRivals(dt, true, false);
      checkRingsAndBalloons(prevS);
      if (P.s >= level.length) {
        let before = 0;
        for (const r of rivals) if (r.finishedAt > 0 && r.finishedAt <= raceT) before++;
        finishPlace = before + 1;
        phase = "done";
        phaseT = 0;
        fanfare(finishPlace === 1);
        cb.onHud(hud());
      }
    } else {
      updatePlayer(dt, true, true);
      updateRivals(dt, true, false);
      if (phaseT > AFTER_FINISH && finishPlace > 0) {
        const r: RaceResult = {
          place: finishPlace, rings: P.rings, ringsTotal: rings.length, seconds: Math.round(raceT), goal: level.goal,
        };
        cb.onFinish(r);
        // Carry on flying behind the results screen, looping like the menu.
        phase = "menu";
      }
    }

    const wob = P.wobble > 0 ? Math.sin(time * 30) * 0.3 * P.wobble : 0;
    posePlane(player, P.x, P.y, P.s, P.yaw, P.pitch, P.bank + wob, P.v);
    player.group.visible = !(P.invuln > 0 && Math.floor(time * 10) % 2 === 0);

    // Chase camera
    const z = -P.s;
    const menu = phase === "menu";
    const back = menu ? 18 : 17 + (P.boost > 0 ? 3 : 0);
    const side = menu ? 10 * Math.sin(time * 0.25) : P.vx * 0.12;
    const want = new THREE.Vector3(P.x - Math.sin(P.yaw) * back + side, P.y + 6.5 - P.vy * 0.08, z + Math.cos(P.yaw) * back);
    const wantLook = new THREE.Vector3(P.x + Math.sin(P.yaw) * 30, P.y + 2, z - Math.cos(P.yaw) * 30);
    const ck = 1 - Math.exp(-dt * 5);
    camPos.lerp(want, ck);
    camLook.lerp(wantLook, ck);
    const camFloor = groundH(camPos.x, -camPos.z, level.theme) + 4;
    if (camPos.y < camFloor) camPos.y = camFloor;
    camera.position.copy(camPos);
    camera.up.set(Math.sin(-P.bank * 0.35), 1, 0).normalize();
    camera.lookAt(camLook);
    const fovT = baseFov + (P.boost > 0 ? 10 : 0) + (P.v / BOOST) * 4;
    camera.fov = lerp(camera.fov, fovT, ck);
    camera.updateProjectionMatrix();

    sky.position.copy(camera.position);
    sun.target.position.set(P.x, P.y - 20, z - 10);
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 160);

    if (snow.visible) {
      snow.position.set(P.x, P.y, z);
      for (let k = 0; k < SNOW_N; k++) {
        let yy = snowPos[k * 3 + 1] - dt * (level.theme === "storm" ? 55 : 6);
        if (yy < -30) yy += 60;
        snowPos[k * 3 + 1] = yy;
        let zz = snowPos[k * 3 + 2] + dt * P.v;
        if (zz > 60) zz -= 120;
        snowPos[k * 3 + 2] = zz;
      }
      snowGeo.attributes.position.needsUpdate = true;
    }

    // Wind streaks while boosting
    streakMat.opacity = lerp(streakMat.opacity, P.boost > 0 ? 0.55 : 0, ck);
    if (streakMat.opacity > 0.01) {
      for (let k = 0; k < STREAK_N; k++) {
        const q = streakSeed[k];
        q.z += dt * P.v * 1.6;
        if (q.z > 30) q.z -= 90;
        const bx = P.x + q.x;
        const by = P.y + q.y;
        const bz = z + q.z - 30;
        streakPos.set([bx, by, bz, bx, by, bz - 6], k * 6);
      }
      streakGeo.attributes.position.needsUpdate = true;
    }

    animateWorld(dt);

    updateEngineSound(P.v, phase !== "menu");

    hudTimer -= dt;
    if (hudTimer <= 0 && (phase === "racing" || phase === "countdown")) {
      hudTimer = 0.1;
      cb.onHud(hud());
    }
  }

  // ── Sizing & loop ──
  let baseFov = 68;
  function resize() {
    const w = Math.max(1, mount.clientWidth);
    const h = Math.max(1, mount.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep roughly a 100° wide view, whatever the screen shape.
    baseFov = clamp((2 * Math.atan(Math.tan((100 * Math.PI) / 360) / camera.aspect) * 180) / Math.PI, 55, 90);
    camera.fov = baseFov;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(mount);
  resize();

  buildLevel(0);
  setupRivals();
  placeOnGrid();
  P.v = CRUISE;

  let last = performance.now();
  renderer.setAnimationLoop((now: number) => {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    update(dt);
    renderer.render(scene, camera);
  });

  return {
    start(lv: number, plane: number) {
      initAudio();
      buildLevel(lv);
      setPlayerLook(plane);
      rivals.forEach((r, k) => (r.factor = level.rivals[k]));
      placeOnGrid();
      phase = "countdown";
      phaseT = 0;
      countShown = "";
      finishPlace = 0;
      cb.onHud(hud());
    },
    preview(lv: number, plane: number) {
      const rebuild = lv !== levelIdx;
      buildLevel(lv);
      setPlayerLook(plane);
      if (rebuild) {
        placeOnGrid();
        P.v = CRUISE;
      }
    },
    toMenu() {
      phase = "menu";
      cb.onCount(null);
      P.v = CRUISE;
    },
    setMuted(m: boolean) {
      muted = m;
      if (master) master.gain.value = m ? 0 : 0.8;
    },
    dispose() {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      clearLevel();
      player.dispose();
      for (const r of rivals) r.model.dispose();
      for (const d of disposables) d.dispose();
      for (const g of Object.values(GEO)) g.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      if (actx) void actx.close();
    },
  };
}

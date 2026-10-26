// Low-poly planes and scenery built from simple shapes. Scenery parts are
// merged into a few big meshes per stretch of course, so phones only make a
// handful of draw calls.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type Rnd = () => number;

export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  cone: new THREE.ConeGeometry(0.5, 1, 9),
  pyramid: new THREE.ConeGeometry(0.5, 1, 4),
  ico: new THREE.IcosahedronGeometry(0.5, 1),
  rock: new THREE.DodecahedronGeometry(0.5, 0),
  sphere: new THREE.SphereGeometry(0.5, 14, 10),
};

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

function colored(geo: THREE.BufferGeometry, color: THREE.ColorRepresentation) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.deleteAttribute("uv");
  const n = g.getAttribute("position").count;
  const arr = new Float32Array(n * 3);
  _c.set(color);
  for (let k = 0; k < n; k++) {
    arr[k * 3] = _c.r;
    arr[k * 3 + 1] = _c.g;
    arr[k * 3 + 2] = _c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return g;
}

/** Adds one coloured, positioned shape to a list that is merged later. */
export function part(
  list: THREE.BufferGeometry[],
  geo: THREE.BufferGeometry,
  color: THREE.ColorRepresentation,
  x: number, y: number, z: number,
  sx: number, sy: number, sz: number,
  rx = 0, ry = 0, rz = 0,
) {
  _e.set(rx, ry, rz);
  _q.setFromEuler(_e);
  _m.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz));
  const g = colored(geo, color);
  g.applyMatrix4(_m);
  list.push(g);
}

export function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (!list.length) return null;
  const g = mergeGeometries(list, false);
  for (const p of list) p.dispose();
  list.length = 0;
  return g;
}

export function vary(hex: number, rnd: Rnd, amount = 0.08) {
  return new THREE.Color(hex).offsetHSL((rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.1, (rnd() - 0.5) * amount);
}

export interface Lists {
  props: THREE.BufferGeometry[];
  glow: THREE.BufferGeometry[];
}

// ── Scenery ──────────────────────────────────────────────────────────────

export function tree(L: Lists, x: number, y: number, z: number, k: number, rnd: Rnd) {
  part(L.props, GEO.cyl, vary(0x7a5230, rnd), x, y + 2 * k, z, 0.8 * k, 4 * k, 0.8 * k);
  part(L.props, GEO.ico, vary(0x3f9a3a, rnd), x, y + 5.5 * k, z, 5 * k, 4.6 * k, 5 * k, rnd(), rnd(), 0);
  part(L.props, GEO.ico, vary(0x52b043, rnd), x + 0.8 * k, y + 7.6 * k, z - 0.4 * k, 3.4 * k, 3.2 * k, 3.4 * k);
}

export function pine(L: Lists, x: number, y: number, z: number, k: number, rnd: Rnd, snowy: boolean) {
  part(L.props, GEO.cyl, 0x5d3e22, x, y + 1.2 * k, z, 0.7 * k, 2.4 * k, 0.7 * k);
  const green = vary(0x2d6b3d, rnd);
  for (let t = 0; t < 3; t++) {
    const w = (5 - t * 1.3) * k;
    part(L.props, GEO.cone, snowy && t === 2 ? 0xf4f8ff : green, x, y + (3.4 + t * 2.4) * k, z, w, 3.6 * k, w);
  }
  if (snowy) part(L.props, GEO.cone, 0xf4f8ff, x, y + 9.6 * k, z, 1.6 * k, 1.4 * k, 1.6 * k);
}

export function house(L: Lists, x: number, y: number, z: number, k: number, rnd: Rnd) {
  const walls = [0xfff1d6, 0xffd6e0, 0xd6ecff, 0xfff5a8][Math.floor(rnd() * 4)];
  const roof = [0xd8483b, 0x3b6fd8, 0x8a4fc9, 0x2f9e6a][Math.floor(rnd() * 4)];
  const ry = rnd() * Math.PI;
  part(L.props, GEO.box, walls, x, y + 2.5 * k, z, 7 * k, 5 * k, 6 * k, 0, ry, 0);
  part(L.props, GEO.pyramid, roof, x, y + 6.5 * k, z, 7.4 * k, 3 * k, 7.4 * k, 0, ry + Math.PI / 4, 0);
}

export function rock(L: Lists, x: number, y: number, z: number, k: number, rnd: Rnd, color: number) {
  part(L.props, GEO.rock, vary(color, rnd), x, y + k * 0.3, z, k * 2, k * 1.4, k * 1.8, rnd(), rnd(), rnd());
}

export function cactus(L: Lists, x: number, y: number, z: number, k: number, rnd: Rnd) {
  const g = vary(0x3c9a4a, rnd);
  part(L.props, GEO.cyl, g, x, y + 3 * k, z, 1.1 * k, 6 * k, 1.1 * k);
  part(L.props, GEO.cyl, g, x + 1.3 * k, y + 3.6 * k, z, 0.8 * k, 2.4 * k, 0.8 * k);
  part(L.props, GEO.cyl, g, x - 1.3 * k, y + 4.4 * k, z, 0.8 * k, 2 * k, 0.8 * k);
}

export function pyramid(L: Lists, x: number, y: number, z: number, k: number) {
  part(L.props, GEO.pyramid, 0xe8c27a, x, y + 9 * k, z, 26 * k, 18 * k, 26 * k, 0, Math.PI / 4, 0);
}

export function palm(L: Lists, x: number, y: number, z: number, k: number, rnd: Rnd) {
  const lean = (rnd() - 0.5) * 0.4;
  part(L.props, GEO.cyl, 0x9b7448, x, y + 4 * k, z, 0.7 * k, 8 * k, 0.7 * k, 0, 0, lean);
  const top = y + 8 * k;
  const tx = x - Math.sin(lean) * 4 * k;
  for (let a = 0; a < 5; a++) {
    const ang = (a / 5) * Math.PI * 2;
    part(L.props, GEO.box, vary(0x2f9e4a, rnd), tx + Math.cos(ang) * 2 * k, top, z + Math.sin(ang) * 2 * k, 5 * k, 0.3 * k, 1.4 * k, 0, -ang, -0.35);
  }
}

export function boat(L: Lists, x: number, y: number, z: number, k: number, rnd: Rnd) {
  const ry = rnd() * Math.PI;
  part(L.props, GEO.box, 0xffffff, x, y + 0.6 * k, z, 3 * k, 1.2 * k, 8 * k, 0, ry, 0);
  part(L.props, GEO.cyl, 0x8a6a4a, x, y + 4 * k, z, 0.25 * k, 6 * k, 0.25 * k);
  part(L.props, GEO.pyramid, [0xff5c7a, 0xffc53d, 0x41b6ff][Math.floor(rnd() * 3)], x, y + 4.2 * k, z, 0.4 * k, 5 * k, 4 * k, 0, ry, 0);
}

export function snowman(L: Lists, x: number, y: number, z: number, k: number) {
  part(L.props, GEO.sphere, 0xffffff, x, y + 1.6 * k, z, 3.2 * k, 3 * k, 3.2 * k);
  part(L.props, GEO.sphere, 0xffffff, x, y + 4 * k, z, 2.2 * k, 2.1 * k, 2.2 * k);
  part(L.props, GEO.cone, 0xff8a1f, x, y + 4 * k, z + 1.2 * k, 0.35 * k, 1.2 * k, 0.35 * k, Math.PI / 2, 0, 0);
  part(L.props, GEO.cyl, 0x222222, x, y + 5.4 * k, z, 1.4 * k, 1.1 * k, 1.4 * k);
}

export function building(L: Lists, x: number, z: number, w: number, h: number, d: number, rnd: Rnd) {
  part(L.props, GEO.box, vary(0x343a52, rnd, 0.12), x, h / 2, z, w, h, d);
  part(L.props, GEO.box, 0x1f2333, x, h + 0.6, z, w * 0.8, 1.2, d * 0.8);
  // Lit windows: thin glowing strips on the two long faces.
  const colors = [0xffd27a, 0xa9dcff, 0xffb3e6, 0xfff3b0];
  for (let fy = 4; fy < h - 2; fy += 3.4) {
    if (rnd() < 0.25) continue;
    const c = colors[Math.floor(rnd() * colors.length)];
    part(L.glow, GEO.box, c, x, fy, z + d / 2 + 0.05, w * (0.5 + rnd() * 0.4), 1.2, 0.1);
    part(L.glow, GEO.box, c, x, fy, z - d / 2 - 0.05, w * (0.5 + rnd() * 0.4), 1.2, 0.1);
    part(L.glow, GEO.box, c, x + w / 2 + 0.05, fy, z, 0.1, 1.2, d * (0.4 + rnd() * 0.4));
    part(L.glow, GEO.box, c, x - w / 2 - 0.05, fy, z, 0.1, 1.2, d * (0.4 + rnd() * 0.4));
  }
  if (rnd() < 0.3) part(L.glow, GEO.sphere, 0xff3b3b, x, h + 2, z, 1, 1, 1);
}

export function cloud(L: Lists, x: number, y: number, z: number, k: number, rnd: Rnd) {
  for (let p = 0; p < 4; p++) {
    const r = (4 + rnd() * 4) * k;
    part(L.props, GEO.ico, 0xffffff, x + (p - 1.5) * 4.5 * k, y + rnd() * 2 * k, z + (rnd() - 0.5) * 4 * k, r * 1.4, r, r);
  }
}

// ── Planes ───────────────────────────────────────────────────────────────

export interface PlaneLook {
  name: string;
  emoji: string;
  body: number;
  wing: number;
  kind: "prop" | "jet";
}

export const PLANES: PlaneLook[] = [
  { name: "Red Rocket", emoji: "🔴", body: 0xe8402f, wing: 0xffffff, kind: "prop" },
  { name: "Blue Jet", emoji: "🔵", body: 0x2f7fe8, wing: 0xdfe9f7, kind: "jet" },
  { name: "Green Zoom", emoji: "🟢", body: 0x2fb35a, wing: 0xffe14d, kind: "prop" },
  { name: "Yellow Buzz", emoji: "🟡", body: 0xffc531, wing: 0x2b2140, kind: "jet" },
];

export interface PlaneModel {
  group: THREE.Group;
  kind: PlaneLook["kind"];
  /** Spins (propeller) or flickers (jet flame). */
  spinner: THREE.Object3D;
  dispose: () => void;
}

/** A chunky toy plane, nose pointing along -z, about 9 m wide. */
export function makePlane(look: PlaneLook): PlaneModel {
  const L: THREE.BufferGeometry[] = [];
  const body = look.body;
  const wing = look.wing;
  const dark = 0x2b2140;
  const glass = 0x9fe3ff;
  if (look.kind === "prop") {
    part(L, GEO.sphere, body, 0, 0, 0, 2.2, 2.2, 8);
    part(L, GEO.cyl, body, 0, 0, -3.6, 1.6, 0.8, 1.6, Math.PI / 2, 0, 0);
    part(L, GEO.box, wing, 0, -0.3, -0.6, 10, 0.35, 2.2);
    part(L, GEO.box, body, -4.6, -0.3, -0.6, 0.9, 0.38, 2.25);
    part(L, GEO.box, body, 4.6, -0.3, -0.6, 0.9, 0.38, 2.25);
    part(L, GEO.box, wing, 0, 0.3, 3.4, 4, 0.25, 1.2);
    part(L, GEO.box, body, 0, 1.3, 3.5, 0.3, 2, 1.4, 0.25, 0, 0);
    part(L, GEO.sphere, glass, 0, 0.95, -0.9, 1.2, 1, 2.2);
    part(L, GEO.cone, dark, 0, 0, -4.2, 0.6, 0.6, 0.6, -Math.PI / 2, 0, 0);
    part(L, GEO.cyl, dark, -1, -1.3, -1.2, 0.15, 1.2, 0.15);
    part(L, GEO.cyl, dark, 1, -1.3, -1.2, 0.15, 1.2, 0.15);
    part(L, GEO.cyl, dark, -1, -1.9, -1.2, 0.8, 0.35, 0.8, 0, 0, Math.PI / 2);
    part(L, GEO.cyl, dark, 1, -1.9, -1.2, 0.8, 0.35, 0.8, 0, 0, Math.PI / 2);
  } else {
    part(L, GEO.sphere, body, 0, 0, 0, 2, 2, 9);
    part(L, GEO.cone, body, 0, 0, -5, 1.6, 2.4, 1.6, -Math.PI / 2, 0, 0);
    // Swept wings
    part(L, GEO.box, wing, -2.7, -0.2, 0.4, 5, 0.3, 2.4, 0, -0.45, 0);
    part(L, GEO.box, wing, 2.7, -0.2, 0.4, 5, 0.3, 2.4, 0, 0.45, 0);
    part(L, GEO.box, wing, -1.4, 0.2, 3.8, 2.4, 0.22, 1.1, 0, -0.4, 0);
    part(L, GEO.box, wing, 1.4, 0.2, 3.8, 2.4, 0.22, 1.1, 0, 0.4, 0);
    part(L, GEO.box, body, 0, 1.3, 3.6, 0.3, 2.2, 1.8, 0.45, 0, 0);
    part(L, GEO.sphere, glass, 0, 0.85, -1.8, 1.1, 0.95, 2.6);
    part(L, GEO.cyl, dark, 0, 0, 4.4, 1.2, 0.6, 1.2, Math.PI / 2, 0, 0);
  }
  const geo = mergeGeometries(L, false);
  for (const g of L) g.dispose();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.15 });
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  group.add(mesh);

  let spinner: THREE.Object3D;
  let spinGeo: THREE.BufferGeometry;
  let spinMat: THREE.Material;
  if (look.kind === "prop") {
    spinGeo = new THREE.BoxGeometry(4, 0.35, 0.12);
    spinMat = new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.5 });
    spinner = new THREE.Mesh(spinGeo, spinMat);
    spinner.position.set(0, 0, -4.35);
  } else {
    spinGeo = new THREE.ConeGeometry(0.55, 2.6, 10);
    spinGeo.rotateX(Math.PI / 2);
    spinMat = new THREE.MeshBasicMaterial({ color: 0xffa23a, transparent: true, opacity: 0.85, toneMapped: false });
    spinner = new THREE.Mesh(spinGeo, spinMat);
    spinner.position.set(0, 0, 5.8);
  }
  group.add(spinner);

  return {
    group,
    kind: look.kind,
    spinner,
    dispose() {
      geo.dispose();
      mat.dispose();
      spinGeo.dispose();
      spinMat.dispose();
    },
  };
}

/** A hot-air balloon — the thing to dodge. About 10 m tall. */
export function balloon(L: Lists, x: number, y: number, z: number, rnd: Rnd) {
  const colors = [0xff5c7a, 0xffc53d, 0x9b6bff, 0x22cca0, 0xff9143, 0x41b6ff];
  const a = colors[Math.floor(rnd() * colors.length)];
  const b = colors[Math.floor(rnd() * colors.length)];
  part(L.props, GEO.sphere, a, x, y + 1.5, z, 9, 10, 9);
  part(L.props, GEO.sphere, b, x, y + 1.5, z, 9.2, 3, 9.2);
  part(L.props, GEO.cone, a, x, y - 3.8, z, 5, 3.4, 5, Math.PI, 0, 0);
  part(L.props, GEO.box, 0x8a5a2b, x, y - 7, z, 2.2, 1.8, 2.2);
}

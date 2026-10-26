/**
 * Phone-as-steering-wheel math (shared with Noor's Road Trip 3D).
 *
 * We read the gravity vector from `devicemotion` (accelerationIncludingGravity).
 *
 * Left / right: the angle of gravity in the plane of the screen. Turning the
 * phone like a steering wheel rotates that angle, whether it is held in portrait
 * or landscape, and whichever sign convention the browser uses (iOS reports the
 * opposite sign to Android — negating both axes only shifts the angle by 180°,
 * so the *change* from the neutral angle is the same).
 *
 * Up / down: how far the screen is leaning back (facing the sky) compared with
 * how it was held at the start. Pull the top of the phone towards you = climb,
 * push it away = dive, like the stick in a real plane.
 */

/** Turning the phone this far (radians) = full steering lock. */
export const TILT_FULL_LOCK = (30 * Math.PI) / 180;
/** Small wobbles inside this angle are ignored. */
export const TILT_DEADZONE = (3 * Math.PI) / 180;
/** A jump bigger than this means the screen rotated, so re-centre. */
export const TILT_RECENTER = (70 * Math.PI) / 180;

/** Leaning the phone this far forwards / backwards = full climb or dive. */
export const PITCH_FULL = (22 * Math.PI) / 180;
/** Little kids' hands wobble — ignore small forward / back leans. */
export const PITCH_DEADZONE = (5 * Math.PI) / 180;

export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Angle of gravity in the screen plane, or null when the phone is lying
 * too flat to tell which way it is turned.
 */
export function gravityAngle(gx: number | null | undefined, gy: number | null | undefined): number | null {
  if (gx == null || gy == null) return null;
  if (Math.hypot(gx, gy) < 2.5) return null;
  return Math.atan2(gx, gy);
}

/** Steering from -1 (full left) to 1 (full right). Clockwise turn = right. */
export function tiltSteer(angle: number, neutral: number): number {
  const d = wrapAngle(angle - neutral);
  const mag = Math.max(0, Math.abs(d) - TILT_DEADZONE) / (TILT_FULL_LOCK - TILT_DEADZONE);
  return Math.max(-1, Math.min(1, -Math.sign(d) * mag));
}

/**
 * How far the screen leans back towards the sky, in radians: 0 when the phone
 * is upright, +π/2 when it lies flat screen-up. `zSign` is -1 on iOS, whose
 * axes all point the opposite way to Android's.
 */
export function screenLean(
  gx: number | null | undefined,
  gy: number | null | undefined,
  gz: number | null | undefined,
  zSign: 1 | -1,
): number | null {
  if (gx == null || gy == null || gz == null) return null;
  return Math.atan2(gz * zSign, Math.hypot(gx, gy));
}

/** Climb from -1 (dive) to 1 (climb). Leaning the top towards you = climb. */
export function tiltPitch(lean: number, neutral: number): number {
  const d = neutral - lean;
  const mag = Math.max(0, Math.abs(d) - PITCH_DEADZONE) / (PITCH_FULL - PITCH_DEADZONE);
  return Math.max(-1, Math.min(1, Math.sign(d) * mag));
}

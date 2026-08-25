import { aspectWH, dist } from "./distance";
import type { AlertState, Character, MapAspect, SightLevel, Vec2 } from "./types";

export const VISION = {
  /** Full cone angle in degrees. */
  fov: 90,
  /** Matches RANGE.near */
  seen: 24,
  /** Matches RANGE.sameArea */
  glimpse: 52,
} as const;

export const SIGHT_LABEL: Record<SightLevel, string> = {
  seen: "正前方看清",
  glimpse: "視野邊緣，看不清細節",
  blind: "死角／視野外",
};

export const ALERT_LABEL: Record<AlertState, string> = {
  unaware: "未察覺",
  suspicious: "起疑",
  alert: "鎖定",
};

export function normalizeFacing(deg: number): number {
  const n = ((deg % 360) + 360) % 360;
  return n;
}

/** 0 = up (north), clockwise. */
export function facingToward(from: Vec2, to: Vec2): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return 0;
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return normalizeFacing(deg);
}

export function facingOf(npc: Character): number {
  if (typeof npc.facing === "number" && Number.isFinite(npc.facing)) {
    return normalizeFacing(npc.facing);
  }
  return facingToward(npc, { x: 50, y: 50 });
}

export function angleDelta(a: number, b: number): number {
  const d = Math.abs(normalizeFacing(a) - normalizeFacing(b));
  return d > 180 ? 360 - d : d;
}

export function offsetByFacing(
  from: Vec2,
  facingDeg: number,
  units: number,
  aspect: MapAspect,
): Vec2 {
  const { w, h } = aspectWH(aspect);
  const m = Math.max(w, h);
  const rad = (normalizeFacing(facingDeg) * Math.PI) / 180;
  const gx = units * Math.sin(rad);
  const gy = -units * Math.cos(rad);
  return {
    x: from.x + (gx * m) / w,
    y: from.y + (gy * m) / h,
  };
}

export function sightOn(
  npc: Character,
  target: Vec2,
  aspect: MapAspect = "1:1",
): SightLevel {
  const d = dist(npc, target, aspect);
  if (d > VISION.glimpse) return "blind";
  const bear = facingToward(npc, target);
  const half = VISION.fov / 2;
  if (angleDelta(facingOf(npc), bear) > half) return "blind";
  if (d <= VISION.seen) return "seen";
  return "glimpse";
}

export function nextAlert(prev: AlertState | undefined, sight: SightLevel): AlertState {
  const cur = prev ?? "unaware";
  if (sight === "seen") return "alert";
  if (sight === "glimpse") return cur === "alert" ? "alert" : "suspicious";
  if (cur === "alert") return "suspicious";
  return "unaware";
}

export function conePoints(
  npc: Character,
  radius: number,
  aspect: MapAspect,
  steps = 18,
): string {
  const facing = facingOf(npc);
  const half = VISION.fov / 2;
  const pts = [`${npc.x.toFixed(2)},${npc.y.toFixed(2)}`];
  for (let i = 0; i <= steps; i++) {
    const a = facing - half + (VISION.fov * i) / steps;
    const p = offsetByFacing(npc, a, radius, aspect);
    pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }
  return pts.join(" ");
}

export function formatVisionLine(npc: Character, player: Vec2, aspect: MapAspect): string {
  const sight = sightOn(npc, player, aspect);
  const alert = npc.alert ?? "unaware";
  return `朝向 ${facingOf(npc).toFixed(0)}° ｜ 對玩家：${SIGHT_LABEL[sight]} ｜ 警覺：${ALERT_LABEL[alert]}`;
}

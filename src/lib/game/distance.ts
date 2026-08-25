import { identityLine } from "./identity";
import { facingOf, formatVisionLine, sightOn, SIGHT_LABEL } from "./vision";
import type { Character, Crowd, MapAspect, MapObject, Proximity, Scene, Vec2 } from "./types";

export const MAP_ASPECTS: MapAspect[] = ["1:1", "2:3", "3:2", "16:9", "9:16"];

export function parseMapAspect(raw: unknown): MapAspect {
  const s = String(raw ?? "").trim();
  return MAP_ASPECTS.includes(s as MapAspect) ? (s as MapAspect) : "1:1";
}

export function sceneAspect(scene: { mapAspect?: MapAspect }): MapAspect {
  return parseMapAspect(scene.mapAspect);
}

export function aspectWH(aspect: MapAspect): { w: number; h: number } {
  const [w, h] = aspect.split(":").map(Number) as [number, number];
  return { w, h };
}

/** Image-space percent distance (for click / overlap). */
export function pctDist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export const RANGE = {
  adjacent: 12,
  near: 24,
  sameArea: 52,
  distant: 72,
} as const;

/** Game distance: long side of the map = 100 units. */
export function dist(a: Vec2, b: Vec2, aspect: MapAspect = "1:1"): number {
  const { w, h } = aspectWH(aspect);
  const m = Math.max(w, h);
  return Math.hypot((a.x - b.x) * (w / m), (a.y - b.y) * (h / m));
}

/** Stop this many units short of a person so markers do not stack. */
export const STANDOFF = 2;

/** Point on the path from `from` toward `target`, stopping `stopShort` units before it. */
export function pointToward(
  from: Vec2,
  target: Vec2,
  stopShort: number,
  aspect: MapAspect = "1:1",
): Vec2 {
  const d = dist(from, target, aspect);
  if (d <= 0.001) return { ...from };
  if (d <= stopShort) return { ...from };
  const t = (d - stopShort) / d;
  return {
    x: from.x + (target.x - from.x) * t,
    y: from.y + (target.y - from.y) * t,
  };
}

/** If `to` lands on someone, stand a few steps back along the approach from `from`. */
export function standoffAlongApproach(
  from: Vec2,
  to: Vec2,
  blockers: Vec2[],
  aspect: MapAspect,
  minDist = STANDOFF,
): Vec2 {
  let dest = { x: to.x, y: to.y };
  for (let i = 0; i < 6; i++) {
    let hit: Vec2 | null = null;
    let closest = minDist;
    for (const b of blockers) {
      const d = dist(dest, b, aspect);
      if (d < closest) {
        closest = d;
        hit = b;
      }
    }
    if (!hit) break;
    dest = pointToward(from, hit, minDist, aspect);
  }
  return dest;
}

export function proximity(d: number): Proximity {
  if (d <= RANGE.adjacent) return "adjacent";
  if (d <= RANGE.near) return "near";
  if (d <= RANGE.sameArea) return "same-area";
  if (d <= RANGE.distant) return "distant";
  return "far";
}

export const PROXIMITY_LABEL: Record<Proximity, string> = {
  adjacent: "伸手可及",
  near: "近處可談",
  "same-area": "同區須揚聲",
  distant: "遠處只見人影",
  far: "遠在地圖另一端",
};

export function nearestObject(
  pos: Vec2,
  objects: MapObject[],
  aspect: MapAspect = "1:1",
): MapObject | null {
  if (objects.length === 0) return null;
  let best = objects[0];
  let bestD = dist(pos, best, aspect);
  for (let i = 1; i < objects.length; i++) {
    const d = dist(pos, objects[i], aspect);
    if (d < bestD) {
      best = objects[i];
      bestD = d;
    }
  }
  return best;
}

export function canHear(a: Vec2, b: Vec2, aspect: MapAspect = "1:1"): boolean {
  return dist(a, b, aspect) <= RANGE.sameArea;
}

export function canTalk(a: Vec2, b: Vec2, aspect: MapAspect = "1:1"): boolean {
  return dist(a, b, aspect) <= RANGE.near;
}

/** 中距離以內：可看清面容、觸發立繪。 */
export function withinMidRange(d: number): boolean {
  return d <= RANGE.sameArea;
}

export function isFarLook(d: number): boolean {
  return d > RANGE.sameArea;
}

export function perceiveAction(
  npc: Character,
  player: Vec2,
  action: string,
  aspect: MapAspect = "1:1",
): string {
  const p = proximity(dist(npc, player, aspect));
  const sight = sightOn(npc, player, aspect);
  const vis = `朝向${facingOf(npc).toFixed(0)}°，${SIGHT_LABEL[sight]}`;
  if (p === "adjacent" || p === "near") {
    if (sight === "blind") {
      return `近處但在死角：聽得見，眼前看不見玩家。${vis}。隱約是：${action}`;
    }
    return `近處，聽得見也看得清玩家在做：${action}（${vis}）`;
  }
  if (p === "same-area") {
    if (sight === "blind") {
      return `同區、在死角：話要夠大聲才聽得清，看不見人。${vis}`;
    }
    if (sight === "glimpse") {
      return `同區餘光：動作模模糊糊看得到，話要夠大聲。${vis}。隱約是：${action}`;
    }
    return `同區且在視野內：動作看得到，話要夠大聲才聽得清。${vis}。隱約是：${action}`;
  }
  if (p === "distant") {
    return `遠處只見人影與動靜，聽不見話（${vis}）。`;
  }
  return `遠在地圖另一端，幾乎與此事無關（${vis}）。`;
}

export type DistanceRow = {
  id: string;
  name: string;
  d: number;
  proximity: Proximity;
};

export function distanceMatrix(scene: Scene, player: Vec2): DistanceRow[] {
  const aspect = sceneAspect(scene);
  return scene.npcs.map((npc) => {
    const d = dist(player, npc, aspect);
    return { id: npc.id, name: npc.name, d, proximity: proximity(d) };
  });
}

export function formatDistanceReport(
  player: Vec2,
  npcs: Character[],
  objects: MapObject[],
  crowds: Crowd[] = [],
  aspect: MapAspect = "1:1",
): string {
  const lines: string[] = [];
  lines.push("【座標與距離】玩家座標為地圖百分比，原點在圖左上。距離已依長寬比校正（長邊＝100單位）。");
  lines.push(`地圖比例：${aspect}`);
  lines.push(`玩家：(${player.x.toFixed(0)}, ${player.y.toFixed(0)})`);
  const nearObj = nearestObject(player, objects, aspect);
  if (nearObj) {
    lines.push(
      `最近物件：${nearObj.label}（距 ${dist(player, nearObj, aspect).toFixed(0)}）`,
    );
  }
  for (const npc of npcs) {
    const d = dist(player, npc, aspect);
    lines.push(
      `${identityLine(npc)}：(${npc.x.toFixed(0)}, ${npc.y.toFixed(0)}) 距離 ${d.toFixed(0)}＝${PROXIMITY_LABEL[proximity(d)]} ｜ ${formatVisionLine(npc, player, aspect)}`,
    );
  }
  if (crowds.length) {
    lines.push("【人群】無名背景，橢圓中心與半軸為圖上百分比。不是角色卡。");
    for (const c of crowds) {
      const d = dist(player, c, aspect);
      lines.push(
        `${c.id} 「${c.label}」中心(${c.x.toFixed(0)},${c.y.toFixed(0)}) 橢圓 rx ${c.rx.toFixed(0)} ry ${c.ry.toFixed(0)} 約 ${c.size} 人 已具名 ${c.namedOut} 距離 ${d.toFixed(0)}＝${PROXIMITY_LABEL[proximity(d)]} ｜ ${c.desc}`,
      );
    }
  }
  lines.push(
    "規則：≤12 可碰觸／低語；≤24 可正常交談；≤52 同區須揚聲且細節不清；>52 聽不見對話。單位為校正後的地圖單位。NPC 視野為正前方約 90° 扇形，無牆體遮擋；近處扇內看清、同區扇內餘光、扇外為死角。",
  );
  return lines.join("\n");
}

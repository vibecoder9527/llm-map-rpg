import { dist, pctDist, PROXIMITY_LABEL, proximity, RANGE } from "./distance";
import { isKnown, publicName } from "./identity";
import { sightOn, SIGHT_LABEL } from "./vision";
import type { Character, Crowd, MapAspect, MapObject, Proximity, Vec2 } from "./types";

export type ActionChoice = {
  id: string;
  label: string;
  hint?: string;
  text: string;
  primary?: boolean;
  group?: string;
};

export type ActionTarget =
  | { kind: "npc"; npc: Character }
  | { kind: "object"; obj: MapObject }
  | { kind: "crowd"; crowd: Crowd }
  | { kind: "stack"; obj: MapObject; crowd: Crowd }
  | { kind: "floor"; pos: Vec2; near: MapObject | null }
  | { kind: "self"; player: Character };

function wrap(
  focus: string,
  prox: Proximity,
  d: number,
  intent: string,
): string {
  return `對準${focus}（距離 ${d.toFixed(0)}＝${PROXIMITY_LABEL[prox]}）。意圖：${intent}。成功與否依距離與情境判定；遠距不可當成面對面。`;
}

function sitLabel(obj: MapObject): boolean {
  return /椅|凳|桌|榻|床|毯|吧|座|沙發|長椅/.test(obj.label);
}

export function defaultObjectLayer(w: number, h: number): number {
  const area = Math.max(1, w * h);
  if (area >= 1200) return 0;
  if (area >= 500) return 1;
  if (area >= 180) return 2;
  if (area >= 60) return 3;
  return 4;
}

export function objectLayer(obj: MapObject): number {
  return typeof obj.z === "number" && Number.isFinite(obj.z)
    ? Math.round(obj.z)
    : defaultObjectLayer(obj.w, obj.h);
}

export function comparePaintOrder(a: MapObject, b: MapObject): number {
  const z = objectLayer(a) - objectLayer(b);
  if (z) return z;
  return b.w * b.h - a.w * a.h;
}

export function pointHitsObject(pos: Vec2, obj: MapObject): boolean {
  const pad = 3;
  return (
    Math.abs(pos.x - obj.x) <= obj.w / 2 + pad &&
    Math.abs(pos.y - obj.y) <= obj.h / 2 + pad
  );
}

export function objectAt(pos: Vec2, objects: MapObject[]): MapObject | null {
  let best: MapObject | null = null;
  let bestZ = -Infinity;
  let bestArea = Infinity;
  for (const obj of objects) {
    if (!pointHitsObject(pos, obj)) continue;
    const z = objectLayer(obj);
    const area = obj.w * obj.h;
    if (z > bestZ || (z === bestZ && area < bestArea)) {
      best = obj;
      bestZ = z;
      bestArea = area;
    }
  }
  return best;
}

export function crowdAxes(crowd: Crowd & { r?: number }): { rx: number; ry: number } {
  const rx = crowd.rx || crowd.r || 10;
  const ry = crowd.ry || crowd.r || rx;
  return { rx, ry };
}

export function pointHitsCrowd(pos: Vec2, crowd: Crowd): boolean {
  const { rx, ry } = crowdAxes(crowd);
  const nx = (pos.x - crowd.x) / (rx + 3);
  const ny = (pos.y - crowd.y) / (ry + 3);
  return nx * nx + ny * ny <= 1;
}

export function crowdAt(pos: Vec2, crowds: Crowd[] | undefined): Crowd | null {
  let best: Crowd | null = null;
  let bestArea = Infinity;
  for (const c of crowds ?? []) {
    if (!pointHitsCrowd(pos, c)) continue;
    const { rx, ry } = crowdAxes(c);
    const area = rx * ry;
    if (area < bestArea) {
      best = c;
      bestArea = area;
    }
  }
  return best;
}

export function hitsAt(
  pos: Vec2,
  objects: MapObject[],
  crowds: Crowd[] | undefined,
): { obj: MapObject | null; crowd: Crowd | null } {
  return { obj: objectAt(pos, objects), crowd: crowdAt(pos, crowds) };
}

export function targetFromHits(
  pos: Vec2,
  objects: MapObject[],
  crowds: Crowd[] | undefined,
): ActionTarget {
  const { obj, crowd } = hitsAt(pos, objects, crowds);
  if (obj && crowd) return { kind: "stack", obj, crowd };
  if (crowd) return { kind: "crowd", crowd };
  if (obj) return { kind: "object", obj };
  const near = objects.reduce(
    (best, o) => {
      const d = pctDist(pos, o);
      if (!best || d < best.d) return { o, d };
      return best;
    },
    null as { o: MapObject; d: number } | null,
  );
  return {
    kind: "floor",
    pos,
    near: near && near.d <= 14 ? near.o : null,
  };
}

export function targetTitle(t: ActionTarget): string {
  if (t.kind === "npc") return publicName(t.npc);
  if (t.kind === "object") return t.obj.label;
  if (t.kind === "crowd") return `人群 · ${t.crowd.label}`;
  if (t.kind === "stack") return `${t.obj.label} · 人群「${t.crowd.label}」`;
  if (t.kind === "self") return t.player.name;
  if (t.near) return `空地 · 近「${t.near.label}」`;
  return "空地";
}

export function targetDetail(
  t: ActionTarget,
  playerPos: Vec2,
  aspect: MapAspect = "1:1",
): { prox: Proximity; d: number; line: string } {
  const pos =
    t.kind === "npc"
      ? t.npc
      : t.kind === "object"
        ? t.obj
        : t.kind === "crowd"
          ? t.crowd
          : t.kind === "stack"
            ? t.crowd
            : t.kind === "self"
              ? playerPos
              : t.pos;
  const d = t.kind === "self" ? 0 : dist(playerPos, pos, aspect);
  const prox = t.kind === "self" ? "adjacent" : proximity(d);
  if (t.kind === "npc") {
    const tag = isKnown(t.npc) ? "" : "尚未識出 · ";
    const vis = SIGHT_LABEL[sightOn(t.npc, playerPos, aspect)];
    return { prox, d, line: `${tag}${t.npc.status || t.npc.bio} · ${PROXIMITY_LABEL[prox]} · ${vis}` };
  }
  if (t.kind === "object") {
    return { prox, d, line: `${t.obj.desc || t.obj.kind} · ${PROXIMITY_LABEL[prox]}` };
  }
  if (t.kind === "crowd") {
    return {
      prox,
      d,
      line: `${t.crowd.desc || "無名的一群人"} · 約 ${t.crowd.size} 人 · ${PROXIMITY_LABEL[prox]}`,
    };
  }
  if (t.kind === "stack") {
    return {
      prox,
      d,
      line: `物件「${t.obj.label}」與人群「${t.crowd.label}」（約 ${t.crowd.size} 人）疊在一起 · ${PROXIMITY_LABEL[prox]}`,
    };
  }
  if (t.kind === "self") {
    return { prox, d, line: "你自己" };
  }
  return {
    prox,
    d,
    line: `(${t.pos.x.toFixed(0)}, ${t.pos.y.toFixed(0)}) · ${PROXIMITY_LABEL[prox]}`,
  };
}

export function buildChoices(
  t: ActionTarget,
  playerPos: Vec2,
  aspect: MapAspect = "1:1",
): ActionChoice[] {
  if (t.kind === "npc") return npcChoices(t.npc, playerPos, aspect);
  if (t.kind === "object") return objectChoices(t.obj, playerPos, aspect);
  if (t.kind === "crowd") return crowdChoices(t.crowd, playerPos, aspect);
  if (t.kind === "stack") {
    const objGroup = t.obj.label;
    const crowdGroup = `人群 · ${t.crowd.label}`;
    return [
      ...objectChoices(t.obj, playerPos, aspect).map((c) => ({
        ...c,
        group: objGroup,
        id: `obj-${c.id}`,
      })),
      ...crowdChoices(t.crowd, playerPos, aspect).map((c) => ({
        ...c,
        group: crowdGroup,
        id: `crowd-${c.id}`,
        primary: false,
      })),
    ];
  }
  if (t.kind === "self") return selfChoices(t.player);
  return floorChoices(t.pos, t.near, playerPos, aspect);
}

function npcChoices(npc: Character, playerPos: Vec2, aspect: MapAspect): ActionChoice[] {
  const d = dist(playerPos, npc, aspect);
  const prox = proximity(d);
  const sight = sightOn(npc, playerPos, aspect);
  const f = `「${publicName(npc)}」`;
  const w = (intent: string) => wrap(f, prox, d, intent);
  const sneak: ActionChoice | null =
    sight === "blind" && prox !== "far"
      ? {
          id: "sneak",
          label: "從死角靠近",
          hint: "對方視野外",
          text: w("繞到對方視野外靠近，盡量不被看見。"),
        }
      : null;
  if (prox === "far" || prox === "distant") {
    return [
      { id: "go", label: "走過去", text: w("走過去，停在可交談的距離。"), primary: true },
      { id: "go-talk", label: "走過去並交談", text: w("走過去，抵達後再開口交談。") },
      { id: "shout", label: "原地喊話", hint: "對方多半聽不見", text: w("原地朝對方喊話，不移動。") },
      { id: "watch", label: "遠遠觀望", text: w("不靠近，只從這裡看對方在做什麼。") },
      ...(sneak ? [sneak] : []),
    ];
  }
  if (prox === "same-area") {
    return [
      { id: "go-talk", label: "走過去並交談", text: w("走近後再正常交談。"), primary: true },
      { id: "call", label: "原地揚聲招呼", text: w("不移動，提高音量招呼對方。") },
      { id: "sit", label: "走過去坐下", text: w("走到對方旁邊坐下。若沒有座位，就近蹲或靠著。") },
      { id: "watch", label: "觀望", text: w("不打擾，看對方在做什麼。") },
      ...(sneak ? [sneak] : []),
    ];
  }
  if (prox === "near") {
    return [
      { id: "talk", label: "交談", text: w("就地開口交談。"), primary: true },
      { id: "closer", label: "再靠近後低語", text: w("再走近到伸手可及，再低聲說話。") },
      { id: "sit", label: "在旁坐下", text: w("在對方旁邊坐下或找座位。") },
      { id: "watch", label: "靜靜看著", text: w("不先開口，只看著對方。") },
      ...(sneak ? [sneak] : []),
    ];
  }
  return [
    { id: "talk", label: "交談", text: w("就地交談。"), primary: true },
    { id: "whisper", label: "低語", text: w("低聲說話，只有伸手可及的人聽得見。") },
    { id: "sit", label: "坐下", text: w("在對方旁邊坐下。") },
    { id: "touch", label: "輕碰對方", hint: "拍肩、碰袖", text: w("伸手輕碰對方以引起注意。") },
    ...(sneak ? [sneak] : []),
  ];
}

function objectChoices(obj: MapObject, playerPos: Vec2, aspect: MapAspect): ActionChoice[] {
  const d = dist(playerPos, obj, aspect);
  const prox = proximity(d);
  const close = d <= RANGE.adjacent;
  const f = `物件「${obj.label}」`;
  const w = (intent: string) => wrap(f, prox, d, intent);
  const go: ActionChoice = {
    id: "go",
    label: close ? "就站在這裡" : "走過去",
    text: w(close ? "留在物件旁邊，不另做別的。" : `走到「${obj.label}」旁邊。`),
    primary: !close,
  };
  const look: ActionChoice = {
    id: "look",
    label: close ? "就近檢視" : "走過去並檢視",
    text: w(close ? `仔細檢視「${obj.label}」。` : `走向「${obj.label}」並檢視。`),
    primary: close,
  };

  if (obj.kind === "door") {
    return [
      { ...go, primary: !close },
      {
        id: "enter",
        label: "推門通過",
        hint: "可能離開此地",
        text: w(`走向「${obj.label}」並嘗試通過。若那是出口，就離開目前場景。`),
        primary: close,
      },
      {
        id: "listen",
        label: "在門邊聽",
        text: w(`靠近「${obj.label}」，聽另一側有沒有動靜。`),
      },
      { ...look, primary: false },
    ];
  }

  if (obj.kind === "container") {
    return [
      go,
      {
        id: "search",
        label: close ? "翻找" : "走過去翻找",
        text: w(`打開或翻找「${obj.label}」。`),
        primary: true,
      },
      look,
    ];
  }

  if (obj.kind === "hazard") {
    return [
      {
        id: "careful",
        label: "小心靠近",
        text: w(`小心靠近「${obj.label}」，保持警戒。`),
        primary: true,
      },
      {
        id: "avoid",
        label: "避開",
        text: w(`繞開「${obj.label}」，走到安全的一側。`),
      },
      look,
    ];
  }

  const canSit = obj.kind === "furniture" || sitLabel(obj);
  const out: ActionChoice[] = [
    { ...go, primary: !canSit && !close },
  ];
  if (canSit) {
    out.push({
      id: "sit",
      label: close ? "坐下" : "走過去坐下",
      text: w(
        close
          ? `在「${obj.label}」坐下或靠著。`
          : `走到「${obj.label}」並坐下。若不宜坐，就靠著或站在旁邊。`,
      ),
      primary: true,
    });
  }
  out.push({ ...look, primary: close && !canSit });
  if (obj.kind === "furniture" && /吧|櫃|台/.test(obj.label)) {
    out.push({
      id: "lean",
      label: close ? "靠上吧台" : "走過去靠著",
      text: w(`把手肘靠上「${obj.label}」，等人或點東西。`),
    });
  }
  return out;
}

function crowdChoices(crowd: Crowd, playerPos: Vec2, aspect: MapAspect): ActionChoice[] {
  const d = dist(playerPos, crowd, aspect);
  const prox = proximity(d);
  const close = d <= RANGE.near;
  const f = `人群「${crowd.label}」（約 ${crowd.size} 人，無名）`;
  const w = (intent: string) => wrap(f, prox, d, intent);
  return [
    {
      id: "approach",
      label: close ? "走近這群人" : "走過去",
      text: w(close ? "再靠近這群無名的人。" : `走到人群「${crowd.label}」旁邊。`),
      primary: !close,
    },
    {
      id: "listen",
      label: close ? "聽他們在說什麼" : "走過去聽人聲",
      text: w(`湊近人群「${crowd.label}」，聽有沒有聽得見的話。他們是背景無名者，不必當成具名角色。`),
      primary: close,
    },
    {
      id: "watch",
      label: "觀望這群人",
      text: w(`不打擾，只看人群「${crowd.label}」在做什麼。`),
    },
    {
      id: "address",
      label: close ? "對這群人說話" : "走過去搭話",
      hint: "不一定有人應",
      text: w(`朝人群「${crowd.label}」開口。若有人從中應聲成為具名角色，由情境決定，且不能只抽出一人就讓整團消失。`),
    },
  ];
}

function floorChoices(
  pos: Vec2,
  near: MapObject | null,
  playerPos: Vec2,
  aspect: MapAspect,
): ActionChoice[] {
  const d = dist(playerPos, pos, aspect);
  const prox = proximity(d);
  const dest = `(${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`;
  const nearBit = near ? `，靠近「${near.label}」` : "";
  const f = `座標 ${dest}${nearBit}`;
  const w = (intent: string) => wrap(f, prox, d, intent);
  const out: ActionChoice[] = [
    {
      id: "walk",
      label: "走到這裡",
      text: w(`走到座標 ${dest}${nearBit}。只移動，不對人說話。`),
      primary: true,
    },
    {
      id: "look",
      label: "走到並環顧",
      text: w(`走到座標 ${dest}，停下來環顧四周。`),
    },
    {
      id: "wait",
      label: "在此等候",
      text: w(`走到座標 ${dest} 後就地等候。`),
    },
  ];
  if (near && pctDist(pos, near) <= 14) {
    out.push({
      id: "use-near",
      label: `改對準「${near.label}」`,
      hint: "開該物件的選單",
      text: "",
    });
  }
  return out;
}

function selfChoices(player: Character): ActionChoice[] {
  const w = (intent: string) =>
    `對準自己（${player.name}）。意圖：${intent}。不移動到遠處方塊。`;
  return [
    { id: "look", label: "環顧四周", text: w("站在原地，仔細看這個場所。"), primary: true },
    { id: "inv", label: "檢查隨身", text: w("翻自己身上帶的東西。") },
    { id: "wait", label: "原地等待", text: w("什麼都不做，等場中的人先動。") },
  ];
}

export function customIntent(
  t: ActionTarget,
  playerPos: Vec2,
  intent: string,
  aspect: MapAspect = "1:1",
): string {
  const { prox, d } = targetDetail(t, playerPos, aspect);
  const focus =
    t.kind === "npc"
      ? `「${publicName(t.npc)}」`
      : t.kind === "object"
        ? `物件「${t.obj.label}」`
        : t.kind === "crowd"
          ? `人群「${t.crowd.label}」`
          : t.kind === "stack"
            ? `物件「${t.obj.label}」與人群「${t.crowd.label}」`
            : t.kind === "self"
              ? "自己"
              : `座標 (${t.pos.x.toFixed(0)}, ${t.pos.y.toFixed(0)})`;
  return wrap(focus, prox, d, intent.trim());
}

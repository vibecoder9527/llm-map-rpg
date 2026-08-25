import { chatJson, chatText, generateMapImage, generatePortraitImage, visionJson } from "@/lib/ai/functions";
import type { ClientApiConfig } from "@/lib/ai/config";
import { clampMaxTokens, DEFAULT_MAX_TOKENS } from "@/lib/ai/config";
import { uid } from "@/lib/utils";
import { extractJson, asNumber, asString, softenProse } from "./json";
import { parseMapAspect, standoffAlongApproach } from "./distance";
import { facingOf, facingToward, nextAlert, normalizeFacing, sightOn } from "./vision";
import {
  annotatePrompt,
  IMAGE_FIELD_LABELS,
  inventNpcPrompt,
  mapImagePrompt,
  npcThinkPrompt,
  placePrompt,
  portraitPrompt,
  resolveImageStyle,
  resolveMapStyle,
  resolvePortraitStyle,
  schematicLayoutPrompt,
  themePrompt,
  translateImageFieldsPrompt,
  turnPrompt,
  worldPrompt,
  type ImageFieldLabel,
} from "./prompts";
import { renderSchematic } from "./schematic";
import { sampleGame } from "./sample";
import { publicName, shortLook, trueNameOf } from "./identity";
import { defaultObjectLayer } from "./actions";
import type {
  Character,
  Crowd,
  Game,
  LoreEntry,
  MapAnnotation,
  MapObject,
  NpcThought,
  Scene,
  TurnResult,
  Vec2,
  WorldDraft,
} from "./types";

export type ProgressFn = (stage: string, detail?: string) => void;

const NPC_COLORS = ["#7d9aa3", "#a67c6d", "#8a8e7a", "#7a7e8c", "#9a8b78"];

let workSignal: AbortSignal | null = null;

export function setWorkSignal(signal: AbortSignal | null): void {
  workSignal = signal;
}

export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; message?: string };
  return e.name === "AbortError" || e.message === "已終止";
}

function abortErr(): DOMException {
  return new DOMException("已終止", "AbortError");
}

function throwIfAborted(): void {
  if (workSignal?.aborted) throw abortErr();
}

function raced<T>(p: Promise<T>): Promise<T> {
  throwIfAborted();
  const signal = workSignal;
  if (!signal) return p;
  return new Promise((resolve, reject) => {
    const stop = () => reject(abortErr());
    signal.addEventListener("abort", stop, { once: true });
    p.then(
      (v) => {
        signal.removeEventListener("abort", stop);
        throwIfAborted();
        resolve(v);
      },
      (e) => {
        signal.removeEventListener("abort", stop);
        reject(e);
      },
    );
  });
}

async function askJson<T>(
  config: ClientApiConfig,
  user: string,
  system?: string,
  opts?: { maxTokens?: number; temperature?: number },
): Promise<T> {
  const messages = [
    ...(system ? [{ role: "system" as const, content: system }] : []),
    { role: "user" as const, content: user },
  ];
  const { text, finishReason } = await raced(
    chatJson({
      data: {
        config,
        messages,
        maxTokens: opts?.maxTokens ?? clampMaxTokens(config.maxTokens ?? DEFAULT_MAX_TOKENS),
        temperature: opts?.temperature ?? 0.7,
      },
    }),
  );
  console.info("[圖誌] LLM 原文", text);
  if (finishReason === "length") {
    console.warn("[圖誌] 輸出被 max_tokens 截斷");
  }
  return extractJson<T>(text);
}

function hasCjk(s: string): boolean {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(s);
}

function parseLabeledFields(text: string): Partial<Record<ImageFieldLabel, string>> {
  const out: Partial<Record<ImageFieldLabel, string>> = {};
  const body = text.replace(/```(?:\w+)?\s*([\s\S]*?)```/g, "$1");
  const lines = body.split(/\n/);
  let current: ImageFieldLabel | null = null;
  let buf: string[] = [];

  const junk =
    /^\s*([*\-•]|\d+\.|Input:|Task:|Constraints:|Brief:|Check |Self-Correction|Refining |Final check)/i;

  function commit() {
    if (!current || !buf.length) return;
    const v = buf.join(" ").replace(/\s+/g, " ").trim();
    if (v) out[current] = v;
    current = null;
    buf = [];
  }

  for (const line of lines) {
    const labeled = line.match(
      /^\s*(STYLE|APPEARANCE|CLOTHING|SCENE)\s*[:：]\s*(.*)$/i,
    );
    if (labeled) {
      commit();
      current = labeled[1]!.toUpperCase() as ImageFieldLabel;
      buf = labeled[2]?.trim() ? [labeled[2].trim()] : [];
      continue;
    }
    if (!current) continue;
    if (junk.test(line)) {
      commit();
      continue;
    }
    if (line.trim()) buf.push(line.trim());
  }
  commit();
  return out;
}

async function translateImageFields(
  config: ClientApiConfig,
  fields: Partial<Record<ImageFieldLabel, string>>,
): Promise<Partial<Record<ImageFieldLabel, string>>> {
  const src: Partial<Record<ImageFieldLabel, string>> = {};
  for (const k of IMAGE_FIELD_LABELS) {
    const v = fields[k]?.trim();
    if (v) src[k] = v;
  }
  if (!Object.values(src).some((v) => v && hasCjk(v))) return src;
  try {
    const { text } = await raced(
      chatText({
        data: {
          config,
          messages: [{ role: "user", content: translateImageFieldsPrompt(src) }],
          temperature: 0.2,
        },
      }),
    );
    console.info("[圖誌] LLM 原文", text);
    const got = parseLabeledFields(text);
    const merged = { ...src };
    for (const k of IMAGE_FIELD_LABELS) {
      const v = got[k]?.trim();
      if (v) merged[k] = v;
    }
    console.info("[圖誌] 圖詞欄位", {
      STYLE: merged.STYLE?.slice(0, 120),
      APPEARANCE: merged.APPEARANCE?.slice(0, 120),
      CLOTHING: merged.CLOTHING?.slice(0, 120),
      SCENE: merged.SCENE?.slice(0, 120),
    });
    return merged;
  } catch (err) {
    if (isAbortError(err)) throw err;
    return src;
  }
}

function clampCoord(n: number): number {
  return Math.min(94, Math.max(6, n));
}

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[、,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function parseObjects(raw: unknown): MapObject[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => {
      const o = item as Record<string, unknown>;
      const kind = asString(o.kind, "other") as MapObject["kind"];
      const allowed: MapObject["kind"][] = [
        "furniture",
        "door",
        "landmark",
        "hazard",
        "container",
        "other",
      ];
      const w = Math.min(80, Math.max(4, asNumber(o.w, 10)));
      const h = Math.min(80, Math.max(4, asNumber(o.h, 10)));
      const zRaw = asNumber(o.z, NaN);
      return {
        id: asString(o.id, `obj_${i}`),
        label: asString(o.label, `物件${i + 1}`),
        kind: allowed.includes(kind) ? kind : "other",
        x: clampCoord(asNumber(o.x, 50)),
        y: clampCoord(asNumber(o.y, 50)),
        w,
        h,
        z: Number.isFinite(zRaw) ? Math.round(zRaw) : defaultObjectLayer(w, h),
        desc: asString(o.desc, ""),
      };
    })
    .filter((o) => o.label);
}

function parseCrowd(raw: Record<string, unknown>, i: number, fallback?: Crowd): Crowd {
  const fallbackRx = fallback?.rx ?? 10;
  const fallbackRy = fallback?.ry ?? fallbackRx;
  const legacy = asNumber(raw.r, NaN);
  const rx = Math.min(
    36,
    Math.max(4, asNumber(raw.rx, Number.isFinite(legacy) ? legacy : fallbackRx)),
  );
  const ry = Math.min(
    36,
    Math.max(4, asNumber(raw.ry, Number.isFinite(legacy) ? legacy : fallbackRy)),
  );
  const size = Math.min(40, Math.max(1, Math.round(asNumber(raw.size, fallback?.size ?? 4))));
  return {
    id: asString(raw.id, fallback?.id ?? `crowd_${i}`),
    label: asString(raw.label, fallback?.label ?? `人群${i + 1}`),
    x: clampCoord(asNumber(raw.x, fallback?.x ?? 50)),
    y: clampCoord(asNumber(raw.y, fallback?.y ?? 50)),
    rx,
    ry,
    size,
    desc: asString(raw.desc, fallback?.desc ?? ""),
    namedOut: Math.max(0, Math.round(asNumber(raw.namedOut, fallback?.namedOut ?? 0))),
  };
}

function crowdsFromDraft(draft: WorldDraft): Crowd[] {
  const raw = draft.crowds;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((c, i) =>
    parseCrowd(
      {
        id: `crowd_${i}`,
        label: c.label,
        desc: c.desc,
        size: c.size,
        x: c.x,
        y: c.y,
        r: c.r,
        rx: c.rx,
        ry: c.ry,
      } as unknown as Record<string, unknown>,
      i,
    ),
  );
}

export async function inventNpc(
  config: ClientApiConfig,
  game: Game,
  scene: Scene,
  hint: string,
): Promise<Character> {
  const lore = game.lorebook
    .filter((e) => e.constant)
    .concat(game.lorebook.filter((e) => !e.constant).slice(0, 4))
    .slice(0, 8)
    .map((e) => `- ${e.title}：${e.content}`)
    .join("\n");
  const raw = await askJson<Record<string, unknown>>(
    config,
    inventNpcPrompt({
      theme: game.theme,
      sceneName: scene.name,
      sceneSummary: scene.summary,
      objects: scene.objects.map((o) => `${o.label}@(${o.x.toFixed(0)},${o.y.toFixed(0)})`).join("、"),
      existing: scene.npcs
        .map((n) => `${trueNameOf(n)}@(${n.x.toFixed(0)},${n.y.toFixed(0)})`)
        .join("、"),
      lore,
      hint,
    }),
    undefined,
    { temperature: 0.75 },
  );
  const name = asString(raw.name, "無名");
  const clothing = asString(raw.clothing, "");
  const appearance = asString(raw.appearance, "");
  const age = Math.max(5, Math.round(asNumber(raw.age, 18)));
  return {
    id: uid("npc"),
    name,
    trueName: asString(raw.trueName, name),
    known: raw.known === true,
    alias: asString(raw.alias, "") || shortLook(clothing) || shortLook(appearance),
    role: "npc",
    bio: asString(raw.bio, ""),
    personality: asString(raw.personality, ""),
    appearance,
    clothing,
    age,
    gender: asString(raw.gender, ""),
    race: asString(raw.race, "人類"),
    tags: parseTags(raw.tags),
    color: NPC_COLORS[scene.npcs.length % NPC_COLORS.length]!,
    x: clampCoord(asNumber(raw.x, 50)),
    y: clampCoord(asNumber(raw.y, 50)),
    facing: normalizeFacing(asNumber(raw.facing, 180)),
    alert: "unaware",
    status: asString(raw.status, ""),
    goal: asString(raw.goal, ""),
    memory: "",
  };
}

export async function generateTheme(
  config: ClientApiConfig,
  hint: string,
): Promise<{ theme: string; pitch: string; place: string }> {
  return askJson(config, themePrompt(hint), undefined, {
    maxTokens: 400,
    temperature: 0.9,
  });
}

export async function generateWorld(
  config: ClientApiConfig,
  input: {
    theme: string;
    playerHint: string;
    extra: string;
    imageStyle: string;
    mapStyle?: string;
    portraitStyle?: string;
    seedLore?: LoreEntry[];
    adultsOnly?: boolean;
  },
): Promise<WorldDraft & { title: string }> {
  const raw = await askJson<Record<string, unknown>>(
    config,
    worldPrompt(input),
    undefined,
    { temperature: 0.8 },
  );
  const loreRaw = Array.isArray(raw.lorebook) ? raw.lorebook : [];
  const npcRaw = Array.isArray(raw.npcs) ? raw.npcs : [];
  const player = (raw.player ?? {}) as Record<string, unknown>;
  const scene = (raw.scene ?? {}) as Record<string, unknown>;
  const lorebook: LoreEntry[] = [
    ...(input.seedLore ?? []),
    ...loreRaw.map((e, i) => {
      const row = e as Record<string, unknown>;
      return {
        id: uid("lb"),
        title: asString(row.title, `條目 ${i + 1}`),
        content: asString(row.content, ""),
        tags: Array.isArray(row.tags) ? row.tags.map((t) => String(t)) : [],
        constant: row.constant === true,
      };
    }),
  ].filter((e, i, arr) => arr.findIndex((x) => x.title === e.title) === i);
  return {
    title: asString(raw.title, asString(raw.theme, "未命名旅程")),
    theme: asString(raw.theme, input.theme),
    imageStyle: (input.mapStyle ?? input.imageStyle).trim(),
    mapStyle: (input.mapStyle ?? input.imageStyle).trim(),
    portraitStyle: (input.portraitStyle ?? input.imageStyle).trim(),
    lorebook,
    player: {
      name: asString(player.name, "旅人"),
      bio: asString(player.bio, ""),
      appearance: asString(player.appearance, ""),
      clothing: asString(player.clothing, ""),
      age: Math.round(asNumber(player.age, 0)),
      gender: asString(player.gender, ""),
      race: asString(player.race, ""),
      status: asString(player.status, "剛抵達"),
    },
    scene: {
      name: asString(scene.name, "未知場所"),
      summary: asString(scene.summary, ""),
      atmosphere: asString(scene.atmosphere, ""),
      mapPrompt: asString(scene.mapPrompt, input.theme),
      mapAspect: parseMapAspect(scene.mapAspect),
    },
    npcs: npcRaw.map((n) => {
      const row = n as Record<string, unknown>;
      return {
        name: asString(row.name, "無名"),
        trueName: asString(row.trueName, asString(row.name, "無名")),
        known: false,
        alias: asString(row.alias, ""),
        bio: asString(row.bio, ""),
        appearance: asString(row.appearance, ""),
        clothing: asString(row.clothing, ""),
        age: Math.round(asNumber(row.age, 0)),
        gender: asString(row.gender, ""),
        race: asString(row.race, ""),
        tags: parseTags(row.tags),
        personality: asString(row.personality, ""),
        status: asString(row.status, ""),
        goal: asString(row.goal, ""),
        where: asString(row.where, "場中"),
      };
    }),
    crowds: Array.isArray(raw.crowds)
      ? (raw.crowds as Record<string, unknown>[]).map((row, i) => ({
          label: asString(row.label, `人群${i + 1}`),
          desc: asString(row.desc, ""),
          size: asNumber(row.size, 4),
          x: asNumber(row.x, 50),
          y: asNumber(row.y, 50),
          r: asNumber(row.r, 10),
          rx: asNumber(row.rx, asNumber(row.r, 10)),
          ry: asNumber(row.ry, asNumber(row.r, 10)),
        }))
      : [],
  };
}

async function annotateMap(
  config: ClientApiConfig,
  image: string,
): Promise<MapAnnotation> {
  const { text } = await raced(
    visionJson({
      data: { config, prompt: annotatePrompt(), image },
    }),
  );
  console.info("[圖誌] LLM 原文", text);
  const raw = extractJson<Record<string, unknown>>(text);
  return {
    title: asString(raw.title, ""),
    walkableNotes: asString(raw.walkableNotes, ""),
    objects: parseObjects(raw.objects),
  };
}

async function inventLayout(
  config: ClientApiConfig,
  scene: WorldDraft["scene"],
): Promise<MapAnnotation> {
  const raw = await askJson<Record<string, unknown>>(
    config,
    schematicLayoutPrompt(scene),
    undefined,
    { temperature: 0.4 },
  );
  return {
    title: asString(raw.title, scene.name),
    walkableNotes: asString(raw.walkableNotes, ""),
    objects: parseObjects(raw.objects),
  };
}

async function placeActors(
  config: ClientApiConfig,
  scene: WorldDraft["scene"],
  annotation: MapAnnotation,
  playerName: string,
  npcs: WorldDraft["npcs"],
): Promise<{
  player: { x: number; y: number };
  npcs: Array<{ name: string; x: number; y: number; status: string }>;
}> {
  const compact = annotation.objects.map((o) => ({
    label: o.label,
    x: o.x,
    y: o.y,
    kind: o.kind,
  }));
  const raw = await askJson<Record<string, unknown>>(
    config,
    placePrompt(
      {
        name: scene.name,
        summary: scene.summary,
        walkableNotes: annotation.walkableNotes,
        mapAspect: scene.mapAspect,
      },
      compact,
      playerName,
      npcs,
    ),
    undefined,
    { maxTokens: 800, temperature: 0.4 },
  );
  const player = (raw.player ?? {}) as Record<string, unknown>;
  const list = Array.isArray(raw.npcs) ? raw.npcs : [];
  return {
    player: {
      x: clampCoord(asNumber(player.x, 50)),
      y: clampCoord(asNumber(player.y, 82)),
    },
    npcs: list.map((n, i) => {
      const row = n as Record<string, unknown>;
      return {
        name: asString(row.name, npcs[i]?.name ?? "無名"),
        x: clampCoord(asNumber(row.x, 40 + i * 10)),
        y: clampCoord(asNumber(row.y, 40)),
        status: asString(row.status, npcs[i]?.status ?? ""),
      };
    }),
  };
}

async function buildScene(
  config: ClientApiConfig,
  draft: WorldDraft,
  onProgress: ProgressFn,
  known: Record<string, Pick<Character, "portrait" | "goal" | "memory">> = {},
): Promise<Scene> {
  onProgress("整理提示詞", "譯成英文再送去畫圖");
  const mapAspect = parseMapAspect(draft.scene.mapAspect);
  let mapImage = "";
  let mapSource: Scene["mapSource"] = "generated";
  try {
    const bits = await translateImageFields(config, {
      STYLE: resolveMapStyle(draft),
      SCENE: draft.scene.mapPrompt,
    });
    const prompt = mapImagePrompt(bits.SCENE ?? draft.scene.mapPrompt, bits.STYLE);
    onProgress("繪製地圖", "正上方俯視圖");
    const res = await raced(
      generateMapImage({ data: { config, prompt, aspect: mapAspect } }),
    );
    mapImage = res.image;
  } catch (err) {
    if (isAbortError(err)) throw err;
    mapSource = "schematic";
  }

  let annotation: MapAnnotation;
  if (mapSource === "generated" && mapImage) {
    onProgress("辨識場景物件", "讀取地圖上的家具與出口");
    try {
      annotation = await annotateMap(config, mapImage);
    } catch (err) {
      if (isAbortError(err)) throw err;
      annotation = await inventLayout(config, draft.scene);
    }
  } else {
    onProgress("配置平面", "改以示意平面圖");
    annotation = await inventLayout(config, draft.scene);
    mapImage = renderSchematic(annotation.objects, draft.scene.name, mapAspect);
  }

  if (annotation.objects.length === 0) {
    annotation = await inventLayout(config, draft.scene);
    if (mapSource !== "generated") {
      mapImage = renderSchematic(annotation.objects, draft.scene.name, mapAspect);
      mapSource = "schematic";
    }
  }

  onProgress("安置人物", "依地圖標註分散站位");
  const placed = await placeActors(
    config,
    draft.scene,
    annotation,
    draft.player.name,
    draft.npcs,
  );

  const npcs: Character[] = draft.npcs.map((n, i) => {
    const match =
      placed.npcs.find((p) => p.name === n.name) ?? placed.npcs[i];
    return {
      id: uid("npc"),
      name: n.name,
      trueName: n.trueName || n.name,
      known: n.known === true,
      alias: n.alias || shortLook(n.clothing) || shortLook(n.appearance),
      role: "npc",
      bio: n.bio,
      personality: n.personality || "",
      appearance: n.appearance,
      clothing: n.clothing || "",
      age: n.age && n.age > 0 ? Math.round(n.age) : 0,
      gender: n.gender || "",
      race: n.race || "",
      tags: n.tags ?? [],
      color: NPC_COLORS[i % NPC_COLORS.length]!,
      x: match?.x ?? 40 + i * 8,
      y: match?.y ?? 40,
      facing: facingToward(
        { x: match?.x ?? 40 + i * 8, y: match?.y ?? 40 },
        placed.player,
      ),
      alert: "unaware",
      status: match?.status || n.status,
      goal: n.goal || known[n.name]?.goal || known[n.trueName || n.name]?.goal || "",
      memory: known[n.name]?.memory || known[n.trueName || n.name]?.memory || "",
      portrait: known[n.name]?.portrait || known[n.trueName || n.name]?.portrait,
    };
  });

  return {
    id: uid("scene"),
    name: draft.scene.name,
    summary: draft.scene.summary,
    atmosphere: draft.scene.atmosphere,
    mapImage,
    mapSource,
    mapAspect,
    mapPrompt: draft.scene.mapPrompt,
    walkableNotes: annotation.walkableNotes,
    objects: annotation.objects,
    crowds: crowdsFromDraft(draft),
    npcs,
    playerPos: placed.player,
  };
}

export async function startNewGame(
  config: ClientApiConfig,
  draft: WorldDraft & { title: string },
  onProgress: ProgressFn,
  opts?: { opening?: string },
): Promise<Game> {
  const scene = await buildScene(config, draft, onProgress);
  const now = Date.now();
  const player: Character = {
    id: "player",
    name: draft.player.name,
    role: "player",
    bio: draft.player.bio,
    appearance: draft.player.appearance,
    clothing: draft.player.clothing || "",
    age: draft.player.age && draft.player.age > 0 ? Math.round(draft.player.age) : 0,
    gender: draft.player.gender || "",
    race: draft.player.race || "",
    color: "#f4f1ea",
    x: scene.playerPos.x,
    y: scene.playerPos.y,
    status: draft.player.status,
  };
  const near = scene.npcs
    .map((n) => publicName(n))
    .join("、");
  return {
    version: 1,
    id: uid("game"),
    title: draft.title,
    theme: draft.theme,
    imageStyle: draft.mapStyle || draft.imageStyle || "",
    mapStyle: draft.mapStyle || draft.imageStyle || "",
    portraitStyle: draft.portraitStyle || draft.imageStyle || "",
    createdAt: now,
    updatedAt: now,
    turnCount: 0,
    lorebook: draft.lorebook,
    player,
    inventory: [],
    flags: {},
    scenes: { [scene.id]: scene },
    currentSceneId: scene.id,
    log: [
      {
        id: uid("log"),
        at: now,
        kind: "narrative",
        text:
          opts?.opening?.trim() ||
          `${scene.atmosphere}\n\n你站在${scene.name}。${scene.summary}${near ? ` 場中可見：${near}。` : ""}\n距離會改變誰聽得見你。`,
      },
    ],
    suggested: ["環顧四周", "走向最近的人", "檢查自己身上帶了什麼"],
  };
}

export function makeSample(): Game {
  return sampleGame();
}

export async function takeTurn(
  config: ClientApiConfig,
  game: Game,
  action: string,
  onProgress: ProgressFn,
): Promise<Game> {
  const scene = game.scenes[game.currentSceneId];
  if (!scene) throw new Error("找不到當前場景");
  const prior: Game = structuredClone({ ...game, checkpoint: undefined });

  let thoughts: NpcThought[] = [];
  let thinkingNpcs = scene.npcs;
  if (scene.npcs.length > 0) {
    onProgress(
      "在場的人在想",
      scene.npcs.map((n) => publicName(n)).join("、"),
    );
    thoughts = await thinkNpcs(config, game, scene, action);
    thinkingNpcs = scene.npcs.map((npc) => {
      const t = thoughts.find((x) => x.id === npc.id) ?? thoughts.find((x) => x.name === npc.name);
      if (!t) return npc;
      return {
        ...npc,
        goal: clip(t.goal, 48) || npc.goal,
        memory: clip(t.memory, 80) || npc.memory,
        facing:
          typeof t.facing === "number" ? normalizeFacing(t.facing) : npc.facing,
      };
    });
  }

  const thinkingScene: Scene = { ...scene, npcs: thinkingNpcs };
  onProgress("推演這一回", "把距離與在場內心交給主持人");
  const raw = await askJson<TurnResult>(
    config,
    turnPrompt(game, thinkingScene, action, thoughts),
    undefined,
    { temperature: 0.75 },
  );

  let playerPos = {
    x: clampCoord(asNumber(raw.player?.x, scene.playerPos.x)),
    y: clampCoord(asNumber(raw.player?.y, scene.playerPos.y)),
  };

  const npcUpdates = Array.isArray(raw.npcs) ? raw.npcs : [];
  let npcs = thinkingNpcs.map((npc) => {
    const u = npcUpdates.find((n) => n.id === npc.id);
    if (!u) return npc;
    const x = clampCoord(asNumber(u.x, npc.x));
    const y = clampCoord(asNumber(u.y, npc.y));
    const moved = x !== npc.x || y !== npc.y;
    const facingRaw = (u as { facing?: unknown }).facing;
    const facing =
      facingRaw != null
        ? normalizeFacing(asNumber(facingRaw, facingOf(npc)))
        : moved
          ? facingToward(npc, { x, y })
          : npc.facing;
    return {
      ...npc,
      x,
      y,
      facing,
      status: asString(u.status, npc.status),
      known: typeof u.known === "boolean" ? u.known : npc.known,
      name:
        u.known === true && asString(u.name, "")
          ? asString(u.name, npc.name)
          : npc.name,
    };
  });

  const aspect = parseMapAspect(scene.mapAspect);
  const backed = standoffAlongApproach(scene.playerPos, playerPos, npcs, aspect);
  playerPos = { x: clampCoord(backed.x), y: clampCoord(backed.y) };
  npcs = npcs.map((n) => ({
    ...n,
    alert: nextAlert(n.alert, sightOn(n, playerPos, aspect)),
  }));

  const crowdResult = applyCrowdTurn(scene.crowds ?? [], raw, npcs.length);
  npcs = [...npcs, ...crowdResult.spawned];
  const crowds = crowdResult.crowds;

  const log: Game["log"] = [
    ...game.log,
    { id: uid("log"), at: Date.now(), kind: "action", text: action },
    {
      id: uid("log"),
      at: Date.now() + 1,
      kind: "narrative",
      text: weaveSpeech(raw.narrative, npcUpdates, npcs),
    },
  ];

  let next: Game = {
    ...game,
    turnCount: game.turnCount + 1,
    updatedAt: Date.now(),
    inventory: Array.isArray(raw.inventory) ? raw.inventory : game.inventory,
    flags: raw.flags ? { ...game.flags, ...raw.flags } : game.flags,
    player: { ...game.player, x: playerPos.x, y: playerPos.y },
    suggested: Array.isArray(raw.suggested) && raw.suggested.length
      ? raw.suggested.slice(0, 4)
      : game.suggested,
    log: log.slice(-80),
    scenes: {
      ...game.scenes,
      [scene.id]: { ...scene, playerPos, npcs, crowds },
    },
  };

  if (raw.sceneChange && raw.sceneChange.name) {
    onProgress("進入新場景", raw.sceneChange.name);
    const draft: WorldDraft = {
      theme: game.theme,
      imageStyle: game.mapStyle || game.imageStyle || "",
      mapStyle: game.mapStyle || game.imageStyle || "",
      portraitStyle: game.portraitStyle || game.imageStyle || "",
      lorebook: game.lorebook,
      player: {
        name: game.player.name,
        bio: game.player.bio,
        appearance: game.player.appearance,
        clothing: game.player.clothing || "",
        age: game.player.age,
        gender: game.player.gender || "",
        race: game.player.race || "",
        status: game.player.status,
      },
      scene: {
        name: raw.sceneChange.name,
        summary: raw.sceneChange.summary,
        atmosphere: raw.sceneChange.atmosphere,
        mapPrompt: raw.sceneChange.mapPrompt,
        mapAspect: parseMapAspect(raw.sceneChange.mapAspect),
      },
      npcs: raw.sceneChange.npcs ?? [],
    };
    const newScene = await buildScene(
      config,
      draft,
      onProgress,
      collectNpcCarry(next),
    );
    const extraLog: Game["log"] = [
      ...next.log,
      {
        id: uid("log"),
        at: Date.now(),
        kind: "system",
        text: `抵達：${newScene.name}。${raw.sceneChange.reason ?? ""}`.trim(),
      },
      {
        id: uid("log"),
        at: Date.now() + 1,
        kind: "narrative",
        text: `${newScene.atmosphere}\n\n${newScene.summary}`,
      },
    ];
    next = {
      ...next,
      currentSceneId: newScene.id,
      player: {
        ...next.player,
        x: newScene.playerPos.x,
        y: newScene.playerPos.y,
      },
      scenes: { ...next.scenes, [newScene.id]: newScene },
      log: extraLog,
    };
  }

  return { ...next, checkpoint: prior };
}

export function lastPlayerAction(game: Game): string | null {
  for (let i = game.log.length - 1; i >= 0; i--) {
    if (game.log[i]!.kind === "action") return game.log[i]!.text;
  }
  return null;
}

function weaveSpeech(
  narrative: string,
  updates: TurnResult["npcs"],
  npcs: Character[],
): string {
  let text = softenProse(asString(narrative, "……"));
  for (const u of updates) {
    const line = softenProse(asString(u.speech, "")).trim();
    if (!line) continue;
    if (text.includes(line)) continue;
    const npc = npcs.find((n) => n.id === u.id);
    const who = npc ? publicName(npc) : u.id;
    text = `${text}\n\n${who}：「${line}」`;
  }
  return text;
}

function clip(s: string, n: number): string {
  return s.replace(/\s+/g, " ").trim().slice(0, n);
}

function applyCrowdTurn(
  current: Crowd[],
  raw: TurnResult,
  npcCount: number,
): { crowds: Crowd[]; spawned: Character[] } {
  const byId = new Map(current.map((c) => [c.id, { ...c }]));
  const spawned: Character[] = [];
  const batches = Array.isArray(raw.spawnFromCrowd) ? raw.spawnFromCrowd : [];

  for (const batch of batches) {
    const crowdId = asString(
      (batch as { crowdId?: unknown }).crowdId,
      "",
    );
    const list = Array.isArray(batch.npcs) ? batch.npcs : [];
    if (!crowdId || list.length === 0) continue;
    const crowd = byId.get(crowdId);
    const origin = crowd ?? { x: 50, y: 50, rx: 10, ry: 10 };
    for (let i = 0; i < list.length; i++) {
      const row = list[i] as Record<string, unknown>;
      const ang = (i / Math.max(list.length, 1)) * Math.PI * 2;
      spawned.push({
        id: uid("npc"),
        name: asString(row.name, "無名"),
        trueName: asString(row.trueName, asString(row.name, "無名")),
        known: row.known === true,
        alias: asString(row.alias, shortLook(asString(row.clothing, asString(row.appearance, "")))),
        role: "npc",
        bio: asString(row.bio, ""),
        appearance: asString(row.appearance, ""),
        clothing: asString(row.clothing, ""),
        age: Math.round(asNumber(row.age, 0)),
        gender: asString(row.gender, ""),
        race: asString(row.race, ""),
        tags: parseTags(row.tags),
        personality: asString(row.personality, ""),
        color: NPC_COLORS[(npcCount + spawned.length) % NPC_COLORS.length]!,
        x: clampCoord(origin.x + Math.cos(ang) * Math.min(origin.rx, 8)),
        y: clampCoord(origin.y + Math.sin(ang) * Math.min(origin.ry, 8)),
        facing: facingToward(
          {
            x: origin.x + Math.cos(ang) * Math.min(origin.rx, 8),
            y: origin.y + Math.sin(ang) * Math.min(origin.ry, 8),
          },
          { x: 50, y: 50 },
        ),
        alert: "unaware",
        status: asString(row.status, "從人群裡走出來"),
        goal: asString(row.goal, ""),
        memory: clip(`從「${crowd?.label ?? "人群"}」裡被認出來。`, 80),
      });
    }
    if (crowd) {
      const n = list.length;
      crowd.namedOut += n;
      const remain = crowd.size - n;
      if (remain <= 0 && crowd.namedOut < 2) {
        crowd.size = 1;
      } else {
        crowd.size = Math.max(0, remain);
      }
    }
  }

  const updates = Array.isArray(raw.crowds) ? raw.crowds : [];
  for (const row of updates) {
    const rec = row as Record<string, unknown>;
    const id = asString(rec.id, "");
    const gone = rec.gone === true;
    if (!id) continue;
    const prev = byId.get(id);
    if (gone) {
      if (prev && prev.namedOut >= 2 && prev.size <= 0) {
        byId.delete(id);
      } else if (prev && prev.namedOut >= 2 && asNumber(rec.size, prev.size) <= 0) {
        byId.delete(id);
      }
      // otherwise ignore gone — cannot dissolve after a single named draw
      continue;
    }
    if (prev) {
      const next = parseCrowd(rec, 0, prev);
      if (next.size <= 0 && next.namedOut < 2) next.size = 1;
      if (next.size <= 0 && next.namedOut >= 2) {
        byId.delete(id);
        continue;
      }
      byId.set(id, { ...next, namedOut: prev.namedOut });
    } else {
      byId.set(id, parseCrowd(rec, byId.size));
    }
  }

  for (const [id, c] of byId) {
    if (c.size <= 0 && c.namedOut >= 2) byId.delete(id);
  }

  return { crowds: [...byId.values()], spawned };
}

async function thinkNpcs(
  config: ClientApiConfig,
  game: Game,
  scene: Scene,
  action: string,
): Promise<NpcThought[]> {
  try {
    const raw = await askJson<{ npcs?: unknown }>(
      config,
      npcThinkPrompt(game, scene, action),
      undefined,
      { temperature: 0.6 },
    );
    const rows = Array.isArray(raw.npcs) ? raw.npcs : [];
    return scene.npcs.map((npc) => {
      const hit =
        rows.find((r) => {
          const o = r as Record<string, unknown>;
          return (
            asString(o.id, "") === npc.id ||
            asString(o.name, "") === npc.name ||
            asString(o.name, "") === trueNameOf(npc)
          );
        }) as Record<string, unknown> | undefined;
      return {
        id: npc.id,
        name: trueNameOf(npc),
        thought: clip(asString(hit?.thought, ""), 36),
        intent: clip(asString(hit?.intent, ""), 36),
        goal: clip(asString(hit?.goal, npc.goal ?? ""), 48),
        memory: clip(asString(hit?.memory, npc.memory ?? ""), 80),
        facing:
          hit && hit.facing != null
            ? normalizeFacing(asNumber(hit.facing, facingOf(npc)))
            : npc.facing,
      };
    });
  } catch (err) {
    if (isAbortError(err)) throw err;
    return scene.npcs.map((npc) => ({
      id: npc.id,
      name: trueNameOf(npc),
      thought: "",
      intent: npc.status || "觀望",
      goal: npc.goal ?? "",
      memory: npc.memory ?? "",
    }));
  }
}

export function collectPortraits(game: Game): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of Object.values(game.scenes)) {
    for (const n of s.npcs) {
      if (n.portrait) {
        out[n.name] = n.portrait;
        out[trueNameOf(n)] = n.portrait;
      }
    }
  }
  return out;
}

export function collectNpcCarry(
  game: Game,
): Record<string, Pick<Character, "portrait" | "goal" | "memory">> {
  const out: Record<string, Pick<Character, "portrait" | "goal" | "memory">> = {};
  for (const s of Object.values(game.scenes)) {
    for (const n of s.npcs) {
      const prev = out[trueNameOf(n)] ?? out[n.name] ?? {};
      const carry = {
        portrait: n.portrait || prev.portrait,
        goal: n.goal || prev.goal,
        memory: n.memory || prev.memory,
      };
      out[trueNameOf(n)] = carry;
      out[n.name] = carry;
    }
  }
  return out;
}

export async function revealNpcPortrait(
  config: ClientApiConfig,
  npc: Character,
  scene: Scene,
  imageStyle?: string,
): Promise<string> {
  const bits = await translateImageFields(config, {
    STYLE: resolveImageStyle(imageStyle),
    APPEARANCE: [npc.race, npc.gender, npc.appearance].filter((s) => s?.trim()).join("，"),
    CLOTHING: npc.clothing,
  });
  const prompt = portraitPrompt(
    {
      ...npc,
      appearance: bits.APPEARANCE ?? npc.appearance,
      clothing: bits.CLOTHING ?? npc.clothing,
    },
    bits.STYLE,
  );
  const { image } = await raced(
    generatePortraitImage({
      data: { config, prompt },
    }),
  );
  return image;
}

export type PaintedMap = {
  mapImage: string;
  mapSource: Scene["mapSource"];
  mapPrompt: string;
};

function sceneMetaFrom(scene: Scene, mapPrompt: string): WorldDraft["scene"] {
  return {
    name: scene.name,
    summary: scene.summary,
    atmosphere: scene.atmosphere,
    mapPrompt,
    mapAspect: parseMapAspect(scene.mapAspect),
  };
}

export async function paintSceneMap(
  config: ClientApiConfig,
  game: Game,
  scene: Scene,
  mapPrompt: string,
  onProgress: ProgressFn,
): Promise<PaintedMap> {
  const promptText =
    mapPrompt.trim() ||
    [scene.name, scene.summary, scene.atmosphere].filter(Boolean).join(". ");
  const sceneMeta = sceneMetaFrom(scene, promptText);
  onProgress("整理提示詞", "譯成英文再送去畫圖");
  try {
    const bits = await translateImageFields(config, {
      STYLE: resolveMapStyle(game),
      SCENE: promptText,
    });
    const prompt = mapImagePrompt(bits.SCENE ?? promptText, bits.STYLE);
    onProgress("繪製地圖", "正上方俯視圖");
    const res = await raced(
      generateMapImage({
        data: { config, prompt, aspect: sceneMeta.mapAspect },
      }),
    );
    return { mapImage: res.image, mapSource: "generated", mapPrompt: promptText };
  } catch (err) {
    if (isAbortError(err)) throw err;
    onProgress("配置平面", "改以示意平面圖");
    const annotation = await inventLayout(config, sceneMeta);
    return {
      mapImage: renderSchematic(annotation.objects, scene.name, sceneMeta.mapAspect),
      mapSource: "schematic",
      mapPrompt: promptText,
    };
  }
}

export async function annotateSceneMap(
  config: ClientApiConfig,
  image: string,
): Promise<MapAnnotation> {
  const annotation = await annotateMap(config, image);
  if (annotation.objects.length === 0) {
    throw new Error("視覺模型沒有標到物件");
  }
  return annotation;
}

export async function placeSceneActors(
  config: ClientApiConfig,
  game: Game,
  scene: Scene,
  annotation: MapAnnotation,
  mapPrompt?: string,
): Promise<{ playerPos: Vec2; npcs: Character[] }> {
  const sceneMeta = sceneMetaFrom(
    scene,
    mapPrompt ?? scene.mapPrompt ?? [scene.name, scene.summary].filter(Boolean).join(". "),
  );
  const placed = await placeActors(
    config,
    sceneMeta,
    annotation,
    game.player.name,
    scene.npcs.map((n) => ({
      name: n.name,
      bio: n.bio,
      appearance: n.appearance,
      clothing: n.clothing,
      age: n.age,
      gender: n.gender,
      race: n.race,
      personality: n.personality,
      status: n.status,
      goal: n.goal,
      where: n.status || n.alias || n.name,
      trueName: n.trueName,
      known: n.known,
      alias: n.alias,
      tags: n.tags,
    })),
  );
  return {
    playerPos: placed.player,
    npcs: scene.npcs.map((n, i) => {
      const match =
        placed.npcs.find((p) => p.name === n.name || p.name === n.trueName) ??
        placed.npcs[i];
      const x = match?.x ?? n.x;
      const y = match?.y ?? n.y;
      return {
        ...n,
        x,
        y,
        facing: facingToward({ x, y }, placed.player),
        status: match?.status || n.status,
      };
    }),
  };
}

export function composeRebuiltScene(
  scene: Scene,
  painted: PaintedMap,
  annotation: MapAnnotation,
  placed: { playerPos: Vec2; npcs: Character[] },
): Scene {
  return {
    ...scene,
    mapImage: painted.mapImage,
    mapSource: painted.mapSource,
    mapPrompt: painted.mapPrompt,
    walkableNotes: annotation.walkableNotes,
    objects: annotation.objects,
    npcs: placed.npcs,
    playerPos: placed.playerPos,
  };
}

export function applyPortrait(game: Game, npcId: string, image: string): Game {
  const scenes: Game["scenes"] = {};
  let name = "";
  for (const [id, s] of Object.entries(game.scenes)) {
    const hit = s.npcs.find((n) => n.id === npcId);
    if (hit) name = trueNameOf(hit);
    scenes[id] = s;
  }
  if (!name) return game;
  for (const [id, s] of Object.entries(scenes)) {
    scenes[id] = {
      ...s,
      npcs: s.npcs.map((n) =>
        n.id === npcId || trueNameOf(n) === name || n.name === name
          ? { ...n, portrait: image }
          : n,
      ),
    };
  }
  return { ...game, updatedAt: Date.now(), scenes };
}

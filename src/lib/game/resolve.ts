import { canHear, dist, nearestObject, pointToward, proximity, RANGE, sceneAspect } from "./distance";
import { publicName } from "./identity";
import { facingOf, sightOn, SIGHT_LABEL } from "./vision";
import type {
  AttemptCard,
  AttemptKind,
  ActorVerdict,
  Character,
  DramaNpc,
  DramaPlayer,
  DramaResult,
  MapAspect,
  NpcThought,
  PhysicsGate,
  Scene,
  Vec2,
} from "./types";

export const MAX_STEP_PLAYER = 28;
export const MAX_STEP_NPC = 18;

const VERDICTS: ActorVerdict[] = ["success", "fail", "mixed", "blocked"];

export function classifyIntent(text: string): AttemptKind {
  const s = text;
  if (/離開|出口|出門|離去|往外|走出去|離開此地/.test(s)) return "leave";
  if (/偷|拿起|搜|摸走|扒|碰觸|坐下|坐到|伸手|拾起/.test(s)) return "touch";
  if (/交談|說話|開口|問他|問她|喊|叫住|招呼|搭話|低語|對他說|對她說/.test(s)) return "talk";
  if (/看清|觀察|注視|張望|打量|凝視|回頭看/.test(s)) return "look";
  if (/走|靠近|過去|前往|移動|跟上/.test(s)) return "move";
  return "other";
}

export function stepToward(from: Vec2, to: Vec2, maxStep: number, aspect: MapAspect): Vec2 {
  const d = dist(from, to, aspect);
  if (d <= maxStep + 0.01) return { x: to.x, y: to.y };
  return pointToward(from, to, d - maxStep, aspect);
}

export function nearExit(pos: Vec2, scene: Scene, aspect: MapAspect): boolean {
  return scene.objects.some((o) => {
    const doorish = o.kind === "door" || /門|出口|巷口|樓梯|大門/.test(o.label);
    return doorish && dist(pos, o, aspect) <= RANGE.near;
  });
}

function crowdSizeNearby(pos: Vec2, scene: Scene, aspect: MapAspect): number {
  let n = 0;
  for (const c of scene.crowds ?? []) {
    if (dist(pos, c, aspect) <= RANGE.sameArea) n += c.size;
  }
  return n;
}

function gatePlayer(kind: AttemptKind, d: number, scene: Scene, pos: Vec2, aspect: MapAspect): {
  physics: PhysicsGate;
  physicsNote: string;
  difficulty: AttemptCard["difficulty"];
} {
  const prox = proximity(d);
  const noisy = crowdSizeNearby(pos, scene, aspect) >= 6;
  if (kind === "leave") {
    if (nearExit(pos, scene, aspect)) {
      return { physics: "allowed", physicsNote: "已在出口附近，可以離開", difficulty: "normal" };
    }
    return {
      physics: "partial",
      physicsNote: "還沒走到出口。本拍只能走近門／出口，不可切換場景。",
      difficulty: "normal",
    };
  }
  if (kind === "touch") {
    if (prox === "adjacent" || d <= RANGE.near) {
      return { physics: "allowed", physicsNote: "伸手可及", difficulty: noisy ? "hard" : "normal" };
    }
    if (prox === "near") {
      return { physics: "partial", physicsNote: "要先再靠近才能碰到", difficulty: "hard" };
    }
    return { physics: "blocked", physicsNote: "距離太遠，伸手不到。可先走過去。", difficulty: "hard" };
  }
  if (kind === "talk") {
    if (d <= RANGE.near) {
      return { physics: "allowed", physicsNote: "近處，對方聽得見正常說話", difficulty: noisy ? "hard" : "easy" };
    }
    if (d <= RANGE.sameArea) {
      return {
        physics: "partial",
        physicsNote: "同區須揚聲，細節聽不清。走近才算面對面。",
        difficulty: "hard",
      };
    }
    return {
      physics: "blocked",
      physicsNote: "太遠，話傳不過去。對方頂多看到口型。可先走過去。",
      difficulty: "hard",
    };
  }
  if (kind === "look") {
    if (d <= RANGE.sameArea) {
      return { physics: "allowed", physicsNote: "中距離以內，可看清面容", difficulty: "easy" };
    }
    return { physics: "partial", physicsNote: "太遠只見人影，看不清五官", difficulty: "normal" };
  }
  return { physics: "allowed", physicsNote: "移動／其他行動，由距離與可行走約束", difficulty: "normal" };
}

function gateNpc(thought: NpcThought, npc: Character, player: Vec2, aspect: MapAspect): {
  physics: PhysicsGate;
  physicsNote: string;
  difficulty: AttemptCard["difficulty"];
} {
  const kind = classifyIntent(thought.intent || thought.thought || "");
  const d = dist(npc, player, aspect);
  const hear = canHear(npc, player, aspect);
  const see = sightOn(npc, player, aspect);
  if (kind === "talk" && !hear) {
    return {
      physics: "blocked",
      physicsNote: "聽不見玩家在說什麼，不能當成對答。可自己做原本的事。",
      difficulty: "hard",
    };
  }
  if (kind === "look" && see === "blind" && !/轉|望|回頭/.test(thought.intent)) {
    return {
      physics: "blocked",
      physicsNote: "玩家在死角。除非打算寫了轉身張望，否則看不見。",
      difficulty: "hard",
    };
  }
  if (kind === "touch" && d > RANGE.near) {
    return { physics: "partial", physicsNote: "離玩家還不夠近，這拍碰不到。", difficulty: "hard" };
  }
  return {
    physics: hear || see !== "blind" ? "allowed" : "partial",
    physicsNote: hear
      ? see === "blind"
        ? "聽得見，但眼前看不見玩家"
        : "察覺得到玩家"
      : "離玩家較遠，只過自己的日子",
    difficulty: "normal",
  };
}

export function buildAttemptCards(
  scene: Scene,
  action: string,
  thoughts: NpcThought[],
): AttemptCard[] {
  const aspect = sceneAspect(scene);
  const playerPos = scene.playerPos;
  const focusNpc = scene.npcs.reduce<Character | null>((best, n) => {
    if (!best) return n;
    return dist(playerPos, n, aspect) < dist(playerPos, best, aspect) ? n : best;
  }, null);
  const focusObj = nearestObject(playerPos, scene.objects, aspect);
  const focus = focusNpc ?? focusObj;
  const focusDist = focus ? dist(playerPos, focus, aspect) : 0;
  const parsed = action.match(/距離\s*(\d+)/);
  const d = parsed ? Number(parsed[1]) : focusDist;
  const kind = classifyIntent(action);
  const gated = gatePlayer(kind, d, scene, playerPos, aspect);
  const playerCard: AttemptCard = {
    id: "player",
    role: "player",
    name: "玩家",
    intent: action,
    kind,
    from: { ...playerPos },
    proximity: proximity(d),
    hearPlayer: true,
    seePlayer: "seen",
    physics: gated.physics,
    physicsNote: gated.physicsNote,
    difficulty: gated.difficulty,
  };

  const npcCards: AttemptCard[] = scene.npcs.map((npc) => {
    const thought =
      thoughts.find((t) => t.id === npc.id) ??
      thoughts.find((t) => t.name === npc.name);
    const intent = thought?.intent || npc.status || "觀望";
    const g = thought
      ? gateNpc(thought, npc, playerPos, aspect)
      : {
          physics: "allowed" as const,
          physicsNote: "無內心，維持原狀",
          difficulty: "easy" as const,
        };
    const dNpc = dist(npc, playerPos, aspect);
    return {
      id: npc.id,
      role: "npc",
      name: publicName(npc),
      intent,
      kind: classifyIntent(intent),
      from: { x: npc.x, y: npc.y },
      proximity: proximity(dNpc),
      hearPlayer: canHear(npc, playerPos, aspect),
      seePlayer: sightOn(npc, playerPos, aspect),
      physics: g.physics,
      physicsNote: g.physicsNote,
      difficulty: g.difficulty,
    };
  });

  return [playerCard, ...npcCards];
}

export function formatAttemptCards(cards: AttemptCard[]): string {
  return cards
    .map((c) => {
      const who = c.role === "player" ? "玩家" : `NPC ${c.name}`;
      return [
        `${who}（${c.id}）`,
        `意圖：${c.intent}`,
        `類型：${c.kind}  物理：${c.physics}  難度：${c.difficulty}`,
        `說明：${c.physicsNote}`,
        `起點：(${c.from.x.toFixed(0)},${c.from.y.toFixed(0)}) 距焦點 ${c.proximity}`,
        c.role === "npc"
          ? `此刻聽見玩家：${c.hearPlayer ? "是" : "否"} ｜ 看見玩家：${SIGHT_LABEL[c.seePlayer]}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function asVerdict(v: unknown, fallback: ActorVerdict): ActorVerdict {
  return typeof v === "string" && VERDICTS.includes(v as ActorVerdict)
    ? (v as ActorVerdict)
    : fallback;
}

function clampCoord(n: number): number {
  return Math.min(94, Math.max(6, n));
}

export function fallbackDrama(scene: Scene, cards: AttemptCard[]): DramaResult {
  const player = cards.find((c) => c.role === "player");
  return {
    player: {
      x: player?.from.x ?? scene.playerPos.x,
      y: player?.from.y ?? scene.playerPos.y,
      verdict: player?.physics === "blocked" ? "blocked" : "mixed",
      did: player?.physicsNote || "停在原地",
      speech: "",
    },
    npcs: scene.npcs.map((npc) => {
      const card = cards.find((c) => c.id === npc.id);
      return {
        id: npc.id,
        x: npc.x,
        y: npc.y,
        facing: npc.facing,
        status: npc.status,
        speech: "",
        verdict: card?.physics === "blocked" ? "blocked" : "mixed",
        did: card?.physicsNote || card?.intent || "維持原狀",
      };
    }),
    suggested: [],
    sceneChange: null,
  };
}

export function enforceResolution(
  raw: DramaResult,
  cards: AttemptCard[],
  scene: Scene,
): DramaResult {
  const aspect = sceneAspect(scene);
  const playerCard = cards.find((c) => c.role === "player");
  const from = playerCard?.from ?? scene.playerPos;
  let playerDest = {
    x: clampCoord(Number(raw.player?.x) || from.x),
    y: clampCoord(Number(raw.player?.y) || from.y),
  };
  playerDest = stepToward(from, playerDest, MAX_STEP_PLAYER, aspect);

  const npcById = new Map(scene.npcs.map((n) => [n.id, n]));
  const npcs: DramaNpc[] = scene.npcs.map((npc) => {
    const card = cards.find((c) => c.id === npc.id);
    const u = (raw.npcs ?? []).find((n) => n.id === npc.id);
    const origin = { x: npc.x, y: npc.y };
    let dest = {
      x: clampCoord(Number(u?.x) || npc.x),
      y: clampCoord(Number(u?.y) || npc.y),
    };
    dest = stepToward(origin, dest, MAX_STEP_NPC, aspect);
    let verdict = asVerdict(u?.verdict, card?.physics === "blocked" ? "blocked" : "mixed");
    let speech = typeof u?.speech === "string" ? u.speech.trim() : "";
    let did = typeof u?.did === "string" && u.did.trim() ? u.did.trim() : card?.intent || npc.status;
    if (card?.physics === "blocked") {
      dest = origin;
      if (card.kind === "talk" || card.kind === "look") {
        speech = "";
        verdict = "blocked";
        did = card.physicsNote;
      }
    }
    const lookIntent = /轉|望|回頭|看/.test(card?.intent ?? "");
    let facing = u?.facing != null ? Number(u.facing) : npc.facing;
    if (card?.seePlayer === "blind" && !lookIntent && typeof facing === "number") {
      facing = facingOf(npc);
    }
    return {
      id: npc.id,
      x: dest.x,
      y: dest.y,
      facing,
      status: typeof u?.status === "string" && u.status.trim() ? u.status : npc.status,
      speech,
      known: u?.known,
      name: u?.name,
      verdict,
      did,
    };
  });

  const playerSpeech = typeof raw.player?.speech === "string" ? raw.player.speech.trim() : "";
  let playerVerdict = asVerdict(
    raw.player?.verdict,
    playerCard?.physics === "blocked" ? "blocked" : "mixed",
  );
  let playerDid =
    typeof raw.player?.did === "string" && raw.player.did.trim()
      ? raw.player.did.trim()
      : playerCard?.physicsNote || "行動";

  if (playerCard?.kind === "touch") {
    const reach = [...npcs, ...scene.objects].some(
      (t) => dist(playerDest, t, aspect) <= RANGE.near,
    );
    if (!reach) {
      playerVerdict = "fail";
      playerDid = "伸手不到，沒碰到。";
    }
  }

  const ignoreLoot =
    playerCard?.kind === "touch" && playerVerdict !== "success" && playerVerdict !== "mixed";

  const heard = (npc: { x: number; y: number }) => canHear(playerDest, npc, aspect);
  for (const npc of npcs) {
    if (playerSpeech && !heard(npc)) {
      npc.speech = "";
      if (npc.verdict === "success") npc.verdict = "mixed";
      if (!(npc.did ?? "").includes("沒聽見")) {
        npc.did = `${npc.did ?? ""}（沒聽見玩家的話）`;
      }
    }
    const body = npcById.get(npc.id);
    if (body && npc.known === true && body.known !== true) {
      const see = sightOn({ ...body, x: npc.x, y: npc.y, facing: npc.facing }, playerDest, aspect);
      if (see === "blind" && !heard(npc)) {
        npc.known = body.known;
        npc.name = undefined;
      }
    }
  }

  let sceneChange = raw.sceneChange ?? null;
  const destNearExit = nearExit(playerDest, scene, aspect);
  const mayLeave =
    playerCard?.kind === "leave" && (playerCard.physics === "allowed" || destNearExit);
  if (sceneChange && sceneChange.name && !mayLeave) {
    sceneChange = null;
    if (playerCard?.kind === "leave") {
      playerDid = `${playerDid} 還沒到出口。`;
    }
  }

  const player: DramaPlayer = {
    x: playerDest.x,
    y: playerDest.y,
    verdict: playerCard?.physics === "blocked" && playerCard.kind !== "move" ? "blocked" : playerVerdict,
    did: playerDid,
    speech: playerSpeech,
    status: typeof raw.player?.status === "string" ? raw.player.status : undefined,
  };

  return {
    player,
    npcs,
    inventory: ignoreLoot ? undefined : raw.inventory,
    flags: raw.flags,
    suggested: raw.suggested,
    crowds: raw.crowds,
    spawnFromCrowd: raw.spawnFromCrowd,
    sceneChange,
  };
}

export function formatResolutionSheet(sheet: DramaResult, cards: AttemptCard[]): string {
  const playerCard = cards.find((c) => c.role === "player");
  const lines = [
    `玩家裁定：${sheet.player.verdict} ＠(${sheet.player.x.toFixed(0)},${sheet.player.y.toFixed(0)})`,
    `做了：${sheet.player.did}`,
    sheet.player.speech ? `玩家開口：「${sheet.player.speech}」` : "玩家本拍沒有新的對白摘錄。",
    playerCard ? `物理：${playerCard.physics}｜${playerCard.physicsNote}` : "",
    "",
  ];
  for (const npc of sheet.npcs) {
    const card = cards.find((c) => c.id === npc.id);
    lines.push(
      `${card?.name ?? npc.id}（${npc.id}）${npc.verdict} ＠(${npc.x.toFixed(0)},${npc.y.toFixed(0)}) facing ${npc.facing ?? "—"}`,
    );
    lines.push(`做了：${npc.did}`);
    lines.push(npc.speech ? `開口：「${npc.speech}」` : "沒開口。");
    if (card) {
      lines.push(`物理：${card.physics}｜${card.physicsNote}；聽見玩家起點：${card.hearPlayer ? "是" : "否"}`);
    }
    lines.push("");
  }
  if (sheet.sceneChange?.name) {
    lines.push(`切換場景：${sheet.sceneChange.name}（${sheet.sceneChange.reason ?? ""}）`);
  } else {
    lines.push("不切換場景。");
  }
  return lines.filter(Boolean).join("\n");
}

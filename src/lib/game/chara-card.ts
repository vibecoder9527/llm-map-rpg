import { uid } from "@/lib/utils";
import type { LoreEntry } from "./types";

export type ParsedCard = {
  spec: "chara_card_v2" | "chara_card_v3" | "chara_card_v1";
  name: string;
  description: string;
  personality: string;
  scenario: string;
  firstMes: string;
  systemPrompt: string;
  creator: string;
  lore: Array<{ title: string; content: string; keys: string[]; constant: boolean }>;
};

export type StoredCard = {
  id: string;
  name: string;
  spec: ParsedCard["spec"];
  creator: string;
  createdAt: number;
  warnings: string[];
  parsed: ParsedCard;
  raw: unknown;
};

function asStr(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function bookEntries(raw: unknown): unknown[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.entries)) return o.entries;
  if (Array.isArray(raw)) return raw;
  return [];
}

export function parseCharacterCard(raw: unknown): ParsedCard {
  if (!raw || typeof raw !== "object") throw new Error("不是有效的角色卡");
  const root = raw as Record<string, unknown>;
  const specRaw = asStr(root.spec);
  const nested =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;
  const src = nested ?? root;
  const spec: ParsedCard["spec"] =
    specRaw === "chara_card_v3" || asStr(nested?.spec) === "chara_card_v3"
      ? "chara_card_v3"
      : specRaw === "chara_card_v2" || nested
        ? "chara_card_v2"
        : "chara_card_v1";

  const name = asStr(src.name || root.name).trim();
  if (!name) throw new Error("角色卡沒有名稱");

  const lore = bookEntries(src.character_book ?? nested?.character_book)
    .map((item) => {
      const e = item as Record<string, unknown>;
      if (e.enabled === false) return null;
      const title = asStr(e.comment || e.name || (Array.isArray(e.keys) ? e.keys[0] : "") || "條目");
      const content = asStr(e.content);
      if (!content.trim()) return null;
      return {
        title,
        content,
        keys: Array.isArray(e.keys) ? e.keys.map((k) => String(k)) : [],
        constant: e.constant === true,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return {
    spec,
    name,
    description: asStr(src.description),
    personality: asStr(src.personality),
    scenario: asStr(src.scenario),
    firstMes: asStr(src.first_mes),
    systemPrompt: asStr(src.system_prompt),
    creator: asStr(src.creator || root.creator),
    lore,
  };
}

export function fillCardVars(text: string, cardName: string, playerName: string): string {
  return text
    .replace(/\{\{char\}\}/gi, cardName)
    .replace(/\{\{user\}\}/gi, playerName || "你")
    .replace(/\{\{Char\}\}/g, cardName)
    .replace(/\{\{User\}\}/g, playerName || "你");
}

export function cardToLore(card: ParsedCard): LoreEntry[] {
  return card.lore.map((e) => ({
    id: uid("lb"),
    title: e.title,
    content: e.content,
    tags: e.keys.slice(0, 8),
    constant: e.constant,
  }));
}

export function cardToWizardFields(card: ParsedCard): {
  theme: string;
  playerHint: string;
  extra: string;
} {
  const parts = [
    `【角色卡：${card.name}】${card.spec}`,
    card.description && `【說明】\n${card.description}`,
    card.personality && `【性格】\n${card.personality}`,
    card.scenario && `【場景】\n${card.scenario}`,
    card.systemPrompt && `【系統指示】\n${card.systemPrompt}`,
    card.firstMes && `【開場白，請讓初始場景對得上】\n${card.firstMes.slice(0, 1800)}`,
    "Lorebook 會另外帶入角色卡條目，開場 NPC 與場所必須符合角色卡，不要另起一套世界。",
  ].filter(Boolean);
  const userLine =
    card.description
      .split("\n")
      .map((l) => l.trim())
      .find((l) => /\{\{user\}\}|玩家|Player/.test(l)) ?? "";
  return {
    theme: card.name,
    playerHint: fillCardVars(userLine || card.description.slice(0, 240), card.name, ""),
    extra: parts.join("\n\n"),
  };
}

function u32(b: Uint8Array, i: number): number {
  return ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
}

function readPngTextChunks(bytes: Uint8Array): Record<string, string> {
  const out: Record<string, string> = {};
  if (bytes.length < 8) return out;
  let i = 8;
  while (i + 12 <= bytes.length) {
    const len = u32(bytes, i);
    const type = String.fromCharCode(bytes[i + 4]!, bytes[i + 5]!, bytes[i + 6]!, bytes[i + 7]!);
    const start = i + 8;
    const end = start + len;
    if (end + 4 > bytes.length) break;
    if (type === "tEXt" || type === "iTXt") {
      const data = bytes.subarray(start, end);
      const z = data.indexOf(0);
      if (z > 0) {
        const key = new TextDecoder().decode(data.subarray(0, z));
        let rest = data.subarray(z + 1);
        if (type === "iTXt") {
          // compression flag, method, lang, trans, text
          if (rest.length >= 2 && rest[0] === 0) {
            let p = 2;
            const skip = () => {
              const n = rest.indexOf(0, p);
              p = n < 0 ? rest.length : n + 1;
            };
            skip();
            skip();
            rest = rest.subarray(p);
          } else {
            rest = new Uint8Array();
          }
        }
        if (rest.length) out[key] = new TextDecoder().decode(rest);
      }
    }
    if (type === "IEND") break;
    i = end + 4;
  }
  return out;
}

export async function parseCardFile(file: File): Promise<{ parsed: ParsedCard; raw: unknown; warnings: string[] }> {
  const name = file.name.toLowerCase();
  let raw: unknown;
  if (name.endsWith(".png") || file.type === "image/png") {
    const buf = new Uint8Array(await file.arrayBuffer());
    const chunks = readPngTextChunks(buf);
    const b64 = chunks.ccv3 || chunks.chara;
    if (!b64) throw new Error("這張 PNG 裡沒有角色卡資料（需要 chara / ccv3 區塊）");
    const json = atob(b64.replace(/\s+/g, ""));
    raw = JSON.parse(json);
  } else {
    const text = await file.text();
    raw = JSON.parse(text);
  }
  const parsed = parseCharacterCard(raw);
  return { parsed, raw, warnings: [] };
}
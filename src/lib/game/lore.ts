import { trueNameOf } from "./identity";
import type { Character, LoreEntry } from "./types";

const WEAK_TAGS = new Set(["場所", "天氣", "人物", "謎", "物件", "世界", "常識"]);

function compact(s: string): string {
  return s.replace(/\s+/g, "");
}

function keysFromTitle(title: string): string[] {
  const t = compact(title);
  const out = new Set<string>();
  if (t.length >= 2) out.add(t);
  if (t.length >= 4) {
    for (let i = 0; i <= t.length - 2; i++) out.add(t.slice(i, i + 2));
  }
  return [...out];
}

function npcBlob(npc: Character): string {
  return compact(
    [
      trueNameOf(npc),
      npc.name,
      npc.alias,
      npc.bio,
      npc.personality,
      npc.goal,
      npc.status,
      npc.memory,
      npc.appearance,
      npc.clothing,
      npc.gender,
      npc.race,
      ...(npc.tags ?? []),
    ]
      .filter(Boolean)
      .join(""),
  );
}

function namesOf(npc: Character): string[] {
  return [trueNameOf(npc), npc.name, npc.alias || ""]
    .map((s) => compact(s))
    .filter((s) => s.length >= 2);
}

export function scoreLoreForNpc(entry: LoreEntry, npc: Character): number {
  const blob = npcBlob(npc);
  if (!blob) return 0;
  let s = 0;
  const names = namesOf(npc);
  const title = compact(entry.title);
  const content = compact(entry.content);

  for (const nm of names) {
    if (title.includes(nm) || nm.includes(title)) s += 8;
    if (content.includes(nm)) s += 5;
    for (const tag of entry.tags) {
      const t = compact(tag);
      if (t && (t.includes(nm) || nm.includes(t))) s += 6;
    }
  }

  for (const tag of entry.tags) {
    const t = compact(tag);
    if (t.length < 2) continue;
    if (WEAK_TAGS.has(tag)) continue;
    if (blob.includes(t) || t.length >= 2 && names.some((n) => n.includes(t))) s += 4;
  }

  for (const key of keysFromTitle(entry.title)) {
    if (key.length >= 2 && blob.includes(key)) s += key.length >= 4 ? 5 : 2;
  }

  for (const nt of npc.tags ?? []) {
    const n = compact(nt);
    if (n.length < 2) continue;
    if (title.includes(n) || n.includes(title)) s += 7;
    if (content.includes(n)) s += 4;
    for (const tag of entry.tags) {
      const t = compact(tag);
      if (t && (t === n || t.includes(n) || n.includes(t))) s += 8;
    }
  }

  return s;
}

export function loreForNpc(
  npc: Character,
  lorebook: LoreEntry[],
  limit = 4,
): LoreEntry[] {
  const constants = lorebook.filter((e) => e.constant).slice(0, 8);
  const seen = new Set(constants.map((e) => e.id));
  const matched = lorebook
    .filter((e) => !seen.has(e.id))
    .map((e) => ({ e, s: scoreLoreForNpc(e, npc) }))
    .filter((x) => x.s >= 3)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.e);
  return [...constants, ...matched];
}

export function formatNpcLore(entries: LoreEntry[]): string {
  if (!entries.length) return "相關條目：（無）";
  return `相關條目：\n${entries
    .map((e) => `  · ${e.constant ? "〔常駐〕" : ""}${e.title}：${e.content}`)
    .join("\n")}`;
}

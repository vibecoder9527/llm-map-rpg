import type { Character } from "./types";

/** GM-canonical name. */
export function trueNameOf(c: Character): string {
  const t = (c.trueName || c.name || "").trim();
  return t || "無名";
}

export function isKnown(c: Character): boolean {
  if (c.role === "player") return true;
  if (typeof c.known === "boolean") return c.known;
  return true;
}

/** First clause of a look string, short enough for a map label. */
export function shortLook(text: string): string {
  const cut = text
    .replace(/\s+/g, "")
    .split(/[，。；、,.]/)[0]
    ?.trim() ?? "";
  if (!cut) return "";
  if (/的(人|男子|女子|女人|男人|老人|少年|少女|女孩|男孩)$/.test(cut)) {
    return cut.slice(0, 12);
  }
  const stem = cut.slice(0, 8);
  return `${stem}的人`;
}

export function lookAlias(c: Pick<Character, "alias" | "clothing" | "appearance">): string {
  const alias = (c.alias || "").trim();
  if (alias) return alias;
  return shortLook(c.clothing || "") || shortLook(c.appearance || "") || "陌生人";
}

/** What the player currently calls this person. */
export function publicName(c: Character): string {
  if (c.role === "player") return c.name || "你";
  if (isKnown(c)) {
    return (c.name || c.trueName || "").trim() || lookAlias(c);
  }
  return lookAlias(c);
}

export function lookCard(
  c: Pick<Character, "appearance" | "clothing" | "age" | "gender" | "race" | "personality">,
): string {
  const age = c.age && c.age > 0 ? `${c.age}歲` : "（未寫）";
  const gender = c.gender?.trim() || "（未寫）";
  const race = c.race?.trim() || "（未寫）";
  const personality = c.personality?.trim() || "（未寫）";
  return `年齡：${age} 性別：${gender} 種族：${race}\n性格：${personality}\n外觀（五官與身體）：${c.appearance || "（未寫）"}\n衣著（全身）：${c.clothing || "（未寫）"}`;
}

export function identityLine(c: Character): string {
  const trueN = trueNameOf(c);
  const seen = publicName(c);
  if (c.role === "player") return trueN;
  if (isKnown(c)) {
    return seen === trueN ? `${trueN}（已識出）` : `${seen}／真名 ${trueN}（已識出）`;
  }
  return `真名 ${trueN} ｜ 玩家所見「${seen}」｜尚未識出`;
}

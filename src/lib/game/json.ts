import { stripThink } from "@/lib/ai/think";

function sliceBalancedJson(raw: string): string | null {
  const firstObj = raw.indexOf("{");
  const firstArr = raw.indexOf("[");
  let start = -1;
  if (firstObj < 0) start = firstArr;
  else if (firstArr < 0) start = firstObj;
  else start = Math.min(firstObj, firstArr);
  if (start < 0) return null;
  const open = raw[start]!;
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < raw.length; i++) {
    const c = raw[i]!;
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === "\"") inString = false;
      continue;
    }
    if (c === "\"") {
      inString = true;
      continue;
    }
    if (c === open) depth += 1;
    else if (c === close) {
      depth -= 1;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

/** Models often put raw newlines / tabs inside JSON strings. */
function repairJsonStrings(src: string): string {
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (inString) {
      if (escape) {
        out += c;
        escape = false;
        continue;
      }
      if (c === "\\") {
        out += c;
        escape = true;
        continue;
      }
      if (c === "\"") {
        inString = false;
        out += c;
        continue;
      }
      if (c === "\n") {
        out += "\\n";
        continue;
      }
      if (c === "\r") {
        out += "\\r";
        continue;
      }
      if (c === "\t") {
        out += "\\t";
        continue;
      }
      const code = c.charCodeAt(0);
      if (code < 32) {
        out += `\\u${code.toString(16).padStart(4, "0")}`;
        continue;
      }
      out += c;
      continue;
    }
    if (c === "\"") inString = true;
    out += c;
  }
  return out;
}

function stripTrailingCommas(src: string): string {
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (inString) {
      out += c;
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === "\"") inString = false;
      continue;
    }
    if (c === "\"") {
      inString = true;
      out += c;
      continue;
    }
    if (c === ",") {
      let j = i + 1;
      while (j < src.length && /[ \t\r\n]/.test(src[j]!)) j += 1;
      if (src[j] === "}" || src[j] === "]") continue;
    }
    out += c;
  }
  return out;
}

export function extractJson<T>(text: string): T {
  const stripped = stripThink(text.trim());
  const candidates = [stripped, text.trim()].filter(Boolean);
  let last = "模型沒有回傳 JSON";
  for (const trimmed of candidates) {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = (fenced?.[1] ?? trimmed).trim();
    const slice = sliceBalancedJson(raw);
    if (!slice) {
      last = "模型沒有回傳 JSON";
      continue;
    }
    const attempts = [slice, repairJsonStrings(slice), stripTrailingCommas(repairJsonStrings(slice))];
    for (const body of attempts) {
      try {
        return JSON.parse(body) as T;
      } catch {
        last = "模型 JSON 無法解析";
      }
    }
  }
  throw new Error(last);
}

export function asNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

/** Models often write the two characters \\n instead of a real newline. */
export function softenProse(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, "\t")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
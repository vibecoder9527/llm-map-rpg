export type SpeechBeat =
  | { kind: "prose"; text: string }
  | { kind: "speech"; who: string; text: string; self: boolean };

const SPEAKER_TAIL =
  /([^\s「」\n，。；]{1,16})\s*(?:說道|問道|答道|喊道|說著|低聲說|小聲說|說|道|問|答)?[：:]\s*$/;

function isSelf(who: string, playerName: string): boolean {
  const w = who.trim();
  if (!w) return false;
  if (w === "你" || w === "我" || w === playerName) return true;
  if (w.startsWith("你")) return true;
  return false;
}

function guessWho(prefix: string, names: string[]): string {
  const short = prefix.match(SPEAKER_TAIL);
  if (short?.[1]) return short[1];
  const tail = prefix.slice(-48);
  let hit = "";
  for (const n of names) {
    if (n && tail.includes(n)) hit = n;
  }
  return hit || "有人";
}

/** Split GM narrative into scene prose vs quoted speech. */
export function splitNarrative(
  text: string,
  playerName: string,
  names: string[] = [],
): SpeechBeat[] {
  const src = text.replace(/\r\n/g, "\n");
  const beats: SpeechBeat[] = [];
  const re = /「([^」]*)」/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const known = [...names, playerName, "你"].filter(Boolean);

  while ((m = re.exec(src))) {
    const before = src.slice(last, m.index);
    const who = guessWho(before, known);
    const cut = before.match(SPEAKER_TAIL);
    const prose = (cut ? before.slice(0, before.length - cut[0].length) : before)
      .replace(/[，、]\s*$/, "")
      .trim();
    if (prose) beats.push({ kind: "prose", text: prose });
    const line = m[1]!.trim();
    if (line) {
      beats.push({
        kind: "speech",
        who,
        text: line,
        self: isSelf(who, playerName),
      });
    }
    last = m.index + m[0].length;
  }
  const rest = src.slice(last).trim();
  if (rest) beats.push({ kind: "prose", text: rest });
  return beats.length ? beats : [{ kind: "prose", text: src }];
}

export function recentSpokenLines(
  log: { kind: string; text: string }[],
  limit = 8,
): string[] {
  const out: string[] = [];
  for (const l of log.slice(-8)) {
    if (l.kind !== "narrative") continue;
    const re = /「([^」]+)」/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(l.text))) {
      const t = m[1]!.trim();
      if (t.length >= 2) out.push(t);
    }
  }
  return [...new Set(out)].slice(-limit);
}

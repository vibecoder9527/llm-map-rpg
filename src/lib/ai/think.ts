/** Detect and strip model-specific thinking wrappers. Keep generic tags for all models. */

export function isGemma4Model(model?: string): boolean {
  return /gemma[-_.]?4/i.test(model ?? "");
}

export function looksLikeGemma4Output(text: string): boolean {
  return /<\|channel>thought\b|<channel\|>|<\|turn>|<turn\|>|<\|think\|>/.test(text);
}

function stripGemma4Channels(text: string): string {
  let s = text.replace(/<\|channel>thought\b[^\n]*\n?[\s\S]*?<channel\|>/gi, "\n");
  const close = "<channel|>";
  const lastClose = s.lastIndexOf(close);
  if (lastClose >= 0) {
    const after = s
      .slice(lastClose + close.length)
      .replace(/<turn\|>/g, "")
      .trim();
    if (after) s = after;
  }
  s = s.replace(/<\|turn>\w+\n/g, "");
  s = s.replace(/<turn\|>/g, "");
  s = s.replace(/<\|think\|>/g, "");
  return s;
}

export function stripThink(text: string): string {
  let s = text.replace(/\r\n/g, "\n");
  s = s.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, "");
  s = s.replace(/<thought\b[^>]*>[\s\S]*?<\/thought>/gi, "");
  s = s.replace(/<reasoning\b[^>]*>[\s\S]*?<\/reasoning>/gi, "");
  if (looksLikeGemma4Output(s)) s = stripGemma4Channels(s);
  return s.trim();
}

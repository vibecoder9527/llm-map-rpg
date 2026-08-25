import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ClientApiConfig, EndpointConfig, EndpointKind } from "./config";
import { clampMaxTokens, DEFAULT_MAX_TOKENS } from "./config";
import type { MapAspect } from "@/lib/game/types";
import { isGemma4Model, stripThink } from "@/lib/ai/think";

const endpointSchema = z.object({
  mode: z.enum(["platform", "custom"]),
  baseUrl: z.string(),
  apiKey: z.string(),
  model: z.string(),
});

const cfgSchema = z.object({
  text: endpointSchema,
  vision: endpointSchema,
  map: endpointSchema,
  portrait: endpointSchema,
  maxTokens: z.number().optional(),
});

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

type Resolved = { baseUrl: string; apiKey: string };

function resolveEndpoint(ep: EndpointConfig): Resolved {
  if (ep.mode === "platform") {
    const apiKey = process.env.XAI_API_KEY ?? "";
    if (!apiKey) {
      throw new Error("這個環境沒有平台 AI 金鑰，請改連自備的 OpenAI Compatible API。");
    }
    return { baseUrl: "https://api.x.ai/v1", apiKey };
  }
  const baseUrl = ep.baseUrl.replace(/\/+$/, "");
  const apiKey = ep.apiKey.trim();
  if (!baseUrl || !apiKey) {
    throw new Error("請填寫 API 位址與金鑰。");
  }
  return { baseUrl, apiKey };
}

function pick(cfg: Record<EndpointKind, EndpointConfig>, kind: EndpointKind): EndpointConfig {
  return cfg[kind];
}

function isXai(baseUrl: string): boolean {
  return baseUrl.includes("x.ai");
}

function supportsJsonObject(baseUrl: string): boolean {
  const u = baseUrl.toLowerCase();
  return (
    u.includes("x.ai") ||
    u.includes("openai.com") ||
    u.includes("openrouter.ai") ||
    u.includes("googleapis.com")
  );
}

function withLocalChatOpts(
  baseUrl: string,
  body: Record<string, unknown>,
  thinking: boolean,
): Record<string, unknown> {
  if (supportsJsonObject(baseUrl)) return body;
  if (!isGemma4Model(String(body.model ?? ""))) return body;
  body.chat_template_kwargs = { enable_thinking: thinking };
  body.enable_thinking = thinking;
  return body;
}

function pieceText(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    return v
      .map((p) => {
        if (typeof p === "string") return p;
        if (p && typeof p === "object") {
          const o = p as Record<string, unknown>;
          return pieceText(o.text ?? o.content ?? o.output_text ?? o.thinking ?? "");
        }
        return "";
      })
      .join("");
  }
  return "";
}

function collectChatText(json: {
  choices?: Array<{
    text?: unknown;
    message?: Record<string, unknown>;
  }>;
}): string {
  const choice = json.choices?.[0];
  const msg = choice?.message ?? {};
  const content = [pieceText(msg.content), pieceText(choice?.text)]
    .filter((s) => s.trim())
    .join("\n");
  const reasoning = [
    pieceText(msg.reasoning_content),
    pieceText(msg.reasoning),
    pieceText(msg.reasoning_text),
  ]
    .filter((s) => s.trim())
    .join("\n");
  const fromContent = stripThink(content);
  if (fromContent) return fromContent;
  const fromReason = stripThink(reasoning);
  if (fromReason) return fromReason;
  return stripThink([content, reasoning].filter(Boolean).join("\n")) || content || reasoning;
}

async function chatRaw(
  resolved: Resolved,
  body: Record<string, unknown>,
): Promise<{ text: string; finishReason: string }> {
  const res = await fetch(`${resolved.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolved.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) {
    throw new Error(`文字模型錯誤：${await readError(res)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{
      text?: unknown;
      finish_reason?: string;
      message?: Record<string, unknown>;
    }>;
  };
  const text = collectChatText(json);
  const finishReason = json.choices?.[0]?.finish_reason ?? "";
  if (text.trim()) return { text, finishReason };
  const keys = Object.keys(json.choices?.[0]?.message ?? {});
  throw new Error(
    `文字模型回傳空白（finish_reason=${finishReason || "unknown"}${keys.length ? `，欄位 ${keys.join(", ")}` : ""}）`,
  );
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const json = JSON.parse(text) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof json.error === "string") return json.error;
    if (json.error?.message) return json.error.message;
    if (json.message) return json.message;
  } catch {
    /* ignore */
  }
  return text.slice(0, 280) || `HTTP ${res.status}`;
}

async function probeEndpoint(ep: EndpointConfig, kind: EndpointKind): Promise<string> {
  const resolved = resolveEndpoint(ep);
  if (!ep.model.trim()) throw new Error("請填寫模型名稱。");

  if (kind === "map" || kind === "portrait") {
    const res = await fetch(`${resolved.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${resolved.apiKey}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) {
      return `${ep.model} · 端點可連`;
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`金鑰被拒：${await readError(res)}`);
    }
    return `${ep.model} · HTTP ${res.status}（端點有回應；繪圖時才會真正呼叫）`;
  }

  const text = await chatRaw(resolved, {
    model: ep.model,
    messages: [{ role: "user", content: "Reply with the single word pong." }],
    max_tokens: 16,
    temperature: 0,
  });
  return text.text.trim().slice(0, 80) || ep.model;
}

export const probeAi = createServerFn({ method: "POST" })
  .validator(
    z.object({
      config: cfgSchema,
      kind: z.enum(["text", "vision", "map", "portrait"]),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const reply = await probeEndpoint(pick(data.config, data.kind), data.kind);
      return { ok: true as const, reply };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "連線失敗",
      };
    }
  });

export const hasPlatformKey = createServerFn({ method: "GET" }).handler(
  async () => ({ available: Boolean(process.env.XAI_API_KEY) }),
);

export const chatText = createServerFn({ method: "POST" })
  .validator(
    z.object({
      config: cfgSchema,
      messages: z.array(messageSchema),
      maxTokens: z.number().optional(),
      temperature: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ep = data.config.text;
    const resolved = resolveEndpoint(ep);
    const out = await chatRaw(
      resolved,
      withLocalChatOpts(
        resolved.baseUrl,
        {
          model: ep.model,
          messages: data.messages,
          max_tokens: data.maxTokens ?? clampMaxTokens(data.config.maxTokens ?? DEFAULT_MAX_TOKENS),
          temperature: data.temperature ?? 0.2,
        },
        false,
      ),
    );
    return out;
  });

export const chatJson = createServerFn({ method: "POST" })
  .validator(
    z.object({
      config: cfgSchema,
      messages: z.array(messageSchema),
      maxTokens: z.number().optional(),
      temperature: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ep = data.config.text;
    const resolved = resolveEndpoint(ep);
    const body: Record<string, unknown> = {
      model: ep.model,
      messages: data.messages,
      max_tokens: data.maxTokens ?? clampMaxTokens(data.config.maxTokens ?? DEFAULT_MAX_TOKENS),
      temperature: data.temperature ?? 0.7,
    };
    if (supportsJsonObject(resolved.baseUrl)) {
      body.response_format = { type: "json_object" };
    }
    return chatRaw(resolved, withLocalChatOpts(resolved.baseUrl, body, false));
  });

export const visionJson = createServerFn({ method: "POST" })
  .validator(
    z.object({
      config: cfgSchema,
      prompt: z.string(),
      image: z.string(),
      maxTokens: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ep = data.config.vision;
    const resolved = resolveEndpoint(ep);
    const body: Record<string, unknown> = {
      model: ep.model,
      max_tokens: data.maxTokens ?? clampMaxTokens(data.config.maxTokens ?? DEFAULT_MAX_TOKENS),
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: data.prompt },
            {
              type: "image_url",
              image_url: { url: data.image, detail: "high" },
            },
          ],
        },
      ],
    };
    if (supportsJsonObject(resolved.baseUrl)) {
      body.response_format = { type: "json_object" };
    }
    return chatRaw(resolved, withLocalChatOpts(resolved.baseUrl, body, false));
  });

export const generateMapImage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      config: cfgSchema,
      prompt: z.string(),
      aspect: z.enum(["1:1", "2:3", "3:2", "16:9", "9:16"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const image = await generateImageRaw(
      data.config.map,
      data.prompt,
      data.aspect ?? "1:1",
    );
    return { image };
  });

export const generatePortraitImage = createServerFn({ method: "POST" })
  .validator(z.object({ config: cfgSchema, prompt: z.string() }))
  .handler(async ({ data }) => {
    const image = await generateImageRaw(data.config.portrait, data.prompt, "2:3");
    return { image };
  });

function openaiSize(aspect: MapAspect): string {
  switch (aspect) {
    case "16:9":
      return "1792x1024";
    case "9:16":
      return "1024x1792";
    case "3:2":
      return "1536x1024";
    case "2:3":
      return "1024x1536";
    default:
      return "1024x1024";
  }
}

async function generateImageRaw(
  ep: EndpointConfig,
  prompt: string,
  aspect: MapAspect,
): Promise<string> {
  const resolved = resolveEndpoint(ep);
  const xai = isXai(resolved.baseUrl);
  const body: Record<string, unknown> = {
    model: ep.model,
    prompt,
    n: 1,
    response_format: "b64_json",
  };
  if (xai) {
    body.aspect_ratio = aspect;
    body.resolution = "1k";
  } else {
    body.size = openaiSize(aspect);
  }

  const res = await fetch(`${resolved.baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolved.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    throw new Error(`圖像生成失敗：${await readError(res)}`);
  }
  const json = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const item = json.data?.[0];
  if (item?.b64_json) {
    return `data:image/png;base64,${item.b64_json}`;
  }
  if (item?.url) {
    const imgRes = await fetch(item.url, { signal: AbortSignal.timeout(60_000) });
    if (!imgRes.ok) throw new Error("無法下載生成的圖像");
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const mime = imgRes.headers.get("content-type") || "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }
  throw new Error("圖片模型沒有回傳圖像");
}

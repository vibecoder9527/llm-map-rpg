export type ApiMode = "platform" | "custom";
export type EndpointKind = "text" | "vision" | "map" | "portrait";

export type EndpointConfig = {
  mode: ApiMode;
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type ClientApiConfig = {
  text: EndpointConfig;
  vision: EndpointConfig;
  map: EndpointConfig;
  portrait: EndpointConfig;
  /** Completion budget for text / vision. */
  maxTokens: number;
};

export const DEFAULT_MAX_TOKENS = 8192;
export const MIN_MAX_TOKENS = 256;
export const MAX_MAX_TOKENS = 32768;

export const ENDPOINT_META: Record<
  EndpointKind,
  { title: string; blurb: string }
> = {
  text: { title: "文字", blurb: "推演回合、生成世界與主題。" },
  vision: { title: "視覺", blurb: "讀取上傳的地圖，標出物件與可行走範圍。" },
  map: { title: "地圖繪圖", blurb: "依場景描述繪製俯視地圖。" },
  portrait: { title: "角色繪圖", blurb: "人物全身立繪，無場景背景。" },
};

const XAI_CHAT: EndpointConfig = {
  mode: "platform",
  baseUrl: "https://api.x.ai/v1",
  apiKey: "",
  model: "grok-4.5",
};

const XAI_IMAGE: EndpointConfig = {
  mode: "platform",
  baseUrl: "https://api.x.ai/v1",
  apiKey: "",
  model: "grok-imagine-image-quality",
};

export const DEFAULT_API: ClientApiConfig = {
  text: { ...XAI_CHAT },
  vision: { ...XAI_CHAT },
  map: { ...XAI_IMAGE },
  portrait: { ...XAI_IMAGE },
  maxTokens: DEFAULT_MAX_TOKENS,
};

export type EndpointPreset = {
  id: string;
  label: string;
  patch: Partial<EndpointConfig>;
};

const CHAT_PRESETS: EndpointPreset[] = [
  {
    id: "xai",
    label: "xAI 平台",
    patch: { mode: "platform", baseUrl: "https://api.x.ai/v1", model: "grok-4.5" },
  },
  {
    id: "xai-key",
    label: "xAI 自備",
    patch: { mode: "custom", baseUrl: "https://api.x.ai/v1", model: "grok-4.5" },
  },
  {
    id: "openai",
    label: "OpenAI",
    patch: {
      mode: "custom",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4.1",
    },
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    patch: {
      mode: "custom",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "openai/gpt-4.1-mini",
    },
  },
];

const IMAGE_PRESETS: EndpointPreset[] = [
  {
    id: "xai",
    label: "xAI 平台",
    patch: {
      mode: "platform",
      baseUrl: "https://api.x.ai/v1",
      model: "grok-imagine-image-quality",
    },
  },
  {
    id: "xai-key",
    label: "xAI 自備",
    patch: {
      mode: "custom",
      baseUrl: "https://api.x.ai/v1",
      model: "grok-imagine-image-quality",
    },
  },
  {
    id: "openai",
    label: "OpenAI",
    patch: {
      mode: "custom",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-image-1",
    },
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    patch: {
      mode: "custom",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "google/gemini-2.5-flash-image",
    },
  },
];

export const ENDPOINT_PRESETS: Record<EndpointKind, EndpointPreset[]> = {
  text: CHAT_PRESETS,
  vision: CHAT_PRESETS,
  map: IMAGE_PRESETS,
  portrait: IMAGE_PRESETS,
};

export function clampMaxTokens(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return DEFAULT_MAX_TOKENS;
  return Math.min(MAX_MAX_TOKENS, Math.max(MIN_MAX_TOKENS, Math.round(v)));
}

export function copyConnection(from: EndpointConfig, model: string): EndpointConfig {
  return {
    mode: from.mode,
    baseUrl: from.baseUrl,
    apiKey: from.apiKey,
    model,
  };
}

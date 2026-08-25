import {
  clampMaxTokens,
  DEFAULT_API,
  DEFAULT_MAX_TOKENS,
  type ApiMode,
  type ClientApiConfig,
  type EndpointConfig,
} from "./config";

const KEY = "tuzhi:api";

function endpoint(
  raw: Partial<EndpointConfig> | undefined,
  fallback: EndpointConfig,
): EndpointConfig {
  return {
    mode: raw?.mode === "custom" || raw?.mode === "platform" ? raw.mode : fallback.mode,
    baseUrl: typeof raw?.baseUrl === "string" ? raw.baseUrl : fallback.baseUrl,
    apiKey: typeof raw?.apiKey === "string" ? raw.apiKey : fallback.apiKey,
    model: typeof raw?.model === "string" && raw.model.trim() ? raw.model : fallback.model,
  };
}

type Legacy = Partial<ClientApiConfig> & {
  mode?: ApiMode;
  baseUrl?: string;
  apiKey?: string;
  textModel?: string;
  visionModel?: string;
  imageModel?: string;
  image?: EndpointConfig;
};

export function migrateApiSettings(raw: unknown): ClientApiConfig {
  if (!raw || typeof raw !== "object") return structuredClone(DEFAULT_API);
  const parsed = raw as Legacy;
  const drawn = parsed.map ?? parsed.image ?? parsed.portrait;
  if (parsed.text && parsed.vision && drawn) {
    const map = endpoint(parsed.map ?? parsed.image, DEFAULT_API.map);
    return {
      text: endpoint(parsed.text, DEFAULT_API.text),
      vision: endpoint(parsed.vision, DEFAULT_API.vision),
      map,
      portrait: endpoint(parsed.portrait ?? parsed.map ?? parsed.image, DEFAULT_API.portrait),
      maxTokens: clampMaxTokens(parsed.maxTokens ?? DEFAULT_MAX_TOKENS),
    };
  }
  const shared: EndpointConfig = {
    mode: parsed.mode === "custom" ? "custom" : "platform",
    baseUrl: parsed.baseUrl ?? DEFAULT_API.text.baseUrl,
    apiKey: parsed.apiKey ?? "",
    model: DEFAULT_API.text.model,
  };
  const imageModel = parsed.imageModel ?? DEFAULT_API.map.model;
  return {
    text: { ...shared, model: parsed.textModel ?? DEFAULT_API.text.model },
    vision: { ...shared, model: parsed.visionModel ?? DEFAULT_API.vision.model },
    map: { ...shared, model: imageModel },
    portrait: { ...shared, model: imageModel },
    maxTokens: DEFAULT_MAX_TOKENS,
  };
}

export function loadApiSettings(): ClientApiConfig {
  if (typeof window === "undefined") return structuredClone(DEFAULT_API);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_API);
    return migrateApiSettings(JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_API);
  }
}

export function saveApiSettings(cfg: ClientApiConfig): void {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

export function endpointReady(ep: EndpointConfig): boolean {
  if (ep.mode === "platform") return ep.model.trim().length > 0;
  return (
    ep.apiKey.trim().length > 0 &&
    ep.baseUrl.trim().length > 0 &&
    ep.model.trim().length > 0
  );
}

export function hasUsableKey(cfg: ClientApiConfig): boolean {
  return endpointReady(cfg.text);
}

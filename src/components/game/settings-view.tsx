import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, Loader, Map, MessageSquare, ScanEye, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  copyConnection,
  DEFAULT_API,
  DEFAULT_MAX_TOKENS,
  ENDPOINT_META,
  ENDPOINT_PRESETS,
  MAX_MAX_TOKENS,
  MIN_MAX_TOKENS,
  clampMaxTokens,
  type ClientApiConfig,
  type EndpointConfig,
  type EndpointKind,
} from "@/lib/ai/config";
import { loadApiSettings, saveApiSettings } from "@/lib/ai/settings";
import { hasPlatformKey, probeAi } from "@/lib/ai/functions";

const ICONS: Record<EndpointKind, typeof MessageSquare> = {
  text: MessageSquare,
  vision: ScanEye,
  map: Map,
  portrait: UserRound,
};

export function SettingsView() {
  const [cfg, setCfg] = useState<ClientApiConfig>(() => structuredClone(DEFAULT_API));
  const [platform, setPlatform] = useState<boolean | null>(null);
  const [testing, setTesting] = useState<EndpointKind | null>(null);

  useEffect(() => {
    setCfg(loadApiSettings());
    hasPlatformKey().then((r) => setPlatform(r.available));
  }, []);

  function patchEndpoint(kind: EndpointKind, p: Partial<EndpointConfig>) {
    setCfg((c) => ({ ...c, [kind]: { ...c[kind], ...p } }));
  }

  function persist() {
    saveApiSettings(cfg);
    toast.success("四份連線設定已儲存");
  }

  async function test(kind: EndpointKind) {
    setTesting(kind);
    try {
      const res = await probeAi({ data: { config: cfg, kind } });
      if (res.ok) toast.success(`${ENDPOINT_META[kind].title}連線成功：${res.reply}`);
      else toast.error(res.error);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "測試失敗");
    } finally {
      setTesting(null);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-5 py-10 pb-24">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6">
        <Link to="/">
          <ArrowLeft className="size-4" />
          返回
        </Link>
      </Button>
      <h1 className="font-display text-3xl">連線設定</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        文字、視覺、地圖繪圖、角色繪圖各用一份獨立連線設定檔，可指向不同端點與金鑰。OpenAI Compatible。
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {platform === false
          ? "這個環境沒有平台金鑰，平台模式會失敗，請改自備 API。"
          : platform
            ? "平台 xAI 金鑰可用，可在任一設定檔選「xAI 平台」。"
            : "正在確認平台金鑰…"}
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">文字生成上限</CardTitle>
          <CardDescription>
            送給文字／視覺模型的 max_tokens。Gemma 等會先思考的模型，太低會截斷 JSON。預設 {DEFAULT_MAX_TOKENS}。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field label="max_tokens">
            <Input
              type="number"
              min={MIN_MAX_TOKENS}
              max={MAX_MAX_TOKENS}
              value={cfg.maxTokens ?? DEFAULT_MAX_TOKENS}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  maxTokens: clampMaxTokens(e.target.value),
                }))
              }
            />
          </Field>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-6">
        {(["text", "vision", "map", "portrait"] as EndpointKind[]).map((kind) => (
          <EndpointCard
            key={kind}
            kind={kind}
            value={cfg[kind]}
            testing={testing === kind}
            copyLabel={
              kind === "vision" ? "複製文字連線" : kind === "portrait" ? "複製地圖繪圖連線" : undefined
            }
            onChange={(p) => patchEndpoint(kind, p)}
            onCopyFrom={
              kind === "vision"
                ? () => patchEndpoint(kind, copyConnection(cfg.text, cfg[kind].model))
                : kind === "portrait"
                  ? () => patchEndpoint(kind, copyConnection(cfg.map, cfg[kind].model))
                  : undefined
            }
            onTest={() => void test(kind)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-8 border-t border-border bg-background/95 px-5 py-4 backdrop-blur-sm">
        <Button type="button" className="w-full sm:w-auto" onClick={persist}>
          <Check className="size-4" />
          儲存四份設定檔
        </Button>
      </div>
    </main>
  );
}

function EndpointCard({
  kind,
  value,
  testing,
  copyLabel,
  onChange,
  onCopyFrom,
  onTest,
}: {
  kind: EndpointKind;
  value: EndpointConfig;
  testing: boolean;
  copyLabel?: string;
  onChange: (p: Partial<EndpointConfig>) => void;
  onCopyFrom?: () => void;
  onTest: () => void;
}) {
  const meta = ENDPOINT_META[kind];
  const Icon = ICONS[kind];
  const presets = ENDPOINT_PRESETS[kind];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-muted-foreground" />
          {meta.title}連線設定檔
        </CardTitle>
        <CardDescription>{meta.blurb}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const active =
              value.mode === p.patch.mode &&
              value.baseUrl === p.patch.baseUrl &&
              value.model === p.patch.model;
            return (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => onChange(p.patch)}
              >
                {p.label}
              </Button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="模式">
            <select
              className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 text-sm"
              value={value.mode}
              onChange={(e) => onChange({ mode: e.target.value as EndpointConfig["mode"] })}
            >
              <option value="platform">平台 xAI</option>
              <option value="custom">自備金鑰</option>
            </select>
          </Field>
          <Field label="Base URL">
            <Input
              value={value.baseUrl}
              onChange={(e) => onChange({ baseUrl: e.target.value })}
              placeholder="https://api.x.ai/v1"
              disabled={value.mode === "platform"}
            />
          </Field>
        </div>
        {value.mode === "custom" && (
          <Field label="API Key">
            <Input
              type="password"
              autoComplete="off"
              value={value.apiKey}
              onChange={(e) => onChange({ apiKey: e.target.value })}
              placeholder="sk-…"
            />
          </Field>
        )}
        <Field label="模型">
          <Input
            value={value.model}
            onChange={(e) => onChange({ model: e.target.value })}
            placeholder={
              kind === "map" || kind === "portrait" ? "grok-imagine-image-quality" : "grok-4.5"
            }
          />
        </Field>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onTest} disabled={testing}>
            {testing ? <Loader className="size-4 animate-spin" /> : null}
            測試這份連線
          </Button>
          {copyLabel && onCopyFrom ? (
            <Button type="button" variant="ghost" onClick={onCopyFrom}>
              <Copy className="size-4" />
              {copyLabel}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

const STAGES = [
  "整理提示詞",
  "撰寫世界",
  "繪製地圖",
  "辨識場景物件",
  "配置平面",
  "安置人物",
  "在場的人在想",
  "推演這一回",
  "進入新場景",
];

export function GeneratingOverlay({
  stage,
  detail,
  onCancel,
  onRetry,
}: {
  stage: string;
  detail?: string;
  onCancel?: () => void;
  onRetry?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          {onRetry ? null : <Loader className="size-4 animate-spin" />}
          {onRetry ? "需要重試" : "進行中"}
        </div>
        <p className="font-display text-xl">{stage}</p>
        {detail ? (
          <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        ) : (
          <div className="mt-3 h-3 w-2/3 rounded-sm shimmer" />
        )}
        <ul className="mt-6 space-y-1.5 text-xs text-muted-foreground">
          {STAGES.filter((s) =>
            [
              "整理提示詞",
              "撰寫世界",
              "繪製地圖",
              "辨識場景物件",
              "安置人物",
              "在場的人在想",
              "推演這一回",
              "進入新場景",
            ].includes(s),
          ).map((s) => (
            <li
              key={s}
              className={s === stage ? "text-foreground" : "opacity-40"}
            >
              {s === stage ? "●" : "○"} {s}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-2">
          {onRetry ? (
            <Button type="button" className="w-full" onClick={onRetry}>
              重新嘗試
            </Button>
          ) : null}
          {onCancel ? (
            <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
              終止
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
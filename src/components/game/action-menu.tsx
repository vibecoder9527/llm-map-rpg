import { useEffect, useState } from "react";
import { Loader, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  buildChoices,
  customIntent,
  targetDetail,
  targetTitle,
  type ActionTarget,
} from "@/lib/game/actions";
import { dist, isFarLook, PROXIMITY_LABEL, proximity } from "@/lib/game/distance";
import { publicName } from "@/lib/game/identity";
import type { Character, MapAspect, Vec2 } from "@/lib/game/types";

const SILHOUETTE = "/portraits/silhouette.jpg";

type Props = {
  target: ActionTarget | null;
  playerPos: Vec2;
  mapAspect?: MapAspect;
  revealingIds?: Record<string, boolean>;
  onClose: () => void;
  onAct: (text: string) => void;
  onRetarget?: (target: ActionTarget) => void;
  onNeedPortrait?: (npc: Character) => void;
  onRegenPortrait?: (npc: Character) => void;
};

export function ActionMenu({
  target,
  playerPos,
  mapAspect = "1:1",
  revealingIds,
  onClose,
  onAct,
  onRetarget,
  onNeedPortrait,
  onRegenPortrait,
}: Props) {
  const [intent, setIntent] = useState("");

  useEffect(() => {
    setIntent("");
  }, [target]);

  useEffect(() => {
    if (target?.kind === "npc") onNeedPortrait?.(target.npc);
  }, [target, onNeedPortrait]);

  const choices = target ? buildChoices(target, playerPos, mapAspect) : [];
  const meta = target ? targetDetail(target, playerPos, mapAspect) : null;
  const isNpc = target?.kind === "npc";

  function pick(id: string, text: string) {
    if (!target) return;
    if (id === "use-near" && target.kind === "floor" && target.near) {
      onRetarget?.({ kind: "object", obj: target.near });
      return;
    }
    if (!text.trim()) return;
    onAct(text);
  }

  function submitCustom() {
    if (!target || !intent.trim()) return;
    onAct(customIntent(target, playerPos, intent, mapAspect));
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          "overflow-hidden [&>button]:z-20 [&>button]:rounded-sm [&>button]:bg-background/80 [&>button]:p-1",
          isNpc
            ? "w-[calc(100%-1.5rem)] max-w-5xl p-0 sm:w-auto"
            : "max-w-sm overflow-y-auto p-5",
        )}
      >
        {target && meta && (
          <div
            className={cn(
              isNpc &&
                "flex max-h-[90vh] flex-col sm:flex-row sm:items-start",
            )}
          >
            {target.kind === "npc" ? (
              <PortraitPane
                npc={target.npc}
                playerPos={playerPos}
                mapAspect={mapAspect}
                revealing={Boolean(revealingIds?.[target.npc.id])}
                onRegen={
                  onRegenPortrait
                    ? () => onRegenPortrait(target.npc)
                    : undefined
                }
              />
            ) : null}
            <div
              className={cn(
                isNpc &&
                  "flex min-h-0 w-full flex-1 flex-col overflow-y-auto p-5 sm:h-[min(85vh,42rem)] sm:w-[min(28rem,36vw)] sm:shrink-0",
              )}
            >
              <DialogHeader>
                <DialogTitle>{targetTitle(target)}</DialogTitle>
                <DialogDescription>{meta.line}</DialogDescription>
              </DialogHeader>
              <p className="mt-3 text-xs text-muted-foreground">
                選一項，或自己寫意圖。成敗看距離與情境。
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {choices.map((c, i) => (
                  <div key={c.id}>
                    {c.group && c.group !== choices[i - 1]?.group ? (
                      <p className="mb-1.5 mt-2 text-[11px] tracking-wide text-muted-foreground first:mt-0">
                        {c.group}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      variant={c.primary ? "default" : "outline"}
                      className="h-auto min-h-11 w-full justify-between whitespace-normal py-2.5 text-left"
                      onClick={() => pick(c.id, c.text)}
                    >
                      <span>{c.label}</span>
                      {c.hint ? (
                        <span className="ml-2 shrink-0 text-[11px] font-normal text-muted-foreground">
                          {c.hint}
                        </span>
                      ) : null}
                    </Button>
                  </div>
                ))}
              </div>
              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitCustom();
                }}
              >
                <Input
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="自己寫要做什麼"
                  autoComplete="off"
                />
                <Button type="submit" disabled={!intent.trim()}>
                  做
                </Button>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PortraitPane({
  npc,
  playerPos,
  mapAspect,
  revealing,
  onRegen,
}: {
  npc: Character;
  playerPos: Vec2;
  mapAspect: MapAspect;
  revealing: boolean;
  onRegen?: () => void;
}) {
  const d = dist(playerPos, npc, mapAspect);
  const far = isFarLook(d);
  const hasFace = Boolean(npc.portrait);
  const showPhoto = hasFace;
  const dim = hasFace && far;
  const prox = proximity(d);
  const canRegen = Boolean(onRegen) && (hasFace || !far);
  const caption = revealing
    ? "正在看清面容…"
    : hasFace && far
      ? "認得這個人，可看不清楚"
      : hasFace
        ? PROXIMITY_LABEL[prox]
        : far
          ? "太遠，只見人影"
          : "還沒看清這個人的臉";

  return (
    <aside className="relative aspect-[2/3] h-auto w-full max-h-[42vh] shrink-0 overflow-hidden bg-[#101012] sm:h-[min(85vh,42rem)] sm:w-auto sm:max-h-none sm:border-r sm:border-border">
      <img
        src={showPhoto ? npc.portrait : SILHOUETTE}
        alt={showPhoto ? publicName(npc) : "看不清的人影"}
        className={cn(
          "absolute inset-0 size-full object-cover object-top",
          dim && "brightness-[0.42] contrast-125 saturate-50",
        )}
      />
      {dim && <div className="absolute inset-0 bg-background/40" aria-hidden />}
      {revealing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/50">
          <Loader className="size-5 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">繪製全身</p>
        </div>
      )}
      {canRegen && !revealing ? (
        <button
          type="button"
          aria-label="重新生成立繪"
          title="重新生成立繪"
          className="absolute left-2 top-2 z-10 flex size-8 items-center justify-center rounded-md border border-border bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground"
          onClick={onRegen}
        >
          <RefreshCw className="size-3.5" />
        </button>
      ) : null}
      <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent px-3 pb-3 pt-10 text-xs text-muted-foreground">
        {caption}
      </p>
    </aside>
  );
}

export type { ActionTarget };

import { MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { splitNarrative } from "@/lib/game/speech";
import type { LogEntry } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export function LogTranscript({
  entries,
  playerName,
  names,
  onRegenLast,
  regenDisabled,
}: {
  entries: LogEntry[];
  playerName: string;
  names: string[];
  onRegenLast?: () => void;
  regenDisabled?: boolean;
}) {
  const lastActionAt = (() => {
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i]!.kind === "action") return i;
    }
    return -1;
  })();

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, i) => {
        const lastOfTurn = lastActionAt >= 0 && i === entries.length - 1 && i >= lastActionAt;
        return (
        <article key={entry.id}>
          {entry.kind === "action" ? (
            <div className="flex flex-col items-end gap-0.5">
              <span className="px-1 text-[10px] text-muted-foreground">你</span>
              <p className="max-w-[90%] rounded-2xl rounded-tr-md border border-border bg-background px-3 py-1.5 text-xs leading-relaxed text-muted-foreground">
                <MapPin className="mr-1 inline size-3" />
                {entry.text}
              </p>
            </div>
          ) : entry.kind === "system" ? (
            <p className="text-center text-[11px] tracking-wide text-muted-foreground">
              {entry.text}
            </p>
          ) : (
            <NarrativeBeats text={entry.text} playerName={playerName} names={names} />
          )}
          {lastOfTurn && onRegenLast ? (
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-[11px] text-muted-foreground"
                disabled={regenDisabled}
                onClick={onRegenLast}
              >
                <RefreshCw className="size-3" />
                重算這一回
              </Button>
            </div>
          ) : null}
        </article>
        );
      })}
    </div>
  );
}

function NarrativeBeats({
  text,
  playerName,
  names,
}: {
  text: string;
  playerName: string;
  names: string[];
}) {
  const beats = splitNarrative(text, playerName, names);
  return (
    <div className="flex flex-col gap-2">
      {beats.map((b, i) =>
        b.kind === "prose" ? (
          <p key={i} className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {b.text}
          </p>
        ) : (
          <div
            key={i}
            className={cn("flex flex-col gap-0.5", b.self ? "items-end" : "items-start")}
          >
            <span className="px-1 text-[10px] text-muted-foreground">
              {b.self ? "你" : b.who}
            </span>
            <p
              className={cn(
                "max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed",
                b.self
                  ? "rounded-tr-md bg-foreground text-background"
                  : "rounded-tl-md bg-secondary",
              )}
            >
              {b.text}
            </p>
          </div>
        ),
      )}
    </div>
  );
}
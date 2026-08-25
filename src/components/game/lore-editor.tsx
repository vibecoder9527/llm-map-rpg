import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LoreEntry } from "@/lib/game/types";

export function LoreEditor({
  entry,
  onChange,
  onDelete,
}: {
  entry: LoreEntry;
  onChange: (e: LoreEntry) => void;
  onDelete?: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-1">
        <Input
          value={entry.title}
          onChange={(e) => onChange({ ...entry, title: e.target.value })}
          className="h-9 border-0 bg-transparent px-1"
          placeholder="條目標題"
        />
        {onDelete ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="刪除條目"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
      <Textarea
        rows={3}
        value={entry.content}
        onChange={(e) => onChange({ ...entry, content: e.target.value })}
        className="mt-1 min-h-16 border-0 bg-transparent px-1"
        placeholder="條目內容"
      />
      <Input
        value={entry.tags.join("、")}
        onChange={(e) =>
          onChange({
            ...entry,
            tags: e.target.value
              .split(/[、,，]/)
              .map((t) => t.trim())
              .filter(Boolean),
          })
        }
        placeholder="標籤：相關 NPC 名、教團、神祇"
        className="mt-1 h-8 border-0 bg-transparent px-1 text-xs text-muted-foreground"
      />
      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={Boolean(entry.constant)}
          onChange={(e) => onChange({ ...entry, constant: e.target.checked })}
        />
        常駐（所有 NPC 思考時都知道，用於世界觀）
      </label>
    </div>
  );
}

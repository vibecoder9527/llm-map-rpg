import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteGame, importGameFile, listSaves, loadGame } from "@/lib/game/save";
import { useGameStore } from "@/lib/game/store";
import type { SaveMeta } from "@/lib/game/types";

export function SavesView() {
  const [list, setList] = useState<SaveMeta[]>([]);
  const nav = useNavigate();
  const setGame = useGameStore((s) => s.setGame);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setList(await listSaves());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function open(id: string) {
    const game = await loadGame(id);
    if (!game) {
      toast.error("讀檔失敗");
      return;
    }
    await setGame(game, false);
    await nav({ to: "/play" });
  }

  async function remove(id: string) {
    await deleteGame(id);
    toast.success("已刪除");
    await refresh();
  }

  async function onImport(file: File) {
    try {
      const game = await importGameFile(file);
      await setGame(game, false);
      toast.success("已匯入");
      await nav({ to: "/play" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "匯入失敗");
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-5 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6">
        <Link to="/">
          <ArrowLeft className="size-4" />
          返回
        </Link>
      </Button>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">遊玩紀錄</h1>
          <p className="mt-2 text-sm text-muted-foreground">存在這台裝置裡。</p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" />
            匯入
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground">還沒有存檔。</p>
        )}
        {list.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => void open(s.id)}
              >
                <p className="font-display text-base">{s.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {s.playerName} · {s.sceneName} · 第 {s.turnCount} 回
                </p>
                <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                  {new Date(s.updatedAt).toLocaleString("zh-TW")}
                </p>
              </button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="刪除"
                onClick={() => void remove(s.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

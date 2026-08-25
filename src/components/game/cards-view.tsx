import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Contact, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseCardFile, type StoredCard } from "@/lib/game/chara-card";
import { deleteCard, listCards, saveCard } from "@/lib/game/save";
import { uid } from "@/lib/utils";

export function CardsView() {
  const [list, setList] = useState<StoredCard[]>([]);
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setList(await listCards());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onImport(file: File) {
    try {
      const { parsed, raw, warnings } = await parseCardFile(file);
      const card: StoredCard = {
        id: uid("card"),
        name: parsed.name,
        spec: parsed.spec,
        creator: parsed.creator,
        createdAt: Date.now(),
        warnings,
        parsed,
        raw,
      };
      await saveCard(card);
      await refresh();
      if (warnings.length) {
        toast.warning(`已匯入「${parsed.name}」，並將未滿 18 歲的描述改為成年`);
      } else {
        toast.success(`已匯入「${parsed.name}」`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "匯入失敗");
    }
  }

  async function remove(id: string) {
    await deleteCard(id);
    toast.success("已刪除");
    await refresh();
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
          <h1 className="font-display text-3xl">角色卡</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            匯入 Character Card V2／V3（JSON 或 PNG）。選一張來開新局，Lorebook 與開場會帶進去。可互動角色必須年滿 18 歲。
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,image/png,.json,.png"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            匯入
          </Button>
        </div>
      </div>
      <ul className="mt-8 flex flex-col gap-3">
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">還沒有卡片。匯入 JSON 或 SillyTavern PNG。</p>
        ) : (
          list.map((c) => (
            <li key={c.id}>
              <Card>
                <CardContent className="flex flex-col gap-3 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{c.name}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {c.spec}
                        {c.creator ? ` · ${c.creator}` : ""} · lore {c.parsed.lore.length}
                      </p>
                    </div>
                    <Contact className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  {c.warnings.length > 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      已改寫未滿 18 歲的年齡描述（{c.warnings.length} 處）
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => void nav({ to: "/new", search: { card: c.id } })}
                    >
                      用這張開始
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="刪除"
                      onClick={() => void remove(c.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}

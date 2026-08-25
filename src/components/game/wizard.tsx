import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Loader, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneratingOverlay } from "@/components/game/generating";
import { LoreEditor } from "@/components/game/lore-editor";
import { StyleFields } from "@/components/game/style-fields";
import { loadApiSettings } from "@/lib/ai/settings";
import { generateTheme, generateWorld, isAbortError, makeSample, setWorkSignal, startNewGame } from "@/lib/game/engine";
import { cardToLore, cardToWizardFields, fillCardVars, type StoredCard } from "@/lib/game/chara-card";
import { loadCard } from "@/lib/game/save";
import { useGameStore } from "@/lib/game/store";
import { uid } from "@/lib/utils";
import type { WorldDraft } from "@/lib/game/types";

const THEME_CHIPS = [
  "雨夜港口的密語",
  "山城書院的禁書",
  "末班車上的無名站",
  "茶樓後巷的帳房",
  "廢園夜市的燈籠",
  "深林哨站的無線電",
];

export function Wizard({ sample, cardId }: { sample?: boolean; cardId?: string }) {
  const nav = useNavigate();
  const { setGame, setBusy, beginBusy, cancelBusy, busy, setError, error } = useGameStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [theme, setTheme] = useState("");
  const [mapStyle, setMapStyle] = useState("");
  const [portraitStyle, setPortraitStyle] = useState("");
  const [playerHint, setPlayerHint] = useState("");
  const [extra, setExtra] = useState("");
  const [card, setCard] = useState<StoredCard | null>(null);
  const [draft, setDraft] = useState<(WorldDraft & { title: string }) | null>(
    null,
  );
  const [spin, setSpin] = useState<string | null>(null);

  useEffect(() => {
    if (!cardId) return;
    void loadCard(cardId).then((c) => {
      if (!c) {
        toast.error("找不到這張角色卡");
        return;
      }
      setCard(c);
      const fields = cardToWizardFields(c.parsed);
      setTheme(fields.theme);
      setPlayerHint(fields.playerHint);
      setExtra(fields.extra);
    });
  }, [cardId]);

  async function runSample() {
    const game = makeSample();
    await setGame(game);
    await nav({ to: "/play" });
  }

  async function inventTheme() {
    setSpin("theme");
    try {
      const res = await generateTheme(loadApiSettings(), theme);
      setTheme(res.theme);
      if (res.pitch) setExtra((e) => e || res.pitch);
      toast.success("已擬題");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "擬題失敗");
    } finally {
      setSpin(null);
    }
  }

  async function buildWorld() {
    if (!theme.trim()) {
      toast.error("先寫主題，或按擬題");
      return;
    }
    const ac = beginBusy("撰寫世界", theme);
    setWorkSignal(ac.signal);
    try {
      const world = await generateWorld(loadApiSettings(), {
        theme,
        playerHint,
        extra,
        imageStyle: mapStyle,
        mapStyle,
        portraitStyle,
        seedLore: card ? cardToLore(card.parsed) : undefined,
        adultsOnly: Boolean(card),
      });
      if (ac.signal.aborted) return;
      setDraft(world);
      setMapStyle(world.mapStyle ?? world.imageStyle ?? "");
      setPortraitStyle(world.portraitStyle ?? world.imageStyle ?? "");
      setStep(2);
    } catch (err) {
      if (isAbortError(err)) {
        toast.message("已終止");
        return;
      }
      const msg = err instanceof Error ? err.message : "生成失敗";
      setError(msg);
      toast.error(msg);
    } finally {
      setWorkSignal(null);
      if (!ac.signal.aborted) setBusy(null);
    }
  }

  async function enter() {
    if (!draft) return;
    const ac = beginBusy("繪製地圖");
    setWorkSignal(ac.signal);
    try {
      const opening = card?.parsed.firstMes
        ? fillCardVars(card.parsed.firstMes, card.parsed.name, draft.player.name)
        : undefined;
      const game = await startNewGame(
        loadApiSettings(),
        draft,
        (stage, detail) => {
          if (ac.signal.aborted) return;
          setBusy({ stage, detail });
        },
        { opening },
      );
      if (ac.signal.aborted) return;
      await setGame(game);
      await nav({ to: "/play" });
    } catch (err) {
      if (isAbortError(err)) {
        toast.message("已終止");
        return;
      }
      const msg = err instanceof Error ? err.message : "開場失敗";
      setError(msg);
      toast.error(msg);
    } finally {
      setWorkSignal(null);
      if (!ac.signal.aborted) setBusy(null);
    }
  }

  if (sample) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
        <h1 className="font-display text-3xl">雨夜〈北風亭〉</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          樣本場景已畫好地圖、標好物件。角色是圓點。走進吧台才跟得上阿秋說話；站在門口對爐邊喊，對方聽不見。
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button size="lg" onClick={() => void runSample()}>
            踏進北風亭
          </Button>
          <Button asChild variant="outline">
            <Link to="/new">改為自訂主題</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-10">
      {busy && (
        <GeneratingOverlay
          stage={busy.stage}
          detail={busy.detail}
          onCancel={() => cancelBusy()}
        />
      )}
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6">
        <Link to="/">
          <ArrowLeft className="size-4" />
          返回
        </Link>
      </Button>
      <p className="text-xs tracking-[0.2em] text-muted-foreground">
        {step === 1 ? "01 主題" : "02 世界"}
      </p>
      <h1 className="mt-2 font-display text-3xl">
        {step === 1 ? (card ? `從角色卡：${card.name}` : "這趟要去哪") : "核對再踏入"}
      </h1>
      {card && step === 1 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          已帶入「{card.name}」的說明、Lorebook 與開場白。可再改主題與風格後生成。可互動角色將視為年滿 18 歲。
        </p>
      ) : null}

      {error && (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {step === 1 && (
        <div className="mt-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label>主題</Label>
            <Textarea
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例如：雨夜港口，一家不肯打烊的旅店"
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              {THEME_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setTheme(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => void inventTheme()}
              disabled={spin === "theme"}
            >
              {spin === "theme" ? (
                <Loader className="size-4 animate-spin" />
              ) : (
                <PenLine className="size-4" />
              )}
              幫我擬題
            </Button>
          </div>
          <StyleFields
            mapStyle={mapStyle}
            portraitStyle={portraitStyle}
            onChange={(p) => {
              if (p.mapStyle != null) setMapStyle(p.mapStyle);
              if (p.portraitStyle != null) setPortraitStyle(p.portraitStyle);
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <Label>角色提示（可空）</Label>
              <Input
                value={playerHint}
                onChange={(e) => setPlayerHint(e.target.value)}
                placeholder="剛下船的記帳助手"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <Label>額外設定（可空）</Label>
              <Input
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="不要魔法，偏寫實"
              />
            </label>
          </div>
          <Button size="lg" onClick={() => void buildWorld()}>
            生成世界觀與開場
          </Button>
        </div>
      )}

      {step === 2 && draft && (
        <div className="mt-8">
          <div className="mb-6">
            <StyleFields
              mapStyle={draft.mapStyle ?? draft.imageStyle ?? ""}
              portraitStyle={draft.portraitStyle ?? draft.imageStyle ?? ""}
              onChange={(p) => {
                if (p.mapStyle != null) {
                  setMapStyle(p.mapStyle);
                  setDraft({
                    ...draft,
                    imageStyle: p.mapStyle,
                    mapStyle: p.mapStyle,
                  });
                }
                if (p.portraitStyle != null) {
                  setPortraitStyle(p.portraitStyle);
                  setDraft({ ...draft, portraitStyle: p.portraitStyle });
                }
              }}
            />
          </div>
          <Tabs defaultValue="lore">
            <TabsList>
              <TabsTrigger value="lore">Lorebook</TabsTrigger>
              <TabsTrigger value="player">角色</TabsTrigger>
              <TabsTrigger value="scene">場景</TabsTrigger>
            </TabsList>
            <TabsContent value="lore" className="flex flex-col gap-3">
              {draft.lorebook.map((e, i) => (
                <LoreEditor
                  key={e.id}
                  entry={e}
                  onChange={(next) =>
                    setDraft({
                      ...draft,
                      lorebook: draft.lorebook.map((x, j) =>
                        j === i ? next : x,
                      ),
                    })
                  }
                  onDelete={() =>
                    setDraft({
                      ...draft,
                      lorebook: draft.lorebook.filter((_, j) => j !== i),
                    })
                  }
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  setDraft({
                    ...draft,
                    lorebook: [
                      ...draft.lorebook,
                      { id: uid("lb"), title: "新條目", content: "", tags: [], constant: false },
                    ],
                  })
                }
              >
                新增條目
              </Button>
            </TabsContent>
            <TabsContent value="player" className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <Label>姓名</Label>
                <Input
                  value={draft.player.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      player: { ...draft.player, name: e.target.value },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <Label>年齡</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={draft.player.age || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      player: {
                        ...draft.player,
                        age: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <Label>性別</Label>
                <Input
                  value={draft.player.gender ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      player: { ...draft.player, gender: e.target.value },
                    })
                  }
                  placeholder="男／女／其他"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <Label>種族</Label>
                <Input
                  value={draft.player.race ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      player: { ...draft.player, race: e.target.value },
                    })
                  }
                  placeholder="人、精靈…"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <Label>背景</Label>
                <Textarea
                  rows={4}
                  value={draft.player.bio}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      player: { ...draft.player, bio: e.target.value },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <Label>外觀（五官與身體，不含衣服）</Label>
                <Textarea
                  rows={3}
                  value={draft.player.appearance}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      player: { ...draft.player, appearance: e.target.value },
                    })
                  }
                  placeholder="髮、眉眼鼻口、膚色、體型、手足；成年非老年女性還要寫胸、腹、臀"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <Label>衣著（從頭到腳）</Label>
                <Textarea
                  rows={3}
                  value={draft.player.clothing ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      player: { ...draft.player, clothing: e.target.value },
                    })
                  }
                  placeholder="帽、上衣、下身、鞋、外套、飾品"
                />
              </label>
            </TabsContent>
            <TabsContent value="scene" className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <Label>場所</Label>
                <Input
                  value={draft.scene.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      scene: { ...draft.scene, name: e.target.value },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <Label>說明</Label>
                <Textarea
                  rows={4}
                  value={draft.scene.summary}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      scene: { ...draft.scene, summary: e.target.value },
                    })
                  }
                />
              </label>
              <p className="text-xs text-muted-foreground">
                NPC {draft.npcs.length} 人：
                {draft.npcs.map((n) => n.name).join("、") || "無"}
              </p>
            </TabsContent>
          </Tabs>
          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              返回主題
            </Button>
            <Button className="flex-1" size="lg" onClick={() => void enter()}>
              繪製地圖並開始
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

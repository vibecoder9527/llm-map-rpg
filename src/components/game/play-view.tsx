import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  BookOpen,
  Download,
  Eye,
  EyeOff,
  Menu,
  MessageSquare,
  ScanSearch,
  Pencil,
  Plus,
  Save,
  Send,
  Settings,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MapView, type EditSel } from "@/components/game/map-view";
import { ActionMenu } from "@/components/game/action-menu";
import { EditInspector, PlayerForm, type EditTarget } from "@/components/game/edit-inspector";
import { LoreEditor } from "@/components/game/lore-editor";
import { StyleFields } from "@/components/game/style-fields";
import { GeneratingOverlay } from "@/components/game/generating";
import { LogTranscript } from "@/components/game/log-transcript";
import {
  defaultBubbleRects,
  FloatBubble,
  loadBubbleRects,
  saveBubbleRects,
  type BubbleRect,
} from "@/components/game/float-bubble";
import { loadApiSettings } from "@/lib/ai/settings";
import { aspectWH, dist, PROXIMITY_LABEL, proximity, sceneAspect, withinMidRange } from "@/lib/game/distance";
import { publicName, trueNameOf } from "@/lib/game/identity";
import { resolvePortraitStyle } from "@/lib/game/prompts";
import type { ActionTarget } from "@/lib/game/actions";
import { applyPortrait, annotateSceneMap, composeRebuiltScene, inventNpc, isAbortError, lastPlayerAction, paintSceneMap, placeSceneActors, revealNpcPortrait, setWorkSignal, takeTurn, type PaintedMap } from "@/lib/game/engine";
import { exportGame } from "@/lib/game/save";
import { useGameStore } from "@/lib/game/store";
import { uid } from "@/lib/utils";
import type { Character, Crowd, Game, LoreEntry, MapAnnotation, MapObject, Scene, Vec2 } from "@/lib/game/types";

export function PlayView() {
  const nav = useNavigate();
  const { game, setGame, busy, setBusy, beginBusy, cancelBusy, error, setError, hydrate, hydrated } =
    useGameStore();
  const [draft, setDraft] = useState("");
  const [showObjects, setShowObjects] = useState(false);
  const [showVision, setShowVision] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTab, setEditTab] = useState<"scene" | "lore" | "style">("scene");
  const [npcAdd, setNpcAdd] = useState<"off" | "menu" | "ai">("off");
  const [npcHint, setNpcHint] = useState("");
  const [mapRegenOpen, setMapRegenOpen] = useState(false);
  const [mapPromptDraft, setMapPromptDraft] = useState("");
  const [mapPreview, setMapPreview] = useState<PaintedMap | null>(null);
  const [mapFailKind, setMapFailKind] = useState<"annotate" | "place" | null>(null);
  const paintedRef = useRef<PaintedMap | null>(null);
  const annotationRef = useRef<MapAnnotation | null>(null);
  const [editSel, setEditSel] = useState<EditSel>(null);
  const [target, setTarget] = useState<ActionTarget | null>(null);
  const [logOpen, setLogOpen] = useState(true);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [logRect, setLogRect] = useState<BubbleRect | null>(null);
  const [inputRect, setInputRect] = useState<BubbleRect | null>(null);
  const [playerRect, setPlayerRect] = useState<BubbleRect | null>(null);
  const [editRect, setEditRect] = useState<BubbleRect | null>(null);
  const [front, setFront] = useState<"log" | "input" | "player" | "edit">("input");
  const [bounds, setBounds] = useState({ w: 1280, h: 720 });
  const [revealingIds, setRevealingIds] = useState<Record<string, boolean>>({});
  const revealingRef = useRef<Record<string, boolean>>({});
  const logEnd = useRef<HTMLDivElement>(null);
  const logBox = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const bubbleInit = useRef(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    function persist() {
      const g = useGameStore.getState().game;
      if (g && document.visibilityState === "hidden") {
        void setGame(g);
      }
    }
    document.addEventListener("visibilitychange", persist);
    return () => document.removeEventListener("visibilitychange", persist);
  }, [setGame]);

  useEffect(() => {
    const box = logBox.current;
    if (box) box.scrollTop = box.scrollHeight;
    if (game?.log.length) setLogOpen(true);
  }, [game?.log.length]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    function apply(box: { w: number; h: number }) {
      setBounds(box);
      if (bubbleInit.current) return;
      bubbleInit.current = true;
      const saved = loadBubbleRects();
      const d = defaultBubbleRects(box);
      setLogRect(saved.log ?? d.log);
      setInputRect(saved.input ?? d.input);
      setPlayerRect(saved.player ?? d.player);
      setEditRect(saved.edit ?? d.edit);
    }
    apply({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setBounds({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hydrated, game]);

  useEffect(() => {
    if (logRect && inputRect && playerRect) {
      saveBubbleRects({
        log: logRect,
        input: inputRect,
        player: playerRect,
        edit: editRect ?? undefined,
      });
    }
  }, [logRect, inputRect, playerRect, editRect]);

  const scene = game?.scenes[game.currentSceneId];
  const distances = useMemo(() => {
    if (!game || !scene) return [];
    return scene.npcs
      .map((npc) => {
        const d = dist(scene.playerPos, npc, sceneAspect(scene));
        return { npc, d, prox: proximity(d) };
      })
      .sort((a, b) => a.d - b.d);
  }, [game, scene]);

  const liveTarget = useMemo((): ActionTarget | null => {
    if (!target || !scene) return target;
    if (target.kind === "npc") {
      const npc = scene.npcs.find((n) => n.id === target.npc.id);
      return npc ? { kind: "npc", npc } : target;
    }
    if (target.kind === "object") {
      const obj = scene.objects.find((o) => o.id === target.obj.id);
      return obj ? { kind: "object", obj } : target;
    }
    if (target.kind === "crowd") {
      const crowd = (scene.crowds ?? []).find((c) => c.id === target.crowd.id);
      return crowd ? { kind: "crowd", crowd } : target;
    }
    if (target.kind === "stack") {
      const obj = scene.objects.find((o) => o.id === target.obj.id);
      const crowd = (scene.crowds ?? []).find((c) => c.id === target.crowd.id);
      if (obj && crowd) return { kind: "stack", obj, crowd };
      if (crowd) return { kind: "crowd", crowd };
      if (obj) return { kind: "object", obj };
      return null;
    }
    return target;
  }, [target, scene]);

  async function act(text: string) {
    if (!game || busy || editing) return;
    const action = text.trim();
    if (!action) return;
    setDraft("");
    setTarget(null);
    const ac = beginBusy("推演這一回");
    setWorkSignal(ac.signal);
    try {
      const next = await takeTurn(
        loadApiSettings(),
        game,
        action,
        (stage, detail) => {
          if (ac.signal.aborted) return;
          setBusy({ stage, detail });
        },
      );
      if (ac.signal.aborted) return;
      await setGame(next);
    } catch (err) {
      if (isAbortError(err)) {
        toast.message("已終止");
        return;
      }
      const msg = err instanceof Error ? err.message : "這一回失敗";
      setError(msg);
      toast.error(msg);
    } finally {
      setWorkSignal(null);
      if (!ac.signal.aborted) setBusy(null);
    }
  }

  async function regenLastTurn() {
    const g = useGameStore.getState().game;
    if (!g?.checkpoint || busy || editing) return;
    const action = lastPlayerAction(g);
    if (!action) return;
    const ac = beginBusy("推演這一回", "重算");
    setWorkSignal(ac.signal);
    try {
      const next = await takeTurn(
        loadApiSettings(),
        g.checkpoint,
        action,
        (stage, detail) => {
          if (ac.signal.aborted) return;
          setBusy({ stage, detail });
        },
      );
      if (ac.signal.aborted) return;
      await setGame(next);
      toast.success("已重算這一回");
    } catch (err) {
      if (isAbortError(err)) {
        toast.message("已終止");
        return;
      }
      const msg = err instanceof Error ? err.message : "重算失敗";
      toast.error(msg);
    } finally {
      setWorkSignal(null);
      if (!ac.signal.aborted) setBusy(null);
    }
  }

  const revealPortrait = useCallback(
    (npc: Character, force = false) => {
      const g = useGameStore.getState().game;
      if (!g) return;
      const sc = g.scenes[g.currentSceneId];
      if (!sc) return;
      const live = sc.npcs.find((n) => n.id === npc.id) ?? npc;
      if (live.portrait && !force) return;
      const d = dist(sc.playerPos, live, sceneAspect(sc));
      if (!live.portrait && !withinMidRange(d)) return;
      if (revealingRef.current[live.id]) return;
      revealingRef.current[live.id] = true;
      setRevealingIds((m) => ({ ...m, [live.id]: true }));
      void (async () => {
        try {
          const image = await revealNpcPortrait(
            loadApiSettings(),
            live,
            sc,
            resolvePortraitStyle(g),
          );
          const latest = useGameStore.getState().game;
          if (!latest) return;
          const next = applyPortrait(latest, live.id, image);
          await setGame(next);
        } catch (err) {
          if (isAbortError(err)) return;
          const msg = err instanceof Error ? err.message : "沒能看清面容";
          toast.error(msg);
        } finally {
          revealingRef.current[live.id] = false;
          setRevealingIds((m) => {
            const n = { ...m };
            delete n[live.id];
            return n;
          });
        }
      })();
    },
    [setGame],
  );

  function openMapRegen() {
    const g = useGameStore.getState().game;
    const sc = g?.scenes[g.currentSceneId];
    if (!g || !sc || busy) return;
    setMapPromptDraft(
      sc.mapPrompt?.trim() ||
        [sc.name, sc.summary, sc.atmosphere].filter(Boolean).join(". "),
    );
    setMapRegenOpen(true);
  }

  async function drawMapPreview() {
    const g = useGameStore.getState().game;
    const sc = g?.scenes[g.currentSceneId];
    if (!g || !sc || busy) return;
    setMapRegenOpen(false);
    setMapPreview(null);
    setMapFailKind(null);
    const ac = beginBusy("繪製地圖", "產生預覽");
    setWorkSignal(ac.signal);
    try {
      const painted = await paintSceneMap(
        loadApiSettings(),
        g,
        sc,
        mapPromptDraft,
        (stage, detail) => {
          if (!ac.signal.aborted) setBusy({ stage, detail });
        },
      );
      if (ac.signal.aborted) return;
      paintedRef.current = painted;
      setMapPromptDraft(painted.mapPrompt);
      setMapPreview(painted);
    } catch (err) {
      if (isAbortError(err)) {
        toast.message("已終止");
        return;
      }
      toast.error(err instanceof Error ? err.message : "畫圖失敗");
    } finally {
      setWorkSignal(null);
      if (!ac.signal.aborted) setBusy(null);
    }
  }

  function discardMapJob() {
    setMapPreview(null);
    setMapFailKind(null);
    paintedRef.current = null;
    annotationRef.current = null;
  }

  async function acceptPreview() {
    const painted = mapPreview ?? paintedRef.current;
    if (!painted) return;
    setMapPreview(null);
    paintedRef.current = painted;
    await runAnnotate(painted);
  }

  async function runAnnotate(painted: PaintedMap) {
    const g = useGameStore.getState().game;
    const sc = g?.scenes[g.currentSceneId];
    if (!g || !sc) return;
    setMapFailKind(null);
    const ac = beginBusy("辨識場景物件", "讀取地圖上的家具與出口");
    setWorkSignal(ac.signal);
    try {
      const annotation = await annotateSceneMap(loadApiSettings(), painted.mapImage);
      if (ac.signal.aborted) return;
      annotationRef.current = annotation;
      await runPlace(painted, annotation, ac);
    } catch (err) {
      if (isAbortError(err)) {
        toast.message("已終止");
        return;
      }
      paintedRef.current = painted;
      setMapFailKind("annotate");
      setBusy({
        stage: "辨識場景物件",
        detail: err instanceof Error ? err.message : "JSON 無法解析",
      });
    }
  }

  async function runPlace(
    painted: PaintedMap,
    annotation: MapAnnotation,
    existing?: AbortController,
  ) {
    const g = useGameStore.getState().game;
    const sc = g?.scenes[g.currentSceneId];
    if (!g || !sc) return;
    const ac = existing ?? beginBusy("安置人物", "依新地圖標註移動");
    if (!existing) setWorkSignal(ac.signal);
    else setBusy({ stage: "安置人物", detail: "依新地圖標註移動" });
    setMapFailKind(null);
    try {
      const placed = await placeSceneActors(
        loadApiSettings(),
        g,
        sc,
        annotation,
        painted.mapPrompt,
      );
      if (ac.signal.aborted) return;
      const nextScene = composeRebuiltScene(sc, painted, annotation, placed);
      patchGame((cur) => ({
        ...cur,
        updatedAt: Date.now(),
        player: {
          ...cur.player,
          x: nextScene.playerPos.x,
          y: nextScene.playerPos.y,
        },
        scenes: { ...cur.scenes, [nextScene.id]: nextScene },
      }));
      discardMapJob();
      toast.success("地圖已重畫，物件已重標");
      setWorkSignal(null);
      if (!ac.signal.aborted) setBusy(null);
    } catch (err) {
      if (isAbortError(err)) {
        toast.message("已終止");
        return;
      }
      paintedRef.current = painted;
      annotationRef.current = annotation;
      setMapFailKind("place");
      setBusy({
        stage: "安置人物",
        detail: err instanceof Error ? err.message : "JSON 無法解析",
      });
    }
  }

  function retryMapStep() {
    const painted = paintedRef.current;
    if (!painted) return;
    if (mapFailKind === "place" && annotationRef.current) {
      void runPlace(painted, annotationRef.current);
      return;
    }
    void runAnnotate(painted);
  }

  function patchGame(mut: (g: Game) => Game, persist = true) {
    const g = useGameStore.getState().game;
    if (!g) return;
    void setGame(mut(g), persist);
  }

  function patchScene(mut: (s: Scene) => Scene, persist = true) {
    patchGame((g) => {
      const sc = g.scenes[g.currentSceneId];
      if (!sc) return g;
      return {
        ...g,
        updatedAt: Date.now(),
        scenes: { ...g.scenes, [sc.id]: mut(sc) },
      };
    }, persist);
  }

  function moveObject(id: string, pos: Vec2) {
    patchScene(
      (s) => ({
        ...s,
        objects: s.objects.map((o) => (o.id === id ? { ...o, ...pos } : o)),
      }),
      false,
    );
  }

  function resizeObject(id: string, size: { w: number; h: number }) {
    patchScene(
      (s) => ({
        ...s,
        objects: s.objects.map((o) => (o.id === id ? { ...o, ...size } : o)),
      }),
      false,
    );
  }

  function moveNpc(id: string, pos: Vec2) {
    patchScene(
      (s) => ({
        ...s,
        npcs: s.npcs.map((n) => (n.id === id ? { ...n, ...pos } : n)),
      }),
      false,
    );
  }

  function moveCrowd(id: string, pos: Vec2) {
    patchScene(
      (s) => ({
        ...s,
        crowds: (s.crowds ?? []).map((c) => (c.id === id ? { ...c, ...pos } : c)),
      }),
      false,
    );
  }

  function resizeCrowd(id: string, size: { rx: number; ry: number }) {
    patchScene(
      (s) => ({
        ...s,
        crowds: (s.crowds ?? []).map((c) => (c.id === id ? { ...c, ...size } : c)),
      }),
      false,
    );
  }

  function movePlayer(pos: Vec2) {
    patchGame((g) => {
      const sc = g.scenes[g.currentSceneId];
      if (!sc) return g;
      return {
        ...g,
        updatedAt: Date.now(),
        player: { ...g.player, x: pos.x, y: pos.y },
        scenes: { ...g.scenes, [sc.id]: { ...sc, playerPos: pos } },
      };
    }, false);
  }

  function addObject() {
    const obj: MapObject = {
      id: uid("obj"),
      label: "新物件",
      kind: "other",
      x: 50,
      y: 50,
      w: 14,
      h: 14,
      z: 4,
      desc: "",
    };
    patchScene((s) => ({ ...s, objects: [...s.objects, obj] }));
    setEditSel({ kind: "object", id: obj.id });
  }

  function addNpc() {
    const npc: Character = {
      id: uid("npc"),
      name: "無名",
      trueName: "無名",
      known: false,
      alias: "",
      role: "npc",
      bio: "",
      personality: "",
      appearance: "",
      clothing: "",
      age: 0,
      gender: "",
      race: "",
      tags: [],
      color: "#7d9aa3",
      x: 50,
      y: 58,
      facing: 180,
      alert: "unaware",
      status: "",
      goal: "",
      memory: "",
    };
    patchScene((s) => ({ ...s, npcs: [...s.npcs, npc] }));
    setEditSel({ kind: "npc", id: npc.id });
    setNpcAdd("off");
  }

  async function inventNpcFromHint() {
    const g = useGameStore.getState().game;
    const sc = g?.scenes[g.currentSceneId];
    if (!g || !sc || busy) return;
    const ac = beginBusy("產生人物", npcHint.trim().slice(0, 32) || "依場所構想");
    setWorkSignal(ac.signal);
    try {
      const npc = await inventNpc(loadApiSettings(), g, sc, npcHint);
      if (ac.signal.aborted) return;
      patchScene((s) => ({ ...s, npcs: [...s.npcs, npc] }));
      setEditSel({ kind: "npc", id: npc.id });
      setNpcAdd("off");
      setNpcHint("");
      toast.success(`已加入${trueNameOf(npc)}`);
    } catch (err) {
      if (isAbortError(err)) {
        toast.message("已終止");
        return;
      }
      toast.error(err instanceof Error ? err.message : "產生失敗");
    } finally {
      setWorkSignal(null);
      if (!ac.signal.aborted) setBusy(null);
    }
  }

  function addCrowd() {
    const crowd: Crowd = {
      id: uid("crowd"),
      label: "一群人",
      x: 55,
      y: 55,
      rx: 12,
      ry: 8,
      size: 4,
      desc: "",
      namedOut: 0,
    };
    patchScene((s) => ({ ...s, crowds: [...(s.crowds ?? []), crowd] }));
    setEditSel({ kind: "crowd", id: crowd.id });
  }

  const inspectTarget: EditTarget | null = (() => {
    if (!editing || !editSel || !scene) return null;
    if (editSel.kind === "player") return null;
    if (editSel.kind === "object") {
      const obj = scene.objects.find((o) => o.id === editSel.id);
      return obj ? { kind: "object", obj } : null;
    }
    if (editSel.kind === "crowd") {
      const crowd = (scene.crowds ?? []).find((c) => c.id === editSel.id);
      return crowd ? { kind: "crowd", crowd } : null;
    }
    const npc = scene.npcs.find((n) => n.id === editSel.id);
    return npc ? { kind: "npc", npc } : null;
  })();

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        讀取中…
      </div>
    );
  }

  if (!game || !scene) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
        <p className="font-display text-2xl">沒有進行中的旅程</p>
        <Button asChild className="mt-6">
          <Link to="/">回到開頭</Link>
        </Button>
      </main>
    );
  }

  return (
    <div ref={rootRef} className="relative flex h-dvh flex-col overflow-hidden bg-background">
      {busy && (
        <GeneratingOverlay
          stage={busy.stage}
          detail={busy.detail}
          onCancel={() => {
            cancelBusy();
            discardMapJob();
          }}
          onRetry={mapFailKind ? () => void retryMapStep() : undefined}
        />
      )}
      {!editing && (
        <ActionMenu
          target={liveTarget}
          playerPos={scene.playerPos}
          mapAspect={sceneAspect(scene)}
          revealingIds={revealingIds}
          onClose={() => setTarget(null)}
          onAct={(text) => void act(text)}
          onRetarget={setTarget}
          onNeedPortrait={revealPortrait}
          onRegenPortrait={(npc) => revealPortrait(npc, true)}
        />
      )}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <Link to="/" className="font-display text-lg tracking-tight">
          圖誌
        </Link>
        <Separator orientation="vertical" className="h-4" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{scene.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {game.player.name} · 第 {game.turnCount} 回
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant={editing ? "default" : "ghost"}
          aria-label={editing ? "關閉編輯模式" : "編輯模式"}
          onClick={() => {
            setEditing((v) => {
              const next = !v;
              if (next) {
                setFront("edit");
                setEditTab("scene");
                setNpcAdd("off");
              }
              return next;
            });
            setEditSel(null);
            setTarget(null);
            const g = useGameStore.getState().game;
            if (g) void setGame(g, true);
          }}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={showVision || editing ? "default" : "ghost"}
          aria-label={showVision || editing ? "隱藏視野" : "顯示視野"}
          onClick={() => setShowVision((v) => !v)}
        >
          <ScanSearch className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={showObjects ? "隱藏物件框" : "顯示物件框"}
          onClick={() => setShowObjects((v) => !v)}
        >
          {showObjects ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" size="icon" variant="ghost" aria-label="選單">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{game.title}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 overflow-y-auto px-5 pb-8">
              <p className="text-sm text-muted-foreground">{game.theme}</p>
              <div className="mt-2 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    void setGame(game);
                    toast.success("已存檔");
                  }}
                >
                  <Save className="size-4" />
                  存檔
                </Button>
                <Button variant="outline" onClick={() => exportGame(game)}>
                  <Download className="size-4" />
                  匯出
                </Button>
                <Button asChild variant="outline">
                  <Link to="/saves">
                    <BookOpen className="size-4" />
                    讀檔
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings">
                    <Settings className="size-4" />
                    API 設定
                  </Link>
                </Button>
                <Button variant="ghost" onClick={() => void nav({ to: "/" })}>
                  離開
                </Button>
              </div>
              <Separator className="my-4" />
              <p className="text-xs font-medium text-muted-foreground">物品</p>
              <p className="text-sm">
                {game.inventory.length ? game.inventory.join("、") : "空手"}
              </p>
              <Separator className="my-4" />
              <p className="text-xs font-medium text-muted-foreground">Lorebook</p>
              <ul className="space-y-3">
                {game.lorebook.map((e) => (
                  <li key={e.id}>
                    <p className="text-sm">
                      {e.title}
                      {e.constant ? (
                        <span className="ml-1 text-[10px] text-muted-foreground">常駐</span>
                      ) : null}
                    </p>
                    {e.tags.length > 0 ? (
                      <p className="text-[10px] text-muted-foreground">{e.tags.join(" · ")}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">{e.content}</p>
                  </li>
                ))}
              </ul>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-[9.75rem] shrink-0 flex-col overflow-y-auto border-r border-border p-2 sm:w-52 lg:w-60 lg:p-3">
          <p className="mb-1.5 px-1 text-[11px] text-muted-foreground">場中的人</p>
          <ul className="flex flex-col gap-1">
            <li>
              <button
                type="button"
                disabled={Boolean(busy)}
                className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-xs hover:bg-muted"
                onClick={() => {
                  if (editing) setEditSel({ kind: "player" });
                  setPlayerOpen(true);
                  setFront("player");
                }}
              >
                <span className="size-2 shrink-0 rounded-full bg-[var(--color-marker-player)]" />
                <span className="min-w-0 flex-1 truncate">{game.player.name}</span>
                <Badge variant="outline" className="shrink-0 font-mono text-[10px] tabular-nums">
                  你
                </Badge>
              </button>
            </li>
            {distances.map(({ npc, d, prox }) => (
              <li key={npc.id}>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-xs hover:bg-muted"
                  onClick={() => {
                    if (editing) {
                      setEditSel({ kind: "npc", id: npc.id });
                      setFront("edit");
                    } else {
                      setTarget({ kind: "npc", npc });
                    }
                  }}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: npc.color }}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {editing ? trueNameOf(npc) : publicName(npc)}
                  </span>
                  <Badge variant="outline" className="shrink-0 font-mono text-[10px] tabular-nums">
                    {d.toFixed(0)}
                    <span className="hidden sm:inline"> · {PROXIMITY_LABEL[prox]}</span>
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="absolute inset-2 flex items-center justify-center sm:inset-3 [container-type:size]">
            {(() => {
              const { w, h } = aspectWH(sceneAspect(scene));
              return (
            <div
              className="max-h-full max-w-full"
              style={{
                aspectRatio: `${w} / ${h}`,
                width: `min(100cqw, calc(100cqh * ${w} / ${h}))`,
                height: `min(100cqh, calc(100cqw * ${h} / ${w}))`,
              }}
            >
              <MapView
              scene={scene}
              player={{ ...game.player, x: scene.playerPos.x, y: scene.playerPos.y }}
              showObjects={showObjects}
              editing={editing}
              selected={editSel}
              onSelect={setTarget}
              onSelectEdit={(sel) => {
                setEditSel(sel);
                if (sel?.kind === "player") {
                  setPlayerOpen(true);
                  setFront("player");
                } else if (sel) {
                  setFront("edit");
                }
                const g = useGameStore.getState().game;
                if (g) void setGame(g, true);
              }}
              onMoveObject={moveObject}
              onResizeObject={resizeObject}
              onMoveNpc={moveNpc}
              onMoveCrowd={moveCrowd}
              onResizeCrowd={resizeCrowd}
              onMovePlayer={movePlayer}
              onRegenMap={openMapRegen}
              showVision={editing || showVision}
              disabled={Boolean(busy)}
            />
            </div>
              );
            })()}
          </div>
        </section>
      </div>

      {playerOpen && playerRect && (
        <FloatBubble
          title={editing ? "玩家角色（編輯）" : "玩家角色"}
          rect={playerRect}
          z={front === "player" ? 40 : 34}
          bounds={bounds}
          minW={220}
          minH={160}
          onChange={setPlayerRect}
          onFocus={() => setFront("player")}
          onClose={() => setPlayerOpen(false)}
          closeLabel="收合角色"
        >
          <div className="h-full overflow-y-auto">
            <PlayerForm
              player={game.player}
              inventory={game.inventory}
              pos={scene.playerPos}
              editing={editing}
              onChangePlayer={(player) =>
                patchGame((g) => ({
                  ...g,
                  updatedAt: Date.now(),
                  player: {
                    ...player,
                    x: g.player.x,
                    y: g.player.y,
                  },
                }))
              }
              onChangeInventory={(inventory) =>
                patchGame((g) => ({ ...g, updatedAt: Date.now(), inventory }))
              }
            />
          </div>
        </FloatBubble>
      )}

      {editing && editRect && (
        <FloatBubble
          title={
            editTab === "lore"
              ? "Lorebook"
              : editTab === "style"
                ? "繪圖風格"
                : inspectTarget?.kind === "object"
                ? "物件框"
                : inspectTarget?.kind === "crowd"
                  ? "人群"
                  : inspectTarget?.kind === "npc"
                    ? "人物設定"
                    : "編輯"
          }
          rect={editRect}
          z={front === "edit" ? 42 : 36}
          bounds={bounds}
          minW={240}
          minH={200}
          showOpacity={false}
          onChange={setEditRect}
          onFocus={() => setFront("edit")}
          onClose={() => {
            setEditing(false);
            setEditSel(null);
            setTarget(null);
            const g = useGameStore.getState().game;
            if (g) void setGame(g, true);
          }}
          closeLabel="離開編輯模式"
        >
          <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto p-3">
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant={editTab === "scene" ? "default" : "outline"}
                onClick={() => setEditTab("scene")}
              >
                場景
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editTab === "lore" ? "default" : "outline"}
                onClick={() => setEditTab("lore")}
              >
                <BookOpen className="size-4" />
                Lorebook
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editTab === "style" ? "default" : "outline"}
                onClick={() => setEditTab("style")}
              >
                風格
              </Button>
            </div>
            {editTab === "lore" ? (
              <>
                {game.lorebook.map((e) => (
                  <LoreEditor
                    key={e.id}
                    entry={e}
                    onChange={(next) =>
                      patchGame((g) => ({
                        ...g,
                        updatedAt: Date.now(),
                        lorebook: g.lorebook.map((x) => (x.id === e.id ? next : x)),
                      }))
                    }
                    onDelete={() =>
                      patchGame((g) => ({
                        ...g,
                        updatedAt: Date.now(),
                        lorebook: g.lorebook.filter((x) => x.id !== e.id),
                      }))
                    }
                  />
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    patchGame((g) => ({
                      ...g,
                      updatedAt: Date.now(),
                      lorebook: [
                        ...g.lorebook,
                        {
                          id: uid("lb"),
                          title: "新條目",
                          content: "",
                          tags: [],
                          constant: false,
                        } satisfies LoreEntry,
                      ],
                    }))
                  }
                >
                  <Plus className="size-4" />
                  新增條目
                </Button>
              </>
            ) : editTab === "style" ? (
              <StyleFields
                mapStyle={game.mapStyle ?? game.imageStyle ?? ""}
                portraitStyle={game.portraitStyle ?? game.imageStyle ?? ""}
                onChange={(p) =>
                  patchGame((g) => ({
                    ...g,
                    updatedAt: Date.now(),
                    ...(p.mapStyle != null
                      ? { mapStyle: p.mapStyle, imageStyle: p.mapStyle }
                      : {}),
                    ...(p.portraitStyle != null ? { portraitStyle: p.portraitStyle } : {}),
                  }))
                }
              />
            ) : (
              <>
            <div className="flex flex-col gap-1.5">
              <Button type="button" size="sm" variant="outline" onClick={addObject}>
                <Plus className="size-4" />
                新增物件
              </Button>
              <Button
                type="button"
                size="sm"
                variant={npcAdd === "off" ? "outline" : "default"}
                onClick={() => setNpcAdd((v) => (v === "off" ? "menu" : "off"))}
              >
                <UserPlus className="size-4" />
                新增人物
              </Button>
              {npcAdd !== "off" ? (
                <div className="flex flex-col gap-1.5 rounded-md border border-border p-2">
                  <Button type="button" size="sm" variant="ghost" onClick={addNpc}>
                    手動：空白角色
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={npcAdd === "ai" ? "secondary" : "ghost"}
                    onClick={() => setNpcAdd("ai")}
                  >
                    AI：從描述生成
                  </Button>
                  {npcAdd === "ai" ? (
                    <>
                      <Textarea
                        rows={3}
                        value={npcHint}
                        onChange={(e) => setNpcHint(e.target.value)}
                        placeholder="例如：門口躲雨的年輕更夫，不太想進來"
                        className="min-h-16 text-xs"
                        disabled={Boolean(busy)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={Boolean(busy) || !npcHint.trim()}
                        onClick={() => void inventNpcFromHint()}
                      >
                        生成並放入地圖
                      </Button>
                    </>
                  ) : null}
                </div>
              ) : null}
              <Button type="button" size="sm" variant="outline" onClick={addCrowd}>
                <Users className="size-4" />
                新增人群
              </Button>
            </div>
            {inspectTarget ? (
              <EditInspector
                chrome={false}
                target={inspectTarget}
                onClose={() => {
                  setEditSel(null);
                  const g = useGameStore.getState().game;
                  if (g) void setGame(g, true);
                }}
                onChangeObject={(obj) =>
                  patchScene((s) => ({
                    ...s,
                    objects: s.objects.map((o) => (o.id === obj.id ? obj : o)),
                  }))
                }
                onChangeCrowd={(crowd) =>
                  patchScene((s) => ({
                    ...s,
                    crowds: (s.crowds ?? []).map((c) => (c.id === crowd.id ? crowd : c)),
                  }))
                }
                onChangeNpc={(npc) =>
                  patchScene((s) => ({
                    ...s,
                    npcs: s.npcs.map((n) => (n.id === npc.id ? npc : n)),
                  }))
                }
                onDelete={() => {
                  if (!editSel) return;
                  if (editSel.kind === "object") {
                    patchScene((s) => ({
                      ...s,
                      objects: s.objects.filter((o) => o.id !== editSel.id),
                    }));
                  } else if (editSel.kind === "crowd") {
                    patchScene((s) => ({
                      ...s,
                      crowds: (s.crowds ?? []).filter((c) => c.id !== editSel.id),
                    }));
                  } else if (editSel.kind === "npc") {
                    patchScene((s) => ({
                      ...s,
                      npcs: s.npcs.filter((n) => n.id !== editSel.id),
                    }));
                  }
                  setEditSel(null);
                }}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                點地圖上的物件、人群或人物來編輯。玩家請用左下「角色」。
              </p>
            )}
              </>
            )}
          </div>
        </FloatBubble>
      )}

      {logOpen && logRect && inputRect && (
        <>
          <FloatBubble
            title="紀錄"
            rect={logRect}
            z={front === "log" ? 40 : 35}
            bounds={bounds}
            minW={220}
            minH={140}
            onChange={setLogRect}
            onFocus={() => setFront("log")}
            onClose={() => setLogOpen(false)}
            closeLabel="收合紀錄"
          >
            <div ref={logBox} className="h-full overflow-y-auto p-3">
              <LogTranscript
                entries={game.log}
                playerName={game.player.name}
                names={scene.npcs.flatMap((n) =>
                  [publicName(n), trueNameOf(n), n.alias ?? ""].filter(Boolean),
                )}
                onRegenLast={game.checkpoint ? () => void regenLastTurn() : undefined}
                regenDisabled={Boolean(busy) || editing}
              />
              <div ref={logEnd} />
            </div>
          </FloatBubble>
          <FloatBubble
            title="行動"
            rect={inputRect}
            z={front === "input" ? 40 : 35}
            bounds={bounds}
            minW={220}
            minH={120}
            onChange={setInputRect}
            onFocus={() => setFront("input")}
          >
            <div className="flex h-full min-h-0 flex-col p-2 pb-4">
              {error && (
                <p className="mb-1 break-words px-0.5 text-xs text-destructive">{error}</p>
              )}
              {game.suggested.length > 0 && !editing && (
                <div className="mb-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                  {game.suggested.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={Boolean(busy)}
                      className="w-full whitespace-normal break-words rounded-md border border-border px-2.5 py-1.5 text-left text-[11px] leading-snug text-muted-foreground hover:text-foreground"
                      onClick={() => void act(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <form
                className="mt-auto flex shrink-0 items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(draft);
                }}
              >
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={editing ? "編輯模式中，不會推進回合" : "輸入行動，或先點地圖"}
                  rows={2}
                  className="min-h-10 resize-none break-words"
                  disabled={Boolean(busy) || editing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void act(draft);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="size-10 shrink-0"
                  disabled={Boolean(busy) || editing || !draft.trim()}
                  aria-label="送出"
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          </FloatBubble>
        </>
      )}

      <nav className="relative z-20 flex h-7 shrink-0 items-center justify-between bg-[#3a3a3e] px-2 sm:h-8 sm:px-3">
        <button
          type="button"
          aria-label={playerOpen ? "收合角色" : "玩家角色"}
          aria-pressed={playerOpen}
          className="flex h-6 items-center gap-1 rounded-full px-2 text-[11px] text-neutral-300 hover:bg-white/10 hover:text-white"
          onClick={() => {
            setPlayerOpen((v) => !v);
            setFront("player");
          }}
        >
          <User className="size-3.5" />
          角色
        </button>
        <button
          type="button"
          aria-label={logOpen ? "收合紀錄" : "展開紀錄"}
          aria-pressed={logOpen}
          className="flex h-6 items-center gap-1 rounded-full px-2 text-[11px] text-neutral-300 hover:bg-white/10 hover:text-white"
          onClick={() => setLogOpen((v) => !v)}
        >
          <MessageSquare className="size-3.5" />
          紀錄
        </button>
      </nav>

      <Dialog open={mapRegenOpen} onOpenChange={setMapRegenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重畫地圖</DialogTitle>
            <DialogDescription>
              先產生預覽確認。確定後才會清掉物件框、重標家具並移動人物。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Label>地圖提示詞</Label>
            <Textarea
              rows={6}
              value={mapPromptDraft}
              onChange={(e) => setMapPromptDraft(e.target.value)}
              placeholder="英文或中文皆可，會先譯成英文再送去畫圖"
              className="min-h-32"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setMapRegenOpen(false)}>
                取消
              </Button>
              <Button type="button" onClick={() => void drawMapPreview()} disabled={!mapPromptDraft.trim()}>
                產生預覽
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(mapPreview)} onOpenChange={(open) => !open && discardMapJob()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>確認新地圖</DialogTitle>
            <DialogDescription>
              沒問題再繼續標物件、移動人物。不滿意可改提示詞重畫。
            </DialogDescription>
          </DialogHeader>
          {mapPreview ? (
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-lg border border-border bg-secondary">
                <img
                  src={mapPreview.mapImage}
                  alt="地圖預覽"
                  className="mx-auto max-h-[50vh] w-full object-contain"
                />
              </div>
              <Label>地圖提示詞</Label>
              <Textarea
                rows={4}
                value={mapPromptDraft}
                onChange={(e) => setMapPromptDraft(e.target.value)}
                className="min-h-24"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={discardMapJob}>
                  取消
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void drawMapPreview()}
                  disabled={!mapPromptDraft.trim()}
                >
                  改了重畫
                </Button>
                <Button type="button" onClick={() => void acceptPreview()}>
                  用這張繼續
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

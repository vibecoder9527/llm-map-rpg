import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { clamp, cn } from "@/lib/utils";
import { dist, PROXIMITY_LABEL, proximity, sceneAspect } from "@/lib/game/distance";
import { publicName, trueNameOf } from "@/lib/game/identity";
import { conePoints, facingOf, VISION } from "@/lib/game/vision";
import { comparePaintOrder, crowdAt, crowdAxes, objectLayer, pointHitsCrowd, pointHitsObject, targetFromHits } from "@/lib/game/actions";
import type { ActionTarget } from "@/lib/game/actions";
import type { Character, Scene, Vec2 } from "@/lib/game/types";

export type EditSel =
  | { kind: "object"; id: string }
  | { kind: "crowd"; id: string }
  | { kind: "npc"; id: string }
  | { kind: "player" }
  | null;

type Drag =
  | { type: "obj"; id: string; x: number; y: number; px: number; py: number }
  | { type: "resize"; id: string; w: number; h: number; px: number; py: number }
  | { type: "crowd"; id: string; x: number; y: number; px: number; py: number }
  | { type: "resize-crowd"; id: string; rx: number; ry: number; px: number; py: number }
  | { type: "npc"; id: string; x: number; y: number; px: number; py: number }
  | { type: "player"; x: number; y: number; px: number; py: number };

type Props = {
  scene: Scene;
  player: Character;
  showObjects?: boolean;
  editing?: boolean;
  selected?: EditSel;
  onSelect: (target: ActionTarget) => void;
  onSelectEdit?: (sel: EditSel) => void;
  onMoveObject?: (id: string, pos: Vec2) => void;
  onResizeObject?: (id: string, size: { w: number; h: number }) => void;
  onMoveNpc?: (id: string, pos: Vec2) => void;
  onMoveCrowd?: (id: string, pos: Vec2) => void;
  onResizeCrowd?: (id: string, size: { rx: number; ry: number }) => void;
  onMovePlayer?: (pos: Vec2) => void;
  onRegenMap?: () => void;
  showVision?: boolean;
  disabled?: boolean;
};

export function MapView({
  scene,
  player,
  showObjects = false,
  editing = false,
  selected = null,
  onSelect,
  onSelectEdit,
  onMoveObject,
  onResizeObject,
  onMoveNpc,
  onMoveCrowd,
  onResizeCrowd,
  onMovePlayer,
  onRegenMap,
  showVision = false,
  disabled,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function toPct(clientX: number, clientY: number): Vec2 | null {
    const el = wrapRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 100;
    const y = ((clientY - r.top) / r.height) * 100;
    if (x < 0 || y < 0 || x > 100 || y > 100) return null;
    return { x, y };
  }

  function tap(clientX: number, clientY: number, fromMarker?: "npc" | "self", id?: string) {
    if (disabled) return;
    const down = downRef.current;
    downRef.current = null;
    if (down && Math.hypot(clientX - down.x, clientY - down.y) > 10) return;

    if (editing) {
      if (fromMarker === "npc" && id) {
        onSelectEdit?.({ kind: "npc", id });
        return;
      }
      if (fromMarker === "self") {
        onSelectEdit?.({ kind: "player" });
        return;
      }
      const pos = toPct(clientX, clientY);
      if (!pos) return;
      if (selected?.kind === "object") {
        const cur = scene.objects.find((o) => o.id === selected.id);
        if (cur && pointHitsObject(pos, cur)) {
          onSelectEdit?.(selected);
          return;
        }
      }
      if (selected?.kind === "crowd") {
        const cur = (scene.crowds ?? []).find((c) => c.id === selected.id);
        if (cur && pointHitsCrowd(pos, cur)) {
          onSelectEdit?.(selected);
          return;
        }
      }
      const crowd = crowdAt(pos, scene.crowds);
      if (crowd) {
        onSelectEdit?.({ kind: "crowd", id: crowd.id });
        return;
      }
      const hit = targetFromHits(pos, scene.objects, scene.crowds);
      if (hit.kind === "object") onSelectEdit?.({ kind: "object", id: hit.obj.id });
      else onSelectEdit?.(null);
      return;
    }

    if (fromMarker === "self") {
      onSelect({ kind: "self", player });
      return;
    }
    if (fromMarker === "npc" && id) {
      const npc = scene.npcs.find((n) => n.id === id);
      if (npc) onSelect({ kind: "npc", npc });
      return;
    }

    const pos = toPct(clientX, clientY);
    if (!pos) return;
    onSelect(targetFromHits(pos, scene.objects, scene.crowds));
  }

  function startDrag(e: React.PointerEvent, drag: Drag) {
    e.stopPropagation();
    e.preventDefault();
    downRef.current = { x: e.clientX, y: e.clientY };
    dragRef.current = drag;
    setDragging(true);
    wrapRef.current?.setPointerCapture?.(e.pointerId);
  }

  function onMove(e: React.PointerEvent) {
    const pos = toPct(e.clientX, e.clientY);
    setHover(pos);
    const drag = dragRef.current;
    if (!drag || !editing) return;
    const dx = ((e.clientX - drag.px) / (wrapRef.current?.clientWidth || 1)) * 100;
    const dy = ((e.clientY - drag.py) / (wrapRef.current?.clientHeight || 1)) * 100;
    if (drag.type === "obj") {
      onMoveObject?.(drag.id, {
        x: clamp(drag.x + dx, 3, 97),
        y: clamp(drag.y + dy, 3, 97),
      });
    } else if (drag.type === "resize") {
      onResizeObject?.(drag.id, {
        w: clamp(drag.w + dx, 4, 80),
        h: clamp(drag.h + dy, 4, 80),
      });
    } else if (drag.type === "crowd") {
      onMoveCrowd?.(drag.id, {
        x: clamp(drag.x + dx, 3, 97),
        y: clamp(drag.y + dy, 3, 97),
      });
    } else if (drag.type === "resize-crowd") {
      onResizeCrowd?.(drag.id, {
        rx: clamp(drag.rx + dx, 4, 36),
        ry: clamp(drag.ry + dy, 4, 36),
      });
    } else if (drag.type === "npc") {
      onMoveNpc?.(drag.id, {
        x: clamp(drag.x + dx, 3, 97),
        y: clamp(drag.y + dy, 3, 97),
      });
    } else if (drag.type === "player") {
      onMovePlayer?.({
        x: clamp(drag.x + dx, 3, 97),
        y: clamp(drag.y + dy, 3, 97),
      });
    }
  }

  function endDrag(e: React.PointerEvent, fromMarker?: "npc" | "self", id?: string) {
    const moved =
      downRef.current &&
      Math.hypot(e.clientX - downRef.current.x, e.clientY - downRef.current.y) > 8;
    dragRef.current = null;
    setDragging(false);
    if (!moved) tap(e.clientX, e.clientY, fromMarker, id);
    else downRef.current = null;
  }

  const boxesOn = showObjects || editing;

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative size-full overflow-hidden rounded-lg border border-border bg-muted select-none",
        disabled ? "cursor-wait" : editing ? "cursor-default" : "cursor-pointer",
      )}
        onPointerDown={(e) => {
          downRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={onMove}
        onPointerUp={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest("[data-marker]") || t.closest("[data-obj]") || t.closest("[data-crowd]") || t.closest("[data-regen]")) {
            if (!editing) return;
          }
          if (dragRef.current) {
            dragRef.current = null;
            setDragging(false);
            downRef.current = null;
            return;
          }
          tap(e.clientX, e.clientY);
        }}
        onPointerLeave={() => {
          setHover(null);
          setTip(null);
          if (!dragRef.current) downRef.current = null;
        }}
      >
        <img
          src={scene.mapImage}
          alt={scene.name}
          draggable={false}
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />
        {showVision ? (
          <svg
            className="pointer-events-none absolute inset-0 z-[4] size-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {scene.npcs.map((npc) => {
              const alert = npc.alert ?? "unaware";
              const fill =
                alert === "alert" ? "#b85c4a" : alert === "suspicious" ? "#c4a35a" : npc.color;
              const aspect = sceneAspect(scene);
              return (
                <g key={`vis-${npc.id}`}>
                  <polygon
                    points={conePoints(npc, VISION.glimpse, aspect)}
                    fill={fill}
                    fillOpacity={alert === "unaware" ? 0.14 : 0.22}
                  />
                  <polygon
                    points={conePoints(npc, VISION.seen, aspect)}
                    fill={fill}
                    fillOpacity={alert === "unaware" ? 0.22 : 0.34}
                  />
                </g>
              );
            })}
          </svg>
        ) : null}
        {onRegenMap ? (
          <button
            type="button"
            data-regen
            aria-label="重新生成地圖"
            title="重新生成地圖（可改提示詞；物件會重標、人物會移位）"
            disabled={disabled}
            className="absolute left-2 top-2 z-30 flex size-8 items-center justify-center rounded-md border border-border bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onRegenMap();
            }}
          >
            <RefreshCw className="size-3.5" />
          </button>
        ) : null}
        {[...scene.objects].sort(comparePaintOrder).map((obj) => {
          const active = selected?.kind === "object" && selected.id === obj.id;
          return (
            <div
              key={obj.id}
              data-obj
              className={cn(
                "absolute",
                boxesOn
                  ? active
                    ? "border-2 border-primary bg-primary/15"
                    : "border border-primary/40 bg-primary/5 hover:bg-primary/10"
                  : "border border-transparent bg-transparent hover:bg-primary/10",
                editing && "min-h-4 min-w-4 cursor-grab",
                !editing && "min-h-11 min-w-11",
              )}
              style={{
                left: `${obj.x}%`,
                top: `${obj.y}%`,
                width: `${Math.max(obj.w, editing ? 4 : 8)}%`,
                height: `${Math.max(obj.h, editing ? 4 : 8)}%`,
                transform: "translate(-50%, -50%)",
                zIndex: editing && active ? 40 : 2 + objectLayer(obj),
              }}
              onPointerDown={(e) => {
                if (!editing) {
                  e.stopPropagation();
                  downRef.current = { x: e.clientX, y: e.clientY };
                  return;
                }
                onSelectEdit?.({ kind: "object", id: obj.id });
                startDrag(e, {
                  type: "obj",
                  id: obj.id,
                  x: obj.x,
                  y: obj.y,
                  px: e.clientX,
                  py: e.clientY,
                });
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                if (editing) endDrag(e);
                else tap(e.clientX, e.clientY);
              }}
              onPointerEnter={() => setTip(obj.label)}
            >
              {boxesOn && (
                <span className="pointer-events-none absolute left-0.5 top-0.5 rounded-sm bg-background/80 px-1 text-[9px] leading-4 text-foreground">
                  {obj.label}
                </span>
              )}
              {editing && active && (
                <button
                  type="button"
                  aria-label="縮放"
                  className="absolute -bottom-1.5 -right-1.5 size-3.5 cursor-nwse-resize rounded-sm border border-background bg-primary"
                  onPointerDown={(e) => {
                    startDrag(e, {
                      type: "resize",
                      id: obj.id,
                      w: obj.w,
                      h: obj.h,
                      px: e.clientX,
                      py: e.clientY,
                    });
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    dragRef.current = null;
                    setDragging(false);
                    downRef.current = null;
                  }}
                />
              )}
            </div>
          );
        })}
        {(scene.crowds ?? []).map((crowd) => {
          const active = selected?.kind === "crowd" && selected.id === crowd.id;
          const { rx, ry } = crowdAxes(crowd);
          return (
            <div
              key={crowd.id}
              data-crowd
              className={cn(
                "absolute rounded-full",
                active
                  ? "border-2 border-[#c4a574] bg-[#c4a574]/20"
                  : "border-2 border-dashed border-[#c4a574]/80 bg-[#c4a574]/10",
                editing && "cursor-grab",
              )}
              style={{
                left: `${crowd.x}%`,
                top: `${crowd.y}%`,
                width: `${Math.max(rx * 2, 8)}%`,
                height: `${Math.max(ry * 2, 8)}%`,
                transform: "translate(-50%, -50%)",
                zIndex: editing && active ? 40 : 5,
              }}
              onPointerDown={(e) => {
                if (!editing) {
                  e.stopPropagation();
                  downRef.current = { x: e.clientX, y: e.clientY };
                  return;
                }
                onSelectEdit?.({ kind: "crowd", id: crowd.id });
                startDrag(e, {
                  type: "crowd",
                  id: crowd.id,
                  x: crowd.x,
                  y: crowd.y,
                  px: e.clientX,
                  py: e.clientY,
                });
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                if (editing) endDrag(e);
                else tap(e.clientX, e.clientY);
              }}
              onPointerEnter={() =>
                setTip(`人群 · ${crowd.label} · 約 ${crowd.size} 人`)
              }
            >
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-background/80 px-1 text-[9px] leading-4 text-foreground whitespace-nowrap">
                {crowd.label}
              </span>
              {editing && active && (
                <button
                  type="button"
                  aria-label="縮放人群"
                  className="absolute -bottom-1.5 -right-1.5 size-3.5 cursor-nwse-resize rounded-full border border-background bg-[#c4a574]"
                  onPointerDown={(e) => {
                    startDrag(e, {
                      type: "resize-crowd",
                      id: crowd.id,
                      rx,
                      ry,
                      px: e.clientX,
                      py: e.clientY,
                    });
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    dragRef.current = null;
                    setDragging(false);
                    downRef.current = null;
                  }}
                />
              )}
            </div>
          );
        })}
        {scene.npcs.map((npc) => (
          <Marker
            key={npc.id}
            x={npc.x}
            y={npc.y}
            color={npc.color}
            label={editing ? trueNameOf(npc) : publicName(npc)}
            facing={facingOf(npc)}
            active={selected?.kind === "npc" && selected.id === npc.id}
            dragging={dragging}
            title={`${editing ? trueNameOf(npc) : publicName(npc)} · ${PROXIMITY_LABEL[proximity(dist(scene.playerPos, npc, sceneAspect(scene)))]}`}
            onEnter={() =>
              setTip(
                `${editing ? trueNameOf(npc) : publicName(npc)} · ${PROXIMITY_LABEL[proximity(dist(scene.playerPos, npc, sceneAspect(scene)))]}`,
              )
            }
            onPointerDown={(e) => {
              if (editing) {
                onSelectEdit?.({ kind: "npc", id: npc.id });
                startDrag(e, {
                  type: "npc",
                  id: npc.id,
                  x: npc.x,
                  y: npc.y,
                  px: e.clientX,
                  py: e.clientY,
                });
              } else {
                downRef.current = { x: e.clientX, y: e.clientY };
              }
            }}
            onPointerUp={(e) => {
              if (editing) endDrag(e, "npc", npc.id);
              else tap(e.clientX, e.clientY, "npc", npc.id);
            }}
            disabled={disabled}
          />
        ))}
        <Marker
          x={player.x}
          y={player.y}
          color="var(--color-marker-player)"
          label="你"
          ring
          active={selected?.kind === "player"}
          dragging={dragging}
          title={player.name}
          onEnter={() => setTip(`${player.name}（你）`)}
          onPointerDown={(e) => {
            if (editing) {
              onSelectEdit?.({ kind: "player" });
              startDrag(e, {
                type: "player",
                x: player.x,
                y: player.y,
                px: e.clientX,
                py: e.clientY,
              });
            } else {
              downRef.current = { x: e.clientX, y: e.clientY };
            }
          }}
          onPointerUp={(e) => {
            if (editing) endDrag(e, "self");
            else tap(e.clientX, e.clientY, "self");
          }}
          disabled={disabled}
        />
        {(tip || hover) && (
          <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 font-mono text-[10px] tabular-nums text-muted-foreground">
            {tip ? `${tip}  ` : null}
            {hover
              ? `${hover.x.toFixed(0)}, ${hover.y.toFixed(0)}`
              : `${player.x.toFixed(0)}, ${player.y.toFixed(0)}`}
          </div>
        )}
      <p className="sr-only">
        {editing
          ? "編輯模式：拖曳移動，拉右下角縮放物件框。點選開啟設定。不會推進回合。"
          : "點人物、物件或空地會先問要做什麼，不會直接推進回合。"}
      </p>
    </div>
  );
}

function Marker({
  x,
  y,
  color,
  label,
  ring,
  title,
  facing,
  active,
  dragging,
  onPointerDown,
  onPointerUp,
  onEnter,
  disabled,
}: {
  x: number;
  y: number;
  color: string;
  label: string;
  ring?: boolean;
  title?: string;
  facing?: number;
  active?: boolean;
  dragging?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onEnter?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      data-marker
      disabled={disabled}
      title={title}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        onPointerUp?.(e);
      }}
      onPointerEnter={onEnter}
      className={cn(
        "absolute z-10 flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1",
        active && "z-[40]",
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transition: dragging
          ? "none"
          : "left 420ms cubic-bezier(0.22,1,0.36,1), top 420ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <span
        className={cn(
          "relative block size-3.5 rounded-full shadow-[0_0_0_2px_rgb(11_11_12_/_0.8)]",
          ring && "size-4 shadow-[0_0_0_3px_rgb(11_11_12_/_0.85),0_0_0_5px_rgb(236_236_232_/_0.7)]",
          active && "shadow-[0_0_0_3px_rgb(11_11_12_/_0.85),0_0_0_5px_var(--color-primary)]",
        )}
        style={{ background: color }}
      >
        {typeof facing === "number" ? (
          <span
            className="absolute left-1/2 top-1/2 h-2 w-0.5 origin-bottom rounded-sm bg-background"
            style={{ transform: `translate(-50%, -100%) rotate(${facing}deg)` }}
          />
        ) : null}
      </span>
      <span className="rounded-sm bg-background/75 px-1 text-[10px] leading-4 text-foreground whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

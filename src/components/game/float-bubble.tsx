import { useRef, type ReactNode } from "react";
import { GripHorizontal } from "lucide-react";
import { clamp } from "@/lib/utils";

export type BubbleRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  minimized?: boolean;
};

type Props = {
  title: string;
  rect: BubbleRect;
  z: number;
  bounds: { w: number; h: number };
  minW?: number;
  minH?: number;
  onChange: (rect: BubbleRect) => void;
  onFocus: () => void;
  onClose?: () => void;
  closeLabel?: string;
  showOpacity?: boolean;
  showMinimize?: boolean;
  children: ReactNode;
};

export function FloatBubble({
  title,
  rect,
  z,
  bounds,
  minW = 220,
  minH = 120,
  onChange,
  onFocus,
  onClose,
  closeLabel = "關閉",
  showOpacity = true,
  showMinimize = true,
  children,
}: Props) {
  const drag = useRef<{
    kind: "move" | "resize";
    x: number;
    y: number;
    w: number;
    h: number;
    px: number;
    py: number;
  } | null>(null);

  const HEADER = 32;

  function confine(next: BubbleRect): BubbleRect {
    const w = clamp(next.w, minW, Math.max(minW, bounds.w - 8));
    const h = clamp(next.h, minH, Math.max(minH, bounds.h - 8));
    const shown = next.minimized ? HEADER : h;
    return {
      x: clamp(next.x, 4, Math.max(4, bounds.w - w - 4)),
      y: clamp(next.y, 4, Math.max(4, bounds.h - shown - 4)),
      w,
      h,
      opacity: clamp(next.opacity, 0.25, 1),
      minimized: Boolean(next.minimized),
    };
  }

  function start(kind: "move" | "resize", e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = {
      kind,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      px: e.clientX,
      py: e.clientY,
    };
    onFocus();
  }

  function move(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (d.kind === "move") {
      onChange(confine({ ...rect, x: d.x + dx, y: d.y + dy }));
    } else if (!rect.minimized) {
      onChange(confine({ ...rect, w: d.w + dx, h: d.h + dy }));
    }
  }

  function end() {
    drag.current = null;
  }

  const alpha = showOpacity ? Math.round(rect.opacity * 100) : 100;
  const minimized = Boolean(rect.minimized);

  return (
    <div
      className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-2xl border shadow-lg backdrop-blur-md"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: minimized ? HEADER : rect.h,
        zIndex: z,
        backgroundColor: `color-mix(in srgb, var(--color-card) ${alpha}%, transparent)`,
        borderColor: `color-mix(in srgb, var(--color-border) ${alpha}%, transparent)`,
      }}
      onPointerDown={onFocus}
    >
      <div
        className="flex h-8 shrink-0 cursor-grab items-center gap-1.5 border-b border-border/60 px-2 active:cursor-grabbing"
        onPointerDown={(e) => start("move", e)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <GripHorizontal className="size-3.5 shrink-0 text-muted-foreground" />
        <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{title}</p>
        {showOpacity && !minimized ? (
        <label
          className="flex items-center gap-1 text-[10px] text-muted-foreground"
          onPointerDown={(e) => e.stopPropagation()}
        >
          透明
          <input
            type="range"
            min={25}
            max={100}
            value={alpha}
            aria-label="透明度"
            className="h-1 w-16 cursor-pointer accent-primary"
            onChange={(e) =>
              onChange(confine({ ...rect, opacity: Number(e.target.value) / 100 }))
            }
          />
        </label>
        ) : null}
        {showMinimize ? (
          <button
            type="button"
            className="rounded-sm px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={minimized ? "還原視窗" : "最小化"}
            title={minimized ? "還原" : "最小化"}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onChange(confine({ ...rect, minimized: !minimized }))}
          >
            {minimized ? "▢" : "–"}
          </button>
        ) : null}
        {onClose ? (
          <button
            type="button"
            className="rounded-sm px-1.5 py-0.5 text-[13px] leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={closeLabel}
            title={closeLabel}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
          >
            ×
          </button>
        ) : null}
      </div>
      {minimized ? null : <div className="min-h-0 flex-1 overflow-hidden">{children}</div>}
      {minimized ? null : (
      <button
        type="button"
        aria-label="縮放"
        className="absolute bottom-0.5 right-0.5 size-3.5 cursor-nwse-resize rounded-sm border border-border bg-muted"
        onPointerDown={(e) => start("resize", e)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      )}
    </div>
  );
}

const STORE = "tuzhi:bubbles";

export function loadBubbleRects(): {
  log?: BubbleRect;
  input?: BubbleRect;
  player?: BubbleRect;
  edit?: BubbleRect;
} {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return {};
    return JSON.parse(raw) as {
      log?: BubbleRect;
      input?: BubbleRect;
      player?: BubbleRect;
      edit?: BubbleRect;
    };
  } catch {
    return {};
  }
}

export function saveBubbleRects(rects: {
  log: BubbleRect;
  input: BubbleRect;
  player: BubbleRect;
  edit?: BubbleRect;
}): void {
  try {
    localStorage.setItem(STORE, JSON.stringify(rects));
  } catch {
    /* ignore */
  }
}

export function defaultBubbleRects(box: { w: number; h: number }): {
  log: BubbleRect;
  input: BubbleRect;
  player: BubbleRect;
  edit: BubbleRect;
} {
  const w = Math.min(352, Math.max(240, box.w * 0.32));
  const inputH = Math.min(220, Math.max(140, box.h * 0.22));
  const logH = Math.min(360, Math.max(160, box.h * 0.38));
  const x = Math.max(8, box.w - w - 12);
  const inputY = Math.max(8, box.h - inputH - 40);
  const logY = Math.max(60, inputY - logH - 10);
  const pw = Math.min(300, Math.max(240, box.w * 0.24));
  const ph = Math.min(380, Math.max(200, box.h * 0.42));
  const ew = Math.min(320, Math.max(260, box.w * 0.26));
  const eh = Math.min(480, Math.max(240, box.h * 0.52));
  return {
    log: { x, y: logY, w, h: logH, opacity: 0.92 },
    input: { x, y: inputY, w, h: inputH, opacity: 0.92 },
    player: {
      x: 12,
      y: Math.max(64, box.h - ph - 44),
      w: pw,
      h: ph,
      opacity: 0.92,
    },
    edit: {
      x: Math.min(Math.max(12, box.w * 0.18), Math.max(12, box.w - ew - 16)),
      y: 72,
      w: ew,
      h: eh,
      opacity: 1,
    },
  };
}

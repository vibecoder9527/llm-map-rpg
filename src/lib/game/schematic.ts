import type { MapAspect, MapObject } from "./types";
import { aspectWH } from "./distance";

const KIND_FILL: Record<MapObject["kind"], string> = {
  furniture: "#3a342c",
  door: "#4a4034",
  landmark: "#2f3330",
  hazard: "#3a2a28",
  container: "#33302c",
  other: "#323232",
};

export function renderSchematic(
  objects: MapObject[],
  title: string,
  aspect: MapAspect = "1:1",
): string {
  const { w: aw, h: ah } = aspectWH(aspect);
  const long = 768;
  const width = aw >= ah ? long : Math.round(long * (aw / ah));
  const height = ah >= aw ? long : Math.round(long * (ah / aw));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#1a1814";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(236,236,232,0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo((i / 10) * width, 0);
    ctx.lineTo((i / 10) * width, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, (i / 10) * height);
    ctx.lineTo(width, (i / 10) * height);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(236,236,232,0.18)";
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  for (const obj of objects) {
    const w = Math.max(24, (obj.w / 100) * width);
    const h = Math.max(24, (obj.h / 100) * height);
    const x = (obj.x / 100) * width - w / 2;
    const y = (obj.y / 100) * height - h / 2;
    ctx.fillStyle = KIND_FILL[obj.kind] ?? KIND_FILL.other;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(236,236,232,0.22)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "rgba(236,236,232,0.72)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(obj.label, x + w / 2, y + h / 2, w - 8);
  }

  ctx.fillStyle = "rgba(236,236,232,0.35)";
  ctx.font = "13px serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(title, 28, 28);

  return canvas.toDataURL("image/jpeg", 0.86);
}

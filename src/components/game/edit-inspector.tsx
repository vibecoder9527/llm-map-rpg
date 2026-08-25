import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Character, Crowd, MapObject, Vec2 } from "@/lib/game/types";
import { shortLook } from "@/lib/game/identity";
import { objectLayer } from "@/lib/game/actions";
import { ALERT_LABEL, facingOf } from "@/lib/game/vision";
import type { AlertState } from "@/lib/game/types";

const KINDS: MapObject["kind"][] = [
  "furniture",
  "door",
  "landmark",
  "hazard",
  "container",
  "other",
];

const KIND_LABEL: Record<MapObject["kind"], string> = {
  furniture: "家具",
  door: "門／出口",
  landmark: "地標",
  hazard: "危險",
  container: "容器",
  other: "其他",
};

const NPC_COLORS = ["#7d9aa3", "#a67c6d", "#8a8e7a", "#7a7e8c", "#9a8b78", "#c5c8cf", "#b86a5a"];

export type EditTarget =
  | { kind: "object"; obj: MapObject }
  | { kind: "crowd"; crowd: Crowd }
  | { kind: "npc"; npc: Character };

type Props = {
  target: EditTarget | null;
  onClose: () => void;
  onChangeObject: (obj: MapObject) => void;
  onChangeCrowd: (crowd: Crowd) => void;
  onChangeNpc: (npc: Character) => void;
  onDelete: () => void;
  chrome?: boolean;
};

export function EditInspector({
  target,
  onClose,
  onChangeObject,
  onChangeCrowd,
  onChangeNpc,
  onDelete,
  chrome = true,
}: Props) {
  if (!target) return null;
  const title =
    target.kind === "object" ? "物件框" : target.kind === "crowd" ? "人群" : "人物設定";
  const hint =
    target.kind === "object"
      ? "可在地圖上拖曳，拉右下角縮放。"
      : target.kind === "crowd"
        ? "橢圓框，可正圓可扁長。可疊在物件上。拖曳移動，拉角改橫縱半徑。"
        : "可在地圖上拖曳圓點改位置。";
  const form =
    target.kind === "object" ? (
      <ObjectForm obj={target.obj} onChange={onChangeObject} onDelete={onDelete} />
    ) : target.kind === "crowd" ? (
      <CrowdForm crowd={target.crowd} onChange={onChangeCrowd} onDelete={onDelete} />
    ) : (
      <NpcForm npc={target.npc} onChange={onChangeNpc} onDelete={onDelete} />
    );
  if (!chrome) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">{hint}</p>
        {form}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <Button type="button" size="icon" variant="ghost" aria-label="關閉" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>
      {form}
    </div>
  );
}

function ObjectForm({
  obj,
  onChange,
  onDelete,
}: {
  obj: MapObject;
  onChange: (obj: MapObject) => void;
  onDelete: () => void;
}) {
  function patch(p: Partial<MapObject>) {
    onChange({ ...obj, ...p });
  }
  return (
    <div className="flex flex-col gap-3">
      <Field label="名稱">
        <Input value={obj.label} onChange={(e) => patch({ label: e.target.value })} />
      </Field>
      <Field label="種類">
        <select
          className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 text-sm"
          value={obj.kind}
          onChange={(e) => patch({ kind: e.target.value as MapObject["kind"] })}
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="說明（給主持人認地圖用）">
        <Textarea rows={2} value={obj.desc} onChange={(e) => patch({ desc: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="X">
          <Input
            type="number"
            value={Math.round(obj.x)}
            onChange={(e) => patch({ x: Number(e.target.value) })}
          />
        </Field>
        <Field label="Y">
          <Input
            type="number"
            value={Math.round(obj.y)}
            onChange={(e) => patch({ y: Number(e.target.value) })}
          />
        </Field>
        <Field label="寬">
          <Input
            type="number"
            value={Math.round(obj.w)}
            onChange={(e) => patch({ w: Number(e.target.value) })}
          />
        </Field>
        <Field label="高">
          <Input
            type="number"
            value={Math.round(obj.h)}
            onChange={(e) => patch({ h: Number(e.target.value) })}
          />
        </Field>
        <Field label="層（大的在上）">
          <Input
            type="number"
            min={0}
            max={20}
            value={objectLayer(obj)}
            onChange={(e) => patch({ z: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>
      <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="size-4" />
        刪除此物件
      </Button>
    </div>
  );
}

function CrowdForm({
  crowd,
  onChange,
  onDelete,
}: {
  crowd: Crowd;
  onChange: (crowd: Crowd) => void;
  onDelete: () => void;
}) {
  function patch(p: Partial<Crowd>) {
    onChange({ ...crowd, ...p });
  }
  return (
    <div className="flex flex-col gap-3">
      <Field label="稱呼（給主持認這團人）">
        <Input value={crowd.label} onChange={(e) => patch({ label: e.target.value })} />
      </Field>
      <Field label="說明">
        <Textarea rows={2} value={crowd.desc} onChange={(e) => patch({ desc: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="約幾人">
          <Input
            type="number"
            value={crowd.size}
            onChange={(e) => patch({ size: Math.max(1, Number(e.target.value) || 1) })}
          />
        </Field>
        <Field label="橫半徑">
          <Input
            type="number"
            value={Math.round(crowd.rx)}
            onChange={(e) => patch({ rx: Number(e.target.value) })}
          />
        </Field>
        <Field label="縱半徑">
          <Input
            type="number"
            value={Math.round(crowd.ry)}
            onChange={(e) => patch({ ry: Number(e.target.value) })}
          />
        </Field>
        <Field label="X">
          <Input
            type="number"
            value={Math.round(crowd.x)}
            onChange={(e) => patch({ x: Number(e.target.value) })}
          />
        </Field>
        <Field label="Y">
          <Input
            type="number"
            value={Math.round(crowd.y)}
            onChange={(e) => patch({ y: Number(e.target.value) })}
          />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">
        已從這團走出具名角色 {crowd.namedOut} 人。只抽出一人時這團不會消失。
      </p>
      <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="size-4" />
        刪除此人群
      </Button>
    </div>
  );
}

function NpcForm({
  npc,
  onChange,
  onDelete,
}: {
  npc: Character;
  onChange: (npc: Character) => void;
  onDelete: () => void;
}) {
  function patch(p: Partial<Character>) {
    onChange({ ...npc, ...p });
  }
  return (
    <div className="flex flex-col gap-3">
      <Field label="真名（主持用，玩家未識出時看不見）">
        <Input
          value={npc.trueName ?? npc.name}
          onChange={(e) => patch({ trueName: e.target.value })}
        />
      </Field>
      <Field label="玩家所知之名">
        <Input
          value={npc.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="識出後地圖上顯示這個"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={npc.known !== false}
          onChange={(e) => patch({ known: e.target.checked })}
        />
        玩家已識出此人
      </label>
      <Field label="年齡">
        <Input
          type="number"
          min={1}
          max={120}
          value={npc.age || ""}
          onChange={(e) => patch({ age: Number(e.target.value) || 0 })}
        />
      </Field>
      <Field label="性別">
        <Input
          value={npc.gender ?? ""}
          onChange={(e) => patch({ gender: e.target.value })}
          placeholder="男／女／其他"
        />
      </Field>
      <Field label="種族">
        <Input
          value={npc.race ?? ""}
          onChange={(e) => patch({ race: e.target.value })}
          placeholder="人類、精靈…"
        />
      </Field>
      <Field label="標籤（對上 lorebook）">
        <Input
          value={(npc.tags ?? []).join("、")}
          onChange={(e) =>
            patch({
              tags: e.target.value
                .split(/[、,，]/)
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          placeholder="長老、祭司、碼頭"
        />
      </Field>
      <Field label="未知時的稱呼">
        <Input
          value={npc.alias ?? ""}
          onChange={(e) => patch({ alias: e.target.value })}
          placeholder={shortLook(npc.clothing) || shortLook(npc.appearance) || "外觀簡稱"}
        />
      </Field>
      <Field label="顏色">
        <div className="flex flex-wrap gap-2">
          {NPC_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              className="size-7 rounded-full border border-border"
              style={{
                background: c,
                boxShadow: npc.color === c ? "0 0 0 2px var(--color-foreground)" : undefined,
              }}
              onClick={() => patch({ color: c })}
            />
          ))}
        </div>
      </Field>
      <Field label="此刻狀態">
        <Input value={npc.status} onChange={(e) => patch({ status: e.target.value })} />
      </Field>
      <Field label="朝向（0＝上，順時針）">
        <Input
          type="number"
          min={0}
          max={359}
          value={Math.round(facingOf(npc))}
          onChange={(e) => patch({ facing: Number(e.target.value) || 0 })}
        />
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(
            [
              [0, "上"],
              [90, "右"],
              [180, "下"],
              [270, "左"],
            ] as const
          ).map(([deg, lab]) => (
            <Button
              key={deg}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => patch({ facing: deg })}
            >
              {lab}
            </Button>
          ))}
        </div>
      </Field>
      <Field label="警覺">
        <select
          className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 text-sm"
          value={npc.alert ?? "unaware"}
          onChange={(e) => patch({ alert: e.target.value as AlertState })}
        >
          {(Object.keys(ALERT_LABEL) as AlertState[]).map((k) => (
            <option key={k} value={k}>
              {ALERT_LABEL[k]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="短期目標">
        <Input
          value={npc.goal ?? ""}
          onChange={(e) => patch({ goal: e.target.value })}
          placeholder="這一陣子想做成什麼"
        />
      </Field>
      <Field label="近期記憶">
        <Textarea
          rows={2}
          value={npc.memory ?? ""}
          onChange={(e) => patch({ memory: e.target.value })}
          placeholder="給下一拍的自己，會被思考壓縮改寫"
        />
      </Field>
      <Field label="外觀（五官與身體，不含衣服）">
        <Textarea
          rows={3}
          value={npc.appearance}
          onChange={(e) => patch({ appearance: e.target.value })}
          placeholder="髮、眉眼鼻口、膚色、體型、手足；女性非老年還要寫胸、腹、臀"
        />
      </Field>
      <Field label="衣著（從頭到腳）">
        <Textarea
          rows={3}
          value={npc.clothing ?? ""}
          onChange={(e) => patch({ clothing: e.target.value })}
          placeholder="帽、上衣、下身、鞋、外套、飾品"
        />
      </Field>
      <Field label="背景">
        <Textarea rows={2} value={npc.bio} onChange={(e) => patch({ bio: e.target.value })} />
      </Field>
      <Field label="性格">
        <Textarea
          rows={2}
          value={npc.personality ?? ""}
          onChange={(e) => patch({ personality: e.target.value })}
          placeholder="說話習慣、脾氣、底線"
        />
      </Field>
      {npc.portrait ? (
        <Button type="button" variant="outline" size="sm" onClick={() => patch({ portrait: undefined })}>
          清除立繪（下次走近會重畫）
        </Button>
      ) : null}
      <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="size-4" />
        移出此場景
      </Button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

export function PlayerForm({
  player,
  inventory,
  pos,
  editing,
  onChangePlayer,
  onChangeInventory,
}: {
  player: Character;
  inventory: string[];
  pos: Vec2;
  editing: boolean;
  onChangePlayer: (player: Character) => void;
  onChangeInventory: (inventory: string[]) => void;
}) {
  function patch(p: Partial<Character>) {
    onChangePlayer({ ...player, ...p });
  }
  if (!editing) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <p className="font-display text-base">{player.name}</p>
        <p className="text-sm text-muted-foreground">
          {[
            player.age && player.age > 0 ? `${player.age}歲` : "年齡未寫",
            player.gender?.trim() || "性別未寫",
            player.race?.trim() || "種族未寫",
          ].join(" · ")}
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          ({pos.x.toFixed(0)}, {pos.y.toFixed(0)})
        </p>
        <div>
          <p className="text-[11px] text-muted-foreground">外觀</p>
          <p className="text-sm leading-relaxed break-words">{player.appearance || "（未寫）"}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">衣著</p>
          <p className="text-sm leading-relaxed break-words">{player.clothing || "（未寫）"}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">背景</p>
          <p className="text-sm leading-relaxed break-words">{player.bio || "（未寫）"}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">此刻狀態</p>
          <p className="text-sm leading-relaxed break-words">{player.status || "（未寫）"}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">隨身</p>
          <p className="text-sm leading-relaxed break-words">
            {inventory.length ? inventory.join("、") : "空手"}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 p-3">
      <p className="text-[11px] text-muted-foreground">
        編輯模式：改這裡會寫進角色卡，影響之後的敘事。可在地圖上拖「你」改位置。
      </p>
      <Field label="姓名">
        <Input value={player.name} onChange={(e) => patch({ name: e.target.value })} />
      </Field>
      <Field label="年齡">
        <Input
          type="number"
          min={0}
          value={player.age || ""}
          onChange={(e) => patch({ age: Number(e.target.value) || 0 })}
        />
      </Field>
      <Field label="性別">
        <Input
          value={player.gender ?? ""}
          onChange={(e) => patch({ gender: e.target.value })}
          placeholder="男／女／其他"
        />
      </Field>
      <Field label="種族">
        <Input
          value={player.race ?? ""}
          onChange={(e) => patch({ race: e.target.value })}
          placeholder="人、精靈…"
        />
      </Field>
      <Field label="外觀（五官與身體，不含衣服）">
        <Textarea
          rows={3}
          value={player.appearance}
          onChange={(e) => patch({ appearance: e.target.value })}
          placeholder="髮、眉眼鼻口、膚色、體型、手足；女性非老年還要寫胸、腹、臀"
        />
      </Field>
      <Field label="衣著（從頭到腳）">
        <Textarea
          rows={3}
          value={player.clothing ?? ""}
          onChange={(e) => patch({ clothing: e.target.value })}
          placeholder="帽、上衣、下身、鞋、外套、飾品"
        />
      </Field>
      <Field label="背景">
        <Textarea rows={3} value={player.bio} onChange={(e) => patch({ bio: e.target.value })} />
      </Field>
      <Field label="此刻狀態">
        <Input value={player.status} onChange={(e) => patch({ status: e.target.value })} />
      </Field>
      <Field label="隨身（一行一件）">
        <Textarea
          rows={3}
          value={inventory.join("\n")}
          onChange={(e) =>
            onChangeInventory(
              e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
      </Field>
      <p className="font-mono text-[11px] text-muted-foreground">
        座標 ({pos.x.toFixed(0)}, {pos.y.toFixed(0)})
      </p>
    </div>
  );
}

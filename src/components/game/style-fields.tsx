import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DEFAULT_IMAGE_STYLE } from "@/lib/game/prompts";

const STYLE_CHIPS = [
  "水墨舊紙，低飽和手繪",
  "暗色古典油畫",
  "90年代 JRPG 像素",
  "吉卜力水彩",
  "單色銅版蝕刻",
  "賽博墨線",
];

export function StyleFields({
  mapStyle,
  portraitStyle,
  onChange,
}: {
  mapStyle: string;
  portraitStyle: string;
  onChange: (p: { mapStyle?: string; portraitStyle?: string }) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <StyleBlock
        label="地圖風格"
        hint="俯視地圖用。留空則用水墨舊紙。"
        value={mapStyle}
        onChange={(v) => onChange({ mapStyle: v })}
      />
      <StyleBlock
        label="角色圖風格"
        hint="全身立繪用。可與地圖不同。"
        value={portraitStyle}
        onChange={(v) => onChange({ portraitStyle: v })}
      />
      {mapStyle !== portraitStyle ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ portraitStyle: mapStyle })}>
            角色圖跟地圖
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ mapStyle: portraitStyle })}>
            地圖跟角色圖
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StyleBlock({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={DEFAULT_IMAGE_STYLE}
        rows={2}
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {STYLE_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

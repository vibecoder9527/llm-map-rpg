import { Link } from "@tanstack/react-router";
import { BookOpen, Compass, Contact, Settings, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TitleScreen() {
  return (
    <main className="relative grid-paper min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
      >
        <Dot x="18%" y="28%" />
        <Dot x="72%" y="22%" size="sm" />
        <Dot x="64%" y="68%" />
        <Dot x="30%" y="74%" size="sm" />
      </div>
      <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
        <p className="text-xs tracking-[0.28em] text-muted-foreground">
          TUZHI
        </p>
        <h1 className="mt-3 font-display text-6xl font-medium tracking-tight sm:text-7xl">
          圖誌
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          地圖上的座標是真的。遠在廳另一端的人聽不見你低語。每到新場所，會先畫出俯視圖，再把物件讀成文字。
        </p>
        <div className="mt-10 flex flex-col gap-3">
          <Button asChild size="lg" className="justify-between">
            <Link to="/new">
              開始新遊戲
              <Compass className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="justify-between">
            <Link to="/cards">
              從角色卡開始新遊戲
              <Contact className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="justify-between">
            <Link to="/saves">
              讀檔
              <BookOpen className="size-4" />
            </Link>
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="flex-1 justify-between whitespace-nowrap">
              <Link to="/settings">
                設定 API
                <Settings className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 justify-between whitespace-nowrap">
              <Link to="/new" search={{ sample: true }}>
                試玩樣本
                <Map className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <p className="mt-12 text-xs text-muted-foreground">
          圓點是人，不是精靈圖。點地圖走動。
        </p>
      </div>
    </main>
  );
}

function Dot({
  x,
  y,
  size = "md",
}: {
  x: string;
  y: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className="absolute rounded-full bg-foreground/25"
      style={{
        left: x,
        top: y,
        width: size === "sm" ? 8 : 12,
        height: size === "sm" ? 8 : 12,
      }}
    />
  );
}

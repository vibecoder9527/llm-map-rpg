import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as Settings, g as Compass, u as Map, v as BookOpen } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-qAxJO0mu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BoqtjjsQ.js
var import_jsx_runtime = require_jsx_runtime();
function TitleScreen() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative grid-paper min-h-dvh overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			"aria-hidden": true,
			className: "pointer-events-none absolute inset-0 opacity-40",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dot, {
					x: "18%",
					y: "28%"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dot, {
					x: "72%",
					y: "22%",
					size: "sm"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dot, {
					x: "64%",
					y: "68%"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dot, {
					x: "30%",
					y: "74%",
					size: "sm"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-[0.28em] text-muted-foreground",
					children: "TUZHI"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-6xl font-medium tracking-tight sm:text-7xl",
					children: "圖誌"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground",
					children: "地圖上的座標是真的。遠在廳另一端的人聽不見你低語。每到新場所，會先畫出俯視圖，再把物件讀成文字。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-10 flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "lg",
							className: "justify-between",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/new",
								children: ["開始新遊戲", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { className: "size-4" })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "secondary",
							size: "lg",
							className: "justify-between",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/saves",
								children: ["讀檔", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4" })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "outline",
								className: "flex-1 justify-between whitespace-nowrap",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/settings",
									children: ["設定 API", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4" })]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "outline",
								className: "flex-1 justify-between whitespace-nowrap",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/new",
									search: { sample: true },
									children: ["試玩樣本", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { className: "size-4" })]
								})
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-12 text-xs text-muted-foreground",
					children: "圓點是人，不是精靈圖。點地圖走動。"
				})
			]
		})]
	});
}
function Dot({ x, y, size = "md" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute rounded-full bg-foreground/25",
		style: {
			left: x,
			top: y,
			width: size === "sm" ? 8 : 12,
			height: size === "sm" ? 8 : 12
		}
	});
}
var SplitComponent = TitleScreen;
//#endregion
export { SplitComponent as component };

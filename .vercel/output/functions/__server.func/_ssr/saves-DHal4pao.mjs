import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as Trash2, n as Upload, y as ArrowLeft } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-qAxJO0mu.mjs";
import { a as loadGame, i as listSaves, o as useGameStore, r as importGameFile, t as deleteGame } from "./store-aj5Mlwov.mjs";
import { n as CardContent, t as Card } from "./card-CM7rUNRb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/saves-DHal4pao.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SavesView() {
	const [list, setList] = (0, import_react.useState)([]);
	const nav = useNavigate();
	const setGame = useGameStore((s) => s.setGame);
	const fileRef = (0, import_react.useRef)(null);
	async function refresh() {
		setList(await listSaves());
	}
	(0, import_react.useEffect)(() => {
		refresh();
	}, []);
	async function open(id) {
		const game = await loadGame(id);
		if (!game) {
			toast.error("讀檔失敗");
			return;
		}
		await setGame(game, false);
		await nav({ to: "/play" });
	}
	async function remove(id) {
		await deleteGame(id);
		toast.success("已刪除");
		await refresh();
	}
	async function onImport(file) {
		try {
			const game = await importGameFile(file);
			await setGame(game, false);
			toast.success("已匯入");
			await nav({ to: "/play" });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "匯入失敗");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-dvh max-w-xl px-5 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "ghost",
				size: "sm",
				className: "-ml-2 mb-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), "返回"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl",
					children: "遊玩紀錄"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "存在這台裝置裡。"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: fileRef,
					type: "file",
					accept: "application/json",
					className: "hidden",
					onChange: (e) => {
						const f = e.target.files?.[0];
						if (f) onImport(f);
						e.target.value = "";
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "outline",
					size: "sm",
					onClick: () => fileRef.current?.click(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), "匯入"]
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-col gap-3",
				children: [list.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "還沒有存檔。"
				}), list.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "flex items-start justify-between gap-3 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "min-w-0 flex-1 text-left",
						onClick: () => void open(s.id),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-base",
								children: s.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 truncate text-xs text-muted-foreground",
								children: [
									s.playerName,
									" · ",
									s.sceneName,
									" · 第 ",
									s.turnCount,
									" 回"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[11px] tabular-nums text-muted-foreground",
								children: new Date(s.updatedAt).toLocaleString("zh-TW")
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "icon",
						variant: "ghost",
						"aria-label": "刪除",
						onClick: () => void remove(s.id),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
					})]
				}) }, s.id))]
			})
		]
	});
}
var SplitComponent = SavesView;
//#endregion
export { SplitComponent as component };

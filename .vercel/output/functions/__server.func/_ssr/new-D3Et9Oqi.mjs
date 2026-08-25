import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as PenLine, f as Loader, y as ArrowLeft } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as uid, n as Route$3, r as cn } from "./router-BHD8hO0Q.mjs";
import { t as Button } from "./button-qAxJO0mu.mjs";
import { n as Label, t as Input } from "./label-DP3cTMuM.mjs";
import { o as loadApiSettings } from "./functions-CGjI6SfJ.mjs";
import { a as generateTheme, o as generateWorld, r as Textarea, s as makeSample, t as GeneratingOverlay, u as startNewGame } from "./engine-BskshnMU.mjs";
import { o as useGameStore } from "./store-aj5Mlwov.mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/new-D3Et9Oqi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-10 items-center gap-1 rounded-lg bg-secondary p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = "TabsList";
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors data-[state=active]:bg-card data-[state=active]:text-foreground", className),
	...props
}));
TabsTrigger.displayName = "TabsTrigger";
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-4", className),
	...props
}));
TabsContent.displayName = "TabsContent";
var THEME_CHIPS = [
	"雨夜港口的密語",
	"山城書院的禁書",
	"末班車上的無名站",
	"茶樓後巷的帳房",
	"廢園夜市的燈籠",
	"深林哨站的無線電"
];
function Wizard({ sample }) {
	const nav = useNavigate();
	const { setGame, setBusy, busy, setError, error } = useGameStore();
	const [step, setStep] = (0, import_react.useState)(1);
	const [theme, setTheme] = (0, import_react.useState)("");
	const [playerHint, setPlayerHint] = (0, import_react.useState)("");
	const [extra, setExtra] = (0, import_react.useState)("");
	const [draft, setDraft] = (0, import_react.useState)(null);
	const [spin, setSpin] = (0, import_react.useState)(null);
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
		setBusy({
			stage: "撰寫世界",
			detail: theme
		});
		setError(null);
		try {
			const world = await generateWorld(loadApiSettings(), {
				theme,
				playerHint,
				extra
			});
			setDraft(world);
			setStep(2);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "生成失敗";
			setError(msg);
			toast.error(msg);
		} finally {
			setBusy(null);
		}
	}
	async function enter() {
		if (!draft) return;
		setBusy({ stage: "繪製地圖" });
		setError(null);
		try {
			const game = await startNewGame(loadApiSettings(), draft, (stage, detail) => setBusy({
				stage,
				detail
			}));
			await setGame(game);
			await nav({ to: "/play" });
		} catch (err) {
			const msg = err instanceof Error ? err.message : "開場失敗";
			setError(msg);
			toast.error(msg);
		} finally {
			setBusy(null);
		}
	}
	if (sample) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "雨夜〈北風亭〉"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted-foreground",
				children: "樣本場景已畫好地圖、標好物件。角色是圓點。走進吧台才跟得上阿秋說話；站在門口對爐邊喊，對方聽不見。"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					onClick: () => void runSample(),
					children: "踏進北風亭"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "outline",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/new",
						children: "改為自訂主題"
					})
				})]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-dvh max-w-2xl px-5 py-10",
		children: [
			busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GeneratingOverlay, {
				stage: busy.stage,
				detail: busy.detail
			}),
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.2em] text-muted-foreground",
				children: step === 1 ? "01 主題" : "02 世界"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-3xl",
				children: step === 1 ? "這趟要去哪" : "核對再踏入"
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
				children: error
			}),
			step === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-col gap-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "主題" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: theme,
								onChange: (e) => setTheme(e.target.value),
								placeholder: "例如：雨夜港口，一家不肯打烊的旅店",
								rows: 3
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: THEME_CHIPS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground",
									onClick: () => setTheme(c),
									children: c
								}, c))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								className: "w-fit",
								onClick: () => void inventTheme(),
								disabled: spin === "theme",
								children: [spin === "theme" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loader, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { className: "size-4" }), "幫我擬題"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "角色提示（可空）" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: playerHint,
								onChange: (e) => setPlayerHint(e.target.value),
								placeholder: "剛下船的記帳助手"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "額外設定（可空）" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: extra,
								onChange: (e) => setExtra(e.target.value),
								placeholder: "不要魔法，偏寫實"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						onClick: () => void buildWorld(),
						children: "生成世界觀與開場"
					})
				]
			}),
			step === 2 && draft && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					defaultValue: "lore",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "lore",
								children: "Lorebook"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "player",
								children: "角色"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "scene",
								children: "場景"
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "lore",
							className: "flex flex-col gap-3",
							children: [draft.lorebook.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoreEditor, {
								entry: e,
								onChange: (next) => setDraft({
									...draft,
									lorebook: draft.lorebook.map((x, j) => j === i ? next : x)
								})
							}, e.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								className: "w-fit",
								onClick: () => setDraft({
									...draft,
									lorebook: [...draft.lorebook, {
										id: uid("lb"),
										title: "新條目",
										content: "",
										tags: []
									}]
								}),
								children: "新增條目"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "player",
							className: "flex flex-col gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex flex-col gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "姓名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: draft.player.name,
										onChange: (e) => setDraft({
											...draft,
											player: {
												...draft.player,
												name: e.target.value
											}
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex flex-col gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "背景" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										rows: 4,
										value: draft.player.bio,
										onChange: (e) => setDraft({
											...draft,
											player: {
												...draft.player,
												bio: e.target.value
											}
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex flex-col gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "外觀" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										rows: 3,
										value: draft.player.appearance,
										onChange: (e) => setDraft({
											...draft,
											player: {
												...draft.player,
												appearance: e.target.value
											}
										})
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "scene",
							className: "flex flex-col gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex flex-col gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "場所" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: draft.scene.name,
										onChange: (e) => setDraft({
											...draft,
											scene: {
												...draft.scene,
												name: e.target.value
											}
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex flex-col gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "說明" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										rows: 4,
										value: draft.scene.summary,
										onChange: (e) => setDraft({
											...draft,
											scene: {
												...draft.scene,
												summary: e.target.value
											}
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										"NPC ",
										draft.npcs.length,
										" 人：",
										draft.npcs.map((n) => n.name).join("、") || "無"
									]
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setStep(1),
						children: "返回主題"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "flex-1",
						size: "lg",
						onClick: () => void enter(),
						children: "繪製地圖並開始"
					})]
				})]
			})
		]
	});
}
function LoreEditor({ entry, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value: entry.title,
			onChange: (e) => onChange({
				...entry,
				title: e.target.value
			}),
			className: "h-9 border-0 bg-transparent px-1"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
			rows: 3,
			value: entry.content,
			onChange: (e) => onChange({
				...entry,
				content: e.target.value
			}),
			className: "mt-1 min-h-16 border-0 bg-transparent px-1"
		})]
	});
}
function NewPage() {
	const { sample } = Route$3.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wizard, { sample });
}
//#endregion
export { NewPage as component };

import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as Settings, d as MapPin, h as Download, l as Menu, m as EyeOff, o as Send, p as Eye, s as Save, t as X, v as BookOpen } from "../_libs/lucide-react.mjs";
import { a as DialogPortal, i as DialogOverlay, n as DialogClose, o as DialogTitle, r as DialogContent, s as DialogTrigger, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { r as cn } from "./router-BHD8hO0Q.mjs";
import { t as Button } from "./button-qAxJO0mu.mjs";
import { o as loadApiSettings } from "./functions-CGjI6SfJ.mjs";
import { c as nearestObject, d as takeTurn, i as dist, l as proximity, n as PROXIMITY_LABEL, r as Textarea, t as GeneratingOverlay } from "./engine-BskshnMU.mjs";
import { n as exportGame, o as useGameStore } from "./store-aj5Mlwov.mjs";
import { t as Root } from "../_libs/radix-ui__react-separator.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/play-BKnIzPT8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", {
	variants: { variant: {
		default: "border-transparent bg-secondary text-foreground",
		outline: "border-border text-muted-foreground",
		accent: "border-transparent bg-primary text-primary-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var Separator = import_react.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	decorative,
	orientation,
	className: cn("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className),
	...props
}));
Separator.displayName = "Separator";
var Sheet = Dialog;
var SheetTrigger = DialogTrigger;
var SheetContent = import_react.forwardRef(({ className, children, side = "right", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-background/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
	ref,
	className: cn("fixed z-50 flex flex-col bg-card border-border shadow-lg duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out", side === "right" && "inset-y-0 right-0 h-full w-full max-w-md border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right", side === "left" && "inset-y-0 left-0 h-full w-full max-w-md border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left", side === "bottom" && "inset-x-0 bottom-0 max-h-[80vh] border-t rounded-t-xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm text-muted-foreground opacity-70 hover:opacity-100",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "關閉"
		})]
	})]
})] }));
SheetContent.displayName = "SheetContent";
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col gap-1.5 p-5 pr-12", className),
	...props
});
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
	ref,
	className: cn("font-display text-lg font-medium", className),
	...props
}));
SheetTitle.displayName = "SheetTitle";
function MapView({ scene, player, showObjects = false, onWalk, onNpc, onObject, disabled }) {
	const wrapRef = (0, import_react.useRef)(null);
	const [hover, setHover] = (0, import_react.useState)(null);
	const [tip, setTip] = (0, import_react.useState)(null);
	function toPct(e) {
		const el = wrapRef.current;
		if (!el) return null;
		const r = el.getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width * 100;
		const y = (e.clientY - r.top) / r.height * 100;
		if (x < 0 || y < 0 || x > 100 || y > 100) return null;
		return {
			x,
			y
		};
	}
	function handleClick(e) {
		if (disabled) return;
		const pos = toPct(e);
		if (!pos) return;
		const target = e.target;
		if (target.closest("[data-marker]") || target.closest("[data-obj]")) return;
		onWalk(pos, nearestObject(pos, scene.objects));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: wrapRef,
			className: cn("relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted select-none", disabled ? "cursor-wait" : "cursor-crosshair"),
			onPointerDown: handleClick,
			onPointerMove: (e) => setHover(toPct(e)),
			onPointerLeave: () => {
				setHover(null);
				setTip(null);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: scene.mapImage,
					alt: scene.name,
					draggable: false,
					className: "pointer-events-none absolute inset-0 size-full object-cover"
				}),
				showObjects && scene.objects.map((obj) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"data-obj": true,
					disabled,
					className: "absolute border border-primary/30 bg-primary/5 hover:bg-primary/15",
					style: {
						left: `${obj.x}%`,
						top: `${obj.y}%`,
						width: `${obj.w}%`,
						height: `${obj.h}%`,
						transform: "translate(-50%, -50%)"
					},
					onPointerDown: (e) => {
						e.stopPropagation();
						onObject(obj);
					},
					onPointerEnter: () => setTip(obj.label),
					"aria-label": obj.label
				}, obj.id)),
				scene.npcs.map((npc) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Marker, {
					x: npc.x,
					y: npc.y,
					color: npc.color,
					label: npc.name,
					title: `${npc.name} · ${PROXIMITY_LABEL[proximity(dist(scene.playerPos, npc))]}`,
					onEnter: () => setTip(`${npc.name} · ${PROXIMITY_LABEL[proximity(dist(scene.playerPos, npc))]}`),
					onClick: () => onNpc(npc),
					disabled
				}, npc.id)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Marker, {
					x: player.x,
					y: player.y,
					color: "var(--color-marker-player)",
					label: "你",
					ring: true,
					title: player.name,
					onEnter: () => setTip(`${player.name}（你）`),
					disabled
				}),
				(tip || hover) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-none absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 font-mono text-[10px] tabular-nums text-muted-foreground",
					children: [tip ? `${tip}  ` : null, hover ? `${hover.x.toFixed(0)}, ${hover.y.toFixed(0)}` : `${player.x.toFixed(0)}, ${player.y.toFixed(0)}`]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "hidden text-xs leading-relaxed text-muted-foreground lg:block",
			children: "點地圖行走。點圓點與人交談（距離不夠就聽不見）。點物件則靠近檢視。"
		})]
	});
}
function Marker({ x, y, color, label, ring, title, onClick, onEnter, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"data-marker": true,
		disabled,
		title,
		onPointerDown: (e) => {
			e.stopPropagation();
			onClick?.();
		},
		onPointerEnter: onEnter,
		className: "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1",
		style: {
			left: `${x}%`,
			top: `${y}%`,
			transition: "left 420ms cubic-bezier(0.22,1,0.36,1), top 420ms cubic-bezier(0.22,1,0.36,1)"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("block size-3.5 rounded-full shadow-[0_0_0_2px_rgb(11_11_12_/_0.8)]", ring && "size-4 shadow-[0_0_0_3px_rgb(11_11_12_/_0.85),0_0_0_5px_rgb(236_236_232_/_0.7)]"),
			style: { background: color }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "rounded-sm bg-background/75 px-1 text-[10px] leading-4 text-foreground whitespace-nowrap",
			children: label
		})]
	});
}
function PlayView() {
	const nav = useNavigate();
	const { game, setGame, busy, setBusy, error, setError, hydrate, hydrated } = useGameStore();
	const [draft, setDraft] = (0, import_react.useState)("");
	const [showObjects, setShowObjects] = (0, import_react.useState)(false);
	const logEnd = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		hydrate();
	}, [hydrate]);
	(0, import_react.useEffect)(() => {
		function persist() {
			const g = useGameStore.getState().game;
			if (g && document.visibilityState === "hidden") setGame(g);
		}
		document.addEventListener("visibilitychange", persist);
		return () => document.removeEventListener("visibilitychange", persist);
	}, [setGame]);
	(0, import_react.useEffect)(() => {
		logEnd.current?.scrollIntoView({ behavior: "smooth" });
	}, [game?.log.length]);
	const scene = game?.scenes[game.currentSceneId];
	const distances = (0, import_react.useMemo)(() => {
		if (!game || !scene) return [];
		return scene.npcs.map((npc) => {
			const d = dist(scene.playerPos, npc);
			return {
				npc,
				d,
				prox: proximity(d)
			};
		}).sort((a, b) => a.d - b.d);
	}, [game, scene]);
	async function act(text) {
		if (!game || busy) return;
		const action = text.trim();
		if (!action) return;
		setDraft("");
		setBusy({ stage: "推演這一回" });
		setError(null);
		try {
			const next = await takeTurn(loadApiSettings(), game, action, (stage, detail) => setBusy({
				stage,
				detail
			}));
			await setGame(next);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "這一回失敗";
			setError(msg);
			toast.error(msg);
		} finally {
			setBusy(null);
		}
	}
	function walk(pos, near) {
		act(`走到座標 ${`(${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`}，${near ? `靠近「${near.label}」` : "空地"}。`);
	}
	function talk(npc) {
		if (!scene) return;
		const d = dist(scene.playerPos, npc);
		const p = proximity(d);
		if (p === "far" || p === "distant") {
			act(`朝著遠處的${npc.name}喊話。對方目前是「${PROXIMITY_LABEL[p]}」。`);
			return;
		}
		act(`走向${npc.name}並嘗試交談。`);
	}
	function inspect(obj) {
		if (!scene) return;
		if (dist(scene.playerPos, obj) > 16) {
			act(`走向「${obj.label}」並檢視。`);
			return;
		}
		act(`就近檢視「${obj.label}」。`);
	}
	if (!hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center text-sm text-muted-foreground",
		children: "讀取中…"
	});
	if (!game || !scene) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-2xl",
			children: "沒有進行中的旅程"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "回到開頭"
			})
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col overflow-hidden bg-background pb-20",
		children: [
			busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GeneratingOverlay, {
				stage: busy.stage,
				detail: busy.detail
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex shrink-0 items-center gap-3 border-b border-border px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "font-display text-lg tracking-tight",
						children: "圖誌"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {
						orientation: "vertical",
						className: "h-4"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm",
							children: scene.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-[11px] text-muted-foreground",
							children: [
								game.player.name,
								" · 第 ",
								game.turnCount,
								" 回"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "icon",
						variant: "ghost",
						"aria-label": showObjects ? "隱藏物件框" : "顯示物件框",
						onClick: () => setShowObjects((v) => !v),
						children: showObjects ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "icon",
							variant: "ghost",
							"aria-label": "選單",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-4" })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: game.title }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 overflow-y-auto px-5 pb-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: game.theme
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex flex-col gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "secondary",
										onClick: () => {
											setGame(game);
											toast.success("已存檔");
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), "存檔"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										onClick: () => exportGame(game),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "匯出"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										variant: "outline",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/saves",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4" }), "讀檔"]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										variant: "outline",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/settings",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4" }), "API 設定"]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										onClick: () => void nav({ to: "/" }),
										children: "離開"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-4" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium text-muted-foreground",
								children: "物品"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm",
								children: game.inventory.length ? game.inventory.join("、") : "空手"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-4" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium text-muted-foreground",
								children: "Lorebook"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "space-y-3",
								children: game.lorebook.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm",
									children: e.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: e.content
								})] }, e.id))
							})
						]
					})] })] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden lg:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "max-h-[42%] shrink-0 overflow-y-auto border-b border-border p-3 lg:max-h-none lg:w-[42%] lg:border-b-0 lg:border-r lg:p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto w-[34vh] max-w-full lg:w-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapView, {
							scene,
							player: {
								...game.player,
								x: scene.playerPos.x,
								y: scene.playerPos.y
							},
							showObjects,
							onWalk: walk,
							onNpc: talk,
							onObject: inspect,
							disabled: Boolean(busy)
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 flex flex-col gap-1.5",
						children: distances.map(({ npc, d, prox }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-2 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "size-2 shrink-0 rounded-full",
									style: { background: npc.color }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex-1 truncate",
									children: npc.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									variant: "outline",
									className: "tabular-nums font-mono",
									children: [
										d.toFixed(0),
										" · ",
										PROXIMITY_LABEL[prox]
									]
								})
							]
						}, npc.id))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex min-h-0 flex-1 flex-col",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-h-0 flex-1 overflow-y-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-4 px-4 py-5",
								children: [game.log.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", { children: entry.kind === "action" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "mr-1 inline size-3" }), entry.text]
								}) : entry.kind === "system" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs tracking-wide text-muted-foreground",
									children: entry.text
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "whitespace-pre-wrap text-sm leading-relaxed",
									children: entry.text
								}) }, entry.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: logEnd })]
							})
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-4 pb-2 text-xs text-destructive",
							children: error
						}),
						game.suggested.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2 overflow-x-auto px-4 pb-2",
							children: game.suggested.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: Boolean(busy),
								className: "shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground",
								onClick: () => void act(s),
								children: s
							}, s))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "flex shrink-0 items-end gap-2 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-3",
							onSubmit: (e) => {
								e.preventDefault();
								act(draft);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: draft,
								onChange: (e) => setDraft(e.target.value),
								placeholder: "要做什麼？或點地圖。",
								rows: 2,
								className: "min-h-[44px] resize-none",
								disabled: Boolean(busy),
								onKeyDown: (e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										act(draft);
									}
								}
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								size: "icon",
								disabled: Boolean(busy) || !draft.trim(),
								"aria-label": "送出",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-10 shrink-0 lg:h-2",
							"aria-hidden": true
						})
					]
				})]
			})
		]
	});
}
var SplitComponent = PlayView;
//#endregion
export { SplitComponent as component };

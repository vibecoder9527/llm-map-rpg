import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as Check, f as Loader, y as ArrowLeft } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-qAxJO0mu.mjs";
import { n as Label, t as Input } from "./label-DP3cTMuM.mjs";
import { a as hasPlatformKey, c as saveApiSettings, n as PRESETS, o as loadApiSettings, s as probeAi, t as DEFAULT_API } from "./functions-CGjI6SfJ.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-CM7rUNRb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings--km0TzB2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsView() {
	const [cfg, setCfg] = (0, import_react.useState)(DEFAULT_API);
	const [platform, setPlatform] = (0, import_react.useState)(null);
	const [testing, setTesting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setCfg(loadApiSettings());
		hasPlatformKey().then((r) => setPlatform(r.available));
	}, []);
	function patch(p) {
		setCfg((c) => ({
			...c,
			...p
		}));
	}
	function persist() {
		saveApiSettings(cfg);
		toast.success("已儲存");
	}
	async function test() {
		setTesting(true);
		try {
			const res = await probeAi({ data: { config: cfg } });
			if (res.ok) toast.success(`連線成功：${res.reply}`);
			else toast.error(res.error);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "測試失敗");
		} finally {
			setTesting(false);
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "連線設定"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: "文字、視覺標註、地圖繪製都走 OpenAI Compatible API。可使用平台內建的 xAI，或填入自己的端點。"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "來源"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: platform === false ? "這個環境沒有平台金鑰，請改用自備 API。" : platform ? "平台金鑰可用。" : "正在確認平台金鑰…" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "flex flex-col gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: cfg.mode === p.patch.mode && cfg.baseUrl === p.patch.baseUrl ? "default" : "outline",
								onClick: () => patch(p.patch),
								children: p.label
							}, p.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "模式",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "flex h-11 w-full rounded-md border border-input bg-secondary px-3 text-sm",
									value: cfg.mode,
									onChange: (e) => patch({ mode: e.target.value }),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "platform",
										children: "平台 xAI"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "custom",
										children: "自備金鑰"
									})]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Base URL",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: cfg.baseUrl,
									onChange: (e) => patch({ baseUrl: e.target.value }),
									placeholder: "https://api.x.ai/v1",
									disabled: cfg.mode === "platform"
								})
							})]
						}),
						cfg.mode === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "API Key",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								autoComplete: "off",
								value: cfg.apiKey,
								onChange: (e) => patch({ apiKey: e.target.value }),
								placeholder: "sk-…"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "文字模型",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: cfg.textModel,
										onChange: (e) => patch({ textModel: e.target.value })
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "視覺模型",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: cfg.visionModel,
										onChange: (e) => patch({ visionModel: e.target.value })
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "圖片模型",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: cfg.imageModel,
										onChange: (e) => patch({ imageModel: e.target.value })
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-3 pt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								onClick: persist,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), "儲存"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "secondary",
								onClick: test,
								disabled: testing,
								children: [testing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loader, { className: "size-4 animate-spin" }) : null, "測試連線"]
							})]
						})
					]
				})]
			})
		]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex flex-col gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
var SplitComponent = SettingsView;
//#endregion
export { SplitComponent as component };

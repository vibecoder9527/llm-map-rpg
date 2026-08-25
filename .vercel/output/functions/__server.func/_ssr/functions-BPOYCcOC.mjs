import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { a as object, i as number, n as array, o as string, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-BPOYCcOC.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var cfgSchema = object({
	mode: _enum(["platform", "custom"]),
	baseUrl: string(),
	apiKey: string(),
	textModel: string(),
	visionModel: string(),
	imageModel: string()
});
var messageSchema = object({
	role: _enum([
		"system",
		"user",
		"assistant"
	]),
	content: string()
});
function resolveConfig(cfg) {
	if (cfg.mode === "platform") {
		const apiKey = process.env.XAI_API_KEY ?? "";
		if (!apiKey) throw new Error("這個環境沒有平台 AI 金鑰，請改連自備的 OpenAI Compatible API。");
		return {
			baseUrl: "https://api.x.ai/v1",
			apiKey
		};
	}
	const baseUrl = cfg.baseUrl.replace(/\/+$/, "");
	const apiKey = cfg.apiKey.trim();
	if (!baseUrl || !apiKey) throw new Error("請填寫 API 位址與金鑰。");
	return {
		baseUrl,
		apiKey
	};
}
function isXai(baseUrl) {
	return baseUrl.includes("x.ai");
}
async function readError(res) {
	const text = await res.text().catch(() => "");
	try {
		const json = JSON.parse(text);
		if (typeof json.error === "string") return json.error;
		if (json.error?.message) return json.error.message;
		if (json.message) return json.message;
	} catch {}
	return text.slice(0, 280) || `HTTP ${res.status}`;
}
async function chatRaw(resolved, body) {
	const res = await fetch(`${resolved.baseUrl}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${resolved.apiKey}`
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(12e4)
	});
	if (!res.ok) throw new Error(`文字模型錯誤：${await readError(res)}`);
	const content = (await res.json()).choices?.[0]?.message?.content;
	if (typeof content === "string") return content;
	if (Array.isArray(content)) return content.map((c) => c.text ?? "").join("");
	throw new Error("文字模型沒有回傳內容");
}
var probeAi_createServerFn_handler = createServerRpc({
	id: "d6c7fd255fcfa33eb6778a12a7c50d60e28f5eece542b65b44ce1e7c0ff03427",
	name: "probeAi",
	filename: "src/lib/ai/functions.ts"
}, (opts) => probeAi.__executeServer(opts));
var probeAi = createServerFn({ method: "POST" }).validator(object({ config: cfgSchema })).handler(probeAi_createServerFn_handler, async ({ data }) => {
	try {
		return {
			ok: true,
			reply: (await chatRaw(resolveConfig(data.config), {
				model: data.config.textModel,
				messages: [{
					role: "user",
					content: "Reply with the single word pong."
				}],
				max_tokens: 16,
				temperature: 0
			})).trim().slice(0, 80)
		};
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "連線失敗"
		};
	}
});
var hasPlatformKey_createServerFn_handler = createServerRpc({
	id: "045cc3eeb707e3118e71b62690ac8de38fc9db0282253d88298cb598911e2c3c",
	name: "hasPlatformKey",
	filename: "src/lib/ai/functions.ts"
}, (opts) => hasPlatformKey.__executeServer(opts));
var hasPlatformKey = createServerFn({ method: "GET" }).handler(hasPlatformKey_createServerFn_handler, async () => ({ available: Boolean(process.env.XAI_API_KEY) }));
var chatJson_createServerFn_handler = createServerRpc({
	id: "8ba0deba1bd7a57b3943dfe638f79a9cbc3a0fd6d49c70fe50aca2860ec9beb4",
	name: "chatJson",
	filename: "src/lib/ai/functions.ts"
}, (opts) => chatJson.__executeServer(opts));
var chatJson = createServerFn({ method: "POST" }).validator(object({
	config: cfgSchema,
	messages: array(messageSchema),
	maxTokens: number().optional(),
	temperature: number().optional()
})).handler(chatJson_createServerFn_handler, async ({ data }) => {
	return { text: await chatRaw(resolveConfig(data.config), {
		model: data.config.textModel,
		messages: data.messages,
		max_tokens: data.maxTokens ?? 1600,
		temperature: data.temperature ?? .7,
		response_format: { type: "json_object" }
	}) };
});
var visionJson_createServerFn_handler = createServerRpc({
	id: "ec406adb0e642654ae6d7107e494bdec5ad1353ddcf7fb87afa5d92a411c67e9",
	name: "visionJson",
	filename: "src/lib/ai/functions.ts"
}, (opts) => visionJson.__executeServer(opts));
var visionJson = createServerFn({ method: "POST" }).validator(object({
	config: cfgSchema,
	prompt: string(),
	image: string(),
	maxTokens: number().optional()
})).handler(visionJson_createServerFn_handler, async ({ data }) => {
	return { text: await chatRaw(resolveConfig(data.config), {
		model: data.config.visionModel,
		max_tokens: data.maxTokens ?? 1600,
		temperature: .2,
		response_format: { type: "json_object" },
		messages: [{
			role: "user",
			content: [{
				type: "text",
				text: data.prompt
			}, {
				type: "image_url",
				image_url: {
					url: data.image,
					detail: "high"
				}
			}]
		}]
	}) };
});
var generateMapImage_createServerFn_handler = createServerRpc({
	id: "04e7605f64b1dd499b18c2215e1baf3dde7ee6b7aab59fa595762864e2001c6e",
	name: "generateMapImage",
	filename: "src/lib/ai/functions.ts"
}, (opts) => generateMapImage.__executeServer(opts));
var generateMapImage = createServerFn({ method: "POST" }).validator(object({
	config: cfgSchema,
	prompt: string()
})).handler(generateMapImage_createServerFn_handler, async ({ data }) => {
	const resolved = resolveConfig(data.config);
	const xai = isXai(resolved.baseUrl);
	const body = {
		model: data.config.imageModel,
		prompt: data.prompt,
		n: 1,
		response_format: "b64_json"
	};
	if (xai) {
		body.aspect_ratio = "1:1";
		body.resolution = "1k";
	} else body.size = "1024x1024";
	const res = await fetch(`${resolved.baseUrl}/images/generations`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${resolved.apiKey}`
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(12e4)
	});
	if (!res.ok) throw new Error(`地圖繪製失敗：${await readError(res)}`);
	const item = (await res.json()).data?.[0];
	if (item?.b64_json) return { image: `data:image/png;base64,${item.b64_json}` };
	if (item?.url) {
		const imgRes = await fetch(item.url, { signal: AbortSignal.timeout(6e4) });
		if (!imgRes.ok) throw new Error("無法下載生成的地圖");
		const buf = Buffer.from(await imgRes.arrayBuffer());
		return { image: `data:${imgRes.headers.get("content-type") || "image/png"};base64,${buf.toString("base64")}` };
	}
	throw new Error("圖片模型沒有回傳圖像");
});
//#endregion
export { chatJson_createServerFn_handler, generateMapImage_createServerFn_handler, hasPlatformKey_createServerFn_handler, probeAi_createServerFn_handler, visionJson_createServerFn_handler };

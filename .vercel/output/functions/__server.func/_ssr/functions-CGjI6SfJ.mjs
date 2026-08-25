import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as object, i as number, n as array, o as string, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-CGjI6SfJ.js
var DEFAULT_API = {
	mode: "platform",
	baseUrl: "https://api.x.ai/v1",
	apiKey: "",
	textModel: "grok-4.5",
	visionModel: "grok-4.5",
	imageModel: "grok-imagine-image-quality"
};
var PRESETS = [
	{
		id: "xai",
		label: "xAI Grok（平台金鑰）",
		patch: {
			mode: "platform",
			baseUrl: "https://api.x.ai/v1",
			textModel: "grok-4.5",
			visionModel: "grok-4.5",
			imageModel: "grok-imagine-image-quality"
		}
	},
	{
		id: "xai-custom",
		label: "xAI Grok（自備金鑰）",
		patch: {
			mode: "custom",
			baseUrl: "https://api.x.ai/v1",
			textModel: "grok-4.5",
			visionModel: "grok-4.5",
			imageModel: "grok-imagine-image-quality"
		}
	},
	{
		id: "openai",
		label: "OpenAI",
		patch: {
			mode: "custom",
			baseUrl: "https://api.openai.com/v1",
			textModel: "gpt-4.1",
			visionModel: "gpt-4.1",
			imageModel: "gpt-image-1"
		}
	},
	{
		id: "openrouter",
		label: "OpenRouter",
		patch: {
			mode: "custom",
			baseUrl: "https://openrouter.ai/api/v1",
			textModel: "openai/gpt-4.1-mini",
			visionModel: "openai/gpt-4.1-mini",
			imageModel: "google/gemini-2.5-flash-image"
		}
	}
];
var KEY = "tuzhi:api";
function loadApiSettings() {
	if (typeof window === "undefined") return { ...DEFAULT_API };
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...DEFAULT_API };
		const parsed = JSON.parse(raw);
		return {
			...DEFAULT_API,
			...parsed
		};
	} catch {
		return { ...DEFAULT_API };
	}
}
function saveApiSettings(cfg) {
	localStorage.setItem(KEY, JSON.stringify(cfg));
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
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
var probeAi = createServerFn({ method: "POST" }).validator(object({ config: cfgSchema })).handler(createSsrRpc("d6c7fd255fcfa33eb6778a12a7c50d60e28f5eece542b65b44ce1e7c0ff03427"));
var hasPlatformKey = createServerFn({ method: "GET" }).handler(createSsrRpc("045cc3eeb707e3118e71b62690ac8de38fc9db0282253d88298cb598911e2c3c"));
var chatJson = createServerFn({ method: "POST" }).validator(object({
	config: cfgSchema,
	messages: array(messageSchema),
	maxTokens: number().optional(),
	temperature: number().optional()
})).handler(createSsrRpc("8ba0deba1bd7a57b3943dfe638f79a9cbc3a0fd6d49c70fe50aca2860ec9beb4"));
var visionJson = createServerFn({ method: "POST" }).validator(object({
	config: cfgSchema,
	prompt: string(),
	image: string(),
	maxTokens: number().optional()
})).handler(createSsrRpc("ec406adb0e642654ae6d7107e494bdec5ad1353ddcf7fb87afa5d92a411c67e9"));
var generateMapImage = createServerFn({ method: "POST" }).validator(object({
	config: cfgSchema,
	prompt: string()
})).handler(createSsrRpc("04e7605f64b1dd499b18c2215e1baf3dde7ee6b7aab59fa595762864e2001c6e"));
//#endregion
export { hasPlatformKey as a, saveApiSettings as c, generateMapImage as i, visionJson as l, PRESETS as n, loadApiSettings as o, chatJson as r, probeAi as s, DEFAULT_API as t };

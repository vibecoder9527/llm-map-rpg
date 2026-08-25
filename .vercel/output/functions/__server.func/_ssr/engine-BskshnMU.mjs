import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { f as Loader } from "../_libs/lucide-react.mjs";
import { i as uid, r as cn } from "./router-BHD8hO0Q.mjs";
import { i as generateMapImage, l as visionJson, r as chatJson } from "./functions-CGjI6SfJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/engine-BskshnMU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
	className: cn("flex min-h-24 w-full rounded-lg border border-input bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-50", className),
	ref,
	...props
}));
Textarea.displayName = "Textarea";
var STAGES = [
	"撰寫世界",
	"繪製地圖",
	"辨識場景物件",
	"配置平面",
	"安置人物",
	"推演這一回",
	"進入新場景"
];
function GeneratingOverlay({ stage, detail }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl border border-border bg-card p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-center gap-2 text-sm text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loader, { className: "size-4 animate-spin" }), "進行中"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl",
					children: stage
				}),
				detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: detail
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-3 h-3 w-2/3 rounded-sm shimmer" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-6 space-y-1.5 text-xs text-muted-foreground",
					children: STAGES.filter((s) => [
						"撰寫世界",
						"繪製地圖",
						"辨識場景物件",
						"安置人物",
						"推演這一回",
						"進入新場景"
					].includes(s)).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: s === stage ? "text-foreground" : "opacity-40",
						children: [
							s === stage ? "●" : "○",
							" ",
							s
						]
					}, s))
				})
			]
		})
	});
}
function extractJson(text) {
	const trimmed = text.trim();
	const raw = (trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? trimmed).trim();
	const firstObj = raw.indexOf("{");
	const firstArr = raw.indexOf("[");
	let start = -1;
	if (firstObj < 0) start = firstArr;
	else if (firstArr < 0) start = firstObj;
	else start = Math.min(firstObj, firstArr);
	if (start < 0) throw new Error("模型沒有回傳 JSON");
	const closer = raw[start] === "[" ? "]" : "}";
	const end = raw.lastIndexOf(closer);
	if (end < start) throw new Error("模型 JSON 不完整");
	try {
		return JSON.parse(raw.slice(start, end + 1));
	} catch {
		throw new Error("模型 JSON 無法解析");
	}
}
function asNumber(v, fallback) {
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) ? n : fallback;
}
function asString(v, fallback = "") {
	return typeof v === "string" ? v : fallback;
}
var RANGE = {
	adjacent: 12,
	near: 24,
	sameArea: 52,
	distant: 72
};
function dist(a, b) {
	return Math.hypot(a.x - b.x, a.y - b.y);
}
function proximity(d) {
	if (d <= RANGE.adjacent) return "adjacent";
	if (d <= RANGE.near) return "near";
	if (d <= RANGE.sameArea) return "same-area";
	if (d <= RANGE.distant) return "distant";
	return "far";
}
var PROXIMITY_LABEL = {
	adjacent: "伸手可及",
	near: "近處可談",
	"same-area": "同區須揚聲",
	distant: "遠處只見人影",
	far: "遠在地圖另一端"
};
function nearestObject(pos, objects) {
	if (objects.length === 0) return null;
	let best = objects[0];
	let bestD = dist(pos, best);
	for (let i = 1; i < objects.length; i++) {
		const d = dist(pos, objects[i]);
		if (d < bestD) {
			best = objects[i];
			bestD = d;
		}
	}
	return best;
}
function formatDistanceReport(player, npcs, objects) {
	const lines = [];
	lines.push("【座標與距離】玩家座標為百分比，原點在地圖左上。");
	lines.push(`玩家：(${player.x.toFixed(0)}, ${player.y.toFixed(0)})`);
	const nearObj = nearestObject(player, objects);
	if (nearObj) lines.push(`最近物件：${nearObj.label}（距 ${dist(player, nearObj).toFixed(0)}）`);
	for (const npc of npcs) {
		const d = dist(player, npc);
		lines.push(`${npc.name}：(${npc.x.toFixed(0)}, ${npc.y.toFixed(0)}) 距離 ${d.toFixed(0)}＝${PROXIMITY_LABEL[proximity(d)]}`);
	}
	lines.push("規則：≤12 可碰觸／低語；≤24 可正常交談；≤52 同區須揚聲且細節不清；>52 聽不見對話。");
	return lines.join("\n");
}
var GM_RULES = `你是文字冒險「圖誌」的主持人。玩家與 NPC 活在有座標的地圖上。
硬性規則：
1. 空間為真。座標是地圖百分比（左上為 0,0，右下為 100,100）。
2. 距離：≤12 伸手可及（低語、碰觸、偷竊）；≤24 可正常交談；≤52 同區須揚聲、細節聽不清；>52 聽不見對話，只能看見模糊動靜。
3. 禁止讓遠在地圖兩端的角色像面對面聊天。若玩家對遠距 NPC 說話，敘事必須寫出對方沒聽見、或只看到口型。
4. 移動必須合理，不可穿牆或穿過實心家具。參考物件標註與可行走說明。
5. 只有玩家明確走向出口／離開此地時才可切換場景。不要無故傳送。
6. 敘事使用台灣繁體中文，克制、具體、感官；不要條列遊戲規則給玩家看。
7. 只輸出 JSON，不要 markdown。`;
function themePrompt(hint) {
	return `為一款重視空間距離的文字冒險擬一個主題。使用台灣繁體中文。
玩家提示：${hint.trim() || "（無，請自行構思一個有氣味與方位的場所）"}
輸出 JSON：
{
  "theme": "一句主題（18字內）",
  "pitch": "兩句世界氣氛",
  "place": "初始場所名稱"
}`;
}
function worldPrompt(input) {
	return `根據主題建立完整開場。台灣繁體中文。主題：${input.theme}
玩家角色提示：${input.playerHint || "（無，請創造一位有缺陷的普通人）"}
額外設定：${input.extra || "（無）"}

輸出 JSON：
{
  "title": "存檔標題（短）",
  "theme": "主題一句",
  "lorebook": [
    {"title": "條目名", "content": "80–140字", "tags": ["tag"]}
  ],
  "player": {
    "name": "",
    "bio": "背景與動機",
    "appearance": "外觀，不含座標",
    "status": "此刻狀態"
  },
  "scene": {
    "name": "場所名",
    "summary": "這個空間裡有什麼、誰在、氣氛",
    "atmosphere": "氣味、光線、聲音",
    "mapPrompt": "英文，給圖片模型的 top-down 地圖提示。必須是正上方俯視建築平面／剖面，不是 isometric，不要人物、文字、UI。清楚的家具與出口。"
  },
  "npcs": [
    {
      "name": "",
      "bio": "",
      "appearance": "",
      "status": "",
      "where": "相對位置，如「吧台後」"
    }
  ]
}
lorebook 6–10 條。npc 2–4 人，分散在場景各處，不要全擠在一起。`;
}
function annotatePrompt() {
	return `這是一張由正上方俯視的室內／場所地圖，沒有人物。請辨識所有可見的家具、出口、地標、容器。
使用台灣繁體中文標籤。座標為百分比 0–100，x,y 是物件中心。
只輸出 JSON：
{
  "title": "場所短名",
  "walkableNotes": "哪些區域可走、哪些是實心（吧台、牆壁、桌面）",
  "objects": [
    {"id": "o1", "label": "吧台", "kind": "furniture", "x": 50, "y": 18, "w": 70, "h": 12, "desc": "沿北牆的長吧台"}
  ]
}
kind 只能是 furniture | door | landmark | hazard | container | other。
不要發明圖裡沒有的東西。出口（門、樓梯、巷口）一定要標。物件 8–18 個。`;
}
function placePrompt(scene, objects, playerName, npcs) {
	return `把角色放到這張已標註的地圖上。不要重疊，NPC 必須分散。
場所：${scene.name}
說明：${scene.summary}
可行走：${scene.walkableNotes}
物件：${JSON.stringify(objects)}
玩家：${playerName}
NPC：${JSON.stringify(npcs)}

輸出 JSON：
{
  "player": {"x": 0, "y": 0, "note": "為何在此"},
  "npcs": [{"name": "須與輸入同名", "x": 0, "y": 0, "status": "此刻在做什麼"}]
}
座標 5–95。玩家通常靠近入口。NPC 靠近其 where 對應物件。`;
}
function schematicLayoutPrompt(scene) {
	return `圖片生成失敗，請改為文字配置一張可走的俯視平面。台灣繁體中文標籤。
場所：${scene.name}
${scene.summary}
${scene.atmosphere}

輸出 JSON：
{
  "title": "",
  "walkableNotes": "",
  "objects": [
    {"id": "o1", "label": "", "kind": "furniture", "x": 50, "y": 20, "w": 40, "h": 10, "desc": ""}
  ]
}
須含牆壁感的邊界物件與至少一個 door。物件 8–14 個，彼此不要嚴重重疊。`;
}
function turnPrompt(game, scene, action) {
	const recent = game.log.slice(-10);
	const lore = game.lorebook.slice(0, 10).map((e) => `- ${e.title}：${e.content}`).join("\n");
	const objects = scene.objects.map((o) => `${o.label}[${o.kind}] @(${o.x.toFixed(0)},${o.y.toFixed(0)}) ${o.desc}`).join("\n");
	const npcs = scene.npcs.map((n) => `${n.id} ${n.name} @(${n.x.toFixed(0)},${n.y.toFixed(0)}) 狀態：${n.status}／${n.bio}`).join("\n");
	const history = recent.map((l) => l.kind === "action" ? `玩家：${l.text}` : `主持：${l.text}`).join("\n");
	return `${GM_RULES}

【世界】${game.theme}
【Lorebook】
${lore}

【當前場景】${scene.name}
${scene.summary}
氣氛：${scene.atmosphere}
可行走：${scene.walkableNotes}
物件：
${objects}

【玩家】${game.player.name} @(${scene.playerPos.x.toFixed(0)},${scene.playerPos.y.toFixed(0)})
${game.player.bio}
物品：${game.inventory.join("、") || "無"}
旗標：${JSON.stringify(game.flags)}

【NPC】
${npcs}

${formatDistanceReport(scene.playerPos, scene.npcs, scene.objects)}

【近況】
${history || "（開場）"}

【本回玩家行動】
${action}

只輸出 JSON：
{
  "narrative": "本回敘事，200–450字。若有人說話，寫出誰聽得見。",
  "player": {"x": 0, "y": 0},
  "npcs": [{"id": "原id", "x": 0, "y": 0, "status": "", "speech": "可選，僅在對方聽得見時"}],
  "inventory": ["若未變可省略"],
  "flags": {"可選": "鍵值"},
  "suggested": ["下一步短句", "下一步短句", "下一步短句"],
  "sceneChange": null
}
若玩家離開此地，sceneChange 改為：
{"name":"","summary":"","atmosphere":"","mapPrompt":"英文 top-down 地圖提示，無人物無文字","npcs":[{"name":"","bio":"","appearance":"","status":"","where":""}],"reason":"為何離開"}
npc 的 id 必須是現有 id。可讓 NPC 小幅走動。玩家座標應反映行動（走向某處就更新）。`;
}
var MAP_IMAGE_PREFIX = `Orthographic true top-down architectural plan / bird's-eye section map, viewed straight down, NOT isometric, NOT 3/4, NOT perspective. No people, no characters, no text, no letters, no UI, no compass, no legend, no watermark. Square composition, even overhead lighting, high readability, distinct furniture silhouettes, muted ink-and-parchment cartography palette (aged paper, dark wood, stone). `;
var KIND_FILL = {
	furniture: "#3a342c",
	door: "#4a4034",
	landmark: "#2f3330",
	hazard: "#3a2a28",
	container: "#33302c",
	other: "#323232"
};
function renderSchematic(objects, title) {
	const size = 768;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (!ctx) return "";
	ctx.fillStyle = "#1a1814";
	ctx.fillRect(0, 0, size, size);
	ctx.strokeStyle = "rgba(236,236,232,0.05)";
	ctx.lineWidth = 1;
	for (let i = 0; i <= 10; i++) {
		const p = i / 10 * size;
		ctx.beginPath();
		ctx.moveTo(p, 0);
		ctx.lineTo(p, size);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(0, p);
		ctx.lineTo(size, p);
		ctx.stroke();
	}
	ctx.strokeStyle = "rgba(236,236,232,0.18)";
	ctx.lineWidth = 10;
	ctx.strokeRect(18, 18, 732, 732);
	for (const obj of objects) {
		const w = Math.max(24, obj.w / 100 * size);
		const h = Math.max(24, obj.h / 100 * size);
		const x = obj.x / 100 * size - w / 2;
		const y = obj.y / 100 * size - h / 2;
		ctx.fillStyle = KIND_FILL[obj.kind] ?? KIND_FILL.other;
		ctx.fillRect(x, y, w, h);
		ctx.strokeStyle = "rgba(236,236,232,0.22)";
		ctx.lineWidth = 1.5;
		ctx.strokeRect(x, y, w, h);
		ctx.fillStyle = "rgba(236,236,232,0.72)";
		ctx.font = "12px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(obj.label, x + w / 2, y + h / 2, w - 8);
	}
	ctx.fillStyle = "rgba(236,236,232,0.35)";
	ctx.font = "13px serif";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText(title, 28, 28);
	return canvas.toDataURL("image/jpeg", .86);
}
var objects = [
	{
		id: "door",
		label: "南門",
		kind: "door",
		x: 50,
		y: 93,
		w: 14,
		h: 8,
		desc: "朝南的雙開木門，通往雨濕的街道"
	},
	{
		id: "bar",
		label: "長吧台",
		kind: "furniture",
		x: 50,
		y: 16,
		w: 72,
		h: 14,
		desc: "沿北牆的深色長吧台，瓶架與銅龍頭"
	},
	{
		id: "stools",
		label: "吧凳",
		kind: "furniture",
		x: 48,
		y: 27,
		w: 50,
		h: 8,
		desc: "一排面向吧台的圓凳"
	},
	{
		id: "fireplace",
		label: "石壁爐",
		kind: "landmark",
		x: 12,
		y: 48,
		w: 16,
		h: 22,
		desc: "西牆巨大石砌壁爐，火光還在"
	},
	{
		id: "rug",
		label: "爐前毯",
		kind: "furniture",
		x: 24,
		y: 50,
		w: 14,
		h: 16,
		desc: "壁爐前磨舊的織毯"
	},
	{
		id: "table-fire",
		label: "爐邊圓桌",
		kind: "furniture",
		x: 38,
		y: 44,
		w: 14,
		h: 14,
		desc: "靠近壁爐的圓桌與椅"
	},
	{
		id: "table-mid",
		label: "中央圓桌",
		kind: "furniture",
		x: 52,
		y: 52,
		w: 14,
		h: 14,
		desc: "廳中央的圓桌"
	},
	{
		id: "table-east",
		label: "東側圓桌",
		kind: "furniture",
		x: 64,
		y: 46,
		w: 13,
		h: 13,
		desc: "偏東的圓桌"
	},
	{
		id: "table-south",
		label: "近門圓桌",
		kind: "furniture",
		x: 46,
		y: 68,
		w: 13,
		h: 13,
		desc: "靠近南門的圓桌"
	},
	{
		id: "stairs",
		label: "上樓梯",
		kind: "door",
		x: 84,
		y: 80,
		w: 16,
		h: 18,
		desc: "東南角木梯，通往客房"
	},
	{
		id: "barrels",
		label: "酒桶堆",
		kind: "container",
		x: 84,
		y: 20,
		w: 16,
		h: 16,
		desc: "東北角酒桶與木箱"
	},
	{
		id: "kitchen",
		label: "廚房傳菜口",
		kind: "landmark",
		x: 18,
		y: 12,
		w: 14,
		h: 10,
		desc: "西北角通往廚房的傳菜口"
	}
];
function sampleGame() {
	const now = Date.now();
	const sceneId = "scene_tavern";
	return {
		version: 1,
		id: `game_sample_${now}`,
		title: "雨夜〈北風亭〉",
		theme: "港口雨夜，一家不肯打烊的旅店",
		createdAt: now,
		updatedAt: now,
		turnCount: 0,
		lorebook: [
			{
				id: "lb1",
				title: "北風亭",
				content: "開在舊碼頭第三街的木造旅店。招牌被風吹歪，可爐火從不熄。水手、更夫、躲債的人都來這裡把聲音壓低。",
				tags: ["場所"]
			},
			{
				id: "lb2",
				title: "今晚的雨",
				content: "雨從黃昏下到現在。街上的油燈只剩兩盞，碼頭吊車停著。有人說潮水比月曆提早了一尺。",
				tags: ["天氣"]
			},
			{
				id: "lb3",
				title: "阿秋",
				content: "吧台後的老闆娘。左手缺半截小指，調酒時用銅量杯敲桌沿計時。不喜歡有人問她以前在船上做什麼。",
				tags: ["人物"]
			},
			{
				id: "lb4",
				title: "禁問的房間",
				content: "樓上 3 號房從上週起一直亮著燈，可鑰匙在阿秋圍裙裡。沒人被允許送熱水上去。",
				tags: ["謎"]
			},
			{
				id: "lb5",
				title: "潮汐哨",
				content: "更夫用的銅哨，吹兩短一長代表「潮來了」。今晚還沒有人吹過。",
				tags: ["物件"]
			}
		],
		player: {
			id: "player",
			name: "林拾",
			role: "player",
			bio: "剛下船的記帳助手，懷裡有一封不該拆的信，要在黎明前交給「聽得見潮聲的人」。",
			appearance: "深色短襖，袖口鹽白，肩上還在滴水。",
			color: "#f4f1ea",
			x: 50,
			y: 82,
			status: "剛推門進來，雨水還在下巴。"
		},
		inventory: ["未拆的油紙信", "半包受潮的菸"],
		flags: { letter: "未拆" },
		scenes: { [sceneId]: {
			id: sceneId,
			name: "北風亭·一樓",
			summary: "木造旅店一樓。北牆長吧台，西牆壁爐，東南角樓梯，南門通往雨街。廳裡有幾張圓桌，人不多，可空氣很滿。",
			atmosphere: "濕羊毛、炭火、廉價酒。雨打在門板上像有人用指節敲門。",
			mapImage: "/maps/tavern.jpg",
			mapSource: "sample",
			walkableNotes: "中央地板與桌間走道可走。吧台表面、壁爐石座、酒桶堆、桌面不可穿。南門可出街，東南梯可上樓。",
			objects,
			playerPos: {
				x: 50,
				y: 82
			},
			npcs: [
				{
					id: "npc_qiu",
					name: "阿秋",
					role: "npc",
					bio: "北風亭老闆娘，缺半截小指，聲音不高。",
					appearance: "深褐圍裙，髮用銅簪挽著。",
					color: "#a67c6d",
					x: 52,
					y: 14,
					status: "在吧台後擦一只量杯，沒抬頭。"
				},
				{
					id: "npc_hou",
					name: "老侯",
					role: "npc",
					bio: "退休的碼頭書記，每晚佔壁爐旁那桌，聽雨勝過人話。",
					appearance: "灰色圍巾，眼鏡起霧。",
					color: "#7d9aa3",
					x: 36,
					y: 44,
					status: "坐在爐邊圓桌，杯沿對準壁爐。"
				},
				{
					id: "npc_qing",
					name: "阿青",
					role: "npc",
					bio: "巡夜的更夫，銅哨在腰帶上。今晚她在門邊躲雨，還不是進來歇腳的時間。",
					appearance: "深青披風，靴底帶泥。",
					color: "#8a8e7a",
					x: 62,
					y: 86,
					status: "靠在近門的柱邊，聽外面的雨勢。"
				}
			]
		} },
		currentSceneId: sceneId,
		log: [{
			id: "log_open",
			at: now,
			kind: "narrative",
			text: "門軸叫了一聲。雨被留在門外，熱氣立刻貼上臉。北風亭的一樓比你記憶中更暗——壁爐在西牆，吧台在最北，樓梯在東南角陰著。吧台後有人在擦杯子，沒有問你要什麼。爐邊坐著一個戴眼鏡的老人。門邊還站著一個披青衣的人，銅哨偶爾碰到皮帶扣，輕響。\n\n你站在門口的濕地板上。再走幾步才進得了廳中央；若要跟人說話，得先走近。"
		}],
		suggested: [
			"走到吧台向阿秋要一杯熱的",
			"在爐邊坐下，聽老侯有沒有在說話",
			"問門邊的巡夜人雨還要下多久",
			"推門走回街上"
		]
	};
}
var NPC_COLORS = [
	"#7d9aa3",
	"#a67c6d",
	"#8a8e7a",
	"#7a7e8c",
	"#9a8b78"
];
async function askJson(config, user, system, opts) {
	const messages = [...system ? [{
		role: "system",
		content: system
	}] : [], {
		role: "user",
		content: user
	}];
	const { text } = await chatJson({ data: {
		config,
		messages,
		maxTokens: opts?.maxTokens ?? 1800,
		temperature: opts?.temperature ?? .7
	} });
	return extractJson(text);
}
function clampCoord(n) {
	return Math.min(94, Math.max(6, n));
}
function parseObjects(raw) {
	if (!Array.isArray(raw)) return [];
	return raw.map((item, i) => {
		const o = item;
		const kind = asString(o.kind, "other");
		return {
			id: asString(o.id, `obj_${i}`),
			label: asString(o.label, `物件${i + 1}`),
			kind: [
				"furniture",
				"door",
				"landmark",
				"hazard",
				"container",
				"other"
			].includes(kind) ? kind : "other",
			x: clampCoord(asNumber(o.x, 50)),
			y: clampCoord(asNumber(o.y, 50)),
			w: Math.min(80, Math.max(4, asNumber(o.w, 10))),
			h: Math.min(80, Math.max(4, asNumber(o.h, 10))),
			desc: asString(o.desc, "")
		};
	}).filter((o) => o.label);
}
async function generateTheme(config, hint) {
	return askJson(config, themePrompt(hint), void 0, {
		maxTokens: 400,
		temperature: .9
	});
}
async function generateWorld(config, input) {
	const raw = await askJson(config, worldPrompt(input), void 0, {
		maxTokens: 2200,
		temperature: .8
	});
	const loreRaw = Array.isArray(raw.lorebook) ? raw.lorebook : [];
	const npcRaw = Array.isArray(raw.npcs) ? raw.npcs : [];
	const player = raw.player ?? {};
	const scene = raw.scene ?? {};
	const lorebook = loreRaw.map((e, i) => {
		const row = e;
		return {
			id: uid("lb"),
			title: asString(row.title, `條目 ${i + 1}`),
			content: asString(row.content, ""),
			tags: Array.isArray(row.tags) ? row.tags.map((t) => String(t)) : []
		};
	});
	return {
		title: asString(raw.title, asString(raw.theme, "未命名旅程")),
		theme: asString(raw.theme, input.theme),
		lorebook,
		player: {
			name: asString(player.name, "旅人"),
			bio: asString(player.bio, ""),
			appearance: asString(player.appearance, ""),
			status: asString(player.status, "剛抵達")
		},
		scene: {
			name: asString(scene.name, "未知場所"),
			summary: asString(scene.summary, ""),
			atmosphere: asString(scene.atmosphere, ""),
			mapPrompt: asString(scene.mapPrompt, input.theme)
		},
		npcs: npcRaw.map((n) => {
			const row = n;
			return {
				name: asString(row.name, "無名"),
				bio: asString(row.bio, ""),
				appearance: asString(row.appearance, ""),
				status: asString(row.status, ""),
				where: asString(row.where, "場中")
			};
		})
	};
}
async function annotateMap(config, image) {
	const { text } = await visionJson({ data: {
		config,
		prompt: annotatePrompt(),
		image,
		maxTokens: 1600
	} });
	const raw = extractJson(text);
	return {
		title: asString(raw.title, ""),
		walkableNotes: asString(raw.walkableNotes, ""),
		objects: parseObjects(raw.objects)
	};
}
async function inventLayout(config, scene) {
	const raw = await askJson(config, schematicLayoutPrompt(scene), void 0, {
		maxTokens: 1400,
		temperature: .4
	});
	return {
		title: asString(raw.title, scene.name),
		walkableNotes: asString(raw.walkableNotes, ""),
		objects: parseObjects(raw.objects)
	};
}
async function placeActors(config, scene, annotation, playerName, npcs) {
	const compact = annotation.objects.map((o) => ({
		label: o.label,
		x: o.x,
		y: o.y,
		kind: o.kind
	}));
	const raw = await askJson(config, placePrompt({
		name: scene.name,
		summary: scene.summary,
		walkableNotes: annotation.walkableNotes
	}, compact, playerName, npcs), void 0, {
		maxTokens: 800,
		temperature: .4
	});
	const player = raw.player ?? {};
	const list = Array.isArray(raw.npcs) ? raw.npcs : [];
	return {
		player: {
			x: clampCoord(asNumber(player.x, 50)),
			y: clampCoord(asNumber(player.y, 82))
		},
		npcs: list.map((n, i) => {
			const row = n;
			return {
				name: asString(row.name, npcs[i]?.name ?? "無名"),
				x: clampCoord(asNumber(row.x, 40 + i * 10)),
				y: clampCoord(asNumber(row.y, 40)),
				status: asString(row.status, npcs[i]?.status ?? "")
			};
		})
	};
}
async function buildScene(config, draft, onProgress) {
	onProgress("繪製地圖", "正上方俯視圖");
	let mapImage = "";
	let mapSource = "generated";
	try {
		const prompt = `${MAP_IMAGE_PREFIX}${draft.scene.mapPrompt}`;
		mapImage = (await generateMapImage({ data: {
			config,
			prompt
		} })).image;
	} catch {
		mapSource = "schematic";
	}
	let annotation;
	if (mapSource === "generated" && mapImage) {
		onProgress("辨識場景物件", "讀取地圖上的家具與出口");
		try {
			annotation = await annotateMap(config, mapImage);
		} catch {
			annotation = await inventLayout(config, draft.scene);
		}
	} else {
		onProgress("配置平面", "改以示意平面圖");
		annotation = await inventLayout(config, draft.scene);
		mapImage = renderSchematic(annotation.objects, draft.scene.name);
	}
	if (annotation.objects.length === 0) {
		annotation = await inventLayout(config, draft.scene);
		if (mapSource !== "generated") {
			mapImage = renderSchematic(annotation.objects, draft.scene.name);
			mapSource = "schematic";
		}
	}
	onProgress("安置人物", "依地圖標註分散站位");
	const placed = await placeActors(config, draft.scene, annotation, draft.player.name, draft.npcs);
	const npcs = draft.npcs.map((n, i) => {
		const match = placed.npcs.find((p) => p.name === n.name) ?? placed.npcs[i];
		return {
			id: uid("npc"),
			name: n.name,
			role: "npc",
			bio: n.bio,
			appearance: n.appearance,
			color: NPC_COLORS[i % NPC_COLORS.length],
			x: match?.x ?? 40 + i * 8,
			y: match?.y ?? 40,
			status: match?.status || n.status
		};
	});
	return {
		id: uid("scene"),
		name: draft.scene.name,
		summary: draft.scene.summary,
		atmosphere: draft.scene.atmosphere,
		mapImage,
		mapSource,
		walkableNotes: annotation.walkableNotes,
		objects: annotation.objects,
		npcs,
		playerPos: placed.player
	};
}
async function startNewGame(config, draft, onProgress) {
	const scene = await buildScene(config, draft, onProgress);
	const now = Date.now();
	const player = {
		id: "player",
		name: draft.player.name,
		role: "player",
		bio: draft.player.bio,
		appearance: draft.player.appearance,
		color: "#f4f1ea",
		x: scene.playerPos.x,
		y: scene.playerPos.y,
		status: draft.player.status
	};
	const near = scene.npcs.map((n) => n.name).join("、");
	return {
		version: 1,
		id: uid("game"),
		title: draft.title,
		theme: draft.theme,
		createdAt: now,
		updatedAt: now,
		turnCount: 0,
		lorebook: draft.lorebook,
		player,
		inventory: [],
		flags: {},
		scenes: { [scene.id]: scene },
		currentSceneId: scene.id,
		log: [{
			id: uid("log"),
			at: now,
			kind: "narrative",
			text: `${scene.atmosphere}\n\n你站在${scene.name}。${scene.summary}${near ? ` 場中可見：${near}。` : ""}\n距離會改變誰聽得見你。`
		}],
		suggested: [
			"環顧四周",
			"走向最近的人",
			"檢查自己身上帶了什麼"
		]
	};
}
function makeSample() {
	return sampleGame();
}
async function takeTurn(config, game, action, onProgress) {
	const scene = game.scenes[game.currentSceneId];
	if (!scene) throw new Error("找不到當前場景");
	onProgress("推演這一回", "把距離一併交給主持人");
	const raw = await askJson(config, turnPrompt(game, scene, action), void 0, {
		maxTokens: 1400,
		temperature: .75
	});
	const playerPos = {
		x: clampCoord(asNumber(raw.player?.x, scene.playerPos.x)),
		y: clampCoord(asNumber(raw.player?.y, scene.playerPos.y))
	};
	const npcUpdates = Array.isArray(raw.npcs) ? raw.npcs : [];
	const npcs = scene.npcs.map((npc) => {
		const u = npcUpdates.find((n) => n.id === npc.id);
		if (!u) return npc;
		return {
			...npc,
			x: clampCoord(asNumber(u.x, npc.x)),
			y: clampCoord(asNumber(u.y, npc.y)),
			status: asString(u.status, npc.status)
		};
	});
	const log = [
		...game.log,
		{
			id: uid("log"),
			at: Date.now(),
			kind: "action",
			text: action
		},
		{
			id: uid("log"),
			at: Date.now() + 1,
			kind: "narrative",
			text: asString(raw.narrative, "……")
		}
	];
	let next = {
		...game,
		turnCount: game.turnCount + 1,
		updatedAt: Date.now(),
		inventory: Array.isArray(raw.inventory) ? raw.inventory : game.inventory,
		flags: raw.flags ? {
			...game.flags,
			...raw.flags
		} : game.flags,
		player: {
			...game.player,
			x: playerPos.x,
			y: playerPos.y
		},
		suggested: Array.isArray(raw.suggested) && raw.suggested.length ? raw.suggested.slice(0, 4) : game.suggested,
		log: log.slice(-80),
		scenes: {
			...game.scenes,
			[scene.id]: {
				...scene,
				playerPos,
				npcs
			}
		}
	};
	if (raw.sceneChange && raw.sceneChange.name) {
		onProgress("進入新場景", raw.sceneChange.name);
		const newScene = await buildScene(config, {
			theme: game.theme,
			lorebook: game.lorebook,
			player: {
				name: game.player.name,
				bio: game.player.bio,
				appearance: game.player.appearance,
				status: game.player.status
			},
			scene: {
				name: raw.sceneChange.name,
				summary: raw.sceneChange.summary,
				atmosphere: raw.sceneChange.atmosphere,
				mapPrompt: raw.sceneChange.mapPrompt
			},
			npcs: raw.sceneChange.npcs ?? []
		}, onProgress);
		const extraLog = [
			...next.log,
			{
				id: uid("log"),
				at: Date.now(),
				kind: "system",
				text: `抵達：${newScene.name}。${raw.sceneChange.reason ?? ""}`.trim()
			},
			{
				id: uid("log"),
				at: Date.now() + 1,
				kind: "narrative",
				text: `${newScene.atmosphere}\n\n${newScene.summary}`
			}
		];
		next = {
			...next,
			currentSceneId: newScene.id,
			player: {
				...next.player,
				x: newScene.playerPos.x,
				y: newScene.playerPos.y
			},
			scenes: {
				...next.scenes,
				[newScene.id]: newScene
			},
			log: extraLog
		};
	}
	return next;
}
//#endregion
export { generateTheme as a, nearestObject as c, takeTurn as d, dist as i, proximity as l, PROXIMITY_LABEL as n, generateWorld as o, Textarea as r, makeSample as s, GeneratingOverlay as t, startNewGame as u };

import { t as create } from "../_libs/zustand.mjs";
import { t as openDB } from "../_libs/idb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-aj5Mlwov.js
var DB_NAME = "tuzhi-saves";
var DB_VERSION = 1;
var dbPromise = null;
function db() {
	if (!dbPromise) dbPromise = openDB(DB_NAME, DB_VERSION, { upgrade(database) {
		if (!database.objectStoreNames.contains("meta")) database.createObjectStore("meta", { keyPath: "id" });
		if (!database.objectStoreNames.contains("games")) database.createObjectStore("games", { keyPath: "id" });
	} });
	return dbPromise;
}
function toMeta(game) {
	const scene = game.scenes[game.currentSceneId];
	return {
		id: game.id,
		title: game.title,
		theme: game.theme,
		sceneName: scene?.name ?? "",
		playerName: game.player.name,
		turnCount: game.turnCount,
		createdAt: game.createdAt,
		updatedAt: game.updatedAt
	};
}
async function listSaves() {
	try {
		return (await (await db()).getAll("meta")).sort((a, b) => b.updatedAt - a.updatedAt);
	} catch {
		return [];
	}
}
async function loadGame(id) {
	try {
		return await (await db()).get("games", id) ?? null;
	} catch {
		return null;
	}
}
async function saveGame(game) {
	const next = {
		...game,
		updatedAt: Date.now()
	};
	const tx = (await db()).transaction(["meta", "games"], "readwrite");
	await tx.objectStore("games").put(next);
	await tx.objectStore("meta").put(toMeta(next));
	await tx.done;
}
async function deleteGame(id) {
	const tx = (await db()).transaction(["meta", "games"], "readwrite");
	await tx.objectStore("games").delete(id);
	await tx.objectStore("meta").delete(id);
	await tx.done;
}
function exportGame(game) {
	const blob = new Blob([JSON.stringify(game)], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${game.title || "tuzhi"}-${game.id}.json`;
	a.click();
	URL.revokeObjectURL(url);
}
async function importGameFile(file) {
	const text = await file.text();
	const parsed = JSON.parse(text);
	if (!parsed?.id || !parsed.scenes || !parsed.player) throw new Error("這份檔案不是有效的遊玩紀錄");
	parsed.updatedAt = Date.now();
	await saveGame(parsed);
	return parsed;
}
var CURRENT_KEY = "tuzhi:current";
function setCurrentId(id) {
	if (id) localStorage.setItem(CURRENT_KEY, id);
	else localStorage.removeItem(CURRENT_KEY);
}
function getCurrentId() {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(CURRENT_KEY);
}
var useGameStore = create((set, get) => ({
	game: null,
	hydrated: false,
	busy: null,
	error: null,
	setBusy: (busy) => set({ busy }),
	setError: (error) => set({ error }),
	setGame: async (game, persist = true) => {
		set({
			game,
			error: null
		});
		if (game) {
			setCurrentId(game.id);
			if (persist) try {
				await saveGame(game);
			} catch (err) {
				set({ error: err instanceof Error ? err.message : "存檔失敗" });
			}
		} else setCurrentId(null);
	},
	hydrate: async () => {
		if (get().hydrated) return;
		const id = getCurrentId();
		if (id) set({
			game: await loadGame(id),
			hydrated: true
		});
		else set({ hydrated: true });
	},
	remove: async (id) => {
		await deleteGame(id);
		if (get().game?.id === id) {
			set({ game: null });
			setCurrentId(null);
		}
	}
}));
//#endregion
export { loadGame as a, listSaves as i, exportGame as n, useGameStore as o, importGameFile as r, deleteGame as t };

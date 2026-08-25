import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Game, SaveMeta } from "./types";
import type { StoredCard } from "./chara-card";

const DB_NAME = "tuzhi-saves";
const DB_VERSION = 2;

interface TuzhiDB extends DBSchema {
  meta: { key: string; value: SaveMeta };
  games: { key: string; value: Game };
  cards: { key: string; value: StoredCard };
}

let dbPromise: Promise<IDBPDatabase<TuzhiDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<TuzhiDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("meta")) {
          database.createObjectStore("meta", { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains("games")) {
          database.createObjectStore("games", { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains("cards")) {
          database.createObjectStore("cards", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

function toMeta(game: Game): SaveMeta {
  const scene = game.scenes[game.currentSceneId];
  return {
    id: game.id,
    title: game.title,
    theme: game.theme,
    sceneName: scene?.name ?? "",
    playerName: game.player.name,
    turnCount: game.turnCount,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
}

export async function listSaves(): Promise<SaveMeta[]> {
  try {
    const database = await db();
    const all = await database.getAll("meta");
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function loadGame(id: string): Promise<Game | null> {
  try {
    const database = await db();
    return (await database.get("games", id)) ?? null;
  } catch {
    return null;
  }
}

export async function saveGame(game: Game): Promise<void> {
  const next: Game = { ...game, updatedAt: Date.now() };
  const database = await db();
  const tx = database.transaction(["meta", "games"], "readwrite");
  await tx.objectStore("games").put(next);
  await tx.objectStore("meta").put(toMeta(next));
  await tx.done;
}

export async function deleteGame(id: string): Promise<void> {
  const database = await db();
  const tx = database.transaction(["meta", "games"], "readwrite");
  await tx.objectStore("games").delete(id);
  await tx.objectStore("meta").delete(id);
  await tx.done;
}

export function exportGame(game: Game): void {
  const blob = new Blob([JSON.stringify(game)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${game.title || "tuzhi"}-${game.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importGameFile(file: File): Promise<Game> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Game;
  if (!parsed?.id || !parsed.scenes || !parsed.player) {
    throw new Error("這份檔案不是有效的遊玩紀錄");
  }
  parsed.updatedAt = Date.now();
  await saveGame(parsed);
  return parsed;
}

const CURRENT_KEY = "tuzhi:current";

export function setCurrentId(id: string | null): void {
  if (id) localStorage.setItem(CURRENT_KEY, id);
  else localStorage.removeItem(CURRENT_KEY);
}

export function getCurrentId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_KEY);
}

export async function listCards(): Promise<StoredCard[]> {
  try {
    const database = await db();
    const all = await database.getAll("cards");
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function loadCard(id: string): Promise<StoredCard | null> {
  try {
    const database = await db();
    return (await database.get("cards", id)) ?? null;
  } catch {
    return null;
  }
}

export async function saveCard(card: StoredCard): Promise<void> {
  const database = await db();
  await database.put("cards", card);
}

export async function deleteCard(id: string): Promise<void> {
  const database = await db();
  await database.delete("cards", id);
}

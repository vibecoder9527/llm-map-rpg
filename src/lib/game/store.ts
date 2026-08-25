import { create } from "zustand";
import type { Game } from "./types";
import {
  deleteGame,
  getCurrentId,
  loadGame,
  saveGame,
  setCurrentId,
} from "./save";

type GameStore = {
  game: Game | null;
  hydrated: boolean;
  busy: { stage: string; detail?: string } | null;
  abort: AbortController | null;
  error: string | null;
  setGame: (game: Game | null, persist?: boolean) => Promise<void>;
  setBusy: (busy: { stage: string; detail?: string } | null) => void;
  beginBusy: (stage: string, detail?: string) => AbortController;
  cancelBusy: () => void;
  setError: (error: string | null) => void;
  hydrate: () => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  hydrated: false,
  busy: null,
  abort: null,
  error: null,
  setBusy: (busy) => set({ busy }),
  beginBusy: (stage, detail) => {
    get().abort?.abort();
    const ac = new AbortController();
    set({ busy: { stage, detail }, abort: ac, error: null });
    return ac;
  },
  cancelBusy: () => {
    get().abort?.abort();
    set({ busy: null, abort: null });
  },
  setError: (error) => set({ error }),
  setGame: async (game, persist = true) => {
    set({ game, error: null });
    if (game) {
      setCurrentId(game.id);
      if (persist) {
        try {
          await saveGame(game);
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "存檔失敗",
          });
        }
      }
    } else {
      setCurrentId(null);
    }
  },
  hydrate: async () => {
    if (get().hydrated) return;
    const id = getCurrentId();
    if (id) {
      const game = await loadGame(id);
      set({ game, hydrated: true });
    } else {
      set({ hydrated: true });
    }
  },
  remove: async (id) => {
    await deleteGame(id);
    if (get().game?.id === id) {
      set({ game: null });
      setCurrentId(null);
    }
  },
}));

import { repairPlayerAvatars } from "@/app/_game/avatars";
import type { GameSession } from "@/app/_game/types";

export const STORAGE_KEY = "imposter-game:v2";

export function isPersistableSession(session: GameSession) {
  return session.status !== "idle" && session.status !== "finished";
}

export function saveSession(session: GameSession, storage: Storage = localStorage) {
  if (!isPersistableSession(session)) {
    storage.removeItem(STORAGE_KEY);
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(storage: Storage = localStorage): GameSession | null {
  const rawSession = storage.getItem(STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as Partial<GameSession>;

    if (!parsed.id || !parsed.status || !parsed.settings || !Array.isArray(parsed.players)) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      ...(parsed as GameSession),
      players: repairPlayerAvatars((parsed.players ?? []) as GameSession["players"]),
    };
  } catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearSession(storage: Storage = localStorage) {
  storage.removeItem(STORAGE_KEY);
}

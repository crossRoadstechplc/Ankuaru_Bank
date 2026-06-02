import { createDefaultDatabase } from "@/lib/seeds";
import type { DbCollection, JsonDatabase } from "./schema";
import { DB_UPDATED_EVENT } from "./schema";

let cache: JsonDatabase | null = null;
let loaded = false;
let loadPromise: Promise<JsonDatabase> | null = null;

function fallbackDatabase(): JsonDatabase {
  return cache ?? createDefaultDatabase();
}

export function isDatabaseLoaded() {
  return loaded && cache !== null;
}

export async function loadDatabase(): Promise<JsonDatabase> {
  if (cache && loaded) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = fetch("/api/db", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to load JSON database.");
      }
      const db = (await response.json()) as JsonDatabase;
      cache = db;
      loaded = true;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(DB_UPDATED_EVENT));
      }
      return db;
    })
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
}

export function dbGet<K extends DbCollection>(key: K): JsonDatabase[K] {
  if (cache) return cache[key];
  return createDefaultDatabase()[key];
}

export function dbSet<K extends DbCollection>(key: K, value: JsonDatabase[K]) {
  if (!cache) {
    cache = createDefaultDatabase();
  }
  cache[key] = value;

  if (typeof window !== "undefined") {
    void persistCollection(key);
  }
}

export async function persistCollection<K extends DbCollection>(
  key: K,
): Promise<void> {
  if (typeof window === "undefined") return;

  if (!cache) {
    cache = createDefaultDatabase();
  }

  const response = await fetch(`/api/db/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cache[key]),
  });

  if (!response.ok) {
    throw new Error(`Failed to persist ${key} to the server.`);
  }
}

export function getCachedDatabase() {
  return fallbackDatabase();
}

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createDefaultDatabase } from "@/lib/seeds";
import type { DbCollection, JsonDatabase } from "./schema";

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "db.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDatabase(): JsonDatabase {
  ensureDataDir();
  if (!existsSync(DB_PATH)) {
    const seeded = createDefaultDatabase();
    writeDatabase(seeded);
    return seeded;
  }

  try {
    return JSON.parse(readFileSync(DB_PATH, "utf8")) as JsonDatabase;
  } catch {
    const seeded = createDefaultDatabase();
    writeDatabase(seeded);
    return seeded;
  }
}

export function writeDatabase(db: JsonDatabase) {
  ensureDataDir();
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export function readCollection<K extends DbCollection>(key: K): JsonDatabase[K] {
  return readDatabase()[key];
}

export function writeCollection<K extends DbCollection>(
  key: K,
  value: JsonDatabase[K],
) {
  const db = readDatabase();
  db[key] = value;
  writeDatabase(db);
  return db;
}

export function resetDatabase() {
  const seeded = createDefaultDatabase();
  writeDatabase(seeded);
  return seeded;
}

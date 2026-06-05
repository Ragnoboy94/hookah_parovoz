import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { Table } from "./types";

const TABLES_PATH = path.join(process.cwd(), "data", "tables.json");

export async function getTables(): Promise<Table[]> {
  const raw = await readFile(TABLES_PATH, "utf-8");
  return JSON.parse(raw) as Table[];
}

export async function saveTables(tables: Table[]): Promise<void> {
  await writeFile(TABLES_PATH, JSON.stringify(tables, null, 2), "utf-8");
}

export async function getEnabledTables(): Promise<Table[]> {
  const tables = await getTables();
  return tables.filter((t) => t.enabled);
}

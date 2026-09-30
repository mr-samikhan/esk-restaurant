import path from "path";
import Database from "better-sqlite3";
import { app } from "electron";

import { runInitMigration } from "./migrations/init.js";
import { seedDatabase } from "./seed.js";

const dbPath = app.isPackaged
  ? path.join(app.getPath("userData"), "database.db")
  : path.join(process.cwd(), "local.db");

export const db = new Database(dbPath);

export function initDatabase() {
  db.pragma("journal_mode = WAL");

  runInitMigration(db);

  seedDatabase(db);

  //   console.log(app.getPath("userData"));
  //   console.log(db.name);

  console.log("Database initialized");
}

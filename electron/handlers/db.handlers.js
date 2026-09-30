import fs from "fs";
import path from "path";

import { ipcMain, app, dialog } from "electron";

import { db } from "../db/index.js";

export function registerDbHandlers() {
  // RESET DATABASE
  ipcMain.handle("db-reset-all", async () => {
    try {
      db.pragma("foreign_keys = OFF");

      const tables = db
        .prepare(
          `
          SELECT name FROM sqlite_master
          WHERE type='table'
          AND name NOT LIKE 'sqlite_%'
        `,
        )
        .all();

      const resetTransaction = db.transaction(() => {
        for (const table of tables) {
          db.prepare(`DROP TABLE IF EXISTS ${table.name}`).run();
        }
      });

      resetTransaction();

      db.pragma("foreign_keys = ON");

      app.relaunch();
      app.exit(0);

      return { success: true };
    } catch (err) {
      db.pragma("foreign_keys = ON");

      return {
        success: false,
        error: err.message,
      };
    }
  });

  // BACKUP DATABASE
  ipcMain.handle("db-backup-local", async () => {
    const result = await dialog.showSaveDialog({
      title: "Select Backup Location",
      defaultPath: path.join(
        app.getPath("documents"),
        `backup-${Date.now()}.db`,
      ),
      filters: [
        {
          name: "SQLite Database",
          extensions: ["db"],
        },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { success: false };
    }

    try {
      await db.backup(result.filePath);

      return {
        success: true,
        path: result.filePath,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  });

  // RESTORE DATABASE
  ipcMain.handle("db-restore-local", async () => {
    const result = await dialog.showOpenDialog({
      title: "Select Backup File",
      filters: [
        {
          name: "SQLite Database",
          extensions: ["db"],
        },
      ],
      properties: ["openFile"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false };
    }

    try {
      const dbPath = db.name;

      db.close();

      fs.copyFileSync(result.filePaths[0], dbPath);

      app.relaunch();
      app.exit(0);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  });

  // GET DB FILE BUFFER
  ipcMain.handle("db-get-file-buffer", async () => {
    try {
      const buffer = fs.readFileSync(db.name);

      return buffer;
    } catch (err) {
      throw err;
    }
  });

  // UPDATE LAST SYNC TIME
  ipcMain.handle("db-update-sync-time", () => {
    const now = new Date().toISOString();

    db.prepare(
      `
      INSERT OR REPLACE INTO settings
      (key, value)
      VALUES (?, ?)
    `,
    ).run("last_sync_time", now);

    return now;
  });
}

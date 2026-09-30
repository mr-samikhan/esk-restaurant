import { ipcMain } from "electron";

import { db } from "../db/index.js";

export function registerSettingsHandlers() {
  // GET SETTINGS
  ipcMain.handle("db-get-settings", () => {
    const rows = db.prepare("SELECT * FROM settings").all();

    return rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  });

  // UPDATE SETTINGS
  ipcMain.handle("db-update-settings", (event, settingsObj) => {
    try {
      const stmt = db.prepare(`
          INSERT OR REPLACE INTO settings
          (key, value)
          VALUES (?, ?)
        `);

      const transaction = db.transaction((data) => {
        for (const [key, value] of Object.entries(data)) {
          stmt.run(key, String(value));
        }
      });

      transaction(settingsObj);

      return {
        success: true,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  });
}

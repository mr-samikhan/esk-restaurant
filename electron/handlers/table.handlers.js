import { ipcMain } from "electron";
import { db } from "../db/index.js";

export function tableHandlers() {
  // GET ALL TABLES
  ipcMain.handle("db-get-tables", () => {
    try {
      return db
        .prepare("SELECT * FROM restaurant_tables ORDER BY id ASC")
        .all();
    } catch (err) {
      console.error("Error fetching tables:", err);
      return [];
    }
  });

  // CREATE TABLE (Accepts string `name`)
  ipcMain.handle("db-create-table", (event, name) => {
    try {
      if (!name || typeof name !== "string" || !name.trim()) {
        throw new Error("Table name is required.");
      }

      const info = db
        .prepare(
          `
          INSERT INTO restaurant_tables (name, status)
          VALUES (?, 'available')
        `,
        )
        .run(name.trim());

      return { success: true, id: info.lastInsertRowid };
    } catch (err) {
      console.error("Error creating table:", err);
      return { success: false, error: err.message };
    }
  });

  // UPDATE TABLE NAME (New channel for name edits)
  ipcMain.handle("db-update-table-name", (event, { id, name }) => {
    try {
      db.prepare(
        `
        UPDATE restaurant_tables
        SET name = ?
        WHERE id = ?
      `,
      ).run(name.trim(), id);

      return { success: true };
    } catch (err) {
      console.error("Error updating table name:", err);
      return { success: false, error: err.message };
    }
  });

  // UPDATE TABLE STATUS
  ipcMain.handle("db-update-table-status", (event, { id, status }) => {
    try {
      db.prepare(
        `
        UPDATE restaurant_tables
        SET status = ?
        WHERE id = ?
      `,
      ).run(status, id);

      return { success: true };
    } catch (err) {
      console.error("Error updating table status:", err);
      return { success: false, error: err.message };
    }
  });

  // DELETE TABLE
  ipcMain.handle("db-delete-table", (event, id) => {
    try {
      db.prepare(
        `
        DELETE FROM restaurant_tables
        WHERE id = ?
      `,
      ).run(id);

      return { success: true };
    } catch (err) {
      console.error("Error deleting table:", err);
      return { success: false, error: err.message };
    }
  });
}

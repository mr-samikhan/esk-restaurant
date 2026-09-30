import { ipcMain } from "electron";
import { db } from "../db/index.js";

export function registerCategoryHandlers() {
  // CREATE CATEGORY
  ipcMain.handle("db-create-category", (event, name) => {
    try {
      const stmt = db.prepare("INSERT INTO categories (name) VALUES (?)");
      const result = stmt.run(name.trim());
      return { success: true, id: result.lastInsertRowid };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // GET ALL
  ipcMain.handle("db-get-categories", () => {
    return db.prepare("SELECT * FROM categories ORDER BY id DESC").all();
  });

  // UPDATE
  ipcMain.handle("db-update-category", (event, { id, name }) => {
    try {
      db.prepare("UPDATE categories SET name=? WHERE id=?").run(name, id);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // DELETE
  ipcMain.handle("db-delete-category", (event, id) => {
    try {
      db.prepare("DELETE FROM categories WHERE id=?").run(id);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

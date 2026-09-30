import { ipcMain } from "electron";
import { db } from "../db/index.js";

export function registerMenuItemHandlers() {
  ipcMain.handle("db-get-items", () => {
    return db.prepare("SELECT * FROM items ORDER BY id DESC").all();
  });

  ipcMain.handle("db-get-items-by-category", (event, categoryId) => {
    return db
      .prepare("SELECT * FROM items WHERE category_id = ?")
      .all(categoryId);
  });

  ipcMain.handle("db-create-item", (event, data) => {
    const stmt = db.prepare(`
    INSERT INTO items 
    (category_id, name, price, cost_price, image, barcode, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

    return stmt.run(
      data.category_id,
      data.name,
      data.price,
      data.cost_price || 0,
      data.image || "",
      data.barcode || "",
      data.is_available ?? 1,
    );
  });

  ipcMain.handle("db-update-item", (event, { id, data }) => {
    console.log("payload", id, data);
    return db
      .prepare(
        `
    UPDATE items
    SET category_id=?, name=?, price=?, cost_price=?, image=?, barcode=?, is_available=?
    WHERE id=?
  `,
      )
      .run(
        data.category_id,
        data.name,
        data.price,
        data.cost_price,
        data.image,
        data.barcode,
        data.is_available,
        id,
      );
  });

  ipcMain.handle("db-delete-item", (event, id) => {
    return db.prepare("DELETE FROM items WHERE id=?").run(id);
  });
}

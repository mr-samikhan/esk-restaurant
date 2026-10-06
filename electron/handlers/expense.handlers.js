import { ipcMain } from "electron";

import { db } from "../db/index.js";
import { hashPassword } from "../utils/crypto.js";

let currentSession = null;

export function expensesHandlers() {
  ipcMain.handle("db-create-expense", (event, e) => {
    const stmt = db.prepare(`
    INSERT INTO expenses (title, category, amount, date, payment_method, is_recurring, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    return stmt.run(
      e.title,
      e.category,
      e.amount,
      e.date,
      e.payment_method,
      e.is_recurring ? 1 : 0,
      e.notes,
    );
  });

  ipcMain.handle("db-get-expenses", () => {
    return db
      .prepare("SELECT * FROM expenses ORDER BY date DESC, created_date DESC")
      .all();
  });

  ipcMain.handle("db-update-expense", (event, { id, data: e }) => {
    const stmt = db.prepare(`
    UPDATE expenses SET title=?, category=?, amount=?, date=?, payment_method=?, is_recurring=?, notes=?
    WHERE id=?
  `);
    return stmt.run(
      e.title,
      e.category,
      e.amount,
      e.date,
      e.payment_method,
      e.is_recurring ? 1 : 0,
      e.notes,
      id,
    );
  });

  ipcMain.handle("db-delete-expense", (event, id) => {
    return db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
  });
}

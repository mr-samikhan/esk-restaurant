import { ipcMain } from "electron";
import { db } from "../db/index.js";

export function invoiceHanlders() {
  ipcMain.handle("db-get-invoices", (event) => {
    try {
      const invoices = db
        .prepare(
          `
      SELECT 
        o.*,
        JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', oi.id,
            'item_id', oi.item_id,
            'item_name', oi.item_name,
            'qty', oi.qty,
            'price', oi.price,
            'total', oi.total
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `,
        )
        .all();

      // Parse JSON stringified items array for each order
      return invoices.map((inv) => ({
        ...inv,
        items: JSON.parse(inv.items || "[]"),
      }));
    } catch (err) {
      console.error("Error fetching invoices:", err);
      return [];
    }
  });

  ipcMain.handle("db-get-invoice", (event, id) => {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);

    const items = db
      .prepare(
        `
      SELECT *
      FROM order_items
      WHERE order_id = ?
    `,
      )
      .all(id);

    return {
      order,
      items,
    };
  });
}

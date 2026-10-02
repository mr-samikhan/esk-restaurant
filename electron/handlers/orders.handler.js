import { ipcMain } from "electron";
import { db } from "../db/index.js";

export function orderHandlers() {
  ipcMain.handle("db-create-order", (e, tableId, tableName) => {
    const existing = db
      .prepare("SELECT * FROM orders WHERE table_id=? AND status='open'")
      .get(tableId);

    if (existing) return { order: existing };

    const result = db
      .prepare(
        `INSERT INTO orders (table_id, status, total_amount)
       VALUES (?, 'open', 0)`,
      )
      .run(tableId);

    return {
      order: {
        id: result.lastInsertRowid,
        table_id: tableId,
        status: "open",
        items: [],
      },
    };
  });

  ipcMain.handle("db-get-orders", () => {
    return db.prepare("SELECT * FROM orders ORDER BY id DESC").all();
  });

  ipcMain.handle("db-get-active-orders", () => {
    const orders = db
      .prepare(
        `
      SELECT *
      FROM orders
      WHERE status != 'paid'
      AND status != 'cancelled'
      ORDER BY created_at DESC
    `,
      )
      .all();

    return orders.map((order) => {
      const items = db
        .prepare(
          `
        SELECT *
        FROM order_items
        WHERE order_id = ?
      `,
        )
        .all(order.id);

      return {
        ...order,
        items,
      };
    });
  });

  ipcMain.handle("db-update-order-status", (event, { orderId, status }) => {
    try {
      const paymentStatus =
        status === "completed" || status === "paid" ? "paid" : "unpaid";

      db.prepare(
        `
      UPDATE orders
      SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      ).run(status, paymentStatus, orderId);

      // If order completed or paid, release table
      if (status === "completed" || status === "paid") {
        const order = db
          .prepare(`SELECT table_id, table_name FROM orders WHERE id = ?`)
          .get(orderId);

        if (order?.table_id) {
          db.prepare(
            `UPDATE restaurant_tables SET status = 'available' WHERE id = ?`,
          ).run(order.table_id);
        } else if (order?.table_name) {
          db.prepare(
            `UPDATE restaurant_tables SET status = 'available' WHERE name = ?`,
          ).run(order.table_name);
        }
      }

      return { success: true };
    } catch (err) {
      console.error("Error updating order status:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("db-delete-order", (event, orderId) => {
    try {
      // Get table before deleting order
      const order = db
        .prepare(
          `
        SELECT table_id
        FROM orders
        WHERE id = ?
      `,
        )
        .get(orderId);

      // Delete order items
      db.prepare(
        `
      DELETE FROM order_items
      WHERE order_id = ?
    `,
      ).run(orderId);

      // Delete order
      db.prepare(
        `
      DELETE FROM orders
      WHERE id = ?
    `,
      ).run(orderId);

      // Make table available again
      if (order?.table_id) {
        db.prepare(
          `
        UPDATE restaurant_tables
        SET status = 'available'
        WHERE id = ?
      `,
        ).run(order.table_id);
      }

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

  // IPC Handler: get active order for a table
  ipcMain.handle("db-get-active-order-by-table", (event, tableId) => {
    try {
      // 1. Look ONLY for pending orders for this table
      let order = db
        .prepare(
          `
      SELECT * FROM orders 
      WHERE table_id = ? AND status = 'pending'
      LIMIT 1
    `,
        )
        .get(tableId);

      // 2. If no pending order exists, create a NEW pending order
      if (!order) {
        const table = db
          .prepare(`SELECT name FROM restaurant_tables WHERE id = ?`)
          .get(tableId);
        const tableName = table?.name || `Table ${tableId}`;

        const info = db
          .prepare(
            `
        INSERT INTO orders (table_id, table_name, status, payment_status)
        VALUES (?, ?, 'pending', 'unpaid')
      `,
          )
          .run(tableId, tableName);

        // Set table status to occupied
        db.prepare(
          `UPDATE restaurant_tables SET status = 'occupied' WHERE id = ?`,
        ).run(tableId);

        order = db
          .prepare(`SELECT * FROM orders WHERE id = ?`)
          .get(info.lastInsertRowid);
      }

      return order;
    } catch (err) {
      console.error("Error getting active order:", err);
      return null;
    }
  });

  ipcMain.handle("db-get-order-items", (event, orderId) => {
    try {
      const items = db
        .prepare(
          `
        SELECT * FROM order_items
        WHERE order_id = ?
      `,
        )
        .all(orderId);

      return items;
    } catch (err) {
      console.error(err);
      return [];
    }
  });

  ipcMain.handle("db-update-order-item-qty", (e, payload) => {
    const { orderId, id: itemId, qty, total } = payload || {};

    // Update order_items by order_id AND item_id
    db.prepare(
      `
    UPDATE order_items
    SET qty = ?,
        total = ?
    WHERE order_id = ? AND item_id = ?
  `,
    ).run(qty, total, orderId, itemId);

    // Recalculate grand total for the order
    const result = db
      .prepare(
        `
    SELECT COALESCE(SUM(total), 0) as grandTotal
    FROM order_items
    WHERE order_id = ?
  `,
      )
      .get(orderId);

    db.prepare(
      `
    UPDATE orders
    SET total_amount = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
    ).run(result.grandTotal, orderId);

    return { success: true, total: result.grandTotal };
  });

  ipcMain.handle("db-delete-order-item", (event, id) => {
    try {
      // Get order id first
      const item = db
        .prepare(
          `
        SELECT order_id
        FROM order_items
        WHERE id = ?
      `,
        )
        .get(id);

      if (!item) {
        return {
          success: false,
          error: "Item not found",
        };
      }

      // Delete item
      db.prepare(
        `
      DELETE FROM order_items
      WHERE id = ?
    `,
      ).run(id);

      // Recalculate order total
      const result = db
        .prepare(
          `
        SELECT COALESCE(SUM(total), 0) AS grandTotal
        FROM order_items
        WHERE order_id = ?
      `,
        )
        .get(item.order_id);

      db.prepare(
        `
      UPDATE orders
      SET total_amount = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      ).run(result.grandTotal, item.order_id);

      return {
        success: true,
        total: result.grandTotal,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  });

  ipcMain.handle("db-create-or-get-order", (event, { tableId, tableName }) => {
    try {
      // 1. CRITICAL FIX: Look ONLY for a 'pending' order for this table
      let order = db
        .prepare(
          `SELECT * FROM orders 
         WHERE table_id = ? AND status = 'pending' 
         ORDER BY id DESC LIMIT 1`,
        )
        .get(tableId);

      // 2. If no pending order exists (or previous order was 'completed'/'paid')
      // CREATE A BRAND NEW ORDER
      if (!order) {
        const info = db
          .prepare(
            `INSERT INTO orders (table_id, table_name, status, payment_status)
           VALUES (?, ?, 'pending', 'unpaid')`,
          )
          .run(tableId, tableName);

        // Fetch the newly generated order
        order = db
          .prepare(`SELECT * FROM orders WHERE id = ?`)
          .get(info.lastInsertRowid);
      }

      // 3. Update table status to occupied
      db.prepare(
        `UPDATE restaurant_tables SET status = 'occupied' WHERE id = ?`,
      ).run(tableId);

      return {
        success: true,
        order,
      };
    } catch (err) {
      console.error("Error in getOrCreate order:", err);
      return {
        success: false,
        error: err.message,
      };
    }
  });

  ipcMain.handle("db-add-order-item", (e, payload) => {
    const { orderId, item } = payload || {};

    const existing = db
      .prepare(
        `
      SELECT *
      FROM order_items
      WHERE order_id = ? AND item_id = ?
    `,
      )
      .get(orderId, item.id);

    if (existing) {
      const newQty = existing.qty + 1;
      const newTotal = newQty * existing.price;

      db.prepare(
        `
      UPDATE order_items
      SET qty = ?,
          total = ?
      WHERE id = ?
    `,
      ).run(newQty, newTotal, existing.id);
    } else {
      db.prepare(
        `
      INSERT INTO order_items
      (
        order_id,
        item_id,
        item_name,
        qty,
        price,
        total
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      ).run(orderId, item.id, item.name, 1, item.price, item.price);
    }

    // Recalculate order total
    const result = db
      .prepare(
        `
      SELECT COALESCE(SUM(total),0) as grandTotal
      FROM order_items
      WHERE order_id = ?
    `,
      )
      .get(orderId);

    db.prepare(
      `
    UPDATE orders
    SET total_amount = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
    ).run(result.grandTotal, orderId);

    return {
      success: true,
      total: result.grandTotal,
    };
  });

  ipcMain.handle("db-close-order", (e, orderId) => {
    db.prepare("UPDATE orders SET status='paid' WHERE id=?").run(orderId);

    return { success: true };
  });

  ipcMain.handle("db-checkout-order", (event, payload) => {
    try {
      const {
        orderId,
        subtotal = 0,
        discount = 0,
        serviceCharges = 0,
        kpraTax = 0,
        kpraPercentage = 0,
        total = 0,
        customerId = null,
        customerName = "Walk-in",
        paymentMethod = "cash",
        status = "completed",
      } = payload;

      const paymentStatus = status === "completed" ? "paid" : "unpaid";

      // 1. Update order status
      db.prepare(
        `
      UPDATE orders
      SET 
        subtotal = ?,
        discount_amount = ?,
        service_charges = ?,
        kpra_tax = ?,
        kpra_percentage = ?,
        tax = ?,
        total_amount = ?,
        customer_id = ?,
        customer_name = ?,
        payment_method = ?,
        status = ?,
        payment_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      ).run(
        subtotal,
        discount,
        serviceCharges,
        kpraTax,
        kpraPercentage,
        kpraTax,
        total,
        customerId,
        customerName,
        paymentMethod,
        status,
        paymentStatus,
        orderId,
      );

      // 2. Fetch the order details
      const order = db
        .prepare(`SELECT * FROM orders WHERE id = ?`)
        .get(orderId);

      // 3. Free table using BOTH table_id AND table_name fallback
      if (status === "completed" && order) {
        if (order.table_id) {
          db.prepare(
            `
          UPDATE restaurant_tables
          SET status = 'available'
          WHERE id = ?
        `,
          ).run(order.table_id);
        } else if (order.table_name) {
          db.prepare(
            `
          UPDATE restaurant_tables
          SET status = 'available'
          WHERE name = ?
        `,
          ).run(order.table_name);
        }
      }

      return { success: true, order };
    } catch (err) {
      console.error("Checkout order error:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("db-clear-cart", (event, orderId) => {
    try {
      db.prepare(
        `
      DELETE FROM order_items
      WHERE order_id = ?
    `,
      ).run(orderId);

      db.prepare(
        `
      UPDATE orders
      SET total_amount = 0
      WHERE id = ?
    `,
      ).run(orderId);

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

  ipcMain.handle("db-get-order", (e, id) => {
    return db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);
  });
}

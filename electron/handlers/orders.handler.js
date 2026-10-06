// import { ipcMain } from "electron";
// import { db } from "../db/index.js";

// export function orderHandlers() {
//   ipcMain.handle("db-create-order", (e, tableId, tableName) => {
//     const existing = db
//       .prepare("SELECT * FROM orders WHERE table_id=? AND status='open'")
//       .get(tableId);

//     if (existing) return { order: existing };

//     const result = db
//       .prepare(
//         `INSERT INTO orders (table_id, status, total_amount)
//        VALUES (?, 'open', 0)`,
//       )
//       .run(tableId);

//     return {
//       order: {
//         id: result.lastInsertRowid,
//         table_id: tableId,
//         status: "open",
//         items: [],
//       },
//     };
//   });

//   ipcMain.handle("db-get-orders", () => {
//     return db.prepare("SELECT * FROM orders ORDER BY id DESC").all();
//   });

//   ipcMain.handle("db-get-active-orders", () => {
//     const orders = db
//       .prepare(
//         `
//       SELECT *
//       FROM orders
//       WHERE status != 'paid'
//       AND status != 'cancelled'
//       ORDER BY created_at DESC
//     `,
//       )
//       .all();

//     return orders.map((order) => {
//       const items = db
//         .prepare(
//           `
//         SELECT *
//         FROM order_items
//         WHERE order_id = ?
//       `,
//         )
//         .all(order.id);

//       return {
//         ...order,
//         items,
//       };
//     });
//   });

//   ipcMain.handle("db-update-order-status", (event, { orderId, status }) => {
//     try {
//       const paymentStatus =
//         status === "completed" || status === "paid" ? "paid" : "unpaid";

//       db.prepare(
//         `
//       UPDATE orders
//       SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
//       WHERE id = ?
//     `,
//       ).run(status, paymentStatus, orderId);

//       // If order completed or paid, release table
//       if (status === "completed" || status === "paid") {
//         const order = db
//           .prepare(`SELECT table_id, table_name FROM orders WHERE id = ?`)
//           .get(orderId);

//         if (order?.table_id) {
//           db.prepare(
//             `UPDATE restaurant_tables SET status = 'available' WHERE id = ?`,
//           ).run(order.table_id);
//         } else if (order?.table_name) {
//           db.prepare(
//             `UPDATE restaurant_tables SET status = 'available' WHERE name = ?`,
//           ).run(order.table_name);
//         }
//       }

//       return { success: true };
//     } catch (err) {
//       console.error("Error updating order status:", err);
//       return { success: false, error: err.message };
//     }
//   });

//   ipcMain.handle("db-delete-order", (event, orderId) => {
//     try {
//       // Get table before deleting order
//       const order = db
//         .prepare(
//           `
//         SELECT table_id
//         FROM orders
//         WHERE id = ?
//       `,
//         )
//         .get(orderId);

//       // Delete order items
//       db.prepare(
//         `
//       DELETE FROM order_items
//       WHERE order_id = ?
//     `,
//       ).run(orderId);

//       // Delete order
//       db.prepare(
//         `
//       DELETE FROM orders
//       WHERE id = ?
//     `,
//       ).run(orderId);

//       // Make table available again
//       if (order?.table_id) {
//         db.prepare(
//           `
//         UPDATE restaurant_tables
//         SET status = 'available'
//         WHERE id = ?
//       `,
//         ).run(order.table_id);
//       }

//       return {
//         success: true,
//       };
//     } catch (err) {
//       return {
//         success: false,
//         error: err.message,
//       };
//     }
//   });

//   // IPC Handler: get active order for a table
//   ipcMain.handle("db-get-active-order-by-table", (event, tableId) => {
//     try {
//       // 1. Look ONLY for pending orders for this table
//       let order = db
//         .prepare(
//           `
//       SELECT * FROM orders
//       WHERE table_id = ? AND status = 'pending'
//       LIMIT 1
//     `,
//         )
//         .get(tableId);

//       // 2. If no pending order exists, create a NEW pending order
//       if (!order) {
//         const table = db
//           .prepare(`SELECT name FROM restaurant_tables WHERE id = ?`)
//           .get(tableId);
//         const tableName = table?.name || `Table ${tableId}`;

//         const info = db
//           .prepare(
//             `
//         INSERT INTO orders (table_id, table_name, status, payment_status)
//         VALUES (?, ?, 'pending', 'unpaid')
//       `,
//           )
//           .run(tableId, tableName);

//         // Set table status to occupied
//         db.prepare(
//           `UPDATE restaurant_tables SET status = 'occupied' WHERE id = ?`,
//         ).run(tableId);

//         order = db
//           .prepare(`SELECT * FROM orders WHERE id = ?`)
//           .get(info.lastInsertRowid);
//       }

//       return order;
//     } catch (err) {
//       console.error("Error getting active order:", err);
//       return null;
//     }
//   });

//   ipcMain.handle("db-get-order-items", (event, orderId) => {
//     try {
//       const items = db
//         .prepare(
//           `
//         SELECT * FROM order_items
//         WHERE order_id = ?
//       `,
//         )
//         .all(orderId);

//       return items;
//     } catch (err) {
//       console.error(err);
//       return [];
//     }
//   });

//   // ipcMain.handle("db-update-order-item-qty", (e, payload) => {
//   //   const { orderId, id: itemId, qty, total } = payload || {};

//   //   // Update order_items by order_id AND item_id
//   //   db.prepare(
//   //     `
//   //   UPDATE order_items
//   //   SET qty = ?,
//   //       total = ?
//   //   WHERE order_id = ? AND item_id = ?
//   // `,
//   //   ).run(qty, total, orderId, itemId);

//   //   // Recalculate grand total for the order
//   //   const result = db
//   //     .prepare(
//   //       `
//   //   SELECT COALESCE(SUM(total), 0) as grandTotal
//   //   FROM order_items
//   //   WHERE order_id = ?
//   // `,
//   //     )
//   //     .get(orderId);

//   //   db.prepare(
//   //     `
//   //   UPDATE orders
//   //   SET total_amount = ?,
//   //       updated_at = CURRENT_TIMESTAMP
//   //   WHERE id = ?
//   // `,
//   //   ).run(result.grandTotal, orderId);

//   //   return { success: true, total: result.grandTotal };
//   // });

//   ipcMain.handle("db-update-order-item-qty", (e, payload) => {
//     try {
//       const { orderId, id: itemId, qty, total } = payload || {};

//       // Update order_items by order_id AND (item_id OR primary key id)
//       db.prepare(
//         `
//       UPDATE order_items
//       SET qty = ?,
//           total = ?
//       WHERE order_id = ? AND (item_id = ? OR id = ?)
//     `,
//       ).run(qty, total, orderId, itemId, itemId);

//       // Recalculate grand total for the order
//       const result = db
//         .prepare(
//           `
//       SELECT COALESCE(SUM(total), 0) as grandTotal
//       FROM order_items
//       WHERE order_id = ?
//     `,
//         )
//         .get(orderId);

//       db.prepare(
//         `
//       UPDATE orders
//       SET total_amount = ?,
//           updated_at = CURRENT_TIMESTAMP
//       WHERE id = ?
//     `,
//       ).run(result.grandTotal, orderId);

//       return { success: true, total: result.grandTotal };
//     } catch (err) {
//       console.error("Error updating order item qty:", err);
//       return { success: false, error: err.message };
//     }
//   });

//   ipcMain.handle("db-delete-order-item", (event, payload) => {
//     try {
//       let orderId;
//       let targetId;

//       // Handle both single ID parameter and object { orderId, itemId }
//       if (typeof payload === "object" && payload !== null) {
//         orderId = payload.orderId;
//         targetId = payload.itemId || payload.id;
//       } else {
//         targetId = payload;
//       }

//       // If orderId wasn't explicitly passed, try looking up by primary key or item_id
//       if (!orderId) {
//         const item = db
//           .prepare(
//             `
//           SELECT order_id
//           FROM order_items
//           WHERE id = ? OR item_id = ?
//         `,
//           )
//           .get(targetId, targetId);

//         if (!item) {
//           return {
//             success: false,
//             error: "Item not found",
//           };
//         }
//         orderId = item.order_id;
//       }

//       // Delete item by primary key OR by product ID for that specific order
//       db.prepare(
//         `
//       DELETE FROM order_items
//       WHERE (id = ? OR item_id = ?)
//       ${orderId ? "AND order_id = ?" : ""}
//     `,
//       ).run(
//         ...(orderId ? [targetId, targetId, orderId] : [targetId, targetId]),
//       );

//       // Recalculate order total
//       const result = db
//         .prepare(
//           `
//         SELECT COALESCE(SUM(total), 0) AS grandTotal
//         FROM order_items
//         WHERE order_id = ?
//       `,
//         )
//         .get(orderId);

//       db.prepare(
//         `
//       UPDATE orders
//       SET total_amount = ?,
//           updated_at = CURRENT_TIMESTAMP
//       WHERE id = ?
//     `,
//       ).run(result.grandTotal, orderId);

//       return {
//         success: true,
//         total: result.grandTotal,
//       };
//     } catch (err) {
//       return {
//         success: false,
//         error: err.message,
//       };
//     }
//   });

//   ipcMain.handle("db-create-or-get-order", (event, { tableId, tableName }) => {
//     try {
//       // 1. CRITICAL FIX: Look ONLY for a 'pending' order for this table
//       let order = db
//         .prepare(
//           `SELECT * FROM orders
//          WHERE table_id = ? AND status = 'pending'
//          ORDER BY id DESC LIMIT 1`,
//         )
//         .get(tableId);

//       // 2. If no pending order exists (or previous order was 'completed'/'paid')
//       // CREATE A BRAND NEW ORDER
//       if (!order) {
//         const info = db
//           .prepare(
//             `INSERT INTO orders (table_id, table_name, status, payment_status)
//            VALUES (?, ?, 'pending', 'unpaid')`,
//           )
//           .run(tableId, tableName);

//         // Fetch the newly generated order
//         order = db
//           .prepare(`SELECT * FROM orders WHERE id = ?`)
//           .get(info.lastInsertRowid);
//       }

//       // 3. Update table status to occupied
//       db.prepare(
//         `UPDATE restaurant_tables SET status = 'occupied' WHERE id = ?`,
//       ).run(tableId);

//       return {
//         success: true,
//         order,
//       };
//     } catch (err) {
//       console.error("Error in getOrCreate order:", err);
//       return {
//         success: false,
//         error: err.message,
//       };
//     }
//   });

//   ipcMain.handle("db-add-order-item", (e, payload) => {
//     const { orderId, item } = payload || {};

//     const existing = db
//       .prepare(
//         `
//       SELECT *
//       FROM order_items
//       WHERE order_id = ? AND item_id = ?
//     `,
//       )
//       .get(orderId, item.id);

//     if (existing) {
//       const newQty = existing.qty + 1;
//       const newTotal = newQty * existing.price;

//       db.prepare(
//         `
//       UPDATE order_items
//       SET qty = ?,
//           total = ?
//       WHERE id = ?
//     `,
//       ).run(newQty, newTotal, existing.id);
//     } else {
//       db.prepare(
//         `
//       INSERT INTO order_items
//       (
//         order_id,
//         item_id,
//         item_name,
//         qty,
//         price,
//         total
//       )
//       VALUES (?, ?, ?, ?, ?, ?)
//     `,
//       ).run(orderId, item.id, item.name, 1, item.price, item.price);
//     }

//     // Recalculate order total
//     const result = db
//       .prepare(
//         `
//       SELECT COALESCE(SUM(total),0) as grandTotal
//       FROM order_items
//       WHERE order_id = ?
//     `,
//       )
//       .get(orderId);

//     db.prepare(
//       `
//     UPDATE orders
//     SET total_amount = ?,
//         updated_at = CURRENT_TIMESTAMP
//     WHERE id = ?
//   `,
//     ).run(result.grandTotal, orderId);

//     return {
//       success: true,
//       total: result.grandTotal,
//     };
//   });

//   ipcMain.handle("db-close-order", (e, orderId) => {
//     db.prepare("UPDATE orders SET status='paid' WHERE id=?").run(orderId);

//     return { success: true };
//   });

//   ipcMain.handle("db-checkout-order", (event, payload) => {
//     try {
//       const {
//         orderId,
//         subtotal = 0,
//         discount = 0,
//         serviceCharges = 0,
//         kpraTax = 0,
//         kpraPercentage = 0,
//         total = 0,
//         customerId = null,
//         customerName = "Walk-in",
//         paymentMethod = "cash",
//         status = "completed",
//       } = payload;

//       const paymentStatus = status === "completed" ? "paid" : "unpaid";

//       // 1. Update order status
//       db.prepare(
//         `
//       UPDATE orders
//       SET
//         subtotal = ?,
//         discount_amount = ?,
//         service_charges = ?,
//         kpra_tax = ?,
//         kpra_percentage = ?,
//         tax = ?,
//         total_amount = ?,
//         customer_id = ?,
//         customer_name = ?,
//         payment_method = ?,
//         status = ?,
//         payment_status = ?,
//         updated_at = CURRENT_TIMESTAMP
//       WHERE id = ?
//     `,
//       ).run(
//         subtotal,
//         discount,
//         serviceCharges,
//         kpraTax,
//         kpraPercentage,
//         kpraTax,
//         total,
//         customerId,
//         customerName,
//         paymentMethod,
//         status,
//         paymentStatus,
//         orderId,
//       );

//       // 2. Fetch the order details
//       const order = db
//         .prepare(`SELECT * FROM orders WHERE id = ?`)
//         .get(orderId);

//       // 3. Free table using BOTH table_id AND table_name fallback
//       if (status === "completed" && order) {
//         if (order.table_id) {
//           db.prepare(
//             `
//           UPDATE restaurant_tables
//           SET status = 'available'
//           WHERE id = ?
//         `,
//           ).run(order.table_id);
//         } else if (order.table_name) {
//           db.prepare(
//             `
//           UPDATE restaurant_tables
//           SET status = 'available'
//           WHERE name = ?
//         `,
//           ).run(order.table_name);
//         }
//       }

//       return { success: true, order };
//     } catch (err) {
//       console.error("Checkout order error:", err);
//       return { success: false, error: err.message };
//     }
//   });

//   ipcMain.handle("db-clear-cart", (event, orderId) => {
//     try {
//       db.prepare(
//         `
//       DELETE FROM order_items
//       WHERE order_id = ?
//     `,
//       ).run(orderId);

//       db.prepare(
//         `
//       UPDATE orders
//       SET total_amount = 0
//       WHERE id = ?
//     `,
//       ).run(orderId);

//       return {
//         success: true,
//       };
//     } catch (err) {
//       return {
//         success: false,
//         error: err.message,
//       };
//     }
//   });

//   ipcMain.handle("db-get-order", (e, id) => {
//     return db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);
//   });
// }

import { ipcMain } from "electron";
import { db } from "../db/index.js";

/**
 * Helper to generate gapless sequential invoice numbers (INV-0001, INV-0002)
 * Must be executed inside a database transaction to eliminate race conditions.
 */
function generateNextInvoiceNumber() {
  const lastInvoice = db
    .prepare("SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1")
    .get();

  let nextSeq = 1;
  if (lastInvoice && lastInvoice.invoice_number) {
    const lastNum = parseInt(
      lastInvoice.invoice_number.replace("INV-", ""),
      10,
    );
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1;
    }
  }

  return `INV-${String(nextSeq).padStart(4, "0")}`;
}

export function migrateCompletedOrdersToInvoices() {
  const completedOrdersWithoutInvoice = db
    .prepare(
      `
      SELECT o.* 
      FROM orders o
      LEFT JOIN invoices i ON o.id = i.order_id
      WHERE (o.status = 'completed' OR o.status = 'paid' OR o.payment_status = 'paid')
        AND i.id IS NULL
      ORDER BY o.id ASC
    `,
    )
    .all();

  if (completedOrdersWithoutInvoice.length === 0) return;

  console.log(
    `Backfilling ${completedOrdersWithoutInvoice.length} completed orders into invoices table...`,
  );

  const backfillTx = db.transaction(() => {
    for (const order of completedOrdersWithoutInvoice) {
      // Get the last invoice number to maintain sequential numbering
      const lastInvoice = db
        .prepare("SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1")
        .get();

      let nextSeq = 1;
      if (lastInvoice && lastInvoice.invoice_number) {
        const lastNum = parseInt(
          lastInvoice.invoice_number.replace("INV-", ""),
          10,
        );
        if (!isNaN(lastNum)) nextSeq = lastNum + 1;
      }

      const invoiceNumber = `INV-${String(nextSeq).padStart(4, "0")}`;

      db.prepare(
        `
        INSERT INTO invoices (
          invoice_number,
          order_id,
          table_id,
          table_name,
          customer_id,
          customer_name,
          payment_method,
          subtotal,
          discount,
          kpra_tax,
          kpra_percentage,
          service_charges,
          total_amount,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)
      `,
      ).run(
        invoiceNumber,
        order.id,
        order.table_id || null,
        order.table_name || "Takeaway",
        order.customer_id || null,
        order.customer_name || "Walk-in",
        order.payment_method || "cash",
        order.subtotal || order.total_amount || 0,
        order.discount_amount || 0,
        order.kpra_tax || order.tax || 0,
        order.kpra_percentage || 0,
        order.service_charges || 0,
        order.total_amount || 0,
        order.created_at || new Date().toISOString(),
      );
    }
  });

  backfillTx();
  console.log("Backfill completed successfully.");
}

export function orderHandlers() {
  // ==========================================
  // INVOICE HANDLERS
  // ==========================================

  // Get all valid active invoices
  ipcMain.handle("db-get-invoices", () => {
    try {
      const invoices = db
        .prepare(
          `SELECT 
          i.*,
          COALESCE(
            (
              SELECT json_group_array(
                json_object(
                  'id', oi.id,
                  'item_id', oi.item_id,
                  'item_name', oi.item_name,
                  'qty', oi.qty,
                  'price', oi.price,
                  'total', oi.total
                )
              )
              FROM order_items oi
              WHERE oi.order_id = i.order_id
            ),
            '[]'
          ) AS items
        FROM invoices i
        ORDER BY i.id DESC`,
        )
        .all();

      // Parse the JSON string from SQLite for each invoice
      return invoices.map((inv) => ({
        ...inv,
        items:
          typeof inv.items === "string"
            ? JSON.parse(inv.items)
            : inv.items || [],
      }));
    } catch (err) {
      console.error("Error fetching invoices with items:", err);
      return { success: false, error: err.message };
    }
  });

  // Get a single invoice by ID along with its order items
  ipcMain.handle("db-get-invoice", (event, invoiceId) => {
    try {
      const invoice = db
        .prepare("SELECT * FROM invoices WHERE id = ?")
        .get(invoiceId);

      if (!invoice) return null;

      const items = db
        .prepare("SELECT * FROM order_items WHERE order_id = ?")
        .all(invoice.order_id);

      return {
        ...invoice,
        items,
      };
    } catch (err) {
      console.error("Error fetching invoice details:", err);
      return null;
    }
  });

  // Soft-delete an invoice (Marks status as 'cancelled' to protect tax compliance)
  ipcMain.handle("db-delete-invoice", (event, invoiceId) => {
    try {
      // Ensure foreign key constraints (like ON DELETE CASCADE on order_items) are active
      db.pragma("foreign_keys = ON;");

      const deleteInvoiceTx = db.transaction((id) => {
        // 1. Get the linked order_id BEFORE deleting the invoice row
        const invoice = db
          .prepare("SELECT order_id FROM invoices WHERE id = ?")
          .get(id);

        // 2. Delete the invoice row
        db.prepare("DELETE FROM invoices WHERE id = ?").run(id);

        // 3. Delete the order (this automatically cascades and deletes order_items)
        if (invoice && invoice.order_id) {
          db.prepare("DELETE FROM orders WHERE id = ?").run(invoice.order_id);

          // Manual fallback for order_items if PRAGMA foreign_keys is off
          db.prepare("DELETE FROM order_items WHERE order_id = ?").run(
            invoice.order_id,
          );
        }
      });

      deleteInvoiceTx(invoiceId);
      return { success: true };
    } catch (err) {
      console.error("Error permanently deleting invoice and children:", err);
      return { success: false, error: err.message };
    }
  });

  // ==========================================
  // ORDER CHECKOUT (GENERATES INVOICE)
  // ==========================================

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

      // Execute as a single atomic transaction
      const checkoutTx = db.transaction(() => {
        // 1. Update Order Record
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

        // 2. Fetch completed order details
        const order = db
          .prepare(`SELECT * FROM orders WHERE id = ?`)
          .get(orderId);

        let createdInvoice = null;

        // 3. Generate Official Invoice ONLY if the status is completed/paid
        if (status === "completed" || status === "paid") {
          const invoiceNumber = generateNextInvoiceNumber();

          const invResult = db
            .prepare(
              `
            INSERT INTO invoices (
              invoice_number,
              order_id,
              table_id,
              table_name,
              customer_id,
              customer_name,
              payment_method,
              subtotal,
              discount,
              kpra_tax,
              kpra_percentage,
              service_charges,
              total_amount,
              status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid')
          `,
            )
            .run(
              invoiceNumber,
              orderId,
              order?.table_id || null,
              order?.table_name || "Takeaway",
              customerId,
              customerName,
              paymentMethod,
              subtotal,
              discount,
              kpraTax,
              kpraPercentage,
              serviceCharges,
              total,
            );

          createdInvoice = db
            .prepare("SELECT * FROM invoices WHERE id = ?")
            .get(invResult.lastInsertRowid);

          // 4. Free restaurant table
          if (order?.table_id) {
            db.prepare(
              "UPDATE restaurant_tables SET status = 'available' WHERE id = ?",
            ).run(order.table_id);
          } else if (order?.table_name) {
            db.prepare(
              "UPDATE restaurant_tables SET status = 'available' WHERE name = ?",
            ).run(order.table_name);
          }
        }

        return { order, invoice: createdInvoice };
      });

      const result = checkoutTx();
      return { success: true, ...result };
    } catch (err) {
      console.error("Checkout order error:", err);
      return { success: false, error: err.message };
    }
  });

  // ==========================================
  // EXISTING ORDER HANDLERS
  // ==========================================

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

      // Free table & generate invoice if status is completed or paid
      if (status === "completed" || status === "paid") {
        const order = db
          .prepare(`SELECT * FROM orders WHERE id = ?`)
          .get(orderId);

        // Check if an invoice already exists for this order
        const existingInvoice = db
          .prepare(`SELECT id FROM invoices WHERE order_id = ?`)
          .get(orderId);

        if (!existingInvoice && order) {
          const lastInvoice = db
            .prepare(
              "SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1",
            )
            .get();

          let nextSeq = 1;
          if (lastInvoice && lastInvoice.invoice_number) {
            const lastNum = parseInt(
              lastInvoice.invoice_number.replace("INV-", ""),
              10,
            );
            if (!isNaN(lastNum)) nextSeq = lastNum + 1;
          }

          const invoiceNumber = `INV-${String(nextSeq).padStart(4, "0")}`;

          db.prepare(
            `
          INSERT INTO invoices (
            invoice_number,
            order_id,
            table_id,
            table_name,
            customer_id,
            customer_name,
            payment_method,
            subtotal,
            discount,
            kpra_tax,
            kpra_percentage,
            service_charges,
            total_amount,
            status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid')
        `,
          ).run(
            invoiceNumber,
            order.id,
            order.table_id || null,
            order.table_name || "Takeaway",
            order.customer_id || null,
            order.customer_name || "Walk-in",
            order.payment_method || "cash",
            order.subtotal || order.total_amount || 0,
            order.discount_amount || 0,
            order.kpra_tax || order.tax || 0,
            order.kpra_percentage || 0,
            order.service_charges || 0,
            order.total_amount || 0,
          );
        }

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
      const order = db
        .prepare(`SELECT table_id FROM orders WHERE id = ?`)
        .get(orderId);

      db.prepare(`DELETE FROM order_items WHERE order_id = ?`).run(orderId);
      db.prepare(`DELETE FROM orders WHERE id = ?`).run(orderId);

      if (order?.table_id) {
        db.prepare(
          `UPDATE restaurant_tables SET status = 'available' WHERE id = ?`,
        ).run(order.table_id);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("db-get-active-order-by-table", (event, tableId) => {
    try {
      let order = db
        .prepare(
          `SELECT * FROM orders WHERE table_id = ? AND status = 'pending' LIMIT 1`,
        )
        .get(tableId);

      if (!order) {
        const table = db
          .prepare(`SELECT name FROM restaurant_tables WHERE id = ?`)
          .get(tableId);
        const tableName = table?.name || `Table ${tableId}`;

        const info = db
          .prepare(
            `INSERT INTO orders (table_id, table_name, status, payment_status)
             VALUES (?, ?, 'pending', 'unpaid')`,
          )
          .run(tableId, tableName);

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
      return db
        .prepare(`SELECT * FROM order_items WHERE order_id = ?`)
        .all(orderId);
    } catch (err) {
      console.error(err);
      return [];
    }
  });

  ipcMain.handle("db-update-order-item-qty", (e, payload) => {
    try {
      const { orderId, id: itemId, qty, total } = payload || {};

      db.prepare(
        `
      UPDATE order_items
      SET qty = ?, total = ?
      WHERE order_id = ? AND (item_id = ? OR id = ?)
    `,
      ).run(qty, total, orderId, itemId, itemId);

      const result = db
        .prepare(
          `SELECT COALESCE(SUM(total), 0) as grandTotal FROM order_items WHERE order_id = ?`,
        )
        .get(orderId);

      db.prepare(
        `UPDATE orders SET total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ).run(result.grandTotal, orderId);

      return { success: true, total: result.grandTotal };
    } catch (err) {
      console.error("Error updating order item qty:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("db-delete-order-item", (event, payload) => {
    try {
      let orderId;
      let targetId;

      if (typeof payload === "object" && payload !== null) {
        orderId = payload.orderId;
        targetId = payload.itemId || payload.id;
      } else {
        targetId = payload;
      }

      if (!orderId) {
        const item = db
          .prepare(
            `SELECT order_id FROM order_items WHERE id = ? OR item_id = ?`,
          )
          .get(targetId, targetId);

        if (!item) return { success: false, error: "Item not found" };
        orderId = item.order_id;
      }

      db.prepare(
        `
      DELETE FROM order_items
      WHERE (id = ? OR item_id = ?)
      ${orderId ? "AND order_id = ?" : ""}
    `,
      ).run(
        ...(orderId ? [targetId, targetId, orderId] : [targetId, targetId]),
      );

      const result = db
        .prepare(
          `SELECT COALESCE(SUM(total), 0) AS grandTotal FROM order_items WHERE order_id = ?`,
        )
        .get(orderId);

      db.prepare(
        `UPDATE orders SET total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ).run(result.grandTotal, orderId);

      return { success: true, total: result.grandTotal };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("db-create-or-get-order", (event, { tableId, tableName }) => {
    try {
      let order = db
        .prepare(
          `SELECT * FROM orders 
         WHERE table_id = ? AND status = 'pending' 
         ORDER BY id DESC LIMIT 1`,
        )
        .get(tableId);

      if (!order) {
        const info = db
          .prepare(
            `INSERT INTO orders (table_id, table_name, status, payment_status)
           VALUES (?, ?, 'pending', 'unpaid')`,
          )
          .run(tableId, tableName);

        order = db
          .prepare(`SELECT * FROM orders WHERE id = ?`)
          .get(info.lastInsertRowid);
      }

      db.prepare(
        `UPDATE restaurant_tables SET status = 'occupied' WHERE id = ?`,
      ).run(tableId);

      return { success: true, order };
    } catch (err) {
      console.error("Error in getOrCreate order:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("db-add-order-item", (e, payload) => {
    const { orderId, item } = payload || {};

    const existing = db
      .prepare(`SELECT * FROM order_items WHERE order_id = ? AND item_id = ?`)
      .get(orderId, item.id);

    if (existing) {
      const newQty = existing.qty + 1;
      const newTotal = newQty * existing.price;

      db.prepare(`UPDATE order_items SET qty = ?, total = ? WHERE id = ?`).run(
        newQty,
        newTotal,
        existing.id,
      );
    } else {
      db.prepare(
        `
      INSERT INTO order_items (order_id, item_id, item_name, qty, price, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      ).run(orderId, item.id, item.name, 1, item.price, item.price);
    }

    const result = db
      .prepare(
        `SELECT COALESCE(SUM(total),0) as grandTotal FROM order_items WHERE order_id = ?`,
      )
      .get(orderId);

    db.prepare(
      `UPDATE orders SET total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    ).run(result.grandTotal, orderId);

    return { success: true, total: result.grandTotal };
  });

  ipcMain.handle("db-close-order", (e, orderId) => {
    db.prepare("UPDATE orders SET status='paid' WHERE id=?").run(orderId);
    return { success: true };
  });

  ipcMain.handle("db-clear-cart", (event, orderId) => {
    try {
      db.prepare(`DELETE FROM order_items WHERE order_id = ?`).run(orderId);
      db.prepare(`UPDATE orders SET total_amount = 0 WHERE id = ?`).run(
        orderId,
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("db-get-order", (e, id) => {
    return db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);
  });
}

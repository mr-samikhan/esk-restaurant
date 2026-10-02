import { ipcMain } from "electron";
import { db } from "../db/index.js";

export function reportHandlers() {
  /**
   * Main Report Handler
   * Calculates gross revenue, net revenue, KPRA tax, payment methods,
   * order types, and daily breakdown given range & custom dates.
   */
  ipcMain.handle("db-get-detailed-reports", (event, payload = {}) => {
    try {
      const { startDate, endDate } = payload;
      console.log("📊 IPC Report Requested with Dates:", {
        startDate,
        endDate,
      });

      // Debug 1: Inspect raw sample row from orders table
      const sampleRow = db
        .prepare(
          `SELECT id, status, payment_status, created_at FROM orders LIMIT 3`,
        )
        .all();
      console.log("🔍 Sample Orders in DB:", sampleRow);

      // Flexible SQLite condition handling ISO strings, timestamps, and case-insensitive statuses
      const dateCondition = `
      (
        LOWER(COALESCE(status, '')) IN ('completed', 'paid', 'closed', 'served') 
        OR LOWER(COALESCE(payment_status, '')) = 'paid'
        OR status IS NULL
      )
      AND (
        DATE(created_at) >= DATE(?) OR DATE(created_at, 'unixepoch') >= DATE(?)
      )
      AND (
        DATE(created_at) <= DATE(?) OR DATE(created_at, 'unixepoch') <= DATE(?)
      )
    `;

      const summary = db
        .prepare(
          `
      SELECT 
        COALESCE(SUM(total_amount), 0) AS gross_sales,
        COALESCE(SUM(COALESCE(kpra_tax, tax, 0)), 0) AS total_kpra_tax,
        COALESCE(SUM(discount_amount), 0) AS total_discounts,
        COALESCE(SUM(subtotal), 0) AS total_subtotal,
        COUNT(id) AS total_orders,
        COALESCE(AVG(total_amount), 0) AS avg_order_value
      FROM orders
      WHERE ${dateCondition}
    `,
        )
        .get(startDate, startDate, endDate, endDate);

      console.log("📈 Calculated Summary Result:", summary);

      const netSales = summary.gross_sales - summary.total_kpra_tax;

      const dailySales = db
        .prepare(
          `
      SELECT 
        COALESCE(DATE(created_at), DATE(created_at, 'unixepoch')) AS date,
        COALESCE(SUM(total_amount), 0) AS revenue,
        COALESCE(SUM(COALESCE(kpra_tax, tax, 0)), 0) AS kpra_tax,
        COALESCE(SUM(subtotal), 0) AS subtotal,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN total_amount ELSE 0 END), 0) AS cash,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) IN ('card', 'online', 'digital', 'pos') THEN total_amount ELSE 0 END), 0) AS card,
        COUNT(id) AS order_count,
        COALESCE(SUM(CASE WHEN order_type = 'dine_in' OR order_type IS NULL THEN 1 ELSE 0 END), 0) AS dine_in,
        COALESCE(SUM(CASE WHEN order_type = 'takeaway' THEN 1 ELSE 0 END), 0) AS takeaway,
        COALESCE(SUM(CASE WHEN order_type = 'delivery' THEN 1 ELSE 0 END), 0) AS delivery
      FROM orders
      WHERE ${dateCondition}
      GROUP BY COALESCE(DATE(created_at), DATE(created_at, 'unixepoch'))
      ORDER BY date ASC
    `,
        )
        .all(startDate, startDate, endDate, endDate);

      return {
        success: true,
        summary: { ...summary, net_sales: netSales },
        sales: dailySales,
        paymentBreakdown: [],
        topSellingItems: [],
      };
    } catch (err) {
      console.error("❌ Error generating detailed report:", err);
      return { success: false, error: err.message };
    }
  });

  /**
   * Helper Handler: Fast Daily Overview Dashboard Summary
   */
  ipcMain.handle("db-get-today-summary", () => {
    try {
      const today = new Date().toISOString().slice(0, 10);

      const result = db
        .prepare(
          `
        SELECT 
          COALESCE(SUM(total_amount), 0) AS total_sales,
          COALESCE(SUM(COALESCE(kpra_tax, tax, 0)), 0) AS total_kpra_tax,
          COUNT(id) AS total_orders
        FROM orders
        WHERE (status = 'completed' OR status = 'paid' OR payment_status = 'paid')
          AND DATE(created_at) = DATE(?)
      `,
        )
        .get(today);

      return {
        success: true,
        todaySales: result.total_sales,
        todayKpraTax: result.total_kpra_tax,
        todayOrders: result.total_orders,
      };
    } catch (err) {
      console.error("Error fetching today summary:", err);
      return { success: false, error: err.message };
    }
  });
}

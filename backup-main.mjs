import { app, BrowserWindow, ipcMain } from "electron"; // 1. Added ipcMain
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { dialog } from "electron";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ipcMain.handle("db-reset-all", async () => {
  try {
    // 1. Disable foreign keys BEFORE starting the transaction
    db.pragma("foreign_keys = OFF");

    const tables = db
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `,
      )
      .all();

    // 2. Perform the reset
    const resetTransaction = db.transaction(() => {
      for (const table of tables) {
        db.prepare(`DROP TABLE IF EXISTS ${table.name}`).run();
      }
    });

    resetTransaction();

    // 3. Re-enable foreign keys after the work is done
    db.pragma("foreign_keys = ON");

    // 4. Relaunch the app to trigger initDb()
    app.relaunch();
    app.exit(0);

    return { success: true };
  } catch (err) {
    // Ensure FKs are back on even if it fails
    db.pragma("foreign_keys = ON");
    console.error("Reset Error:", err.message);
    return { error: err.message };
  }
});

// 1. Export Backup (Save a copy of local.db)
ipcMain.handle("db-backup-local", async () => {
  const result = await dialog.showSaveDialog({
    title: "Select Backup Location",
    defaultPath: path.join(
      app.getPath("documents"),
      `SwiftPOS_Backup_${new Date().toISOString().split("T")[0]}.db`,
    ),
    filters: [{ name: "SQLite Database", extensions: ["db"] }],
  });

  if (!result.canceled && result.filePath) {
    try {
      // USE THIS INSTEAD OF fs.copyFileSync
      // It performs a safe, consistent backup even while the DB is active
      await db.backup(result.filePath);

      return { success: true, path: result.filePath };
    } catch (err) {
      console.error("Backup Failed:", err);
      return { success: false, error: err.message };
    }
  }
  return { success: false };
});

// 2. Import Backup (Overwrite local.db with a selected file)
ipcMain.handle("db-restore-local", async () => {
  const result = await dialog.showOpenDialog({
    title: "Select Backup File to Restore",
    filters: [{ name: "SQLite Database", extensions: ["db"] }],
    properties: ["openFile"],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const backupPath = result.filePaths[0];
    try {
      db.close(); // Important: Close the active connection first
      fs.copyFileSync(backupPath, dbPath);

      // Relaunch the app to load the new database
      app.relaunch();
      app.exit();
      return { success: true };
    } catch (err) {
      console.error("Restore Failed:", err);
      return { success: false, error: err.message };
    }
  }
  return { success: false };
});

ipcMain.handle("db-get-file-buffer", async () => {
  try {
    // Read the current database file
    const buffer = fs.readFileSync(dbPath);
    return buffer;
  } catch (error) {
    console.error("Failed to read DB for cloud upload", error);
    throw error;
  }
});

ipcMain.handle("db-update-sync-time", (event) => {
  const now = new Date().toISOString();
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(
    "last_sync_time",
    now,
  );
  return now;
});

// Store the DB in the user's "AppData/Application Support" folder so it's not deleted on update
const dbPath = app.isPackaged
  ? path.join(app.getPath("userData"), "database.db")
  : path.join(__dirname, "local.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const initDb = () => {
  // 1. Run Pure SQL only in db.exec
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL CHECK(length(name) > 0), 
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
    
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  sku TEXT,
  category TEXT,
  price REAL,
  cost_price REAL,
  stock_quantity INTEGER,
  low_stock_threshold INTEGER DEFAULT 5,
  barcode TEXT UNIQUE, 
  description TEXT,
  expiry_date DATE,            -- Store as YYYY-MM-DD
  is_expiry_active INTEGER DEFAULT 0, -- 0 for No, 1 for Yes
  shelf_number TEXT,           -- Location in store (e.g., "A-12")
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);


    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT, 
      email TEXT, 
      phone TEXT UNIQUE,
      address TEXT,
      total_orders INTEGER DEFAULT 0,
      total_purchases REAL DEFAULT 0,
      loyalty_points INTEGER DEFAULT 0,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );

 CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT,
      customer_id INTEGER,
      customer_name TEXT,
      items TEXT,
      total REAL,
      paid_amount REAL DEFAULT 0,   -- Included directly here
      due_amount REAL DEFAULT 0,    -- Included directly here
      payment_method TEXT,
      status TEXT,
      notes TEXT,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );


  -- Ledger for Customer Credits/Debits
  CREATE TABLE IF NOT EXISTS customer_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    sale_id INTEGER,
    type TEXT CHECK(type IN ('debit', 'credit')), -- debit (invoice), credit (payment)
    amount REAL NOT NULL,
    description TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      product_name TEXT,
      type TEXT,
      quantity INTEGER,
      previous_stock INTEGER,
      new_stock INTEGER,
      reference TEXT,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );

   CREATE TABLE IF NOT EXISTS traders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    phone TEXT,
    secondary_phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    current_balance REAL DEFAULT 0, -- Total Owed/Paid
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Ledger table for Debits and Credits
  CREATE TABLE IF NOT EXISTS trader_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trader_id INTEGER,
    type TEXT CHECK(type IN ('debit', 'credit')), -- 'debit' (purchase), 'credit' (payment)
    amount REAL NOT NULL,
    description TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(trader_id) REFERENCES traders(id) ON DELETE CASCADE
  );

  `);

  // 2. Data Cleanup (JavaScript logic outside the string)
  // 2. Migration Check: If the table existed BEFORE we added paid_amount/due_amount
  // this code ensures older databases get the new columns without crashing.
  try {
    const columns = db.prepare("PRAGMA table_info(sales)").all();
    const columnNames = columns.map((col) => col.name);

    if (!columnNames.includes("paid_amount")) {
      db.exec("ALTER TABLE sales ADD COLUMN paid_amount REAL DEFAULT 0;");
    }
    if (!columnNames.includes("due_amount")) {
      db.exec("ALTER TABLE sales ADD COLUMN due_amount REAL DEFAULT 0;");
    }

    // Add missing columns one by one
    if (!columnNames.includes("discount")) {
      db.exec("ALTER TABLE sales ADD COLUMN discount REAL DEFAULT 0;");
      console.log("Migration: Added 'discount' column to sales table.");
    }

    if (!columnNames.includes("tax")) {
      db.exec("ALTER TABLE sales ADD COLUMN tax REAL DEFAULT 0;");
      console.log("Migration: Added 'tax' column to sales table.");
    }

    if (!columnNames.includes("notes")) {
      db.exec("ALTER TABLE sales ADD COLUMN notes TEXT;");
      console.log("Migration: Added 'notes' column to sales table.");
    }
  } catch (err) {
    console.error("Migration error:", err.message);
  }

  // Migration for Customer Debt Balance
  try {
    const custColumns = db.prepare("PRAGMA table_info(customers)").all();
    const custColumnNames = custColumns.map((col) => col.name);

    if (!custColumnNames.includes("debt_balance")) {
      db.exec("ALTER TABLE customers ADD COLUMN debt_balance REAL DEFAULT 0;");
      console.log("Migration: Added debt_balance to customers");
    }
  } catch (err) {
    console.error("Customer Migration error:", err.message);
  }

  // Inside your initDb function in main.mjs
  try {
    const columns = db.prepare("PRAGMA table_info(products)").all();
    const columnNames = columns.map((c) => c.name);

    if (!columnNames.includes("expiry_date")) {
      db.exec("ALTER TABLE products ADD COLUMN expiry_date DATE;");
    }
    if (!columnNames.includes("is_expiry_active")) {
      db.exec(
        "ALTER TABLE products ADD COLUMN is_expiry_active INTEGER DEFAULT 0;",
      );
    }
    if (!columnNames.includes("shelf_number")) {
      db.exec("ALTER TABLE products ADD COLUMN shelf_number TEXT;");
    }
    console.log("Product Migration: New columns added successfully.");
  } catch (err) {
    console.error("Product Migration Error:", err.message);
  }

  try {
    db.prepare(
      `
      DELETE FROM products 
      WHERE id NOT IN (
          SELECT MAX(id) FROM products GROUP BY barcode
      )
    `,
    ).run();

    db.prepare("DELETE FROM categories WHERE name IS NULL OR name = ''").run();
    console.log("Database cleanup successful.");
  } catch (err) {
    console.error("Cleanup error:", err.message);
  }

  // 3. Seed Categories (JavaScript logic outside the string)
  const categoryCheck = db
    .prepare("SELECT COUNT(*) as count FROM categories")
    .get();
  if (categoryCheck.count === 0) {
    const insertDefault = db.prepare(
      "INSERT INTO categories (name) VALUES (?)",
    );
    ["General", "Mobile Phones", "Accessories"].forEach((cat) =>
      insertDefault.run(cat),
    );
    console.log("Default categories seeded.");
  }

  console.log("Database Tables Initialized.");
};

initDb();

// --- TRADER IPC HANDLERS ---
// Get all traders
ipcMain.handle("db-get-traders", () =>
  db.prepare("SELECT * FROM traders ORDER BY name ASC").all(),
);

// --- CREATE HANDLER ---
ipcMain.handle("db-create-trader", (event, data) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO traders (name, phone, secondary_phone, whatsapp, email, address) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.name,
      data.phone,
      data.secondary_phone,
      data.whatsapp,
      data.email,
      data.address,
    );
  } catch (err) {
    if (
      err.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      err.message.includes("UNIQUE constraint failed")
    ) {
      return {
        error: "ALREADY_EXISTS",
        message: `The name "${data.name}" is already assigned to another trader.`,
      };
    }
    return { error: "DATABASE_ERROR", message: err.message };
  }
});

// --- UPDATE HANDLER ---
ipcMain.handle("db-update-trader", (event, { id, data }) => {
  try {
    const stmt = db.prepare(`
      UPDATE traders 
      SET name = ?, phone = ?, secondary_phone = ?, whatsapp = ?, email = ?, address = ? 
      WHERE id = ?
    `);
    return stmt.run(
      data.name,
      data.phone,
      data.secondary_phone,
      data.whatsapp,
      data.email,
      data.address,
      id,
    );
  } catch (err) {
    return { error: "DATABASE_ERROR", message: err.message };
  }
});

// Update this handler in main.mjs
ipcMain.handle("db-delete-trader", (event, id) => {
  const deleteProcess = db.transaction(() => {
    // 1. Delete all related transactions first
    db.prepare("DELETE FROM trader_transactions WHERE trader_id = ?").run(id);

    // 2. Now delete the trader
    return db.prepare("DELETE FROM traders WHERE id = ?").run(id);
  });

  try {
    return deleteProcess();
  } catch (err) {
    console.error("Delete failed:", err.message);
    return { error: "DELETE_FAILED", message: err.message };
  }
});

ipcMain.handle(
  "db-add-trader-transaction",
  (event, { traderId, type, amount, description }) => {
    const transaction = db.transaction(() => {
      // 1. Insert into ledger
      db.prepare(
        `
      INSERT INTO trader_transactions (trader_id, type, amount, description) 
      VALUES (?, ?, ?, ?)
    `,
      ).run(traderId, type, amount, description);

      // 2. Update the trader's running balance
      // Debit increases balance (payable), Credit decreases it
      const adjustment = type === "debit" ? amount : -amount;
      db.prepare(
        "UPDATE traders SET current_balance = current_balance + ? WHERE id = ?",
      ).run(adjustment, traderId);
    });

    try {
      transaction();
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  },
);

ipcMain.handle("db-get-trader-history", (event, traderId) => {
  return db
    .prepare(
      `
    SELECT * FROM trader_transactions 
    WHERE trader_id = ? 
    ORDER BY date DESC
  `,
    )
    .all(traderId);
});

ipcMain.handle(
  "db-delete-trader-transaction",
  (event, { transactionId, traderId, type, amount }) => {
    const transaction = db.transaction(() => {
      // 1. Calculate the reversal adjustment
      // If it was a debit (+ owed), subtracting it reduces the balance (-)
      // If it was a credit (- owed), adding it back increases the balance (+)
      const adjustment = type === "debit" ? -amount : amount;

      // 2. Update the trader's current balance
      db.prepare(
        "UPDATE traders SET current_balance = current_balance + ? WHERE id = ?",
      ).run(adjustment, traderId);

      // 3. Delete the transaction record
      db.prepare("DELETE FROM trader_transactions WHERE id = ?").run(
        transactionId,
      );
    });

    try {
      transaction();
      return { success: true };
    } catch (err) {
      console.error("Delete Transaction Failed:", err.message);
      return { error: err.message };
    }
  },
);

ipcMain.handle(
  "db-update-trader-transaction",
  (event, { id, description, date }) => {
    try {
      const stmt = db.prepare(`
      UPDATE trader_transactions 
      SET description = ?, date = ? 
      WHERE id = ?
    `);

      const result = stmt.run(description, date, id);
      return { success: result.changes > 0 };
    } catch (err) {
      console.error("Update Transaction Metadata Failed:", err.message);
      return { error: err.message };
    }
  },
);

ipcMain.handle("db-get-products", () => {
  return db.prepare("SELECT * FROM products ORDER BY created_date DESC").all();
});

ipcMain.handle("db-get-product-by-barcode", (event, barcode) => {
  return db.prepare("SELECT * FROM products WHERE barcode = ?").get(barcode);
});

// --- AUTO-INCREMENT STOCK BY BARCODE ---
ipcMain.handle("db-auto-increment-stock", (event, barcode) => {
  try {
    const product = db
      .prepare("SELECT * FROM products WHERE barcode = ?")
      .get(barcode);

    if (product) {
      const newStock = product.stock_quantity + 1;
      db.prepare("UPDATE products SET stock_quantity = ? WHERE id = ?").run(
        newStock,
        product.id,
      );

      return {
        success: true,
        product: { ...product, stock_quantity: newStock },
      };
    }
    return { success: false, message: "Product not found" };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// --- SEARCH PRODUCT BY NAME OR BARCODE ---
ipcMain.handle("db-search-product", (event, query) => {
  // Matches exact barcode OR partial name
  return db
    .prepare(
      `
    SELECT * FROM products 
    WHERE barcode = ? OR name LIKE ? 
    LIMIT 1
  `,
    )
    .get(query, `%${query}%`);
});

// main.mjs
ipcMain.handle("db-create-product", (event, p) => {
  try {
    // 1. Optional: Manual check to see if barcode already exists
    const existing = db
      .prepare("SELECT id FROM products WHERE barcode = ?")
      .get(p.barcode);
    if (existing) {
      return {
        error: "ALREADY_EXISTS",
        message: "A product with this barcode already exists.",
      };
    }

    const stmt = db.prepare(`
      INSERT INTO products (
        name, sku, category, price, cost_price, 
        stock_quantity, low_stock_threshold, barcode, description,
        expiry_date, is_expiry_active, shelf_number
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      p.name,
      p.sku,
      p.category,
      p.price,
      p.cost_price,
      p.stock_quantity,
      p.low_stock_threshold,
      p.barcode?.trim(),
      p.description,
      p.expiry_date || null, // New
      p.is_expiry_active || 0, // New
      p.shelf_number || "", // New
    );

    return result;
  } catch (err) {
    // 2. Handle the Database UNIQUE constraint if you added it to the table schema
    if (err.message.includes("UNIQUE constraint failed")) {
      return { error: "ALREADY_EXISTS", message: "Barcode must be unique." };
    }
    console.error("SQL Error:", err.message);
    return { error: "DATABASE_ERROR", message: err.message };
  }
});

ipcMain.handle("db-update-product", (event, { id, data: p }) => {
  try {
    const stmt = db.prepare(`
      UPDATE products SET 
      name=?, sku=?, category=?, price=?, cost_price=?, 
      stock_quantity=?, low_stock_threshold=?, barcode=?, description=?,
      expiry_date=?, is_expiry_active=?, shelf_number=?
      WHERE id=?
    `);

    return stmt.run(
      p.name,
      p.sku,
      p.category,
      p.price,
      p.cost_price,
      p.stock_quantity,
      p.low_stock_threshold,
      p.barcode?.trim(),
      p.description,
      p.expiry_date || null, // New
      p.is_expiry_active || 0, // New
      p.shelf_number || "", // New
      id,
    );
  } catch (err) {
    // Check if the error is due to the unique barcode constraint
    if (err.message.includes("UNIQUE constraint failed: products.barcode")) {
      return {
        error: "ALREADY_EXISTS",
        message: "This barcode is already assigned to another product.",
      };
    }
    console.error("SQL Update Error:", err.message);
    return { error: "DATABASE_ERROR", message: err.message };
  }
});

ipcMain.handle("db-delete-product", (event, id) => {
  return db.prepare("DELETE FROM products WHERE id = ?").run(id);
});

// customers
ipcMain.handle("db-get-customers", () => {
  return db.prepare("SELECT * FROM customers ORDER BY created_date DESC").all();
});

ipcMain.handle("db-create-customer", (event, c) => {
  const stmt = db.prepare(`
    INSERT INTO customers (name, email, phone, address, total_orders, total_purchases, loyalty_points)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    c.name,
    c.email,
    c.phone,
    c.address,
    c.total_orders || 0,
    c.total_purchases || 0,
    c.loyalty_points || 0,
  );
});

ipcMain.handle("db-update-customer", (event, { id, data: c }) => {
  const stmt = db.prepare(`
    UPDATE customers SET name=?, email=?, phone=?, address=?, total_orders=?, total_purchases=?, loyalty_points=?
    WHERE id=?
  `);
  return stmt.run(
    c.name,
    c.email,
    c.phone,
    c.address,
    c.total_orders,
    c.total_purchases,
    c.loyalty_points,
    id,
  );
});

ipcMain.handle("db-delete-customer", (event, id) => {
  const transaction = db.transaction(() => {
    // 1. Delete all ledger/transaction records for this customer
    db.prepare("DELETE FROM customer_transactions WHERE customer_id = ?").run(
      id,
    );

    // 2. Delete all sales associated with this customer
    // Note: If you want to keep sales but remove the customer link,
    // you would UPDATE sales SET customer_id = NULL WHERE customer_id = ?
    db.prepare("DELETE FROM sales WHERE customer_id = ?").run(id);

    // 3. Delete from any other related tables (e.g., loyalty_points)
    // db.prepare("DELETE FROM loyalty_points WHERE customer_id = ?").run(id);

    // 4. Finally, delete the customer
    db.prepare("DELETE FROM customers WHERE id = ?").run(id);
  });

  try {
    transaction();
    return { success: true };
  } catch (err) {
    console.error("Delete customer error:", err);
    return { error: err.message };
  }
});

ipcMain.handle("db-get-customer-ledger", (event, customerId) => {
  return db
    .prepare(
      `
    SELECT * FROM customer_transactions 
    WHERE customer_id = ? 
    ORDER BY date DESC
  `,
    )
    .all(customerId);
});

ipcMain.handle("db-get-customer-sales", (event, customerId) => {
  return db
    .prepare(
      `
    SELECT * FROM sales 
    WHERE customer_id = ? 
    ORDER BY created_date DESC
  `,
    )
    .all(customerId);
});

ipcMain.handle(
  "db-pay-customer-debt",
  (event, { customerId, amount, description }) => {
    const transaction = db.transaction(() => {
      // 1. Record the general payment in the ledger
      // FIX: Explicitly set sale_id to NULL so it's not wiped by Sale Updates
      db.prepare(
        `
      INSERT INTO customer_transactions (customer_id, sale_id, type, amount, description)
      VALUES (?, NULL, 'credit', ?, ?)
    `,
      ).run(customerId, amount, description || "Debt Payment");

      // 2. Reduce the main customer debt_balance
      db.prepare(
        "UPDATE customers SET debt_balance = debt_balance - ? WHERE id = ?",
      ).run(amount, customerId);

      // 3. FIFO: Find unpaid invoices and apply the payment to them
      const unpaidInvoices = db
        .prepare(
          `
      SELECT id, paid_amount, due_amount, total FROM sales 
      WHERE customer_id = ? AND due_amount > 0 
      ORDER BY created_date ASC
    `,
        )
        .all(customerId);

      let remainingPayment = amount;

      for (const inv of unpaidInvoices) {
        if (remainingPayment <= 0) break;

        const amountToApply = Math.min(remainingPayment, inv.due_amount);
        const newPaid = inv.paid_amount + amountToApply;
        const newDue = inv.due_amount - amountToApply;
        const newStatus = newDue <= 0 ? "completed" : "partial";

        db.prepare(
          `UPDATE sales SET paid_amount = ?, due_amount = ?, status = ? WHERE id = ?`,
        ).run(newPaid, newDue, newStatus, inv.id);

        remainingPayment -= amountToApply;
      }
    });

    try {
      transaction();
      return { success: true };
    } catch (err) {
      console.error("Debt Payment Error:", err.message);
      return { error: err.message };
    }
  },
);

ipcMain.handle("db-delete-ledger-entry", (event, id) => {
  const transaction = db.transaction(() => {
    const entry = db
      .prepare("SELECT * FROM customer_transactions WHERE id = ?")
      .get(id);
    if (!entry) throw new Error("Entry not found");

    // Logic:
    // Delete Credit (Payment) -> Debt increases (+)
    // Delete Debit (Invoice) -> Debt decreases (-)
    const balanceAdjustment =
      entry.type === "credit" ? entry.amount : -entry.amount;

    // 1. Update Customer
    db.prepare(
      "UPDATE customers SET debt_balance = debt_balance + ? WHERE id = ?",
    ).run(balanceAdjustment, entry.customer_id);

    // 2. If it was a debit, also reduce total_purchases
    if (entry.type === "debit") {
      db.prepare(
        "UPDATE customers SET total_purchases = total_purchases - ? WHERE id = ?",
      ).run(entry.amount, entry.customer_id);
    }

    // 3. Delete the row
    db.prepare("DELETE FROM customer_transactions WHERE id = ?").run(id);
  });

  try {
    transaction();
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("db-reconcile-customer", (event, customerId) => {
  const transaction = db.transaction(() => {
    // 1. Calculate Total Purchases (Sum of all 'debit' entries)
    const purchases = db
      .prepare(
        `
      SELECT SUM(amount) as total FROM customer_transactions 
      WHERE customer_id = ? AND type = 'debit'
    `,
      )
      .get(customerId);

    // 2. Calculate Current Debt (Debits minus Credits)
    const ledger = db
      .prepare(
        `
      SELECT 
        SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_debit,
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_credit
      FROM customer_transactions WHERE customer_id = ?
    `,
      )
      .get(customerId);

    const newPurchases = purchases.total || 0;
    const newDebt = (ledger.total_debit || 0) - (ledger.total_credit || 0);

    // 3. Update the master customer record
    db.prepare(
      `
      UPDATE customers 
      SET total_purchases = ?, debt_balance = ? 
      WHERE id = ?
    `,
    ).run(newPurchases, newDebt, customerId);

    return { newPurchases, newDebt };
  });

  try {
    return transaction();
  } catch (err) {
    return { error: err.message };
  }
});

//expenses
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category TEXT,
    amount REAL,
    date TEXT,
    payment_method TEXT,
    is_recurring INTEGER DEFAULT 0,
    notes TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

//categories
// Get all categories
ipcMain.handle("db-get-categories", () => {
  return db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
});

// Create a new category
ipcMain.handle("db-create-category", (event, name) => {
  try {
    const stmt = db.prepare("INSERT INTO categories (name) VALUES (?)");
    return stmt.run(name);
  } catch (err) {
    return { error: err.message };
  }
});

// Delete a category
ipcMain.handle("db-delete-category", (event, id) => {
  return db.prepare("DELETE FROM categories WHERE id = ?").run(id);
});

//update category
ipcMain.handle("db-update-category", (event, { id, name }) => {
  try {
    // 1. Find the current (old) name before we change it
    const oldRow = db
      .prepare("SELECT name FROM categories WHERE id = ?")
      .get(id);

    if (oldRow) {
      const oldName = oldRow.name;

      // 2. Start a transaction (Update both tables or neither)
      const updateTransaction = db.transaction(() => {
        // Update the category table
        db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, id);

        // Update all products that were using the old name
        db.prepare("UPDATE products SET category = ? WHERE category = ?").run(
          name,
          oldName,
        );
      });

      updateTransaction();
    }
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

// IPC Handlers for Expenses
ipcMain.handle("db-get-expenses", () => {
  return db
    .prepare("SELECT * FROM expenses ORDER BY date DESC, created_date DESC")
    .all();
});

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

//stock

// IPC Handlers
ipcMain.handle("db-get-stock-movements", () => {
  return db
    .prepare("SELECT * FROM stock_movements ORDER BY created_date DESC")
    .all();
});

// Using a Transaction to update both tables safely
ipcMain.handle(
  "db-save-stock-movement",
  (event, { movement, productUpdate }) => {
    const transaction = db.transaction(() => {
      // 1. Record the movement
      const moveStmt = db.prepare(`
      INSERT INTO stock_movements (product_id, product_name, type, quantity, previous_stock, new_stock, reference)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
      moveStmt.run(
        movement.product_id,
        movement.product_name,
        movement.type,
        movement.quantity,
        movement.previous_stock,
        movement.new_stock,
        movement.reference,
      );

      // 2. Update the product stock level
      const prodStmt = db.prepare(
        "UPDATE products SET stock_quantity = ? WHERE id = ?",
      );
      prodStmt.run(productUpdate.stock_quantity, productUpdate.productId);
    });

    return transaction();
  },
);

//sales
ipcMain.handle("db-get-sales", () => {
  const sales = db
    .prepare("SELECT * FROM sales ORDER BY created_date DESC")
    .all();
  // Parse the items string back into an array for React
  return sales.map((s) => ({ ...s, items: JSON.parse(s.items) }));
});

// ipcMain.handle("db-create-sale", (event, saleData) => {
//   const transaction = db.transaction((data) => {
//     // 1. Insert the Sale record (Keep your existing logic)
//     const saleStmt = db.prepare(`
//       INSERT INTO sales (invoice_number, customer_id, customer_name, items, total, paid_amount, due_amount, payment_method, status)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `);
//     const saleResult = saleStmt.run(
//       data.invoice_number,
//       data.customer_id,
//       data.customer_name,
//       JSON.stringify(data.items),
//       data.total,
//       data.paid_amount,
//       data.due_amount,
//       data.payment_method,
//       data.status,
//     );

//     const saleId = saleResult.lastInsertRowid; // Capture ID for ledger linking

//     // 2. Loop through items to Update Stock and Create History (STAYED THE SAME)
//     for (const item of data.items) {
//       const product = db
//         .prepare("SELECT name, stock_quantity FROM products WHERE id = ?")
//         .get(item.product_id);

//       if (product) {
//         const newStock = product.stock_quantity - item.quantity;

//         // A. Update Product Table
//         db.prepare("UPDATE products SET stock_quantity = ? WHERE id = ?").run(
//           newStock,
//           item.product_id,
//         );

//         // B. Create Stock Movement History Row
//         db.prepare(
//           `
//           INSERT INTO stock_movements (product_id, product_name, type, quantity, previous_stock, new_stock, reference)
//           VALUES (?, ?, 'out', ?, ?, ?, ?)
//         `,
//         ).run(
//           item.product_id,
//           product.name,
//           item.quantity,
//           product.stock_quantity,
//           newStock,
//           `Sale: ${data.invoice_number}`,
//         );
//       }
//     }

//     // 3. UPDATED: Customer Balance AND Financial Ledger logic
//     if (data.customer_id && data.customer_id !== "walkin") {
//       // NEW: Log the Invoice (DEBIT) in Financial Ledger
//       db.prepare(
//         `
//         INSERT INTO customer_transactions (customer_id, sale_id, type, amount, description)
//         VALUES (?, ?, 'debit', ?, ?)
//       `,
//       ).run(
//         data.customer_id,
//         saleId,
//         data.total,
//         `Invoice #${data.invoice_number}`,
//       );

//       // NEW: Log the Payment (CREDIT) in Financial Ledger (if paid anything)
//       if (data.paid_amount > 0) {
//         db.prepare(
//           `
//           INSERT INTO customer_transactions (customer_id, sale_id, type, amount, description)
//           VALUES (?, ?, 'credit', ?, ?)
//         `,
//         ).run(
//           data.customer_id,
//           saleId,
//           data.paid_amount,
//           `Initial Payment for #${data.invoice_number}`,
//         );
//       }

//       // Keep your existing balance update logic
//       db.prepare(
//         "UPDATE customers SET debt_balance = debt_balance + ?, total_purchases = total_purchases + ?, total_orders = total_orders + 1 WHERE id = ?",
//       ).run(data.due_amount, data.total, data.customer_id);
//     }
//   });

//   return transaction(saleData);
// });

// --- UPDATE SALE ---

ipcMain.handle("db-create-sale", (event, saleData) => {
  const transaction = db.transaction((data) => {
    // 1. Pre-process items to include their CURRENT cost_price
    const itemsWithCost = data.items.map((item) => {
      const p = db
        .prepare("SELECT cost_price FROM products WHERE id = ?")
        .get(item.product_id);
      return {
        ...item,
        cost_price: p?.cost_price || 0, // Capture cost now
      };
    });

    // 2. Insert the Sale record with the enriched items JSON
    const saleStmt = db.prepare(`
      INSERT INTO sales (
        invoice_number, customer_id, customer_name, items, 
        total, paid_amount, due_amount, discount, tax, 
        payment_method, status, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const saleResult = saleStmt.run(
      data.invoice_number,
      data.customer_id,
      data.customer_name,
      JSON.stringify(itemsWithCost),
      data.total,
      data.paid_amount,
      data.due_amount,
      data.discount || 0, // 👈 New
      data.tax || 0, // 👈 New
      data.payment_method,
      data.status,
      data.notes || "", // 👈 New
    );

    const saleId = saleResult.lastInsertRowid;

    // 3. Loop through items for Stock (No changes needed here)
    for (const item of itemsWithCost) {
      const product = db
        .prepare("SELECT name, stock_quantity FROM products WHERE id = ?")
        .get(item.product_id);
      if (product) {
        const newStock = product.stock_quantity - item.quantity;
        db.prepare("UPDATE products SET stock_quantity = ? WHERE id = ?").run(
          newStock,
          item.product_id,
        );

        db.prepare(
          `
          INSERT INTO stock_movements (product_id, product_name, type, quantity, previous_stock, new_stock, reference)
          VALUES (?, ?, 'out', ?, ?, ?, ?)
        `,
        ).run(
          item.product_id,
          product.name,
          item.quantity,
          product.stock_quantity,
          newStock,
          `Sale: ${data.invoice_number}`,
        );
      }
    }

    // 4. Financial Ledger logic (Same as before)
    if (data.customer_id && data.customer_id !== "walkin") {
      db.prepare(
        "INSERT INTO customer_transactions (customer_id, sale_id, type, amount, description) VALUES (?, ?, 'debit', ?, ?)",
      ).run(
        data.customer_id,
        saleId,
        data.total,
        `Invoice #${data.invoice_number}`,
      );
      if (data.paid_amount > 0) {
        db.prepare(
          "INSERT INTO customer_transactions (customer_id, sale_id, type, amount, description) VALUES (?, ?, 'credit', ?, ?)",
        ).run(
          data.customer_id,
          saleId,
          data.paid_amount,
          `Initial Payment for #${data.invoice_number}`,
        );
      }
      db.prepare(
        "UPDATE customers SET debt_balance = debt_balance + ?, total_purchases = total_purchases + ?, total_orders = total_orders + 1 WHERE id = ?",
      ).run(data.due_amount, data.total, data.customer_id);
    }
  });

  return transaction(saleData);
});

// ipcMain.handle("db-update-sale", (event, { id, data }) => {
//   // 1. Fetch OLD sale data to calculate balance reversals
//   const oldSale = db
//     .prepare(
//       "SELECT items, invoice_number, customer_id, total, due_amount FROM sales WHERE id = ?",
//     )
//     .get(id);

//   if (!oldSale) return { error: "Sale not found" };

//   const oldItems = JSON.parse(oldSale.items);

//   const updateTransaction = db.transaction(() => {
//     // --- PART A: INVENTORY LOGIC (Keep your existing stock code) ---
//     for (const item of oldItems) {
//       db.prepare(
//         "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
//       ).run(item.quantity, item.product_id);
//     }
//     for (const item of data.items) {
//       db.prepare(
//         "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
//       ).run(item.quantity, item.product_id);
//     }

//     // --- PART B: FINANCIAL LEDGER LOGIC ---
//     if (oldSale.customer_id && oldSale.customer_id !== "walkin") {
//       // 1. Revert Customer Balance (Subtract old totals)
//       db.prepare(
//         `
//         UPDATE customers
//         SET total_purchases = total_purchases - ?,
//             debt_balance = debt_balance - ?
//         WHERE id = ?
//       `,
//       ).run(oldSale.total, oldSale.due_amount, oldSale.customer_id);

//       // 2. Delete OLD ledger entries for this specific sale
//       db.prepare("DELETE FROM customer_transactions WHERE sale_id = ?").run(id);
//     }

//     // --- PART C: UPDATE THE SALE RECORD ---
//     db.prepare(
//       `
//       UPDATE sales SET
//         items=?, total=?, paid_amount=?, due_amount=?,
//         discount=?, tax=?, notes=?, -- 👈 Added these
//         status=?, customer_id=?, customer_name=?
//       WHERE id=?
//     `,
//     ).run(
//       JSON.stringify(data.items),
//       data.total,
//       data.paid_amount,
//       data.due_amount,
//       data.discount || 0, // 👈 Added
//       data.tax || 0, // 👈 Added
//       data.notes || "", // 👈 Added
//       data.status,
//       data.customer_id,
//       data.customer_name,
//       id,
//     );

//     // --- PART D: APPLY NEW FINANCIAL DATA ---
//     if (data.customer_id && data.customer_id !== "walkin") {
//       // 1. Add NEW Ledger Entries
//       db.prepare(
//         `
//         INSERT INTO customer_transactions (customer_id, sale_id, type, amount, description)
//         VALUES (?, ?, 'debit', ?, ?)
//       `,
//       ).run(
//         data.customer_id,
//         id,
//         data.total,
//         `Invoice Update: ${oldSale.invoice_number}`,
//       );

//       if (data.paid_amount > 0) {
//         db.prepare(
//           `
//           INSERT INTO customer_transactions (customer_id, sale_id, type, amount, description)
//           VALUES (?, ?, 'credit', ?, ?)
//         `,
//         ).run(
//           data.customer_id,
//           id,
//           data.paid_amount,
//           `Updated Payment for #${oldSale.invoice_number}`,
//         );
//       }

//       // 2. Apply NEW Customer Balance
//       db.prepare(
//         `
//         UPDATE customers
//         SET total_purchases = total_purchases + ?,
//             debt_balance = debt_balance + ?
//         WHERE id = ?
//       `,
//       ).run(data.total, data.due_amount, data.customer_id);
//     }
//   });

//   try {
//     updateTransaction();
//     return { success: true };
//   } catch (err) {
//     console.error("Update Error:", err.message);
//     return { error: err.message };
//   }
// });

// --- DELETE SALE ---
// ipcMain.handle("db-delete-sale", (event, id) => {
//   const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(id);
//   if (!sale) return { error: "NOT_FOUND" };

//   const items = JSON.parse(sale.items);

//   const deleteTransaction = db.transaction(() => {
//     // 1. Return items to stock and Create Logs
//     const updateStock = db.prepare(
//       "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
//     );
//     const logMovement = db.prepare(`
//       INSERT INTO stock_movements (product_id, product_name, type, quantity, reference)
//       VALUES (?, ?, ?, ?, ?)
//     `);

//     items.forEach((item) => {
//       // Add back to inventory
//       updateStock.run(item.quantity, item.product_id);

//       // Log the return
//       logMovement.run(
//         item.product_id,
//         item.product_name,
//         "return",
//         item.quantity,
//         `Sale Deleted: ${sale.invoice_number}`,
//       );
//     });

//     // 2. Adjust Customer Debt (if applicable)
//     if (sale.customer_id && sale.due_amount > 0) {
//       db.prepare(
//         "UPDATE customers SET total_purchases = total_purchases - ? WHERE id = ?",
//       ).run(sale.due_amount, sale.customer_id);
//     }

//     // 3. Finally, delete the sale record
//     db.prepare("DELETE FROM sales WHERE id = ?").run(id);
//   });

//   try {
//     deleteTransaction();
//     return { success: true };
//   } catch (err) {
//     console.error("Delete Sale Failed:", err.message);
//     return { error: err.message };
//   }
// });

// ipcMain.handle("db-delete-sale", (event, id) => {
//   const deleteTransaction = db.transaction(() => {
//     // 1. Delete from Sales
//     db.prepare("DELETE FROM sales WHERE id = ?").run(id);

//     // 2. Delete from Ledger (Crucial!)
//     db.prepare("DELETE FROM customer_transactions WHERE sale_id = ?").run(id);
//   });

//   return deleteTransaction();
// });

ipcMain.handle("db-update-sale", (event, { id, data }) => {
  const transaction = db.transaction(() => {
    // 1. Get Old Sale
    const oldSale = db
      .prepare("SELECT total, due_amount, customer_id FROM sales WHERE id = ?")
      .get(id);
    if (!oldSale) throw new Error("Sale not found");

    // 2. STOCK REVERSAL (Keep your existing stock loop here)

    if (oldSale.customer_id && oldSale.customer_id !== "walkin") {
      // 3. NEUTRALIZE: Subtract exactly what the old sale added
      db.prepare(
        `
        UPDATE customers 
        SET total_purchases = total_purchases - ?, 
            debt_balance = debt_balance - ? 
        WHERE id = ?
      `,
      ).run(oldSale.total, oldSale.due_amount, oldSale.customer_id);

      // 4. CLEAN LEDGER: Remove only the rows tied to this sale
      db.prepare("DELETE FROM customer_transactions WHERE sale_id = ?").run(id);
    }

    // 5. UPDATE SALE RECORD
    db.prepare(
      `
      UPDATE sales SET 
        items=?, total=?, paid_amount=?, due_amount=?, 
        discount=?, status=?, customer_id=?, customer_name=? 
      WHERE id=?
    `,
    ).run(
      JSON.stringify(data.items),
      data.total,
      data.paid_amount,
      data.due_amount,
      data.discount || 0,
      data.status,
      data.customer_id,
      data.customer_name,
      id,
    );

    // 6. APPLY NEW DATA
    if (data.customer_id && data.customer_id !== "walkin") {
      // Add NEW Debit
      db.prepare(
        `INSERT INTO customer_transactions (customer_id, sale_id, type, amount, description, date) 
                  VALUES (?, ?, 'debit', ?, ?, ?)`,
      ).run(
        data.customer_id,
        id,
        data.total,
        "Invoice Update",
        new Date().toISOString(),
      );

      // Add NEW Credit (if paid)
      if (data.paid_amount > 0) {
        db.prepare(
          `INSERT INTO customer_transactions (customer_id, sale_id, type, amount, description, date) 
                    VALUES (?, ?, 'credit', ?, ?, ?)`,
        ).run(
          data.customer_id,
          id,
          data.paid_amount,
          "Invoice Payment",
          new Date().toISOString(),
        );
      }

      // Update Customer Master
      db.prepare(
        `UPDATE customers SET total_purchases = total_purchases + ?, debt_balance = debt_balance + ? WHERE id = ?`,
      ).run(data.total, data.due_amount, data.customer_id);
    }
  });

  try {
    transaction();
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("db-delete-sale", (event, id) => {
  // 1. Fetch the sale data BEFORE deleting so we know what to revert
  const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(id);
  if (!sale) return { error: "NOT_FOUND" };

  const items = JSON.parse(sale.items);

  const deleteTransaction = db.transaction(() => {
    // --- PART A: INVENTORY REVERSAL ---
    const updateStock = db.prepare(
      "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
    );
    const logStock = db.prepare(`
      INSERT INTO stock_movements (product_id, product_name, type, quantity, previous_stock, new_stock, reference) 
      VALUES (?, ?, 'in', ?, ?, ?, ?)
    `);

    items.forEach((item) => {
      // Get current stock before reverting to maintain accurate history logs
      const product = db
        .prepare("SELECT stock_quantity FROM products WHERE id = ?")
        .get(item.product_id);
      if (product) {
        const revertedStock = product.stock_quantity + item.quantity;

        // Return items to shelf
        updateStock.run(item.quantity, item.product_id);

        // Create History Log
        logStock.run(
          item.product_id,
          item.product_name,
          item.quantity,
          product.stock_quantity,
          revertedStock,
          `Sale Deleted: ${sale.invoice_number}`,
        );
      }
    });

    // --- PART B: CUSTOMER & FINANCIAL REVERSAL ---
    if (sale.customer_id && sale.customer_id !== "walkin") {
      // 1. Remove entries from the Financial Ledger (Transactions)
      db.prepare("DELETE FROM customer_transactions WHERE sale_id = ?").run(id);

      // 2. Revert Customer Profile Balances
      // Decrease Total Purchases by full amount, Decrease Debt by the 'due_amount'
      db.prepare(
        `
        UPDATE customers 
        SET total_purchases = total_purchases - ?, 
            total_orders = total_orders - 1,
            debt_balance = debt_balance - ? 
        WHERE id = ?
      `,
      ).run(sale.total, sale.due_amount, sale.customer_id);
    }

    // --- PART C: FINAL DELETION ---
    db.prepare("DELETE FROM sales WHERE id = ?").run(id);
  });

  try {
    deleteTransaction();
    return { success: true };
  } catch (err) {
    console.error("Critical Delete Error:", err.message);
    return { error: err.message };
  }
});

//print
ipcMain.handle("print-receipt", async (event, pdfDataUri) => {
  // PASTE/UPDATE THIS LINE HERE:
  const workerWindow = new BrowserWindow({
    show: true, // This makes the "hidden" window visible for debugging
    width: 400,
    height: 600,
  });

  workerWindow.webContents.on("did-finish-load", () => {
    // This will trigger the actual system print popup
    workerWindow.webContents.print({
      silent: false,
      printBackground: true,
    });
  });

  // Load the PDF data URI we generated in React
  await workerWindow.loadURL(pdfDataUri);
});

//reports
// ipcMain.handle(
//   "db-get-detailed-reports",
//   (event, { range, startDate, endDate }) => {
//     try {
//       // 1. Set the grouping format
//       let groupFormat = "%Y-%m-%d";
//       if (range === "monthly") groupFormat = "%Y-%m";
//       if (range === "yearly") groupFormat = "%Y";

//       // 2. The Query - Use DATE() to ensure string comparison works
//       const salesData = db
//         .prepare(
//           `
//       SELECT
//         STRFTIME('${groupFormat}', created_date) as date,
//         SUM(total) as revenue,
//         CAST(SUM(paid_amount) AS REAL) as cash,
//         CAST(SUM(due_amount) AS REAL) as credit
//       FROM sales
//       WHERE DATE(created_date) >= DATE(?) AND DATE(created_date) <= DATE(?)
//       GROUP BY date
//       ORDER BY date ASC
//     `,
//         )
//         .all(startDate, endDate);

//       // 3. Inventory Calculation (This should work regardless of dates)
//       const inventoryValuation = db
//         .prepare(
//           `
//       SELECT
//         SUM(stock_quantity * cost_price) as total_cost,
//         SUM(stock_quantity * price) as retail_value
//       FROM products
//     `,
//         )
//         .get();

//       console.log("Report Data Found:", salesData.length); // DEBUG IN TERMINAL

//       return {
//         sales: salesData,
//         inventory: inventoryValuation || { total_cost: 0, retail_value: 0 },
//       };
//     } catch (err) {
//       console.error("Report Error:", err.message);
//       return { error: err.message, sales: [], inventory: {} };
//     }
//   },
// );

ipcMain.handle(
  "db-get-detailed-reports",
  (event, { range, startDate, endDate }) => {
    try {
      let groupFormat = "%Y-%m-%d";
      if (range === "monthly") groupFormat = "%Y-%m";
      if (range === "yearly") groupFormat = "%Y";

      // This query calculates profit by looking at each sale's items
      const salesData = db
        .prepare(
          `
      WITH sale_items AS (
        SELECT 
          s.id as sale_id,
          s.created_date,
          s.total,
          s.paid_amount,
          s.due_amount,
          -- We use a helper to extract cost if you store it in the items JSON, 
          -- or join with products. For JSON items, we sum them:
          SUM(json_each.value ->> '$.quantity' * json_each.value ->> '$.cost_price') as total_cost
        FROM sales s, json_each(s.items)
        WHERE DATE(s.created_date) BETWEEN DATE(?) AND DATE(?)
        GROUP BY s.id
      )
      SELECT 
        STRFTIME('${groupFormat}', created_date) as date,
        SUM(total) as revenue,
        SUM(total_cost) as total_cost,
        SUM(total - total_cost) as profit, -- ACTUAL PROFIT
        SUM(paid_amount) as cash,
        SUM(due_amount) as credit
      FROM sale_items
      GROUP BY date
      ORDER BY date ASC
    `,
        )
        .all(startDate, endDate);

      const inventory = db
        .prepare(
          `
      SELECT SUM(stock_quantity * cost_price) as total_cost, 
             SUM(stock_quantity * price) as retail_value 
      FROM products
    `,
        )
        .get();

      return { sales: salesData, inventory };
    } catch (err) {
      console.error("Report Error:", err.message);
      return { error: err.message, sales: [], inventory: {} };
    }
  },
);

//settings
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

// 1. IMPROVED INITIALIZATION
const defaultSettings = [
  ["app_name", "SwiftPOS"],
  ["language", "en"],
  ["currency", "PKR"],
  ["zakat_rate", "2.5"],
  ["nisab_gold", "87.48"],
  ["nisab_silver", "612.36"],
  ["gold_price_per_gram", "18000"],
];

// This loop ensures every key in your array exists in the DB
const insertStmt = db.prepare(
  "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
);
defaultSettings.forEach(([key, val]) => {
  insertStmt.run(key, String(val));
});

// 2. UPDATED HANDLERS
ipcMain.handle("db-get-settings", () => {
  const rows = db.prepare("SELECT * FROM settings").all();
  // Converts rows into a clean object: { app_name: '...', currency: 'PKR', ... }
  return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
});

ipcMain.handle("db-update-settings", (event, settingsObj) => {
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
  );
  const transaction = db.transaction((data) => {
    for (const [key, val] of Object.entries(data)) {
      stmt.run(key, String(val));
    }
  });
  return transaction(settingsObj);
});

//zakat history
db.exec(`
  CREATE TABLE IF NOT EXISTS zakat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_name TEXT,
    amount REAL,
    category TEXT, -- e.g., Relative, Charity, Madrassah
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
  )
`);

// IPC Handlers
ipcMain.handle("db-get-zakat-history", () => {
  return db.prepare("SELECT * FROM zakat_history ORDER BY date DESC").all();
});

ipcMain.handle("db-add-zakat-record", (event, record) => {
  const stmt = db.prepare(`
    INSERT INTO zakat_history (recipient_name, amount, category, notes)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(
    record.recipient_name,
    record.amount,
    record.category,
    record.notes,
  );
});

// --- WINDOW LOGIC ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    win.loadURL("http://localhost:3000");
  } else {
    win.loadFile(path.join(__dirname, "dist/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

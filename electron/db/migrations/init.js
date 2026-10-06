// export function runInitMigration(db) {
//   db.exec(`
//     CREATE TABLE IF NOT EXISTS settings (
//       key TEXT PRIMARY KEY,
//       value TEXT
//     );

//     CREATE TABLE IF NOT EXISTS users (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       username TEXT UNIQUE NOT NULL,
//       password_hash TEXT NOT NULL,
//       role TEXT DEFAULT 'cashier',
//       full_name TEXT,
//       is_active INTEGER DEFAULT 1,
//       created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
//       last_login DATETIME
//     );

//     CREATE TABLE IF NOT EXISTS app_session (
//       id INTEGER PRIMARY KEY CHECK (id = 1),
//       user_data TEXT
//     );

//      CREATE TABLE IF NOT EXISTS categories (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT NOT NULL,
//       image TEXT,
//       is_active INTEGER DEFAULT 1
//     );

//      CREATE TABLE IF NOT EXISTS items (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       category_id INTEGER NOT NULL,
//       name TEXT NOT NULL,
//       price REAL NOT NULL,
//       cost_price REAL DEFAULT 0,
//       image TEXT,
//       barcode TEXT,
//       is_available INTEGER DEFAULT 1,
//       created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
//       FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
//     );

//     CREATE TABLE IF NOT EXISTS orders (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,

//       table_id INTEGER,
//       table_name TEXT,

//       customer_id INTEGER,
//       customer_name TEXT,

//       subtotal REAL DEFAULT 0,
//       discount_type TEXT,   -- percent | fixed
//       discount_value REAL DEFAULT 0,
//       discount_amount REAL DEFAULT 0,

//       tax REAL DEFAULT 0,
//       total_amount REAL DEFAULT 0,

//       paid_amount REAL DEFAULT 0,
//       due_amount REAL DEFAULT 0,

//       payment_status TEXT DEFAULT 'unpaid',
//       -- unpaid | partial | paid

//       status TEXT DEFAULT 'pending',
//       order_type TEXT DEFAULT 'dine_in',

//       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

//       is_active INTEGER DEFAULT 1
//     );

//       CREATE TABLE IF NOT EXISTS order_items (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         order_id INTEGER,
//         item_id INTEGER,
//         item_name TEXT,
//         qty INTEGER,
//         price REAL,
//         total REAL,
//         FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
//       );

//       CREATE TABLE IF NOT EXISTS restaurant_tables (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT UNIQUE,
//         status TEXT DEFAULT 'available',
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//       );

//       CREATE TABLE IF NOT EXISTS tables (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT NOT NULL,
//         status TEXT DEFAULT 'available'
//       );

//       CREATE TABLE IF NOT EXISTS customers (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT,
//       phone TEXT,
//       address TEXT,
//       total_spent REAL DEFAULT 0,
//       total_due REAL DEFAULT 0,
//       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//     );

//   `);

//   const tableCount = db
//     .prepare("SELECT COUNT(*) as count FROM restaurant_tables")
//     .get();

//   if (tableCount.count === 0) {
//     const stmt = db.prepare(`
//     INSERT INTO restaurant_tables (name, status)
//     VALUES (?, ?)
//   `);

//     for (let i = 1; i <= 10; i++) {
//       stmt.run(`Table ${i}`, "available");
//     }
//   }

//   try {
//     db.exec(`ALTER TABLE app_session ADD COLUMN user_id INTEGER`);
//     db.exec(`ALTER TABLE orders ADD COLUMN total_amount REAL DEFAULT 0`);
//     db.exec(`ALTER TABLE orders ADD COLUMN table_name TEXT`);
//     db.exec(`ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending'`);
//   } catch (e) {}

//   try {
//     db.exec(`ALTER TABLE app_session ADD COLUMN username TEXT`);
//   } catch (e) {}

//   try {
//     db.exec(`ALTER TABLE app_session ADD COLUMN role TEXT`);
//   } catch (e) {}
// }

export function runInitMigration(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'cashier',
      full_name TEXT,
      is_active INTEGER DEFAULT 1,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS app_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_data TEXT,
      user_id INTEGER,
      username TEXT,
      role TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      image TEXT,
      barcode TEXT,
      is_available INTEGER DEFAULT 1,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      table_id INTEGER,
      table_name TEXT,

      customer_id INTEGER,
      customer_name TEXT,

      payment_method TEXT DEFAULT 'cash', -- cash | online

      subtotal REAL DEFAULT 0,
      discount_type TEXT,                -- percent | fixed
      discount_value REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,

      service_charges REAL DEFAULT 0,
      kpra_percentage REAL DEFAULT 0,
      kpra_tax REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,

      paid_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,

      payment_status TEXT DEFAULT 'unpaid', -- unpaid | partial | paid
      status TEXT DEFAULT 'pending',         -- pending | completed | cancelled
      order_type TEXT DEFAULT 'dine_in',

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      item_id INTEGER,
      item_name TEXT,
      qty INTEGER,
      price REAL,
      total REAL,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS restaurant_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'available'
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      address TEXT,
      total_spent REAL DEFAULT 0,
      total_due REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  order_id INTEGER NOT NULL,
  table_id INTEGER,
  table_name TEXT,
  customer_id INTEGER,
  customer_name TEXT,
  payment_method TEXT DEFAULT 'cash',
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  kpra_tax DECIMAL(10,2) DEFAULT 0,
  kpra_percentage DECIMAL(5,2) DEFAULT 0,
  service_charges DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'paid', -- 'paid', 'cancelled'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

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

  // Seed Default Tables
  const tableCount = db
    .prepare("SELECT COUNT(*) as count FROM restaurant_tables")
    .get();

  if (tableCount.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO restaurant_tables (name, status)
      VALUES (?, ?)
    `);

    for (let i = 1; i <= 10; i++) {
      stmt.run(`Table ${i}`, "available");
    }
  }

  // Safe Alter Statements for Existing Databases
  const safeAddColumn = (table, column, typeDef) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`);
    } catch (e) {
      // Column already exists
    }
  };

  safeAddColumn("app_session", "user_id", "INTEGER");
  safeAddColumn("app_session", "username", "TEXT");
  safeAddColumn("app_session", "role", "TEXT");

  safeAddColumn("orders", "total_amount", "REAL DEFAULT 0");
  safeAddColumn("orders", "table_name", "TEXT");
  safeAddColumn("orders", "status", "TEXT DEFAULT 'pending'");
  safeAddColumn("orders", "payment_method", "TEXT DEFAULT 'cash'");
  safeAddColumn("orders", "service_charges", "REAL DEFAULT 0");
  safeAddColumn("orders", "kpra_percentage", "REAL DEFAULT 0");
  safeAddColumn("orders", "kpra_tax", "REAL DEFAULT 0");
  safeAddColumn("orders", "discount_amount", "REAL DEFAULT 0");
}
